# تعليمات فريق BANCO — Replit Agent Directive
**الإصدار:** 91-REPLIT  
**التاريخ:** 2026-07-31  
**المرسِل:** Replit Agent (Production Intelligence Officer)  
**المستلم:** كل أعضاء الفريق على الريبو `waelzaid66-max/banco-with-wael`  
**Tip الإلزامي:** `git reset --hard origin/main` قبل أي عمل

---

## 1. الحالة الحالية المؤكَّدة (الآن — 18:35)

| الخدمة | المنفذ | الحالة | الدليل |
|---------|--------|--------|--------|
| Landing Page | 18150 | ✅ **يعمل** — عربي RTL صح | صورة ملتقطة |
| API Server | 8080 | ✅ **يعمل** — root 200 OK | سجلات مباشرة |
| Admin OS | 22357 | 🟡 **صفحة دخول** — Google OAuth غائب | صورة ملتقطة |
| Dealer OS | 21539 | 🟡 **صفحة دخول** — dev mode | صورة ملتقطة |
| **Mobile Expo** | 23351 | ✅ **تم الإصلاح** — MOB-NOTIF-01 CLOSED | commit `1055af8` |
| **Website (banco-website)** | 5000 | 🟡 **يبدأ نظيفاً** — شاشة سوداء عند الفتح | سجلات + صورة |

---

## 2. ما تم إنجازه منذ آخر جلسة

| الإنجاز | الـ commit | الحالة |
|---------|-----------|--------|
| إزالة 3 متغيرات تسمم من `.replit` | إصلاح بيئة | ✅ مكتمل |
| دمج Wave 7 + Wave 8 Tranche A–D | 142 commit | ✅ مكتمل |
| إصلاح expo-notifications (MOB-NOTIF-01) | `1055af8` | ✅ مكتمل من الفريق |
| `safeNotifications.ts` — حماية Expo Go SDK 53 | `1055af8` | ✅ مكتمل |
| تحويل Web App من `banco-web` → `banco-website` | workflow | ✅ مكتمل |
| تقرير الاستخبارات الكامل | `reports/intelligence/` | ✅ مُرسَل |
| خطة دمج branches | `reports/intelligence/` | ✅ مُرسَلة (رُفضت من المدير — صح) |
| مشروع `banco-status` المعزول | `projects/banco-status/` | ✅ مكتمل |
| تأمين مفتاح تشفير المدفوعات | Task #6 | ✅ IMPLEMENTED |

---

## 3. ما يحتاجه Replit Agent من الفريق الآن

### 🔑 الأولوية القصوى — Owner مطلوب

**`OWNER_SECRETS_REQUIRED`** — لا يمكن للـ agent وضعها، المالك فقط:

```
1. CLERK_SECRET_KEY  — من Clerk Dashboard → banco.today → API Keys
   يجب أن يطابق: pk_test_ZXZv... (instance: evolving-magpie-43)
   وضعه في: Replit Secrets (مشفّر)

2. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — نفس الـ instance
   وضعه في: Replit Secrets (مشفّر)

3. SESSION_SECRET — يجب أن يكون قيمة عشوائية قوية ≥ 64 char
   وضعه في: Replit Secrets (مشفّر)
```

**بدون هذه الـ Secrets:**
- `banco-website` يبدأ نظيفاً لكن يعرض شاشة سوداء
- تسجيل الدخول لا يعمل على أي سطح

---

### 🔧 مطلوب من الفريق التقني (cursor team)

#### TASK-WEB-01 — إصلاح `allowedDevOrigins` في `banco-website`
```typescript
// artifacts/banco-website/next.config.ts (أو next.config.mjs)
// أضف:
const nextConfig = {
  allowedDevOrigins: ["*.replit.dev", "*.repl.co"],
  // ... باقي الإعدادات
};
```
**السبب:** الـ log يقول:
```
⚠ Blocked cross-origin request from 127.0.0.1 to /_next/* resource.
```
هذا يكسر HMR ويسبب الشاشة السوداء في Replit preview.

#### TASK-WEB-02 — إصلاح `afterSignInUrl` deprecated
```
// في artifacts/banco-website/ — ابحث وعدّل:
grep -r "afterSignInUrl" artifacts/banco-website/

// استبدل:
afterSignInUrl="/dashboard"
// بـ:
fallbackRedirectUrl="/dashboard"
```

#### TASK-API-01 — إضافة `/api/v1/health`
```typescript
// artifacts/api-server/src/routes/health.ts (جديد)
router.get("/health", async (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});
// ثم mount في app.ts على: /api/v1/health
```

#### TASK-DB-01 — إصلاح Facets (0 categories)
```bash
# على الـ API server:
pnpm --filter @workspace/api-server run seed
# ثم تحقق:
curl http://localhost:8080/api/v1/search/facets | jq '.data.categories | length'
# يجب أن يرجع > 0
```

#### TASK-GIT-01 — تنظيف git history (Task #12)
```bash
# مفتاح التشفير القديم يجب حذفه من التاريخ
# استخدم: git filter-repo أو BFG Repo Cleaner
# قبل أي merge جديد
```

---

## 4. ما يفعله Replit Agent (دوري)

**وفقاً لأوامر المدير (DIR-91):**

```
✅ مسموح:
  - سحب (git pull / git merge origin/main)
  - تشغيل الـ workflows ومراقبتها
  - أخذ screenshots R01–R12
  - قراءة السجلات وإرسال تقارير
  - قراءة الكود بدون تعديل
  - الرد على الفريق بالتقارير

❌ ممنوع (أوامر المدير):
  - تعديل أي كود في artifacts/
  - commit أو push للكود
  - دمج branches 5cf0 بالجملة
  - وضع secrets في .replit
  - Publish كـ Live
  - تنفيذ الإصلاحات بنفسي
```

---

## 5. الهدف النهائي — النسخة الكاملة المُعدَّة للنشر

### ما يجب أن يعمل قبل الـ deploy:

```
□ banco-website (port 5000):
    □ CLERK_SECRET_KEY صحيح في Replit Secrets
    □ allowedDevOrigins مضاف في next.config
    □ afterSignInUrl مستبدل بـ fallbackRedirectUrl
    □ صفحة الدخول تعمل كاملاً

□ Mobile App (Expo):
    □ MOB-NOTIF-01: ✅ مُصلَّح (safeNotifications.ts)
    □ shadow* deprecation warnings: تنظيفها
    □ QR code يشتغل على Android/iOS

□ API Server:
    □ /api/v1/health → 200 (للـ monitoring)
    □ Facets ترجع > 0 categories
    □ DB seed صحيح

□ Admin OS + Dealer OS:
    □ Google OAuth: يحتاج تفعيل في Clerk Dashboard
    □ أو تعطيل الزر نهائياً في الكود

□ Git:
    □ PAYMENT_CONFIG_ENCRYPTION_KEY محذوف من history (#12)
    □ branches 5cf0 → يُدمج واحد واحد بعد اعتماد المدير

□ Deployment:
    □ Coolify / Docker compose يشير لـ banco-website
    □ CI/CD يبني banco-website (ليس banco-web)
```

---

## 6. قالب الرد المطلوب مني لمدير الفريق

```
SEAT: Replit
PACKET: DIR-91
SYNC_SHA: [آخر commit على main]
SECTION_GUARD: [نتيجة الفحص]
SECRETS_OWNER: missing (لم تُضَف بعد)
WEB: banco-website BOOTS_CLEAN / BLACK_SCREEN
MOBILE: MOB-NOTIF-01 FIXED ✅
API_HEALTH: 404 ❌
FACETS: 0 categories ❌
RED_LOGS: allowedDevOrigins cross-origin block
ASK_DIRECTOR: متى يضع Owner الـ Secrets؟
```

---

## 7. الملفات المرجعية على الريبو

```
reports/intelligence/2026-07-31-FULL-AUDIT-AND-MOBILE-DEEP-DIVE.md  ← الأودِت الكامل
reports/intelligence/2026-07-31-BRANCH-MERGE-PLAN-FOR-DIRECTOR.md   ← خطة الدمج (مرجعية فقط)
reports/intelligence/2026-07-31-PRODUCTION-INTELLIGENCE-REPORT.md   ← تقرير الاستخبارات
reports/screenshots/                                                  ← 6 صور حية
audit/handoff/PASTE-REPLIT-DIRECTOR-91-AR.md                         ← أوامر المدير لـ Replit
projects/banco-status/                                               ← status dashboard مستقل
```

---

*Replit Agent — Production Intelligence Officer*  
*دوري: شاهد + مُبلِّغ + منسِّق — لا أُصلِح بمفردي*  
*الفريق يُصلِح — أنا أُوثِّق وأُرسِل*
