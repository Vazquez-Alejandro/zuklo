export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function isValidDNI(dni: string): boolean {
  return /^\d{7,8}$/.test(dni);
}

export function isValidCUIL(cuil: string): boolean {
  return /^\d{2}-\d{8}-\d$/.test(cuil);
}

export function sanitizeSQL(input: string): string {
  return input.replace(/'/g, "''");
}
