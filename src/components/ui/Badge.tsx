import { cn } from "@/lib/utils";

export type Tone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const tones: Record<Tone, string> = {
  brand: "bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300",
  success: "bg-fern-100 text-fern-800 dark:bg-fern-900 dark:text-fern-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  neutral: "bg-cream-200 text-cream-800 dark:bg-cream-800 dark:text-cream-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status vocabularies, centralised so colour meaning never drifts. */
export const JOB_STATUS: Record<string, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  no_show: { label: "No show", tone: "danger" },
};

export const LEAD_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "brand" },
  contacted: { label: "Contacted", tone: "info" },
  quoted: { label: "Quoted", tone: "warning" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "neutral" },
};

export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  void: { label: "Void", tone: "neutral" },
};
