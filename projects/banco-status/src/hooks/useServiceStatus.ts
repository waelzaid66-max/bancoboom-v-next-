import { useState, useEffect, useCallback } from "react";
import type { Service, ServiceStatus } from "../types";
import { API_BASE_URL, REFRESH_INTERVAL_MS } from "../config";

const SERVICES_INITIAL: Service[] = [
  {
    id: "api",
    nameAr: "خادم API",
    nameEn: "API Server",
    url: `${API_BASE_URL}/api/v1`,
    status: "unknown",
  },
  {
    id: "mobile",
    nameAr: "تطبيق الموبايل (ويب)",
    nameEn: "Mobile App (Web)",
    url: `${API_BASE_URL}/banco-mobile`,
    status: "unknown",
  },
  {
    id: "web",
    nameAr: "الموقع الرسمي",
    nameEn: "Website",
    url: API_BASE_URL,
    status: "unknown",
  },
  {
    id: "admin",
    nameAr: "لوحة الإدارة",
    nameEn: "Admin OS",
    url: `${API_BASE_URL}/admin-os`,
    status: "unknown",
  },
  {
    id: "dealer",
    nameAr: "BANCO Market",
    nameEn: "BANCO Market",
    url: `${API_BASE_URL}/dealer-os`,
    status: "unknown",
  },
  {
    id: "db",
    nameAr: "قاعدة البيانات",
    nameEn: "Database",
    url: `${API_BASE_URL}/api/v1/search/facets`,
    status: "unknown",
  },
];

async function checkService(service: Service): Promise<Service> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(service.url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    let status: ServiceStatus = "operational";
    if (!res.ok) status = res.status >= 500 ? "outage" : "degraded";

    // DB service: check if facets return categories
    if (service.id === "db" && res.ok) {
      try {
        const json = await res.json();
        const cats = json?.data?.categories ?? [];
        if (cats.length === 0) status = "degraded";
      } catch {
        /* ignore */
      }
    }

    return {
      ...service,
      status,
      latencyMs,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return {
      ...service,
      status: "outage",
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

export function useServiceStatus() {
  const [services, setServices] = useState<Service[]>(SERVICES_INITIAL);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(SERVICES_INITIAL.map(checkService));
    setServices(results);
    setLastRefresh(new Date().toLocaleTimeString("ar-EG"));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const overall: ServiceStatus = services.some((s) => s.status === "outage")
    ? "outage"
    : services.some((s) => s.status === "degraded")
    ? "degraded"
    : services.some((s) => s.status === "unknown")
    ? "unknown"
    : "operational";

  return { services, loading, lastRefresh, refresh, overall };
}
