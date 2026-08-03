# أمر صارم — Fable 5 · الهيدرات الخمسة

**الصادر:** المالك · **المُجهِّز:** الوكيل المدقّق · **التاريخ:** 2026-08-03
**الأساس:** `main` @ `7233af7`

---

# ١) نطاقك — اقرأه ولا تتجاوزه

| | |
|---|---|
| **مهمتك** | **بناء ٥ مكوّنات هيدر: الشكل + الكود.** |
| **التسليم** | **فرع واحد:** `fable5/five-headers` — ولا شيء غيره |
| **ما ليس مهمتك** | ⛔ التوصيل · ⛔ الفلاتر · ⛔ جلب بيانات · ⛔ الملاحة · ⛔ لمس أي ملف خارج قائمتك |
| **بعدك** | **أنا** أركّب وأرتّب وأضبط وأدمج |

## ⛔ الملفات المسموح لك بها — لا غيرها

```
components/search/car/CarsHomeHeader.tsx
components/search/property/PropertyHomeHeader.tsx
components/search/materials/MaterialsHomeHeader.tsx
components/search/facilities/FacilitiesHomeHeader.tsx
components/search/stays/StaysHomeHeader.tsx
```
**⛔ `SectionSearchApp.tsx` · `BookingStaysApp.tsx` · `SearchDiscover.tsx` · `useSearchMiniApp` · `lib/**` — ممنوعة منعاً باتاً.**

---

# ٢) الشروط — العشرة · كلها إلزامية

| # | الشرط |
|---|---|
| **1** | **عرض تقديمي بحت.** لا `useQuery` · لا `fetch` · لا `router` · لا حالة بحث. كل شيء عبر props. |
| **2** | **عقد الـprops ثابت** (§3). ⛔ ممنوع تغييره — عليه يقوم تركيبي. |
| **3** | **`slot?: "all" \| "pinned" \| "scroll"` بافتراضي `"all"`.** `pinned` = الشريط العلوي + البراند + البحث + **كل أداة تصفّح**. `scroll` = الهيرو والتاجلاين والإحصاءات فقط. |
| **4** | 🔒 **⛔ ممنوع وضع أي أداة تصفّح في `scroll`.** حالة الفراغ `absoluteFill` معتمة وتغطي `ListHeaderComponent` — الأداة تختفي عند صفر نتائج. **كسر الحجز فعلاً وأُرجع (`fdbb4ff`).** |
| **5** | **⛔ ولا رقم مكتوب بإيدك.** كل عدّاد يأتي من props. **مصفوفة فاضية ⇒ الشريط لا يُرسم.** حارس يفشّل البيلد على أي رقم مخترع. |
| **6** | **⛔ ولا `#hex` في ملفك.** الألوان من `lib/sectionTheme` فقط. |
| **7** | **⛔ ولا حذف `testID`.** كل موجود يبقى. الجديد يُضاف فقط. |
| **8** | **RTL كامل** — `isRTL` + `row-reverse` + `textAlign`. |
| **9** | **320dp لا تُقص.** الاسم و`POWERED BY` كاملان على 320. **`flexShrink: 0` على الاسم.** أهداف اللمس **≥44px**. |
| **10** | **البوابات قبل التسليم:** `pnpm run typecheck` = 0 · `pnpm run test` = 302 · `node scripts/chain-integrity-gate.mjs` = 198/198. |

## 📸 دليل التسليم — بلا استثناء
لكل هيدر: **٨ لقطات** = (ساكن · منكمش) × (320 · 360 · 390 · 430) في `audit/handoff/evidence/fable5/`.
**⛔ رقم ارتفاع بلا لقطة = التسليم مرفوض.**

---

# ٣) عقد الـprops — واحد للخمسة

```ts
export type HeaderStat = { key: string; value: string; labelKey: string };

type Props = {
  slot?: "all" | "pinned" | "scroll";      // الافتراضي "all"
  scrollY?: SharedValue<number>;            // غيابه ⇒ بلا انهيار، والمكوّن يعمل

  searchOpen: boolean;
  draftQuery: string;
  activeFilterCount: number;
  inputRef: React.RefObject<RNTextInput | null>;

  categories: { key: string; i18nKey: string }[];  // فاضية ⇒ الشريط غائب
  selectedCategory: string | null;
  stats: HeaderStat[];                              // فاضية ⇒ الشريط غائب
  notificationCount?: number;                       // 0/غياب ⇒ بلا شارة

  onBack: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQueryChange: (v: string) => void;
  onSubmitQuery: () => void;
  onClearQuery: () => void;
  onOpenFilters: () => void;
  onSelectCategory: (key: string) => void;
};
```
**⛔ أي prop إضافي = رفض. ⛔ أي قيمة افتراضية داخلية لعدّاد = رفض.**

---

# ٤) أرقام المواصفة — من ورقة المالك

`design-source/slices/SPEC-3-design-details.png`

| البند | القيمة |
|---|---|
| **الأحمر** | **`#FF1E1E`** ← يُضاف كتوكن. ⛔ لا تكتبه في ملفك |
| الخلفية | `#0A0A0A → #121212` |
| **مفرود** | **88–100px** |
| **منكمش** | **56–64px** |
| الحركة | **250–300ms ease-in-out** |
| الحواف | أزرار 16–20 · حاويات 12–16 |
| المسافات | 16–24 أفقي |

**⚠️ إن تعذّر 88–100 دون قص الهوية: سلّم أقل رقم آمن + اللقطة + السبب. ⛔ ممنوع قص الاسم لبلوغ رقم.**

---

# ٥) الخمسة — الحالة والتصميم

| # | الهيدر | الملف | التصميم | العمل |
|---|---|---|:---:|---|
| **1** | **B-OOM CAR** | `car/CarsHomeHeader.tsx` (1002) | ✅ **3 صور + ورقة مواصفة** | **مطابقة** — الأقرب أصلاً |
| **2** | **B-PROPERTIES** | `property/PropertyHomeHeader.tsx` (793) | ✅ **صورتان** | **مطابقة** |
| **3** | **B-CORE** | `materials/MaterialsHomeHeader.tsx` (477) | ✅ **صورة** | **مطابقة** |
| **4** | **B-INDUSTRY** | `facilities/FacilitiesHomeHeader.tsx` (629) | 🔴 **لا يوجد** | ⏸️ **موقوف** |
| **5** | **B-OOM STAY** | `stays/StaysHomeHeader.tsx` (456) | 🔴 **لا يوجد** | ⏸️ **موقوف** |

> ## 🔶 قرار المالك المطلوب — واحد فقط
> **٣ هيدرات لها تصميم. اثنان لا.**
> **(أ)** ابعت تصميمَي **B-INDUSTRY** و**B-OOM STAY** → Fable 5 ينفّذ **خمسة**.
> **(ب)** أذِن باشتقاقهما من نفس اللغة البصرية → ينفّذ **خمسة**، والاثنان **اشتقاق لا مطابقة**.
> **(جـ)** بلا إذن → ينفّذ **ثلاثة فقط**، والاثنان لاحقاً.

---

# ٦) البرومبتات — واحد لكل هيدر

> **انسخ البرومبت وحده. اقرأ §١–§٤ قبله. سلّم على `fable5/five-headers`.**

---

## 🚗 برومبت ١ — B-OOM CAR

```
ابنِ CarsHomeHeader ليطابق التصميم.

المرجع (الصورة تكسب على أي نص):
  design-source/slices/CAR-A-topbar.png        الشريط العلوي
  design-source/slices/CAR-B-hero-left.png     العنوان + صف الثقة
  design-source/slices/CAR-B-hero-image.png    لوحة الهيرو
  design-source/slices/CAR-C-searchbar.png     شريط البحث
  design-source/slices/CAR-D-type-strip.png    شريط الأنواع
  design-source/slices/CAR-E-stats-strip.png   شريط الإحصاءات
  design-source/slices/SPEC-*.png              المواصفة الكاملة

الشرائح:
  pinned = قائمة · B-OOM CAR + powered by · جرس(شارة) · بروفايل · بحث · شريط الأنواع
  scroll = GLOBAL VEHICLE MARKETPLACE · Cars•Bikes•Trucks•Marine•Air · صف الثقة الأربعة · الإحصاءات

إلزامي:
- شريط الأنواع: كبسولة لكل نوع = أيقونة فوق + تسمية تحت (كما في CAR-D). النشط كبسولة مليانة.
  ⛔ الشريط pinned. ⛔ يُرسم فقط لو categories غير فاضية.
- الإحصاءات من stats فقط. فاضية ⇒ لا شريط. ⛔ ولا رقم من عندك.
- صف الثقة الأربعة نصوص i18n — لا أرقام.
- الانهيار: اللوجو 100%→82% · الهيرو 100%→0% · البحث يلزق · ظل يزيد · 250-300ms ease-in-out.

⛔ لا تلمس CAR_CATEGORIES ولا VehicleGlyph إلا للشكل.
سلّم: 8 لقطات + ارتفاع مفرود/منكمش لكل عرض.
```

---

## 🏢 برومبت ٢ — B-PROPERTIES

```
ابنِ PropertyHomeHeader ليطابق التصميم.

المرجع:
  design-source/slices/PROP-A-topbar.png        قائمة · قلب · جرس(3)
  design-source/slices/PROP-B-brand.png         B-PROPERTIES + POWERED BY BANCO
  design-source/slices/PROP-B-tagline+hero.png  التاجلاين + الهيرو
  design-source/slices/PROP-C-searchbar.png     البحث + زر فلتر أحمر دائري
  design-source/slices/PROP-E-stats-strip.png   الإحصاءات
  design-source/slices/PROP-D-type-chips.png    شرائح النوع

الشرائح:
  pinned = الشريط العلوي · البراند المضغوط · البحث · شرائح النوع · صف العرض/Wanted
  scroll = التاجلاين · الهيرو · الإحصاءات

إلزامي:
- 🔴 أهم بند: شرائح النوع = أيقونة + تسمية جنبها في كبسولة (All · Apartments · Villas ·
  Commercial · Land) كما في PROP-D. الحالي أربع أيقونات عارية بلا تسميات — أصلحها.
  ⛔ الشريحة النشطة لا تكون أطول من جيرانها.
- البراند: POWERED BY فوق شعار BANCO لا جنبه — الضغط لصف واحد قصّ PROPERTIES إلى PRO…
  الاسم 20→15 مع flexShrink:0.
- ⛔ الإحصاءات من stats فقط — التصميم يعرض أرقاماً لا مصدر لها. فاضية ⇒ لا شريط.

سلّم: 8 لقطات — و320dp تثبت أن PROPERTIES و POWERED BY كاملان.
```

---

## 🏭 برومبت ٣ — B-CORE INDUSTRIAL HUB

```
ابنِ MaterialsHomeHeader ليطابق التصميم.

المرجع:
  design-source/06-B-CORE-industrial-hub.jpeg   التصميم كامل
  design-source/slices/CORE-HEADER-full.png     كتلة الهيدر
  design-source/slices/CORE-A-topbar.png        قائمة يسار · جرس(نقطة) يمين
  design-source/slices/CORE-B-brand.png         B-CORE + INDUSTRIAL HUB متباعد
  design-source/slices/CORE-B-tagline.png       Industrial Supply Network…
  design-source/slices/CORE-B-hero-art.png      المصنع + الترس + شعار B
  design-source/slices/CORE-E-stats-strip.png   Factories · Machines · Materials · Countries

الشرائح:
  pinned = قائمة · B-CORE + INDUSTRIAL HUB · جرس · بحث · شرائط التصفّح
  scroll = التاجلاين · الهيرو · الإحصاءات

إلزامي:
- الوردمارك سطران: B-CORE ثم INDUSTRIAL HUB بتباعد حروف واضح.
- الإحصاءات أربع خانات بفواصل رأسية — من stats فقط. ⛔ لا 2,450 ولا 18,400 من عندك.
- ⛔ لا تبنِ شبكة الخدمات ولا الإجراءات السريعة ولا التصنيفات الرائجة — خارج الهيدر.
- ⛔ عيب قائم: الصف الثاني متزاحم (ragged wrap) — أصلحه.

سلّم: 8 لقطات + جدول الارتفاعات.
```

---

## 🏗️ برومبت ٤ — B-INDUSTRY · ⏸️ موقوف

```
⛔ لا تبدأ. لا يوجد تصميم لهذا القسم.
ابدأ فقط بأمر مكتوب من المالك: (أ) تصميم مرسل  أو  (ب) إذن اشتقاق.

عند الإذن:
  اشتق من design-source/slices/CORE-* بنفس البنية:
  pinned = قائمة · B-INDUSTRY + Factories & Land · جرس · بحث · شرائط الأنواع
  scroll = التاجلاين · الهيرو · الإحصاءات
  الملف موجود (629 سطر) وفيه slot — الناقص scrollY والانهيار والأجواء.
  ⛔ صف الثقة موجود — لا تحذفه.
```

---

## 🏖️ برومبت ٥ — B-OOM STAY · ⏸️ موقوف

```
⛔ لا تبدأ. لا يوجد تصميم لهذا القسم.
ابدأ فقط بأمر مكتوب من المالك: (أ) تصميم مرسل  أو  (ب) إذن اشتقاق.

عند الإذن — اقرأ STAY-HEADER-CORRECTION-AR.md كاملاً أولاً، ثم:
  الحالة: أفقر الخمسة. صفر تدرّج · صفر صف ثقة · صفر هيرو · 306dp = 36% من الشاشة.
  الأدلة: evidence/STAY-01/02/03-*.png

  1. البراند من أربعة صفوف إلى صفّين (POWERED BY فوق الشعار لا سطراً يتيماً).
  2. أحمر واحد في الوردمارك — الآن صورة الشعار بأحمر و"STAY" بأحمر العقارات.
  3. الحجز بلا أكسنت خاص: STAYS_ACCENT = sectionAccent("real_estate").
     ⛔ لا تخترع لوناً — اطلب مني إضافة توكن booking.
  4. النيوترالز: #000000/#8E8E93 → #090909/#A5A5A5.
  5. الانهيار المتحرك — غير موجود إطلاقاً.
  6. شريط الأنواع مقطوع من اليمين بلا إشارة تمرير.
  🔒 شريط الأنواع والصف الثاني pinned. هنا بالذات انكسر وأُرجع.
```

---

# ٧) ما يوفّره المالك

| # | البند | لماذا |
|---|---|---|
| 1 | **تصميم B-INDUSTRY** | لا يوجد |
| 2 | **تصميم B-OOM STAY** | لا يوجد |
| 3 | **لوحة هيرو العقارات** | المتاح صورة موبايل مائلة فيها انعكاس زجاج |
| 4 | **لوحة هيرو الحجز** | لا توجد |
| 5 | **إذن `#FF1E1E`** | يغيّر أحمر كل الأقسام |

**متوفّر بالفعل:** `section-hero/car.png` (1216×453) · `section-hero/materials.png` (488×291) — **موجودتان وغير مربوطتين.**

---

# ٨) التسليم

```
git checkout -b fable5/five-headers
# … البناء …
البوابات الأربع خضراء + 8 لقطات لكل هيدر
git push -u origin fable5/five-headers
```
**ثم اكتب في `CHANNEL-OWNER-CLAUDE-LIVE-AR.md`:** الفرع · الـSHA · لكل هيدر (الارتفاع مفرود/منكمش على أربعة عروض) · ما لم تستطعه ولماذا.

**⛔ ممنوع الدمج على `main`. ⛔ ممنوع لمس ملف خارج القائمة. التركيب دوري أنا.**

---

**الحالة:** ⛔ **جاهز ولم يُنفَّذ. ينتظر أمر «نفّذ» + قرار §٥.**
