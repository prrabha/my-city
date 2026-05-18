import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  CheckCheck,
  Heart,
  Home as HomeIcon,
  MessageCircle,
  MapPin,
} from "lucide-react";
import {
  markAllNotifsRead,
  markNotifRead,
  timeAgo,
  useNotifs,
  type Notification,
} from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Loka" },
      { name: "description", content: "Your nearby activity, messages and updates." },
    ],
  }),
  component: NotificationsPage,
});

function iconFor(type: Notification["type"]) {
  switch (type) {
    case "message":
      return <MessageCircle className="h-5 w-5" />;
    case "job":
      return <Briefcase className="h-5 w-5" />;
    case "rent":
      return <HomeIcon className="h-5 w-5" />;
    case "activity":
      return <Heart className="h-5 w-5" />;
    default:
      return <MapPin className="h-5 w-5" />;
  }
}

function NotificationsPage() {
  const router = useRouter();
  const list = useNotifs();
  const { fresh, older } = useMemo(() => {
    const day = 1000 * 60 * 60 * 24;
    const now = Date.now();
    return {
      fresh: list.filter((n) => now - n.ts < day),
      older: list.filter((n) => now - n.ts >= day),
    };
  }, [list]);

  // Auto-mark visible notifications as read after a brief moment
  useEffect(() => {
    const t = setTimeout(() => {
      if (list.some((n) => !n.read)) markAllNotifsRead();
    }, 1500);
    return () => clearTimeout(t);
  }, [list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpen = (n: Notification) => {
    markNotifRead(n.id);
    if (n.link) router.navigate({ to: n.link });
  };

  const Section = ({ title, items }: { title: string; items: Notification[] }) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-5">
        <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => onOpen(n)}
                className={`tap flex w-full items-start gap-3 rounded-2xl p-3 text-left shadow-soft transition ${
                  n.read ? "bg-card" : "bg-accent/40 ring-1 ring-primary/20"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                  {iconFor(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{n.title}</div>
                    <div className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(n.ts)}
                    </div>
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </div>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="min-h-dvh bg-gradient-warm pb-24">
      <header className="sticky top-0 z-30">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-3">
          <Link
            to="/"
            aria-label="Back"
            className="tap flex h-10 w-10 items-center justify-center rounded-full text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-base font-bold">Notifications</h1>
          {list.some((n) => !n.read) && (
            <button
              onClick={() => markAllNotifsRead()}
              className="tap inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-3 pt-4">
        {list.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-soft">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="mt-4 text-sm font-semibold">No notifications yet</div>
            <div className="mt-1 text-xs text-muted-foreground">
              We'll let you know when something happens near you.
            </div>
          </div>
        ) : (
          <>
            <Section title="New" items={fresh} />
            <Section title="Earlier" items={older} />
          </>
        )}
      </main>
    </div>
  );
}
