import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, User as UserIcon, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { z } from "zod";
import { CITIES, getUser, setUser } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Loka" },
      { name: "description", content: "Create your Loka account with mobile OTP." },
    ],
  }),
  component: AuthPage,
});

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile");
const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP");
const nameSchema = z.string().trim().min(2, "Name too short").max(60);

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"mobile" | "otp" | "details">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (getUser()) navigate({ to: "/" });
  }, [navigate]);

  const sendOtp = async () => {
    const ok = mobileSchema.safeParse(mobile);
    if (!ok.success) return toast.error(ok.error.issues[0].message);
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast.success("OTP sent — try 123456");
    setStep("otp");
  };

  const verifyOtp = () => {
    const ok = otpSchema.safeParse(otp);
    if (!ok.success) return toast.error(ok.error.issues[0].message);
    if (otp !== "123456") return toast.error("Invalid OTP. Use 123456 for demo.");
    setStep("details");
  };

  const createAccount = () => {
    const ok = nameSchema.safeParse(name);
    if (!ok.success) return toast.error(ok.error.issues[0].message);
    setUser({ name: name.trim(), mobile, cityId, verified: true });
    toast.success(`Welcome, ${name.split(" ")[0]}!`);
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-warm">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-primary opacity-30 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-16">
        <div className="mb-10">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-black text-primary-foreground shadow-glow">
            L
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Loka</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your city, your marketplace. Buy, sell, hire, connect — locally.
          </p>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          {step === "mobile" && (
            <div className="space-y-4">
              <Field icon={<Phone className="h-4 w-4" />} label="Mobile number">
                <div className="flex items-center">
                  <span className="pl-1 pr-2 text-sm text-muted-foreground">+91</span>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="h-11 w-full bg-transparent text-base font-medium focus:outline-none"
                  />
                </div>
              </Field>
              <PrimaryButton onClick={sendOtp} loading={sending}>
                Send OTP
              </PrimaryButton>
              <p className="text-center text-[11px] text-muted-foreground">
                By continuing you agree to our Terms & Privacy.
              </p>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">+91 {mobile}</span>
              </p>
              <Field icon={<ShieldCheck className="h-4 w-4" />} label="Enter OTP">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-11 w-full bg-transparent text-lg font-semibold tracking-[0.4em] focus:outline-none"
                />
              </Field>
              <PrimaryButton onClick={verifyOtp}>Verify OTP</PrimaryButton>
              <button
                onClick={() => setStep("mobile")}
                className="w-full text-center text-xs text-muted-foreground"
              >
                Change number
              </button>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <Field icon={<UserIcon className="h-4 w-4" />} label="Your name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                />
              </Field>
              <Field icon={<MapPin className="h-4 w-4" />} label="City / Village">
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="h-11 w-full bg-transparent text-base focus:outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.region}
                    </option>
                  ))}
                </select>
              </Field>
              <PrimaryButton onClick={createAccount}>
                Create account <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
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
      {loading ? "Sending…" : children}
    </button>
  );
}
