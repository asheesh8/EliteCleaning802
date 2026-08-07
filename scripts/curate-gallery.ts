/**
 * One-off curation pass for the client's first photo batch.
 *
 * The importer can only guess from filenames; this sets the titles,
 * captions, ordering, and which photos lead the site. Safe to re-run.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

type Entry = {
  title: string;
  caption?: string;
  category: string;
  featured?: boolean;
};

// Ordered: the strongest storytelling shots lead.
const curated: Record<string, Entry> = {
  "tub-before-after.png": {
    title: "Tub deep clean",
    caption: "Years of buildup, one visit. No harsh scratching, no damage to the finish.",
    category: "before-after",
    featured: true,
  },
  "oven-before.png": {
    title: "Oven — before",
    caption: "Baked-on grease on every surface, including the door glass.",
    category: "before-after",
  },
  "oven-during.png": {
    title: "Oven — treatment",
    caption: "Degreaser left to work. Rushing this step is why most ovens come out streaked.",
    category: "before-after",
  },
  "oven-after.png": {
    title: "Oven — after",
    caption: "Racks, walls, and door glass back to clean.",
    category: "before-after",
    featured: true,
  },
  "commercial-restroom-before-after.png": {
    title: "Commercial restroom",
    caption: "After-hours service for a business — fixtures, sinks, and floors reset before opening.",
    category: "before-after",
    featured: true,
  },
  "toilet-before.png": {
    title: "Toilet — before",
    caption: "Heavy mineral staining and neglect.",
    category: "before-after",
  },
  "toilet-after.png": {
    title: "Toilet — after",
    caption: "Fully sanitised, inside and out.",
    category: "before-after",
  },
  "banister-before.png": {
    title: "Banister — before",
    caption: "Spindles and handrail after a renovation.",
    category: "before-after",
  },
  "banister-after.png": {
    title: "Banister — after",
    caption: "Every spindle done by hand — the part most cleans skip.",
    category: "before-after",
    featured: true,
  },
  "hardwood-floors-before.png": {
    title: "Hardwood — before",
    caption: "Construction dust and residue ground into the finish.",
    category: "before-after",
  },
  "hardwood-floors-after.png": {
    title: "Hardwood — after",
    caption: "Post-renovation floor clean, ready to hand over.",
    category: "before-after",
  },
  "basement-stairs-before.png": {
    title: "Basement stairs — before",
    caption: "Debris and grime on every tread.",
    category: "before-after",
  },
  "basement-stairs-after.png": {
    title: "Basement stairs — after",
    caption: "Treads and landing cleared and washed down.",
    category: "before-after",
  },
  "airbnb-turnover.png": {
    title: "Airbnb turnover",
    caption: "Beds remade, linens fresh, surfaces staged — photographed before lock-up so the host knows it's guest-ready.",
    category: "work",
    featured: true,
  },
  "refrigerator-detailed.png": {
    title: "Refrigerator detailed",
    caption: "Shelves, drawers, and seals — an add-on worth every minute.",
    category: "work",
  },
  "refrigerator-interior.png": {
    title: "Refrigerator interior",
    caption: "Emptied, wiped down, and deodorised for a move-out.",
    category: "work",
  },
  "tub-shower-surround.png": {
    title: "Tub & shower surround",
    caption: "Soap scum and hard-water film off the full surround.",
    category: "work",
  },
  "bathroom-vanity.png": {
    title: "Bathroom reset",
    caption: "Vanity, mirror, and tile floor for a move-out clean.",
    category: "work",
  },
  "living-room-floors.png": {
    title: "Move-out living room",
    caption: "Empty-home clean done to inspection standard.",
    category: "work",
  },
  "entry-door.png": {
    title: "Entry door & glass",
    caption: "Glass, blinds, frame, and hardware — the details that get noticed.",
    category: "work",
  },
  "powder-room.png": {
    title: "Powder room",
    caption: "Small spaces still get the full treatment.",
    category: "work",
  },
  "kitchen-cabinets.png": {
    title: "Kitchen cabinetry",
    caption: "Cabinet fronts degreased, range and cooktop detailed.",
    category: "work",
  },
};

async function main() {
  const order = Object.keys(curated);
  let updated = 0;

  for (const [i, filename] of order.entries()) {
    const entry = curated[filename];
    const result = await prisma.galleryItem.updateMany({
      where: { filename },
      data: {
        title: entry.title,
        caption: entry.caption ?? null,
        category: entry.category,
        featured: entry.featured ?? false,
        published: true,
        sortOrder: i,
      },
    });
    if (result.count > 0) updated++;
    else console.log("not found:", filename);
  }

  const total = await prisma.galleryItem.count();
  const live = await prisma.galleryItem.count({ where: { published: true } });
  const featured = await prisma.galleryItem.count({ where: { featured: true } });
  console.log(`✓ curated ${updated} · ${live}/${total} published · ${featured} featured`);
  await prisma.$disconnect();
}

main();
