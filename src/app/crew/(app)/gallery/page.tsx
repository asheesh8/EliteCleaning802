import Image from "next/image";
import { PageHeader, Panel, EmptyState } from "@/components/crm/ui";
import { PhotoUploader } from "@/components/crm/PhotoUploader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { toggleGalleryItem, deleteGalleryItem } from "@/app/crew/actions";
import { updateGalleryItem } from "./actions";
import { brand } from "@/lib/brand";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ published: "desc" }, { sortOrder: "asc" }],
  });

  const published = items.filter((i) => i.published).length;

  return (
    <>
      <PageHeader
        title="Gallery"
        description={`${items.length} photos · ${published} live on the website`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Add photos" description="Drag straight from a folder.">
            <PhotoUploader />
          </Panel>

          <Panel title="Importing from Facebook">
            <div className="space-y-4 px-5 py-5 text-sm leading-relaxed text-text-muted">
              <p>
                Facebook doesn&rsquo;t let other sites read your page photos
                automatically — they&rsquo;re behind a login. Two ways to get
                them all across at once:
              </p>

              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-plum-100 text-2xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                    1
                  </span>
                  <span>
                    <strong className="font-semibold text-text">
                      Save them from the page.
                    </strong>{" "}
                    Open your{" "}
                    <a
                      href={`${brand.facebook}photos_by`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-brand hover:underline"
                    >
                      Photos tab
                    </a>
                    , save the ones you like to a folder, then drop that folder
                    into the box above.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-plum-100 text-2xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                    2
                  </span>
                  <span>
                    <strong className="font-semibold text-text">
                      Bulk import a whole folder.
                    </strong>{" "}
                    Drop the files into the project&rsquo;s{" "}
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                      photos-inbox/
                    </code>{" "}
                    folder and run:
                    <code className="mt-2 block overflow-x-auto rounded-field bg-surface-2 px-3 py-2 font-mono text-xs text-text">
                      npm run gallery:import
                    </code>
                    Filenames become titles, and anything with
                    &ldquo;before&rdquo; or &ldquo;after&rdquo; in the name is
                    filed under Before / After.
                  </span>
                </li>
              </ol>

              <p className="text-xs text-text-subtle">
                Either way, photos arrive unpublished so nothing goes live until
                you say so.
              </p>
            </div>
          </Panel>
        </div>

        <Panel title="Photos">
          {items.length === 0 ? (
            <EmptyState
              icon="image"
              title="No photos yet"
              body="Upload a few and they'll appear here, ready to publish to the website gallery."
            />
          ) : (
            <ul className="grid gap-4 p-5 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-card border border-border-base bg-surface-2"
                >
                  <div className="relative aspect-4/3 bg-cream-200 dark:bg-cream-800">
                    <Image
                      src={`/gallery/${item.filename}`}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover"
                    />
                    <div className="absolute left-2 top-2 flex gap-1.5">
                      <Badge tone={item.published ? "success" : "neutral"}>
                        {item.published ? "Live" : "Hidden"}
                      </Badge>
                      {item.featured && <Badge tone="brand">Featured</Badge>}
                    </div>
                  </div>

                  <form action={updateGalleryItem} className="space-y-3 p-4">
                    <input type="hidden" name="id" value={item.id} />

                    <Field label="Title">
                      <Input name="title" defaultValue={item.title} />
                    </Field>
                    <Field label="Caption">
                      <Input
                        name="caption"
                        defaultValue={item.caption ?? ""}
                        placeholder="Optional"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Category">
                        <Select name="category" defaultValue={item.category}>
                          <option value="work">Work</option>
                          <option value="before-after">Before / after</option>
                          <option value="team">Team</option>
                          <option value="place">Place</option>
                        </Select>
                      </Field>
                      <label className="flex items-end gap-2 pb-2.5 text-sm text-text">
                        <input
                          type="checkbox"
                          name="featured"
                          defaultChecked={item.featured}
                          className="size-4 accent-plum-800"
                        />
                        Feature
                      </label>
                    </div>

                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      Save
                    </Button>
                  </form>

                  <div className="flex gap-2 border-t border-border-base p-3">
                    <form action={toggleGalleryItem} className="flex-1">
                      <input type="hidden" name="id" value={item.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={item.published ? "secondary" : "primary"}
                        className="w-full"
                      >
                        <Icon name={item.published ? "close" : "check"} className="size-4" />
                        {item.published ? "Unpublish" : "Publish"}
                      </Button>
                    </form>
                    <form action={deleteGalleryItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 dark:text-red-400"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Icon name="trash" className="size-4" />
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
