import { warn, info } from "./logger";

interface CachedEntry {
  value: number;
  period: string;
  source: string;
  fetchedAt: number;
}

const cache = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

function getCached(key: string): CachedEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key: string, entry: Omit<CachedEntry, "fetchedAt">) {
  cache.set(key, { ...entry, fetchedAt: Date.now() });
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const IPC_FALLBACK = { value: 460.0, period: "2026-05", source: "INDEC (fallback hardcodeado)" };
const ICL_FALLBACK = { value: 377.4, period: "2026-05", source: "BCRA (fallback hardcodeado)" };

async function fetchIPCFromINDEC(): Promise<{ value: number; period: string; source: string } | null> {
  try {
    const period = getCurrentPeriod();
    const url = `https://api.indec.gob.au/v1/series/IPC_20_variaciones%20mensuales`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      warn("INDEC API returned non-OK status", { status: res.status });
      return null;
    }
    const data = await res.json();
    const observations = data?.data?.observations || data?.observations || [];
    if (!observations.length) {
      warn("INDEC API returned no observations");
      return null;
    }
    const latest = observations[observations.length - 1];
    const value = parseFloat(latest.valor || latest.value || latest.V1 || "0");
    const periodFromData = latest.periodo || latest.period || period;
    if (!value || isNaN(value)) {
      warn("INDEC API returned invalid value", { raw: latest });
      return null;
    }
    return { value, period: String(periodFromData), source: "INDEC" };
  } catch (e) {
    warn("Failed to fetch IPC from INDEC", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

async function fetchIPCFromDolarHoy(): Promise<{ value: number; period: string; source: string } | null> {
  try {
    const res = await fetchWithTimeout("https://api.dolarhoy.com/v1/indicios");
    if (!res.ok) return null;
    const data = await res.json();
    const ipcItem = data?.ipc || data?.inflacion;
    if (!ipcItem?.valor) return null;
    const value = parseFloat(String(ipcItem.valor).replace(",", "."));
    if (isNaN(value)) return null;
    return { value, period: getCurrentPeriod(), source: "DolarHoy" };
  } catch {
    return null;
  }
}

async function fetchICLFromBNA(): Promise<{ value: number; period: string; source: string } | null> {
  try {
    const res = await fetchWithTimeout("https://www.bna.com.ar/Personas/Indice-Contratos-de-Locacion");
    if (!res.ok) {
      warn("BNA ICL page returned non-OK status", { status: res.status });
      return null;
    }
    const html = await res.text();
    const match = html.match(/ICL[^<]*<[^>]*>(\d+[.,]\d+)/i);
    if (!match) {
      warn("Could not parse ICL value from BNA page");
      return null;
    }
    const value = parseFloat(match[1].replace(",", "."));
    if (isNaN(value)) return null;
    return { value, period: getCurrentPeriod(), source: "BNA" };
  } catch (e) {
    warn("Failed to fetch ICL from BNA", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function fetchIPC(): Promise<{ value: number; period: string; source: string }> {
  const cacheKey = "ipc";
  const cached = getCached(cacheKey);
  if (cached) {
    info("Using cached IPC data", { period: cached.period, source: cached.source });
    return cached;
  }

  let result = await fetchIPCFromINDEC();
  if (!result) result = await fetchIPCFromDolarHoy();

  if (result) {
    setCache(cacheKey, result);
    info("Fetched fresh IPC data", { value: result.value, period: result.period, source: result.source });
    return result;
  }

  warn("All IPC fetch sources failed, using hardcoded fallback");
  setCache(cacheKey, IPC_FALLBACK);
  return IPC_FALLBACK;
}

export async function fetchICL(): Promise<{ value: number; period: string; source: string }> {
  const cacheKey = "icl";
  const cached = getCached(cacheKey);
  if (cached) {
    info("Using cached ICL data", { period: cached.period, source: cached.source });
    return cached;
  }

  let result = await fetchICLFromBNA();
  if (!result) {
    try {
      const ipcData = await fetchIPC();
      const proxyValue = Math.round(ipcData.value * 0.82 * 100) / 100;
      result = { value: proxyValue, period: ipcData.period, source: `IPC proxy (${ipcData.source})` };
    } catch {
      warn("All ICL fetch sources failed, using hardcoded fallback");
      setCache(cacheKey, ICL_FALLBACK);
      return ICL_FALLBACK;
    }
  }

  setCache(cacheKey, result);
  info("Fetched fresh ICL data", { value: result.value, period: result.period, source: result.source });
  return result;
}

export async function fetchIndexData(
  type: "ipc" | "icl"
): Promise<{ value: number; period: string; source: string }> {
  return type === "icl" ? fetchICL() : fetchIPC();
}
