// Intelligent natural-language search for the marketplace.
// Pure client-side: no API calls, no extra deps.
import { CITIES, type Post, type User, rankPostsForUser } from "./store";

// Synonym groups → expand any word to its related terms.
// Each key is the canonical category; values are matchable keywords / SEO terms.
const SYNONYMS: Record<string, string[]> = {
  jobs: ["job", "jobs", "vacancy", "vacancies", "hiring", "hire", "work", "employment", "career", "careers", "opening", "openings", "recruitment", "salary", "wanted", "staff", "intern", "internship", "freshers", "part time", "full time"],
  rent_home: ["rent", "rental", "home", "homes", "house", "houses", "flat", "flats", "apartment", "apartments", "pg", "room", "rooms", "1bhk", "2bhk", "3bhk", "studio", "hostel", "lease", "bachelor", "family"],
  rent_shop: ["shop", "shops", "commercial", "store", "stores", "showroom", "office", "godown", "warehouse", "kirana", "stall"],
  property: ["land", "lands", "plot", "plots", "open plot", "real estate", "property", "properties", "site", "sites", "acre", "acres", "villa", "farmhouse", "agriculture"],
  vehicle: ["bike", "bikes", "scooter", "scooty", "car", "cars", "vehicle", "vehicles", "auto", "activa", "honda", "yamaha", "bajaj", "suzuki", "hero", "royal enfield", "bullet", "second hand", "used"],
  service: ["plumber", "electrician", "carpenter", "mechanic", "service", "services", "repair", "technician", "tutor", "tuition", "maid", "cook", "driver", "painter", "cleaning"],
  food: ["food", "restaurant", "biryani", "chicken", "tiffin", "meals", "delivery", "broast", "cafe", "tea", "snacks", "catering", "bakery", "cake"],
  offers: ["offer", "offers", "discount", "sale", "deal", "deals", "combo", "free", "buy one"],
  electronics: ["mobile", "phone", "iphone", "samsung", "laptop", "tv", "fridge", "ac", "washing machine", "electronics", "headphone", "speaker"],
  furniture: ["furniture", "sofa", "bed", "table", "chair", "wardrobe", "almirah", "cot"],
};

const NEAR_ME_RE = /\b(near\s*me|nearby|around\s*me|close\s*by|in\s*my\s*area)\b/i;
const IN_CITY_RE = /\b(in|at|near)\s+([a-z][a-z\s]{2,30})$/i;

export type ParsedQuery = {
  raw: string;
  text: string; // query without location/intent words
  keywords: string[]; // expanded keywords
  category?: string; // canonical key
  cityId?: string;
  nearMe: boolean;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseQuery(raw: string): ParsedQuery {
  const original = raw;
  let text = normalize(raw);
  const nearMe = NEAR_me_check(original);
  if (nearMe) text = text.replace(/\b(near\s*me|nearby|around\s*me|close\s*by|in\s*my\s*area)\b/g, "").trim();

  // City detection — match any known city or nearby town in the text
  let cityId: string | undefined;
  for (const c of CITIES) {
    const hay = ` ${text} `;
    if (hay.includes(` ${c.name.toLowerCase()} `)) {
      cityId = c.id;
      text = text.replace(c.name.toLowerCase(), "").trim();
      break;
    }
    for (const town of c.nearby) {
      if (hay.includes(` ${town.toLowerCase()} `)) {
        cityId = c.id;
        text = text.replace(town.toLowerCase(), "").trim();
        break;
      }
    }
    if (cityId) break;
  }
  // "in <city>" tail fallback
  if (!cityId) {
    const m = original.match(IN_CITY_RE);
    if (m) {
      const candidate = normalize(m[2]);
      const found = CITIES.find((c) => candidate.includes(c.name.toLowerCase()));
      if (found) {
        cityId = found.id;
        text = text.replace(candidate, "").replace(/\b(in|at|near)\b/g, "").trim();
      }
    }
  }

  // Category + keyword expansion
  const tokens = text.split(/\s+/).filter(Boolean);
  let category: string | undefined;
  const expanded = new Set<string>(tokens);
  for (const [cat, words] of Object.entries(SYNONYMS)) {
    const hit = tokens.some((t) => words.includes(t)) ||
      words.some((w) => w.includes(" ") && text.includes(w));
    if (hit) {
      category = category ?? cat;
      words.forEach((w) => expanded.add(w));
    }
  }

  return {
    raw,
    text,
    keywords: Array.from(expanded),
    category,
    cityId,
    nearMe,
  };
}

// Workaround: separate function so the regex can be reused.
function NEAR_me_check(s: string): boolean {
  return NEAR_ME_RE.test(s);
}

export function smartSearch(posts: Post[], raw: string, user: User | null): {
  parsed: ParsedQuery;
  results: Post[];
} {
  const parsed = parseQuery(raw);
  if (!parsed.raw.trim()) return { parsed, results: [] };

  // Effective city: explicit city > near-me/user city
  const effectiveCityId = parsed.cityId ?? (parsed.nearMe ? user?.cityId : undefined);

  const tokens = parsed.text.split(/\s+/).filter((t) => t && t.length > 1);

  // Helper: does a post match the detected category?
  const matchesCategory = (p: Post): boolean => {
    if (!parsed.category) return true;
    const catWords = SYNONYMS[parsed.category] ?? [];
    const hay = `${p.category ?? ""} ${p.caption} ${(p.hashtags ?? []).join(" ")}`.toLowerCase();
    return catWords.some((w) => hay.includes(w));
  };

  // Hard-filter pool: when user explicitly states a city or category (or
  // "near me"), only consider posts that match those constraints. This stops
  // other cities / other categories from leaking into results.
  const pool = posts.filter((p) => {
    const cityOk = effectiveCityId ? p.cityId === effectiveCityId : true;
    const catOk = matchesCategory(p);
    return cityOk && catOk;
  });

  const scored = pool
    .map((p) => {
      const tags = Array.isArray(p.hashtags) ? p.hashtags.join(" ") : "";
      const hay = `${p.caption} ${p.category ?? ""} ${p.authorName} ${p.cityLabel} ${p.area ?? ""} ${tags}`.toLowerCase();
      let score = 0;

      for (const kw of parsed.keywords) {
        if (!kw) continue;
        if (hay.includes(kw)) score += kw.length > 3 ? 3 : 1;
      }
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 2;
      }
      if (parsed.category) score += 6; // already passed category gate
      if (effectiveCityId && p.cityId === effectiveCityId) score += 5;
      if (parsed.nearMe && user?.area && (p.area ?? "").toLowerCase() === user.area.toLowerCase()) {
        score += 4;
      }
      // Recency tiebreaker
      score += Math.min(2, (Date.now() - p.createdAt) < 1000 * 60 * 60 * 24 * 7 ? 1 : 0);

      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  let results = scored;

  // If a category+city query yields nothing, keep the strict pool (city+cat)
  // ordered by recency rather than falling back to unrelated posts.
  if (!results.length && (effectiveCityId || parsed.category)) {
    results = rankPostsForUser(pool, user);
  }

  // Pure free-text query (no city, no category): fall back to loose keyword scan
  if (!results.length && !effectiveCityId && !parsed.category && parsed.text) {
    results = posts.filter((p) => {
      const hay = `${p.caption} ${p.category ?? ""} ${p.cityLabel} ${p.area ?? ""} ${(p.hashtags ?? []).join(" ")}`.toLowerCase();
      return tokens.some((t) => hay.includes(t)) || hay.includes(parsed.text);
    });
  }

  return { parsed, results };
}

export const SMART_SUGGESTIONS = [
  "Jobs near me",
  "Rent homes in Hyderabad",
  "Shops for rent Warangal",
  "Lands or open plots in Vijayawada",
  "Bike for sale near me",
  "Electrician near me",
  "Offers in Khammam",
];
