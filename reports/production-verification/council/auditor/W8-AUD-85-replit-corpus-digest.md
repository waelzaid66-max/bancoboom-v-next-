# W8-AUD-85 — Replit corpus digest → Chair (كلام Replit في الحسبان)

- Seat: Production Auditor  
- **SoT:** `main` @ `ddb9371`  
- Owner: اجمع تقارير Replit بالكامل · لخّصها · بلّغ المدير · الإصلاحات الجانبية · كلامه في الحسبان  
- Stamp: `2026-07-31T15:59Z`  
- Mode: evidence digest · **zero product code** · Replit **لا يملك صيانة** per Owner role lock

---

## 0. حكم الأدوار (يجب أن يبقى في الحسبان)

من `audit/handoff/ROLES-CURSOR-VS-REPLIT-AR.md` + `GOLDEN-PATH-REPLIT-CURSOR-AR.md`:

| طرف | دور Owner | Auditor enforcement |
|------|-----------|---------------------|
| **Cursor / council** | تسليم برودكشن · كود · حراس · CI | هذا المقعد |
| **Replit** | تأكيد نسخة · تشغيل · شوتات · بلاغ فقط | **ممنوع** commit/push/صيانة |
| **Copilot** | UNTRUSTED | لا اعتماد |

**كلام Replit يُسمع كدليل تشغيل/شوتات — لا كأمر إصلاح.** أي باج يراه Replit → يبلّغ؛ Cursor/Chair يصلحان على `main`.

---

## 1. فهرس تقارير Replit على الريبو (corpus)

### A. تقارير جذر / تدقيق أضرار
| ملف | خلاصة |
|-----|--------|
| `BANCO-REPLIT-AUDIT-REPORT.md` | **66+ commits** من `agent@replit.com` عبر 6 ريبو؛ فوضى config (إزالة/إعادة)؛ "Published your App" المتكرر ينشر نسخاً قديمة؛ إصلاحات Cursor لا تظهر لأن deploy من main قديم؛ فرع تدميري موثّق |
| `replit.md` | دليل تشغيل monorepo على Replit (workflows · PORT · DATABASE_URL · artifacts router) — **تشغيلي** لا SoT برودكشن |
| `.agents/memory/banco-replit-install-env.md` | تثبيت deps ضمن حد 120ث · أين توضع أسرار Clerk/Expo |
| `.agents/memory/replit-object-storage-repoint.md` · `replit-ai-integration-provisioning.md` | Sidecar تخزين/AI على Replit — Coolify يجب S3 لا provider=replit |

### B. Handoff عربي (≈30 ملف باسم REPLIT / ENTER-NOW / PASTE-REPLIT)
أبرزها:
| ملف | خلاصة كلام Replit / الأوامر |
|-----|------------------------------|
| `REPLIT-TEST-REPORT-STRONGEST-AR.md` | بلاغ اختبار: MOBILE_TSC=0 · API green · expo-doctor 18/18 بعد إصلاح أيقونات JPEG متنكرة · GUARD 46/46 (تاريخي) · تنبيهات A–D هيدر أسود مقفولة |
| `REPLIT-TO-CURSOR-URGENT-AR.md` | نفّذ batch ثم المالك: «صفحة البحث والشكل باظ» — يطلب تحقق Cursor (إثبات أن صيانة Replit خطرة) |
| `ROLES-CURSOR-VS-REPLIT-AR.md` | **ممنوع تشغيل Replit في أي صيانة** |
| `GOLDEN-PATH-REPLIT-CURSOR-AR.md` | Replit = سحب SHA · شوتات فقط؛ باج → بلّغ Cursor |
| `ENTER-NOW-REPLIT-*` / `PASTE-REPLIT-*` | أوامر لصق تشغيل/شوتات/مزامنة SHA — ليست خطط منتج |
| `CLAUDE-*-FOR-REPLIT` / `CLAUDE-INVENTORY-RESPONSE-TO-REPLIT` | جسر جرد Claude↔Replit (تاريخي) |
| `JOINT-OPS-REPLIT-COPILOT-CURSOR` | تنسيق مشترك — Copilot يبقى UNTRUSTED |

### C. Council / Coolify / Live (الحقيقة الصلبة اليوم)
| ملف | خلاصة |
|-----|--------|
| `70-PRODUCTION-HARD-TRUTH-MAP.md` | Live Certified **NO** حتى cutover=0؛ DNS ما زال Replit/Horizons؛ Coolify compose SoT؛ EAS يرفض origin=replit |
| `56-LIVE-CUTOVER-BASELINE.md` | apex=Replit “isn't live” · www=Horizons CDN · API 404 HTML |
| `COOLIFY_DEPLOY_NOW.md` · `OPS_GO_LIVE_CHECKLIST.md` | كتاب المشغّل — ريبو واحد `banco-with-wael` · compose · apex→`web:80` · S3 |
| `W5-AUD-52` · `W5-AUD-55` · cutover packets | تكرار NOT_CUTOVER عبر الموجات |
| **هذا الختم** `pnpm ops:live-cutover` | **0/6 FAIL** — نفس نمط Replit HTML + Horizons |

---

## 2. ماذا يعني كلام Replit لخطط المدير الآن

| ادعاء Replit (تاريخي) | هل نأخذه؟ | كيف يدخل قرار Chair |
|------------------------|-----------|---------------------|
| الاختبارات كانت خضراء على ريبل | جزئياً | نعيد على **tip `main`** بحراس المجلس (77/8/47/…) لا أرقام 46/46 القديمة |
| أيقونات JPEG متنكرة أُصلحت | نعم كدرس | لا نعيد فتحها إن الحراس خضراء |
| «البحث باظ بعد صيانتي» | **نعم — تحذير** | يؤكد دور lock: لا صيانة من Replit |
| Published من Replit يخفي إصلاحات Cursor | **نعم — حرج** | البرودكشن = Coolify من GitHub `main` فقط |
| Replit يحتاج أسرار PORT/DB | نعم للـdev | البرودكشن = Coolify secrets + S3 |

**رأي Auditor:** لا تُفتح موجة «إصلاحات Replit». موجة المدير Wave8 (تلوث/توصيل) هي المسار الصحيح. فجوة Live = DNS/Coolify Owner — مطابقة لتقارير Replit نفسها عن deploy الخاطئ.

---

## 3. الإصلاحات الجانبية (Side fixes) — بلّغ المدير

كلها على `main` تحت Wave8 · يجب أن تبقى في الحسبان عند أي جمع Replit:

### Tranche A (`b4aa364` / merge `a80de8c`) — CLOSED
| ID | إصلاح |
|----|--------|
| D-W8-01 | Car: إلغاء market/sort من `CarsHomeHeader` · الشريط primary هو SoT |
| D-W8-02 | Materials: أصل واحد `materials-origin-strip` |

### Tranche B (`2afccf8`) — CLOSED · AUD-82 PASS
| ID | إصلاح |
|----|--------|
| D-W8-03 | Discover: قطع props الذوبان الميتة · يبقى `onExploreMap` فقط · FilterSheet يحتفظ بـ browseBrand |

### Tranche C (`fb81f92` / status `ddb9371`) — CLOSED · **AUD-84 PASS هذا الختم**
| ID | إصلاح |
|----|--------|
| D-W8-04 | حذف `applySaved` الميت من Search host |
| D-W8-05 | نثر Maps من «#11» → **§7 من 10** (منتج+حراس) |
| D-W8-06 | lib-hardening يؤكد غياب applySaved |
| docs | امتصاص حزمة AUD-82 Tranche B على tip |

### جانبي غير منتج (HOLD — لا تُخلط مع Replit)
Factories header · Banks directory · REL-21 · REL-15 · mockup-sandbox TC drift · API Vitest بلا DATABASE_URL

### Live (ليس جانبياً — هو الحاجز)
`ops:live-cutover` **NOT_CUTOVER 0/6** — apex Replit placeholder · www Horizons — اتبع `COOLIFY_DEPLOY_NOW.md`

---

## 4. Ask Chair

1. عند جمع تقارير Replit: استخدم **هذا الملخص** + role lock — لا تُنفّذ أوامر PASTE-REPLIT كصيانة.  
2. ادمج بقايا Auditor (#41): AUD-80/81/83 deep/84/85.  
3. حدّث `81` board (ما زال Tranche B EXECUTE — انحراف وثائقي).  
4. STANDBY منتج · Owner Coolify إذا أريد Live Certified.

— Auditor
