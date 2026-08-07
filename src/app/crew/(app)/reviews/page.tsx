import { PageHeader, Panel, EmptyState } from "@/components/crm/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { saveTestimonial, deleteTestimonial } from "@/app/crew/actions";
import { brand } from "@/lib/brand";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ published: "desc" }, { sortOrder: "asc" }],
  });

  const live = testimonials.filter((t) => t.published).length;

  return (
    <>
      <PageHeader
        title="Reviews"
        description={`${testimonials.length} reviews · ${live} showing on the website`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Add a review">
            <form action={saveTestimonial} className="space-y-4 px-5 py-5">
              <Field label="Who said it" required>
                <Input name="author" required placeholder="Margaret W." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Their role">
                  <Input name="role" placeholder="Airbnb host" />
                </Field>
                <Field label="Town">
                  <Input name="location" placeholder="Rutland, VT" />
                </Field>
              </div>
              <Field label="What they said" required>
                <Textarea name="quote" rows={4} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rating">
                  <Select name="rating" defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n === 1 ? "" : "s"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Source">
                  <Select name="source" defaultValue="facebook">
                    <option value="facebook">Facebook</option>
                    <option value="google">Google</option>
                    <option value="direct">Told us directly</option>
                  </Select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="size-4 accent-plum-800"
                />
                Show on the website
              </label>
              <Button type="submit" className="w-full">
                Add review
              </Button>
            </form>
          </Panel>

          <Panel title="Getting your Facebook reviews across">
            <div className="space-y-3 px-5 py-5 text-sm leading-relaxed text-text-muted">
              <p>
                Facebook keeps recommendations behind a login, so they
                can&rsquo;t be pulled in automatically. Open your{" "}
                <a
                  href={`${brand.facebook}reviews`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand hover:underline"
                >
                  Reviews tab
                </a>{" "}
                and copy the good ones into the form — it takes a couple of
                minutes and you get to pick the best ones.
              </p>
              <p className="text-xs text-text-subtle">
                The four currently loaded are placeholders written to match your
                page&rsquo;s tone. Replace them with real ones before launch.
              </p>
            </div>
          </Panel>
        </div>

        <Panel title="All reviews">
          {testimonials.length === 0 ? (
            <EmptyState
              icon="star"
              title="No reviews yet"
              body="Add the good ones from Facebook and they'll appear on the home page."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {testimonials.map((t) => (
                <li key={t.id} className="px-5 py-5">
                  <form action={saveTestimonial} className="space-y-3">
                    <input type="hidden" name="id" value={t.id} />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex gap-0.5 text-brass-500">
                          {Array.from({ length: t.rating }).map((_, n) => (
                            <Icon key={n} name="star" className="size-3.5" />
                          ))}
                        </span>
                        <Badge tone="neutral">{t.source}</Badge>
                        <Badge tone={t.published ? "success" : "neutral"}>
                          {t.published ? "Live" : "Hidden"}
                        </Badge>
                      </div>
                    </div>

                    <Textarea name="quote" rows={3} defaultValue={t.quote} />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input name="author" defaultValue={t.author} aria-label="Author" />
                      <Input
                        name="role"
                        defaultValue={t.role ?? ""}
                        placeholder="Role"
                        aria-label="Role"
                      />
                      <Input
                        name="location"
                        defaultValue={t.location ?? ""}
                        placeholder="Town"
                        aria-label="Town"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Select name="rating" defaultValue={String(t.rating)} className="w-28">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} star{n === 1 ? "" : "s"}
                          </option>
                        ))}
                      </Select>
                      <Select name="source" defaultValue={t.source} className="w-36">
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="direct">Direct</option>
                      </Select>
                      <label className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          name="published"
                          defaultChecked={t.published}
                          className="size-4 accent-plum-800"
                        />
                        Live
                      </label>

                      <div className="ml-auto flex gap-2">
                        <Button type="submit" size="sm" variant="secondary">
                          Save
                        </Button>
                      </div>
                    </div>
                  </form>

                  <form action={deleteTestimonial} className="mt-2">
                    <input type="hidden" name="id" value={t.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 dark:text-red-400"
                    >
                      <Icon name="trash" className="size-4" />
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
