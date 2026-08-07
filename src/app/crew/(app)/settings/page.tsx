import { PageHeader, Panel } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { saveSetting } from "@/app/crew/actions";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";

export const metadata = { title: "Settings" };

const GROUPS: Array<{ key: string; title: string; description: string; icon: string }> = [
  {
    key: "contact",
    title: "Contact details",
    description: "Shown across the website — header, footer, and every call-to-action.",
    icon: "phone",
  },
  {
    key: "general",
    title: "Home page copy",
    description: "The headline and paragraph visitors read first.",
    icon: "sparkle",
  },
  {
    key: "travel",
    title: "Travel & mileage",
    description: "Drives every route calculation and mileage figure in the workspace.",
    icon: "car",
  },
  {
    key: "estimating",
    title: "Estimating",
    description: "How estimates behave, on the website and in the schedule.",
    icon: "clock",
  },
];

export default async function SettingsPage() {
  const [settings, team, user] = await Promise.all([
    prisma.setting.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    requireUser(),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything here is editable without a developer."
      />

      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => {
          const rows = settings.filter((s) => s.group === group.key);
          if (rows.length === 0) return null;

          return (
            <Panel
              key={group.key}
              title={group.title}
              description={group.description}
              action={
                <span className="grid size-9 place-items-center rounded-xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                  <Icon name={group.icon} className="size-4" />
                </span>
              }
            >
              <form action={saveSetting} className="space-y-5 px-5 py-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {rows.map((row) => (
                    <Field
                      key={row.key}
                      label={row.label}
                      hint={row.hint ?? undefined}
                      className={row.type === "textarea" ? "sm:col-span-2" : undefined}
                    >
                      {row.type === "textarea" ? (
                        <Textarea name={row.key} rows={3} defaultValue={row.value} />
                      ) : row.type === "boolean" ? (
                        <Select name={row.key} defaultValue={row.value}>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Select>
                      ) : (
                        <Input
                          name={row.key}
                          type={row.type === "number" ? "number" : "text"}
                          step={row.type === "number" ? "any" : undefined}
                          defaultValue={row.value}
                        />
                      )}
                    </Field>
                  ))}
                </div>
                <Button type="submit">Save {group.title.toLowerCase()}</Button>
              </form>
            </Panel>
          );
        })}

        {/* ---------- Team ---------- */}
        <Panel
          title="Team"
          description="Who can sign in to this workspace."
        >
          <ul className="divide-y divide-[var(--border)]">
            {team.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-text">
                    {member.name}
                    {member.id === user.id && (
                      <span className="text-2xs font-normal text-text-subtle">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-text-subtle">
                    {member.email}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="capitalize text-text-muted">{member.role}</p>
                  <p className="text-xs tabular text-text-subtle">
                    {money(member.hourlyRate)}/hr
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="border-t border-border-base bg-surface-2 px-5 py-4 text-xs leading-relaxed text-text-subtle">
            Hourly rates are used for job profitability only — they never appear
            on the website or on anything a client sees.
          </p>
        </Panel>
      </div>
    </>
  );
}
