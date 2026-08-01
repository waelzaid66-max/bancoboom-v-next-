# BANCO — خريطة المميزات الكاملة

> آخر تحديث: 2026-07-31  
> الحالة: نسخة تجريبية على Replit — جاهزة للاختبار الكامل قبل الإنتاج

---

## ✅ مميزات عاملة بالكامل

### 🔍 البحث والاكتشاف
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| بحث نصي كامل | `GET /api/v1/search` | مع فلاتر، ترتيب، صفحات |
| فلاتر (category, condition, price, fuel…) | `GET /api/v1/search?filters=` | فلاتر مدمجة في search |
| Facets (إحصاءات الفلاتر) | `GET /api/v1/search/facets` | category, condition, fuel_type… |
| خريطة تفاعلية (clusters) | `GET /api/v1/search/map?min_lat=&max_lat=&min_lng=&max_lng=&zoom=` | OSM/Leaflet CDN |
| إكمال تلقائي | `GET /api/v1/search/autocomplete?q=` | |
| Trending searches | `GET /api/v1/search/trending` | |
| Recommendations | `GET /api/v1/search/recommendations` | يتطلب auth |
| خلاصة Feed | `GET /api/v1/feed` | مبني على FeedItem contract |
| Stories | `GET /api/v1/stories` | |

### 📋 الإعلانات (Listings)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| قائمة عامة | `GET /api/v1/listings` | |
| تفاصيل إعلان | `GET /api/v1/listings/:id` | |
| إنشاء إعلان | `POST /api/v1/listings` | يتطلب auth |
| تعديل إعلان | `PATCH /api/v1/listings/:id` | |
| حذف إعلان | `DELETE /api/v1/listings/:id` | |
| إعلاناتي | `GET /api/v1/me/listings` | |
| إدارة الإعلانات | `GET /api/v1/me/listings/manage` | |
| Bump (رفع الإعلان) | `POST /api/v1/listings/:id/bump` | |
| إنشاء حجز على إعلان | `POST /api/v1/listings/:id/bookings` | |
| ربط إعلانات | `POST /api/v1/listings/:id/links` | |
| تعليقات على إعلان | `POST /api/v1/listings/:id/comments` | |
| insights (تحليل السعر) | `GET /api/v1/listings/:id/insights` | |

### 💬 الرسائل والمحادثات
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| قائمة المحادثات | `GET /api/v1/conversations` | يتطلب auth |
| إنشاء محادثة | `POST /api/v1/conversations` | |
| رسائل محادثة | `GET /api/v1/conversations/:id/messages` | |
| إرسال رسالة | `POST /api/v1/conversations/:id/messages` | |
| ردود فعل على رسالة | `POST /api/v1/conversations/:id/messages/:msgId/reactions` | |
| تحديد كمقروءة | `POST /api/v1/conversations/:id/read` | |
| حذف (soft-hide) | `DELETE /api/v1/conversations/:id` | حذف للمشارك فقط |

### 👤 المستخدم والحساب
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| بيانات المستخدم | `GET /api/v1/me` | |
| تعديل الحساب | `PATCH /api/v1/me` | |
| تعديل بيانات الشركة | `PATCH /api/v1/me/company` | |
| المتابَعون | `GET /api/v1/me/following` | |
| المقاييس | `GET /api/v1/me/metrics` | |
| الروابط الاجتماعية | `GET/PUT /api/v1/me/social-links` | |
| الأذونات | `GET/PUT /api/v1/me/permissions` | |
| بحث محفوظ | `GET/POST/PATCH/DELETE /api/v1/me/saved-searches` | |

### 💾 المحفوظات (Saves)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| قائمة المحفوظات | `GET /api/v1/saves` | يتطلب auth |
| حفظ/إلغاء حفظ إعلان | `POST /api/v1/saves` | toggle |

### 📤 الرفع (Uploads)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| طلب رابط رفع موقّع | `POST /api/v1/uploads/request-url` | يتطلب auth |
| تأكيد الرفع | `POST /api/v1/uploads/verify` | |

### 🔔 الإشعارات
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| قائمة الإشعارات | `GET /api/v1/notifications` | يتطلب auth |
| تحديد كمقروء | `PATCH /api/v1/notifications/:id/read` | |
| إعدادات الإشعارات | `GET/PATCH /api/v1/notifications/settings` | |
| إيميل (Resend) | — | `RESEND_API_KEY` مضبوط ✅ |

### 🤖 المساعد الذكي (AI)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| سؤال المساعد | `POST /api/v1/me/ai/assistant` | يتطلب auth + `OPENAI_API_KEY` |
| النموذج | — | `gpt-4o-mini` (قابل للتغيير في env) |

### 💰 المدفوعات والمحفظة
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| المحفظة | `GET /api/v1/wallet` | يتطلب auth |
| شحن المحفظة | `POST /api/v1/wallet/topup` | |
| سحب | `POST /api/v1/wallet/withdraw` | |
| الاشتراكات | `GET /api/v1/subscriptions/plans` | |
| اشتراكي | `GET /api/v1/subscriptions/me` | |
| إنشاء اشتراك | `POST /api/v1/subscriptions` | |
| Paymob checkout | `POST /api/v1/payments` | يتطلب `PAYMOB_SECRET_KEY` |

### 📅 الحجوزات (Bookings)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| حجوزاتي | `GET /api/v1/bookings` | يتطلب auth |
| إنشاء حجز | على listing route | |

### 🏭 B2B / سلسلة التوريد
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| طلبات العروض (RFQs) | `GET/POST /api/v1/rfqs` | |
| أوامر الاستيراد | `GET/POST /api/v1/import-orders` | |
| التوريد العالمي | `GET /api/v1/global-supply` | |
| الاستثمارات | `GET /api/v1/investments` | |
| الشركات | `GET/POST /api/v1/companies` | |
| البائعون | `GET /api/v1/sellers` | |

### 🏦 التمويل والبنوك
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| طلبات التمويل | `GET/POST /api/v1/financing` | |

### 📊 التاجر (Dealer)
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| dealer workspace | artifact `dealer-os` (port 3001) | BANCO Market |
| analytics | `GET /api/v1/dealer/analytics` | |
| leads | `POST /api/v1/leads/contact` | |
| behavior signal | `POST /api/v1/leads/signal` | |

### 👑 الأدمن
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| لوحة الأدمن | artifact `admin-os` (port 3002) | BANCO Admin |
| قائمة المستخدمين | `GET /api/v1/admin/users` | |
| قائمة الإعلانات | `GET /api/v1/admin/listings` | |
| الإيرادات | `GET /api/v1/admin/revenue` | |
| الاشتراكات | `GET /api/v1/admin/subscriptions` | |

### 📱 التطبيق المحمول
| الميزة | المسار | ملاحظات |
|--------|--------|----------|
| الشاشة الرئيسية + Feed | `(tabs)/index.tsx` | |
| البحث | `(tabs)/search.tsx` | مع خريطة |
| الرسائل | `(tabs)/messages.tsx` | |
| المحفوظات | `(tabs)/saved.tsx` | |
| الحساب الشخصي | `(tabs)/profile.tsx` | |
| تفاصيل إعلان | `listing/[id].tsx` | |
| إنشاء إعلان | `listings/create.tsx` | |
| المحادثة | `messages/[id].tsx` | |
| المحفظة | `billing/wallet.tsx` | |

### 🌐 الـ Landing Page
| الميزة | ملاحظات |
|--------|----------|
| صفحة الهبوط | artifact `landing` — `banco.today/` |
| زر الدخول | يوجّه لـ banco-mobile |

---

## ⚠️ مميزات تحتاج secrets للإنتاج

| الميزة | المطلوب |
|--------|---------|
| تسجيل الدخول الحقيقي | Clerk live keys (`pk_live_` / `sk_live_`) |
| الدفع عبر Paymob | `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS` |
| تشفير بيانات الدفع | `PAYMENT_CONFIG_ENCRYPTION_KEY` (32-byte hex) |
| Apple/Google sign-in | تفعيل من Clerk Dashboard |

---

## ❌ قيود معروفة (لا تمسّ الميزة)

| القيد | التوضيح |
|-------|---------|
| Real-time chat | لا يوجد WebSocket — الرسائل بـ polling |
| Push notifications | تعتمد على Expo + Resend email |
| `financial_institution` DB enum | ناقص في schema — يسبب خطأ في بعض مسارات التمويل |
| صور المنتجات | البيانات التجريبية بلا صور — تحتاج رفع يدوي |
