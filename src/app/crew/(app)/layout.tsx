import type { Metadata } from "next";
import { CrmNav } from "@/components/crm/CrmNav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayBounds } from "@/lib/crm-data";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · Elite 802 Workspace" },
  // The CRM must never be indexed, even though it lives on the same domain.
  robots: { index: false, follow: false, nocache: true },
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { start, end } = dayBounds(new Date());

  const [newLeads, todayJobs] = await Promise.all([
    prisma.lead.count({ where: { status: "new" } }),
    prisma.job.count({
      where: {
        scheduledFor: { gte: start, lte: end },
        status: { in: ["scheduled", "in_progress"] },
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-sunken lg:flex-row">
      <CrmNav user={user} newLeads={newLeads} todayJobs={todayJobs} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
