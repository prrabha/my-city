// Intelligent natural-language search for the marketplace.
// Pure client-side: no API calls, no extra deps.
import { CITIES, type Post, type User, rankPostsForUser } from "./store";

// Synonym groups → expand any word to its related terms.
// Each key is the canonical category; values are matchable keywords / SEO terms.
const SYNONYMS: Record<string, string[]> = {
  jobs: ["job", "jobs", "vacancy", "vacancies", "hiring", "hire", "work", "employment", "career", "careers", "opening", "openings", "recruitment"],
  rent_home: ["rent", "rental", "home", "homes", "house", "houses", "flat", "flats", "apartment", "apartments", "pg", "room", "rooms", "1bhk", "2bhk", "3bhk"],
  rent_shop: ["shop", "shops", "commercial", "store", "stores", "showroom", "office", "lease"],
  property: ["land", "lands", "plot", "plots", "open plot", "real estate", "property", "properties", "site", "sites", "acre", "acres"],
  vehicle: ["bike", "bikes", "scooter", "car", "cars", "vehicle", "vehicles", "auto", "activa", "honda", "yamaha"],
  service: ["plumber", "electrician", "carpenter", "mechanic", "service", "services", "repair", "technician"],
  food: ["food", "restaurant", "biryani", "chicken", "tiffin", "meals", "delivery", "broast"],
  offers: ["offer", "offers", "discount", "sale", "deal", "deals", "combo"],
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

  const scored = posts
    .map((p) => {
      const hay = `${p.caption} ${p.category ?? ""} ${p.authorName} ${p.cityLabel} ${p.area ?? ""}`.toLowerCase();
      let score = 0;

      // Keyword hits
      for (const kw of parsed.keywords) {
        if (!kw) continue;
        if (hay.includes(kw)) score += kw.length > 3 ? 3 : 1;
      }
      // Category boost
      if (parsed.category && p.category) {
        const catWords = SYNONYMS[parsed.category] ?? [];
        if (catWords.some((w) => p.category!.toLowerCase().includes(w))) score += 6;
      }
      // City match
      if (effectiveCityId && p.cityId === effectiveCityId) score += 5;
      else if (effectiveCityId) score -= 2;

      // Near-me area boost
      if (parsed.nearMe && user?.area && (p.area ?? "").toLowerCase() === user.area.toLowerCase()) {
        score += 4;
      }

      // Fallback: raw substring of trimmed text
      if (score === 0 && parsed.text && hay.includes(parsed.text)) score += 2;

      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  // If a city was specified but nothing scored, fall back to ranked feed for that city
  const results = scored.length ? scored : rankPostsForUser(
    posts.filter((p) => !effectiveCityId || p.cityId === effectiveCityId),
    user,
  ).slice(0, 0); // empty when nothing — caller shows empty state

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
