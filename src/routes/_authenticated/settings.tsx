import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness, type Business } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, Field } from "@/components/common";
import { HoursEditor, type Hours } from "@/components/hours-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Business Settings — Receptly" }, { name: "description", content: "Your business profile and policies." }] }),
  component: SettingsPage,
});

type Special = { date: string; label: string; closed: boolean; from?: string; to?: string };
const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Australia/Sydney"];
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "AUD", "CAD"];

function SettingsPage() {
  const q = useBusiness();
  const qc = useQueryClient();
  const [form, setForm] = useState<Business | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (q.data) setForm(q.data.business); }, [q.data]);

  if (q.isLoading || !form) return <LoadingRows rows={8} />;
  if (q.error) return <ErrorState error={q.error} />;
  const canEdit = q.data?.role === "owner" || q.data?.role === "admin";
  const set = <K extends keyof Business>(k: K, v: Business[K]) => setForm({ ...form, [k]: v });
  const special = (form.special_hours as Special[]) ?? [];

  async function save() {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Business name is required");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid business email");
    if (form.handoff_email && !/^\S+@\S+\.\S+$/.test(form.handoff_email)) return toast.error("Invalid handoff email");
    if (form.logo_url && !/^https?:\/\//.test(form.logo_url)) return toast.error("Logo URL must start with http(s)://");
    setSaving(true);
    const { id, created_at, updated_at, ...rest } = form;
    const { error } = await supabase.from("businesses").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["business"] });
  }

  return (
    <div>
      <PageHeader
        title="Business Settings"
        description={canEdit ? "Information your receptionist can share with callers." : "Only owners and admins can edit these settings."}
        actions={canEdit && <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>}
      />
      <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-lg border object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-lg bg-accent text-lg font-semibold text-accent-foreground">{form.name.slice(0, 1)}</div>}
              <div className="flex-1"><Field label="Logo URL"><Input value={form.logo_url ?? ""} placeholder="https://…" onChange={(e) => set("logo_url", e.target.value)} /></Field></div>
            </div>
            <Field label="Business name"><Input value={form.name} maxLength={120} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Description"><Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Contact & locale</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Address"><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
            </div>
            <Field label="Website"><Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Time zone">
                <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Default currency">
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Opening hours</CardTitle></CardHeader>
          <CardContent><HoursEditor value={form.opening_hours as Hours} onChange={(h) => set("opening_hours", h)} /></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Holidays & special hours</CardTitle>
            <Button size="sm" variant="outline" type="button" onClick={() => set("special_hours", [...special, { date: "", label: "", closed: true }])}><Plus className="h-4 w-4" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {special.length === 0 && <p className="text-sm text-muted-foreground">No special dates added.</p>}
            {special.map((s, i) => {
              const update = (patch: Partial<Special>) => set("special_hours", special.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input type="date" className="w-40" value={s.date} onChange={(e) => update({ date: e.target.value })} />
                  <Input className="min-w-32 flex-1" placeholder="e.g. Eid holiday" value={s.label} onChange={(e) => update({ label: e.target.value })} />
                  <Select value={s.closed ? "closed" : "open"} onValueChange={(v) => update({ closed: v === "closed" })}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="closed">Closed</SelectItem><SelectItem value="open">Special</SelectItem></SelectContent>
                  </Select>
                  {!s.closed && (<><Input type="time" className="w-28" value={s.from ?? ""} onChange={(e) => update({ from: e.target.value })} /><Input type="time" className="w-28" value={s.to ?? ""} onChange={(e) => update({ to: e.target.value })} /></>)}
                  <Button size="icon" variant="ghost" type="button" onClick={() => set("special_hours", special.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Appointment policies</CardTitle></CardHeader>
          <CardContent><Textarea rows={5} value={form.appointment_policy ?? ""} placeholder="e.g. Cancel at least 24 hours in advance." onChange={(e) => set("appointment_policy", e.target.value)} /></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Human handoff contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Contact name"><Input value={form.handoff_name ?? ""} onChange={(e) => set("handoff_name", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={form.handoff_phone ?? ""} onChange={(e) => set("handoff_phone", e.target.value)} /></Field>
              <Field label="Email"><Input value={form.handoff_email ?? ""} onChange={(e) => set("handoff_email", e.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>
      </fieldset>
    </div>
  );
}
