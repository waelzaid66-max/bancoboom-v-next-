# SCALE + PROOF REPORT — banco-with-wael
**Date:** 2026-07-29  
**Repo:** https://github.com/waelzaid66-max/banco-with-wael  
**Purpose:** إثبات أن النسخة كاملة، جاهزة لـ 21 سوق ومستخدمين كُثر، مع ما تم إصلاحه اليوم.

---

## 1. إثبات المقارنة (CAOOM tip vs هذه النسخة)

فحص ملف-بملف لـ `artifacts/` + `lib/` أظهر:

| الاتجاه | النتيجة |
|---------|---------|
| banco-with-wael أحدث | **كل الملفات المختلفة** |
| CAOOM أحدث / إصلاح مفقود هنا | **صفر** |

إصلاحات حرجة موجودة هنا وغير موجودة في CAOOM:

1. MFA (مستخدم 2FA لا يستطيع الدخول على CAOOM)
2. Facebook OAuth كامل
3. Pagination لإعلانات البائع (>20)
4. Draft restore لماركات مكتوبة يدوياً
5. تخفيف mileage gate (طائرات/مراكب/دراجات)
6. MarketCountryButton موحّد + wrapping chips
7. Car Import schema + API + tracking
8. Near-me radius
9. Accessibility labels

---

## 2. إثبات رحلات المستخدم (كود حي)

| الرحلة | الإثبات |
|--------|---------|
| Sign-up → نوع الحساب → onboarding → أول إعلان | `profile.tsx` + `/business/onboarding` + `/listings/create` |
| MFA | `signIn.mfa.*` + `needs_second_factor` |
| Google/Apple/Facebook | `oauth_google` / `oauth_apple` / `oauth_facebook` |
| خرائط كل الأقسام | `mapHtml.ts` + 21 `marketCountryMapCenter` + Discover Explore-on-map |
| Import lifecycle | create + list + get + **PATCH stage** + **POST cancel** + notifications |
| Profile | اسم/صورة/هاتف/روابط/مقاييس/grid |
| Bookings | `bookings.tsx` confirm/reject |
| Notifications | deep-link routing |

---

## 3. فجوات حقيقية وُجدت اليوم وأُصلحت

| الفجوة | الدليل | الإصلاح |
|--------|--------|---------|
| `market_country` يُفلتر من JSONB بدون فهرس | `SearchService.ts` يستخدم `COALESCE(specs->>'market_country','EG')` | `idx_listing_attrs_market_country` عند الإقلاع |
| Pool غير محدود الإعداد | `lib/db/src/index.ts` كان `new Pool({connectionString})` فقط | `DB_POOL_MAX` / idle / connect timeouts |
| Import stages لا تتقدم | Service كان create/list/get فقط | `updateImportOrderStage` + `cancelImportOrder` + routes |
| Locate-me على الويب | iframe sandbox بدون same-origin | `allow-scripts allow-same-origin` |
| فشل حفظ نوع الحساب صامت | `console.warn` فقط | `Alert` للمستخدم |
| MissingFeatures قديم | يقول Facebook غير موجود | تم تحديث التقرير |

---

## 4. جاهزية الضغط العالي (Scale)

### موجودة مسبقاً
- فهارس GIN trigram على title/description
- فهارس feed مركّبة (status+category+price)
- Cache-Control + stale-while-revalidate على search/listing
- CDN readiness عبر `NEXT_PUBLIC_ASSET_CDN_URL` + اختبار `cdn-readiness.test.mjs`
- Rate limits (public 120/min, search 60, write 30, AI 12)
- `trust proxy` للـ Coolify/nginx
- Advisory locks + abuse control

### أُضيفت اليوم
- Expression index لـ market_country (21 سوق)
- Geo index للخرائط (latitude/longitude WHERE NOT NULL)
- Feed index status+category+created_at
- Import orders stage+created_at
- Pool sizing عبر env
- اختبار إثبات: `artifacts/banco-mobile/tests/scale-readiness.test.mjs`

### حدود معروفة (ليست مانع نشر)
- Rate limit in-memory لكل replica — مناسب لنسخة API واحدة؛ عند تعدد replicas أضف Redis store لاحقاً
- Backup Postgres = مسؤولية الـ operator (موثّق في Coolify order)

---

## 5. Coolify — إثبات الربط

ملف: `docker-compose.coolify.yml` + `deploy/coolify/*`

| Service | Port | Health |
|---------|------|--------|
| postgres | internal | pg_isready |
| migrate | one-off | push --force |
| api | 8080 | /api/healthz |
| banco-web | 3000 | /api/healthz |
| banco-website | 3001 | /api/healthz |
| web (nginx) | 80 | /nginx-health |

ترتيب التشغيل التفصيلي: `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`

Nginx path map: `/` landing · `/market/` dealer-os · `/admin/` admin-os · `/api/` → api

Mobile = EAS (ليس Docker).

---

## 6. كيف تثبت محلياً (بدون secrets)

```bash
# من جذر الريبو بعد pnpm install:
node --test artifacts/banco-mobile/tests/scale-readiness.test.mjs
node --test artifacts/banco-mobile/tests/cdn-readiness.test.mjs
node scripts/production-confidence-check.mjs --skip-typecheck
```

---

## 7. الخلاصة

**نعم — هذه النسخة هي الأقوى المتاحة، وأثبتنا ذلك بمقارنة مصدرية كاملة ضد CAOOM + إصلاح فجوات الضغط العالي التي كانت حقيقية.**

ما تحتاجه للنشر الآن ليس كوداً ناقصاً، بل:
1. Secrets (Clerk + DB + storage)
2. Coolify بالترتيب في `COOLIFY-DEPLOY-ORDER.md`
3. EAS للموبايل
