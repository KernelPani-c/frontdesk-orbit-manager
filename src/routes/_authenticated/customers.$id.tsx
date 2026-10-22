import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatDuration } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, ConfirmDialog, SampleBadge, AppointmentStatusBadge, CallOutcomeBadge, Field } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({ meta: [{ title: "Customer — Receptly" }, { name: "description", content: "Customer details and history." }] }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, appointments(*, services(name)), call_logs(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", notes: "" });
  useEffect(() => {
    if (q.data) setForm({ full_name: q.data.full_name, phone: q.data.phone, email: q.data.email ?? "", notes: q.data.notes ?? "" });
  }, [q.data]);

  if (q.isLoading) return <LoadingRows />;
  if (q.error) return <ErrorState error={q.error} />;
  if (!q.data) return <EmptyState title="Customer not found" action={<Link to="/customers" className="text-primary">Back to customers</Link>} />;
  const c = q.data;

  async function save() {
    if (!form.full_name.trim() || form.phone.trim().length < 5) return toast.error("Name and a valid phone are required");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid email");
    const { error } = await supabase.from("customers").update({ ...form, email: form.email || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Customer updated");
    qc.invalidateQueries({ queryKey: ["customer", id] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  }
  async function remove() {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Customer deleted");
    qc.invalidateQueries({ queryKey: ["customers"] });
    navigate({ to: "/customers" });
  }

  const appts = [...c.appointments].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const calls = [...c.call_logs].sort((a, b) => b.started_at.localeCompare(a.started_at));

  return (
    <div>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Customers</Link>
      <PageHeader
        title={c.full_name}
        description={`${appts.length} appointments · ${calls.length} calls`}
        actions={
          <>
            {c.is_sample && <SampleBadge />}
            <ConfirmDialog title="Delete customer?" description="This also deletes their appointments." onConfirm={remove}
              trigger={<Button variant="outline"><Trash2 className="h-4 w-4 text-destructive" /> Delete</Button>} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <Button onClick={save} className="w-full">Save</Button>
          </CardContent>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Appointment history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {appts.length === 0 && <EmptyState title="No appointments" />}
              {appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0">
                  <div><div className="font-medium">{a.services?.name ?? "—"}</div><div className="text-xs text-muted-foreground">{formatDateTime(a.starts_at)}</div></div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Calls</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {calls.length === 0 && <EmptyState title="No calls" />}
              {calls.map((l) => (
                <div key={l.id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0">
                  <div><div>{l.summary}</div><div className="text-xs text-muted-foreground">{formatDateTime(l.started_at)} · {formatDuration(l.duration_seconds)}</div></div>
                  <CallOutcomeBadge outcome={l.outcome} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
