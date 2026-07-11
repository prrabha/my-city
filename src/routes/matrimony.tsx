import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  Cake,
  Ruler,
  Building2,
  IndianRupee,
  User,
} from "lucide-react";
import { BottomBar } from "@/components/BottomBar";
import { Avatar } from "@/components/Avatar";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/matrimony")({
  head: () => ({
    meta: [
      { title: "Matrimony — Find your life partner | Loka" },
      {
        name: "description",
        content:
          "Browse verified marriage profiles from your city. Trusted local matrimony matches on Loka.",
      },
      { property: "og:title", content: "Matrimony — Find your life partner | Loka" },
      {
        property: "og:description",
        content:
          "Browse verified marriage profiles from your city. Trusted local matrimony matches on Loka.",
      },
    ],
  }),
  component: MatrimonyPage,
});

type Profile = {
  id: string;
  memberId: string;
  name: string;
  age: number;
  gender: "Bride" | "Groom";
  city: string;
  state: string;
  occupation: string;
  education: string;
  height: string;
  religion: string;
  caste: string;
  income: string;
  bio: string;
  avatar?: string;
  photoVerified: boolean;
  idVerified: boolean;
  premium: boolean;
  lastActive: string;
};

const PROFILES: Profile[] = [
  {
    id: "m1",
    memberId: "M1234567",
    name: "Anushya Reddy",
    age: 28,
    gender: "Bride",
    city: "Hyderabad",
    state: "Telangana",
    occupation: "Analyst - Software Professional",
    education: "B.Tech, JNTU",
    height: "5'6\"",
    religion: "Hindu",
    caste: "Reddy",
    income: "15 Lakhs P.A",
    bio: "Family oriented, loves classical music and cooking. Looking for a caring, well-settled partner.",
    photoVerified: true,
    idVerified: true,
    premium: true,
    lastActive: "07:15 am",
  },
  {
    id: "m2",
    memberId: "M7654321",
    name: "Arjun Rao",
    age: 29,
    gender: "Groom",
    city: "Warangal",
    state: "Telangana",
    occupation: "Doctor (MBBS)",
    education: "MBBS, Kakatiya Medical",
    height: "5'10\"",
    religion: "Hindu",
    caste: "Brahmin",
    income: "18 Lakhs P.A",
    bio: "Working at a government hospital. Family values matter. Seeking a kind and educated life partner.",
    photoVerified: true,
    idVerified: true,
    premium: false,
    lastActive: "08:30 am",
  },
  {
    id: "m3",
    memberId: "M1122334",
    name: "Sneha Sharma",
    age: 24,
    gender: "Bride",
    city: "Khammam",
    state: "Telangana",
    occupation: "Teacher",
    education: "M.A. English",
    height: "5'3\"",
    religion: "Hindu",
    caste: "Sharma",
    income: "6 Lakhs P.A",
    bio: "Cheerful and simple. Enjoy reading and travel. Looking for an understanding partner.",
    photoVerified: true,
    idVerified: false,
    premium: false,
    lastActive: "Yesterday",
  },
  {
    id: "m4",
    memberId: "M4433221",
    name: "Vikram Kumar",
    age: 31,
    gender: "Groom",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    occupation: "Businessman",
    education: "MBA Finance",
    height: "5'11\"",
    religion: "Hindu",
    caste: "Kamma",
    income: "25 Lakhs P.A",
    bio: "Runs a family textile business. Family-oriented, non-drinker. Seeking a homely, educated bride.",
    photoVerified: false,
    idVerified: true,
    premium: true,
    lastActive: "09:00 am",
  },
  {
    id: "m5",
    memberId: "M5566778",
    name: "Fatima Begum",
    age: 25,
    gender: "Bride",
    city: "Hyderabad",
    state: "Telangana",
    occupation: "Bank Officer",
    education: "B.Com, Osmania",
    height: "5'5\"",
    religion: "Muslim",
    caste: "Sunni",
    income: "10 Lakhs P.A",
    bio: "Working in a reputed bank. Practicing, family-first. Looking for a well-educated groom.",
    photoVerified: true,
    idVerified: true,
    premium: true,
    lastActive: "10:20 am",
  },
  {
    id: "m6",
    memberId: "M8877665",
    name: "Rahul Verma",
    age: 28,
    gender: "Groom",
    city: "Khammam",
    state: "Telangana",
    occupation: "Civil Engineer",
    education: "B.Tech Civil",
    height: "5'9\"",
    religion: "Hindu",
    caste: "Verma",
    income: "12 Lakhs P.A",
    bio: "Working with a leading construction firm. Simple lifestyle. Seeking a caring life partner.",
    photoVerified: true,
    idVerified: false,
    premium: false,
    lastActive: "11:00 am",
  },
];

const GRADIENTS = [
  "linear-gradient(135deg, #f5e6d3 0%, #e8c4a2 100%)",
  "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
  "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
  "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
  "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
];

function MatrimonyPage() {
  const [filter, setFilter] = useState<"All" | "Bride" | "Groom">("All");
  const list = filter === "All" ? PROFILES : PROFILES.filter((p) => p.gender === filter);
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(list.length - 1, 0));
  const current = list[safeIndex] ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, list.length - 1));
  }, [list.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].screenX;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const onInterest = (name: string) => {
    toast.success(`Interest sent to ${name}`);
  };

  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-3">
          <Link
            to="/"
            aria-label="Back"
            className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">New Matches</h1>
            <p className="text-xs text-muted-foreground">
              {safeIndex + 1}/{list.length} profiles
            </p>
          </div>
          <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
        </div>

        <div className="mx-auto max-w-xl px-4 pb-3">
          <div className="flex gap-2">
            {(["All", "Bride", "Groom"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`tap rounded-full px-4 py-1.5 text-xs font-semibold ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-2">
        {current ? (
          <div
            ref={containerRef}
            className="relative select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-card">
              {/* Photo area */}
              <div
                className="relative aspect-[4/5] w-full"
                style={{ background: GRADIENTS[safeIndex % GRADIENTS.length] }}
              >
                {current.avatar ? (
                  <img
                    src={current.avatar}
                    alt={current.name}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Avatar src={null} name={current.name} size={120} className="shadow-lg" />
                  </div>
                )}

                {/* Top-right actions */}
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button className="tap grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                    <Heart className="h-5 w-5" />
                  </button>
                  <button className="tap grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                    <Crown className="h-5 w-5" />
                  </button>
                </div>

                {/* Photo verified badge */}
                {current.photoVerified && (
                  <div className="absolute bottom-4 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Photo Verified
                  </div>
                )}

                {/* Pagination dots */}
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Details card */}
              <div className="relative -mt-6 rounded-t-[2rem] bg-card px-5 pb-6 pt-5">
                {/* Verification row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {current.idVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      <BadgeCheck className="h-3 w-3" />
                      ID Verified
                    </span>
                  )}
                  {current.premium && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Crown className="h-3 w-3" />
                      Premium member
                    </span>
                  )}
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-2xl font-bold leading-tight">{current.name}</h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  {current.memberId} | Last active at {current.lastActive}
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span>
                      {current.age} Yrs, {current.height}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span>
                      {current.caste} - {current.religion}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <span>{current.occupation}</span>
                  </div>

                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                      <IndianRupee className="h-4 w-4 text-primary" />
                    </div>
                    <span>{current.income}</span>
                  </div>

                  <div className="flex items-center gap-3 text-foreground/90">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span>
                      {current.city} ({current.state})
                    </span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                  {current.bio}
                </p>

                {/* Action buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => onInterest(current.name)}
                    className="tap flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft"
                  >
                    <Heart className="h-4 w-4" fill="currentColor" />
                    Send Interest
                  </button>
                  <button className="tap rounded-full bg-secondary px-6 py-3 text-sm font-bold text-foreground">
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Side arrows */}
            <button
              onClick={goPrev}
              disabled={safeIndex === 0}
              aria-label="Previous profile"
              className="tap absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full bg-background p-2 shadow-lg disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              disabled={safeIndex === list.length - 1}
              aria-label="Next profile"
              className="tap absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 rounded-full bg-background p-2 shadow-lg disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-muted-foreground">
            No profiles match this filter.
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  );
}
