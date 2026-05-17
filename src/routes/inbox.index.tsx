import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useChats, timeAgo } from "@/lib/store";

export const Route = createFileRoute("/inbox/")({
  head: () => ({ meta: [{ title: "Inbox — Loka" }] }),
  component: InboxList,
});

function InboxList() {
  const chats = useChats();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Messages</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl divide-y divide-border">
        {chats.length === 0 && (
          <div className="px-6 py-20 text-center text-sm text-muted-foreground">
            No conversations yet. Open any post and tap Message to start chatting.
          </div>
        )}
        {chats.map((c) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <Link
              key={c.id}
              to="/inbox/$chatId"
              params={{ chatId: c.id }}
              className="flex items-center gap-3 px-4 py-3 transition active:bg-secondary"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-lg font-semibold text-primary-foreground">
                {c.peerName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-sm font-semibold">{c.peerName}</div>
                  <div className="text-[11px] text-muted-foreground">{timeAgo(c.lastTs)}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">
                    {last ? (last.fromMe ? "You: " : "") + last.text : "Say hi 👋"}
                  </p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{c.peerCity}</div>
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
