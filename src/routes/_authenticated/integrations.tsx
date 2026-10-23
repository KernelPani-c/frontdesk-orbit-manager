import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PhoneCall, AudioLines, CalendarDays, Database, Mail, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBusinessId } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, Field } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Receptly" }, { name: "description", content: "Prepare telephony, voice AI and other integrations." }] }),
  component: IntegrationsPage,
});

type Integration = Tables<"integrations">;

// Catalog of integration types. Provider lists prepare for Asterisk/FreePBX, SIP trunks and voice AI APIs.
const CATALOG: Record<string, { title: string; text: string; icon: LucideIcon; providers: string[]; fields: { key: string; label: string }[] }> = {
  telephony: { title: "Telephony / SIP", text: "Route incoming calls to your receptionist.", icon: PhoneCall, providers: ["Asterisk", "FreePBX", "SIP trunk", "Twilio"], fields: [{ key: "sip_host", label: "SIP host / server" }, { key: "phone_number", label: "Phone number" }] },
  voice_ai: { title: "AI voice provider", text: "Speech recognition and voice responses.", icon: AudioLines, providers: ["OpenAI Realtime", "ElevenLabs", "Deepgram", "Other"], fields: [{ key: "voice", label: "Preferred voice" }] },
  calendar: { title: "Calendar & booking", text: "Sync appointments with external calendars.", icon: CalendarDays, providers: ["Google Calendar", "Outlook", "Calendly", "Other"], fields: [{ key: "calendar_id", label: "Calendar ID" }] },
  crm: { title: "CRM / management software", text: "Send customers and bookings to your CRM.", icon: Database, providers: ["HubSpot", "Salesforce", "Zoho", "Other"], fields: [{ key: "account", label: "Account / workspace" }] },
  email: { title: "Email & notifications", text: "Booking confirmations and alerts.", icon: Mail, providers: ["Built-in email", "SMTP", "Other"], fields: [{ key: "from", label: "Sender address" }] },
};

const STATUS = {
  not_connected: { label: "Not Connected", variant: "muted" },
  needs_configuration: { label: "Needs Configuration", variant: "warning" },
  connected: { label: "Connected", variant: "success" },
} as const;

function IntegrationsPage() {
  const bid = useBusinessId();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Integration | null>(null);
  const q = useQuery({
    queryKey: ["integrations", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").eq("business_id", bid!);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Integrations" description="Save connection details now. An integration shows Connected only after it has been genuinely verified." />
      {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CATALOG).map(([kind, meta]) => {
            const row = q.data?.find((r) => r.kind === kind);
            const status = STATUS[row?.status ?? "not_connected"];
            return (
              <Card key={kind} className="shadow-card">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <span className="rounded-lg bg-accent p-2 text-accent-foreground"><meta.icon className="h-5 w-5" /></span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <h3 className="mt-4 font-medium">{meta.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{meta.text}</p>
                  {row?.provider && <p className="mt-2 text-xs text-muted-foreground">Provider: {row.provider}</p>}
                  <Button variant="outline" className="mt-4" disabled={!row} onClick={() => row && setEditing(row)}>Configure</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {editing && <ConfigDialog row={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["integrations"] })} />}
    </div>
  );
}

function ConfigDialog({ row, onClose, onSaved }: { row: Integration; onClose: () => void; onSaved: () => void }) {
  const meta = CATALOG[row.kind]!;
  const [provider, setProvider] = useState(row.provider ?? "");
  const [config, setConfig] = useState<Record<string, string>>((row.config as Record<string, string>) ?? {});

  async function save() {
    if (!provider) return toast.error("Choose a provider");
    // Saving details never marks an integration as connected — verification will happen server-side later.
    const { error } = await supabase.from("integrations").update({ provider, config, status: "needs_configuration" }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Details saved. Status: Needs Configuration");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>Don't enter passwords or API keys here — secret credentials will be stored securely on the server when this integration is built.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Provider">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>{meta.providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {meta.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input value={config[f.key] ?? ""} onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })} />
            </Field>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
