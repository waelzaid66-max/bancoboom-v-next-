export type ServiceStatus = "operational" | "degraded" | "outage" | "unknown";

export interface Service {
  id: string;
  nameAr: string;
  nameEn: string;
  url: string;
  status: ServiceStatus;
  latencyMs?: number;
  lastChecked?: string;
  note?: string;
}

export interface Issue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  titleAr: string;
  titleEn: string;
  status: "open" | "investigating" | "resolved";
  date: string;
  affectedServices: string[];
}

export interface StatusConfig {
  apiBaseUrl: string;
  refreshIntervalMs: number;
}
