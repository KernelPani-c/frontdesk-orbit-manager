// Simple weekly opening-hours editor. Stored as JSON: { mon: { open: true, from: "09:00", to: "17:00" }, ... }
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const LABELS: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export type DayHours = { open: boolean; from: string; to: string };
export type Hours = Partial<Record<(typeof DAYS)[number], DayHours>>;

const defaultDay = (d: string): DayHours => ({ open: !["sat", "sun"].includes(d), from: "09:00", to: "17:00" });

export function HoursEditor({ value, onChange }: { value: Hours | null; onChange: (h: Hours) => void }) {
  const hours = value ?? {};
  return (
    <div className="space-y-2">
      {DAYS.map((d) => {
        const h = hours[d] ?? defaultDay(d);
        const update = (patch: Partial<DayHours>) => onChange({ ...hours, [d]: { ...h, ...patch } });
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 text-sm">
            <span className="w-24">{LABELS[d]}</span>
            <Switch checked={h.open} onCheckedChange={(open) => update({ open })} />
            {h.open ? (
              <>
                <Input type="time" className="w-28" value={h.from} onChange={(e) => update({ from: e.target.value })} />
                <span className="text-muted-foreground">to</span>
                <Input type="time" className="w-28" value={h.to} onChange={(e) => update({ to: e.target.value })} />
                {h.from >= h.to && <span className="text-xs text-destructive">End must be after start</span>}
              </>
            ) : (
              <span className="text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
