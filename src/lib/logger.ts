type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

export function log(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  };
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    JSON.stringify(entry)
  );
}

export function info(message: string, meta?: LogMeta) {
  log("info", message, meta);
}

export function warn(message: string, meta?: LogMeta) {
  log("warn", message, meta);
}

export function error(message: string, meta?: LogMeta) {
  log("error", message, meta);
}

export function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  userId?: string
) {
  const level: LogLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  log(level, `${method} ${path} ${status}`, {
    method,
    path,
    status,
    durationMs,
    userId,
  });
}
