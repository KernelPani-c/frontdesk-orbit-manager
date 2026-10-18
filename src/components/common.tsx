// Small reusable UI building blocks used across all dashboard pages.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SampleBadge() {
  return (
    <Badge variant="sample" title="Sample data created for demonstration">
      Sample
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="rounded-md bg-accent p-1.5 text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 text-2xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      Something went wrong: {error instanceof Error ? error.message : "Unknown error"}
    </div>
  );
}

/** Wraps any trigger (e.g. a delete button) with a confirmation dialog. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const appointmentVariant = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "muted",
} as const;

export function AppointmentStatusBadge({ status }: { status: keyof typeof appointmentVariant }) {
  return (
    <Badge variant={appointmentVariant[status]} className="capitalize">
      {status}
    </Badge>
  );
}

const outcomeVariant = {
  answered: "info",
  booked: "success",
  transferred: "warning",
  missed: "danger",
  voicemail: "muted",
} as const;

export function CallOutcomeBadge({ outcome }: { outcome: keyof typeof outcomeVariant }) {
  return (
    <Badge variant={outcomeVariant[outcome]} className="capitalize">
      {outcome}
    </Badge>
  );
}
