import Link from "next/link";
import { PageHeader, Panel, EmptyState } from "@/components/crm/ui";
import { Badge, JOB_STATUS } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getJobsBetween, weekBounds, jobMinutes } from "@/lib/crm-data";
import { formatDuration } from "@/lib/estimate";
import { money, time } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  // `week` is an offset from the current week, so links stay stable.
  const offset = Number(week ?? 0) || 0;
  const anchor = new Date();
  anchor.setDate(anchor.getDate() + offset * 7);

  const { start, end } = weekBounds(anchor);
  const jobs = await getJobsBetween(start, end);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });

  const todayKey = new Date().toDateString();

  const weekMinutes = jobs
    .filter((j) => j.status !== "cancelled")
    .reduce((sum, j) => sum + jobMinutes(j), 0);
  const weekTravel = jobs
    .filter((j) => j.status !== "cancelled")
    .reduce((sum, j) => sum + j.travelMinutes, 0);
  const weekRevenue = jobs
    .filter((j) => j.status !== "cancelled")
    .reduce((sum, j) => sum + (j.price ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Schedule"
        description={`${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/crew/schedule?week=${offset - 1}`}
              aria-label="Previous week"
              className="grid size-10 place-items-center rounded-field border border-border-strong bg-surface text-text-muted transition-colors hover:bg-surface-2"
            >
              <Icon name="chevron" className="size-4 rotate-180" />
            </Link>
            <Link
              href="/crew/schedule"
              className={cn(
                "grid h-10 place-items-center rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2",
                offset === 0 && "border-brand text-brand",
              )}
            >
              Today
            </Link>
            <Link
              href={`/crew/schedule?week=${offset + 1}`}
              aria-label="Next week"
              className="grid size-10 place-items-center rounded-field border border-border-strong bg-surface text-text-muted transition-colors hover:bg-surface-2"
            >
              <Icon name="chevron" className="size-4" />
            </Link>
            <ButtonLink href="/crew/schedule/new">
              <Icon name="plus" className="size-4" />
              New job
            </ButtonLink>
          </div>
        }
      />

      {/* ---------- Week totals ---------- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Jobs", value: String(jobs.length), icon: "calendar" },
          { label: "On site", value: formatDuration(weekMinutes), icon: "clock" },
          { label: "Driving", value: formatDuration(weekTravel), icon: "car" },
          { label: "Booked", value: money(weekRevenue), icon: "chart" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-card border border-border-base bg-surface px-4 py-3.5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
              <Icon name={s.icon} className="size-4" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tabular text-text">
                {s.value}
              </p>
              <p className="text-2xs uppercase tracking-wide text-text-subtle">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Week grid ---------- */}
      <div className="grid gap-4 lg:grid-cols-7">
        {days.map((day) => {
          const dayJobs = jobs.filter(
            (j) => new Date(j.scheduledFor).toDateString() === day.toDateString(),
          );
          const isToday = day.toDateString() === todayKey;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-40 flex-col rounded-card border bg-surface p-3",
                isToday
                  ? "border-brand ring-1 ring-[var(--ring)]/30"
                  : "border-border-base",
              )}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span
                  className={cn(
                    "text-2xs font-semibold uppercase tracking-wide",
                    isToday ? "text-brand" : "text-text-subtle",
                  )}
                >
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "font-display text-lg font-semibold tabular",
                    isToday ? "text-brand" : "text-text",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {dayJobs.length === 0 ? (
                  <p className="text-2xs text-text-subtle">—</p>
                ) : (
                  dayJobs.map((job) => {
                    const status = JOB_STATUS[job.status] ?? JOB_STATUS.scheduled;
                    const minutes = jobMinutes(job);
                    return (
                      <Link
                        key={job.id}
                        href={`/crew/schedule/${job.id}`}
                        className="group rounded-field border border-border-base bg-surface-2 p-2.5 transition-colors hover:border-plum-300 dark:hover:border-plum-700"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-2xs font-semibold tabular text-text-muted">
                            {time(job.scheduledFor)}
                          </span>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-text">
                          {job.client.name}
                        </p>
                        <p className="truncate text-2xs text-text-subtle">
                          {job.service?.name}
                        </p>
                        <p className="mt-1.5 flex items-center gap-2 text-2xs text-text-subtle tabular">
                          <span className="inline-flex items-center gap-0.5">
                            <Icon name="clock" className="size-3" />
                            {formatDuration(minutes)}
                          </span>
                          {job.travelMinutes > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Icon name="car" className="size-3" />
                              {job.travelMinutes}m
                            </span>
                          )}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <Panel className="mt-6">
          <EmptyState
            icon="calendar"
            title="Nothing scheduled this week"
            body="Add a job, or jump back to the current week."
            action={
              <ButtonLink href="/crew/schedule/new" size="sm">
                Schedule a job
              </ButtonLink>
            }
          />
        </Panel>
      )}
    </>
  );
}
