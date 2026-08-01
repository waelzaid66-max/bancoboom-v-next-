# حزمة تسليم فورية — وكيل Cursor على اللابتوب (مساعد للموجة N0/N1)

**من:** Cloud agent على `-BANCO-CA-OOM-`  
**إلى:** وكيل Cursor Desktop / Laptop (الثانوي)  
**وقت:** 2026-07-21 · **قبل القراءة اسحب `main`**

---

## 0) أوامر مزامنة إلزامية أولاً

```bash
cd "$(git rev-parse --show-toplevel)"
git fetch origin
git checkout main
git pull --ff-only origin main
git log -1 --oneline
# المتوقع عند فتح هذه الحزمة: d396d71 أو أحدث commit بعده على main
```

```bash
node scripts/chain-integrity-gate.mjs
# يجب PASS كامل (كان 24/24 قبل N1.1؛ بعد إصلاح update-503 قد يكون 25/25)
node --test artifacts/banco-mobile/tests/lib-hardening.test.mjs
node --test artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs
```

**لو gate أحمر: قف. لا إصلاحات منتج.**

---

## 1) الوثائق المرجعية (اقرأ بهذا الترتيب)

1. `audit/NEXT-WAVE-FULL-SYSTEM-STUDY-BEFORE-EXECUTION-2026-07-21-AR.md`  
2. `audit/ACCOUNTS-COMPLETE-GAPS-S1-S2-S4-2026-07-21-AR.md`  
3. `audit/PRIORITY-LIST-STRICT-SAFE-CHAIN-2026-07-21-AR.md`  
4. `audit/WAVE-W2-GUARD-ALIGN-AND-LAWS-2026-07-21-AR.md`  
5. هذا الملف + `audit/N0-BASELINE-AND-N1-UPLOAD-HYGIENE-2026-07-21-AR.md`

---

## 2) دورك على اللابتوب (مساعد — ليس redesign)

| اعمل | لا تعمل |
|------|---------|
| تأكيد gate أخضر محلياً | دمج `cursor/booking-notif-test-contract-4322` |
| QA يدوي N0 على جهاز/محاكي | لمس Stay 30×30 / car strip / SECTION_ROUTE |
| Ops trace رفع: ENV تخزين + `upload_claims` | إحياء `ListingMediaEditor` دون أمر مالك |
| إثبات Push على ASB إن وُجد | اختراع Presence/Typing/Facebook/auto-FI |
| تقرير فشل بـ request-id | تعطيل chain gate |

---

## 3) بروتوكول الأمان (قبل/بعد أي تغيير)

### قبل
1. `node scripts/chain-integrity-gate.mjs`  
2. lib + section guards  
3. اكتب الفرضية + الملف + التبعية في سطر واحد  

### بعد
1. نفس الأوامر الثلاثة  
2. Smoke مسار متأثر فقط  
3. تأكد أن حسابات/شرائط/Discover لم تُمس  

---

## 4) حالة N0 (Cloud ثبّتها)

| فحص | نتيجة عند `d396d71` |
|-----|---------------------|
| chain-integrity-gate | **24/24 PASS** |
| lib-hardening | **19/19 PASS** |
| section-miniapp-guard | **48/48 PASS** |
| حسابات S1/S2/S4 | على `5a67b27` وما بعده |

### QA يدوي مطلوب منك على اللابتوب (N0)
- [ ] Profile ⋯ يفتح ويُغلق (لمس)  
- [ ] Skip على بوابة النوع  
- [ ] هاتف edit-phone  
- [ ] FI → Banks → إن بلا ربط: `banks-awaiting-link`  
- [ ] Stay sort 30×30 + car brand-origin strip  
- [ ] Discover → section (لا melt)  
- [ ] رفع صورة إنشاء إعلان (إن التخزين حي)  
- [ ] نوتفكيشن جرس + رسالة واحدة  

---

## 5) N1.1 Upload — حكم الدراسة

**مسار الإنشاء LIVE** في `create.tsx` + `lib/upload.ts` + `uploadController` (503 + IDOR) = **PRESENT**.  
**ListingMediaEditor** = ملف ميت — لا تلمسه.  
**Edit media UI** = غائب على الموبايل — موجة منتج منفصلة.  

فجوة مصدر ضيقة وُجدت وأُغلقت في Cloud (إن ظهر في الـ pull):  
`updateListingHandler` يمرّر `MEDIA_VERIFY_RETRYABLE` → **503** مثل create (+ INVALID_DATA/FORBIDDEN).

**فشل رفع برودكشن مع gate أخضر = Ops:**
1. `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS`  
2. جدول `upload_claims` على DB الحي  
3. `node scripts/verify-upload-claims-schema.mjs` إن وُجدت `DATABASE_URL`  
4. staging smoke بـ Clerk token إن متاح  

---

## 6) الموجة التالية بعد N0 على جهازك

| أولوية | مهمة |
|--------|------|
| N1.2 | Push إثبات ASB (ليس Expo Go) |
| N1.3 | طابور ربط FI أدمن (مراقبة — بدون auto-create) |
| N2 | توسعة قسم واحد فقط بأمر المالك |

---

## 7) قوانين لا تُكسر

1. شكوى ≠ redesign  
2. لا خلط تاكسونومي بين الميني‑آبس  
3. DB = مصدر دور الحساب؛ Clerk fallback فقط  
4. لا mega-commits ريبلِت  
5. CA-OOM `main` فقط مصدر الحقيقة  

---

**الصق ردك هنا بعد المزامنة:** `SYNC_SHA=…` · `GATE=…/…` · `QA_N0=pass|fail` · أي فشل upload بـ status + request-id.
