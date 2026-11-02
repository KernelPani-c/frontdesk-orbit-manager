import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, List, Check, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { useBusinessId, formatDateTime } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, ConfirmDialog, SampleBadge, AppointmentStatusBadge, Field } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({ meta: [{ title: "Appointments — Receptly" }, { name: "description", content: "Manage bookings in calendar or list view." }] }),
  component: AppointmentsPage,
});

type Status = Enums<"appointment_status">;
type Appt = Tables<"appointments"> & { customers: { full_name: string; phone: string; email: string | null } | null; services: { name: string } | null };

function AppointmentsPage() {
  const bid = useBusinessId();
  const qc = useQueryClient();
  const [view, setView] = useState("list");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Partial<Appt> | null>(null);

  const q = useQuery({
    queryKey: ["appointments", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, customers(full_name, phone, email), services(name)")
        .eq("business_id", bid!)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data as Appt[];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  async function setApptStatus(a: Appt, s: Status) {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(`Appointment ${s}`);
    refresh();
  }
  async function remove(a: Appt) {
    const { error } = await supabase.from("appointments").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Appointment deleted");
    refresh();
  }

  const rows = (q.data ?? []).filter((a) => status === "all" || a.status === status);

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Bookings are checked for overlapping times automatically."
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New appointment</Button>}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list"><List className="mr-1 h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="mr-1 h-4 w-4" /> Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : view === "calendar" ? (
        <CalendarView appts={rows} onSelect={setEditing} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments" description="Create your first booking." />
      ) : (
        <Card className="shadow-card">
          <CardContent className="divide-y p-0">
            {rows.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {a.customers?.full_name} <AppointmentStatusBadge status={a.status} /> {a.is_sample && <SampleBadge />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.services?.name ?? "No service"} · {formatDateTime(a.starts_at)} · {a.customers?.phone}
                    {a.customers?.email && ` · ${a.customers.email}`}
                  </div>
                  {a.notes && <div className="mt-1 text-xs text-muted-foreground">Note: {a.notes}</div>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.status === "pending" && <Button size="sm" variant="outline" onClick={() => setApptStatus(a, "confirmed")}><Check className="h-4 w-4" /> Confirm</Button>}
                  {a.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setApptStatus(a, "completed")}><Check className="h-4 w-4" /> Complete</Button>
                      <ConfirmDialog title="Mark as no-show?" description="The customer did not arrive for this appointment." confirmLabel="Mark no-show"
                        onConfirm={() => setApptStatus(a, "no_show")}
                        trigger={<Button size="sm" variant="outline">No-show</Button>} />
                    </>
                  )}
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <ConfirmDialog title="Cancel appointment?" description="The customer's slot will be released." confirmLabel="Cancel appointment"
                      onConfirm={() => setApptStatus(a, "cancelled")}
                      trigger={<Button size="sm" variant="outline"><X className="h-4 w-4" /> Cancel</Button>} />
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setEditing(a)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDialog title="Delete appointment?" description="This cannot be undone." onConfirm={() => remove(a)}
                    trigger={<Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {editing && bid && <AppointmentDialog appt={editing} businessId={bid} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}

function CalendarView({ appts, onSelect }: { appts: Appt[]; onSelect: (a: Appt) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const start = new Date(month);
  start.setDate(1 - ((month.getDay() + 6) % 7)); // start grid on Monday
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const today = key(new Date());
  const shift = (n: number) => { const d = new Date(month); d.setMonth(d.getMonth() + n); setMonth(d); };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-muted p-2 font-medium text-muted-foreground">{d}</div>)}
          {cells.map((d) => {
            const items = appts.filter((a) => key(new Date(a.starts_at)) === key(d));
            return (
              <div key={d.toISOString()} className={cn("min-h-20 bg-card p-1.5 sm:min-h-24", d.getMonth() !== month.getMonth() && "bg-muted/40 text-muted-foreground")}>
                <div className={cn("mb-1 inline-grid h-5 w-5 place-items-center rounded-full", key(d) === today && "bg-primary text-primary-foreground")}>{d.getDate()}</div>
                {items.map((a) => (
                  <button key={a.id} onClick={() => onSelect(a)} className={cn("mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left", a.status === "cancelled" ? "bg-muted text-muted-foreground line-through" : "bg-accent text-accent-foreground")}>
                    {new Date(a.starts_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} {a.customers?.full_name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function toLocalInput(iso?: string) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

function AppointmentDialog({ appt, businessId, onClose, onSaved }: { appt: Partial<Appt>; businessId: string; onClose: () => void; onSaved: () => void }) {
  const opts = useQuery({
    queryKey: ["appt-options", businessId],
    queryFn: async () => {
      const [c, s, b] = await Promise.all([
        supabase.from("customers").select("id, full_name").eq("business_id", businessId).order("full_name"),
        supabase.from("services").select("id, name, duration_minutes, is_active").eq("business_id", businessId).order("name"),
        supabase.from("businesses").select("appointment_buffer_minutes").eq("id", businessId).maybeSingle(),
      ]);
      return { customers: c.data ?? [], services: s.data ?? [], buffer: b.data?.appointment_buffer_minutes ?? 0 };
    },
  });
  const initial = toLocalInput(appt.starts_at);
  const [form, setForm] = useState({
    customer_id: appt.customer_id ?? "",
    service_id: appt.service_id ?? "",
    date: initial.date,
    time: initial.time,
    status: (appt.status ?? "pending") as Status,
    notes: appt.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.customer_id) errs.customer_id = "Select a customer";
    if (!form.service_id) errs.service_id = "Select a service";
    if (!form.date) errs.date = "Pick a date";
    if (!form.time) errs.time = "Pick a time";
    const start = new Date(`${form.date}T${form.time}`);
    if (!errs.date && !errs.time && !appt.id && start < new Date()) errs.date = "Appointment can't be in the past";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const service = opts.data?.services.find((s) => s.id === form.service_id);
    // Buffer time (set in Business Settings) is reserved after the appointment before the next one can start.
    const end = new Date(start.getTime() + ((service?.duration_minutes ?? 30) + (opts.data?.buffer ?? 0)) * 60000);
    const payload = {
      customer_id: form.customer_id,
      service_id: form.service_id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: form.status,
      notes: form.notes || null,
    };
    setSaving(true);
    const { error } = appt.id
      ? await supabase.from("appointments").update(payload).eq("id", appt.id)
      : await supabase.from("appointments").insert({ ...payload, business_id: businessId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(appt.id ? "Appointment updated" : "Appointment created");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{appt.id ? "Edit appointment" : "New appointment"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Customer" error={errors.customer_id}>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{opts.data?.customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Service" error={errors.service_id}>
            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {opts.data?.services.filter((s) => s.is_active || s.id === form.service_id).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" error={errors.date}><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Time" error={errors.time}><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Internal notes"><Textarea value={form.notes} maxLength={2000} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
