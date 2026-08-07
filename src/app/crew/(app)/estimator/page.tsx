import { PageHeader } from "@/components/crm/ui";
import { EstimatorPlayground } from "@/components/crm/EstimatorPlayground";
import { prisma } from "@/lib/db";
import { getTravelSettings } from "@/lib/settings";

export const metadata = { title: "Time estimator" };

export default async function EstimatorPage() {
  const [services, addOns, travel, crew] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    getTravelSettings(),
    prisma.user.findMany({ where: { active: true }, select: { hourlyRate: true } }),
  ]);

  // Average crew rate, so profit maths reflects who actually works here.
  const crewRate =
    crew.length > 0
      ? Math.round(crew.reduce((s, u) => s + u.hourlyRate, 0) / crew.length)
      : 3800;

  return (
    <>
      <PageHeader
        title="Time estimator"
        description="Price a hypothetical job and see whether the drive makes it worth taking. Nothing here is saved."
      />
      <EstimatorPlayground
        services={services}
        addOns={addOns}
        travel={travel}
        crewRate={crewRate}
      />
    </>
  );
}
