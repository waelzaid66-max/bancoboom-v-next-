# BANCO — دليل النشر الإنتاجي الكامل

> آخر تحديث: 2026-07-31 | النسخة: w4.1

---

## 📐 البنية الكاملة

```
banco.today/          ← nginx (web service — Coolify)
├── /                 ← landing (Vite SPA)          [artifacts/landing]
├── /market/          ← dealer-os (Vite SPA)        [artifacts/dealer-os]
├── /admin/           ← admin-os (Vite SPA)         [artifacts/admin-os]
├── /api/*            ← api-server (Node/Express)   [artifacts/api-server] port 8080
├── /l/* /listing/*   ← api-server (SEO/share)
├── /sitemap.xml      ← api-server
├── /robots.txt       ← api-server
└── /.well-known/*    ← static (AASA/assetlinks)

banco-website (Next.js) ← سيرفس Coolify منفصل     [artifacts/banco-website]
                          يحتاج domain/subdomain خاص (مثال: app.banco.today)

banco-mobile (Expo)     ← native binary عبر EAS    [artifacts/banco-mobile]
                          مش served on web — app stores فقط
```

---

## 🐳 ملفات Coolify الكاملة

| الملف | الغرض |
|-------|-------|
| `docker-compose.coolify.yml` | Compose رئيسي لكل السيرفيسات |
| `deploy/coolify/Dockerfile.api` | API server image |
| `deploy/coolify/Dockerfile.web` | nginx + landing + market + admin |
| `deploy/coolify/Dockerfile.banco-website` | Next.js consumer website |
| `deploy/coolify/nginx.conf` | Routing الكامل |
| `deploy/coolify/COOLIFY-DEPLOY-ORDER.md` | ترتيب النشر |

---

## 🔑 Secrets المطلوبة (Coolify Environment)

### API Server (`api` service)
```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:pass@postgres:5432/banco
SESSION_SECRET=<64-char random>

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# دفع
PAYMENT_CONFIG_ENCRYPTION_KEY=<openssl rand -hex 32>
PAYMOB_SECRET_KEY=...
PAYMOB_PUBLIC_KEY=...
PAYMOB_HMAC_SECRET=...
PAYMOB_INTEGRATION_IDS={"card":"XXXXX","wallet":"XXXXX"}
PAYMOB_MODE=live

# Storage (S3/R2)
OBJECT_STORAGE_PROVIDER=s3
S3_BUCKET=banco-assets
AWS_REGION=auto
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://...r2.cloudflarestorage.com
PUBLIC_OBJECT_SEARCH_PATHS=images/,videos/
PRIVATE_OBJECT_DIR=private/

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Email
RESEND_API_KEY=re_...

# URLs
CORS_ALLOWED_ORIGINS=https://banco.today,https://www.banco.today,https://app.banco.today
PUBLIC_API_BASE_URL=https://banco.today
PUBLIC_APP_URL=https://banco.today
```

### Web (nginx + landing + SPAs — `web` service)
```env
# Landing: وجهة زر "تطبيق بانكو"
VITE_WEB_URL=https://app.banco.today
VITE_MARKET_URL=https://banco.today/market/
VITE_ADMIN_URL=https://banco.today/admin/

# Dealer-OS (بانكو ماركت)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Admin-OS
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### banco-website (`banco-website` service — Next.js)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_API_URL=https://banco.today
NEXT_PUBLIC_SITE_URL=https://app.banco.today
NEXT_PUBLIC_SITE_URL_EN=https://app.banco.today/en
NEXT_PUBLIC_MARKET_URL=https://banco.today/market/
NEXT_PUBLIC_ADMIN_URL=https://banco.today/admin/
NEXT_PUBLIC_APP_ANDROID_URL=https://play.google.com/store/apps/details?id=com.bancooom.app
NEXT_PUBLIC_APP_IOS_URL=https://apps.apple.com/app/id...
NEXT_PUBLIC_SEARCH_ENABLED=true
NEXT_PUBLIC_WEB_SEARCH_LIVE=true
WEB_PLUG_ENABLED=false
NEXT_PUBLIC_WEB_SEARCH_MAP=true
```

---

## 🚀 ترتيب النشر على Coolify

### الخطوة 1: DNS (Hostinger/Cloudflare)
```
banco.today     A     → Coolify VPS IP
www.banco.today CNAME → banco.today
app.banco.today CNAME → banco.today  (أو Coolify service IP)
banco.autos     CNAME → banco.today
banco.deals     CNAME → banco.today
```

### الخطوة 2: ضبط Coolify Services
1. **postgres** — persistent volume `banco_pgdata`
2. **api** — depends on postgres; secrets كما أعلاه
3. **web** — depends on api; يبني: landing + dealer-os + admin-os + nginx
4. **banco-website** — depends on api; Next.js standalone; port 3001

### الخطوة 3: تشغيل Migration
```bash
docker compose --profile migrate run --rm migrate
# ثم seed إذا قاعدة البيانات فارغة:
docker exec banco_api pnpm --filter @workspace/api-server run seed
```

### الخطوة 4: التحقق بعد النشر
```bash
# Health check
curl https://banco.today/nginx-health
curl https://banco.today/api/healthz
curl https://banco.today/api/readyz

# Well-known (deep links)
curl https://banco.today/.well-known/apple-app-site-association
curl https://banco.today/.well-known/assetlinks.json

# SPAs
curl -o /dev/null -w "%{http_code}" https://banco.today/
curl -o /dev/null -w "%{http_code}" https://banco.today/market/
curl -o /dev/null -w "%{http_code}" https://banco.today/admin/
```

### الخطوة 5: Clerk Dashboard
1. **Social Sign-in**: Settings → Social → فعّل Google + Apple
2. **Domains**: أضف `banco.today` كـ Production domain
3. **JWT Templates**: تأكد من الإعداد الصحيح

### الخطوة 6: Well-Known (Deep Links)
```bash
# في deploy/coolify/well-known/apple-app-site-association:
# استبدل REPLACE_APPLE_TEAM_ID بـ Apple Team ID الحقيقي (10 حروف)
# مثال: A1B2C3D4E5.com.bancooom.app

# في deploy/coolify/well-known/assetlinks.json:
# استبدل REPLACE_PLAY_APP_SIGNING_SHA256 بـ SHA-256 من Google Play Console
# Settings → App integrity → App signing key certificate → SHA-256 cert fingerprint
```

---

## 📱 EAS Build (Mobile)

### متطلبات
```env
# في EAS production environment:
EXPO_PUBLIC_API_BASE_URL=https://banco.today
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_DOMAIN=banco.today
EXPO_PUBLIC_ROUTER_ORIGIN=https://banco.today
```

### بناء
```bash
cd artifacts/banco-mobile
eas build --platform all --profile production
```

### App Identity
```
Bundle ID (iOS):  com.bancooom.app
Package (Android): com.bancooom.app
Scheme: bancooom
```

---

## 🌍 Domain Routing Logic

| الدومين | السلوك |
|---------|--------|
| `banco.today` | يعرض landing page |
| `www.banco.today` | يعرض landing page |
| `banco.deals` | redirect → `https://banco.today/market/` |
| `banco.autos` | redirect → `VITE_WEB_URL` (app.banco.today) |
| `app.banco.today` | banco-website (Next.js consumer) |

---

## ⚡ الوضع على Replit Dev

| السيرفيس | البورت | URL |
|----------|--------|-----|
| banco-website (Next.js) | 5000 | `https://${REPLIT_DEV_DOMAIN}` |
| api-server | 8080 | `http://localhost:8080` |
| landing | PORT (Replit inject) | artifact preview URL |
| dealer-os | PORT (Replit inject) | artifact preview URL |
| admin-os | PORT (Replit inject) | artifact preview URL |
| banco-mobile (Expo) | 8081 | artifact preview URL |

**ملاحظة Replit:** الروابط النسبية (`/market/`, `/admin/`) تعمل فقط على Coolify. على Replit كل artifact على URL منفصل.

---

## 🩺 قائمة Production Gaps (PRODUCTION_GAP_MATRIX)

| Gap | الوصف | الحل | الحالة |
|-----|--------|------|--------|
| G03 | AASA/assetlinks placeholders | Apple Team ID + Android SHA256 | ⏳ ينتظر owner |
| G04-G07 | DNS غير مضبوط | A/CNAME records → Coolify | ⏳ ينتظر owner |
| G10 | Coolify secrets فارغة | ضبط كل secrets كما أعلاه | ⏳ ينتظر owner |
| G11 | S3 bucket فارغ | إنشاء bucket + IAM keys | ⏳ ينتظر owner |
| G12 | DB migrations | تشغيل migrate profile | ⏳ بعد DNS |
| G14 | EAS production env | ضبط EXPO_PUBLIC_* | ⏳ ينتظر owner |
| G17 | Paymob live keys | ضبط في Coolify | ⏳ ينتظر owner |
| G21 | App identity | com.bancooom.app ✅ صح | ✅ مضبوط |
| G41 | SSL على Hostinger | Coolify Traefik certificates | ⏳ بعد DNS |
| G42-G43 | App store listings | Apple Dev + Google Play | ⏳ ينتظر owner |
| G55 | Clerk test keys | pk_live_/sk_live_ | ⏳ ينتظر owner |
| G56 | PAYMENT_CONFIG_ENCRYPTION_KEY | ✅ مضبوط الآن | ✅ مضبوط |
| G57 | Postgres password/volume | ضبط في Coolify | ⏳ ينتظر owner |
| G63 | LIVE-01 NOT_CUTOVER | بعد G04+G10+G12 | ⏳ ينتظر DNS |

---

## ✅ ما تم إصلاحه في Replit (هذه الجلسة)

| الإصلاح | الحالة |
|---------|--------|
| `PAYMENT_CONFIG_ENCRYPTION_KEY` (generated + set) | ✅ |
| `VITE_WEB_URL` → banco-website Replit URL | ✅ |
| `VITE_MARKET_URL` و `VITE_ADMIN_URL` | ✅ |
| `NEXT_PUBLIC_API_URL=http://localhost:8080` | ✅ |
| `NEXT_PUBLIC_SITE_URL` و `NEXT_PUBLIC_*` | ✅ |
| `WEB_PLUG_ENABLED=false` | ✅ |
| `RESEND_API_KEY` (real secret) | ✅ |
| Error boundaries لـ web dashboard | ✅ |
| Object storage graceful fallback | ✅ |
| AI modelfarm URL مسحت | ✅ |
| Clerk Secret Key مصلّح | ✅ |
| dealer-os `.env.example` | ✅ |
| admin-os `.env.example` | ✅ |
| `docs/FEATURES.md` كامل | ✅ |
| `docs/MAINTENANCE.md` | ✅ |
| GitHub push | ✅ |
