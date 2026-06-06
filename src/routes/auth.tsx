import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User as UserIcon, AtSign, Lock, ArrowRight } from "lucide-react";
import { z } from "zod";
import { CITIES, getUser, setUser } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Loka" },
      { name: "description", content: "Create your Loka account with a username and password." },
    ],
  }),
  component: AuthPage,
});

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3–30 chars: letters, numbers, underscore");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().trim().min(2, "Name too short").max(60);

// Map username -> synthetic email for Supabase Auth (email/password under the hood).
const usernameEmail = (u: string) => `${u}@loka.app`;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session && getUser()) navigate({ to: "/" });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSignup = async () => {
    const u = usernameSchema.safeParse(username);
    if (!u.success) return toast.error(u.error.issues[0].message);
    const n = nameSchema.safeParse(fullName);
    if (!n.success) return toast.error(n.error.issues[0].message);
    const p = passwordSchema.safeParse(password);
    if (!p.success) return toast.error(p.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");

    setBusy(true);
    try {
      // Pre-check username availability
      const { data: existing, error: checkErr } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", u.data)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) {
        toast.error("Username already taken, try another");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: usernameEmail(u.data),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username: u.data, full_name: fullName.trim() },
        },
      });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) {
          toast.error("Username already taken, try another");
          return;
        }
        throw error;
      }
      if (!data.session) {
        // Fallback (shouldn't happen with auto-confirm) — sign in immediately.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: usernameEmail(u.data),
          password,
        });
        if (signInErr) throw signInErr;
      }

      setUser({
        name: fullName.trim(),
        mobile: "",
        cityId: CITIES[0].id,
        verified: true,
      });
      toast.success(`Welcome, ${fullName.trim().split(" ")[0]}!`);
      navigate({ to: "/permissions" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create account";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    const u = usernameSchema.safeParse(username);
    if (!u.success) return toast.error("Enter a valid username");
    if (!password) return toast.error("Enter your password");
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameEmail(u.data),
        password,
      });
      if (error) {
        toast.error("Invalid username or password");
        return;
      }
      // Hydrate local profile from DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("user_id", data.user!.id)
        .maybeSingle();
      const existing = getUser();
      setUser({
        name: profile?.full_name || existing?.name || u.data,
        mobile: existing?.mobile || "",
        cityId: existing?.cityId || CITIES[0].id,
        verified: true,
        area: existing?.area,
        locationGranted: existing?.locationGranted,
      });
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not log in";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-warm">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-primary opacity-30 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-16">
        <div className="mb-8">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-black text-primary-foreground shadow-glow">
            L
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Loka</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your city, your marketplace. Buy, sell, hire, connect — locally.
          </p>
        </div>

        <div className="mb-4 flex rounded-2xl bg-secondary/60 p-1">
          <TabButton active={mode === "login"} onClick={() => setMode("login")}>
            Log in
          </TabButton>
          <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
            Sign up
          </TabButton>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          {mode === "signup" ? (
            <div className="space-y-4">
              <Field icon={<UserIcon className="h-4 w-4" />} label="Full name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ajjay Kumar"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <Field icon={<AtSign className="h-4 w-4" />} label="Username">
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ajjay123"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />} label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />} label="Confirm password">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <PrimaryButton onClick={handleSignup} loading={busy}>
                Sign up <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <p className="text-center text-[11px] text-muted-foreground">
                By continuing you agree to our Terms & Privacy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Field icon={<AtSign className="h-4 w-4" />} label="Username">
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ajjay123"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />} label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <PrimaryButton onClick={handleLogin} loading={busy}>
                Log in <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="flex items-center rounded-2xl border border-border bg-secondary/60 px-3 transition focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10">
        {children}
      </div>
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="tap inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
