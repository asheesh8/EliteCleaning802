import Link from "next/link";
import { PageHeader, Panel, EmptyState, TableWrap, Th, Td } from "@/components/crm/ui";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { money, dateShort } from "@/lib/format";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      jobs: {
        orderBy: { scheduledFor: "desc" },
        select: { scheduledFor: true, price: true, status: true },
      },
    },
  });

  const active = clients.filter((c) => c.status === "active");
  const monthlyValue = active.reduce((sum, c) => {
    if (!c.rate) return sum;
    const perMonth =
      c.frequency === "weekly" ? 4.33 : c.frequency === "biweekly" ? 2.17 : 1;
    return sum + c.rate * perMonth;
  }, 0);

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${active.length} active · roughly ${money(Math.round(monthlyValue))}/month recurring`}
        action={
          <ButtonLink href="/crew/clients/new">
            <Icon name="plus" className="size-4" />
            Add client
          </ButtonLink>
        }
      />

      <Panel>
        {clients.length === 0 ? (
          <EmptyState
            icon="users"
            title="No clients yet"
            body="Add one directly, or convert a lead from the pipeline."
            action={
              <ButtonLink href="/crew/clients/new" size="sm">
                Add a client
              </ButtonLink>
            }
          />
        ) : (
          <TableWrap>
            <thead className="bg-surface-2">
              <tr>
                <Th>Client</Th>
                <Th>Property</Th>
                <Th>Frequency</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Last visit</Th>
                <Th className="text-right">Lifetime</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {clients.map((client) => {
                const completed = client.jobs.filter(
                  (j) => j.status === "completed",
                );
                const lifetime = completed.reduce(
                  (sum, j) => sum + (j.price ?? 0),
                  0,
                );
                const last = completed[0];

                return (
                  <tr
                    key={client.id}
                    className="transition-colors hover:bg-surface-2"
                  >
                    <Td>
                      <Link href={`/crew/clients/${client.id}`} className="group flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plum-100 text-2xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                          {client.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium text-text group-hover:text-brand">
                              {client.name}
                            </span>
                            {client.status !== "active" && (
                              <Badge tone="neutral">{client.status}</Badge>
                            )}
                          </span>
                          <span className="block truncate text-xs text-text-subtle">
                            {client.city ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <span className="capitalize text-text-muted">
                        {client.propertyType}
                      </span>
                      <span className="block text-xs text-text-subtle tabular">
                        {client.squareFeet
                          ? `${client.squareFeet.toLocaleString()} sq ft`
                          : "—"}
                      </span>
                    </Td>
                    <Td>
                      <span className="capitalize text-text-muted">
                        {client.frequency}
                      </span>
                    </Td>
                    <Td className="text-right tabular font-medium text-text">
                      {client.rate ? money(client.rate) : "—"}
                    </Td>
                    <Td className="text-right text-text-muted">
                      {last ? dateShort(last.scheduledFor) : "—"}
                    </Td>
                    <Td className="text-right tabular font-semibold text-text">
                      {money(lifetime)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
