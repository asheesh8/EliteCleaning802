import Link from "next/link";
import { PageHeader, Panel, EmptyState } from "@/components/crm/ui";
import { Badge, LEAD_STATUS } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { formatDuration } from "@/lib/estimate";
import { money, relative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };

const COLUMNS = ["new", "contacted", "quoted", "won", "lost"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filter } = await searchParams;

  const leads = await prisma.lead.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { service: true },
  });

  const counts = Object.fromEntries(
    COLUMNS.map((c) => [c, leads.filter((l) => l.status === c).length]),
  );

  const visible = filter ? leads.filter((l) => l.status === filter) : leads;

  const pipelineValue = leads
    .filter((l) => ["new", "contacted", "quoted"].includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedPrice ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${counts.new} new · ${money(pipelineValue)} in open pipeline`}
      />

      {/* ---------- Filters ---------- */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/crew/leads"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            !filter
              ? "border-brand bg-brand text-on-brand"
              : "border-border-strong bg-surface text-text-muted hover:text-text",
          )}
        >
          All ({leads.length})
        </Link>
        {COLUMNS.map((c) => {
          const meta = LEAD_STATUS[c];
          return (
            <Link
              key={c}
              href={`/crew/leads?status=${c}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === c
                  ? "border-brand bg-brand text-on-brand"
                  : "border-border-strong bg-surface text-text-muted hover:text-text",
              )}
            >
              {meta.label} ({counts[c]})
            </Link>
          );
        })}
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon="quote"
            title="No leads here"
            body="New quote requests from the website land in this list automatically."
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {visible.map((lead) => {
              const status = LEAD_STATUS[lead.status] ?? LEAD_STATUS.new;
              return (
                <li key={lead.id}>
                  <Link
                    href={`/crew/leads/${lead.id}`}
                    className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                      {lead.name.slice(0, 2).toUpperCase()}
                    </span>

                    <div className="min-w-40 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text">{lead.name}</p>
                        {lead.priority === "high" && (
                          <Icon name="bolt" className="size-3.5 text-amber-500" />
                        )}
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-text-muted">
                        {lead.service?.name ?? "Not sure yet"}
                        {lead.city ? ` · ${lead.city}` : ""}
                      </p>
                      {lead.message && (
                        <p className="mt-1 line-clamp-1 max-w-xl text-xs text-text-subtle">
                          {lead.message}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {lead.estimatedPrice ? (
                        <>
                          <p className="font-display text-lg font-semibold tabular text-text">
                            {money(lead.estimatedPrice)}
                          </p>
                          <p className="text-xs tabular text-text-subtle">
                            {formatDuration(lead.estimatedMinutes ?? 0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-text-subtle">No estimate</p>
                      )}
                      <p className="mt-1 text-2xs text-text-subtle">
                        {relative(lead.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
