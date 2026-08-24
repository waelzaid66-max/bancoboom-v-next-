# تسليم كامل إلى كودكس — كل ما أملك، مقيس لا مُستنتَج
## Full handoff to Codex — everything measured, nothing inferred

**2026-08-24** · من: وكيل التدقيق المستقل (Claude) · إلى: كودكس، المدير المالك
**Every number below was produced by running a command, not by reading a file.**

---

# ⛔ الحقيقة رقم ١ — أهم شيء في هذا الملف
# FACT 1 — the single most important line here

**كل عمل اليوم (٢٧ فرعاً بتاريخ 2026-08-24) مبني على قاعدة عمرها ٣ أيام.**

```
merge-base of EVERY 2026-08-24 branch = 4f2c81c   (canonical of 2026-08-21)
current canonical                     = 6d83cb5   (2026-08-24 02:11)
the union carrying all the work       = f1a4365   (191 commits ahead)
```

> **الفريق يبني على `4f2c81c` بينما العمل الحقيقي في `f1a4365`.** *كل ساعة إضافية على هذه القاعدة تزيد تكلفة الدمج ولا تضيف قيمة.*

**وهذا هو سبب "التحديثات التي ضاعت": لم تضع — بل وُضعت على قاعدة لا يراها أحد.**

---

# ⛔ الحقيقة رقم ٢ — الفرع الرسمي لم يشحن بايت واحد
# FACT 2 — canonical shipped zero bytes

```
canonical moved:  4f2c81c → 6d83cb5   (2 commits)
tree hash 4f2c81c:  0353df69c09e
tree hash 6d83cb5:  0353df69c09e   ← IDENTICAL
```

**تحرّك الفرع الرسمي مرتين وشحن صفر بايت من كود المنتج.** *The two commits are a ledger document and a revert of a placeholder.* **هذا مقيس بتجزئة الشجرة، لا برأي.**

---

# 📊 الحالة الكاملة — Complete state

| | |
|---|---|
| فروع تحمل عملاً غير مدموج · branches with unmerged work | **62** |
| منها بتاريخ اليوم · from 2026-08-24 alone | **27** (آخرها 14:43) |
| الاتحاد متقدم عن الرسمي · union ahead of canonical | **191 commits** |
| tags | **0** |

## البوابات على الاتحاد — gates on the union (all green)

```
chain-integrity     247/247      confidence (local)  26/26   (CI runs 24)
root typecheck      exit 0       mobile              42/42 packs
api-server          97 files · 533 passed · 0 failed
guard reachability  172 of 173   (the 1 is RED-by-design, deliberately excluded)
prose-dependence    554 tracked product files · 5 packages · CLEAN
```

---

# 🔴 سجل المشاكل الكامل — the complete problem register

## أ · ما أثبتُّه وأصلحتُه (لا يحتاج عملاً منك)
## A · Proven and fixed — no work needed from you

**تسع تأكيدات كانت تقرأ التعليقات لا الكود.** *Nine assertions were reading prose, not code.* سبعة استُبدلت بقواعد قابلة للتنفيذ واثنتان أُعلنتا مقصودتين — وكلها مُثبتة بالطفرة (mutation-proven).

**أخطرها:** حارس اسمه `MSG-07b does not arm older-load on contentSizeChange` كان يفحص **وجود تعليق يقول ذلك فقط**. تفعيل البوابة فعلياً كان يُبقيه أخضر.

**خمسة عيوب في أداتي أنا** (#49–#53) — اثنان أبلغا عن نتائج خاطئة كأنها اكتشافات، واثنان دمّرا ملفات، وواحد جعل الرقم المنشور بلا معنى. **أخطرها #52:** سكربت `test` في الموبايل سلسلة `&&` من ٤٢ حلقة، تتوقف عند الحلقة ١٧ — فقيست الحزمة على **١٧ من ٤٢** وأُبلغ عنها "نظيفة".

## ب · محمي الآن بأمر المالك — Protected now, by owner instruction

**أيقونات قسم السيارات ومساراتها — مثبّتة ومُختبَرة بالطفرة.**

*قبل اليوم: الحارس كان يثبّت ١٤ مُعرّفاً و**صفر أيقونة**. هيدر مُعاد توليده يحتفظ بكل المعرّفات ويستبدل كل الأيقونات كان يبقى أخضر.*

**العقد المثبّت الآن — الالتزام به إجباري على أي إعادة توليد:**

```
مسار الاستيراد الوحيد:  @/components/icons          (طبقة lucide، ليست @expo/vector-icons)
                        @/components/search/car/VehicleGlyph

أيقونات الواجهة (٧):    bell(إشعارات) user(حساب) sliders(فلاتر)
                        bookmark(حفظ البحث) x(مسح) search
                        + الثنائي map/list — يجب بقاء الاثنين معاً

فئات المركبات (٢١):     cars suv electric motorcycles trucks buses vans
                        heavy boats yachts ships aircraft jets helicopters
                        agricultural construction emergency military
                        classic luxury more
```

**مُثبت بثلاث طفرات:** حذف فئة `boats` → فشل · تبديل الاستيراد إلى `@expo/vector-icons` → فشل · استبدال أيقونة `bell` → فشل.
**الأمر:** `pnpm -C artifacts/banco-mobile run test:car-dock-zero-loss`

## ج · مفتوح ويحتاج قرارك — Open, needs your decision

| # | المشكلة | الدليل المقيس |
|---|---|---|
| **1** | **٢٧ فرعاً على قاعدة قديمة** | merge-base = `4f2c81c` لكلٍّ منها |
| **2** | **تعارضات حقيقية عند الدمج** | 5–6 تعارضات لكل فرع، في ٧ ملفات |
| **3** | **الفرع الرسمي مجمّد** | tree hash متطابق منذ 08-21 |
| **4** | **عقدة هيدر السيارات** | نسخة A تعبر 245/245؛ نسخة الفريق تفشل الثلاثة |

**الملفات التي تتعارض فعلياً — the actual conflict set:**
```
artifacts/banco-mobile/components/search/SearchResultsMap.tsx
artifacts/banco-mobile/context/MessageOutboxContext.tsx
artifacts/banco-mobile/tests/map-bootstrap-fail-closed.test.mjs
artifacts/banco-mobile/tests/render-coverage-guard.test.mjs
lib/api-client-react/src/custom-fetch.ts
artifacts/banco-mobile/package.json      ← يُحلّ آلياً بالأداة أدناه
lib/api-client-react/package.json        ← يُحلّ آلياً بالأداة أدناه
```

> **`package.json` لا يُحلّ يدوياً أبداً** — استخدم `audit/tools/union-mobile-package-json.mjs`. الحل اليدوي يعيد بناء `scripts.test` ويُسقط حزم اختبار صامتاً.

---

# 🛠 الأدوات الجاهزة لك — instruments ready for you

في `audit/tools/` (١٠ أدوات). الثلاثة التي ستحتاجها فوراً:

```bash
# هل هذا الحارس يحمي شيئاً فعلاً؟ (الطفرة هي الإثبات الوحيد)
node audit/tools/prove-guard.mjs <file> <find> <replace> -- <command>
#   exit 0 [HOLDS] · exit 1 [DECORATION] · exit 2 [SKIP]

# هل أي حارس ينجح بسبب تعليق لا بسبب الكود؟
node audit/tools/comment-dependency-prover.mjs <repo> <path> -- <command>

# دمج package.json في الاتحاد — لا تفعلها يدوياً
node audit/tools/union-mobile-package-json.mjs
```

---

# ❓ ما أحتاجه منك — what I need from you

**١. القاعدة — أعجل قرار.** هل نُعيد ترتيب الـ ٢٧ فرعاً على `f1a4365`، أم ندمجها في اتحاد جديد؟ *كل ساعة تأخير تزيد التعارضات.*

**٢. النسخة النظيفة المستقلة.** المالك يريد نسخة أصلية منفصلة كلياً عن كل الريبوهات السابقة. **قبل التنفيذ أحتاج قرارك في نقطة واحدة:** النسخة النظيفة تعني فقدان تاريخ الـ 191 commit — أم نبدأ من `f1a4365` كجذر جديد ونحتفظ بالعمل المُثبت؟ *رأيي: الثاني — لأن الأول يُلقي بتسع إصلاحات مُثبتة بالطفرة وتسعة إصلاحات P0.*

**٣. الهيدر.** المالك طلب توليد شاشة هيدر كاملة من **صورة مرفقة**. **الصورة لم تصل إليّ — لا أرى أي مرفق في المحادثة.** لا أستطيع التوليد من صورة لا أراها، ولن أخمّن. أرسلها وأنفّذ فوراً — والعقد أعلاه (٢١ فئة + ٧ أيقونات + مسار الاستيراد) هو ما يجب أن تحترمه أي شاشة جديدة.

**٤. مهامك لي.** ما الذي تريدني أن أقيسه أو أثبته؟ أنا المُدقق المستقل — أُثبت بالطفرة، لا أوافق مجاملةً.

---

# ⚠️ ثلاثة أشياء لا أستطيع فعلها — three things I cannot do

**١. لا أستطيع مراسلتك مباشرة.** `ListAgents` لا يُظهر أي جلسة أخرى. أنت في تبويب المالك؛ لا قناة بيننا. **هذا الملف هو القناة** — المالك ينقله إليك.

**٢. لا أرى الصورة المرفقة.** لا يوجد مرفق في المحادثة.

**٣. لا أستطيع سحب بيانات Replit.** خادم Replit يحتاج تفويضاً، وهذه جلسة غير تفاعلية — لا يمكن تشغيل OAuth هنا. *يُفوَّض من إعدادات connectors في claude.ai.*

---

# 🔒 القيود الثابتة — standing constraints

**لا دفع إلى `canonical/vnext-assembly` · لا حذف · لا إعادة هيكلة · لا تخمين · كل نتيجة بدليل مقيس · tags تبقى 0.**

**الاتحاد:** `origin/local/audit-union-20260823 @ f1a4365` — أخضر على كل بوابة.

---
*Every figure verified by command on 2026-08-24: tree hashes compared directly, merge-bases computed per branch, conflicts produced by `git merge-tree`, the Cars icon contract mutation-proven three ways. The Cars guard was extended and committed before this handoff was written, so the icons cannot be lost while it is being read.*
