"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Website chat widget — presentation only.
 *
 * Deliberately NOT wired to a backend or an assistant. Everything below
 * is local state so the flow can be demoed and styled; the seams for
 * wiring are marked TODO. The `Conversation` / `ChatMessage` models
 * already exist, and the CRM transcript view reads them, so hooking this
 * up later is a server action rather than a migration.
 */

type Message = {
  id: number;
  role: "visitor" | "assistant";
  body: string;
};

type Step = "intro" | "chat";

const OPENERS = [
  "How much for a 3-bed house?",
  "Do you do Airbnb turnovers?",
  "Can you come this week?",
  "What's included in a deep clean?",
];

// Stand-in copy so the thread reads naturally while unwired.
const PLACEHOLDER_REPLY =
  "Thanks! Laura or Lisa will follow up shortly — usually within a couple of hours during business hours.";

export function ChatWidget({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    if (step !== "chat") return;
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, step]);

  // Escape closes the panel, matching every other dismissible surface.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function startChat(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!contact.name.trim()) next.name = "We'd like to know who we're talking to";
    if (!contact.email.trim() && !contact.phone.trim()) {
      next.email = "Add an email or a phone number so we can reply";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO(wiring): create a Conversation row here and keep its id.
    setStep("chat");
    setMessages([
      {
        id: 1,
        role: "assistant",
        body: `Hi ${contact.name.split(" ")[0]} — thanks for reaching out. What can we help with?`,
      },
    ]);
  }

  function send(body: string) {
    const text = body.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "visitor", body: text },
    ]);
    setDraft("");

    // TODO(wiring): persist the message, then stream a real reply.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, role: "assistant", body: PLACEHOLDER_REPLY },
      ]);
    }, 700);
  }

  return (
    <>
      {/* ---------- Launcher ---------- */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat" : "Chat with us"}
        className={cn(
          "fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full",
          "bg-brand text-on-brand shadow-e3 transition-all duration-300",
          "hover:scale-105 active:scale-95",
          // Slide out of the way when the panel is up on small screens.
          open && "scale-0 opacity-0 sm:scale-100 sm:opacity-100",
        )}
      >
        <Icon name={open ? "close" : "chat"} className="size-6" />
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-bg bg-fern-500" />
        )}
      </button>

      {/* ---------- Panel ---------- */}
      <div
        id="chat-panel"
        ref={panelRef}
        role="dialog"
        aria-label="Chat with Elite Cleaning 802"
        aria-modal="false"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-surface shadow-e3 transition-all duration-300",
          // Full-screen sheet on phones, floating card from sm up.
          "inset-x-0 bottom-0 top-0 rounded-none",
          "sm:inset-auto sm:bottom-24 sm:right-5 sm:top-auto sm:h-[min(34rem,calc(100dvh-8rem))] sm:w-[23rem] sm:rounded-card sm:border sm:border-border-base",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border-base bg-plum-800 px-4 py-3.5 text-cream-50">
          <Image
            src={brand.logo}
            alt=""
            width={40}
            height={40}
            className="size-9 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{brand.name}</p>
            <p className="flex items-center gap-1.5 text-2xs text-plum-300">
              <span className="size-1.5 rounded-full bg-fern-400" />
              Usually replies within a couple of hours
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="grid size-8 shrink-0 place-items-center rounded-full text-plum-200 transition-colors hover:bg-plum-700 hover:text-cream-50"
          >
            <Icon name="close" className="size-4" />
          </button>
        </header>

        {step === "intro" ? (
          /* ---------- Contact capture ---------- */
          <form
            onSubmit={startChat}
            className="flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-slim p-5"
          >
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                Let&rsquo;s get you a quote.
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                Tell us how to reach you and ask away — a real person answers.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                Your name
              </span>
              <input
                value={contact.name}
                onChange={(e) =>
                  setContact((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full rounded-field border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25"
              />
              {errors.name && (
                <span className="mt-1.5 block text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.name}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                Email
              </span>
              <input
                type="email"
                value={contact.email}
                onChange={(e) =>
                  setContact((c) => ({ ...c, email: e.target.value }))
                }
                placeholder="jane@example.com"
                autoComplete="email"
                className="w-full rounded-field border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25"
              />
              {errors.email && (
                <span className="mt-1.5 block text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.email}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                Phone{" "}
                <span className="font-normal text-text-subtle">(optional)</span>
              </span>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) =>
                  setContact((c) => ({ ...c, phone: e.target.value }))
                }
                placeholder="(802) 555-0100"
                autoComplete="tel"
                className="w-full rounded-field border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </label>

            <button
              type="submit"
              className="mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-field bg-brand text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
            >
              Start chatting
              <Icon name="arrow" className="size-4" />
            </button>

            <p className="text-center text-2xs leading-relaxed text-text-subtle">
              Prefer to call?{" "}
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="font-semibold text-brand hover:underline"
              >
                {phone}
              </a>
            </p>
          </form>
        ) : (
          /* ---------- Thread ---------- */
          <>
            <div
              ref={threadRef}
              className="scrollbar-slim flex-1 space-y-3 overflow-y-auto bg-surface-2 p-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "visitor" ? "justify-end" : "justify-start",
                  )}
                >
                  <p
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "visitor"
                        ? "rounded-br-sm bg-brand text-on-brand"
                        : "rounded-bl-sm border border-border-base bg-surface text-text",
                    )}
                  >
                    {m.body}
                  </p>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="pt-1">
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-text-subtle">
                    Common questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OPENERS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-plum-300 hover:text-text"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex items-end gap-2 border-t border-border-base bg-surface p-3"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter makes a new line.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                aria-label="Message"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-field border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="grid size-11 shrink-0 place-items-center rounded-field bg-brand text-on-brand transition-all hover:bg-brand-hover disabled:opacity-40"
              >
                <Icon name="send" className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
