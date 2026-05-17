import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { markChatRead, sendMessage, useChats } from "@/lib/store";
import { ChatInputBar } from "@/components/ChatInputBar";

export const Route = createFileRoute("/inbox/$chatId")({
  head: () => ({ meta: [{ title: "Chat — Loka" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const chats = useChats();
  const chat = chats.find((c) => c.id === chatId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat && chat.unread > 0) markChatRead(chat.id);
  }, [chat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length]);

  if (!chat) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <button
          onClick={() => navigate({ to: "/inbox" })}
          className="rounded-full bg-secondary px-4 py-2 text-sm"
        >
          Back to inbox
        </button>
      </div>
    );
  }

  const send = (v: string) => {
    const t = v.trim();
    if (!t) return;
    sendMessage(chat.id, t);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-warm">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-3 py-2.5 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/inbox" })}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
          {chat.peerName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{chat.peerName}</div>
          <div className="text-[11px] text-muted-foreground">{chat.peerCity} · online</div>
        </div>
        <a
          href="tel:+919000000000"
          aria-label="Call"
          className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
        >
          <Phone className="h-5 w-5" />
        </a>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {chat.messages.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Say hi to {chat.peerName.split(" ")[0]} 👋
            </div>
          )}
          {chat.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-soft ${
                m.fromMe
                  ? "ml-auto bg-gradient-primary text-primary-foreground rounded-br-md"
                  : "mr-auto bg-card text-foreground rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>

      {/* Spacer so messages aren't covered by fixed composer */}
      <div aria-hidden className="h-24" />

      <ChatInputBar
        placeholder="Message…"
        onSend={({ text, attachments, voice }) => {
          if (text) send(text);
          if (attachments.length) {
            send(attachments.map((a) => `📎 ${a.file.name}`).join("\n"));
          }
          if (voice) send("🎤 Voice message");
        }}
      />
    </div>
  );
}
