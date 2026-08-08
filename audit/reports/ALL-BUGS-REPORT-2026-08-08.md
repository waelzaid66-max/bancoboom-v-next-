# تقرير شامل لجميع المشكلات — BANCO v4.1.4
**التاريخ:** 2026-08-08  
**الريبو:** waelzaid66-max/bancoboomstor  
**الفرع:** main @ 7a47b94

---

## 🔴 مشكلة 1 — فشل اختبار الأيقونات (Mobile Icons Test)

**الشدة:** عالية — يوقف سلسلة الاختبارات كاملة  
**الملف:** `artifacts/banco-mobile/tests/icons.test.mjs` — سطر 242  
**الاختبار:** `every icon name used in the app is mapped in the registry`

**التفاصيل:**  
4 أيقونات تُستخدم في الكود ليست مسجّلة في registry الأيقونات:
```
alert-circle-outline
file-document-outline
information-outline
upload
```

**السبب المحتمل:**  
تحديثات 4.1.4 أضافت مكونات جديدة تستخدم هذه الأيقونات دون تسجيلها في ملف الـregistry.

**الحل المطلوب:**  
إضافة الأيقونات الأربع إلى ملف registry الأيقونات في المشروع.

---

## 🔴 مشكلة 2 — فشل اختبارات Object Storage (API Server)

**الشدة:** متوسطة — 2 اختبار فاشلان من 437  
**الملف:** `artifacts/api-server/src/lib/objectStorage.upload.test.ts`

**الخطأ:**
```
Error: Failed to sign object URL, errorcode: 401, 
make sure you're running on Replit
```

**الاختبارات الفاشلة:**
1. `stores real bytes and reads back the authoritative size + content-type`
2. `the create-listing image size-guard passes against the REAL stored object`

**السبب:**  
اختبارات تحتاج Replit Object Storage sidecar للتوقيع — لا تعمل إلا من داخل عملية الـworkflow الرسمية، وليس من سكريبت اختبار مستقل.

**الحل المطلوب:**  
إما skip هذين الاختبارين في CI أو mock الـsigning function في بيئة الاختبار.

---

## 🔴 مشكلة 3 — Clerk Infinite Redirect Loop (شاشة سوداء)

**الشدة:** عالية — Web App لا يظهر للمستخدم  
**السطح:** `banco-website` (Next.js) — port 5000

**الخطأ في الـlogs:**
```
Clerk: Refreshing the session token resulted in an infinite redirect loop.
This usually means that your Clerk instance keys do not match — 
make sure to copy the correct publishable and secret keys from the Clerk dashboard.
```

**الأثر:**  
الصفحة الرئيسية تعرض شاشة سوداء كاملة. المستخدم لا يستطيع تسجيل الدخول.

**الحل المطلوب:**  
التحقق من أن `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` و`CLERK_SECRET_KEY` في Replit Secrets ينتميان لنفس الـClerk instance (development instance لبيئة dev). يمكن التحقق من Clerk Dashboard.

---

## 🟠 مشكلة 4 — تعارض الـWorkflows على البورتات (EADDRINUSE)

**الشدة:** متوسطة — تسبب توقف عشوائي عند كل restart  
**يحدث عند:** إعادة تشغيل البيئة أو أي workflow

**الأزواج المتضاربة:**

| الـWorkflow الأساسي | الـWorkflow المكرر | البورت |
|---|---|---|
| `API Server` | `artifacts/api-server: API Server` | 8080 |
| `Dealer OS Dev` | `artifacts/dealer-os: web` | 5002 |
| `Admin OS Dev` | `artifacts/admin-os: web` | 5003 |
| `artifacts/banco-mobile: expo` | نفسه (يتعارض مع نفسه) | 23351 |

**الخطأ:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:8080
```

**الحل المطلوب:**  
حذف الـworkflows المكررة (`artifacts/xxx`) من قسم `[[workflows.workflow]]` في ملف `.replit`.

---

## 🟠 مشكلة 5 — Mobile Static Build قديم (لا يحتوي تحديثات 4.1.4)

**الشدة:** متوسطة — المستخدم يرى نسخة قديمة  
**السطح:** `Mobile Serve` — port 3000

**التفاصيل:**  
`Mobile Serve` يخدم bundle ثابت من `artifacts/banco-mobile/dist/` مبني قبل دمج تحديثات 4.1.4. جميع التغييرات في SectionSearchApp، CarsHomeHeader، StaysHomeHeader وغيرها غير مرئية للمستخدم الذي يفتح الموبايل عبر المتصفح.

**الحل المطلوب:**  
إعادة بناء الـweb bundle عبر تشغيل:  
```bash
pnpm --filter @workspace/banco-mobile run build:web
```
ثم إعادة تشغيل `Mobile Serve`.

---

## 🟠 مشكلة 6 — Conflict Markers في ملفات مُدمَجة (تم إصلاحه جزئياً)

**الشدة:** عالية (تم الإصلاح في commit 7a47b94)  
**الملفات المتضررة:**
```
artifacts/banco-mobile/app/import/auctions.tsx   ← تم الإصلاح ✅
artifacts/banco-mobile/app/import/documents.tsx  ← تم الإصلاح ✅
```

**الخطأ الذي كان يظهر:**
```
SyntaxError: Unexpected token (187:0)
> 187 | <<<<<<< HEAD
```

**الحل المطلوب (مستقبلي):**  
إضافة pre-commit hook يمنع commit أي ملف يحتوي على conflict markers:
```bash
#!/bin/sh
if git diff --cached | grep -q "^+<<<<<<< "; then
  echo "ERROR: Conflict markers detected!"; exit 1
fi
```

---

## 🟡 مشكلة 7 — DATABASE_URL غير متاح من GitHub CI

**الشدة:** منخفضة — لا تؤثر على التطوير المحلي  
**السياق:** الـ`DATABASE_URL` في Replit هو PostgreSQL داخلي على شبكة Replit المغلقة.

**الأثر:**  
إذا أُضيف GitHub Actions CI لتشغيل الاختبارات، فإن الـ`DATABASE_URL` الحالي لن يعمل من خوادم GitHub لأنها لا تستطيع الوصول لـPostgres الداخلي.

**الحل المطلوب:**  
إنشاء قاعدة بيانات خارجية (Neon أو Supabase — مجانية) وإضافة URL كـGitHub Secret باسم `BANCO_TEST_DATABASE_URL` لاستخدامه في CI.

---

## 🟡 مشكلة 8 — Metro File Watcher يراقب ملفات Replit محذوفة

**الشدة:** منخفضة — يسبب crash مفاجئ لـExpo بعد عمليات Replit الداخلية  
**الخطأ:**
```
Error: ENOENT: no such file or directory, 
watch '/home/runner/workspace/.local/skills/.old-database-rKjEZdiEhv8PghRf8xbHM'
```

**السبب:**  
Metro يبدأ مراقبة ملفات Replit المؤقتة (`/.local/skills/.old-*`) التي تُحذف لاحقاً من قِبل بيئة Replit، مما يسبب crash.

**الحل المطلوب:**  
إضافة هذه المسارات إلى قائمة `watchFolders` المستثناة في `metro.config.js`:
```js
resolver: {
  blockList: [/\.local\/skills\/.old-.*/]
}
```

---

## ملخص المشكلات

| # | المشكلة | الشدة | الحالة |
|---|---|---|---|
| 1 | 4 أيقونات غير مسجّلة — تفشل test:icons | 🔴 عالية | مفتوحة |
| 2 | Object storage tests — 401 في Replit sidecar | 🔴 متوسطة | مفتوحة |
| 3 | Clerk redirect loop — شاشة سوداء | 🔴 عالية | مفتوحة |
| 4 | EADDRINUSE — workflows مكررة | 🟠 متوسطة | مفتوحة |
| 5 | Mobile bundle قديم — لا يحتوي 4.1.4 | 🟠 متوسطة | مفتوحة |
| 6 | Conflict markers في ملفات مدمجة | 🔴 عالية | **تم الإصلاح** ✅ |
| 7 | DATABASE_URL لا يعمل من GitHub CI | 🟡 منخفضة | مفتوحة |
| 8 | Metro يراقب ملفات Replit محذوفة | 🟡 منخفضة | مفتوحة |
