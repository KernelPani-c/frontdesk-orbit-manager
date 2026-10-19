import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBusiness, formatMoney } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, ConfirmDialog, SampleBadge, Field } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "Services & Pricing — Receptly" }, { name: "description", content: "Manage the services your receptionist can explain." }] }),
  component: ServicesPage,
});

type Service = Tables<"services">;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().min(0, "Price can't be negative"),
  duration_minutes: z.coerce.number().int().min(5, "Minimum 5 minutes").max(1440),
  is_active: z.boolean(),
});

function ServicesPage() {
  const { data: biz } = useBusiness();
  const bid = biz?.business.id;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const q = useQuery({
    queryKey: ["services", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("business_id", bid!).order("name");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["services"] });

  async function toggle(s: Service) {
    const { error } = await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(s: Service) {
    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Service deleted");
    refresh();
  }

  const rows = (q.data ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || (filter === "active" ? s.is_active : !s.is_active)),
  );

  return (
    <div>
      <PageHeader
        title="Services & Pricing"
        description="Your AI receptionist will only quote services and prices listed here."
        actions={<Button onClick={() => setEditing({ is_active: true, duration_minutes: 30, price: 0 })}><Plus className="h-4 w-4" /> Add service</Button>}
      />
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search services…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="active">Available</SelectItem>
                <SelectItem value="inactive">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : rows.length === 0 ? (
            <EmptyState icon={Tags} title="No services found" description="Add the services your business offers." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">{s.name} {s.is_sample && <SampleBadge />}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{s.description}</div>
                      </TableCell>
                      <TableCell>{formatMoney(Number(s.price), biz?.business.currency)}</TableCell>
                      <TableCell>{s.duration_minutes} min</TableCell>
                      <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggle(s)} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <ConfirmDialog
                          title="Delete this service?"
                          description={`"${s.name}" will be permanently removed.`}
                          onConfirm={() => remove(s)}
                          trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {editing && bid && (
        <ServiceDialog service={editing} businessId={bid} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function ServiceDialog({ service, businessId, onClose, onSaved }: { service: Partial<Service>; businessId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: service.name ?? "",
    description: service.description ?? "",
    price: String(service.price ?? 0),
    duration_minutes: String(service.duration_minutes ?? 30),
    is_active: service.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setSaving(true);
    const { error } = service.id
      ? await supabase.from("services").update(parsed.data).eq("id", service.id)
      : await supabase.from("services").insert({ ...parsed.data, business_id: businessId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(service.id ? "Service updated" : "Service added");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{service.id ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Service name" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description" error={errors.description}>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price" error={errors.price}>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Duration (minutes)" error={errors.duration_minutes}>
              <Input type="number" min="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Available to book
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
