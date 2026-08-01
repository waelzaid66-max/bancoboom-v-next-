# BANCO — Standalone Projects

هذا المجلد يحتوي مشاريع Replit مستقلة ومعزولة تماماً عن المونوريبو الرئيسي.

## المشاريع

### `banco-status/` — لوحة حالة الأنظمة

مشروع React + Vite مستقل يعرض:
- حالة جميع خدمات BANCO في الوقت الفعلي (API, Mobile, Web, Admin, Dealer, DB)
- المشكلات المفتوحة من تقارير الاستخبارات
- تحديث تلقائي كل 60 ثانية

**كيف تفتحه كمشروع Replit جديد:**

1. اذهب إلى [replit.com](https://replit.com) → **+ Create Repl**
2. اختر **Import from GitHub**
3. الريبو: `waelzaid66-max/banco-with-wael`
4. بعد الـ import، في Terminal:
   ```bash
   cd projects/banco-status
   npm install
   npm run dev
   ```
5. في Replit Secrets أضف:
   ```
   VITE_API_BASE_URL = https://banco.autos
   ```

---

*كل مشروع في هذا المجلد = مشروع Replit مستقل قابل للـ fork بشكل منفصل.*
