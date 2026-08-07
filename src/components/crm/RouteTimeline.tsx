import Link from "next/link";
import { Badge, JOB_STATUS } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatDuration } from "@/lib/estimate";
import { formatMiles, type RouteSummary } from "@/lib/travel";
import { money, time, addMinutes } from "@/lib/format";
import { jobMinutes } from "@/lib/crm-data";

type Job = {
  id: string;
  scheduledFor: Date;
  status: string;
  estimatedMinutes: number;
  overrideMinutes: number | null;
  actualMinutes: number | null;
  price: number | null;
  client: { name: string; address: string | null; city: string | null };
  service: { name: string } | null;
  assignments: Array<{ user: { name: string; color: string } }>;
};

/**
 * A day rendered as alternating drive/work segments.
 *
 * Showing the drive as its own block — rather than hiding it in a
 * margin — is the entire point: it makes an over-packed day visible
 * before it's booked, not after.
 */
export function RouteTimeline({
  jobs,
  route,
  hqLabel,
}: {
  jobs: Job[];
  route: RouteSummary;
  hqLabel: string;
}) {
  return (
    <div className="px-5 py-5">
      <ol className="relative space-y-1">
        {/* Start of day */}
        <li className="flex items-center gap-3 pb-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-text-subtle ring-1 ring-border-base">
            <Icon name="pin" className="size-4" />
          </span>
          <p className="text-sm font-medium text-text-muted">{hqLabel}</p>
        </li>

        {route.stops.map((stop, index) => {
          const job = jobs.find((j) => j.id === stop.waypoint.id);
          if (!job) return null;

          const status = JOB_STATUS[job.status] ?? JOB_STATUS.scheduled;
          const minutes = jobMinutes(job);
          const endsAt = addMinutes(job.scheduledFor, minutes);

          return (
            <li key={stop.waypoint.id}>
              {/* --- Drive leg --- */}
              <div className="flex items-stretch gap-3">
                <div className="flex w-8 shrink-0 justify-center">
                  <span className="w-px bg-border-strong" />
                </div>
                <div className="flex items-center gap-2 py-2 text-xs text-text-subtle">
                  <Icon name="car" className="size-3.5" />
                  <span className="tabular">
                    {formatDuration(stop.legIn.minutes)} ·{" "}
                    {formatMiles(stop.legIn.miles)}
                  </span>
                  {stop.legIn.estimated && (
                    <span
                      title="No address coordinates — using a default distance"
                      className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    >
                      approx
                    </span>
                  )}
                </div>
              </div>

              {/* --- The job --- */}
              <Link
                href={`/crew/schedule/${job.id}`}
                className="group flex items-start gap-3 rounded-field p-2 transition-colors hover:bg-surface-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-2xs font-semibold text-on-brand">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-text">
                      {job.client.name}
                    </p>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {job.service?.name}
                    {job.client.city ? ` · ${job.client.city}` : ""}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-subtle">
                    <span className="inline-flex items-center gap-1 tabular">
                      <Icon name="clock" className="size-3.5" />
                      {time(job.scheduledFor)} – {time(endsAt)}
                    </span>
                    <span className="tabular">{formatDuration(minutes)}</span>
                    {job.assignments.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="user" className="size-3.5" />
                        {job.assignments.map((a) => a.user.name).join(", ")}
                      </span>
                    )}
                    {job.price != null && (
                      <span className="font-medium tabular text-text-muted">
                        {money(job.price)}
                      </span>
                    )}
                  </div>
                </div>

                <Icon
                  name="chevron"
                  className="mt-1 size-4 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}

        {/* Drive home */}
        {route.returnLeg && (
          <li>
            <div className="flex items-stretch gap-3">
              <div className="flex w-8 shrink-0 justify-center">
                <span className="w-px bg-border-strong" />
              </div>
              <div className="flex items-center gap-2 py-2 text-xs text-text-subtle">
                <Icon name="car" className="size-3.5" />
                <span className="tabular">
                  {formatDuration(route.returnLeg.minutes)} ·{" "}
                  {formatMiles(route.returnLeg.miles)} home
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-text-subtle ring-1 ring-border-base">
                <Icon name="check" className="size-4" />
              </span>
              <p className="text-sm font-medium text-text-muted">
                Back at {hqLabel}
              </p>
            </div>
          </li>
        )}
      </ol>

      {/* ---------- Day totals ---------- */}
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border-base pt-5 sm:grid-cols-4">
        {[
          { label: "On site", value: formatDuration(route.totalOnSiteMinutes) },
          { label: "Driving", value: formatDuration(route.totalTravelMinutes) },
          { label: "Miles", value: `${route.totalTravelMiles}` },
          { label: "Mileage", value: money(route.totalTravelCost) },
        ].map((item) => (
          <div key={item.label}>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-text-subtle">
              {item.label}
            </dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular text-text">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {route.travelSharePercent > 30 && (
        <p className="mt-4 flex items-start gap-2 rounded-field bg-amber-50 px-3.5 py-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <Icon name="bolt" className="mt-px size-3.5 shrink-0" />
          <span>
            {route.travelSharePercent}% of today is spent driving. Grouping
            these stops by town would claw back real hours.
          </span>
        </p>
      )}
    </div>
  );
}
