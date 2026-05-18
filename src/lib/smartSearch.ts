// Strict intent-based local search: city + category must both match.
// No fuzzy fallback, no nearby city expansion, no unrelated suggestions.
import { CITIES, type Post, type User } from "./store";

// Canonical category -> matching keywords (used for both query detection
// and post-classification so the two sides agree).
const SYNONYMS: Record<string, string[]> = {
  jobs: ["job", "jobs", "vacancy", "vacancies", "hiring", "hire", "work", "employment", "career", "careers", "opening", "openings", "recruitment", "wanted", "staff", "intern", "internship", "freshers", "part time", "full time", "salary"],
  rent_home: ["rent house", "rent home", "rental home", "house for rent", "home for rent", "1bhk", "2bhk", "3bhk", "flat", "flats", "apartment", "apartments", "pg ", "hostel", "room for rent", "rooms for rent", "bachelor", "lease home"],
  rent_shop: ["shop for rent", "shops for rent", "commercial space", "showroom", "office for rent", "godown", "warehouse", "stall for rent", "rent shop", "rent office"],
  property: ["land", "lands", "plot", "plots", "open plot", "real estate", "property", "properties", "site for sale", "acre", "acres", "villa", "farmhouse", "agriculture land"],
  vehicle: ["bike", "bikes", "scooter", "scooty", "car", "cars", "vehicle", "vehicles", "auto", "activa", "yamaha", "bajaj", "suzuki", "royal enfield", "bullet", "second hand bike", "used car"],
  service: ["plumber", "electrician", "carpenter", "mechanic", "repair", "technician", "tutor", "tuition", "maid", "cook", "driver", "painter", "cleaning service"],
  food: ["restaurant", "restaurants", "biryani", "tiffin", "meals", "food delivery", "broast", "cafe", "snacks", "catering", "bakery", "cake"],
  events: ["event", "events", "function", "function hall", "wedding", "birthday", "party hall", "dj", "photographer"],
  electronics: ["mobile", "phone", "iphone", "samsung", "laptop", "tv ", "fridge", "ac ", "washing machine", "electronics", "headphone", "speaker"],
  furniture: ["furniture", "sofa", "bed ", "wardrobe", "almirah", "cot"],
};

const NEAR_ME_RE = /\b(near\s*me|nearby|around\s*me|close\s*by|in\s*my\s*area|my\s*city)\b/i;

export type ParsedQuery = {
  raw: string;
  text: string;
  category?: string;
  cityId?: string;     // explicit city typed by user
  nearMe: boolean;
};

function normalize(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

export function parseQuery(raw: string): ParsedQuery {
  const text = normalize(raw);
  const nearMe = NEAR_ME_RE.test(raw);

  // 1) Explicit city match (city name OR nearby town -> canonical city id)
  let cityId: string | undefined;
  for (const c of CITIES) {
    if (text.includes(` ${c.name.toLowerCase()} `)) { cityId = c.id; break; }
    for (const town of c.nearby) {
      if (text.includes(` ${town.toLowerCase()} `)) { cityId = c.id; break; }
    }
    if (cityId) break;
  }

  // 2) Category detection
  let category: string | undefined;
  for (const [cat, words] of Object.entries(SYNONYMS)) {
    const hit = words.some((w) => {
      const needle = w.trim();
      return needle.includes(" ") ? text.includes(` ${needle} `) || text.includes(` ${needle}`) : text.includes(` ${needle} `);
    });
    if (hit) { category = cat; break; }
  }

  return { raw, text: text.trim(), category, cityId, nearMe };
}

// Classify a post into a canonical category by matching against the same
// synonyms used for queries. Falls back to post.category when present.
function postCategory(p: Post): string | undefined {
  const hay = ` ${(p.category ?? "").toLowerCase()} ${p.caption.toLowerCase()} ${(p.hashtags ?? []).join(" ").toLowerCase()} `;
  for (const [cat, words] of Object.entries(SYNONYMS)) {
    if (words.some((w) => hay.includes(w.trim()))) return cat;
  }
  return undefined;
}

export function smartSearch(posts: Post[], raw: string, user: User | null): {
  parsed: ParsedQuery;
  results: Post[];
} {
  const parsed = parseQuery(raw);
  if (!parsed.raw.trim()) return { parsed, results: [] };

  // Effective city: explicit typed city > near-me/auto-detected user city
  const effectiveCityId = parsed.cityId ?? user?.cityId;

  // STRICT RULE: a category-style query must have a city to resolve against.
  // If we have neither category nor city, nothing to search for.
  if (!parsed.category && !parsed.cityId) {
    return { parsed, results: [] };
  }

  const results = posts.filter((p) => {
    // City gate — mandatory whenever we have one
    if (effectiveCityId && p.cityId !== effectiveCityId) return false;

    // Category gate — mandatory whenever query implies one
    if (parsed.category) {
      const pc = postCategory(p);
      if (pc !== parsed.category) return false;
    }
    return true;
  });

  // Newest first; no fallback, no nearby expansion, no unrelated results.
  results.sort((a, b) => b.createdAt - a.createdAt);
  return { parsed, results };
}

export const SMART_SUGGESTIONS = [
  "Jobs near me",
  "Rent homes in Hyderabad",
  "Shops for rent Warangal",
  "Lands or open plots in Vijayawada",
  "Bike for sale near me",
  "Electrician near me",
  "Restaurants in Khammam",
];
