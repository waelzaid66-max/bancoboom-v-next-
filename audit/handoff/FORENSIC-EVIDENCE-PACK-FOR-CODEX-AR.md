# 🧾 حزمة الأدلة الجنائية لوكيل Codex — فحص حالي حقيقي، بمرساة سطر بسطر

> **دوري هنا:** مهندس استشاري مساعد لجمع الأدلة الجنائية بدقة. **كل بند تحته دليل** (SHA، أمر، أو `ملف:سطر`) — مش ذاكرة.
> **الحالة لحظة الفحص:** الشجرة نظيفة على `fa797ed`، فرع `claude/project-understanding-manager-lcgi3u`، PR #2.
> **الكاتب:** كلود (Opus 4.8) · **2026-08-04**

> **⚠️ صدق أول سطر:** أنا **مش قادر أتعلّم من Codex مباشرةً** — مفيش قناة بيني وبينه في البيئة دي. اللي أقدر أعمله (وعملته هنا): أجمع الأدلة الجنائية بدقة وأحطها في الريبو عشان Codex يقراها. لو المالك نقل أسئلة/نتايج Codex ليّا، هدمجها في المستند ده.

---

## 1) الأدلة المُتحقَّق منها الآن (فحص لحظي، مش من الذاكرة)

| الدليل | الأمر | النتيجة الآن |
|---|---|---|
| الشجرة نظيفة | `git status --short` | نظيفة على `fa797ed` |
| typecheck موبايل | `pnpm exec tsc --noEmit` | **exit 0** (اتشغّل دلوقتي) |
| `@ts-ignore`/`@ts-nocheck`/`as any` في ملفات الهيدر | grep | **صفر** |
| `TODO/FIXME/HACK` في `components/search` | grep | **صفر** |
| hex مكتوب بإيد في `CarsHomeHeader` | grep | **صفر ألوان هوية** — بس تعليقات علم-ألوان + `#000000` للظل/scrim (مشروع) |
| `eslint-disable react-hooks/exhaustive-deps` | grep | **8 مواضع** (أنماط React مقصودة، مش قمع أخطاء): `SectionSearchApp:369,1471,1538` · `SearchResultsMap:137,305` · `SearchResultsMap.web:114,239` · `BookingStaysApp:284` |

**الاستنتاج الجنائي:** الكود المتغيّر **خالٍ من القمع** (no suppression). الـeslint-disable الوحيدة على `exhaustive-deps` وهي نمط شرعي (حذف تبعية متعمّد)، مش إخفاء عطل. أي وكيل يلمس `BookingStaysApp` لازم ياخد باله من الموجود في سطر 284.

---

## 2) عقد `CarsHomeHeader` العام (اللي أي وكيل لازم يحترمه)

`artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx`

| Prop | السطر | العقد |
|---|---:|---|
| `slot?: "all" \| "pinned" \| "scroll"` | 248 | أي جزء يترسم. السيارات بتستخدم `"pinned"` فقط. |
| `scrollY?: SharedValue<number>` | 259 | إزاحة القائمة؛ الجزء المثبّت يقرأها للانهيار على UI thread. |
| `continuesBelow?: boolean` | 247 | **مفتاح الكارت الموحّد.** لمّا true: الهيدر يرمي حافته المدوّرة + ظله ويسيب `zIndex` بس (`pinnedShellOpen`)، والحافة المدوّرة+الظل بينتقلوا لآخر صف فلاتر. |
| `categories` / `stats` | 216/218 | مُمرَّرة من الأب، متحقَّق منها بالفعل (فاضي ⇒ الباند غايب). |
| `marketSlot?` | 237 | زر الدولة/العملة يترسم من الأب. |

**قاعدة أمانة:** `stats` بتترسم بس الأرقام اللي الأب أثبتها. `car-hero-honesty-guard` (10 assert) بيمنع أي رقم مخترع.

---

## 3) خريطة سطور فلاتر السيارات الحالية (SectionSearchApp.tsx)

| العنصر | السطر | ملاحظة |
|---|---:|---|
| `continuesBelow` على الهيدر المثبّت | 1710 | يفعّل الكارت الموحّد |
| غلاف `carFilterPanel` | 1983 | `isCarSection ? styles.carFilterPanel : undefined` |
| **شريط 1** (السوق/الترتيب/العرض) `section-primary-strip` | 1996 | ScrollView أفقي، `contentContainerStyle=chipStripRow` (1995) |
| **شريط 2** (الحالة/المحرّك) `section-engine-strip` | 2095 | ScrollView أفقي جديد — الشرائط الحالة قايدة سطرها |
| **شريط 3** (الماركات/المنشأ) `carFilterPanelFooter` | 2253 | آخر صف، بيحمل الحافة المدوّرة + الظل (نهاية الكارت) |
| `car-brand-strip` | 2258 | testID لازم يفضل |
| ستايل `chipStripRow` | 2925 | single-line، **بلا** flexWrap |
| ستايل `carFilterPanel` | 2935 | `SECTION_NEUTRAL.void` |
| ستايل `carFilterPanelFooter` | 2943 | radius 20 + shadow + zIndex |

---

## 4) 🔴 المهمة أ (P14) — كمبارتمنتس السيارات — مرساة تنفيذ دقيقة

**الدليل البصري للهدف:** `audit/handoff/design-source/03-BOOM-CAR-header-on-device.png` — كل باند (أنواع/إحصاءات) في **كارت مدوّر داكن مرفوع** جوة الهيدر.
**الحالي (العيب):** الأنواع والإحصاءات والفلاتر **flat على `void`**، مش كمبارتمنتس.

**التنفيذ (بالمرساة):**
1. `CarsHomeHeader.tsx` — أضف ستايل:
   ```js
   compartment: { marginHorizontal: 14, marginTop: 12, borderRadius: 18,
                  backgroundColor: SECONDARY, overflow: "hidden", paddingVertical: 10 },
   ```
2. لفّ **strip الأنواع** (Band D, حوالي سطر 744-783 `testID="cars-category-strip"`) في `<View style={styles.compartment}>`.
3. لفّ **strip الإحصاءات** (Band E, حوالي 789+ `testID="cars-stats-strip"`) في `<View style={styles.compartment}>`.
4. شيل `marginTop:18` من `catScroll`/`statScroll` (الكمبارتمنت بيوفّر المسافة)؛ عدّل `catContent.paddingHorizontal` 16→12.
5. `SectionSearchApp.tsx` — لفّ الـ3 شرايط فلاتر (1996/2095/2253) في كمبارتمنت بنفس اللغة (`SECTION_NEUTRAL.secondary` bg، radius 18، side-inset).
6. **تحقّق:** بناء ويب → لقطة `/section/car` على 320 + 390 → قارن بـ`03-BOOM-CAR-header-on-device.png`. البوابات: typecheck 0، `test:section-guard` 92/92، `test:car-hero-honesty` 5/5، الحزمة الكاملة 351/351.
**⚠️ ممنوع تلمس testID، ممنوع تمسح باند، الأرقام تفضل حقيقية.**

---

## 5) 🔴 المهمة ب (P15) — تواريخ حجز استاى — نموذج البيانات الدقيق

**الفجوة المُثبَتة:** مفيش `checkIn/checkOut/guests` في أي طبقة.

**الملفات اللي لازم تتلمس (بالدليل):**
| الطبقة | الملف | اللي موجود دلوقتي | المطلوب يضاف |
|---|---|---|---|
| العقد المشترك (SoT) | `lib/search-contract/src/url.ts` | `SearchCriteria` فيه q/sort/rentalTerm/propertyType/brand/model/minYear/maxYear/industry/originType/material… (بلا تواريخ) | `checkIn?`, `checkOut?`, `guests?` + تعيين URL (`check_in`/`check_out`/`guests`) بجانب `rental_term` (سطر 81-95) |
| الموبايل | `lib/searchParams.ts` | نفس الحقول (سطر 43-110) بلا تواريخ | نفس الإضافة + قيم افتراضية + `hasActiveFilters` (سطر 120+) |
| هيدر استاى | `stays/StaysHomeHeader.tsx` | ديناميكي بالفعل | كنترول التواريخ جوة التصميم |
| تطبيق الحجز | `BookingStaysApp.tsx` | `stays-rental-term-btn` = مُنتقي مدة إيجار عبر `FilterPill + Modal` (سطر 116-170) | **نفس النمط بالظبط** لتقويم مدى-تواريخ + ضيوف |

**النمط الموجود اللي يتقلّد (دليل):** `BookingStaysApp.tsx:116` — `<FilterPill icon="calendar" ... onPress={() => setOpen(true)}>` + `<Modal>` (سطر 125) فيه صفوف اختيار. **التقويم الداخلي المقترح ياخد نفس الشكل: `FilterPill` → `Modal` فيه شبكة شهر + اختيار مدى.**

**قيد التحقّق (دليل):** الكونتينر مفيهوش باك-إند/DB → الفلترة الفعلية بالتواريخ **مش قابلة للتحقّق هنا**. الـUI + تعيين الباراميتر يتحقّق ببناء الويب + `pnpm --filter @workspace/search-contract run test` (47/47). تغيير api-server (يقرأ `check_in/check_out/guests`) إضافي وصغير بس مش قابل للتشغيل بدون DB.

**التوصية التقنية (ثابتة):** تقويم داخلي (بدون مكتبة نيتف) = صفر مخاطرة على بناء Expo/iOS (Expo `~54.0.36`, RN `0.81.5`). مكتبة نيتف (`@react-native-community/datetimepicker`) بتحتاج config-plugin/prebuild وبتضعّف الويب — الأخطر على آبل.

---

## 6) أوامر البناء والتحقّق (نسخ-لصق لـCodex)

```bash
# من الجذر
ln -sfn "$PWD/artifacts/banco-mobile/node_modules/expo" node_modules/expo
cd artifacts/banco-mobile
pnpm exec tsc --noEmit                 # typecheck (لازم 0)
pnpm run test                          # 27 حزمة، لازم 351/351
cd ../.. && node scripts/chain-integrity-gate.mjs      # pass
pnpm --filter @workspace/search-contract run test      # 47/47
node scripts/production-confidence-check.mjs           # 20/20

# تحقّق بصري
cd artifacts/banco-mobile && pnpm build:web
PORT=3111 BASE_PATH=/banco-mobile node server/serve.js &
# http://localhost:3111/banco-mobile/section/car   (ياخد ~19 ثانية)
# Playwright: /opt/pw-browsers/chromium ، playwright-core:
#   import pkg from '/opt/node22/lib/node_modules/playwright-core/index.js'
```

---

## 7) البيانات اللي محتاجها منك (المالك) لو Codex عنده أسئلة

عشان أكمّل دور المهندس الاستشاري بدقة، لو Codex سأل حاجة من دول انقلها ليّا وأجهّز الدليل:
1. أي ملف/دالة Codex شايفها مبهمة → أجيب سطورها الدقيقة وتاريخها.
2. أي بوابة/حارس Codex عايز يفهم قاعدته → أفكّك assertions بتاعته.
3. أي قرار من قرارات المالك المفتوحة اتحسم → أنفّذه أو أوثّقه.

---

**الخلاصة الجنائية:** التجميع نظيف (بلا قمع)، أخضر محليًا، والمهمتين المفتوحتين متمرسِيتين بسطور دقيقة. المستندات المكمّلة: `MASTER-MEMORY-DUMP-FOR-CODEX-FULL-AR.md` (الذاكرة) + `FULL-AUDIT-ALL-WORK-AND-PROBLEMS-AR.md` (الأوديت) + ده (الأدلة الجنائية).

— كلود (Opus 4.8) · 2026-08-04
