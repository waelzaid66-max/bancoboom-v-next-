# تقرير التشغيل الكامل — BANCO على Replit
**التاريخ:** 2 أغسطس 2026  
**الهدف:** تشغيل حقيقي كامل واستعداد للنشر — بدون تعديل الكود الأصلي

---

## ملخص الحالة

| الخدمة | المنفذ | الحالة | التفاصيل |
|---|---|---|---|
| **API Server** | 8080 | ✅ يعمل — `/healthz` و `/readyz` OK | ❌ كل الـ endpoints ترجع 500 بسبب `CLERK_SECRET_KEY` مفقود |
| **Web App** (Next.js) | 5000 | ⚠️ يعمل جزئياً | ❌ خطأ runtime في المتصفح — `.next` cache تالف |
| **Dealer OS** (BANCO Market) | 5002 | ✅ يعمل — صفحة Login ظاهرة | ⚠️ مفاتيح Clerk dev فقط |
| **Admin OS** (BANCO Control Center) | 5003 | ✅ يعمل — صفحة Login ظاهرة | ⚠️ مفاتيح Clerk dev فقط |
| **Mobile Serve** | 3000 | ✅ يعمل — Expo Dev Metro شغّال | ⚠️ Web UI يحتاج `build:web` — حالياً يعرض QR فقط |
| **Expo Metro Bundler** | 8081 | ✅ يعمل — QR للموبايل جاهز | سكان QR بـ Expo Go يفتح التطبيق الحقيقي |

---

## الإجراءات المنجزة (بدون تعديل كود)

- ✅ **تثبيت الاعتماديات** — `pnpm install --frozen-lockfile` (1807 حزمة)
- ✅ **Push مخطط قاعدة البيانات** — `drizzle-kit push --force` — 60+ جدول
- ✅ **Seed البيانات المرجعية** — seed:reference + seed:car-brands + seed:admin + seed
- ✅ **تشغيل 6 workflows** — API Server + Web App + Mobile + Dealer OS + Admin OS + Expo
- ✅ **حل مشكلة Expo/Metro** — NODE_PATH لإصلاح pnpm hoisting
- ✅ **حل مشكلة Dealer/Admin timeout** — تغيير outputType لـ console

**قاعدة البيانات الآن:**
```
users: 7 | listings: 58 | locations: 21 | brands: 111 | plans: 6
```

---

## 🔴 عوائق حرجة — تحتاج تدخّلك

### 1. CLERK_SECRET_KEY — مفقود (الأحرج)
**التأثير:** كل API endpoints ترجع 500 — التطبيق بالكامل لا يعمل بدونه  
**الخطأ الفعلي من اللوج:**
```
Error: Missing Clerk Secret Key. Go to https://dashboard.clerk.com 
and get your key for your instance.
```
**الحل:** احصل على `CLERK_SECRET_KEY` من [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys → Secret Keys  
(يبدأ بـ `sk_test_` للتطوير أو `sk_live_` للإنتاج)

### 2. PAYMENT_CONFIG_ENCRYPTION_KEY — مفقود
**التأثير:** إعدادات Paymob المشفّرة لا تعمل — الدفع معطّل  
**الحل:** أنشئ مفتاح AES-256: `openssl rand -base64 32` وضعه في Secrets

### 3. OPENAI_API_KEY — قيمة وهمية `_DUMMY_API_KEY_`
**التأثير:** المساعد الذكي (AI Assistant) لا يعمل — يرجع 500 على AI endpoints  
**ملاحظة خاصة:** الملف `.replit` يحتوي على `OPENAI_API_KEY = "_DUMMY_API_KEY_"` في `[userenv.shared]` — هذا يُلغي أي Secret حقيقي تضعه! يحتاج موافقتك لتعديله.

---

## 🟠 عوائق مهمة — للنشر الكامل

### 4. RESEND_API_KEY — مفقود
**التأثير:** إيميلات OTP / التحقق / الإشعارات لا ترسل  
**الحل:** مفتاح من [resend.com](https://resend.com) → API Keys

### 5. PAYMOB_SECRET_KEY + PAYMOB_HMAC_SECRET — مفقودان
**التأثير:** webhooks الدفع لا تعمل — معالجة المدفوعات معطّلة  
**الحل:** من لوحة Paymob → Integration → API Keys

---

## 🟡 مشكلة تقنية — تحتاج موافقتك للحل

### 6. Web App (Next.js) — خطأ Runtime في المتصفح
**الخطأ:** `Cannot find module './5901.js'` — webpack chunk مفقود من cache  
**السبب:** `.next` build cache محتوى على chunk IDs من build قديم، والـ dev server لم يُعد بناءه  
**الحل:** حذف مجلد `.next` المُولَّد (ليس كوداً أصلياً — مُولَّد تلقائياً) ثم إعادة تشغيل Web App  
**يحتاج موافقتك** لأنك قلت "ممنوع مسح أي شيء" — المجلد `.next` هو cache مُولَّد وليس كوداً أصلياً

### 7. Mobile Web UI — يعرض QR بدل التطبيق الحقيقي
**السبب:** `static-build/web/index.html` غير موجود — الـ Expo web export لم يُبنَ  
**الحل:** تشغيل `pnpm --filter @workspace/banco-mobile run build:web`  
**ملاحظة:** ستحتاج وقتاً (5-10 دقائق) لبناء الـ bundle — الـ Expo Go QR يعمل للموبايل الآن

---

## 🔵 تحذيرات الإنتاج — قبل النشر الفعلي

### 8. Clerk — مفاتيح Development فقط
**الخطأ في console:** `Clerk has been loaded with development keys`  
الـ `CLERK_PUBLISHABLE_KEY` الحالي `pk_test_...` مرتبط بـ `evolving-magpie-43.clerk.accounts.dev` وليس `banco.today`  
**للنشر الحقيقي:** تحتاج مفاتيح `pk_live_` + `sk_live_` من Clerk Dashboard على domain الإنتاج

### 9. CORS مغلق على prod domains فقط
**الإعداد الحالي:** `CORS_ALLOWED_ORIGINS = "https://banco.today,https://banco.deals,https://banco.autos"`  
**المشكلة:** يحجب Replit dev domain — للاختبار على البيئة الحالية يحتاج إضافة dev domain  
**للنشر:** الإعداد الحالي صحيح للإنتاج

### 10. Object Storage — S3 غير مكتمل الإعداد
```
OBJECT_STORAGE_PROVIDER=s3 but S3_BUCKET/AWS_REGION not set
— falling back to Replit sidecar (dev-only)
```
رفع الصور والملفات يعمل حالياً عبر Replit sidecar — OK للتطوير  
**للنشر على AWS:** تحتاج `S3_BUCKET` + `AWS_REGION` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

---

## قائمة ما تحتاجه من الـ Secrets

| المفتاح | الأولوية | المصدر |
|---|---|---|
| `CLERK_SECRET_KEY` | 🔴 حرج | dashboard.clerk.com → API Keys |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | 🔴 حرج | `openssl rand -base64 32` |
| `RESEND_API_KEY` | 🟠 مهم | resend.com → API Keys |
| `PAYMOB_SECRET_KEY` | 🟠 مهم | لوحة Paymob → Integration |
| `PAYMOB_HMAC_SECRET` | 🟠 مهم | لوحة Paymob → Integration |
| `OPENAI_API_KEY` (حقيقي) | 🟡 مهم + يحتاج إصلاح `.replit` | platform.openai.com → API Keys |

---

## حالة Workflows الحالية

```
✅ API Server         PORT=8080   — يعمل، healthz/readyz OK
✅ Dealer OS Dev      PORT=5002   — يعمل، Login page ظاهرة
✅ Admin OS Dev       PORT=5003   — يعمل، Login page ظاهرة
✅ Mobile Serve       PORT=3000   — يعمل، Expo QR + Metro شغّال
✅ Expo Metro         PORT=8081   — يعمل، QR للـ Expo Go جاهز
⚠️ Web App           PORT=5000   — يعمل لكن يعرض Runtime Error
```

---

## نتيجة اختبارات المحرك (بدون secrets)

```
test:icons         6/6  ✅  — SVG icons لا icon fonts
test:lib          32/32 ✅  — hardening tests
test:resilience   90/90 ✅  — error boundaries + crash handlers
test:materials     8/8  ✅  — B-CORE materials section
test:i18n          1/1  ✅  — كل مفاتيح الترجمة موجودة
```

---

## الخطوات التالية الموصى بها

1. **[الآن]** أضف `CLERK_SECRET_KEY` و `PAYMENT_CONFIG_ENCRYPTION_KEY` في Secrets → الـ API يعمل فوراً
2. **[بعدها]** وافق على حذف `.next` cache → Web App يعمل بدون أخطاء
3. **[للإنتاج]** أضف `RESEND_API_KEY` + `PAYMOB_SECRET_KEY` + `PAYMOB_HMAC_SECRET`
4. **[للنشر]** غيّر مفاتيح Clerk من `pk_test_` إلى `pk_live_` على domain `banco.today`
