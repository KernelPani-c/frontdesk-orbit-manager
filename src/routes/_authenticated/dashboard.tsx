import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PhoneCall, Bot, CalendarCheck, PhoneForwarded, PhoneMissed } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessId, formatDateTime, formatDuration } from "@/lib/business";
import { PageHeader, StatCard, LoadingRows, ErrorState, CallOutcomeBadge, AppointmentStatusBadge, SampleBadge, EmptyState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview — Receptly" }, { name: "description", content: "Your AI receptionist at a glance." }] }),
  component: Dashboard,
});

/** Groups records by day for the last 14 days. */
function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function Dashboard() {
  const bid = useBusinessId();
  const q = useQuery({
    queryKey: ["dashboard", bid],
    enabled: !!bid,
    queryFn: async () => {
      const [calls, appts, settings] = await Promise.all([
        supabase.from("call_logs").select("*").eq("business_id", bid!).order("started_at", { ascending: false }),
        supabase.from("appointments").select("*, customers(full_name), services(name)").eq("business_id", bid!).order("starts_at"),
        supabase.from("receptionist_settings").select("enabled, receptionist_name").eq("business_id", bid!).maybeSingle(),
      ]);
      if (calls.error) throw calls.error;
      if (appts.error) throw appts.error;
      return { calls: calls.data, appts: appts.data, settings: settings.data };
    },
  });

  if (q.isLoading || !bid) return <LoadingRows rows={8} />;
  if (q.error) return <ErrorState error={q.error} />;
  const { calls, appts, settings } = q.data!;

  // All numbers below are calculated from stored records.
  const aiCalls = calls.filter((c) => c.handled_by === "ai").length;
  const transferred = calls.filter((c) => c.outcome === "transferred").length;
  const missed = calls.filter((c) => c.outcome === "missed").length;
  const booked = appts.filter((a) => a.status !== "cancelled" && a.status !== "no_show").length;
  const hasSample = calls.some((c) => c.is_sample) || appts.some((a) => a.is_sample);

  const days = lastDays(14);
  const volume = days.map((d) => ({
    day: d.slice(5),
    calls: calls.filter((c) => c.started_at.slice(0, 10) === d).length,
  }));
  const bookings = days.map((d) => ({
    day: d.slice(5),
    bookings: appts.filter((a) => a.created_at.slice(0, 10) === d || a.starts_at.slice(0, 10) === d).length,
  }));
  const split = [
    { name: "AI handled", value: aiCalls },
    { name: "Transferred", value: transferred },
  ];
  const upcoming = appts.filter((a) => new Date(a.starts_at) > new Date() && a.status !== "cancelled" && a.status !== "no_show").slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Metrics calculated from the records stored in your account."
        actions={
          <Badge variant={settings?.enabled ? "success" : "muted"} className="h-8 px-3">
            <Bot className="mr-1 h-3.5 w-3.5" />
            {settings?.receptionist_name ?? "Receptionist"}: {settings?.enabled ? "Enabled (not live)" : "Disabled"}
          </Badge>
        }
      />
      {hasSample && (
        <div className="mb-6 rounded-lg border border-dashed border-warning bg-warning/10 p-3 text-sm text-warning-foreground">
          These figures include <strong>sample records</strong> for demonstration — they are not real business activity.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total calls" value={calls.length} icon={PhoneCall} />
        <StatCard label="Answered by AI" value={aiCalls} icon={Bot} />
        <StatCard label="Appointments booked" value={booked} icon={CalendarCheck} />
        <StatCard label="Transferred to humans" value={transferred} icon={PhoneForwarded} />
        <StatCard label="Unanswered" value={missed} icon={PhoneMissed} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Call volume (14 days)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">AI vs human-transferred</CardTitle></CardHeader>
          <CardContent className="h-64">
            {aiCalls + transferred === 0 ? (
              <EmptyState title="No calls yet" />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={split} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                    <Cell fill="var(--chart-1)" />
                    <Cell fill="var(--chart-4)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Appointment trend (14 days)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={bookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="bookings" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent calls</CardTitle>
            <Link to="/calls" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {calls.length === 0 && <EmptyState title="No calls recorded" />}
            {calls.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-b pb-3 text-sm last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">{c.caller_name ?? "Unknown"} {c.is_sample && <SampleBadge />}</div>
                  <div className="text-xs text-muted-foreground">{c.phone} · {formatDateTime(c.started_at)} · {formatDuration(c.duration_seconds)}</div>
                </div>
                <CallOutcomeBadge outcome={c.outcome} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming appointments</CardTitle>
            <Link to="/appointments" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <EmptyState title="No upcoming appointments" />}
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 border-b pb-3 text-sm last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">{a.customers?.full_name} {a.is_sample && <SampleBadge />}</div>
                  <div className="text-xs text-muted-foreground">{a.services?.name ?? "—"} · {formatDateTime(a.starts_at)}</div>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
