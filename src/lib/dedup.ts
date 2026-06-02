import type { NormalizedProperty } from "@/types/property";

function normalizeForDedup(property: NormalizedProperty): string {
  const parts = [
    property.portal,
    property.portalId,
    property.title.toLowerCase().trim(),
    String(property.price),
    property.location.city.toLowerCase(),
  ];
  return parts.join("|");
}

function normalizeUrl(url: string): string {
  return url
    .replace(/https?:\/\/(www\.)?/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export function deduplicateProperties(
  properties: NormalizedProperty[],
  existing?: NormalizedProperty[]
): NormalizedProperty[] {
  const seen = new Map<string, NormalizedProperty>();
  const allProperties = existing
    ? [...existing, ...properties]
    : [...properties];

  for (const prop of allProperties) {
    const key = normalizeForDedup(prop);
    const urlKey = `url:${normalizeUrl(prop.url)}`;

    if (!seen.has(key) && !seen.has(urlKey)) {
      seen.set(key, prop);
      if (prop.url) {
        seen.set(urlKey, prop);
      }
    }
  }

  const existingIds = new Set(
    (existing || []).map((p) => normalizeForDedup(p))
  );

  return properties.filter((prop) => {
    const key = normalizeForDedup(prop);
    return !existingIds.has(key);
  });
}

export function generatePropertyHash(property: NormalizedProperty): string {
  const data = [
    property.portal,
    property.portalId,
    property.title,
    String(property.price),
    property.location.address,
    property.location.city,
  ].join(":");

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
