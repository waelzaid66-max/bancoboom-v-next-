# تقرير التدقيق الكامل لبنية BANCO

**التاريخ:** 30 يوليو 2026  
**نوع التدقيق:** قراءة وتحليل فقط  
**النطاق:** المونوريبو كاملًا، التطبيقات، المكتبات، التشغيل، السجلات، الأمن، الاعتماديات، قاعدة البيانات، المصادقة، CI/CD، الاختبارات، والنشر  
**حالة المستودع وقت الفحص:** `git status` نظيف  

## 1. حدود الفحص

لم يتم خلال هذا التدقيق:

- تعديل أي ملف تطبيق أو إعداد تشغيل.
- تثبيت أو تحديث أي حزمة.
- تشغيل build أو test أو migration أو seed.
- إعادة تشغيل أي workflow.
- تعديل Secrets أو Environment Variables أو قاعدة البيانات.
- تنفيذ تدفقات مستخدم تفاعلية مثل التسجيل والدخول والدفع والرفع.

تمت قراءة الملفات والسجلات الحالية، وتشغيل ماسحات تحليلية غير تعديلية. الملف الوحيد الناتج هو هذا التقرير.

---

## 2. الحكم التنفيذي

المشروع **ليس بناءً فارغًا أو تجريبيًا**؛ هو نظام كبير ومنظم نسبيًا، يحتوي API واسعًا، تطبيق Expo، واجهات إدارة وسوق، موقعين Next.js، عقود مشتركة، قاعدة PostgreSQL، واختبارات قوية نسبيًا في الـAPI والموبايل.

لكن المشروع **غير جاهز حاليًا لوصفه كمنظومة موحدة ومستقرة بالكامل** للأسباب الآتية:

1. المصادقة في بيئة Replit الحالية غير سليمة: أحدث سجل يؤكد أن Clerk Secret Key غير صالح للمفتاح العام المستخدم.
2. يوجد انقسام فعلي بين موقع قديم مجمّد `banco-web` وموقع رسمي جديد `banco-website`، بينما Preview وCI/Docker ما زالت تستخدم القديم في بعض المسارات.
3. توجد قيم حساسة داخل `.replit` كنص صريح بدل بقائها كلها في Secret Store.
4. توجد 10 سجلات ثغرات اعتماديات عالية، تمثل إصدارات متأثرة من `next` و`js-yaml` و`brace-expansion`، ولا توجد ثغرات Critical حسب الفحص.
5. الاختبارات قوية في API والموبايل، لكنها ضعيفة أو غائبة على مستوى Admin وMarket والموقع والـLanding والتدفقات الشاملة.
6. بيئات التشغيل غير موحدة: Replit يعلن Node 20 بينما CI وDocker يعتمدان Node 24.
7. توجد مخاطر أمنية مشروطة في اشتقاق روابط الرفع من Proxy Headers، وفي تسجيل/إظهار ردود مزود الدفع.

**التقدير العام:**

- البنية الأساسية: **جيدة لكن متشعبة**.
- التشغيل المحلي الحالي: **جزئي؛ الخدمات تعمل لكن المصادقة مكسورة**.
- جودة API والموبايل: **أعلى من بقية الواجهات**.
- جاهزية النشر الموحد: **تحتاج صيانة حقيقية قبل الاعتماد**.
- وجود فقد بيانات أو انهيار قاعدة بيانات: **لا يوجد دليل عليه**.
- وجود ثغرة Critical مؤكدة: **لا يوجد حسب الفحوص المنفذة**.

---

## 3. النتائج حسب الأولوية

### P0 — عطل حالي مؤكد: مفاتيح Clerk غير متطابقة

**التصنيف:** عطل تشغيل حالي  
**الخطورة:** عالية  
**الثقة:** مؤكدة  

**الدليل:**

- أحدث سجل Web App:
  `/tmp/logs/Web_App_20260730_185410_960_2b3605ab.log`
- الرسالة: `Handshake token verification failed` و`secret-key-invalid`.
- نفس السجل يثبت أن الصفحة الأساسية تُرجع `GET / 200`.
- سجل API:
  `/tmp/logs/artifactsapi-server_API_Server_20260730_185410_960_f2daeabe.log`
  يحتوي على عدد كبير من طلبات `401 UNAUTHORIZED` إلى مسارات الحساب والقوائم والإدارة.

**الأثر الحقيقي:**

- السيرفر والواجهة يعملان، لكن Clerk لا يستطيع إكمال المصافحة.
- الدخول والجلسات والطلبات المحمية لا يمكن اعتبارها عاملة.
- الصفحات العامة قد تعمل، بينما صفحات المستخدم والإدارة تُظهر بيانات ناقصة أو 401.

**الصيانة المطلوبة:**

- وضع `sk_test_...` التابع لنفس Clerk Development instance الذي أصدر `pk_test_...`.
- التأكد من عدم وجود قيمة نصية في `.replit` تتغلب على Secret Store.
- إعادة اختبار sign-in، session restore، API bearer/cookie auth، وAdmin بعد التصحيح.

**الجهد المتوقع:** XS  
**المخاطرة عند التنفيذ:** منخفضة إذا اقتصر التغيير على Secrets الصحيحة.

---

### P0 — انكشاف قيمة تشفير وإعدادات حساسة داخل `.replit`

**التصنيف:** عيب إدارة أسرار  
**الخطورة:** عالية  
**الثقة:** مؤكدة  

**الدليل:**

- `.replit:129-135` يحتوي قيم Development نصية، منها `PAYMENT_CONFIG_ENCRYPTION_KEY` وقيم Clerk.
- `.replit:111-140` يحتوي إعدادات Shared/Development/Production داخل ملف المشروع.

**التوضيح:**

- Publishable Clerk keys عامة بطبيعتها وليست أسرارًا.
- قيمة Clerk الموجودة في سطر Development تبدو placeholder وليست مفتاحًا حقيقيًا.
- **لكن مفتاح تشفير إعدادات الدفع يجب معاملته كسر حقيقي**؛ وجوده نصيًا داخل ملف المشروع يزيل فائدة Secret Store.

**الأثر الحقيقي:**

- أي شخص يصل إلى المشروع أو نسخة منه قد يصل إلى قيمة التشفير.
- إذا استُخدمت القيمة لتشفير بيانات إعدادات دفع حقيقية، يجب اعتبارها مكشوفة وتدويرها بطريقة تحافظ على إمكانية فك البيانات الحالية.

**الصيانة المطلوبة:**

- نقل القيم الحساسة إلى Replit Secrets فقط.
- إزالة القيم الحساسة من `.replit`.
- تدوير مفتاح التشفير وفق خطة migration، وليس باستبدال مباشر قد يجعل البيانات المشفرة غير قابلة للقراءة.
- فحص Git history للتأكد هل القيمة ظهرت في commits سابقة.

**الجهد المتوقع:** S إلى M  
**المخاطرة:** متوسطة/عالية عند تدوير مفتاح التشفير دون migration.

---

### P0 — مسار الموقع الرسمي غير متوافق مع Preview وDeploy

**التصنيف:** خطر معماري ونشري مؤكد  
**الخطورة:** عالية  
**الثقة:** مؤكدة  

**الدليل:**

- `.replit:32-35` يشغّل `@workspace/banco-web` على port 5000.
- `artifacts/banco-web/FROZEN.md:1-19` يعلن أن هذا المشروع مجمّد ولا يجب اعتباره الموقع المنتج.
- `artifacts/banco-website/README.md:8-19` يحدد `banco-website` كموقع BANCO الرسمي.
- `artifacts/banco-website/README.md:35-38` يقر بأن مسارات Docker/compose قد تظل تشير إلى `banco-web` حتى cutover.
- `deploy/aws/Dockerfile.banco-web` يبني المشروع القديم.
- `.github/workflows/ci-website.yml` ما زال يحتوي تشغيلًا للمشروع القديم.

**الأثر الحقيقي:**

- ما يراه المستخدم في Replit Preview ليس بالضرورة الموقع الرسمي الجاري تطويره.
- إصلاحات أو ميزات قد تدخل `banco-website` ولا تظهر في Preview أو نشر معين.
- يمكن نشر النسخة الخطأ رغم نجاح البناء.

**الصيانة المطلوبة:**

1. اعتماد قرار مكتوب: هل `banco-website` أصبح canonical في كل البيئات؟
2. توحيد Replit workflow وCI وDocker وcompose وdeployment scripts على نفس الحزمة.
3. تنفيذ smoke tests قبل cutover.
4. إبقاء `banco-web` للرجوع المؤقت فقط، ثم أرشفته بعد نجاح الانتقال.

**الجهد المتوقع:** M إلى L  
**المخاطرة:** عالية إذا نُفذ الانتقال دفعة واحدة دون smoke/cutback plan.

---

### P1 — ثغرات اعتماديات عالية

**التصنيف:** صيانة أمن اعتماديات  
**الخطورة:** عالية  
**الثقة:** مؤكدة من Dependency Scanner  

**نتيجة الفحص:**

- Critical: **0**
- High records: **10**
- Moderate/Low حسب ملخص الماسح: **0**

**الحزم المتأثرة:**

- `next@15.5.20`
  - ثلاث CVEs عالية.
  - الإصلاح المتاح: `15.5.21`.
- `js-yaml@4.2.0`
  - CVE عالية.
  - الإصلاح المتاح: `4.3.0`.
- `brace-expansion`
  - عدة نسخ انتقالية متأثرة: `1.1.15` و`2.1.1` و`5.0.6`.
  - الإصلاح يختلف باختلاف النسخة/سلسلة الاعتماد.

**ملاحظة الدقة:**

العدد 10 هو عدد سجلات Package/CVE، وليس عشر حزم مستقلة. يجب استخدام `pnpm why` وlockfile لتحديد الآباء المباشرين قبل أي تحديث.

**الصيانة المطلوبة:**

- تحديث Next patch أولًا.
- تحديث direct parent الذي يجلب `js-yaml` و`brace-expansion` بدل فرض override أعمى.
- إعادة Dependency Audit ثم typecheck/build/tests.

**الجهد المتوقع:** S إلى M  
**المخاطرة:** منخفضة لـNext patch، ومتوسطة للاعتماديات الانتقالية.

---

### P1 — اختلاف Node بين Replit وCI/Docker

**التصنيف:** خطر بناء وتشغيل  
**الخطورة:** عالية  
**الثقة:** مؤكدة  

**الدليل:**

- `.replit:1` يطلب `nodejs-20`.
- `package.json:5` يثبت `pnpm@11.9.0`.
- `Dockerfile:18-24` يعلن أن Node 24 مطلوب ويستخدم `node:24`.
- `.github/workflows/ci.yml:29-32` و`75-78` و`102-105` تستخدم Node 24.

**الأثر الحقيقي:**

- نجاح CI/Docker لا يضمن نفس السلوك على Replit.
- خصائص pnpm 11 أو Node APIs قد تعمل في بيئة وتفشل في أخرى.
- أعطال التثبيت والبناء قد تظهر كأعطال تطبيق رغم أن أصلها toolchain.

**الصيانة المطلوبة:**

- توحيد Node 24 في Replit/CI/Docker، أو إثبات ودعم Node 20 رسميًا.
- إضافة فحص مبكر واضح لإصدارات Node وpnpm.

**الجهد المتوقع:** S  
**المخاطرة:** متوسطة لأن تغيير runtime يحتاج install/build verification.

---

### P1 — روابط رفع الملفات مشتقة من Proxy Headers

**التصنيف:** خطر أمني مشروط  
**الخطورة:** متوسطة إلى عالية حسب إعداد الـproxy  
**الثقة:** مؤكدة في الكود، والاستغلال غير مثبت  

**الدليل:**

- `artifacts/api-server/src/controllers/uploadController.ts:114-120`
- الرابط العام يُبنى من `x-forwarded-proto` و`x-forwarded-host` أو `Host`.

**الأثر المحتمل:**

- إذا سمحت البنية التحتية للعميل بتمرير Forwarded Headers دون تنظيف، يمكن أن يُعاد للمستخدم رابط وسائط على host غير موثوق.
- لا يوجد دليل من التدقيق وحده أن Replit/AWS الحاليين يسمحان بهذا التلاعب، لذلك لا تُصنف كثغرة مستغلة مؤكدة.

**الصيانة المطلوبة:**

- استخدام canonical public base URL موثوق من الإعدادات.
- أو التحقق من host مقابل allowlist.
- تثبيت Express trust-proxy policy بوضوح واختبار forged headers.

**الجهد المتوقع:** S

---

### P1 — مزود الدفع يسجل أو يعيد جزءًا من رد البوابة

**التصنيف:** خطر كشف معلومات  
**الخطورة:** متوسطة  
**الثقة:** مؤكدة في الكود؛ حساسية المحتوى تعتمد على رد Paymob  

**الدليل:**

- `artifacts/api-server/src/lib/paymentProvider.ts:211-214` يسجل أول 500 حرف من رد رفض Paymob.
- `artifacts/api-server/src/lib/paymentProvider.ts:479-486` يعيد أول 200 حرف في نتيجة اختبار البوابة.

**الأثر المحتمل:**

- ردود مزود الدفع قد تحتوي تفاصيل تشخيصية أو معرفات لا يلزم حفظها في logs أو إظهارها للمسؤول.
- لا يوجد دليل في السجلات المقروءة على تسريب token فعلي.

**الصيانة المطلوبة:**

- تسجيل status وrequest correlation ID فقط.
- تنقية response body وفق allowlist.
- إرجاع رسالة عامة إلى واجهة الإدارة، مع تفاصيل منقحة في logs.

**الجهد المتوقع:** XS

---

### P1 — callback URL للدفع يقبل أي HTTPS base URL

**التصنيف:** خطر إعداد خارجي  
**الخطورة:** متوسطة  
**الثقة:** مؤكدة في الكود؛ لا يوجد دليل على misconfiguration حالي  

**الدليل:**

- `artifacts/api-server/src/lib/paymentProvider.ts:91-97` يقرأ `PUBLIC_API_BASE_URL`.
- `artifacts/api-server/src/lib/paymentProvider.ts:123-128` يتحقق من HTTPS فقط.
- `artifacts/api-server/src/lib/paymentProvider.ts:184-187` يستخدم القيمة لإنشاء webhook وreturn URLs.

**الأثر المحتمل:**

- خطأ إداري في المتغير قد يوجه callbacks إلى host غير مقصود.
- هذا ليس SSRF مباشرًا من مستخدم، لأن القيمة Environment Configuration وليست request input.

**الصيانة المطلوبة:**

- allowlist للنطاقات المملوكة لـBANCO.
- فحص startup يمنع تشغيل live payments على نطاق غير معتمد.

**الجهد المتوقع:** XS

---

### P1 — فجوة freshness في OpenAPI code generation

**التصنيف:** فجوة جودة وعقود  
**الخطورة:** متوسطة  
**الثقة:** مؤكدة  

**الدليل:**

- `lib/api-spec/package.json:5-6` يحتوي أمر codegen من OpenAPI إلى client/zod.
- `package.json:6-20` لا يحتوي root gate يعيد التوليد ويفحص clean diff.
- CI الرئيسي يبني ويفحص، لكنه لا يثبت أن generated files مطابقة دائمًا للمصدر.

**الأثر الحقيقي:**

- يمكن تعديل OpenAPI ونسيان إعادة توليد client أو schemas.
- قد ينجح جزء من البناء بينما تبقى العقود المستهلكة قديمة.

**الصيانة المطلوبة:**

- CI step يعيد codegen ثم يفشل إذا ظهر Git diff.
- توثيق `openapi.yaml` كمصدر الحقيقة.

**الجهد المتوقع:** S

---

### P1 — لا توجد اختبارات شاملة حقيقية بين التطبيقات

**التصنيف:** فجوة تحقق  
**الخطورة:** متوسطة/عالية حسب وتيرة الإصدارات  
**الثقة:** مؤكدة  

**الدليل العددي:**

- `artifacts/api-server`: نحو 78 ملف test/spec.
- `artifacts/banco-mobile`: نحو 79 ملف test/spec.
- `lib/search-contract`: 5 ملفات.
- لم يُعثر على test/spec في:
  - `admin-os`
  - `dealer-os`
  - `landing`
  - `banco-web`
  - `banco-website`
  - `mockup-sandbox`
- package scripts لهذه الواجهات تحتوي build/typecheck فقط.

**التوضيح:**

- للموبايل اختبارات guards كثيرة، لكن كثيرًا منها source/config assertions وليست device E2E.
- CI الرئيسي يشغل API tests على PostgreSQL حقيقي، وهذه نقطة قوة.
- لا يوجد دليل على Playwright/Cypress/Detox/Appium أو journey tests تربط Clerk + API + UI.

**الفجوات العملية:**

- sign-up/sign-in/session.
- البحث والفلترة وصفحة الإعلان.
- إنشاء إعلان ورفع الصور.
- الحفظ والتواصل والـleads.
- dealer/admin role flows.
- الدفع والـwebhook.
- RTL/accessibility/visual regression.

**الصيانة المطلوبة:**

- Smoke E2E صغير للأعمال الحرجة بدل محاولة تغطية كل شيء.
- ترتيب البداية: auth → browse → create/upload → dealer/admin → payment sandbox.

**الجهد المتوقع:** M إلى L

---

### P2 — CI موجود لكنه لا يغطي كل المنتجات بالتساوي

**التصنيف:** فجوة Release Gate  
**الخطورة:** متوسطة  
**الثقة:** مؤكدة  

**نقاط القوة:**

- `.github/workflows/ci.yml` يشغل typecheck لكل الحزم.
- يبني API وdealer/admin/landing.
- يشغل API tests على PostgreSQL 16 مع schema push وseed.
- توجد workflows إضافية للموقع وDocker والنشر والمزامنة.

**الفجوات:**

- البناء الرئيسي لا يبني mobile أو كلا موقعي Next ضمن نفس job.
- lint الرئيسي موجه أساسًا إلى maintenance scripts.
- لا يوجد root `test` موحد.
- لا توجد coverage thresholds.
- لا يوجد E2E موحد لكل surfaces.

**الصيانة المطلوبة:**

- تعريف release matrix واضح لكل artifact.
- فصل CI السريع عن release confidence suite.
- منع النشر إذا فشل artifact المقصود بالنشر، دون إلزام كل artifacts غير المرتبطة في كل commit.

---

### P2 — تشغيل الموبايل مربوط بمتغيرات Replit

**التصنيف:** قابلية تشغيل وصيانة  
**الخطورة:** متوسطة  
**الثقة:** مؤكدة في script؛ التشغيل الحالي ناجح  

**الدليل:**

- `artifacts/banco-mobile/package.json:7` يضم عدة متغيرات Replit وClerk في أمر واحد.
- أحدث Expo log يثبت نجاح Web/iOS bundling.

**الأثر:**

- script هش خارج Replit أو عند نقص متغير واحد.
- صعوبة تمييز local dev عن Replit dev وCI.

**الصيانة المطلوبة:**

- أوامر منفصلة: local، Replit، CI.
- preflight validation ورسائل واضحة.

**الجهد المتوقع:** S

---

### P2 — كثرة المنافذ والأسطح تزيد ضوضاء التشغيل

**التصنيف:** دين تقني تشغيلي  
**الخطورة:** منخفضة/متوسطة  
**الثقة:** مؤكدة  

**الدليل:**

- `.replit:46-100` يحتوي عددًا كبيرًا من mappings، وبعضها يخدم artifacts متعددة ومنافذ داخلية متغيرة.
- Preview الرئيسي فقط موصول رسميًا بـ`banco-web:5000`.

**الأثر:**

- صعوبة معرفة أي surface هو الرسمي.
- سهولة التقاط screenshot أو health probe من المنفذ الخطأ.

**الصيانة المطلوبة:**

- جدول port contract موحد.
- إزالة mappings التاريخية بعد cutover.
- تسمية كل workflow باسم المنتج الفعلي.

---

## 4. حالة التشغيل والسجلات الحالية

### Web App

- Workflow: Running.
- الصفحة `/` تُرجع 200.
- Clerk handshake يفشل بسبب Secret Key غير صالح.
- يوجد تحذير Next.js عن cross-origin dev request وغياب `allowedDevOrigins`.
- طلب `/banco-mobile` على Web App أعاد 404؛ هذا طبيعي إذا كان المسار ليس route في المشروع القديم، لكنه يثبت وجود خلط بين surfaces.

### API Server

- Workflow: Running.
- توجد طلبات عامة ناجحة 200 مثل facets وroot.
- توجد موجة 401 على المسارات المحمية، متسقة مع عطل Clerk الحالي.
- بعض 401 استغرقت تقريبًا 3–4 ثوانٍ؛ هذا مؤشر latency يستحق القياس بعد إصلاح auth، لكنه ليس bug مؤكدًا من logs وحدها.

### Expo Mobile

- Web وiOS bundling ناجحان.
- Clerk development keys تم تحميلها.
- تحذير أن development keys غير مناسبة للإنتاج: **طبيعي في الاختبار**.
- تحذير أن remote Android notifications غير مدعومة بالكامل في Expo Go SDK 53+: **قيد معروف، وليس عطلًا في الكود**.
- اختبار push الحقيقي يحتاج development build، وليس Expo Go.

### Admin / Dealer / Landing / Mockup

- Workflows مسجلة Running.
- لم تصل سجلات جديدة كافية لإثبات تدفقات وظيفية.
- Running لا يساوي أن auth والبيانات والوظائف تمت تجربتها.

---

## 5. قاعدة البيانات والبيانات

### ما تم إثباته

- PostgreSQL 16 جزء من إعداد Replit وCI.
- CI يدفع schema ويشغّل seed قبل API tests.
- API logs الحالية تُظهر استجابات بيانات عامة ناجحة.
- لا يوجد في الأدلة المقروءة crash من نوع missing relation/column.

### ما لم يتم إثباته

- لم يتم تشغيل SQL audit في هذا التدقيق.
- لم تُراجع جودة البيانات، التكرارات، orphan rows، أحجام الجداول، index usage، slow queries، أو backup/restore.
- لم يتم اختبار migrations على نسخة production.

### الصيانة المقترحة قبل الإنتاج

- Read-only DB health audit منفصل:
  - schema drift
  - missing/unused indexes
  - orphan/reference integrity
  - growth tables
  - slow queries
  - backup/restore evidence
- لا يُنفذ push/seed أو أي write أثناء ذلك التدقيق.

---

## 6. المصادقة والصلاحيات

### المؤكد

- Clerk مستخدم عبر web/mobile/API.
- العطل الحالي هو عدم تطابق Secret Key.
- 401 الحالية ليست دليلًا على ضعف authorization؛ هي دليل على فشل المصادقة الحالية.

### يحتاج تحقق بعد إصلاح المفتاح

- role upgrade من individual إلى dealer.
- admin bootstrap وقائمة ADMIN_EMAILS.
- owner/staff permissions.
- ban/shadow-ban behavior.
- cookie auth على web وBearer auth على mobile.
- session restore وsign-out/revocation.

لا يمكن وصف هذه التدفقات بأنها سليمة أو مكسورة دون اختبار تفاعلي بعد إصلاح Clerk.

---

## 7. الأمن: نتائج الماسحات بعد إزالة الضجيج

### Dependency Audit

- 0 Critical.
- 10 High records.
- تحتاج ترقيات وصيانة كما ورد في قسم P1.

### SAST

الماسح أعاد 3 نتائج خام:

1. Weak hash داخل `.agents/skills/...`: خارج كود المنتج.
2. نتيجتا path traversal داخل `banco-mobile/server/serve.js`.

بعد المراجعة اليدوية، نتيجتا path traversal **ليستا ثغرة مؤكدة**:

- `serveManifest` يبني المسار من platform داخلي.
- `resolveStaticFile` يطبع المسار، يمنع الخروج من root، ويتحقق من وجود الملف وأنه ليس directory.

**النتيجة النهائية:** 0 ثغرات SAST مؤكدة من النتائج الخام الحالية.

### HoundDog

- 0 vulnerabilities.

### معنى ذلك

لا يعني أن المشروع خالٍ تمامًا من الثغرات؛ يعني أن الفحوص الحالية لم تثبت Critical أو privacy dataflow findings، مع بقاء مخاطر الكود المشروطة المذكورة أعلاه.

---

## 8. الضجيج والنتائج المستبعدة

لم تُحسب العناصر التالية كأعطال:

- Expo Go notification warnings.
- Clerk development-key warning داخل بيئة الاختبار.
- 404 لمسار غير موجود على artifact غير المقصود.
- SAST path traversal في `serve.js` بعد مراجعة الحماية.
- weak hash داخل أدوات agent، لأنه خارج المنتج.
- Clerk placeholder داخل `.replit` بوصفه سرًا حقيقيًا؛ هو ليس سرًا صالحًا، لكن وجود config حساس في الملف نفسه ما زال مشكلة.
- مجرد وجود 401 على endpoint محمي؛ المشكلة هنا هي تكرارها بالتزامن مع Clerk secret-invalid.
- عدم وجود test script في مكتبة generated لا يعني تلقائيًا أن كودها خاطئ.
- وجود عدة artifacts ليس عيبًا وحده؛ العيب هو عدم وضوح canonical/deploy boundary.

---

## 9. نقاط القوة الحقيقية

- API لديه suite اختبارات كبيرة وCI بقاعدة PostgreSQL حقيقية.
- الموبايل لديه عدد كبير من guard tests للأيقونات، الجلسة، i18n، الروابط، المرونة، والإشعارات.
- توجد عقود مشتركة واضحة نسبيًا بين OpenAPI وZod وReact client.
- توجد حواجز أمنية مثل Helmet وrate limiting وCORS وschema validation في API dependencies والبنية.
- يوجد فصل نسبي بين API، الموبايل، الإدارة، السوق، والواجهات العامة.
- Git working tree نظيف وقت الفحص.
- API وExpo قادران على التشغيل والبناء اللحظي في البيئة الحالية.
- لا يوجد دليل حالي على corruption أو schema crash أو Critical vulnerability.

---

## 10. خطة الصيانة الحقيقية حسب الأثر والتكلفة

| الترتيب | الصيانة | الأثر | الجهد | شرط التنفيذ |
|---|---|---:|---:|---|
| 1 | تصحيح Clerk Secret لنفس Development instance | عالٍ جدًا | XS | Secrets فقط ثم E2E auth |
| 2 | إزالة/تدوير القيم الحساسة الموجودة في `.replit` | عالٍ جدًا | S–M | خطة تدوير لمفتاح التشفير |
| 3 | تحديث Next وjs-yaml وbrace-expansion بأمان | عالٍ | S–M | audit + tests بعد التحديث |
| 4 | تحديد canonical web وإكمال cutover | عالٍ | M–L | smoke + rollback plan |
| 5 | توحيد Node/pnpm | عالٍ | S | install/build validation |
| 6 | تقوية upload URL host وpayment callback domains | متوسط/عالٍ | S | allowlists واختبارات headers |
| 7 | تنقية Paymob errors/logs | متوسط | XS | لا تغيّر منطق التسوية |
| 8 | إضافة generated-code freshness gate | متوسط | S | CI clean-diff |
| 9 | إنشاء Smoke E2E للأعمال الحرجة | عالٍ | M–L | يبدأ بعد إصلاح Clerk |
| 10 | توسيع اختبارات web/admin/dealer | متوسط | M | حسب أولويات المنتج |
| 11 | تدقيق DB read-only منفصل | متوسط | S–M | اتصال آمن بلا writes |
| 12 | تبسيط workflows والمنافذ | منخفض/متوسط | S | بعد web cutover |

---

## 11. الأشياء التي لا تحتاج إعادة بناء

- لا حاجة لإعادة كتابة الـAPI من الصفر.
- لا حاجة لاستبدال PostgreSQL.
- لا حاجة لاستبدال Clerk بسبب العطل الحالي؛ الدليل يشير إلى config mismatch.
- لا حاجة لإعادة بناء Expo بسبب تحذيرات Expo Go.
- لا حاجة لإزالة كل artifacts؛ المطلوب توضيح الحدود وإتمام cutover.
- لا حاجة لتغيير object storage provider دون دليل فشل.
- لا حاجة لتجاوز ماسح الحزم أو فرض overrides عشوائية.
- لا حاجة لتحويل كل guards إلى E2E؛ المطلوب إضافة E2E صغير فوقها.

---

## 12. الفجوات التي تحتاج فحصًا منفصلًا قبل ادعاء Production Ready

1. اختبار كامل للدخول والجلسات بعد إصلاح Clerk.
2. اختبار إنشاء إعلان ورفع صور والتحقق منها.
3. اختبار dealer/admin permissions.
4. اختبار Paymob test mode وwebhook signature والتسوية.
5. اختبار إرسال البريد عبر provider فعلي.
6. اختبار الخرائط مع provider key فعلي.
7. فحص production deployment logs وURLs الحقيقية.
8. فحص قاعدة production read-only.
9. اختبار Android/iOS development builds، خصوصًا push notifications.
10. قياس latency وCore Web Vitals وAPI p95/p99.
11. Accessibility وRTL audit للواجهات.
12. Backup/restore drill.

هذه البنود ليست أعطالًا مؤكدة؛ هي شروط تحقق لم تُنفذ بسبب طلب عدم القيام بأي عمل تشغيلي.

---

## 13. الخلاصة النهائية

المشروع يحتوي أساسًا تقنيًا حقيقيًا وقابلًا للصيانة، ولا يحتاج إعادة بناء شاملة. الأولوية ليست إضافة ميزات، بل إزالة عدم الاتساق التشغيلي:

1. إصلاح Clerk configuration.
2. حماية وتدوير الأسرار النصية.
3. معالجة ثغرات الاعتماديات.
4. حسم انتقال الموقع القديم إلى الموقع الرسمي.
5. توحيد runtime وrelease gates.
6. إضافة اختبارات شاملة قليلة لكنها تغطي المسارات المالية والمصادقة والرفع.

أكبر مصدر للضجيج الحالي هو أن عدة خدمات تبدو Running، بينما المصادقة مكسورة؛ وأكبر مصدر للمخاطر المستقبلية هو وجود موقعين ومسارات نشر متعددة دون cutover مكتمل.

**لم تُجر أي صيانة أو تعديل على البناء ضمن هذا التدقيق.**