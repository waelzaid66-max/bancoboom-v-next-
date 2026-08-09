# PASTE → REPLIT الآن — توحيد النسخة الكاملة (Wave8 SoT)

**من:** Chair / Cursor Engineering Council  
**إلى:** Replit Agent (العيون الأوضح على التشغيل · الشوتات · اللوجز)  
**تاريخ:** 2026-07-31  
**قرار المالك:** وحّدوا الفكر والنسخة · اجمعوا وثبّتوا أحدث نسخة بالكامل من الريبو  

---

## 0) أدوار حديدية (لا تفاوض)

| طرف | يملك | ممنوع |
|------|------|--------|
| **Cursor / المجلس** | الكود · الحراس · CI · صيانة `main` | تفويض صيانة لـ Replit |
| **Replit** | سحب SHA · تشغيل · شوتات · لوجز · بلاغ دقيق | **أي تعديل كود / commit / push / «إصلاح»** |
| **Copilot** | — | UNTRUSTED |

كلامك (Replit) = دليل تشغيل. أي باج → بلّغ Cursor. لا تصلح.

---

## 1) مصدر الحقيقة الواحد

| عنصر | قيمة |
|------|------|
| Remote | `origin` = `github.com/waelzaid66-max/banco-with-wael` |
| Branch | **`main` فقط** |
| **أمر النسخة** | `git reset --hard origin/main` بعد `fetch` |
| **Product floor (إلزامي)** | `a05190e` = Tranche D CLOSED |
| **CI-green floor (إلزامي)** | `6999915` = Mobile+Gates+API+Typecheck success stamp |
| Tip وقت الكتابة | يتحرك — بلّغ `SYNC_SHA` دائمًا (Director tip ≥ `3d4773b` / أحدث `main`) |
| section-guard | **90/90** (ليس 85) |

**تعريف MATCH:** بعد `reset --hard origin/main`، كلا الـ floors سلف لـ `HEAD`. لا فرع غير `main`.

---

## 2) أمر السحب — انسخ ونفّذ حرفيًا

```bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

git fetch origin main
git checkout main
git reset --hard origin/main

SYNC_SHA="$(git rev-parse HEAD)"
echo "SYNC_SHA=$SYNC_SHA"
git log -1 --oneline

# floors إلزامية (لا تفاوض) — tip قد يكون أحدث من 162ff56 بـ docs فقط
git merge-base --is-ancestor a05190eefb42a5869c482bc802bcaae72cdcef6b HEAD \
  || { echo "TRANCHE_D_FLOOR_OK=NO — STOP"; exit 1; }
git merge-base --is-ancestor 6999915c7dccaed69735ff2f6284656e226738c5 HEAD \
  || { echo "CI_GREEN_FLOOR_OK=NO — STOP"; exit 1; }
echo "FLOORS_OK=yes"
# الصق SYNC_SHA لـ Chair دائمًا

pnpm install --no-frozen-lockfile
# إن وُجد DATABASE_URL:
pnpm --filter @workspace/db run push-force || true

# حارس الموبايل (قراءة فقط)
cd artifacts/banco-mobile
pnpm run test:section-guard
# المتوقع: 90/90 PASS
```

ثم أعد تشغيل workflows من واجهة Replit (API :8080 · Expo Metro · **Web = banco-website** على :5000).

**أسرار (Owner — إلزامي بعد SEC-01/02):** المفاتيح لم تعد في `.replit` الملتزم. ضع في Replit Secrets:
- `PAYMENT_CONFIG_ENCRYPTION_KEY`
- `CLERK_SECRET_KEY` (يطابق publishable)
- live publishable فقط على بيئة إنتاج حقيقية — **ممنوع** `pk_live` و`EXPO_PUBLIC_DOMAIN=banco.today` في development shared

```bash
# Expo معاينة نظيفة
cd artifacts/banco-mobile
npx expo start --clear
```

---

## 3) عقد البيئة (لا تلمس الكود — أسرار فقط إن لزم)

**سبب الشاشات الفارغة السابق (مثبت):**

| عطل | السبب | القاعدة الآن |
|-----|--------|---------------|
| CORS / splash | `EXPO_PUBLIC_DOMAIN=banco.today` في shared | **ممنوع** في development shared — `dev-env.sh` من `$REPLIT_DEV_DOMAIN` |
| Black :5000 / 401 | placeholder `CLERK_SECRET_KEY` يغطي Secrets | السر الحقيقي `sk_test_*` من **Secret Store فقط** |
| 401 auth | `pk_live` في shared مع `sk_test` | `pk_live` و`banco.today` في **production فقط** |
| Clerk pair | mismatch instance | `evolving-magpie-43`: `<REDACTED_ROTATE_REQUIRED>…` ↔ نفس `sk_test_*` |

**لا تُعد إدخال** القيم الملوّثة في `[userenv.shared]`. راجع تقريرك: `reports/replit-env/2026-07-31-REPLIT-ENVIRONMENT-REPORT.md`.

---

## 4) ماذا دخل Wave8 على هذه النسخة (لازم تشوفه في الشوتات)

| Tranche | ماذا يثبت بالعين |
|---------|-------------------|
| A | Car: market/sort مرة واحدة على الشريط · Materials: أصل واحد |
| B | Discover: بوابات أقسام فقط · خريطة → `/section/maps` (مش RE) |
| C | لا applySaved ميت · Maps = §7 من 10 |
| D | حماية خريطة/هوية لكل عالم (حراس) · CI chain أخضر |

**10 عوالم:** Discover · Car · RE · Stay · Materials · Factories · Maps · Banks · Import · Accounts — كلها على `main`.

---

## 5) شوتات مطلوبة + مشاكل داتا دقيقة

صوّر والصق FAIL فقط عند كسر حقيقي:

| ID | الشاشة | ماذا تتأكد |
|----|--------|-------------|
| R01 | Feed | كروت + أسعار + صور |
| R02 | Discover | كروت الأقسام · Import · Banks · Explore map |
| R03 | Maps §7 | hub + world tabs · ليس soft-RE |
| R04 | Car | engines chips · header map · ليس Import |
| R05 | RE | PropertyHomeHeader · map |
| R06 | Stay | StaysHomeHeader أسود · map |
| R07 | Materials | origin مرة واحدة · map |
| R08 | Factories | header map (`section-header-map`) · facilities · FAB |
| R09 | Import hub | `/import` · Search Cars → `car?engine=import` |
| R10 | Banks | brochure فقط · لا directory حي |
| R11 | Profile/Accounts | جلسة Clerk تعمل (مش 401 موجة) |
| R12 | Search results | بيانات من **API المحلي** لا banco.today |

**داتا (مشكلة محتوى — ليست عطل اتصال بعد إصلاح env):**

- Seed الافتراضي ≈ **110** إعلان إنجليزي / مواقع مصر — ضعف عربي معروف.
- لا تُصلِح الـ seed من Replit. بلّغ: «محتوى عربي ناقص في الـ Feed».
- مسار عربي منفصل موجود في الريبو (`seedDemoListings`) — قرار Chair فقط.

**ضجيج متوقع (ليس FAIL):**

- تحذير Clerk «development keys»
- Expo Go push warnings
- Next :5000 CSR black جزئي بينما Expo :23351 يعمل (معروف §8.1)

**ضجيج حرج (FAIL فوري):**

- `secret-key-invalid` / Handshake failed  
- CORS إلى `banco.today` من معاينة Replit  
- موجة `401 UNAUTHORIZED` على `/api/v1/me` بعد تسجيل دخول  
- Discover map يفتح RE بدل `/section/maps`

الصق **80–120 سطر** Metro/API حمراء حرفيًا عند أي FAIL.

---

## 6) قالب رد Replit → Cursor (بعد السحب)

```text
## REPLIT → CURSOR (RUNTIME ONLY — NO CODE)

SYNC_SHA: …
TRANCHE_D_FLOOR: OK|FAIL
SECTION_GUARD: 90/90 PASS|FAIL
EXPO: OK|FAIL (port …)
API: OK|FAIL (port 8080 · sample /api/v1/search …)
WEB: banco-website OK|FAIL (port 5000 · not frozen banco-web)

ENV_CONTRACT: DOMAIN_FROM_REPLIT_DEV=yes|no · CLERK_PAIR=test/test|BROKEN · no_pk_live_in_committed_replit=yes|no · PAYMENT_KEY_IN_SECRETS=yes|no

SHOTS R01–R12: PASS/FAIL + links
# R03 Maps accent RED · R08 Factories header map visible
DATA: listing_count≈… · arabic_weak=yes|no · auth_session=OK|401

RED_LOGS (literal):
…

ASK_DIRECTOR: (سؤال تشغيل فقط — لا طلب صيانة كود)
```

---

## 7) توحيد الفكر مع الأيجنت الأقوى رؤية

- أنت ترى الشاشة واللوجز والداتا الحية أوضح.  
- Cursor يملك البايتات الخضراء على GitHub.  
- **نسخة واحدة:** `main@6999915` (+ أي tip أحدث على `main` بعد fetch — بلّغ SHA).  
- لا فرعين · لا 5cf0 · لا «تقريبًا».

— Chair · Wave8 Unify · 2026-07-31
