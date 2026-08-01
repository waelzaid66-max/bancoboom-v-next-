# BANCO — دليل الصيانة والاستكمال

> آخر تحديث: 2026-07-31

---

## 🚨 قبل الإطلاق الإنتاجي (مطلوب)

### 1. مفاتيح Clerk الحية
```
# في Replit Secrets:
CLERK_SECRET_KEY          = sk_live_...
CLERK_PUBLISHABLE_KEY     = pk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
VITE_CLERK_PUBLISHABLE_KEY        = pk_live_...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
```
**لماذا:** المفاتيح الحالية تجريبية (`pk_test_`) — لها حدود استخدام وتُظهر تحذيراً.  
**من أين:** Clerk Dashboard → Production instance → API Keys

### 2. مفاتيح Paymob
```
PAYMOB_SECRET_KEY        = من Paymob Dashboard → Settings → API Keys
PAYMOB_PUBLIC_KEY        = من نفس الصفحة
PAYMOB_HMAC_SECRET       = من Paymob → Settings → HMAC
PAYMOB_INTEGRATION_IDS   = {"card":"XXXXX","wallet":"XXXXX"}
```
**لماذا:** الدفع والاشتراكات لا تعمل بدونها.

### 3. مفتاح تشفير الدفع
```
PAYMENT_CONFIG_ENCRYPTION_KEY = <32-byte hex>
```
توليده: `openssl rand -hex 32`  
**لماذا:** يُشفّر بيانات Paymob في قاعدة البيانات.

### 4. OpenAI (المساعد الذكي)
```
OPENAI_API_KEY = sk-...
```
**الحالي:** placeholder تجريبي — يُعيد خطأ `invalid_api_key` لكن لا يكسر السيرفر.

---

## 🔧 مشاكل تقنية مكتشفة تحتاج إصلاح

### أ. `financial_institution` ناقص من DB enum
**الأعراض:** بعض مسارات التمويل تُعيد خطأ عند الاستخدام.  
**الحل:** إضافة `financial_institution` لـ enum في `drizzle` schema + push migration.  
**الملف:** `artifacts/api-server/src/db/schema.ts`

### ب. Apple/Google Sign-In غير مفعّل
**الأعراض:** أزرار Apple/Google لا تظهر أو تُعيد خطأ.  
**الحل:** من Clerk Dashboard → Social Connections → تفعيل Google + Apple.  
**لا يحتاج تغيير في الكود.**

### ج. صور المنتجات فارغة
**الأعراض:** كل الإعلانات (52) بلا صور.  
**الحل:** رفع صور حقيقية عبر الـ workspace بعد تسجيل دخول.  
**المسار:** `POST /api/v1/uploads/request-url` → signed PUT → `POST /api/v1/uploads/verify`

### د. Expo Go crash (إشعارات)
**الأعراض:** التطبيق يكرش على Expo Go بسبب `expo-notifications` SDK 53.  
**الحل المعروف:** تعطيل `expo-notifications` في dev أو البناء كـ native binary عبر EAS.  
**مرجع:** `artifacts/banco-mobile`

---

## 📋 قائمة الصيانة الدورية

### يومياً
- [ ] فحص API health: `curl https://banco.today/api/healthz`
- [ ] مراجعة أخطاء السيرفر في Replit logs

### أسبوعياً
- [ ] مراجعة leads الجديدة في لوحة الأدمن
- [ ] فحص فواتير Resend (عدد الإيميلات المُرسلة)
- [ ] فحص Clerk Dashboard (عدد المستخدمين الجدد)

### شهرياً
- [ ] تحديث `pnpm outdated` وإصلاح المشاكل
- [ ] مراجعة تقارير Paymob (transactions)
- [ ] تدوير `PAYMENT_CONFIG_ENCRYPTION_KEY` إذا لزم

---

## 🗺️ خريطة المسارات الصحيحة (API Quick Reference)

```
# Public
GET  /api/v1/listings                  — قائمة الإعلانات
GET  /api/v1/listings/:id              — تفاصيل إعلان
GET  /api/v1/search                    — بحث مع فلاتر
GET  /api/v1/search/facets             — إحصاءات الفلاتر
GET  /api/v1/search/map?min_lat=&max_lat=&min_lng=&max_lng=&zoom=
GET  /api/v1/search/trending
GET  /api/v1/search/autocomplete?q=
GET  /api/v1/feed
GET  /api/v1/sellers/:id

# Auth Required (Bearer token من Clerk)
GET  /api/v1/me                        — بياناتي
GET  /api/v1/me/listings               — إعلاناتي
POST /api/v1/me/ai/assistant           — المساعد الذكي
GET  /api/v1/conversations             — محادثاتي
POST /api/v1/conversations             — محادثة جديدة
POST /api/v1/conversations/:id/messages
GET  /api/v1/saves                     — محفوظاتي
GET  /api/v1/wallet                    — محفظتي
GET  /api/v1/notifications
GET  /api/v1/bookings
POST /api/v1/leads/contact             — كشف رقم البائع (lead)
POST /api/v1/uploads/request-url       — رابط رفع صورة/فيديو
GET  /api/v1/subscriptions/plans
GET  /api/v1/subscriptions/me
```

---

## 🔄 إعادة التشغيل بعد تغيير Secrets

بعد أي تغيير في Replit Secrets:
1. أعد تشغيل `artifacts/api-server: API Server`
2. أعد تشغيل `Web App`
3. أعد تشغيل `artifacts/dealer-os: web`
4. أعد تشغيل `artifacts/admin-os: web`

للتحقق:
```bash
curl https://banco.today/api/healthz
```

---

## 🚀 للنشر على Coolify (مستقبلاً)

يحتاج إضافة:
- Cloudflare R2 bucket (أو AWS S3)
- `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT`
- راجع `deploy/coolify/COOLIFY-DEPLOY-ORDER.md` للتفاصيل الكاملة
