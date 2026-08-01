# 91 — REPLIT CORPUS ABSORB + SPECIALTY WORK DISTRIBUTION

**Authority:** Chief Production Delivery Director  
**Date:** 2026-07-31  
**SoT tip:** `origin/main` @ `7e3b40a` (SEC-01/02 VCS + DEP-01a + DIR-02)  
**Mission:** جرد كلام ريبلت بالكامل · تطبيع · توزيع شغل بالتخصص · صفر تداخل  

هذا الملف = **توزيع العمل الرسمي**. لا قائمة ثانية.

---

## 0. حكم الأدوار (حديد)

| مقعد | تخصص فقط | يملك | ممنوع مطلقاً |
|------|----------|------|---------------|
| **Director** | قرار · ترتيب · دمج · Sign-Off | Approve Plan · merges | تفويض Live بدون دليل |
| **Intelligence (PIO/Auditor)** | قراءة · جرد · تحقق greps · مصفوفات | VERIFY packets · drafts | كود منتج · تنفيذ إصلاحات |
| **UX / Visual** | شوتات · RTL · كثافة · اتساق شاشات | FAIL cells + shot IDs | معمارية · فلاتر منطق |
| **Replit (عيون)** | سحب `main` · تشغيل · شوتات · لوجز · أسرار UI إن طلب Owner | SYNC_SHA · RED_LOGS | commit · push · صيانة `artifacts/*` · دمج `*-5cf0` · Publish كـ Live |
| **Reliability** | CI · حراس · تصنيف RED_LOGS | counts · run URLs | منتج بدون EXECUTE |
| **PE-Mobile** | Expo/RN فقط بعد EXECUTE | PR واحد/ID | اختراع · SVG migrate · Leaflet delete |
| **PE-API** | api-server/أمن/بحث بعد EXECUTE | PR واحد/ID | اختراع taxonomy |
| **Owner** | أسرار · Coolify · DNS · Live | Secrets UI · cutover | تفويض Replit كمنتج |
| **Support/Idle** | لوحة | sync من `88`/`91` | منتج |
| **Copilot** | — | — | **UNTRUSTED** |

**كلام Replit = دليل تشغيل/شوتات — ليس أمر إصلاح.**

---

## 1. ماذا عملت ريبلت فعلاً (جرد دقيق)

| فعل | دليل | حكم Director |
|-----|------|--------------|
| سحب ~142 commit من `origin/main` | Env report §2 | مسموح (عيون) |
| `pnpm install` + `db push-force` + restart workflows | Env report §2 | مسموح |
| إصلاح `.replit` فقط `a5390bc` (إزالة DOMAIN/shared pk_live/placeholder sk) | Env report §4 | مسموح تاريخياً · **ناقص** (بقي Paymob plaintext + pk_live في production) |
| تقارير: Env · ALL-ISSUES · Intelligence PIO | `reports/replit-env/*` · `reports/intelligence/*` | مسموح READ |
| شوتات/لوجز/curl (بيض/Clerk/facets) | PIO ISSUE-001..008 | مسموح |
| ادّعاء Expo كان يعمل بعد env fix | Env report §5 | **يُعاد VERIFY على tip `7e3b40a`** (بعد SEC scrub + website) |
| `projects/banco-status` لوحة معزولة | commit `2378318` | **OUT-OF-BAND** · ليس مسار Live · لا يدخل Sign-Off |
| توصية دمج `*-5cf0` | Issues master + PIO DECISION 3 | **مرفوض** `DIR-REJECT-5CF0` |
| أي صيانة داخل `artifacts/*` | — | **ممنوع** إن حدث |

---

## 2. تطبيع: من كلام ريبلت → Master IDs فقط

### CLOSED / VCS done (لا تعيد فتحها كـ «باج مفتوح»)

| ID | حالة | ملاحظة لريبلت/الفريق |
|----|------|----------------------|
| DIR-01 | CLOSED | CI green `7e3b40a` run 30654946946 |
| DIR-02 | CLOSED | Director + Auditor peer + REL AGREE |
| MOB-W9E | CLOSED | Wave9 E |
| MOB-05 | CLOSED | pins exact |
| SEC-01 | **VCS CLOSED** | Owner يجب Secrets — انظر OWNER packet |
| SEC-02 | **VCS CLOSED** | cold-start VERIFY على tip |
| DEP-01a | **EXECUTED** | workflow = banco-website |

### OPEN — موزّعة بالتخصص (لا تداخل)

| Pri | ID | من ريبلت/PIO | Owner الوحيد | ماذا يفعل الآن | دليل النجاح |
|-----|----|--------------|---------------|----------------|-------------|
| 1 | **SEC-01/02 Owner** | Paymob key · Clerk pair | **Owner** | ضع Secrets · أبلغ `SECRETS_SET=yes\|no` | Director ACK |
| 2 | **DIR-03** | شاشات بيضاء / شوتات | **Replit + UX** | PASTE + R01–R12 على tip **بعد** MOB-NOTIF-01 | shot IDs · Maps RED · Factories map · Expo blank re-check |
| 3 | **SEC-02 VERIFY** | ISSUE-001/002 | **Intelligence** | grep `.replit` نظيف + ack shots | VERIFY packet |
| 4 | **DEP-01 VERIFY** | ISSUE-004 website | **Intelligence + Replit** | workflow = website · :5000 shot | VERIFY |
| 5 | **API-HEALTH-01** NEW | ISSUE-005 `/api/v1/health` 404 | **PE-API** | STANDBY → Approve Plan: وثّق `/healthz` أو alias | curl matrix |
| 6 | **API-FACETS-01** NEW | ISSUE-006 categories=0 | **Intelligence** أولاً (curl) ثم **PE-API** | جرد facets على tip | JSON evidence |
| 7 | **API-FACETS-02** NEW | ISSUE-008 wrong paths | **Intelligence** | grep clients للمسارات الخاطئة | file:line |
| 8 | **AUTH-01** | P0-AUTH-01 state machine | **PE-Mobile** | STANDBY حتى Approve Plan | — |
| 9 | **ACC-00** | حسابات كاملة | **Intelligence** (مسودة) + **UX** (شوتات) | عمّق المسودة بعد DIR-03 | كل الخلايا UNVERIFIED حتى device |
| 10 | **UV-04 / OAuth dead btn** | ISSUE-003 | **UX** يوثّق · **PE-Mobile** بعد Plan | لا تخترع OAuth | shot Admin/Dealer |
| 11 | **SEC-03…07** | upload/Paymob/allowlist/CVE/visibility | **PE-API** | STANDBY · طابور بعد Owner Secrets | one ID/PR |
| 12 | **SEC-02b** | PUBLIC_* → banco.today | **Director** | Approve Plan قبل أي تعديل | — |
| 13 | **DATA-01/02** | seed / rent data | **PE-API + Owner content** | بعد facets | — |
| 14 | **MOB-04** | Android tab elevation | **UX** note → PE بعد Plan | device UNVERIFIED | — |
| 15 | **MOB-01..03** | فلاتر مزدوجة | **HOLD** | لا تلمس | Owner يسمّي عالم |
| 16 | **LIVE-01** | NOT_CUTOVER | **Owner + Director** | Coolify فقط | cutover 0 |
| 17 | **NODE-01 / CODEGEN / E2E** | P1 toolchain | **Reliability** يقترح Plan | لا ينفّذ بدون EXECUTE | — |
| — | `*-5cf0` | توصية ريبلت | **REJECTED** | tip-only cherry | — |

---

## 3. إجابات ASK من المقاعد

| سؤال | جواب Director |
|------|----------------|
| أولوية بعد DIR-02: ACC-00 أم DIR-03؟ | **DIR-03 أولاً** (شوتات tip بعد SEC scrub) · ثم تعميق ACC-00 بعمود واحد |
| MOB-05 CLOSED؟ | **نعم CLOSED** |
| امتصاص #40 / #45؟ | نعم — الحزم على tip عبر هذا الفرع · لا bulk-merge فروع المقاعد |
| banco-status؟ | مقصود كمشروع معزول · **خارج Sign-Off** |
| SEC-01/02؟ | **VCS نُفّذ على `7e3b40a`** · REL كان على tip قديم — حدّث VERIFY |

---

## 4. أوامر لصق — تخصص واحد لكل مقعد

### 4.1 Owner
```
OWNER. Tip=origin/main≥7e3b40a. Read OWNER-SECRETS-REQUIRED-SEC-01-02.md.
SET Replit+Coolify Secrets: PAYMENT_CONFIG_ENCRYPTION_KEY + CLERK_SECRET_KEY matching pk_test (dev).
Reply: SECRETS_SET=yes|no · keys_named_only (no values in chat).
Do NOT publish from Replit as Live. Coolify = Live path only.
```

### 4.2 Replit (عيون فقط)
```
REPLIT EYES ONLY. SoT=origin/main. reset --hard origin/main. Report SYNC_SHA.
PASTE: audit/handoff/PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md
Expect section-guard 90/90. Web workflow = banco-website :5000.
After Owner secrets: cold start · shots R01–R12 per DIR-03-shot-board-READY.md
Confirm: Maps RED · Factories section-header-map · no CORS to banco.today from Expo preview.
NO code · NO commit · NO 5cf0 · NO re-add secrets to .replit.
Template reply in PASTE §6 (SECTION_GUARD 90/90).
```

### 4.3 UX / Visual
```
UX. Pair with Replit DIR-03 only. Fill FAIL cells R01–R12.
Also note Admin/Dealer Google button (UV-04) — dead if social empty — do not redesign.
MOB-04 Android tab = UNVERIFIED without device. Zero architecture.
```

### 4.4 Intelligence
```
INTEL READ-ONLY. Tip≥7e3b40a.
(1) VERIFY SEC-01/02/DEP-01a greps on tip (no PAYMENT= · no pk_live assign · banco-website workflow).
(2) API-FACETS-01/02: curl /api/v1/search/facets + grep wrong /api/v1/facets clients — evidence only.
(3) After DIR-03: deepen ACC-00 one column (Login+MFA) with Replit logs — still UNVERIFIED device.
Zero product code. Packet format 89 §3.
```

### 4.5 Reliability
```
REL. Tip≥7e3b40a run 30654946946 SUCCESS — ACK.
REL-00: section 90 · materials 8 · ui-density 4 · wiring 47.
Re-VERIFY SEC greps (stale OPEN on 3d4773b is obsolete).
STANDBY: classify Replit RED_LOGS only · draft Plans for NODE-01/CODEGEN/E2E — no EXECUTE.
No 5cf0. No product.
```

### 4.6 PE-API
```
PE-API STANDBY. Queue (Director EXECUTE one-at-a-time):
API-HEALTH-01 · API-FACETS-01 (after Intel curl) · SEC-03 · SEC-04 · SEC-05 · SEC-06 · SEC-07 · SEARCH-01.
One ID per PR. Tests required. Ask Director before payments touch.
```

### 4.7 PE-Mobile
```
PE-Mobile STANDBY. Queue after DIR-03 + Owner secrets:
AUTH-01 Approve Plan first · then MOB-06/07/09 · UV-04 hide dead OAuth (Plan).
HOLD MOB-01/02/03 dual filters. Forbidden: FactoriesHomeHeader · SVG migrate · Leaflet delete · identity gold.
```

### 4.8 Support
```
SUP. Board = 88 + 91 only. Close noise: do not chase #36. Flag duplicate PRs.
banco-status = OUT-OF-BAND. Zero product.
```

---

## 5. ترتيب التنفيذ (قفل Director)

```
Owner Secrets
  → Replit+UX DIR-03 shots on tip
  → Intelligence SEC/DEP VERIFY + facets curl
  → Director Approve Plan next product ID (API-FACETS or AUTH-01 or SEC-03)
  → PE implements one ID
  → REL+Intel VERIFY
  → merge main
  → … repeat …
  → LIVE-01 only when Owner cutover ready
```

**عالم/ID واحد في كل مرة للمنتج.**

---

## 6. مصادر ممتصّة (لا تفتح باك لوج موازي)

- `reports/replit-env/2026-07-31-*`  
- `reports/intelligence/2026-07-31-PRODUCTION-INTELLIGENCE-REPORT.md`  
- Auditor: DIR-02 · DIR-03 board · ACC-00 DRAFT · W9-AUD-90 · AUD-85 corpus  
- Reliability: W9-REL precision · DIR-01 green  
- `88`/`89`/`90` · PASTE Wave8 · OWNER-SECRETS · DIR-REJECT-5CF0  

## 7. Live screenshot absorb (PIO 2026-07-31 session)

| Surface | Shot | Classification | Owner next |
|---------|------|----------------|------------|
| Landing :18150 | OK RTL | PASS visual | — |
| Admin :22357 | Login · Google absent | UV-04 / ACC-00 | UX note · AUTH Plan |
| Dealer :21539 | Login · Google present/grey | UV-04 | UX |
| Expo :23351 | white blank | SEC-02 secrets + MOB-NOTIF-01 | Owner + PE (EXECUTED guard) + Replit re-shot |
| Web :5000 | white / Clerk SSK invalid | **Owner Secrets** SEC-01/02 | Owner |
| API :8080 | facets cats=0 · /health 404 | API-FACETS-01 · API-HEALTH-01 | Intel curl → PE |

**Branch merge plan from PIO:** **REJECTED** — see `DIR-REJECT-BRANCH-MERGE-PLAN-2026-07-31.md`

**MOB-NOTIF-01:** EXECUTED — Expo Go no longer static-imports notifications on Feed; push module skipped on StoreClient.

— Chief Production Delivery Director
