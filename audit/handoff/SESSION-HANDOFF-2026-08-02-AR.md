# تسليم جلسة كاملة — 2026-08-02

> **الهدف من الملف ده:** أي حد (إنسان أو إيجنت) يفتحه ويعرف بالظبط إيه اللي حصل،
> إيه اللي اتحقق منه بالدليل، إيه المفتوح، وإيه اللي **مينفعش** يتعمل — من غير ما
> يحتاج يرجع لأي شات.
>
> **القاعدة الأولى هنا:** كل رقم في الملف ده متقاس أو متحقق منه. اللي مش متأكد منه
> مكتوب صراحةً إنه مش متأكد.

---

## 0. خريطة سريعة

| | |
|---|---|
| المستودع | `waelzaid66-max/bancoboomstor` — مصدر الحقيقة الوحيد |
| `main` | `ca5a1ed` — شغل السيارات مدموج |
| برانش الشغل | `claude/headers-dynamic-polish` — 6 كوميتات فوق main |
| المواصفة الرسمية | `audit/handoff/DYNAMIC-HEADER-SPEC-AR.md` |
| تسليم الهيدر | `audit/handoff/BOOM-CAR-HERO-HEADER-HANDOFF.md` |

---

## 1. أول حاجة اتعملت: الوصول للريبو الصح

الجلسة بدأت على `banco-with-wael` وده **مستودع مهجور**. الصح `bancoboomstor`، اتعمل
يوم 2026-08-01 الساعة 4:23 صباحًا بكوميت اسمه حرفيًا
*"initialise bancoboomstor as the single production source of truth"*.

**درس للي جاي:** قبل أي شغل، اتأكد إنك على `bancoboomstor`. لو لقيت نفسك على
`banco-with-wael` أو `-BANCO-CA-OOM-` أو `aws-virgen` أو `bancooom` — إنت في
المكان الغلط.

### جرد الهجرة (متحقق منه بالعد، مش بالثقة)

- **2,535 → 2,547 ملف.** صفر ملف ضايع.
- الملفين الوحيدين اللي "اختفوا" هما `sync-aws-virgen.yml` و `sync-bancooom.yml`
  — **اتنقلوا لأرشيف** `.github/workflows-archive/` مش اتحذفوا. ودول كانوا **سبب
  تكاثر النسخ** التسعة.
- فحصت 57 فرع في المستودع القديم: **48 مدموجين**، و8 فيهم شغل مش مدموج — لكن
  **99% منه ملفات تقارير `docs(council)` مش كود**.

---

## 2. الشغل اللي اتنفذ (كل واحد بدليله)

### 2-أ · دمج السيارات في `main` — `ca5a1ed`

كان في برانش مش مدموج فيه: طيّ الفلاتر + الهيرو + حارس النزاهة + إصلاحات النشر.
**اتحقق:** `carFiltersOpen` = 11 موضع في البرانش، **صفر** في main — فالمالك كان
شايف النسخة القديمة.

### 2-ب · إصلاحات النشر — خطر فقدان بيانات حقيقي

لقيت **4 مسارات** لسه بتشغّل `drizzle-kit push --force` على قواعد فيها بيانات:

| الملف | كان | بقى |
|---|---|---|
| `scripts/post-merge.sh` | `push-force` | `run migrate` |
| `docker-compose.coolify.yml` | `push -- --force` | `run migrate` |
| `docker-compose.prod.yml` | `push -- --force` | `run migrate` |
| `deploy/aws/scripts/db-migrate.sh` | `push-force` | `run migrate` |

`--force` موجود عشان **يخرس تحذير فقدان البيانات** — تغيير اسم عمود كان بياخد
بياناته معاه في صمت. الرابع **مش في جدول التبني** بتاع الزميل؛ لقيته بمسح كل ملفات
التشغيل.

**سِبت بقصد:** `ci.yml` و `deploy.yml` و `replit-dev-setup.sh` — دول على قواعد
مؤقتة، و`MIGRATIONS.md` بيسمح بـ `push-force` هناك صراحةً.

### 2-ج · آلية الهيدر المتحرك — `ea71942`

**الاكتشاف الجذري:** الهيدرز كلها **بره** قائمة النتائج.
`SearchResultsSurface.tsx` بيرندر `FlatList` **من غير `ListHeaderComponent` خالص**
(بحث في كل `components/search/` رجع صفر). عشان كده الهيدر ثابت ومستحيل يختفي.

الحل: `listHeader?: React.ReactElement | null` — prop **اختياري**، فالمستهلكين
التلاتة (`SectionSearchApp` · `BookingStaysApp` · `search.tsx`) ملمستش سلوكهم.

**فخ اتعالج:** `scrollEnabled={items.length > 0}` كان هيحبس الهيدر جوه قائمة فاضية.
بقى `items.length > 0 || !!listHeader`.

### 2-د · تقسيم هيدر السيارات — `a214482`

`slot?: "all" | "pinned" | "scroll"` بقيمة افتراضية `"all"` تحافظ على السلوك الأصلي.

**النتيجة المقيسة من الـ DOM الحقيقي:**

| | قبل | بعد |
|---|---|---|
| الكروم المثبّت | **465dp** | **136dp** |
| أول بطاقة | 511dp من 932 (55%) | — |

### 2-هـ · دقة اللون والأيقونات — `239761c`

**اللون بالقياس مش بالرأي:** سحبت اللون السائد من `banco-logo.png` = **`#CF1626`**.

| المرشح | البُعد لكل قناة |
|---|---|
| `#CC1E24` | **3 · 8 · 2** |
| `#E60012` | 23 · 22 · 38 |

اتربط بـ `sectionAccent("car")` بدل رقم مكتوب. التطبيق نزل من **5 لـ 4** درجات حمرا.

**الأيقونات:** `VehicleGlyph` كان `strokeWidth: 1.6` وكل أيقونات التطبيق **2**
(لأن `icons.tsx` بيمرر `size`+`color` بس فبيقع على افتراضي lucide). اتصلح.

### 2-و · عيب أندرويد — `dcc2c1a`

`PropertyHomeHeader` و `StaysHomeHeader` كانوا `paddingTop: topPad - 1`. على iOS
مفيش مشكلة (دايمًا فيه نوتش)، لكن على **أندرويد `insets.top` ممكن ترجع 0**
(`androidStatusBar` مش متظبط في `app.json`) → **padding سالب**.
`MaterialsHomeHeader` كان محمي أصلًا. وحّدت التلاتة.

### 2-ز · استخراج الأصول — `58d45be`

رندرات المالك **مش أصول منفصلة** — الوردمارك وشريط البحث والشرائح مدموجين جواها.
استخرجت اللوحة النظيفة:

| الأصل | المقاس | الحالة |
|---|---|---|
| `assets/images/section-hero/car.png` | 1216×453 | ✅ نضيفة |
| `assets/images/section-hero/materials.png` | 488×291 | ✅ نضيفة |
| العقارات | — | ❌ الرندر الوحيد **صورة موبايل مائلة فيها انعكاس زجاج** |

---

## 3. تدقيق الخمس هيدرز (بالقياس)

| # | القسم | الملف | الارتفاع | العلّة المحددة |
|---|---|---|---|---|
| ① | Property | `search/property/PropertyHomeHeader.tsx` | ~309dp | 4 أيقونات بلا تسميات · "POWERED BY" سطر لوحده · **صفّين فلاتر** · شريحة "الكل" أطول من جيرانها |
| ② | Cars | `search/car/CarsHomeHeader.tsx` | 465→136dp | ✅ اتصلحت |
| ③ | Materials | `search/materials/MaterialsHomeHeader.tsx` | ~180 + 105 شرائط | محاذاة متعرّجة في الصف التاني |
| ④ | Factories | *(لا يوجد — هيدر عام)* | — | 🔴 **مفيش هوية خالص** |
| ⑤ | Stays | `search/stays/StaysHomeHeader.tsx` | ~300dp | **الشعار بالإنجليزي في تطبيق عربي** · صفّين فلاتر |

**سبب التناثر:** `SectionSearchApp.tsx` → `chipStrip` فيه `flexWrap: "wrap"`.

### 🔴 عقبة بنيوية لسه مفتوحة

السيارات نجحت لأن **الوردمارك جوه الشريط العلوي**. في العقارات والمواد والحجز
الوردمارك في **كتلة منفصلة تحت** الشريط. لو اتطبق نفس التقسيم حرفيًا، **الوردمارك
هينزل تحت شرائح الفلاتر** — شكل غلط.

**الحل المقترح:** نقل الوردمارك المصغّر لجوه الشريط العلوي في التلاتة (زي السيارات).
ده **بوليش حقيقي مش مجرد نقل** — ولسه محتاج قرار.

---

## 4. عيوب حقيقية مرصودة ولسه مفتوحة

### 4-أ · 🔴 باج بيمنع النشر فعليًا

`rental_term` معلّم **"اختياري"** لكنه **بيمنع الإرسال**:
`listingCreateTaxonomy.ts:274` بلا `required`، لكن `:384-386` بيضيفه للمطلوب لما
`offer_type === "rent"`. → **مستخدم بينشر إعلان إيجار ومش عارف ليه مش راضي يتبعت.**

### 4-ب · حقول متناقضة

| المشكلة | الدليل |
|---|---|
| سيارات: `year`/`mileage`/`fuel_type` معلّمين "مطلوب" لكن مخفيين جوه "تفاصيل أكثر" | `:250-253` مقابل `REQUIRED_SPEC_KEYS.car = ["condition"]` (`:329`) |
| `raw_materials.industry` نفس المشكلة | `:303` مقابل `:389-391` |
| `SPEC_LABELS` ناقصه 8 مفاتيح → **الصفحة العربية بتعرض إنجليزي** | `listingSpecs.ts:14-62` |
| `FINISHING_TYPES` = `"finished"` و`VALUE_LABELS` = `fully_finished` | `taxonomy:144` / `listingSpecs.ts:66` |

### 4-ج · أزرار الدول مفرودة

`MarketCountryPicker.tsx` عنده **3 مستويات كثافة** — `trigger` 180px · `triggerCompact`
160px · `triggerMicro` 88px.

- `triggerMicro` مستخدم في **مكان واحد بس** (`PropertyHomeHeader:316`)
- الـ prop `compact` **ميت تمامًا** — متعرّف (`:286`) ومش متمرر في أي مكان
- **أسوأ موضع:** `search.tsx:775` — الزرار واخد **صف كامل لوحده** = ~42dp ضايعة
- **إنشاء الإعلان:** السوق + العملة + المنشأ = **3 حقول مستقلة** ≈ 150dp

### 4-د · استيراد السيارات — بلا هوية

- بيخترع `RED = "#E53935"` (`app/import/index.tsx:32`) — **مش** أي أحمر تاني في التطبيق
- **ولا ملف واحد** بيستورد `lib/sectionTheme.ts`
- **ولا ملف واحد** بيحمّل `boom-logo.png` أو `banco-logo.png` → صفر هوية بصرية
- `order/[id].tsx:41-46` فيه **ألوان قوس قزح** (برتقالي/أزرق/بنفسجي/أخضر) بتكسر
  قاعدة "عائلة الأحمر" المكتوبة في `sectionTheme.ts:9-14`
- **ادعاءات غير مدعومة:** شارة "Integration-ready" بلا تكامل · أرقام `"8+"` و`"21"` ثابتة

### 4-هـ · 🚨 أمني — لسه مفتوح ومحتاج المالك

مفتاح تشفير مدفوعات AES-256 حقيقي **لسه في تاريخ `banco-with-wael`، والريبو public.**
اتشال من `bancoboomstor` لكن التاريخ القديم شايله.

**مطلوب:** تدوير المفتاح، وبعدها **إعادة حفظ إعدادات الدفع** (البيانات المشفّرة
مربوطة بالمفتاح القديم).

---

## 5. حاجات **ممنوعة** — اتعلمت بالغلط في الجلسة دي

1. **ممنوع خلط فلاتر الأقسام.** كل قسم يملك نسخته من `useSearchMiniApp`
   (`SectionSearchApp.tsx:196`). محمي بحرّاس: `no category melt` · `cars-force` ·
   `lockCategory` · `Discover→Search melt bridge`.
2. **ممنوع أي بيانات وهمية.** محمي بـ `tests/car-hero-honesty-guard.test.mjs`
   (5 اختبارات) — **متحقق إنه بيمسك فعلًا**: حقنت `"1.2M+"` والاختبار فشل.
3. **ممنوع الحذف.** الشرائح بتتنقل مش بتتشال. كل `testID` يفضل.
4. **ممنوع تكتب اسم testID ممنوع حتى في تعليق.** الحرّاس بيعملوا grep على النص
   الخام — كتبت `cars-market-beside-banco` في تعليق توثيقي والاختبار فشل.
5. **ممنوع `onOpenMap={() => {}}`** — الحارس مسكها. أي handler فاضي = كنترول ميت.
6. **ممنوع `pkill -f "expo"`** — بيضرب النسخة الجديدة مع القديمة.

---

## 6. بيئة التشغيل — الوصفة اللي اشتغلت

```bash
service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb banco_test
psql -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"   # لازم قبل push

corepack enable && corepack prepare pnpm@11.9.0 --activate
pnpm install                                         # يحتاج dtrace-provider محسومة

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banco_test"
pnpm --filter @workspace/db run push-force           # مش push -- --force
pnpm --filter @workspace/api-server run seed:reference
pnpm --filter @workspace/api-server run seed:car-brands

PORT=3000 SESSION_SECRET="..." CLERK_SECRET_KEY="sk_test_..." \
  pnpm --filter @workspace/api-server run dev

cd artifacts/banco-mobile
env -u EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY EXPO_PUBLIC_API_BASE_URL="http://localhost:3000" \
  CI=1 npx expo start --web --offline --port 8081
```

**النتيجة:** 58 إعلان مبذور (25 سيارة). الـ API بيرد `car: 25` على
`/api/v1/search/facets?category=car`.

### ⚠️ حد البيئة — مهم جدًا

**التطبيق مش بيبعت أي طلب بحث في البيئة دي** (صفر نداء API — اتحقق منه بمراقبة الشبكة).
السبب: مفيش Clerk حقيقي → التطبيق بيرندر signed-out. النتيجة: **الكروت تفضل رمادية
والـ overlay بيغطي الهيرو.**

**معناه:** أي قياس أرقام موثوق ✅ · أي حكم بصري نهائي **مش ممكن هنا** ❌.
محتاج جهاز حقيقي أو مفتاح Clerk تجريبي شغال.

---

## 7. بوابات التحقق — تتشغّل بعد **كل** مرحلة

```bash
cd artifacts/banco-mobile
npx tsc --noEmit --skipLibCheck -p tsconfig.json      # لازم 0
for t in tests/*.test.mjs; do node --test "$t"; done   # 294 نجح · 0 فشل
cd /workspace/bancoboomstor && node scripts/chain-integrity-gate.mjs   # 198/198
```

> `tsc` لازم يتشغّل بعد `npx tsc --build lib/*` وإلا هتطلع أخطاء `TS6305` وهمية.
> و`tsc` العام في الحاوية 6.0.2 بينما المشروع على 5.9.3 — استخدم المحلي.

---

## 8. الحالة النهائية

**خلص ومتحقق منه:** الوصول للريبو الصح · دمج السيارات · 4 مسارات نشر خطرة اتقفلت ·
آلية الهيدر · تقسيم السيارات (465→136dp) · اللون بالقياس · سُمك الأيقونات · عيب
أندرويد · لوحتين فنيتين · المواصفة موثّقة.

**مفتوح ومحتاج قرار المالك:**

| # | البند | الحالة |
|---|---|---|
| 2 | الأحمر: `#CC1E24` (القياس) ولا `#E60012` (المواصفة)؟ | يوقف توحيد ألوان الاستيراد |
| 3 | «NO PNG» للأيقونات بس ولا الشعارات كمان؟ | لو الشعارات، محتاج `.svg` من المصمم |
| 4 | رندر مسطح للعقارات | الموجود مائل وفيه انعكاس |
| 5 | نقل الوردمارك لجوه الشريط العلوي في 3 هيدرز؟ | يفك عقبة الترتيب |
| 6 | أرقام الإحصائيات | مالهاش مصدر في الـ API |
| 7 | باج `rental_term` | 🔴 بيمنع نشر إعلانات الإيجار |

**الخطوة الجاية:** الهيدر المتحرك بـ Reanimated حسب
`audit/handoff/DYNAMIC-HEADER-SPEC-AR.md`. **كل المكتبات المطلوبة مثبتة بالفعل** —
`reanimated 4.1.1` · `gesture-handler 2.28` · `svg 15.12.1` · `safe-area-context 5.6` ·
`expo-blur 15.0.8` · `expo-router 6.0.24`.
