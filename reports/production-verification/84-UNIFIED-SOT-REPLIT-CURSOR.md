# 84 — توحيد الفكر: Cursor ↔ Replit (نسخة كاملة واحدة)

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**SoT:** `main` @ `6999915`  
**Paste for Replit:** `audit/handoff/PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md`

---

## 1. ماذا فهمنا من اللوجز/الضجيج (حقيقي)

| طبقة | الحقيقة | الضجيج |
|------|---------|--------|
| شاشة فاضية / splash | CORS لأن Expo ضرب `banco.today` بدل API المحلي | «التطبيق بايظ» بينما السيرفرات Running |
| شاشة سوداء :5000 + 401 | Clerk `sk` placeholder / `pk_live` مع `sk_test` | HTML 200 لكن الجلسة ميتة |
| Feed يظهر بعد الإصلاح | 110 listing seed إنجليزي | يُظن «الداتا مكسورة» وهي **محتوى ضعيف عربيًا** |
| Live Certified | DNS ما زال Replit/Horizons | تقارير قديمة «منشور» ≠ Coolify |
| فروع `*-5cf0` | قديمة / متشعبة | تقرير Replit §7 يغري بالدمج — **ممنوع بدون Chair** |

تفاصيل: `reports/replit-env/2026-07-31-REPLIT-ENVIRONMENT-REPORT.md` · `reports/BANCO_FULL_READ_ONLY_AUDIT_2026-07-30_AR.md` · AUD-85.

---

## 2. مشاكل الداتا الدقيقة (API↔موبايل)

1. **Auth plane:** لازم زوج Clerk test متطابق (`evolving-magpie-43`) في Secret Store.  
2. **Domain plane:** `EXPO_PUBLIC_DOMAIN` من `$REPLIT_DEV_DOMAIN` في التطوير فقط.  
3. **Content plane:** seed افتراضي إنجليزي — عربي = قرار منتج لاصيانة Replit.  
4. **Market plane:** افتراضي EG — فلاتر السوق تعمل لكن المحتوى المحلي محدود.

بعد إصلاح env: الاتصال أخضر · المحتوى يحتاج قرار Owner لاحقًا.

---

## 3. النسخة الكاملة على GitHub (ما يجب أن يسحبه Replit)

Wave8 **A+B+C+D** + CI أخضر + حماية 10 عوالم بالخرائط/الهوية.

أمر اللصق: **`PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md`**.

---

## 4. أوامر المقاعد

| مقعد | أمر |
|------|-----|
| **Replit** | نفّذ PASTE أعلاه · شوتات R01–R12 · رد القالب · **STANDBY كود** |
| **Auditor** | AUD-86: peer أن PASTE يشير لـ tip أخضر وأن 5cf0 محظورة |
| **Reliability** | REL-00: إن وصل بلاغ RED_LOGS من Replit → صفّه لـ Chair (لا تصلح على ريبل) |
| **Idle** | SUP: حدّث لوح العوالم أن SoT = main الموحد |

---

## 5. ممنوع

- صيانة من Replit  
- دمج `cursor/*-5cf0`  
- ادّعاء Live Certified  
- إعادة تلوث shared env  

— Chair
