import { useState } from "react";
import { BancoLogo } from "./components/BancoLogo";
import { ServiceCard } from "./components/ServiceCard";
import { IssueRow } from "./components/IssueRow";
import { StatusBadge } from "./components/StatusBadge";
import { useServiceStatus } from "./hooks/useServiceStatus";
import { KNOWN_ISSUES } from "./config";

const STATUS_MSG: Record<string, { ar: string; sub: string }> = {
  operational: { ar: "جميع الأنظمة تعمل بشكل طبيعي", sub: "All systems operational" },
  degraded:    { ar: "بعض الأنظمة تعمل بأداء منخفض", sub: "Partial degradation detected" },
  outage:      { ar: "عطل مؤثر في الأنظمة", sub: "Major outage detected" },
  unknown:     { ar: "جاري فحص الأنظمة…", sub: "Checking systems…" },
};

const OVERALL_COLOR: Record<string, string> = {
  operational: "#22c55e",
  degraded:    "#f59e0b",
  outage:      "#e5192a",
  unknown:     "#888888",
};

export default function App() {
  const { services, loading, lastRefresh, refresh, overall } = useServiceStatus();
  const [tab, setTab] = useState<"status" | "issues">("status");

  const openIssues = KNOWN_ISSUES.filter((i) => i.status !== "resolved");
  const color = OVERALL_COLOR[overall];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BancoLogo size={40} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>BANCO Status</div>
            <div style={{ color: "var(--text-dim)", fontSize: 12 }}>
              لوحة حالة الأنظمة
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontFamily: "var(--font-ar)",
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "جاري الفحص…" : "تحديث ↺"}
        </button>
      </header>

      {/* ── Overall banner ─────────────────────────────────── */}
      <div
        style={{
          background: `${color}12`,
          border: `1px solid ${color}44`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{STATUS_MSG[overall].ar}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 2 }}>
            {STATUS_MSG[overall].sub}
          </div>
          {lastRefresh && (
            <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>
              آخر تحديث: {lastRefresh}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(["status", "issues"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 7,
              border: "none",
              background: tab === t ? "var(--surface2)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--text-dim)",
              fontWeight: tab === t ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "var(--font-ar)",
              transition: "all 0.15s",
            }}
          >
            {t === "status"
              ? `حالة الخدمات (${services.length})`
              : `المشكلات المفتوحة (${openIssues.length})`}
          </button>
        ))}
      </div>

      {/* ── Services ───────────────────────────────────────── */}
      {tab === "status" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {services.map((svc) => (
            <ServiceCard key={svc.id} service={svc} />
          ))}

          {/* Summary row */}
          <div
            style={{
              marginTop: 8,
              padding: "12px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "var(--text-dim)",
            }}
          >
            <span>
              {services.filter((s) => s.status === "operational").length} /{" "}
              {services.length} خدمات تعمل
            </span>
            <StatusBadge status={overall} />
          </div>
        </div>
      )}

      {/* ── Issues ─────────────────────────────────────────── */}
      {tab === "issues" && (
        <div>
          {openIssues.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "var(--text-dim)",
              }}
            >
              ✅ لا توجد مشكلات مفتوحة
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {openIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          )}

          {KNOWN_ISSUES.filter((i) => i.status === "resolved").length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                تم الحل
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {KNOWN_ISSUES.filter((i) => i.status === "resolved").map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: 48,
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: 12,
          lineHeight: 1.8,
        }}
      >
        <div>BANCO Status Dashboard</div>
        <div>
          يتحدث تلقائياً كل دقيقة · Auto-refreshes every 60s
        </div>
        <div style={{ marginTop: 8 }}>
          <a
            href="https://github.com/waelzaid66-max/bancoboomstor"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text-dim)", textDecoration: "underline" }}
          >
            waelzaid66-max/bancoboomstor
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
