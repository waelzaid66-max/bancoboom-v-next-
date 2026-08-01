# BANCO Status Dashboard

> لوحة حالة أنظمة BANCO المعزولة — Isolated BANCO Systems Status Page

مشروع **Replit منفصل تماماً** يعرض حالة جميع خدمات BANCO في الوقت الفعلي.

---

## المحتوى

- **حالة الخدمات** — فحص حي لـ API, Mobile, Web, Admin, Dealer, Database
- **المشكلات المفتوحة** — سجل المشكلات من تقارير الاستخبارات
- **تحديث تلقائي** كل 60 ثانية
- **ثيم BANCO** — أسود وأحمر، عربي RTL، Cairo font

---

## كيف تشغّله كمشروع Replit منفصل

### 1. Fork أو Import من GitHub
```
https://github.com/waelzaid66-max/banco-with-wael/tree/main/projects/banco-status
```

أو اعمل import للمجلد `projects/banco-status/` كـ Replit project جديد.

### 2. أضف متغير البيئة
في Replit Secrets أو `.env`:
```
VITE_API_BASE_URL=https://banco.autos
```

### 3. شغّل
Replit سيشغّل `npm install && npm run dev` تلقائياً.

---

## إعداد API URL

عدّل `src/config.ts`:
```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://banco.autos";
```

| البيئة | القيمة |
|--------|--------|
| Production | `https://banco.autos` |
| Replit Dev | `https://{REPLIT_DEV_DOMAIN}` |
| Local | `http://localhost:8080` |

---

## تحديث المشكلات

عدّل `src/config.ts` → `KNOWN_ISSUES[]` لإضافة مشكلة جديدة أو تحديث حالة موجودة.

```ts
{
  id: "pio-007",
  severity: "high",
  titleAr: "وصف المشكلة بالعربي",
  titleEn: "Issue description in English",
  status: "open",          // open | investigating | resolved
  date: "2026-08-01",
  affectedServices: ["api"],
}
```

---

## هيكل المشروع

```
banco-status/
├── src/
│   ├── App.tsx              # الواجهة الرئيسية
│   ├── config.ts            # API URL + المشكلات
│   ├── types.ts             # TypeScript types
│   ├── hooks/
│   │   └── useServiceStatus.ts  # فحص الخدمات
│   └── components/
│       ├── BancoLogo.tsx
│       ├── ServiceCard.tsx
│       ├── StatusBadge.tsx
│       └── IssueRow.tsx
├── index.html
├── vite.config.ts
├── package.json
└── .replit                  # Replit config جاهز
```

---

## العلاقة بالمونوريبو

هذا المشروع **معزول تماماً** — لا يعتمد على أي `lib/*` أو `artifacts/*` من المونوريبو الرئيسي. يمكن فصله وتشغيله بشكل مستقل في أي وقت.

التقارير المرجعية:
- `reports/intelligence/2026-07-31-PRODUCTION-INTELLIGENCE-REPORT.md`
- `reports/replit-env/2026-07-31-ALL-ISSUES-MASTER-REPORT.md`

---

*Built by Replit Agent — Production Intelligence Officer*  
*Isolated project — zero dependencies on banco monorepo*
