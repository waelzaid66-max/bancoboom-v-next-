# B-OOM CAR — Hero Header · تسليم للزميل على اللاب توب

> **الحالة:** منفّذ ومدفوع. محتاج تشغيل فعلي + بند واحد على الباك إند.
> **الريبو:** `waelzaid66-max/bancoboomstor` — مصدر الحقيقة الوحيد
> **البرانش:** `claude/boom-car-hero-header`
>
> **عن مصدر الشغل:** اتعمل أصلًا على `banco-with-wael` قبل ما أعرف إن الهجرة
> لـ `bancoboomstor` حصلت، واتنقل هنا بـ patch. الثلاث ملفات المعدّلة
> (`CarsHomeHeader` · `SectionSearchApp` · `i18n`) اتأكد إنها **متطابقة
> بالبايت** بين الريبوهين قبل النقل، ومحدش لمسها في الـ 14 كوميت اللي بعد
> الهجرة — فالنقل اتطبّق نظيف بصفر تعارض.
>
> **التحقق في الريبو الجديد:** 191 guard test نجحوا · `chain-integrity-gate`
> **198/198** · `i18n.ts` بيعدّي typecheck (تطابق عربي/إنجليزي) · صفر أخطاء
> syntax.

---

## 1. الهيدر المقصود بالظبط — لا يوجد لبس

الهدف هو **الطبقة الأولى بعد ما تدوس على بطاقة السيارات في صفحة السيرش**.

سلسلة الوصول الكاملة، ملف بملف:

| # | الملف | السطر | الدور |
|---|---|---|---|
| 1 | `artifacts/banco-mobile/components/SearchDiscover.tsx` | 115–127 | `sectionGrid` → `sectionCard` — بطاقة السيارات نفسها في صفحة السيرش |
| 2 | نفس الملف | 95 | `router.push(SECTION_ROUTE[cat])` → `/section/car` |
| 3 | `artifacts/banco-mobile/app/section/car.tsx` | 16 | `<SectionSearchApp category="car" …/>` |
| 4 | `artifacts/banco-mobile/components/search/SectionSearchApp.tsx` | ~1389 | `isCarSection ? <CarsHomeHeader …/>` |
| 5 | **`artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx`** | كامل الملف | ← **الهيدر المطلوب. ده اللي اتعاد بناؤه.** |

**تأكيد إنه الملف الصح:** الكود القديم في الملف ده كان بيرسم حرفيًا اللي في سكرين شوت المالك — أيقونتَي `bookmark` + `map` فوق شمال، سهم يمين، `CAR` + لوجو `B-OOM`، سطر `سوق أصحاب بانكو المفتوح` بخطين رفيعين جنبه، `powered by BANCO`، وبعدين شريط البحث.

**مش ده المطلوب (متلمسوش):**
- `app/import/*` — CAR IMPORT عالم منفصل تمامًا، ممنوع دمجه.
- `components/search/stays/StaysHomeHeader.tsx` — ده المرجع النمطي بس، متتغيرش.
- `components/search/property/PropertyHomeHeader.tsx` و `materials/MaterialsHomeHeader.tsx`.

---

## 2. النمط المتبع (زي ما طلب المالك: نفس أسلوب بانكو استاي)

`StaysHomeHeader` بيرتب نفسه كده: `root → topBar → brandBlock → searchPill → tabsScroll` — والـ tabs بتعيش **جوه الهيدر نفسه**.

`CarsHomeHeader` الجديد اتبنى على نفس المنطق، بزيادة طبقتين:

```
A  topBar      رجوع · لوجو B-OOM CAR + powered by BANCO · جرس · بروفايل
B  hero        عنوان سطرين · وصف · 5 مزايا ثقة · إضاءة حمراء (240–260px)
C  search      بيل 56px نصف قطر 20 · (خريطة + حفظ جوه البيل) · زرار فلاتر أحمر دائري
D  categories  21 نوع مركبة — سكرول أفقي
E  stats       شريط أرقام رفيع
```

---

## 3. الملفات اللي اتغيرت

| الملف | التغيير |
|---|---|
| `components/search/car/CarsHomeHeader.tsx` | إعادة بناء كاملة (+689) |
| `components/search/car/VehicleGlyph.tsx` | **جديد** — 21 أيقونة مركبة SVG (+311) |
| `components/search/SectionSearchApp.tsx` | تعديل جراحي (+155) — طيّ الفلاتر + توصيل البروبس الجديدة |
| `constants/i18n.ts` | 42 مفتاح جديد × (EN + AR) |

---

## 4. مشكلة الفلاتر — الحل المطبّق

**كان:** `market + sort + offer mode + engines + brand + origin` كلهم بيترسموا مع بعض في `chipStrip` اللي فيه `flexWrap: "wrap"` → **5 صفوف مفروشة على الشاشة كلها**، وأول إعلان يبدأ تحت الطية.

**بقى:** لقسم السيارات فقط، المحاور دي كلها **مطوية خلف زرار واحد** تحت الفئات مباشرة.

### ⚠️ القاعدة اللي لازم تتحافظ عليها — مفيش حاجة اتحذفت

فيه **guard tests** بتفحص نص الكود الخام وبتفشل لو أي `testID` اختفى. المحاور محتفظة بمقاعدها بالكامل، بس اتغيّر **شرط الظهور** بس:

```tsx
// SectionSearchApp.tsx — الشريط الأساسي (سطر ~1727)
{!isRealEstateSection && !isMaterialsSection && (!isCarSection || carFiltersOpen) ? (
  <View testID="section-primary-strip">   // ← موجود زي ما هو

// شريط الماركة/المنشأ (سطر ~1975)
{showCarBrandStrip && carFiltersOpen ? (
  <ScrollView testID="car-brand-origin-strip">   // ← موجود زي ما هو
    <View testID="car-brand-strip">              // ← guard بيطلبه
    <View testID="car-origin-strip">             // ← guard بيطلبه
```

**الدول:** `MarketCountryButton` لسه مقعده الوحيد هو `section-primary-strip` (ده مطلب guard اسمه `W8 D-W8-01`). بقى جوه الكتلة المطوية → زرار واحد مش صف كامل. **ممنوع** نقله لجوه `CarsHomeHeader` — فيه اختبار بيفشل لو الملف احتوى على `cars-market-beside-banco` أو `section-sort-cycle`.

> **فخ وقعت فيه وأنا بنفّذ:** الـ guard بيعمل grep على **النص الخام** للملف. كتبت تعليق توثيقي فيه الاسمين دول حرفيًا فالاختبار فشل. لو محتاج تذكرهم في تعليق، اكتبهم موصوفين مش حرفيًا.

**الوصول للفلاتر بقى من مكانين:** زرار الفلاتر الأحمر في صف البحث (يفتح `FilterSheet`)، أو زرار الطيّ تحت الفئات (`testID="car-filters-toggle"`). وكمان الضغط على فئة **"المزيد"** بيفتح كتلة الفلاتر.

---

## 5. ثلاث قرارات هندسية — محتاجة مراجعتك

### 5.1 أيقونات المركبات: مرسومة SVG يدوي مش من lucide

`lucide-react-native` **مفيهاش** أيقونة موتوسيكل ولا أتوبيس ولا يخت ولا هليكوبتر. خلط بدائل من مكتبات مختلفة هو بالظبط اللي خلى الشريط القديم شكله غير متسق.

كمان `node_modules` مش متثبتة في بيئتي، يعني **مقدرتش أتحقق** إن اسم import معين موجود فعلًا — واستيراد اسم غلط بيكسر البيلد كله. فاخترت أرسمهم `react-native-svg` (موجودة أصلًا في المشروع ومستخدمة في `components/icons.tsx`).

القواعد في `VehicleGlyph.tsx`: `viewBox` 24×24، `strokeWidth` 1.6، أطراف دائرية، الكتلة البصرية بين y=6 و y=18.

> **لو عندك lucide متثبتة على اللاب توب:** تقدر تتحقق بسرعة وتستبدل اللي متأكد منه — بس لازم يفضل نفس الوزن البصري لكل الـ 21، متخلطش.

### 5.2 قرار المالك اتحسم: **كل حاجة تتربط بداتا حقيقية — ممنوع أي شيء وهمي**

> المالك، 2026-08-01: *"كلو يتربط بداتا حقيقية ممنوع اي شيء وهمي تماما"*

اتطبق حرفيًا. اللي اتغير نتيجة القرار ده:

| العنصر | كان | بقى |
|---|---|---|
| شريط الأرقام | رقم واحد ثابت | **عدّاد حي** من `scopedFacets.category.car` + عدد الأسواق |
| شريط الـ 21 فئة | بيترسم كله | **مطفي بالكامل** لحد ما يبقى ليه facet حقيقي |
| `24/7 Support` | ادعاء توفر | `دعم لما تحتاجه` — الدعم حقيقي، الـ 24/7 لأ |
| الأرقام التسويقية | — | **ممنوعة باختبار** |

**اتضاف guard test جديد:** `tests/car-hero-honesty-guard.test.mjs` (5 اختبارات) بيفشل البيلد لو حد رجّع رقم وهمي. **متحقق إنه بيمسك فعلًا** — جربت أحقن `"1.2M+"` والاختبار فشل زي المتوقع.

### 5.3 🚨 البلوكر الحقيقي — الـ API مش بيفرق بين اليخت والسيارة

ده أهم اكتشاف في الشغل كله، ولازم قرار منك ومن مهندس الباك إند.

**الأدلة من عقد الـ API نفسه (مصدر الحقيقة):**

```yaml
# lib/api-spec/openapi.yaml → GET /v1/search (سطر 5196)
- in: query
  name: category
  schema:
    enum: [car, real_estate, industrial]     # ← تلاتة بس
# مفيش body_type · مفيش vehicle_type
```

```ts
// lib/api-client-react/.../api.schemas.ts → FacetCounts (سطر ~106-127)
category · condition · fuel_type · transmission · payment_plan ·
property_type · finishing_type · offer_type · industrial_type ·
industry · origin_type
// ← مفيش أي facet لنوع المركبة
```

**يعني:** الباك إند **مش قادر** يفرق بين يخت وسيدان — الاتنين `category=car`. الحقل `body_type` موجود في مواصفات الإعلان (`listingSpecs.ts`) لكنه **مش parameter في البحث ولا facet**، وبيغطي السيارات بس (`sedan/suv/crossover/hatchback/coupe/convertible/pickup/minivan/van`) — مفيهوش موتوسيكلات ولا قوارب ولا طيارات.

**النتيجة:** دوسة على "يخوت" مش هتقدر تفلتر. أقصى حاجة تعملها إنها تخمن بالبحث النصي وتوصّل المستخدم لشاشة فاضية — وده بالظبط اللي فلسفة المشروع نفسها بتمنعه:

> `lib/facets.ts`: *"gate browse chips so we never surface a chip that returns nothing"*

**القرار المطبق:** الشريط **متبني بالكامل** (الـ 21 أيقونة والليبلات والسكرول جاهزين) بس **مبوّب على الـ facets** فبيطلع فاضي دلوقتي → **Band D مش بيترسم أصلًا**. مفيش حاجة وهمية بتتشحن، والشريط هيولّع لوحده يوم ما الـ facet ينزل من غير أي تعديل في الواجهة.

**المطلوب من الباك إند عشان الشريط يشتغل:**
1. حقل `vehicle_type` (أو توسيع `body_type`) على الإعلان يغطي الـ 21 نوع
2. `vehicle_type` كـ query parameter في `GET /v1/search`
3. `vehicle_type` كـ map في `FacetCounts`

**بعدها التعديل عندك سطر واحد:** في `SectionSearchApp.tsx` → `carHeroCategories`، وجّه `typeCounts` على الماب الحقيقي بدل `undefined`.

---

## 6. الصورة السينمائية — ناقصة، محتاجة أصل جرافيك

المواصفات طلبت تكوين واحد: سوبركار أسود بانعكاسات حمراء (أمام) + يخت (وسط) + طيارة خاصة (أعلى) + شاحنة (أقصى يمين) + هليكوبتر (سما).

**دي مش شغل كود — دي أصل جرافيك.** مقدرتش أولّدها.

الموجود حاليًا: إضاءة حمراء سينمائية حقيقية بـ `RadialGradient` (مصدر ضوء رئيسي جانبي + انعكاس أرضي) على أسود نقي — يعني الهيرو مش فاضي، بس من غير المركبات.

**الصورة الموجودة `assets/images/categories/car.jpg` متستخدمش** — معرض سيارات أبيض ساطع، عكس المواصفات حرفيًا (`No white backgrounds`, `Pure Black`).

**لما الصورة تجهز:** حطها في `assets/images/car-hero.png` واعملها `<Image>` جوه `<View style={styles.hero}>` تحت `heroGlow` مباشرة و فوق `heroCopy`. الطبقات مترتبة كده أصلًا.

> ملاحظة تقنية اتصلحت أثناء التنفيذ: في SVG، الـ `radialGradient` مالهاش `rx`/`ry` — عندها `r` بس. الشكل البيضاوي بييجي من الـ `<Ellipse>` نفسها. لو عدّلت الإضاءة خلي بالك من دي.

---

## 7. التحقق اللي اتعمل ✅ واللي لسه ❌

### ✅ اتعمل

```bash
cd artifacts/banco-mobile

# 181 اختبار guard — كلهم نجحوا (بيشتغلوا بـ node مباشرة، مش محتاجين node_modules)
node --test tests/section-miniapp-guard.test.mjs      # 90 pass / 0 fail
node --test tests/ui-density-guard.test.mjs           #  4 pass / 0 fail
node --test tests/production-wiring-guard.test.mjs    # 47 pass / 0 fail
node --test tests/materials-core-guard.test.mjs       #  8 pass / 0 fail
node --test tests/lib-hardening.test.mjs              # 32 pass / 0 fail

# تطابق عربي/إنجليزي — نجح (قيد ar: typeof en بيكسر البيلد لو مفتاح ناقص)
tsc --noEmit --skipLibCheck constants/i18n.ts         # exit 0

# فحص syntax للملفات المتغيرة — نضيف
```

### ❌ لسه (مقدرتش — `node_modules` مش متثبتة عندي)

```bash
[ ] pnpm install
[ ] pnpm --filter banco-mobile run typecheck    # typecheck كامل بأنواع RN/Expo
[ ] node --test tests/i18n-usage.test.mjs        # محتاج npx tsc
[ ] npx expo start                               # ← الأهم: تشغيل فعلي وشوف الشكل
```

**أولوية التحقق عندك:** شغّل الأب وادخل السيرش → بطاقة السيارات، وقارن بالموك. ركّز على:

1. ارتفاع الهيرو فعليًا 240–260 والليستنج بيبدأ بدري
2. الشكل في **RTL** (عربي) — الهيدر كله logical `start/end`، لازم يتشاف
3. سكرول الـ 21 فئة ناعم ومفيش قصّ
4. الـ 21 أيقونة متسقة بصريًا مع بعض (دي أكتر حاجة محتاجة عين بشرية)
5. زرار الفلاتر يفتح `FilterSheet`، وزرار الطيّ يفتح المحاور، والدول جوه في زرار واحد

---

## 8. القيود اللي لازم تفضل محفوظة

- `testID="cars-home-header"` و `testID="cars-header-map"` يفضلوا في `CarsHomeHeader.tsx`
- `CarsHomeHeader.tsx` **ممنوع** يحتوي على `section-sort-cycle` أو `cars-market-beside-banco` (حتى في التعليقات)
- `testID="car-brand-strip"` و `testID="car-origin-strip"` يفضلوا في `SectionSearchApp.tsx`
- `onOpenMap` لازم يفضل بيستدعي `openOrLatchMap`
- أي مفتاح ترجمة جديد **لازم** يتزود في الشجرتين EN و AR
- `MiniAppBottomNav` متلمسش
- CAR IMPORT (`/import`) عالم منفصل — ممنوع الدمج

---

## 9. ملخص المتبقي

| # | المهمة | المسؤول | حالة |
|---|---|---|---|
| 1 | تشغيل فعلي + مراجعة بصرية (خصوصًا RTL) | الزميل على اللاب توب | مطلوب |
| 2 | `pnpm install` + typecheck كامل | الزميل على اللاب توب | مطلوب |
| 3 | الصورة السينمائية للهيرو | مصمم / المالك | ناقص أصل جرافيك |
| 4 | `vehicle_type` في الـ API (حقل + param + facet) | **الباك إند** | 🚨 بلوكر لشريط الفئات |
| 5 | قرار أرقام الإحصائيات | — | ✅ **اتحسم: داتا حقيقية بس** |

> **ملاحظة على البند 4:** الواجهة خلصت ومستنية الباك إند. مفيش شغل واجهة إضافي مطلوب غير توجيه `typeCounts` على الماب الحقيقي لما ينزل.

---

*مرجع المواصفات: طلب المالك 2026-08-01 — "PREMIUM HERO HEADER SPECIFICATION (MANDATORY)".*
