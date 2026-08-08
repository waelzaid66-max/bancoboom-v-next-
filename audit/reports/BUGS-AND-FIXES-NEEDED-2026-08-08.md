# تقرير الأعطال والإصلاحات المطلوبة — BANCO v4.1.4
**التاريخ:** 2026-08-08  
**البيئة:** Replit Development (waelzaid66-max/bancoboomstor)  
**الحالة بعد الإصلاح:** ✅ المشروع شغّال

---

## 🔴 الأعطال التي تم اكتشافها وإصلاحها

### 1. Conflict Markers داخل ملفات الكود (حرج — منع تشغيل التطبيق)
**الملفات المتضررة:**
- `artifacts/banco-mobile/app/import/auctions.tsx` — سطر 187
- `artifacts/banco-mobile/app/import/documents.tsx`

**السبب:**  
عند دمج فرع `origin/claude/project-understanding-manager-lcgi3u` (تحديثات 4.1.4)  
إلى `main`، لم يُطبَّق `git checkout --theirs` على هذين الملفين — فبقيت علامات التعارض  
(`<<<<<<< HEAD` / `=======` / `>>>>>>>`) داخل الكود المُدمَج.

**الأثر:**  
Metro Bundler (Expo) كسر فوراً عند محاولة parse الملف:
```
SyntaxError: Unexpected token (187:0)
> 187 | <<<<<<< HEAD
```
الـApp Mobile لم يُشغَّل على الإطلاق.

**الإصلاح المُطبَّق:**  
Commit `7a47b94` — إزالة علامات التعارض، الأخذ بنسخة الفرع الجديد.

---

### 2. تعارض Workflows على البورتات (EADDRINUSE)
**الـWorkflows المتضررة:**
- `API Server` و`artifacts/api-server: API Server` — يتنافسان على port 8080
- `Dealer OS Dev` و`artifacts/dealer-os: web` — يتنافسان على port 5002
- `Admin OS Dev` و`artifacts/admin-os: web` — يتنافسان على port 5003
- `artifacts/banco-mobile: expo` — تعارض على port 23351

**السبب:**  
وجود workflows مكررة (primary + artifacts-scoped) تشغّل نفس الأوامر على نفس البورتات.

**الإصلاح المُطبَّق:**  
قتل العمليات المتضاربة وإعادة تشغيل الـworkflows الأساسية بالترتيب.

---

### 3. pnpm Cache Stale بعد git reset
**الأثر:**  
```
ERR_PNPM_JSON_PARSE Expected double-quoted property name in JSON at position 2332
```
رغم أن `package.json` كان سليماً، ظل pnpm يقرأ نسخة قديمة من الـcache.

**الإصلاح:**  
`pnpm install --prefer-offline` لإعادة بناء الـcache.

---

## 🟡 ما يحتاج اهتمام المالك

### أ. دمج الـWorkflows المكررة
يوجد 4 أزواج من الـworkflows تشغّل نفس الشيء:

| الأساسي (يجب الإبقاء عليه) | المكرر (يمكن حذفه) |
|---|---|
| `API Server` | `artifacts/api-server: API Server` |
| `Dealer OS Dev` | `artifacts/dealer-os: web` |
| `Admin OS Dev` | `artifacts/admin-os: web` |
| `artifacts/banco-mobile: expo` | — |

**الحل:** حذف الـworkflows المكررة من `.replit` لمنع التعارض الدائم.

### ب. Clerk Session Infinite Redirect
```
Clerk: Refreshing the session token resulted in an infinite redirect loop.
This usually means that your Clerk instance keys do not match.
```
**الأثر:** الصفحة الرئيسية تعرض شاشة سوداء في بيئة dev.  
**الحل:** التحقق من `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` تتطابق مع نفس الـinstance في Clerk Dashboard.

### ج. DATABASE_URL لـGitHub CI
الـ`DATABASE_URL` الحالي يعمل داخل Replit فقط.  
لتشغيل الاختبارات في GitHub Actions:
- إنشاء قاعدة بيانات خارجية (Neon أو Supabase — مجانية)
- إضافة URL كـGitHub Secret باسم `BANCO_TEST_DATABASE_URL`

---

## ✅ الحالة الحالية للمشروع

| السطح | الحالة | Port |
|---|---|---|
| Web App (Next.js) | ✅ | 5000 |
| API Server | ✅ | 8080 |
| Mobile Serve (static) | ✅ | 3000 |
| Expo Metro (QR) | ✅ | — |
| Dealer OS (BANCO Market) | ✅ | 5002 |
| Admin OS | ✅ | 5003 |
| Landing | ✅ | — |

## ✅ الاختبارات
```
435 / 437 اختبار نجح
2 فشلوا ← object storage signing (Replit sidecar — ليست bugs في الكود)
```

## ✅ حالة الكود
- الفرع: `main` — commit `7a47b94`
- مدموج: تحديثات 4.1.4 من `origin/claude/project-understanding-manager-lcgi3u`
- Migration: `0004_fi_workspace_lifecycle.sql` مُطبَّقة
- DB: 72 جدول، 58 listing في الـseed
