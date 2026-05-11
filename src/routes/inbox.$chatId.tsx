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
  const [text, setText] = useState("");
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

  const send = () => {
    const v = text.trim();
    if (!v) return;
    sendMessage(chat.id, v);
    setText("");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-warm">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-3 py-2.5 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/inbox" })}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
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
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
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

      <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-3 py-2 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="h-11 flex-1 rounded-full bg-secondary px-4 text-sm focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            aria-label="Send"
            className="tap flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
