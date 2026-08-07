import Link from "next/link";
import { PageHeader, Panel, EmptyState, StatCard, TableWrap, Th, Td } from "@/components/crm/ui";
import { Badge, INVOICE_STATUS } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { money, dateShort } from "@/lib/format";
import { formatDuration } from "@/lib/estimate";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const [invoices, unbilled] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      include: { client: true, jobs: true },
    }),
    // Completed work that hasn't been attached to an invoice yet — the
    // most valuable thing this page can surface.
    prisma.job.findMany({
      where: { status: "completed", invoiceId: null, price: { not: null } },
      orderBy: { completedAt: "desc" },
      include: { client: true, service: true },
    }),
  ]);

  const outstanding = invoices
    .filter((i) => ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);
  const unbilledTotal = unbilled.reduce((s, j) => s + (j.price ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Completed work, billed and unbilled."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ready to bill"
          value={money(unbilledTotal)}
          sub={`${unbilled.length} completed jobs not yet invoiced`}
          icon="invoice"
          tone={unbilled.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Outstanding"
          value={money(outstanding)}
          sub={`${invoices.filter((i) => ["sent", "overdue"].includes(i.status)).length} unpaid invoices`}
          icon="clock"
          tone={outstanding > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Collected"
          value={money(paid)}
          sub="all time"
          icon="chart"
          tone="success"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <Panel
          title="Ready to bill"
          description="Completed jobs with a price and no invoice attached."
        >
          {unbilled.length === 0 ? (
            <EmptyState
              icon="check"
              title="Everything's billed"
              body="Every completed job has been invoiced."
            />
          ) : (
            <TableWrap>
              <thead className="bg-surface-2">
                <tr>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th className="text-right">Completed</Th>
                  <Th className="text-right">Time</Th>
                  <Th className="text-right">Travel</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {unbilled.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-2">
                    <Td>
                      <Link
                        href={`/crew/clients/${job.clientId}`}
                        className="font-medium text-text hover:text-brand"
                      >
                        {job.client.name}
                      </Link>
                    </Td>
                    <Td className="text-text-muted">{job.service?.name ?? "—"}</Td>
                    <Td className="text-right text-text-muted">
                      {job.completedAt ? dateShort(job.completedAt) : "—"}
                    </Td>
                    <Td className="text-right tabular text-text-muted">
                      {formatDuration(job.actualMinutes ?? 0)}
                    </Td>
                    <Td className="text-right tabular text-text-subtle">
                      {money(job.travelCost)}
                    </Td>
                    <Td className="text-right tabular font-semibold text-text">
                      {money(job.price)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <Panel title="Invoices">
          {invoices.length === 0 ? (
            <EmptyState
              icon="invoice"
              title="No invoices yet"
              body="Invoices you raise will be listed here with their payment status."
            />
          ) : (
            <TableWrap>
              <thead className="bg-surface-2">
                <tr>
                  <Th>Number</Th>
                  <Th>Client</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Issued</Th>
                  <Th className="text-right">Due</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => {
                  const status = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.draft;
                  return (
                    <tr key={invoice.id} className="hover:bg-surface-2">
                      <Td className="font-mono text-xs text-text">{invoice.number}</Td>
                      <Td>
                        <Link
                          href={`/crew/clients/${invoice.clientId}`}
                          className="font-medium text-text hover:text-brand"
                        >
                          {invoice.client.name}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Td>
                      <Td className="text-right text-text-muted">
                        {dateShort(invoice.issuedAt)}
                      </Td>
                      <Td className="text-right text-text-muted">
                        {invoice.dueAt ? dateShort(invoice.dueAt) : "—"}
                      </Td>
                      <Td className="text-right tabular font-semibold text-text">
                        {money(invoice.total)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </>
  );
}
