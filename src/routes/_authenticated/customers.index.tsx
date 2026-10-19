import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, Users, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessId, formatDate } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, SampleBadge, Field } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({ meta: [{ title: "Customers — Receptly" }, { name: "description", content: "Your customer directory." }] }),
  component: CustomersPage,
});

export const customerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(5, "Enter a valid phone number").max(30).regex(/^[+\d\s()-]+$/, "Only digits, spaces, + ( ) -"),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  notes: z.string().max(2000),
});

function CustomersPage() {
  const bid = useBusinessId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["customers", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*, appointments(count)").eq("business_id", bid!);
      if (error) throw error;
      return data;
    },
  });

  const rows = (q.data ?? [])
    .filter((c) => {
      const s = search.toLowerCase();
      return c.full_name.toLowerCase().includes(s) || c.phone.includes(s) || (c.email ?? "").toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sort === "recent") return (b.last_interaction_at ?? "").localeCompare(a.last_interaction_at ?? "");
      if (sort === "appointments") return (b.appointments[0]?.count ?? 0) - (a.appointments[0]?.count ?? 0);
      return a.full_name.localeCompare(b.full_name);
    });

  return (
    <div>
      <PageHeader title="Customers" description="Only members of your business can see these records." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add customer</Button>} />
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, phone or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-52"><ArrowUpDown className="h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="recent">Last interaction</SelectItem>
                <SelectItem value="appointments">Most appointments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : rows.length === 0 ? (
            <EmptyState icon={Users} title="No customers found" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Last interaction</TableHead>
                    <TableHead className="text-right">Appointments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-2 font-medium text-primary hover:underline">
                          {c.full_name} {c.is_sample && <SampleBadge />}
                        </Link>
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.email || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.last_interaction_at ? formatDate(c.last_interaction_at) : "—"}</TableCell>
                      <TableCell className="text-right">{c.appointments[0]?.count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {open && bid && <NewCustomerDialog businessId={bid} onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["customers"] })} />}
    </div>
  );
}

function NewCustomerDialog({ businessId, onClose, onSaved }: { businessId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = customerSchema.safeParse(form);
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
    const { error } = await supabase.from("customers").insert({ ...parsed.data, email: parsed.data.email || null, business_id: businessId });
    if (error) return toast.error(error.message);
    toast.success("Customer added");
    onSaved();
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add customer</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" error={errors.full_name}><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Phone" error={errors.phone}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email (optional)" error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Notes" error={errors.notes}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
