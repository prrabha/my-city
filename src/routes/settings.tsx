import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Moon,
  Bell,
  Globe,
  Lock,
  MessageSquare,
  Star,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { setUser } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Loka" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const logout = () => {
    setUser(null);
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-dvh bg-[#f5f0e6] pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-3 py-3">
        <button
          onClick={() => (history.length > 1 ? history.back() : navigate({ to: "/" }))}
          aria-label="Back"
          className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Settings</h1>
      </header>

      {/* Preferences */}
      <section className="mx-4 mt-2 overflow-hidden rounded-3xl bg-white shadow-soft">
        <Row
          icon={<Moon className="h-5 w-5 text-purple-500" />}
          tint="bg-purple-100"
          label="Dark Mode"
          right={<Switch on={dark} onChange={toggleDark} />}
        />
        <Row
          icon={<Bell className="h-5 w-5 text-amber-500" />}
          tint="bg-orange-100"
          label="Notifications"
          right={<Switch on={notif} onChange={() => setNotif((v) => !v)} />}
        />
        <Row
          icon={<Globe className="h-5 w-5 text-sky-500" />}
          tint="bg-sky-100"
          label="Language"
          right={
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              English <ChevronRight className="h-4 w-4" />
            </span>
          }
          last
        />
      </section>

      {/* Support */}
      <section className="mx-4 mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
        <RowLink
          icon={<Lock className="h-5 w-5 text-amber-600" />}
          tint="bg-purple-100"
          label="Privacy & Security"
          to="/settings"
        />
        <RowLink
          icon={<MessageSquare className="h-5 w-5 text-slate-600" />}
          tint="bg-emerald-100"
          label="Help & Support"
          to="/settings"
        />
        <RowLink
          icon={<Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
          tint="bg-emerald-100"
          label="Rate the App"
          to="/settings"
        />
        <button
          onClick={logout}
          className="tap flex w-full items-center gap-3 px-4 py-4 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <LogOut className="h-5 w-5 text-red-500" />
          </div>
          <span className="flex-1 text-base font-bold text-red-500">Logout</span>
          <ChevronRight className="h-5 w-5 text-red-400" />
        </button>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">Loka · v1.0</p>
    </div>
  );
}

function Row({
  icon,
  tint,
  label,
  right,
  last,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-4 ${
        last ? "" : "border-b border-border/60"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <span className="flex-1 text-base font-bold">{label}</span>
      {right}
    </div>
  );
}

function RowLink({
  icon,
  tint,
  label,
  to,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="tap flex items-center gap-3 border-b border-border/60 px-4 py-4"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <span className="flex-1 text-base font-bold">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        on ? "bg-orange-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
