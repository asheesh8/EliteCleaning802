import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-border-base bg-surface",
        className,
      )}
    >
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-base px-5 py-4">
          <div>
            <h2 className="font-semibold tracking-tight text-text">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const tones = {
  brand: "bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300",
  success: "bg-fern-100 text-fern-700 dark:bg-fern-900 dark:text-fern-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  neutral: "bg-cream-200 text-cream-700 dark:bg-cream-800 dark:text-cream-200",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  href,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  href?: string;
  tone?: keyof typeof tones;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>
          <Icon name={icon} className="size-5" />
        </span>
        {href && (
          <Icon
            name="arrow"
            className="size-4 text-text-subtle transition-transform group-hover:translate-x-0.5"
          />
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight tabular text-text">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-text-subtle">{sub}</p>}
    </>
  );

  const base = "rounded-card border border-border-base bg-surface p-5 transition-colors";

  return href ? (
    <Link
      href={href}
      className={cn(base, "group hover:border-plum-300 dark:hover:border-plum-700")}
    >
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

export function EmptyState({
  title,
  body,
  icon = "sparkle",
  action,
}: {
  title: string;
  body: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-text-subtle">
        <Icon name={icon} className="size-5" />
      </span>
      <p className="mt-4 font-medium text-text">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wide text-text-subtle",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3.5 align-middle", className)}>{children}</td>;
}

/** Horizontal scroll container for wide tables on narrow screens. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-slim overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">{children}</table>
    </div>
  );
}

/** A labelled value pair, used across every detail page. */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-text">{children}</dd>
    </div>
  );
}
