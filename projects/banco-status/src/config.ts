import type { Issue } from "./types";

// ─── Configure your BANCO API base URL here ───────────────────────────────────
// In production: set to https://banco.autos  or  https://banco.today/api
// In Replit dev: set to your $REPLIT_DEV_DOMAIN
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://banco.autos";

export const REFRESH_INTERVAL_MS = 60_000; // 1 minute

// ─── Static known issues (from intelligence reports) ─────────────────────────
// These are updated manually or via CI from reports/intelligence/*.md
export const KNOWN_ISSUES: Issue[] = [
  {
    id: "pio-001",
    severity: "critical",
    titleAr: "Clerk Secret Key غير صالح — تسجيل الدخول معطل على الويب",
    titleEn: "Clerk Secret Key invalid — web sign-in broken",
    status: "investigating",
    date: "2026-07-31",
    affectedServices: ["web", "api"],
  },
  {
    id: "pio-002",
    severity: "critical",
    titleAr: "معاينة الموبايل على الويب تعرض شاشة بيضاء",
    titleEn: "Expo web preview shows blank white screen",
    status: "investigating",
    date: "2026-07-31",
    affectedServices: ["mobile"],
  },
  {
    id: "pio-003",
    severity: "high",
    titleAr: "زر Google OAuth ميت على Admin و Dealer OS",
    titleEn: "Google OAuth button dead on Admin + Dealer OS",
    status: "open",
    date: "2026-07-31",
    affectedServices: ["admin", "dealer"],
  },
  {
    id: "pio-004",
    severity: "high",
    titleAr: "Facets ترجع 0 فئات رغم وجود 110 إعلان",
    titleEn: "Facets API returns 0 categories despite 110 listings",
    status: "open",
    date: "2026-07-31",
    affectedServices: ["api", "mobile"],
  },
  {
    id: "pio-005",
    severity: "high",
    titleAr: "الموقع الرسمي (banco-website) لا يُبنى ولا يُنشر",
    titleEn: "Canonical website (banco-website) never built or deployed",
    status: "open",
    date: "2026-07-31",
    affectedServices: ["web"],
  },
  {
    id: "pio-006",
    severity: "medium",
    titleAr: "50 branch غير مدمجة — أكبرها 190 commit أمام main",
    titleEn: "50 unmerged branches — largest is 190 commits ahead of main",
    status: "open",
    date: "2026-07-31",
    affectedServices: [],
  },
];
