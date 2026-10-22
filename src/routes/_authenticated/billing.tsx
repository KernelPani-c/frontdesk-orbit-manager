import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessId, formatMoney, formatDate } from "@/lib/business";
import { PageHeader, LoadingRows, ErrorState, SampleBadge } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Subscription & Billing — Receptly" }, { name: "description", content: "Your plan and usage." }] }),
  component: BillingPage,
});

type Invoice = { date: string; amount: number; status: string };

function BillingPage() {
  const bid = useBusinessId();
  const q = useQuery({
    queryKey: ["billing", bid],
    enabled: !!bid,
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [sub, calls] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("business_id", bid!).single(),
        supabase.from("call_logs").select("duration_seconds").eq("business_id", bid!).gte("started_at", monthStart.toISOString()),
      ]);
      if (sub.error) throw sub.error;
      const seconds = (calls.data ?? []).reduce((t, c) => t + c.duration_seconds, 0);
      return { sub: sub.data, minutes: Math.ceil(seconds / 60), callCount: calls.data?.length ?? 0 };
    },
  });

  if (q.isLoading || !bid) return <LoadingRows />;
  if (q.error) return <ErrorState error={q.error} />;
  const { sub, minutes, callCount } = q.data!;
  const pct = Math.min(100, Math.round((minutes / sub.included_minutes) * 100));
  const history = (sub.billing_history as Invoice[]) ?? [];
  const notConnected = () => toast.info("Payments aren't connected yet. Plan changes will be available soon.");

  return (
    <div>
      <PageHeader title="Subscription & Billing" description="Demo plan — no payment provider is connected and no charges are made." />
      <div className="mb-6 flex gap-3 rounded-lg border border-dashed border-warning bg-warning/10 p-4 text-sm text-warning-foreground">
        <Info className="h-5 w-5 shrink-0" /> Plan and invoices below are demonstration data.
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Current plan</CardTitle><SampleBadge /></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{sub.plan}</div>
            <div className="mt-1 text-muted-foreground">{formatMoney(Number(sub.monthly_price))} / month</div>
            <div className="mt-6 flex gap-2">
              <Button onClick={notConnected}>Upgrade</Button>
              <Button variant="outline" onClick={notConnected}><CreditCard className="h-4 w-4" /> Manage</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Usage this month</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm"><span>Call minutes used</span><span className="font-medium">{minutes} / {sub.included_minutes}</span></div>
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">{callCount} logged calls this month (calculated from stored call records, including any sample records).</p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 shadow-card">
        <CardHeader><CardTitle className="text-base">Billing history</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}><TableCell>{formatDate(h.date)}</TableCell><TableCell>{formatMoney(h.amount)}</TableCell><TableCell>{h.status}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
