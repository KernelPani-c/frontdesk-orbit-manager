import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, PhoneCall, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBusinessId, formatDateTime, formatDuration } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, EmptyState, SampleBadge, CallOutcomeBadge } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/calls")({
  head: () => ({ meta: [{ title: "Call History — Receptly" }, { name: "description", content: "Logged calls handled by your receptionist." }] }),
  component: CallsPage,
});

type Call = Tables<"call_logs"> & { appointments: { starts_at: string } | null };

function CallsPage() {
  const bid = useBusinessId();
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Call | null>(null);

  const q = useQuery({
    queryKey: ["calls", bid],
    enabled: !!bid,
    queryFn: async () => {
      const { data, error } = await supabase.from("call_logs").select("*, appointments(starts_at)").eq("business_id", bid!).order("started_at", { ascending: false });
      if (error) throw error;
      return data as Call[];
    },
  });

  const rows = (q.data ?? []).filter((c) => {
    const s = search.toLowerCase();
    const day = c.started_at.slice(0, 10);
    return (
      ((c.caller_name ?? "").toLowerCase().includes(s) || c.phone.includes(s) || (c.summary ?? "").toLowerCase().includes(s)) &&
      (outcome === "all" || c.outcome === outcome) &&
      (!from || day >= from) &&
      (!to || day <= to)
    );
  });

  return (
    <div>
      <PageHeader title="Call History" description="Call logs will appear here automatically once a phone line is connected." />
      <div className="mb-6 flex gap-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="h-5 w-5 shrink-0" /> Telephony is not connected yet. Records marked “Sample” are demonstration data — no real calls or recordings exist.
      </div>
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search caller, phone, summary…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                {["answered", "booked", "transferred", "missed", "voicemail"].map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
          {q.isLoading ? <LoadingRows /> : q.error ? <ErrorState error={q.error} /> : rows.length === 0 ? (
            <EmptyState icon={PhoneCall} title="No calls found" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="hidden md:table-cell">Handled by</TableHead>
                    <TableHead className="hidden lg:table-cell">Summary</TableHead>
                    <TableHead className="hidden md:table-cell">Booking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">{c.caller_name ?? "Unknown"} {c.is_sample && <SampleBadge />}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(c.started_at)}</TableCell>
                      <TableCell>{formatDuration(c.duration_seconds)}</TableCell>
                      <TableCell><CallOutcomeBadge outcome={c.outcome} /></TableCell>
                      <TableCell className="hidden md:table-cell">{handled(c.handled_by)}</TableCell>
                      <TableCell className="hidden max-w-xs truncate lg:table-cell">{c.summary}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.appointment_id ? <Badge variant="success">Yes</Badge> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.caller_name ?? "Unknown caller"}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {selected.is_sample && <SampleBadge />}
                <Row label="Phone" value={selected.phone} />
                <Row label="Date" value={formatDateTime(selected.started_at)} />
                <Row label="Duration" value={formatDuration(selected.duration_seconds)} />
                <Row label="Outcome" value={<CallOutcomeBadge outcome={selected.outcome} />} />
                <Row label="Handled by" value={handled(selected.handled_by)} />
                <Row label="Booking" value={selected.appointments ? formatDateTime(selected.appointments.starts_at) : "None"} />
                <div><div className="text-xs font-medium uppercase text-muted-foreground">Summary</div><p className="mt-1">{selected.summary || "—"}</p></div>
                <div><div className="text-xs font-medium uppercase text-muted-foreground">Transcript</div><p className="mt-1 text-muted-foreground">{selected.transcript || "No transcript available."}</p></div>
                <div><div className="text-xs font-medium uppercase text-muted-foreground">Recording</div><p className="mt-1 text-muted-foreground">{selected.recording_url ? <a className="text-primary" href={selected.recording_url}>Listen</a> : "No recording available."}</p></div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function handled(h: string) {
  return h === "ai" ? "AI" : h === "human" ? "Transferred to human" : "—";
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right">{value}</span></div>;
}
