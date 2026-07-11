import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Heart, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { BottomBar } from "@/components/BottomBar";
import { Avatar } from "@/components/Avatar";
import { useState } from "react";
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
  name: string;
  age: number;
  gender: "Bride" | "Groom";
  city: string;
  occupation: string;
  education: string;
  height: string;
  religion: string;
  bio: string;
  avatar?: string;
};

const PROFILES: Profile[] = [
  {
    id: "m1",
    name: "Priya Reddy",
    age: 26,
    gender: "Bride",
    city: "Hyderabad",
    occupation: "Software Engineer",
    education: "B.Tech, JNTU",
    height: "5'4\"",
    religion: "Hindu · Reddy",
    bio: "Family oriented, loves classical music and cooking. Looking for a caring, well-settled partner.",
  },
  {
    id: "m2",
    name: "Arjun Rao",
    age: 29,
    gender: "Groom",
    city: "Warangal",
    occupation: "Doctor (MBBS)",
    education: "MBBS, Kakatiya Medical",
    height: "5'10\"",
    religion: "Hindu · Brahmin",
    bio: "Working at a government hospital. Family values matter. Seeking a kind and educated life partner.",
  },
  {
    id: "m3",
    name: "Sneha Sharma",
    age: 24,
    gender: "Bride",
    city: "Khammam",
    occupation: "Teacher",
    education: "M.A. English",
    height: "5'3\"",
    religion: "Hindu · Sharma",
    bio: "Cheerful and simple. Enjoy reading and travel. Looking for an understanding partner.",
  },
  {
    id: "m4",
    name: "Vikram Kumar",
    age: 31,
    gender: "Groom",
    city: "Vijayawada",
    occupation: "Businessman",
    education: "MBA Finance",
    height: "5'11\"",
    religion: "Hindu · Kamma",
    bio: "Runs a family textile business. Family-oriented, non-drinker. Seeking a homely, educated bride.",
  },
  {
    id: "m5",
    name: "Fatima Begum",
    age: 25,
    gender: "Bride",
    city: "Hyderabad",
    occupation: "Bank Officer",
    education: "B.Com, Osmania",
    height: "5'5\"",
    religion: "Muslim · Sunni",
    bio: "Working in a reputed bank. Practicing, family-first. Looking for a well-educated groom.",
  },
  {
    id: "m6",
    name: "Rahul Verma",
    age: 28,
    gender: "Groom",
    city: "Khammam",
    occupation: "Civil Engineer",
    education: "B.Tech Civil",
    height: "5'9\"",
    religion: "Hindu · Verma",
    bio: "Working with a leading construction firm. Simple lifestyle. Seeking a caring life partner.",
  },
];

function MatrimonyPage() {
  const [filter, setFilter] = useState<"All" | "Bride" | "Groom">("All");
  const list = filter === "All" ? PROFILES : PROFILES.filter((p) => p.gender === filter);

  const onInterest = (name: string) => {
    toast.success(`Interest sent to ${name}`);
  };

  return (
    <div className="min-h-dvh bg-background pb-32">
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
            <h1 className="text-lg font-bold leading-tight">Matrimony</h1>
            <p className="text-xs text-muted-foreground">Verified marriage profiles near you</p>
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
        <div className="flex flex-col gap-4">
          {list.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-3xl bg-card p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <Avatar src={p.avatar} name={p.name} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h2 className="truncate text-base font-bold">{p.name}</h2>
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.age} yrs · {p.height} · {p.gender}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{p.city}</span>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {p.religion.split("·")[0].trim()}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{p.occupation}</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{p.education}</span>
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-foreground/85">{p.bio}</p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onInterest(p.name)}
                  className="tap flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-soft"
                >
                  <Heart className="h-4 w-4" fill="currentColor" /> Send Interest
                </button>
                <button className="tap rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
                  View
                </button>
              </div>
            </article>
          ))}
          <div className="py-6 text-center text-xs text-muted-foreground">
            More profiles coming soon 💐
          </div>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
