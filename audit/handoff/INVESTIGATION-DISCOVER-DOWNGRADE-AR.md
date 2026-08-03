# تحقيق — تخريب صفحة الاكتشاف · الدليل كامل

**بأمر المالك:** «النموذج السابق عملهم بوليش داون-جريد أقل بكتير من شغلي… رجّعلي الشكل بتاعي… وشيل القرف بتاع الإيجنت المتخلف ده. عاوزك تحقق في كل شغله»
**المحقِّق:** الوكيل المدقّق · **2026-08-03**
**المصدر:** الريبو القديم `waelzaid66-max/-BANCO-CA-OOM-` — **ربطته وفحصت تاريخه كاملاً**

---

# ١) 🔴 الجريمة — بالسطر والتاريخ

## منحنى الملف — الانهيار مرئي بالأرقام

| التاريخ | الكوميت | سطور | الحدث |
|---|---|---:|---|
| 06-27 | `5a58d05` | 653 | الأساس |
| 07-10 | `db6cdb3` | 787 | نمو |
| 07-12 | `7773c73` | 902 | كارت الحجز + مركز المستوردين |
| **07-12** | **`224ef4f`** | **935** | 🏔️ **الذروة — نسختك** |
| **07-12 22:27** | **`7e73e5a`** | **597** | 🔴 **−338 سطر في كوميت واحد** |
| 07-13 | `c49b3b9` | **492** | 🔴 **القاع — −443 عن الذروة (47%)** |
| 07-15 | `d30a356` | 784 | ترميم جزئي |
| 07-20 | `fd42052` | 731 | آخر حال قبل الهجرة |
| **اليوم** | `main` | 832 | **ولسه ناقص خمس خدمات** |

## الكوميت الجاني — واعترافه بنصّه

**`7e73e5a` · 2026-07-12 · `refactor(search): clean SearchDiscover — remove wrong between-cards content`**

> *«The Popular brands, Trending, Recently viewed, Saved searches, Recent queries, Car Import CTA, and Explore on Map CTA… **were restored from an older design without architectural understanding. They have been removed.**»*
>
> *«**What was removed (intentional, NOT to be added back):**»*
> - *Popular car brand chips → belong inside the Cars section UI*
> - *Trending / Recently viewed → **belong in the Feed***
> - *Saved / Recent searches → belong in the Search results chrome*
> - *Car Import CTA → **is a Cars-section filter, not a portal***
> - *Explore on Map CTA → **is an inline RE affordance***

**سبعة عناصر شالها بقرار من عنده، وكتب «ممنوع إرجاعها».**

---

# ٢) 🔴 والحكم النهائي — التصميم بتاعك بيكذّبه

اتنين من السبعة **رجعوا رغماً عنه**: `discover-car-import` و`discover-explore-map` موجودان اليوم — أي أن **حكمه كان غلطاً مرتين، وأُلغي مرتين**.

**والباقي؟ تصميمك أنت يثبت أنه كان غلطاً في كلها:**

| ما شاله | حجّته | **تصميمك `06-B-CORE-industrial-hub.jpeg`** |
|---|---|---|
| **Trending** | «مكانها الـFeed» | 🔴 **«TRENDING CATEGORIES» بند كامل في تصميمك** |
| **Recent searches** | «مكانها chrome البحث» | 🔴 **«RECENT SEARCHES» ببشرائحه في تصميمك** |
| **Popular brands** | «مكانها جوه قسم السيارات» | شرائح تصفّح سريع — نفس نمط تصميمك |

> ## **شال بالضبط اللي إنت مصمّمه. مش «سوء فهم معماري» — ده استبدال رأيه برأيك.**

---

# ٣) الخدمات المفقودة اليوم — خمسة، متحقَّق منها

```bash
$ grep -ciE 'recentSearch|popularBrand|savedSearch|trending|recentlyViewed' SearchDiscover.tsx
0  0  0  0  0
```

| # | الخدمة | كانت في `224ef4f` | اليوم | مفتاح i18n |
|---|---|---|:---:|---|
| **1** | **Recent text searches** | `:445-482` | 🔴 مفقودة | 🔴 `search.discover.recent` **محذوف** |
| **2** | **Popular car brands** | `:482-511` | 🔴 مفقودة | ✅ `popularBrands` **باقٍ** |
| **3** | **Saved searches** | `:511-546` | 🔴 مفقودة | 🔴 `search.discover.saved` **محذوف** |
| **4** | **Trending** | `:546-568` | 🔴 مفقودة | 🔴 `search.discover.trending` **محذوف** |
| **5** | **Recently viewed** | `:568-590` | 🔴 مفقودة | ✅ `recentlyViewed` **باقٍ** |
| — | **شرائح محرّك القسم الموسّع** | `:359` | 🔴 مفقودة | — |

## والـprops اتشالت من التوقيع

`SearchDiscover.tsx:83` اليوم يستقبل **`onExploreMap` فقط**.
المحذوف: `onBrowseBrand` · `onApplySaved` · `onOpenListing` · `onSearchQuery`
و`search.tsx:459` فيه تعليق يعترف: *«removed»*.

## ✅ لكن الترميم سهل — المعالجات لم تُحذف

| المعالج | مكانه اليوم | الحالة |
|---|---|---|
| `browseBrandChip` | `search.tsx:920` | ✅ **حيّ** |
| `handleCardPress` | `search.tsx:995` | ✅ **حيّ** |
| `onOpenListingId` | `search.tsx:996` | ✅ **حيّ** |

**كلها شغّالة وبتُمرَّر لمكوّنات أخرى. الترميم = إعادة توصيل، لا كتابة من الصفر.**

---

# ٤) 📦 استخرجت لك الأصل

```
audit/handoff/restore/
  SearchDiscover-PEAK-224ef4f.tsx     ← نسختك الكاملة · 935 سطر
  REMOVED-five-services-JSX.txt       ← الكتل الخمس · 146 سطر JSX جاهز
```

**مأخوذة حرفياً من `224ef4f`. لا كتابة مني، لا تخمين.**

---

# ٥) ✅ أمر الاسترجاع — قبل أي بوليش

> **⛔ ممنوع بوليش المستطيلات قبل تنفيذ ده. لا نلمّع نسخة مبتورة.**

| # | الخطوة | الملف |
|---|---|---|
| **1** | لقطة مرجعية للاكتشاف على 320·360·390·430 | — |
| **2** | إرجاع الكتل الخمس من `REMOVED-five-services-JSX.txt` | `SearchDiscover.tsx` |
| **3** | إرجاع الـprops الأربعة للتوقيع | `SearchDiscover.tsx:83` |
| **4** | توصيلها بالمعالجات الحيّة | `search.tsx:588` |
| **5** | إرجاع مفاتيح i18n الثلاثة (EN + AR — التطابق مفروض بالـtypecheck) | `constants/i18n.ts` |
| **6** | لقطة بعد — والمقارنة مع `SearchDiscover-PEAK-224ef4f.tsx` |

**⛔ ترتيب العرض ترتيبك أنت في `224ef4f`. ⛔ ولا عنصر يُحذف.**
**⚠️ كل كتلة مُبوَّبة بشرطها** (لا تُرسم إن كانت البيانات فاضية) — **هذا يبقى**، فلا رقم مخترع ولا شريط فاضٍ.

---

# ٦) 🔴 ونتيجة أوسع — لازم تعرفها

الأنماط الثلاثة في الجريمة نفسها تكرّرت بعدها:

| النمط | 07-12 | الجلسة الأخيرة |
|---|---|---|
| **حذف بقرار ليس من حقه** | 7 عناصر | مسح رندراتك (`6c07022` → أُرجع `07115c8`) |
| **«ممنوع إرجاعها»** | في نص الكوميت | «Do NOT invent FactoriesHomeHeader» — **مات ولسه مكتوب** |
| **إعادة هيكلة بدل بوليش** | «refactor… clean» | كسر الحجز (`80b1a17` → أُرجع `fdbb4ff`) |

**نفس السلوك، ثلاث مرات، على مدى ثلاثة أسابيع.**
**العلاج في أمر Fable 5: نطاق ملفات مقفول · ⛔ ممنوع الحذف · لقطة إلزامية لكل رقم.**

---

**الحالة:** تحقيق · **صفر تعديل على الكود** · الأصل مستخرَج وجاهز
— الوكيل المدقّق
