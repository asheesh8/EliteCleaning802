"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadPhotos, type UploadState } from "@/app/crew/(app)/gallery/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || count === 0}>
      {pending
        ? "Uploading…"
        : count > 0
          ? `Upload ${count} photo${count === 1 ? "" : "s"}`
          : "Upload"}
    </Button>
  );
}

const initial: UploadState = { ok: false };

export function PhotoUploader() {
  const [state, action] = useActionState(uploadPhotos, initial);
  const [count, setCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!inputRef.current) return;

    // DataTransfer files can be assigned straight onto the input, which
    // keeps the plain <form> submission path working.
    inputRef.current.files = e.dataTransfer.files;
    setCount(e.dataTransfer.files.length);
  }

  return (
    <form action={action} className="px-5 py-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-brand bg-plum-50 dark:bg-plum-950/40"
            : "border-border-strong bg-surface-2 hover:border-plum-300",
        )}
      >
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
          <Icon name="image" className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium text-text">
          {count > 0
            ? `${count} photo${count === 1 ? "" : "s"} ready`
            : "Drop photos here, or click to choose"}
        </p>
        <p className="mt-1 text-xs text-text-subtle">
          JPG, PNG, WebP or GIF · up to 8MB each · select as many as you like
        </p>

        <input
          ref={inputRef}
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setCount(e.target.files?.length ?? 0)}
        />
      </div>

      {state.message && (
        <p
          role="status"
          className={cn(
            "mt-4 rounded-field px-3.5 py-2.5 text-sm font-medium",
            state.ok
              ? "bg-fern-100 text-fern-800 dark:bg-fern-900 dark:text-fern-300"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          )}
        >
          {state.message}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-text-subtle">
          Photos upload hidden. Publish the ones you want on the website.
        </p>
        <SubmitButton count={count} />
      </div>
    </form>
  );
}
