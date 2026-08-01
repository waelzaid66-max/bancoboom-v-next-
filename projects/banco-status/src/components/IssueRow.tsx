import type { Issue } from "../types";

const SEVERITY_COLOR: Record<Issue["severity"], string> = {
  critical: "#e5192a",
  high:     "#f59e0b",
  medium:   "#3b82f6",
  low:      "#888888",
};

const SEVERITY_AR: Record<Issue["severity"], string> = {
  critical: "حرج",
  high:     "عالٍ",
  medium:   "متوسط",
  low:      "منخفض",
};

const STATUS_AR: Record<Issue["status"], string> = {
  open:          "مفتوح",
  investigating: "قيد التحقيق",
  resolved:      "تم الحل",
};

const STATUS_COLOR: Record<Issue["status"], string> = {
  open:          "#e5192a",
  investigating: "#f59e0b",
  resolved:      "#22c55e",
};

export function IssueRow({ issue }: { issue: Issue }) {
  const color = SEVERITY_COLOR[issue.severity];
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRight: `3px solid ${color}`,
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
          {issue.titleAr}
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 4 }}>
          {issue.titleEn}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11,
              background: `${color}20`,
              color,
              borderRadius: 4,
              padding: "2px 7px",
              fontWeight: 600,
            }}
          >
            {SEVERITY_AR[issue.severity]}
          </span>
          <span
            style={{
              fontSize: 11,
              background: `${STATUS_COLOR[issue.status]}20`,
              color: STATUS_COLOR[issue.status],
              borderRadius: 4,
              padding: "2px 7px",
              fontWeight: 600,
            }}
          >
            {STATUS_AR[issue.status]}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-dim)", padding: "2px 0" }}>
            {issue.date}
          </span>
        </div>
      </div>
    </div>
  );
}
