import Link from "next/link";
import { PageHeader, Panel, EmptyState, StatCard } from "@/components/crm/ui";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/lib/db";
import { relative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

const STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: "Needs a reply", tone: "warning" },
  answered: { label: "Answered", tone: "info" },
  closed: { label: "Closed", tone: "neutral" },
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      _count: { select: { messages: true } },
    },
  });

  // Default to the most recent conversation so the pane is never empty.
  const active =
    conversations.find((c) => c.id === id) ?? conversations[0] ?? null;

  const openCount = conversations.filter((c) => c.status === "open").length;
  const withContact = conversations.filter(
    (c) => c.visitorEmail || c.visitorPhone,
  ).length;

  return (
    <>
      <PageHeader
        title="Messages"
        description="Chats started from the website widget."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Needs a reply"
          value={openCount}
          sub={openCount > 0 ? "Someone is waiting" : "All caught up"}
          icon="chat"
          tone={openCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Conversations"
          value={conversations.length}
          sub="all time"
          icon="quote"
        />
        <StatCard
          label="Contact captured"
          value={withContact}
          sub="email or phone on file"
          icon="user"
          tone="neutral"
        />
      </div>

      {/* The widget is intentionally not wired yet — say so here rather
          than letting the owners wonder why nothing new arrives. */}
      <div className="mt-6 flex items-start gap-2.5 rounded-card border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
        <Icon name="bolt" className="mt-0.5 size-4 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-semibold">Chat widget is styled, not live.</span>{" "}
          The form and transcript below are real, but no assistant is
          connected and visitor messages aren&rsquo;t being saved yet. The
          conversations shown are samples.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* ---------- List ---------- */}
        <Panel title="Inbox" className="lg:max-h-[42rem] lg:overflow-hidden">
          {conversations.length === 0 ? (
            <EmptyState
              icon="chat"
              title="No conversations yet"
              body="Chats started from the website will land here."
            />
          ) : (
            <ul className="scrollbar-slim divide-y divide-[var(--border)] lg:max-h-[38rem] lg:overflow-y-auto">
              {conversations.map((c) => {
                const status = STATUS[c.status] ?? STATUS.open;
                const last = c.messages[c.messages.length - 1];
                const isActive = active?.id === c.id;

                return (
                  <li key={c.id}>
                    <Link
                      href={`/crew/messages?id=${c.id}`}
                      className={cn(
                        "flex gap-3 px-5 py-4 transition-colors",
                        isActive ? "bg-surface-2" : "hover:bg-surface-2",
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plum-100 text-2xs font-semibold text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                        {(c.visitorName ?? "??").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-text">
                            {c.visitorName ?? "Anonymous visitor"}
                          </span>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </span>
                        {last && (
                          <span className="mt-0.5 line-clamp-1 block text-xs text-text-muted">
                            {last.role === "visitor" ? "" : "You: "}
                            {last.body}
                          </span>
                        )}
                        <span className="mt-1 block text-2xs text-text-subtle">
                          {c._count.messages} messages ·{" "}
                          {relative(c.lastMessageAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* ---------- Transcript ---------- */}
        {active ? (
          <Panel
            title={active.visitorName ?? "Anonymous visitor"}
            description={`Started ${relative(active.startedAt)} · via ${active.source}`}
          >
            {/* Captured contact details */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border-base bg-surface-2 px-5 py-3.5 text-sm">
              {active.visitorEmail ? (
                <a
                  href={`mailto:${active.visitorEmail}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Icon name="mail" className="size-4" />
                  {active.visitorEmail}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-text-subtle">
                  <Icon name="mail" className="size-4" />
                  No email
                </span>
              )}

              {active.visitorPhone ? (
                <a
                  href={`tel:${active.visitorPhone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Icon name="phone" className="size-4" />
                  {active.visitorPhone}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-text-subtle">
                  <Icon name="phone" className="size-4" />
                  No phone
                </span>
              )}
            </div>

            <div className="scrollbar-slim max-h-[32rem] space-y-3 overflow-y-auto p-5">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "visitor" ? "justify-start" : "justify-end",
                  )}
                >
                  <div className="max-w-[80%]">
                    <p
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "visitor"
                          ? "rounded-bl-sm border border-border-base bg-surface text-text"
                          : "rounded-br-sm bg-brand text-on-brand",
                      )}
                    >
                      {m.body}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-2xs text-text-subtle",
                        m.role === "visitor" ? "text-left" : "text-right",
                      )}
                    >
                      {m.role === "visitor"
                        ? (active.visitorName ?? "Visitor")
                        : m.role === "staff"
                          ? "You"
                          : "Assistant"}{" "}
                      · {relative(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box — disabled until the widget is wired. */}
            <div className="border-t border-border-base p-4">
              <div className="flex items-end gap-2 opacity-60">
                <textarea
                  rows={2}
                  disabled
                  placeholder="Replying from the CRM needs the chat backend wired up first."
                  className="flex-1 resize-none rounded-field border border-border-strong bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  disabled
                  aria-label="Send reply"
                  className="grid size-11 shrink-0 place-items-center rounded-field bg-brand text-on-brand"
                >
                  <Icon name="send" className="size-4" />
                </button>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel>
            <EmptyState
              icon="chat"
              title="Nothing selected"
              body="Pick a conversation from the inbox to read the transcript."
            />
          </Panel>
        )}
      </div>
    </>
  );
}
