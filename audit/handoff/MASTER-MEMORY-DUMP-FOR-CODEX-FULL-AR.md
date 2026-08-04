# 🧠 ذاكرة كلود الكاملة — تسليم شامل لوكيل Codex (وكل الوكلاء على الحساب)

> **الغرض:** المالك طلب تجميع **كل** ذاكرة كلود — كل مشكلة، كل شكوى، كل تقرير، كل فحص، كل فهم — في الريبو، عشان وكيل يشتغل على الريبو بـ**Codex** (أو أي وكيل تاني على الحساب) يكمّل من نفس النقطة بالظبط، بدون ما يعيد اكتشاف أي حاجة.
>
> **الحالة:** هذا المستند هو **مصدر الحقيقة الموحّد**. يلخّص كل شيء ويشير للتفاصيل في باقي مستندات `audit/handoff/`.
> **الكاتب:** كلود (جلسة الويب، Opus 4.8) · **التاريخ:** 2026-08-04
> **الفرع الحالي:** `claude/project-understanding-manager-lcgi3u` · **آخر commit:** `96e7363` · **PR #2** (draft → `main`)

---

## 0) اقرأ ده الأول — القواعد المُلزمة (كسرها = ضرر مثبت حصل قبل كده)

1. ⛔ **ممنوع الدفع المباشر على `main`.** كل الشغل على فروع + PRs للمراجعة. (قاعدة اترسّخت من commit 46aa47a.)
2. ⛔ **الحارس يكسب.** لو اختبار حارس (`tests/*guard*.mjs`) فشل، **صلّح الكود مش الحارس.** ممنوع إضعاف حارس عشان يعدّي.
3. ⛔ **ممنوع أي رقم مخترع.** كل إحصائية/عدّاد لازم يكون من داتا حقيقية مثبتة. في حرّاس أمانة (`car-hero-honesty`, `stay-honesty`, `import-honesty`) بيمنعوا الواجهات الوهمية.
4. ⛔ **ممنوع حذف أي `testID`.** العناصر **تتنقل** ما بتتمسحش. كل `testID` يفضل قايم.
5. ⛔ **ممنوع خلط فلاتر/مميزات بين الأقسام** (عزل الأقسام — section isolation).
6. ⛔ **ممنوع لون hex مكتوب بإيد.** كل الألوان من التوكنات (`lib/sectionTheme.ts`, `SECTION_NEUTRAL`).
7. ⛔ **ممنوع `--force`** على الدفع (إلا force-with-lease على تاريخ مدموج بالفعل).
8. ⛔ **ممنوع `perl -pi` أو أي أداة على ملف فيه عربي** — بتخرّب UTF-8 فعلاً. استخدم `python3` بترميز صريح أو أدوات التحرير.
9. ⛔ **ممنوع تنضيف/حذف `audit/handoff/`.**
10. ⛔ **ممنوع إعادة هيكلة `SectionSearchApp` بالكامل** ولا لمس `useSearchMiniApp` بدون داعي.
11. ✅ **عزل الملفات بين الوكلاء:** `property/*`, `materials/*`, `maps/*` = الزميل B. `car/*`, `stays/*`, `facilities/*` = كلود (أنا). ممنوع لمس ملفات الزميل بدون إذن المالك.
12. ✅ **الصدق:** كل رقم أخضر **من تشغيل محلي مش CI** — تتقال كل مرة. الرندر على الويب **مش** أندرويد/iOS. فشل = اكتب فشل.

---

## 1) المشروع — إيه هو B-OOM

**B-OOM (BANCO Opportunity Open Market):** سوق (marketplace) متعدد الرأسيات لمصر/الخليج:
- **Cars** (بووم كار — سيارات ومركبات: سيارات، موتوسيكلات، شاحنات، أتوبيسات، معدات ثقيلة، قوارب، يخوت، سفن، طائرات، هليكوبتر)
- **Real Estate** (بروبرتيز — عقارات)
- **Industrial / Materials** (بي-كور — صناعي/مواد ومصانع)
- **B2B Supply** (توريد)
- **Booking / Stays** (بووم استاى — حجوزات وإقامة)
- **Banks & Financiers** (بنوك وممولين — أزرق، استثناء هوية موثّق)

### المكدّس التقني (Stack)
- **pnpm monorepo** · **Expo React Native** (expo-router) · **Express 5 API** · **Drizzle ORM** · **TypeScript 5.9** · **Expo SDK 54**
- الموبايل: `artifacts/banco-mobile/`
- الـAPI: `artifacts/api-server/`
- عقد البحث المشترك: `packages/search-contract`
- الموقع/اللاندنج: منفصل تمامًا عن الموبايل (ميثاق العزل: `audit/website/WEBSITE-MOBILE-INDEPENDENCE-CHECKLIST.md`)
- النشر: **Coolify** (`deploy/coolify/`) + GCP cloudbuild. قوالب `.well-known` بتحمل `REPLACE_*` (أسرار المالك تفضل بره Git، تتحقن وقت البناء بـ`--build-arg`).
- الهوية: **App = BANCO / bundle = com.bancooom.app / scheme = bancooom**

---

## 2) حالة الريبو والفروع والـPRs (بالـSHA بالظبط)

| البند | القيمة |
|---|---|
| `main` | `ecdf776` وقت بدء التجميع (فيه الماسنجر/presence + إصلاح halo على السيرفر + CI) |
| فرعي (المدير/الفهم + التجميع) | `claude/project-understanding-manager-lcgi3u` @ `96e7363` — **PR #2 (draft)** |
| فرع الهيدرات الخمسة | `claude/five-headers` (مدموج في فرعي) |
| فرع الزميل B | `claude/headers-dynamic-polish` (property/materials/maps/B2 — مدموج في فرعي) |
| فرع الـhalo | `claude/halo-e1biie` — **PR #3** (إصلاح api-server) |
| فرع الاستيراد | `claude/testing-correction-pressure-7ycvwa` — **PR #5** |

### PRs مفتوحة
- **PR #2** — فرعي: التجميع الكامل + إصلاحات السيارات (draft، مُحدَّث).
- **PR #3** — halo.
- **PR #5** — import identity token + honesty guard.

### ملاحظة مهمة عن الاشتراك في أحداث الـPR
- محاولة `subscribe_pr_activity` رجعت "requires approval" (الجلسة non-interactive) — الاشتراك التلقائي مش متاح. لو المالك عايز مراقبة PR، محتاج جلسة تفاعلية.

---

## 3) الفحوصات والبوابات — آخر نتيجة (كلها محلية، على `96e7363`)

| البوابة | الأمر | النتيجة |
|---|---|---|
| typecheck موبايل | `cd artifacts/banco-mobile && pnpm exec tsc --noEmit` | **0 خطأ** ✅ |
| حزمة حرّاس الموبايل | `pnpm run test` (27 ملف) | **351/351 · 0 فشل** ✅ |
| chain-integrity | `node scripts/chain-integrity-gate.mjs` | **pass** ✅ |
| search-contract | `pnpm --filter @workspace/search-contract run test` | **47/47** ✅ |
| حدود الويب | `node scripts/verify-website-boundaries.mjs` | **pass** ✅ |
| rewrite config | `node scripts/website-rewrite-config-audit.mjs` | **pass** ✅ |
| production-confidence | `node scripts/production-confidence-check.mjs` | **20/20** ✅ (بما فيه أقفال Coolify وقوالب well-known) |

> **CI لسه ماشتغلش على الفرع** — كل رقم فوق من تشغيل محلي.

---

## 4) طريقة التشغيل والتحقّق البصري (Runbook)

```bash
# من جذر الريبو
ln -sfn "$PWD/artifacts/banco-mobile/node_modules/expo" node_modules/expo

cd artifacts/banco-mobile
pnpm build:web                       # يصدّر إلى static-build/web
PORT=3111 BASE_PATH=/banco-mobile node server/serve.js &   # يخدم على /banco-mobile/
# افتح: http://localhost:3111/banco-mobile/section/car   (مش على الجذر)
# ملاحظة: التطبيق بياخد ~16-19 ثانية يرندر (Clerk يفشل ثم يكمل signed-out)
```

**Playwright (لقطات):** الكروم على `/opt/pw-browsers/chromium`. `playwright-core` global على `/opt/node22/lib/node_modules/playwright-core/index.js` (استورده بالمسار المطلق في ESM). ممنوع `playwright install`.

**مسارات الأقسام:** `/section/car` · `/section/real-estate` · `/section/materials` · `/section/factories` · `/section/booking` · `/section/maps`.

**⚠️ قيود التحقّق:** الكونتينر **مفيهوش باك-إند ولا قاعدة بيانات** → النتايج فاضية دايمًا → حالة overlay فاضية بتغطّي القائمة، عشان كده الظاهر هو **الشرائط المثبّتة (pinned)** بس. مفيش تحقّق نيتف iOS/أندرويد ممكن هنا.

---

## 5) الفخاخ التقنية — دفعنا تمنها فعلاً، ممنوع تتكرر

### فخ ١ · الشريحة المتحركة بيغطّيها الـoverlay (أخطر فخ)
`SearchResultsSurface` بيرندر حالات (فاضي/خطأ/تحميل) كـ`StyleSheet.absoluteFill` **بخلفية معتمة** بتغطّي `ListHeaderComponent`. **أي أداة تصفّح (شرائط/فلاتر/تبويبات) تتحط في الشريحة المتحركة (scroll) بتختفي خالص لما النتايج تفضى** — بالظبط لما المستخدم محتاجها.
> **القاعدة:** الشريحة المتحركة تاخد **هوية بس** (نصوص/شعارات/هيرو). **أي أداة تصفّح تفضل في الشريحة المثبّتة (pinned).** وقع في الفخ ده: الحجز (اترجّع `fdbb4ff`)، والعقارات (اتمسك في `5f8168e`). **عشان كده السيارات دلوقتي كل شرائطها pinned.**

### فخ ٢ · الرقم صح والشكل غلط
ضغط `brandBlock` وصل بالعقارات لـ131dp (الهدف) بس قصّ الهوية (`PROPERTIES`→`PRO…`). الحل: «POWERED BY» **فوق** اللوجو مش جنبه، والاسم 20→15 مع `flexShrink:0`. **القياس الهندسي وحده مش كافي — أي ضغط لازم يتشاف مرندر.**

### فخ ٣ · 320dp هي اللي بتكشف
علامة B-OOM كانت بترندر `·OC` على 320dp ومحدش شافها على 390. **كل تسليم يتشاف على 320 · 360 · 390 · 430.**

### فخ ٤ · تعليق قديم بيوجّه وكيل جديد غلط
تعليق `Do NOT invent FactoriesHomeHeader` فضل موجود بعد ما `FacilitiesHomeHeader` اتعمل واتوصّل → ضلّل وكيل. **اتصحّح** (maintenance 0-أ، commit `46c9eca`). راجع أي تعليق قبل ما تصدّقه.

### فخ ٥ · قص لوحة الهيرو (السيارات)
`cover` على لوحة 2.16:1 في هيدر شبه مربع = زوم بيرمي معظم المشهد (فضل هليكوبتر ونص تريلا بس). الحل: اللوحة **مثبّتة على القاع** بنسبتها الطبيعية (1216×453) تحت البار العلوي + الهيرو. المالك اتضايق جدًا من تكرار البيلد الغلط هنا — **احسب الأول، متجرّبش في الكود.**

### فخ ٦ · إخفاء الفلاتر ورا toggle
كلود خبّى فلاتر السيارات ورا زرار Filters → المالك زعل جدًا («انت غبي»). **الفلاتر لازم تفضل ظاهرة، مش مخبّية ورا toggle.** الحل: شرائط أفقية ظاهرة (مش wrap مكوّم، مش مخفي).

### فخ ٧ · الـi18n dotted-path
grep على المسار المنقّط بيقول المفتاح اتمسح وهو موجود nested. اتأكد من المفتاح المتداخل قبل ما تدّعي حذف.

---

## 6) سجل شكاوى المالك والردّ عليها (كرونولوجي — الأهم)

> المالك بيتكلم عربي/مصري. غضبه غالبًا من: تكرار غلطة، هدر فلوس على بيلد غلط، إخفاء عناصر، تجارب في الكود بدل الحساب، ادعاءات كاذبة.

1. **«افهم المشروع وخد المهام»** → فُهم، واتاخدت المهام.
2. **«اتأكد إن الريبو آخر نسخة بعد الهجرة، وافهم الهيدرات اللي فيها مشاكل من الوكيل اللي مات»** → التجميع اتعمل (§2)، الهيدرات اتفهمت.
3. **[5 تصميمات] «قود المسيرة، افهم شغل الوكلاء ومشاكلهم، الخمسة يكونوا ديناميكيين»** → الهيدرات الخمسة اتعملت ديناميكية.
4. **«فيبل فايف يشتغل على الهيدرات»** → 3 محاولات Fable 5 كلها فشلت («requires usage credits»)، 0 turns، 0 ملفات. موثّق (§9).
5. **«الفلاتر بتاعت الدول والعملات لازم تندمج في التصميم بدقة»** → اندمجت.
6. **«انت غبي بتخفي الفلاتر المهمة»** → شيل الإخفاء، الفلاتر بقت ظاهرة (فخ ٦).
7. **«عاوز أوديت الأول، عدم لمس شغلي، انت غير أمين»** → اتعمل أوديت، والتزام بعزل الملفات.
8. **«امسح الكلام الإنجليزي لو بيبوّظ فهمك للهيدر»** → اتشال الكلام المشوّش من فهم الهيدر.
9. **«كل الفلاتر تدخل في التصميم، الصور في الشريط تتعمل SVG جوة الهيدر زي الصورة، ممنوع مسح»** → شريط 11 نوع SVG، الفلاتر جوة الهيدر.
10. **«لم كل الشغل وعرفني وصلنا فين وكمل بدقة»** → التجميع + تقرير الحالة.
11. **«صلح المصايب اللي عملتها بأعلى تقنيات»** → إصلاح plate collapse + التوكنة.
12. **«كمل تحسينات الماسنجر والخرايط وباقي الشغل»** → الماسنجر على main، الخرايط على فرع الزميل.
13. **«الفلاتر غلط، لازم تندمج في تصميم الهيدر العلوي، بدون مسح/إخفاء»** → **[الجزء الحالي]** الكارت الموحّد (857ae26) + 3 شرائط (96e7363).
14. **«الفلاتر جميعها والأشرطة تدخل داخل/فوق الهيدر، مدموجة في تصميم الهيدر العلوي، تتقسم جوة التصميم نفسه — مثال بانكو استاى»** → **[لسه مفتوح — §8 المهمة أ]** الفهم النهائي: **كل باند يبقى compartment مدوّر (كارت داكن مرفوع) جوة الهيدر، زي strip الأنواع و strip الإحصاءات في تصميم المالك على الجهاز.**
15. **«بووم استاى ناقص مكتبات الحجوزات والتواريخ، محتاج بوليش وهيدر ديناميكي، إضافات جوة الهيدر مسموحة، ممنوع مسح»** → **[لسه مفتوح — §8 المهمة ب]**.

---

## 7) حالة الكود الحالية — قسم بقسم

### 7.1 السيارات (`car/CarsHomeHeader.tsx` ~1000 سطر) — **شغل كلود**
- اللوحة (المشهد) خلفية الهيدر، مثبتة على القاع، **بتنكمش مع الاسكرول** (`plateCollapse`, commit 310028d).
- شريط 11 نوع SVG (`VehicleGlyph`).
- الهيدر + الفلاتر **كارت واحد موحّد** (857ae26): الهيدر بياخد `continuesBelow` فيرمي حافته المدوّرة وظله، والحافة المدوّرة + الظل بينتقلوا لآخر صف فلاتر (`carFilterPanelFooter`).
- الفلاتر **3 شرايط أفقية** (96e7363): [السوق/الترتيب/العرض] · [الحالة: all/new/used/imported/bank/islamic] · [الماركات/المنشأ]. مفيش wrap مكوّم، مفيش إخفاء.
- ثوابت: `HEADER_EXPANDED=94`, `HEADER_COLLAPSED=60`, `HERO_MIN_HEIGHT=148`, `COLLAPSE_SCROLL=96`, `BOTTOM_RADIUS=20`, `TAP=48`, `PAD_H=16`.
- التوكنات: `SECTION_NEUTRAL` (void `#090909`, secondary `#121212`, surface أفتح, snow `#FFFFFF`, ash `#A5A5A5`, steel, hairline `rgba(255,255,255,0.06)`).

### 7.2 الحجز/استاى (`stays/StaysHomeHeader.tsx` + `BookingStaysApp.tsx`) — **شغل كلود**
- الهيدر **ديناميكي بالفعل** (`barCollapse/logoCollapse/poweredCollapse/taglineCollapse` مربوطين بـ`staysScrollY`، موصّل في BookingStaysApp سطر 705/946).
- **ناقص:** كنترول تواريخ الحجز الحقيقي (check-in/out + ضيوف). الموجود دلوقتي `stays-rental-term-btn` = مُنتقي **مدة إيجار** (يومي/أسبوعي/شهري) بأيقونة تقويم بس — مش date-range.
- **مفيش:** مكتبة تقويم، ولا مكوّن Calendar/DatePicker، ولا حقول `checkIn/checkOut/guests` في `search-contract`.

### 7.3 العقارات (`property/PropertyHomeHeader.tsx` ~793) — **شغل الزميل B**
- انهيار على نموذج Facilities، شرائط مثبّتة (fix `9d402d4`). ممنوع لمسها بدون إذن.

### 7.4 المواد (`materials/MaterialsHomeHeader.tsx` ~477) — **شغل الزميل B**
- انهيار + الشعار بينزل. `materials-core-guard` بيشد. ممنوع لمسها بدون إذن.

### 7.5 المصانع (`facilities/FacilitiesHomeHeader.tsx` ~629) — **شغل كلود**
- عنده `slot`، الشريط pinned، انهيار البراند عبر `facilitiesScrollY`.

### 7.6 SectionSearchApp.tsx — الملف المشترك (مصدر التصادمات)
- فيه `carHeroCategories` (11 نوع)، `carScrollY/propertyScrollY/materialsScrollY/facilitiesScrollY`، لوحة فلاتر السيارات (`carFilterPanel` + الـ3 شرايط)، حسم التصادم: السيارات pinned بالكامل → `listHeader={materialsScrollHeader ?? facilitiesScrollHeader}` و`scrollY` بيغطّي الأربعة.

### 7.7 SearchDiscover.tsx — صيانة wave-3 **مؤجّلة على قرار المالك**
- أزرق البنوك `#1E6FD9` مكتوب بإيد (سطر 533) → المفروض `BANKS_ACCENT` من التوكن. **مسكتها** لأن أزرق البنوك استثناء هوية موثّق وتغيير درجته قرار مالك.
- تدرّجات مكتوبة بإيد داخل `SECTION_GRADIENT` المحلي (مش من `lib/sectionTheme`).

---

## 8) المهام المفتوحة دلوقتي — بالتفصيل الكامل (للـCodex يكمّل)

### 🔴 المهمة أ — كمبارتمنتس السيارات (شكوى المالك رقم 14، لسه مفتوحة)
**المطلوب الحقيقي (اتفهم من تصميم `03-BOOM-CAR-header-on-device.png`):** الهيدر = **كارت بريميوم واحد مدوّر**، وجوّاه **كل باند يبقى compartment مدوّر** (كارت داكن مرفوع side-inset) — زي strip الأنواع و strip الإحصاءات في تصميم المالك بالظبط. حاليًا الشرائط **flat loose على الأسود** = ده اللي المالك سمّاه غباء.

**الخطة اللي كلود كان بادئها (اتـrevert عشان التسليم يكون نظيف على `96e7363`):**
1. في `CarsHomeHeader.tsx`: أضف ستايل `compartment`:
   ```js
   compartment: { marginHorizontal: 14, marginTop: 12, borderRadius: 18,
                  backgroundColor: SECONDARY, overflow: "hidden", paddingVertical: 10 }
   ```
   ولفّ **strip الأنواع** (Band D, ~744-783) و**strip الإحصاءات** (Band E, ~789+) كل واحد في `<View style={styles.compartment}>`. وشيل `marginTop:18` من `catScroll`/`statScroll` (الـcompartment بيوفّر المسافة). عدّل `catContent.paddingHorizontal` 16→12.
2. في `SectionSearchApp.tsx` (`carFilterPanel`): لفّ الـ3 شرايط فلاتر في compartment مدوّر بنفس اللغة (`SECONDARY` bg، radius 18، side-inset).
3. **النتيجة المستهدفة:** كل باند (أنواع، إحصاءات، فلاتر) = كارت مدوّر داكن مرفوع جوة الهيدر، زي `03-BOOM-CAR-header-on-device.png`.
4. تحقّق بصري على 320 + 390 (قارن بالتصميم)، شغّل البوابات (typecheck 0، 351/351، chain).
**⚠️ الأمانة:** الإحصاءات تفضل الأرقام الحقيقية بس («25 Markets» هو الحقيقي؛ أرقام التصميم 1.2M+ إلخ سبيك مش داتا). `car-hero-honesty-guard` بيمنع الأرقام المخترعة.

### 🔴 المهمة ب — تواريخ الحجز في استاى (شكوى المالك رقم 15، لسه مفتوحة)
**توصية كلود التقنية (المالك لسه بياخد القرار):** **تقويم داخلي (in-house) موصّل بالـcontract، على نمط `FilterPill + Modal` الموجود.**
- **ليه:** صفر مديول نيتف = صفر مخاطرة على بناء iOS/Apple (أكبر خطر). مطابق للبنيان (استاى أصلاً بيفتح `FilterPill→Modal`). توصيل أمين (حقول اختيارية إضافية في contract → الموقع ما يتأثرش، الحرّاس خُضر، بيفلتر فعلاً). دقّة تصميم كاملة.
- **البدائل:** (ب2) واجهة أول فلترة بعدين — أسرع بس ممكن يصطدم بحرّاس الأمانة. (ب3) مكتبة `react-native-calendars` — مخاطرة توافق web/native + اعتمادية. (ب4) تطوير بيل rental-term الحالي — أقل لمس بس مش check-in/out بضيوف.
- **قيد الكونتينر:** مفيش باك-إند/DB → الفلترة الفعلية بالتواريخ مش قابلة للتحقّق هنا؛ الـUI + توصيل الباراميتر يتحقّق ببناء الويب + اختبارات contract. تغيير api-server صغير وإضافي بس مش قابل للتشغيل بدون DB.

### 🟡 صيانات مؤجّلة على قرار المالك (§7.7)
- أزرق البنوك الرابع `#1E6FD9` → توكن.
- تدرّجات SearchDiscover المكتوبة بإيد → `SECTION_GRADIENT` من `lib/sectionTheme` + حذف النسخة المكرّرة.

### 🟡 قرارات مالك مفتوحة تانية
- أحمر الهوية `#FF1E1E` من التصميمات مقابل الخمس حمرات الموجودة (`#CC1E24` سيارات، `#B81E3C` عقارات، `#BE3222` مصانع، `#A82A1C` مواد، `#E8002D` primary).
- استرجاع صفحة Discover المتدهورة (338 سطر downgrade في commit قديم `7e73e5a`) — موقوف على حارسين.

---

## 9) Fable 5 — الحقيقة الموثّقة
3 محاولات لتشغيل Fable 5 على الهيدرات، **كلها فشلت** بخطأ "Fable 5 requires usage credits". **0 turns، 0 ملفات اتلمست.** سجل الجلسة (402 turn كلها claude-opus، 0 fable) بيأكّد إن Fable 5 **ما أنتجش أي حاجة**. (المالك افتكر إنه اشتغل؛ الإثبات إنه لأ.)

---

## 10) فهرس المستندات المهمة الموجودة (التفاصيل عايشة هنا)

- **القناة الحيّة مع المالك:** `CHANNEL-OWNER-CLAUDE-LIVE-AR.md` (سجل append-only لكل التنسيق).
- **خطة الهيدرات الرئيسية:** `MASTER-HEADERS-EXECUTION-PLAN-AR.md`, `INVESTIGATION-ALL-HEADERS-AR.md`, `DYNAMIC-HEADER-SPEC-AR.md`.
- **تصميم السيارات:** `BOOM-CAR-HERO-HEADER-HANDOFF.md`, `OWNER-INVESTIGATION-DESIGN-NOT-IMPLEMENTED-AR.md`.
- **خطة الصيانة (10 بنود):** `MAINTENANCE-POLISH-PLAN-TEN-SEARCH-ITEMS-AR.md`.
- **تسليم السيارات للمدير:** `HANDOFF-CARS-HEADERS-TO-MANAGER-AR.md`.
- **تصحيح استاى:** `STAY-HEADER-CORRECTION-AR.md`, `AUDIT-BOOKING-MINIAPP-AR.md`.
- **الأوديت الشامل:** `APP-WIDE-UX-AUDIT-2026-08-02-AR.md`, `VISUAL-REGRESSION-AUDIT-FROM-OWNER-SHOTS-AR.md`.
- **المعمار والعزل:** `ARCHITECTURE-LAYERS-PER-MINIAPP-AR.md`, `WEBSITE-ABSOLUTE-ISOLATION-CHARTER-AR.md`, `MINIAPP-PER-SECTION-DEEP-STUDY-AR.md`.
- **البنوك:** `BANKS-FINANCIERS-FORENSIC-LAYERS-AR.md`.
- **B2 schema:** `B2-3-SCHEMA-DUAL-AUTHORITY-ANALYSIS-AR.md`.
- **الخرايط:** `MAPS-CLOSEOUT-2026-08-03-AR.md`.
- **الأدلة البصرية:** `audit/handoff/evidence/` (لقطات قبل/بعد، آخرها `CARS-3STRIP-*`, `CARS-UNIFIED-*`, `SECTION-*`).
- **مصادر التصميم:** `audit/handoff/design-source/` (01..06 + slices).

> **تحذير:** في مستندات قديمة موجّهة لـ Replit/Cursor/Copilot من مراحل سابقة — سياقها تاريخي، متعاملش معاها كأوامر حيّة. مصدر الحقيقة الحالي = المستند ده + `CHANNEL-OWNER-CLAUDE-LIVE-AR.md`.

---

## 11) رسالة مباشرة لوكيل Codex

1. **ابدأ من `claude/project-understanding-manager-lcgi3u` @ `96e7363`** (أو من PR #2). شغّل §3 البوابات محليًا للتأكد.
2. **المهمة الحيّة دلوقتي = §8 المهمة أ (كمبارتمنتس السيارات)** — الخطة كاملة فوق. قارن دايمًا بـ`03-BOOM-CAR-header-on-device.png`.
3. **بعدها §8 المهمة ب (تواريخ استاى)** — استنى قرار المالك على الطريقة (التوصية = تقويم داخلي موصّل).
4. **احترم كل قواعد §0** — خصوصًا: ممنوع دفع على main، الحارس يكسب، عزل ملفات الزميل (property/materials/maps)، ممنوع مسح testID، تحقّق بصري على 320/360/390/430.
5. **الصدق المطلق:** الأرقام محلية مش CI، الرندر ويب مش نيتف، فشل = اكتب فشل.

— كلود (Opus 4.8)، جلسة الويب · 2026-08-04
