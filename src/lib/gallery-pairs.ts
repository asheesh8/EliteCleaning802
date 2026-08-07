/**
 * Before/after pairing, derived from filenames.
 *
 * `oven-before.png` + `oven-after.png` become one comparison. Keeping
 * this a naming convention rather than a schema field means the CLI
 * importer, the CRM uploader, and a plain drag-and-drop all produce
 * pairs with no extra step for the owners.
 */

export type GalleryRow = {
  id: string;
  filename: string;
  title: string;
  caption: string | null;
  category: string;
  featured: boolean;
  sortOrder: number;
};

export type Pair = {
  key: string;
  before: GalleryRow;
  after: GalleryRow;
  /** Title with the "— before"/"— after" suffix stripped. */
  title: string;
  caption: string | null;
  featured: boolean;
  sortOrder: number;
};

const SUFFIX = /-(before|after)\.[a-z0-9]+$/i;

/** "Oven — before" → "Oven" */
function baseTitle(title: string) {
  return title.replace(/\s*[—–-]\s*(before|after).*$/i, "").trim() || title;
}

/**
 * Split a gallery listing into comparison pairs and everything else.
 * Items whose partner is missing fall through to `singles`, so a lone
 * `-before` shot still appears rather than vanishing.
 */
export function splitPairs(items: GalleryRow[]): {
  pairs: Pair[];
  singles: GalleryRow[];
} {
  const byKey = new Map<string, { before?: GalleryRow; after?: GalleryRow }>();
  const singles: GalleryRow[] = [];

  for (const item of items) {
    const match = item.filename.match(SUFFIX);
    if (!match) {
      singles.push(item);
      continue;
    }

    const key = item.filename.replace(SUFFIX, "");
    const slot = byKey.get(key) ?? {};
    slot[match[1].toLowerCase() as "before" | "after"] = item;
    byKey.set(key, slot);
  }

  const pairs: Pair[] = [];

  for (const [key, slot] of byKey) {
    if (slot.before && slot.after) {
      pairs.push({
        key,
        before: slot.before,
        after: slot.after,
        title: baseTitle(slot.after.title),
        // The "after" caption tells the better story; fall back to before.
        caption: slot.after.caption ?? slot.before.caption,
        featured: slot.after.featured || slot.before.featured,
        sortOrder: Math.min(slot.before.sortOrder, slot.after.sortOrder),
      });
    } else {
      singles.push((slot.before ?? slot.after)!);
    }
  }

  pairs.sort((a, b) => a.sortOrder - b.sortOrder);
  singles.sort((a, b) => a.sortOrder - b.sortOrder);

  return { pairs, singles };
}
