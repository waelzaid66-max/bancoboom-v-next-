# BANCO — قائمة إعداد الإنتاج الكاملة

## الوضع الحالي
- ✅ API Server — يعمل (port 8080)
- ✅ Object Storage — يعمل تلقائياً
- ✅ Messaging / Conversations — مكتمل
- ✅ Search / Listings — يعمل
- ✅ Auth gates — محمية صح
- ⚠️ Clerk keys — مفاتيح تجريبية (dev) الآن

---

## 🔑 Secrets المطلوبة من Replit Secrets Panel

### 1. Clerk (المصادقة) — الأهم
الـ keys الحالية هي `pk_test_` / `sk_test_` (تجريبية). للإنتاج الحقيقي:

| المفتاح | القيمة |
|---------|--------|
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` (من Clerk Dashboard → API Keys) |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | نفس `pk_live_...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | نفس `pk_live_...` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | نفس `pk_live_...` |

### 2. OpenAI (المساعد الذكي)
| المفتاح | القيمة |
|---------|--------|
| `OPENAI_API_KEY` | `sk-...` (من platform.openai.com) |

### 3. Resend (الإيميلات والإشعارات)
| المفتاح | القيمة |
|---------|--------|
| `RESEND_API_KEY` | `re_...` (من resend.com → API Keys) |

### 4. Paymob (الدفع)
| المفتاح | القيمة |
|---------|--------|
| `PAYMOB_SECRET_KEY` | من Paymob Dashboard |
| `PAYMOB_PUBLIC_KEY` | من Paymob Dashboard |
| `PAYMOB_HMAC_SECRET` | من Paymob Dashboard → HMAC |
| `PAYMOB_INTEGRATION_IDS` | `{"card":"xxx","wallet":"xxx"}` (JSON) |

### 5. تشفير بيانات الدفع
| المفتاح | القيمة |
|---------|--------|
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | 32-byte hex random key |

لتوليد قيمة: `openssl rand -hex 32`

---

## ✅ Env Vars المضبوطة بالفعل (لا تغيير)

| المفتاح | القيمة | ملاحظة |
|---------|--------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | ✅ |
| `PAYMOB_MODE` | `live` | ✅ |
| `PUBLIC_APP_URL` | `https://banco.today` | ✅ |
| `OBJECT_STORAGE_PROVIDER` | `s3` | ✅ (الكود يتعامل معه تلقائياً) |

---

## 🔧 بعد إضافة الـ Secrets

### أعد تشغيل الـ workflows:
```bash
# API Server
# Web App
# Expo Mobile
```

### اختبر كل شيء:
```bash
# Health check
curl https://banco.today/api/healthz

# Test listing
curl https://banco.today/api/v1/listings?limit=3
```

---

## 🚀 للنشر على Replit
1. أضف كل الـ secrets السابقة
2. اضغط "Publish" من Replit Dashboard
3. النوع: Autoscale Deployment

## 🐳 للنشر على Coolify لاحقاً
- راجع `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`
- محتاج إضافة: Cloudflare R2 bucket (للـ object storage)
- S3 credentials: `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT`
