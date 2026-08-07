import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, DetailRow, EmptyState } from "@/components/crm/ui";
import { Badge, LEAD_STATUS } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { updateLeadStatus, addNote, convertLead } from "@/app/crew/actions";
import { formatDuration } from "@/lib/estimate";
import { money, dateLong, relative } from "@/lib/format";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      service: true,
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const status = LEAD_STATUS[lead.status] ?? LEAD_STATUS.new;

  return (
    <>
      <PageHeader
        title={lead.name}
        description={`${lead.source} lead · ${dateLong(lead.createdAt)}`}
        action={
          <Link
            href="/crew/leads"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            All leads
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          {/* ---------- Status ---------- */}
          <Panel title="Status">
            <div className="px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                {lead.priority === "high" && (
                  <Badge tone="warning">
                    <Icon name="bolt" className="size-3" />
                    High priority
                  </Badge>
                )}
              </div>

              <form action={updateLeadStatus} className="flex gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <Select name="status" defaultValue={lead.status} className="flex-1">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </Select>
                <Button type="submit" variant="secondary">
                  Update
                </Button>
              </form>

              {lead.convertedClientId ? (
                <Link
                  href={`/crew/clients/${lead.convertedClientId}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-field bg-fern-100 px-4 py-3 text-sm font-semibold text-fern-800 transition-colors hover:bg-fern-200 dark:bg-fern-900 dark:text-fern-300"
                >
                  <Icon name="check" className="size-4" />
                  View client record
                </Link>
              ) : (
                <form action={convertLead} className="mt-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <Button type="submit" className="w-full">
                    <Icon name="users" className="size-4" />
                    Convert to client
                  </Button>
                </form>
              )}
            </div>
          </Panel>

          {/* ---------- Contact & property ---------- */}
          <Panel title="Details">
            <dl className="divide-y divide-[var(--border)] px-5 py-1">
              <DetailRow label="Email">
                <a href={`mailto:${lead.email}`} className="text-brand hover:underline">
                  {lead.email}
                </a>
              </DetailRow>
              {lead.phone && (
                <DetailRow label="Phone">
                  <a href={`tel:${lead.phone}`} className="text-brand hover:underline">
                    {lead.phone}
                  </a>
                </DetailRow>
              )}
              <DetailRow label="Service">
                {lead.service?.name ?? "Not sure yet"}
              </DetailRow>
              <DetailRow label="Property">
                <span className="capitalize">{lead.propertyType}</span>
              </DetailRow>
              {(lead.address || lead.city) && (
                <DetailRow label="Location">
                  {[lead.address, lead.city, lead.zip].filter(Boolean).join(", ")}
                </DetailRow>
              )}
              {lead.squareFeet && (
                <DetailRow label="Size">
                  {lead.squareFeet.toLocaleString()} sq ft
                </DetailRow>
              )}
              {(lead.bedrooms != null || lead.bathrooms != null) && (
                <DetailRow label="Rooms">
                  {lead.bedrooms ?? 0} bd · {lead.bathrooms ?? 0} ba
                </DetailRow>
              )}
              {lead.frequency && (
                <DetailRow label="Frequency">
                  <span className="capitalize">{lead.frequency}</span>
                </DetailRow>
              )}
              {lead.preferredDate && (
                <DetailRow label="Wants to start">{lead.preferredDate}</DetailRow>
              )}
            </dl>

            {lead.message && (
              <div className="border-t border-border-base bg-surface-2 px-5 py-4">
                <p className="text-2xs font-semibold uppercase tracking-wide text-text-subtle">
                  Their message
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text">
                  {lead.message}
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {/* ---------- Estimate snapshot ---------- */}
          {lead.estimatedMinutes && (
            <div className="overflow-hidden rounded-card border border-border-base bg-plum-800 text-cream-50">
              <div className="p-6">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
                  Estimate they were shown
                </p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl font-semibold tabular">
                      {formatDuration(lead.estimatedMinutes)}
                    </p>
                    <p className="text-xs text-plum-300">estimated time</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-semibold tabular">
                      {money(lead.estimatedPrice)}
                    </p>
                    <p className="text-xs text-plum-300">estimated price</p>
                  </div>
                </div>
                <p className="mt-4 border-t border-plum-600/50 pt-3 text-xs text-plum-300">
                  Quote at or above this number, or explain the difference when
                  you call. They&rsquo;ve already seen it.
                </p>
              </div>
            </div>
          )}

          {/* ---------- Activity ---------- */}
          <Panel title="Activity" description="Calls, emails, and notes.">
            <div className="border-b border-border-base px-5 py-4">
              <form action={addNote} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Field label="Log something">
                  <Textarea
                    name="body"
                    rows={2}
                    required
                    placeholder="Called — left a voicemail. Following up Thursday."
                  />
                </Field>
                <div className="flex gap-2">
                  <Select name="kind" defaultValue="call" className="w-36">
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                    <option value="note">Note</option>
                  </Select>
                  <Button type="submit" variant="secondary">
                    Add
                  </Button>
                </div>
              </form>
            </div>

            {lead.notes.length === 0 ? (
              <EmptyState
                icon="quote"
                title="Nothing logged yet"
                body="Every call and email you record here stays with the client if they convert."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {lead.notes.map((note) => (
                  <li key={note.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{note.kind}</Badge>
                      <span className="text-xs text-text-subtle">
                        {note.author?.name ?? "System"} · {relative(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text">
                      {note.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
