import type { Service } from "../types";
import { StatusBadge } from "./StatusBadge";

const ICONS: Record<string, string> = {
  api:    "⚙️",
  mobile: "📱",
  web:    "🌐",
  admin:  "🛡️",
  dealer: "🏪",
  db:     "🗄️",
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{ICONS[service.id] ?? "🔌"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{service.nameAr}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>
            {service.nameEn}
          </div>
          {service.latencyMs !== undefined && (
            <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>
              {service.latencyMs}ms
            </div>
          )}
        </div>
      </div>
      <StatusBadge status={service.status} pulse />
    </div>
  );
}
