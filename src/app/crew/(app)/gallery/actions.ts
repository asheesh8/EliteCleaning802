"use server";

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { imageSize } from "@/lib/image-size";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

export type UploadState = { ok: boolean; message?: string; count?: number };

/**
 * Accept photo uploads from the CRM.
 *
 * Files land in public/gallery and import unpublished, matching the CLI
 * importer — the owners decide what the public site shows.
 */
export async function uploadPhotos(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  await requireUser();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const usable = files.filter((f) => f.size > 0);

  if (usable.length === 0) {
    return { ok: false, message: "Choose at least one image." };
  }

  const dest = path.join(process.cwd(), "public", "gallery");
  await mkdir(dest, { recursive: true });

  let order = await prisma.galleryItem.count();
  let saved = 0;
  const rejected: string[] = [];

  for (const file of usable) {
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      rejected.push(`${file.name} (unsupported type)`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected.push(`${file.name} (over 8MB)`);
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { width, height } = imageSize(buffer);

    // Random filename avoids collisions and stops a client-supplied name
    // from ever being used as a path.
    const filename = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}${ext}`;
    await writeFile(path.join(dest, filename), buffer);

    await prisma.galleryItem.create({
      data: {
        filename,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled",
        width,
        height,
        published: false,
        sortOrder: order++,
      },
    });

    saved++;
  }

  revalidatePath("/crew/gallery");
  revalidatePath("/gallery");

  if (saved === 0) {
    return { ok: false, message: `Nothing uploaded. ${rejected.join(", ")}` };
  }

  return {
    ok: true,
    count: saved,
    message: rejected.length
      ? `Uploaded ${saved}. Skipped: ${rejected.join(", ")}`
      : `Uploaded ${saved} photo${saved === 1 ? "" : "s"}. Publish the ones you want live.`,
  };
}

export async function updateGalleryItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));

  await prisma.galleryItem.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "Untitled"),
      caption: String(formData.get("caption") ?? "") || null,
      category: String(formData.get("category") ?? "work"),
      featured: formData.get("featured") === "on",
    },
  });

  revalidatePath("/crew/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}
