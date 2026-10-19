import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, BookOpen, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBusinessId, formatDate } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, ConfirmDialog, SampleBadge, Field } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/faqs")({
  head: () => ({ meta: [{ title: "FAQs & Knowledge Base — Receptly" }, { name: "description", content: "Approved answers for your AI receptionist." }] }),
  component: FaqsPage,
});

type Faq = Tables<"faqs">;
const KIND_LABEL: Record<string, string> = { faq: "FAQ", policy: "Policy", info: "General info" };

const schema = z.object({
  question: z.string().trim().min(1, "Question / title is required").max(500),
  answer: z.string().trim().min(1, "Answer is required").max(5000),
  category: z.string().trim().min(1, "Category is required").max(60),
  kind: z.enum(["faq", "policy", "info"]),
  is_active: z.boolean(),
});

function FaqsPage() {
  const bid = useBusinessId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [kind, setKind] = useState("all");
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);

  const q = useQuery({
    queryKey: ["faqs", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").eq("business_id", bid!).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["faqs"] });
  const categories = Array.from(new Set((q.data ?? []).map((f) => f.category))).sort();

  const rows = (q.data ?? []).filter((f) => {
    const s = search.toLowerCase();
    return (
      (f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s)) &&
      (category === "all" || f.category === category) &&
      (kind === "all" || f.kind === kind)
    );
  });

  async function toggle(f: Faq) {
    const { error } = await supabase.from("faqs").update({ is_active: !f.is_active }).eq("id", f.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(f: Faq) {
    const { error } = await supabase.from("faqs").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Entry deleted");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="FAQs & Knowledge Base"
        description="Questions, policies and general information your receptionist may use."
        actions={<Button onClick={() => setEditing({ kind: "faq", is_active: true, category: "General" })}><Plus className="h-4 w-4" /> Add entry</Button>}
      />
      <div className="mb-6 flex gap-3 rounded-lg border border-primary/20 bg-accent p-4 text-sm text-accent-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p>
          When connected in the future, the AI receptionist must use <strong>only approved, active entries</strong> from
          this knowledge base and must not invent answers. If no answer exists, it will use your fallback message.
        </p>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-4">
          <Tabs value={kind} onValueChange={setKind} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="policy">Policies</TabsTrigger>
              <TabsTrigger value="info">General info</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questions and answers…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : rows.length === 0 ? (
            <EmptyState icon={BookOpen} title="No entries found" description="Add approved answers to common questions." />
          ) : (
            <div className="divide-y">
              {rows.map((f) => (
                <div key={f.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{f.question}</span>
                      <Badge variant="info">{KIND_LABEL[f.kind]}</Badge>
                      <Badge variant="outline">{f.category}</Badge>
                      {!f.is_active && <Badge variant="muted">Inactive</Badge>}
                      {f.is_sample && <SampleBadge />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(f.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={f.is_active} onCheckedChange={() => toggle(f)} aria-label="Active" />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(f)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDialog
                      title="Delete this entry?"
                      description="It will be permanently removed from your knowledge base."
                      onConfirm={() => remove(f)}
                      trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {editing && bid && <FaqDialog faq={editing} businessId={bid} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}

function FaqDialog({ faq, businessId, onClose, onSaved }: { faq: Partial<Faq>; businessId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    question: faq.question ?? "",
    answer: faq.answer ?? "",
    category: faq.category ?? "General",
    kind: (faq.kind ?? "faq") as "faq" | "policy" | "info",
    is_active: faq.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
    setSaving(true);
    const { error } = faq.id
      ? await supabase.from("faqs").update(parsed.data).eq("id", faq.id)
      : await supabase.from("faqs").insert({ ...parsed.data, business_id: businessId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{faq.id ? "Edit entry" : "Add entry"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as typeof form.kind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="policy">Business policy</SelectItem>
                  <SelectItem value="info">General info</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category" error={errors.category}>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
          </div>
          <Field label={form.kind === "faq" ? "Question" : "Title"} error={errors.question}>
            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </Field>
          <Field label="Approved answer" error={errors.answer}>
            <Textarea rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Active
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
