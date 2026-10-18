
create type public.member_role as enum ('owner','admin','staff');
create type public.appointment_status as enum ('pending','confirmed','completed','cancelled');
create type public.call_outcome as enum ('answered','booked','transferred','missed','voicemail');
create type public.integration_status as enum ('not_connected','needs_configuration','connected');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  logo_url text,
  description text,
  address text, phone text, email text, website text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  opening_hours jsonb not null default '{}'::jsonb,
  special_hours jsonb not null default '[]'::jsonb,
  appointment_policy text,
  handoff_name text, handoff_phone text, handoff_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);
grant select on public.business_members to authenticated;
grant all on public.business_members to service_role;
alter table public.business_members enable row level security;

create or replace function public.is_business_member(_bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.business_members where business_id=_bid and user_id=auth.uid())
$$;
create or replace function public.is_business_admin(_bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.business_members where business_id=_bid and user_id=auth.uid() and role in ('owner','admin'))
$$;

create policy "members read business" on public.businesses for select to authenticated using (public.is_business_member(id));
create policy "admins update business" on public.businesses for update to authenticated using (public.is_business_admin(id)) with check (public.is_business_admin(id));
create policy "members read memberships" on public.business_members for select to authenticated using (public.is_business_member(business_id));

-- receptionist settings
create table public.receptionist_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  receptionist_name text not null default 'Ava',
  greeting text not null default 'Hello, thanks for calling! How can I help you today?',
  business_description text,
  languages text[] not null default array['English'],
  opening_hours jsonb not null default '{}'::jsonb,
  after_hours_behavior text not null default 'take_message',
  instructions text,
  enabled boolean not null default false,
  handoff_enabled boolean not null default true,
  handoff_phone text,
  handoff_trigger text default 'Caller asks for a human or the AI cannot help',
  fallback_message text not null default 'I''m not sure about that. Let me take your details and a team member will get back to you.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  duration_minutes int not null default 30 check (duration_minutes between 5 and 1440),
  is_active boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- faqs / knowledge base (kind: faq | policy | info). Ready for future embeddings/retrieval.
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null default 'faq' check (kind in ('faq','policy','info')),
  question text not null check (char_length(question) between 1 and 500),
  answer text not null check (char_length(answer) between 1 and 5000),
  category text not null default 'General',
  is_active boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null,
  email text,
  notes text,
  last_interaction_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  source text not null default 'dashboard' check (source in ('dashboard','ai_agent','api')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.appointments (business_id, starts_at);

-- prevent overlapping active appointments within a business
create or replace function public.validate_appointment() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status in ('pending','confirmed') and exists (
    select 1 from public.appointments a
    where a.business_id = new.business_id and a.id <> new.id
      and a.status in ('pending','confirmed')
      and a.starts_at < new.ends_at and a.ends_at > new.starts_at
  ) then
    raise exception 'This time slot overlaps with another appointment';
  end if;
  return new;
end $$;
create trigger appointments_validate before insert or update on public.appointments for each row execute function public.validate_appointment();

create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  caller_name text,
  phone text not null,
  started_at timestamptz not null default now(),
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  outcome public.call_outcome not null,
  handled_by text not null default 'ai' check (handled_by in ('ai','human','none')),
  summary text,
  transcript text,
  recording_url text,
  external_call_id text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.call_logs (business_id, started_at desc);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('telephony','voice_ai','calendar','crm','email')),
  provider text,
  config jsonb not null default '{}'::jsonb,
  status public.integration_status not null default 'not_connected',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, kind)
);
-- "connected" can only be set by the server after real verification
create or replace function public.guard_integration_status() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'connected' and current_user = 'authenticated' then
    raise exception 'Integrations can only be marked connected after server verification';
  end if;
  return new;
end $$;
create trigger integrations_guard before insert or update on public.integrations for each row execute function public.guard_integration_status();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  plan text not null default 'Starter (demo)',
  monthly_price numeric(10,2) not null default 49,
  included_minutes int not null default 500,
  status text not null default 'demo',
  billing_history jsonb not null default '[]'::jsonb,
  is_sample boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- grants, RLS, policies, triggers for business-scoped tables
do $$
declare t text;
begin
  foreach t in array array['receptionist_settings','services','faqs','customers','appointments','call_logs','integrations','subscriptions'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members select" on public.%I for select to authenticated using (public.is_business_member(business_id))', t);
    execute format('create policy "members insert" on public.%I for insert to authenticated with check (public.is_business_member(business_id))', t);
    execute format('create policy "members update" on public.%I for update to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_business_admin(business_id))', t);
  end loop;
  foreach t in array array['businesses','receptionist_settings','services','faqs','customers','appointments','integrations','subscriptions'] loop
    execute format('create trigger touch_%I before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- sample data seeding (clearly flagged is_sample)
create or replace function public.seed_sample_data(_bid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; a1 uuid; a2 uuid; d date := current_date;
begin
  insert into services(business_id,name,description,price,duration_minutes,is_sample) values
    (_bid,'Initial Consultation','First visit to assess needs and plan treatment.',60,30,true) returning id into s1;
  insert into services(business_id,name,description,price,duration_minutes,is_sample) values
    (_bid,'Standard Session','Regular 60-minute appointment.',95,60,true) returning id into s2;
  insert into services(business_id,name,description,price,duration_minutes,is_sample) values
    (_bid,'Follow-up Visit','Short check-in after a previous session.',45,20,true) returning id into s3;

  insert into faqs(business_id,kind,question,answer,category,is_sample) values
    (_bid,'faq','What are your opening hours?','We are open Monday to Friday, 9:00 to 17:00.','Hours',true),
    (_bid,'faq','Where can I park?','Free parking is available behind the building.','Location',true),
    (_bid,'policy','Cancellation policy','Please cancel at least 24 hours in advance to avoid a fee.','Policies',true),
    (_bid,'info','Payment methods','We accept cash, card and bank transfer.','Billing',true);

  insert into customers(business_id,full_name,phone,email,notes,last_interaction_at,is_sample) values
    (_bid,'Emma Johnson','+1 555 0101','emma@example.com','Prefers morning slots.',now()-interval '1 day',true) returning id into c1;
  insert into customers(business_id,full_name,phone,email,last_interaction_at,is_sample) values
    (_bid,'Liam Smith','+1 555 0102','liam@example.com',now()-interval '2 days',true) returning id into c2;
  insert into customers(business_id,full_name,phone,last_interaction_at,is_sample) values
    (_bid,'Olivia Brown','+1 555 0103',now()-interval '4 days',true) returning id into c3;
  insert into customers(business_id,full_name,phone,email,last_interaction_at,is_sample) values
    (_bid,'Noah Davis','+1 555 0104','noah@example.com',now()-interval '6 days',true) returning id into c4;

  insert into appointments(business_id,customer_id,service_id,starts_at,ends_at,status,is_sample) values
    (_bid,c1,s2,(d+1)+time '10:00',(d+1)+time '11:00','confirmed',true) returning id into a1;
  insert into appointments(business_id,customer_id,service_id,starts_at,ends_at,status,is_sample) values
    (_bid,c2,s1,(d+2)+time '14:00',(d+2)+time '14:30','pending',true) returning id into a2;
  insert into appointments(business_id,customer_id,service_id,starts_at,ends_at,status,is_sample) values
    (_bid,c3,s3,(d-3)+time '09:00',(d-3)+time '09:20','completed',true),
    (_bid,c4,s2,(d-8)+time '11:00',(d-8)+time '12:00','completed',true),
    (_bid,c1,s1,(d-12)+time '15:00',(d-12)+time '15:30','cancelled',true);

  insert into call_logs(business_id,customer_id,appointment_id,caller_name,phone,started_at,duration_seconds,outcome,handled_by,summary,is_sample) values
    (_bid,c1,a1,'Emma Johnson','+1 555 0101',now()-interval '1 day',184,'booked','ai','Booked a standard session for tomorrow 10:00.',true),
    (_bid,c2,a2,'Liam Smith','+1 555 0102',now()-interval '2 days',240,'booked','ai','Asked about consultation price and booked.',true),
    (_bid,c3,null,'Olivia Brown','+1 555 0103',now()-interval '4 days',95,'answered','ai','Asked about parking options.',true),
    (_bid,c4,null,'Noah Davis','+1 555 0104',now()-interval '6 days',310,'transferred','human','Billing question, transferred to staff.',true),
    (_bid,null,null,null,'+1 555 0199',now()-interval '7 days',0,'missed','none','Missed call, no voicemail.',true),
    (_bid,null,null,'Unknown caller','+1 555 0188',now()-interval '10 days',60,'answered','ai','Asked for opening hours.',true),
    (_bid,c1,null,'Emma Johnson','+1 555 0101',now()-interval '12 days',150,'transferred','human','Requested to speak with a person.',true);
end $$;

-- on signup: create business, membership, defaults, and sample data
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  insert into businesses(name, email) values (coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Business'), new.email) returning id into bid;
  insert into business_members(business_id,user_id,role) values (bid,new.id,'owner');
  insert into receptionist_settings(business_id) values (bid);
  insert into subscriptions(business_id, billing_history) values (bid,
    '[{"date":"2026-09-01","amount":49,"status":"Paid (demo)"},{"date":"2026-08-01","amount":49,"status":"Paid (demo)"}]'::jsonb);
  insert into integrations(business_id,kind) values (bid,'telephony'),(bid,'voice_ai'),(bid,'calendar'),(bid,'crm'),(bid,'email');
  perform seed_sample_data(bid);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke execute on function public.seed_sample_data(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
