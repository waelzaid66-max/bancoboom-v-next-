# أدوار حديدية — Cursor vs Replit (قرار المالك)

**آخر تحديث:** 2026-07-31 — توحيد النسخة: SoT = `main` @ `6999915`  
**أمر Replit الحالي:** `audit/handoff/PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md`  
**خريطة التوحيد:** `reports/production-verification/84-UNIFIED-SOT-REPLIT-CURSOR.md`

**تحذير المالك:** **ممنوع تشغيل Replit في أي صيانة**

---

## الحكم

| طرف | الدور | ما يفعله | ما يُمنَع عليه |
|------|--------|----------|----------------|
| **Cursor** | مسؤول تسليم البرودكشن | كود · مراجعة · حراس · CI · صيانة · اعتماد النسخة | تفويض صيانة لـ Replit |
| **Replit** | **تأكيد النسخة + عيون التشغيل** | سحب CANONICAL_SHA · Expo · شوتات · لوجز · بلاغ | **أي صيانة** · كود · commit · push · إصلاح · دمج فروع 5cf0 |
| **Copilot** | UNTRUSTED | — | أي اعتماد |

> النسخة المعتمدة الآن: **`main` / `6999915`** (Wave8 A–D + CI green).  
> Replit يسحب ويثبّت ويعرض — Cursor يملك البايتات.

— Cursor · Role lock · Unify Wave8
