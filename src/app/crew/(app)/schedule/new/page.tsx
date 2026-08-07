import Link from "next/link";
import { PageHeader, EmptyState, Panel } from "@/components/crm/ui";
import { JobForm } from "@/components/crm/JobForm";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { dateInput } from "@/lib/format";

export const metadata = { title: "New job" };

export default async function NewJobPage() {
  const [clients, services, addOns, crew] = await Promise.all([
    prisma.client.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  // Default to 9am tomorrow — the most common thing being booked.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  return (
    <>
      <PageHeader
        title="Schedule a job"
        description="Pick a client and the estimate builds itself."
        action={
          <Link
            href="/crew/schedule"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            Back
          </Link>
        }
      />

      {clients.length === 0 ? (
        <Panel>
          <EmptyState
            icon="users"
            title="No clients yet"
            body="Jobs are scheduled against a client. Add one first — it only takes a moment."
            action={
              <ButtonLink href="/crew/clients/new" size="sm">
                Add a client
              </ButtonLink>
            }
          />
        </Panel>
      ) : (
        <JobForm
          clients={clients}
          services={services}
          addOns={addOns}
          crew={crew}
          defaultDate={dateInput(tomorrow)}
        />
      )}
    </>
  );
}
