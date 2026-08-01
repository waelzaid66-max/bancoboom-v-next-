# BANCO — تقرير المشكلات الشامل (Master Issues Report)
**التاريخ:** 2026-07-31  
**المصدر:** Replit Agent — تحليل كامل للمونوريبو عبر جلسات متعددة  
**الجمهور:** فريق Cursor / waelzaid66-max  
**التقرير العربي التفصيلي:** `reports/BANCO_FULL_READ_ONLY_AUDIT_2026-07-30_AR.md`

---

## 🔴 P0 — مشكلات تمنع التشغيل الكامل

### P0-ENV-01 — ثلاثة أخطاء في `.replit` تسبب شاشات فارغة وCORS
**الحالة:** ✅ تم الإصلاح في 2026-07-31 (commit `a5390bc`)

| المشكلة | السبب | الأثر |
|---------|-------|-------|
| `EXPO_PUBLIC_DOMAIN="banco.today"` في `[userenv.shared]` | كل API calls تذهب للـ production → CORS block | شاشة سبلاش لا تنتهي |
| `CLERK_SECRET_KEY="placeholder"` في `[userenv.development]` | يطغى على الـ secret الحقيقي في encrypted store | Clerk SSR يفشل → شاشة سوداء على Next.js |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."` في `[userenv.shared]` | pk_live + sk_test = mismatch → 401 على كل endpoint | كل authenticated requests تفشل |

**قاعدة حرجة:** قيم `.replit [userenv.*]` تطغى على الـ encrypted secrets store — لا تضع placeholder keys أبداً في `.replit`.

---

### P0-AUTH-01 — Clerk sign-in هو state machine وليس boolean
**الملف:** `artifacts/banco-mobile/` و `artifacts/banco-web/`

التنفيذ الذي يعالج `status === "complete"` فقط يحجب جميع المستخدمين الحقيقيين. الـ live tenant يطلب `needs_second_factor` بعد الباسورد حتى لو `sign_in.second_factor.required: false` في الـ environment flags.

**Statuses الإلزامية:**
- `needs_second_factor` → `email_code` / `phone_code` / TOTP / backup-codes
- `needs_new_password`
- `needs_first_factor`
- `needs_identifier`

**قاعدة حرجة:** Social providers (Google/Facebook/Apple) معطّلة في الـ live tenant — الـ `social` dictionary فارغ. أزرار لا تعمل = لا ترسمها.

---

### P0-SECRETS-01 — `PAYMENT_CONFIG_ENCRYPTION_KEY` نص صريح في `.replit`
**الخطورة:** عالية  
**الموقع:** `.replit:129-135`

مفتاح تشفير إعدادات Paymob موجود كنص في ملف المشروع. أي شخص يصل للريبو أو نسخة منه يصل لهذا المفتاح. يجب نقله لـ Replit encrypted secrets مع خطة migration للبيانات المشفرة حالياً.

---

### P0-DEPLOY-01 — موقعان (`banco-web` vs `banco-website`) — Preview يعرض الخطأ
**الموقع:** `.replit:32-35`, `artifacts/banco-web/FROZEN.md`, `deploy/aws/Dockerfile.banco-web`

- `.replit` يشغّل `@workspace/banco-web` (المجمّد) على port 5000
- `banco-website` هو الموقع الرسمي لكن CI/Docker ما زال يبني `banco-web`
- Preview يعرض موقعاً مختلفاً عما يُنشر فعلياً

---

## 🟠 P1 — مشكلات أمنية وبنيوية حرجة

### P1-SEC-01 — ثغرات dependencies (10 سجلات High)
| الحزمة | CVEs | الإصلاح |
|--------|------|---------|
| `next@15.5.20` | 3 CVEs High | → `15.5.21` |
| `js-yaml@4.2.0` | 1 CVE High | → `4.3.0` |
| `brace-expansion` | عدة نسخ | تحديث الـ parent |

لا يوجد Critical. استخدم `pnpm why` لتحديد الـ parents قبل التحديث.

---

### P1-SEC-02 — Upload URLs مشتقة من Proxy Headers
**الموقع:** `artifacts/api-server/src/controllers/uploadController.ts:114-120`

الرابط العام يُبنى من `x-forwarded-proto` و `x-forwarded-host`. إذا سمح الـ proxy بـ forged headers → رابط وسائط على host غير موثوق.

**الإصلاح:** استخدم canonical URL من الإعدادات أو تحقق من host مقابل allowlist.

---

### P1-SEC-03 — Payment provider يسجل response body
**الموقع:** `artifacts/api-server/src/lib/paymentProvider.ts:211-214` و `:479-486`

يسجل أول 500 حرف من رد رفض Paymob. ردود بوابة الدفع قد تحتوي معرفات حساسة.

**الإصلاح:** سجّل status + correlation ID فقط. نقّح response body.

---

### P1-SEC-04 — Payment callback URL يقبل أي HTTPS base URL
**الموقع:** `artifacts/api-server/src/lib/paymentProvider.ts:91-97`

`PUBLIC_API_BASE_URL` يُقبل طالما هو HTTPS — لا يوجد allowlist للنطاقات المملوكة.

**الإصلاح:** allowlist للنطاقات (`banco.today`, `banco.autos`, `banco.deals`).

---

### P1-NODE-01 — Node 20 على Replit مقابل Node 24 في CI/Docker
**الدليل:** `.replit:1` = nodejs-20, `Dockerfile:18-24` = node:24, `.github/workflows/ci.yml` = node 24

نجاح CI لا يضمن نفس السلوك على Replit. تطابق الـ toolchain بين البيئات.

---

### P1-CODEGEN-01 — OpenAPI codegen بدون freshness gate في CI
**الموقع:** `lib/api-spec/package.json`

يمكن تعديل OpenAPI spec ونسيان إعادة توليد client/zod. CI لا يفحص clean diff.

**الإصلاح:** CI step يعيد `orval` ثم يفشل إذا ظهر `git diff`.

---

### P1-TEST-01 — لا توجد E2E tests للمسارات الحرجة
**التغطية الحالية:**
- ✅ API tests (78 ملف) على PostgreSQL حقيقي في CI
- ✅ Mobile guard tests (79 ملف)
- ❌ admin-os, dealer-os, landing, banco-web, banco-website: **لا توجد tests**
- ❌ لا يوجد Playwright/Cypress/Detox

**المسارات بلا تغطية:** sign-up/sign-in, إنشاء إعلان, رفع صور, dealer/admin flows, الدفع, webhook.

---

## 🟡 P2 — مشكلات UX وبيانات وأداء

### P2-ANDROID-01 — Tab bar icons تختفي على Android عند elevation=0
**الموقع:** `app/(tabs)/_layout.tsx`

`position: absolute` + `elevation: 0` → react-native-screens تُركّب فوق الـ bar → icons تخفت والـ taps لا تُسجّل.

**القاعدة:** rectangular bar = drawable-free (no border/bg on tabBarStyle) + `elevation: isAndroid ? 8 : 0`. rounded capsule = opaque bg + borderRadius + elevation **مطلوب** أو Android لا يرسم shadow.

---

### P2-ANDROID-02 — @expo/vector-icons يجب pin دقيق (no `^`)
**الموقع:** `artifacts/banco-mobile/package.json`

`^15.0.3` يسمح بـ 15.1.x → glyph map الجديد مقابل TTF القديم في Expo Go → كل الأيقونات تظهر `.notdef` boxes على Android.

**القاعدة:** أيقونات BANCO هي Lucide SVG الآن (لا icon fonts) — لا ترجع لـ icon fonts أبداً.

---

### P2-ANDROID-03 — @clerk/expo يجب pin على 3.3.1 بالضبط
**الموقع:** `artifacts/banco-mobile/package.json`

3.4.x+ تُسبب `requireNativeModule('ClerkExpo')` crash عند بدء التشغيل في Expo Go.

**الإصلاح:** pin على `3.3.1` exact.

---

### P2-DB-01 — قاعدة بيانات فارغة تبدو كـ app مكسور
**السبب:** الـ DB فارغة بعد migration جديد (لا startup seed). الـ facet-gating يُخفي search UI كامل عندما لا توجد listings.

**الإصلاح:** `pnpm --filter @workspace/api-server run seed` بعد كل fresh migration.

---

### P2-DB-02 — seed loops غير idempotent
إعادة تشغيل `seed.ts` تُضاعف كل demo listings. لتعديل بيانات موجودة استخدم `executeSql` وليس re-seed.

---

### P2-SEARCH-01 — Installment filter يجب أن يستخدم EXISTS subquery
**الموقع:** SearchService

استخدام post-filter للـ installment بدلاً من `EXISTS` subquery يعطي نتائج خاطئة. تطبيع العربي للـ categories والأسعار مطلوب.

---

### P2-SEARCH-02 — Arabic content يجب فحصه بـ `\p{Arabic}` وليس `[\xD8-\xDB]`
Pattern `[\xD8-\xDB]` يُطابق Latin characters (Ø-Û) ويعطي نتائج "لا توجد محتوى عربي" كاذبة.

---

### P2-FEED-01 — trust_signal "Top Dealer" يُستبعد من فلتر "verified"
**الموقع:** `banco-mobile/constants/feed.ts`

`includes("verified")` يُفوّت "Top Dealer". استخدم `isVerifiedSignal()` المشترك.

---

### P2-FEED-02 — installment label يجب أن يأتي من نفس الـ offer
**الموقع:** BffService

`lowest_monthly` و `best_offer` قد يختلفان. الـ headline monthly amount + payment-type label يجب أن يأتيا من نفس `best_offer`.

---

### P2-PERF-01 — FlatList بدون windowing parameters
**الموقع:** Mobile FlatList components

غياب `windowSize`, `maxToRenderPerBatch`, `initialNumToRender`, `removeClippedSubviews` يُعيد render كل items دفعة واحدة.

Sorts داخل render prop تُنشئ array جديد كل frame — استخدم `useMemo`. Handlers كـ props تحتاج `useCallback`.

---

### P2-CROP-01 — Image cropper: مشاكل دقة حسابية
**الموقع:** Mobile listing image cropper

- Crop rect يجب أن يكون integer-safe (floor origin, clamp size)
- Double-tap confirm يفعّل محصولين — استخدم sync ref latch وليس async state
- removePhoto يجب أن يمسح `cropQueue` و `editAsset` معاً

---

### P2-AUTH-02 — Post-signup intent refs لا تُمسح عند الخروج
**الموقع:** Mobile signup flow

`consent/phone/business-route` refs بعد الـ signup يجب مسحها على **كل** abandonment paths أو user عائد يرث intent قديم.

---

### P2-AUTH-03 — Role gate upgrade من individual لـ dealer
**الموقع:** Mobile role gating

New users = individual بشكل افتراضي. Gate على dealer role بدون upgrade path = lockout دائم. يحتاج `PATCH /me` upgrade + لا تـ spin على `isSuccess` وحده.

---

### P2-CHAT-01 — Conversation delete هو soft-hide وليس حذف حقيقي
**الموقع:** ConversationService

`delete` = per-participant soft-hide. رسالة جديدة يجب أن تمسح كلا الـ `*_deletedAt` وإلا المحادثة تبقى مخفية للطرفين.

---

### P2-SAVES-01 — Saves sync: toggle غير idempotent
**الموقع:** Mobile saves

Signed-in saves = optimistic + backend TOGGLE (non-idempotent). يجب حراسة الـ reconcile. Guests لا يستطيعون save (auth-gated).

---

### P2-RENT-01 — Rent engine = data وليس code
**الموقع:** SearchService + seed

Rent = real-estate listings مع `specs.offer_type='rent'`. إذا كانت الـ seed تجعل كل RE listings بـ 'sale' → صفحة rent فارغة تبدو كـ missing feature. **الحقيقة:** code صحيح، البيانات ناقصة.

**القاعدة:** Rentals لا تحمل financing/installment payment_options.

---

### P2-BOOST-01 — Promote gate يجب أن يشمل promo credit
**الموقع:** Mobile PromoteButton

`eligibleSubscription || hasPromo` — ليس subscription فقط. Route لـ `/plans` فقط عندما لا يوجد أي تمويل. بعد كل boost refresh promo summary.

---

## 🔵 P3 — دين تقني وتحسينات

### P3-INFRA-01 — pnpm-workspace.yaml المكسور يُسقط كل workflows
**القاعدة:** catalog entry مفقود أو `allowBuilds: "set this to true"` placeholder = كل 6 workflows تفشل في نفس الوقت. المظهر: app UI مكسور لكن السبب workspace config.

**الحل:** `NODE_OPTIONS="--max-old-space-size=4096" pnpm install --no-frozen-lockfile` بعد الإصلاح + clear Metro cache + restart جميع الـ workflows.

---

### P3-INFRA-02 — DB schema push يجب `push-force` وليس `push`
**السبب:** `push` bare يُشغّل interactive prompt في non-TTY → column لا يُطبّق → crashes في كل المشروع.

---

### P3-INFRA-03 — AI integration: OPENAI_API_KEY في shared env يطغى على الـ secret
**الموقع:** `.replit [userenv.shared]`

`OPENAI_API_KEY` dummy value في shared يطغى على الـ real secret. `AI_INTEGRATIONS_OPENAI_BASE_URL` localhost يُكسر prod. كلاهما يجب أن يكونا absent من shared/prod.

---

### P3-CODEGEN-01 — Orval يُحوّل binary bodies لـ JSON.stringify
**الموقع:** `lib/api-spec/postprocess.mjs`

Orval يُشكّل `Blob` bodies كـ `JSON.stringify(body)` بدلاً من raw. الـ postprocess script يُصلح هذا تلقائياً — لا تعدّل الـ generated files مباشرة.

---

### P3-METRO-01 — Metro cache يحتجز assets القديمة
**عند تغيير asset موجود في مكانه:**
```bash
rm -rf /tmp/metro-cache /tmp/metro-file-map-* /tmp/haste-map-*
```
ثم أعد تشغيل workflow.

---

### P3-REACT-01 — Helper components يجب تعريفها قبل الاستخدام
**السبب:** React Compiler يحوّل function declarations لـ const bindings (لا hoisting). تعريف component بعد استخدامه = `ReferenceError` في runtime لا يكتشفه `tsc` أو Metro.

---

### P3-MAP-01 — الخرائط: WebView + Leaflet/OSM (لا Google Maps)
**الموقع:** `SearchResultsMap.web.tsx` + mobile WebView

128/134 listing نشطة لها locationId، كل 21 location لها lat/lng. الـ clustering يعمل. CDN Leaflet (unpkg.com) يصل من Replit. Google Maps = اختياري مدفوع لاحقاً.

---

### P3-I18N-01 — Arabic يُعرض فقط عبر AppText
Raw `<Text>` مع Inter font لا يُشكّل Arabic صحيحاً. `AppText` تُحوّل Inter→Cairo وتُطبّق RTL.

**القاعدة:** ترجمة الـ string ليست كافية — الـ leaf component الذي يعرضها يجب أن يكون `AppText`.

---

### P3-DOMAIN-01 — BANCO Market rebrand
**القاعدة:** UI brand = "BANCO Market" لكن pkg/dir/slug/URLs تبقى `dealer-os`. لا تُصلح هذا أو الـ links تنكسر.

---

### P3-ADMIN-01 — Admin bootstrap يتجمّد بعد أول admin
`ADMIN_EMAILS` تمنح أول admin فقط ثم تتجمّد. لإضافة admins لاحقين: قاعدة البيانات مباشرة.

---

### P3-ABUSE-01 — كل public query يجب أن يمرر publicVisibilityConditions()
**الموقع:** `lib/feedVisibility.ts`

الـ feed, search, autocomplete, trending, similar, public listings, company profile, cross-listing supply-chain — كلها يجب أن تنشر `publicVisibilityConditions()` في الـ WHERE. Aggregate/COUNT queries أيضاً. `getById` detail يحتاج re-gate منفصلة (list filter لا تحمي direct-id fetches).

---

### P3-UPLOAD-01 — Server يتجاهل filename/content_type/size المُرسلة من client
**الحقيقة:**
- PUT `Content-Type` header هو الوحيد الذي يُحدد نوع الملف المخزون
- Size enforcement يجب أن يكون server-side من stored metadata
- UUID key بدون extension = cosmetic فقط

---

## 📋 جدول الأولويات النهائي

| # | المشكلة | الأثر | الجهد | الأولوية |
|---|---------|-------|-------|---------|
| 1 | Clerk Secret Key مطابق لـ Publishable Key | Blocking | XS | P0 |
| 2 | PAYMENT_CONFIG_ENCRYPTION_KEY نقله لـ Secrets | Security | S | P0 |
| 3 | Cutover `banco-website` كـ canonical web | Blocking deploy | M | P0 |
| 4 | تحديث next/js-yaml/brace-expansion | Security | S | P1 |
| 5 | توحيد Node 24 في Replit | Build stability | S | P1 |
| 6 | Upload host allowlist + payment domain allowlist | Security | S | P1 |
| 7 | تنقية Paymob response logs | Security | XS | P1 |
| 8 | OpenAPI codegen freshness gate في CI | Quality | S | P1 |
| 9 | Smoke E2E للـ auth/browse/create/payment | Quality | M | P1 |
| 10 | Clerk sign-in state machine (needs_second_factor) | UX blocking | S | P0 |
| 11 | Android tab bar elevation fix | Android UX | S | P2 |
| 12 | @expo/vector-icons exact pin | Android icons | XS | P2 |
| 13 | @clerk/expo exact 3.3.1 | Expo Go crash | XS | P2 |
| 14 | FlatList windowing parameters | Performance | S | P2 |
| 15 | Image crop rect integer safety | Data integrity | S | P2 |
| 16 | publicVisibilityConditions() على كل queries | Security/data | S | P1 |
| 17 | Boost gate: subscription OR promo credit | Revenue | S | P2 |

---

## 🌿 Branches غير مدمجة على origin (مرتبة بالأهمية)

| Branch | Commits | المحتوى |
|--------|---------|---------|
| `cursor/accounts-clerk-harden-5cf0` | 93 | Clerk hardening بعد Replit pollution audit |
| `cursor/final-production-acceptance-5cf0` | 97 | Production acceptance + chain integrity |
| `cursor/production-hardening-5cf0` | 108 | CI chain certification |
| `cursor/phase-x-production-hardening-5cf0` | 131 | 164/164 chain certification |
| `cursor/production-gap-certification-5cf0` | 181 | Pre-merge handoff |
| `cursor/w41-production-release-5cf0` | 160 | Release verification |
| `cursor/production-inventory-harmony-5cf0` | 188 | Inventory SoT |
| `cursor/openapi-codegen-harmony-5cf0` | 190 | OpenAPI codegen harmony |

**توصية:** ابدأ بـ `cursor/accounts-clerk-harden-5cf0` (الأصغر والأكثر صلة بـ Replit env).

---

## 🟢 نقاط القوة (لا تلمسها)

- API tests suite قوية (78 ملف) على PostgreSQL حقيقي في CI ✅
- Mobile guard tests (79 ملف): icons, session, i18n, links, accessibility ✅
- Clerk + PostgreSQL + Drizzle ORM: معمارية صحيحة ✅
- CORS, Helmet, rate limiting, schema validation: حواجز أمنية موجودة ✅
- pnpm monorepo: workspace isolation صحيح ✅
- Abuse control + visibility conditions: موجودة وموثّقة ✅
- لا يوجد Critical vulnerability ✅
- لا يوجد DB corruption ✅

---

## ⚡ كيفية تشغيل بيئة Replit نظيفة

```bash
# 1. سحب آخر main
git pull origin main

# 2. تثبيت
NODE_OPTIONS="--max-old-space-size=4096" pnpm install --no-frozen-lockfile

# 3. Schema
pnpm --filter @workspace/db run push-force

# 4. Seed (أول مرة فقط)
pnpm --filter @workspace/api-server run seed

# Secrets المطلوبة في Replit encrypted store:
# CLERK_SECRET_KEY    = sk_test_* من نفس instance PK
# SESSION_SECRET      = random string قوي
# DATABASE_URL        = Replit PostgreSQL (auto)
# PAYMENT_CONFIG_ENCRYPTION_KEY = من Secrets (ليس .replit)
```

---

*تقرير مُجمَّع من 88 ملف ذاكرة + تدقيق كامل للمونوريبو*  
*Replit Agent — main-agent — 2026-07-31*
