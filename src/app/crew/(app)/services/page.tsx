import { PageHeader, Panel } from "@/components/crm/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { saveService } from "@/app/crew/actions";
import { estimateJob, formatDuration } from "@/lib/estimate";
import { money } from "@/lib/format";

export const metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader
        title="Services"
        description="Copy, pricing, and the time formula behind every estimate. Changes go live on the website immediately."
      />

      <div className="flex flex-col gap-6">
        {services.map((service) => {
          // Preview against a typical 3-bed home so the effect of a
          // formula change is visible before saving.
          const preview = estimateJob({
            baseMinutes: service.baseMinutes,
            minutesPer1kSqFt: service.minutesPer1kSqFt,
            minutesPerBedroom: service.minutesPerBedroom,
            minutesPerBathroom: service.minutesPerBathroom,
            setupMinutes: service.setupMinutes,
            squareFeet: 1800,
            bedrooms: 3,
            bathrooms: 2,
            conditionLevel: 3,
            frequency: "one-time",
            crewSize: 1,
          });

          return (
            <Panel
              key={service.id}
              title={service.name}
              description={service.blurb}
              action={
                <div className="flex items-center gap-2">
                  {service.featured && <Badge tone="brand">Featured</Badge>}
                  <Badge tone={service.active ? "success" : "neutral"}>
                    {service.active ? "Live" : "Hidden"}
                  </Badge>
                </div>
              }
            >
              <form action={saveService} className="grid gap-6 p-5 xl:grid-cols-[1.2fr_1fr]">
                <input type="hidden" name="id" value={service.id} />

                <div className="space-y-5">
                  <Field label="Name">
                    <Input name="name" defaultValue={service.name} />
                  </Field>
                  <Field label="Short blurb" hint="One line, shown on cards.">
                    <Input name="blurb" defaultValue={service.blurb} />
                  </Field>
                  <Field label="Full description">
                    <Textarea name="description" rows={4} defaultValue={service.description} />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Starting price ($)">
                      <Input
                        name="priceFrom"
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={
                          service.priceFrom != null
                            ? (service.priceFrom / 100).toFixed(2)
                            : ""
                        }
                      />
                    </Field>
                    <Field label="Hourly rate ($)">
                      <Input
                        name="hourlyRate"
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={(service.hourlyRate / 100).toFixed(2)}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-5">
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={service.active}
                        className="size-4 accent-plum-800"
                      />
                      Show on website
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        name="featured"
                        defaultChecked={service.featured}
                        className="size-4 accent-plum-800"
                      />
                      Feature on home page
                    </label>
                  </div>
                </div>

                {/* ---------- Time formula ---------- */}
                <div className="space-y-5 rounded-card border border-border-base bg-surface-2 p-5">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-text">
                      <Icon name="clock" className="size-4 text-brand" />
                      Time formula
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      Every estimate for this service is built from these five
                      numbers.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Base minutes">
                      <Input name="baseMinutes" type="number" min={0} defaultValue={service.baseMinutes} />
                    </Field>
                    <Field label="Per 1,000 sq ft">
                      <Input
                        name="minutesPer1kSqFt"
                        type="number"
                        min={0}
                        defaultValue={service.minutesPer1kSqFt}
                      />
                    </Field>
                    <Field label="Per bedroom">
                      <Input
                        name="minutesPerBedroom"
                        type="number"
                        min={0}
                        defaultValue={service.minutesPerBedroom}
                      />
                    </Field>
                    <Field label="Per bathroom">
                      <Input
                        name="minutesPerBathroom"
                        type="number"
                        min={0}
                        defaultValue={service.minutesPerBathroom}
                      />
                    </Field>
                  </div>

                  <Field label="Setup & supplies" hint="Not scaled by condition.">
                    <Input name="setupMinutes" type="number" min={0} defaultValue={service.setupMinutes} />
                  </Field>

                  <div className="rounded-field bg-plum-800 p-4 text-cream-50">
                    <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-plum-300">
                      A typical 3-bed / 2-bath, 1,800 sq ft
                    </p>
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <p className="font-display text-2xl font-semibold tabular">
                        {formatDuration(preview.laborMinutes)}
                      </p>
                      <p className="font-display text-xl font-semibold tabular">
                        {money(
                          Math.round(
                            ((preview.laborMinutes / 60) * service.hourlyRate) / 500,
                          ) * 500,
                        )}
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Save {service.name}
                  </Button>
                </div>
              </form>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
