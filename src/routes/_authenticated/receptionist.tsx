import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBusinessId } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoursEditor, type Hours } from "@/components/hours-editor";

export const Route = createFileRoute("/_authenticated/receptionist")({
  head: () => ({ meta: [{ title: "AI Receptionist — Receptly" }, { name: "description", content: "Configure your AI receptionist." }] }),
  component: ReceptionistPage,
});

const LANGUAGES = ["English", "Spanish", "French", "German", "Arabic", "Urdu", "Hindi", "Portuguese"];
type Settings = Tables<"receptionist_settings">;

function ReceptionistPage() {
  const bid = useBusinessId();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["receptionist", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("receptionist_settings").select("*").eq("business_id", bid!).single();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);

  if (q.isLoading || !form) return <LoadingRows rows={8} />;
  if (q.error) return <ErrorState error={q.error} />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });

  async function save() {
    if (!form) return;
    if (!form.receptionist_name.trim()) return toast.error("Receptionist name is required");
    if (!form.greeting.trim()) return toast.error("Greeting message is required");
    if (form.languages.length === 0) return toast.error("Select at least one language");
    setSaving(true);
    const { id, business_id, created_at, updated_at, ...rest } = form;
    const { error } = await supabase.from("receptionist_settings").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuration saved");
    qc.invalidateQueries({ queryKey: ["receptionist"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div>
      <PageHeader
        title="AI Receptionist"
        description="Configure how your future AI receptionist will greet and help callers."
        actions={<Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-card">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="font-medium">Receptionist enabled</div>
                <p className="text-sm text-muted-foreground">
                  Saves the on/off setting only. No phone line is connected yet, so no real calls are answered.
                </p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Identity & greeting</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Receptionist name</Label>
                <Input value={form.receptionist_name} maxLength={60} onChange={(e) => set("receptionist_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Greeting message</Label>
                <Textarea value={form.greeting} maxLength={500} onChange={(e) => set("greeting", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Business description</Label>
                <Textarea value={form.business_description ?? ""} maxLength={2000} onChange={(e) => set("business_description", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Supported languages</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LANGUAGES.map((l) => (
                    <label key={l} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.languages.includes(l)}
                        onCheckedChange={(c) =>
                          set("languages", c ? [...form.languages, l] : form.languages.filter((x) => x !== l))
                        }
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Hours & after-hours</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <HoursEditor value={form.opening_hours as Hours} onChange={(h) => set("opening_hours", h)} />
              <div className="space-y-1.5">
                <Label>After-hours behavior</Label>
                <Select value={form.after_hours_behavior} onValueChange={(v) => set("after_hours_behavior", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="take_message">Take a message</SelectItem>
                    <SelectItem value="book_only">Offer booking only</SelectItem>
                    <SelectItem value="inform_closed">Inform caller we are closed</SelectItem>
                    <SelectItem value="forward">Forward to on-call staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Behavior & handoff</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Instructions for answering customers</Label>
                <Textarea rows={4} value={form.instructions ?? ""} maxLength={4000} placeholder="Be friendly and concise. Always confirm the caller's name and phone number." onChange={(e) => set("instructions", e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow transfer to a human</Label>
                <Switch checked={form.handoff_enabled} onCheckedChange={(v) => set("handoff_enabled", v)} />
              </div>
              {form.handoff_enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Handoff phone number</Label>
                    <Input value={form.handoff_phone ?? ""} onChange={(e) => set("handoff_phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>When to transfer</Label>
                    <Input value={form.handoff_trigger ?? ""} onChange={(e) => set("handoff_trigger", e.target.value)} />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Fallback message (when the AI can't answer)</Label>
                <Textarea value={form.fallback_message} maxLength={500} onChange={(e) => set("fallback_message", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="sticky top-20 shadow-card">
            <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
                <div className="rounded-lg rounded-tl-none bg-accent p-3 text-accent-foreground">
                  <div className="mb-1 text-xs font-semibold">{form.receptionist_name}</div>
                  {form.greeting}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Instructions</div>
                <p className="mt-1 whitespace-pre-wrap">{form.instructions || "No instructions yet."}</p>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Fallback</div>
                <p className="mt-1">{form.fallback_message}</p>
              </div>
              <div className="text-xs text-muted-foreground">Languages: {form.languages.join(", ")}</div>
              <div className="flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" /> This is a text preview. Voice calling is not connected yet.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
