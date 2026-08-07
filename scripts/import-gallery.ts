/**
 * Bulk gallery importer.
 *
 *   npm run gallery:import -- ~/Downloads/elite-photos
 *
 * Copies every image in the given folder into public/gallery, reads its
 * dimensions, and creates a GalleryItem row. Re-running is safe: files
 * already imported are skipped by filename.
 *
 * Written for the common case where the owners export their photos from
 * Facebook ("Download your information" → Posts → Photos) or just drop a
 * folder of images in. Everything imports unpublished, so nothing hits
 * the public site until it's approved in the CRM.
 */

import { readdir, readFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { imageSize } from "../src/lib/image-size";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const DEST = path.join(process.cwd(), "public", "gallery");

/** "beach-house-after.jpg" → "Beach House After" */
function titleFrom(filename: string) {
  const base = path.basename(filename, path.extname(filename));
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  // Facebook exports are all-numeric ids; those make useless titles.
  if (/^\d+$/.test(cleaned)) return "Elite Cleaning 802";

  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Before/after shots are the strongest content, so file them separately. */
function categoryFrom(filename: string) {
  return /before|after|b&a|ba\b/i.test(filename) ? "before-after" : "work";
}

async function main() {
  // Default to the project's drop folder so the common case is a bare
  // `npm run gallery:import` with nothing to remember.
  const source = process.argv[2] ?? "photos-inbox";

  const sourceDir = path.resolve(source.replace(/^~/, process.env.HOME ?? "~"));
  await mkdir(DEST, { recursive: true });

  let entries: string[];
  try {
    entries = await readdir(sourceDir);
  } catch {
    console.error(`Can't read folder: ${sourceDir}`);
    process.exit(1);
  }

  const images = entries.filter((f) =>
    EXTENSIONS.has(path.extname(f).toLowerCase()),
  );

  if (images.length === 0) {
    console.log(
      `No images found in ${sourceDir}\n` +
        "Drop photos into photos-inbox/ and run this again, or pass a folder:\n" +
        "  npm run gallery:import -- ~/Downloads/elite-photos",
    );
    return;
  }

  console.log(`Found ${images.length} images in ${sourceDir}`);

  const existing = new Set(
    (await prisma.galleryItem.findMany({ select: { filename: true } })).map(
      (r) => r.filename,
    ),
  );

  let imported = 0;
  let skipped = 0;
  let order = await prisma.galleryItem.count();

  for (const filename of images) {
    if (existing.has(filename)) {
      skipped++;
      continue;
    }

    const from = path.join(sourceDir, filename);
    const buffer = await readFile(from);
    const { width, height } = imageSize(buffer);

    await copyFile(from, path.join(DEST, filename));

    await prisma.galleryItem.create({
      data: {
        filename,
        title: titleFrom(filename),
        width,
        height,
        category: categoryFrom(filename),
        // Import hidden. The owners choose what the public sees.
        published: false,
        sortOrder: order++,
      },
    });

    imported++;
  }

  console.log(`✓ Imported ${imported} photos${skipped ? `, skipped ${skipped} already present` : ""}`);
  console.log("  They're unpublished — approve them at /crew/gallery");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
