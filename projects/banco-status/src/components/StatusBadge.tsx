import type { ServiceStatus } from "../types";

const MAP: Record<ServiceStatus, { labelAr: string; color: string; dot: string }> = {
  operational: { labelAr: "يعمل", color: "#22c55e", dot: "#22c55e" },
  degraded:    { labelAr: "أداء منخفض", color: "#f59e0b", dot: "#f59e0b" },
  outage:      { labelAr: "معطل", color: "#e5192a", dot: "#e5192a" },
  unknown:     { labelAr: "جاري الفحص", color: "#888888", dot: "#888888" },
};

export function StatusBadge({
  status,
  pulse = false,
}: {
  status: ServiceStatus;
  pulse?: boolean;
}) {
  const { labelAr, color, dot } = MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 13,
        fontWeight: 600,
        color,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          display: "inline-block",
          animation: pulse && status === "operational" ? "pulse 2s infinite" : undefined,
        }}
      />
      {labelAr}
    </span>
  );
}
