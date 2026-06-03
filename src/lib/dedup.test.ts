import { describe, it, expect } from "vitest";
import { deduplicateProperties, generatePropertyHash } from "./dedup";
import type { NormalizedProperty } from "@/types/property";

function makeProperty(overrides: Partial<NormalizedProperty> = {}): NormalizedProperty {
  return {
    id: overrides.id ?? "1",
    portal: overrides.portal ?? "mercadolibre",
    portalId: overrides.portalId ?? "ML-123",
    url: overrides.url ?? "https://www.mercadolibre.com.ar/propiedad/123",
    title: overrides.title ?? "Departamento 2 ambientes",
    description: overrides.description ?? "Hermoso departamento",
    price: overrides.price ?? 150000,
    currency: overrides.currency ?? "USD",
    location: overrides.location ?? {
      address: "Av. Corrientes 1234",
      city: "Buenos Aires",
      state: "CABA",
      country: "Argentina",
      zip: "1043",
    },
    features: overrides.features ?? {
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      areaUnit: "m2",
    },
    images: overrides.images ?? ["https://img.com/1.jpg"],
    publishedAt: overrides.publishedAt ?? "2024-06-01",
    scrapedAt: overrides.scrapedAt ?? "2024-06-01T12:00:00Z",
  };
}

describe("deduplicateProperties", () => {
  it("returns all properties when no duplicates exist", () => {
    const props = [
      makeProperty({ id: "1", portalId: "A" }),
      makeProperty({ id: "2", portalId: "B" }),
      makeProperty({ id: "3", portalId: "C" }),
    ];
    const result = deduplicateProperties(props);
    expect(result).toHaveLength(3);
  });

  it("filters out properties that exist in the existing list", () => {
    const existing = [makeProperty({ id: "existing", portalId: "A" })];
    const props = [
      makeProperty({ id: "1", portalId: "A" }),
      makeProperty({ id: "2", portalId: "B" }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters out all properties that match existing by normalizeForDedup key", () => {
    const existing = [makeProperty({ id: "existing", portalId: "A" })];
    const props = [
      makeProperty({ id: "1", portalId: "A" }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(0);
  });

  it("deduplicates against existing properties", () => {
    const existing = [makeProperty({ id: "existing", portalId: "A" })];
    const props = [
      makeProperty({ id: "new", portalId: "A" }),
      makeProperty({ id: "real-new", portalId: "C" }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("real-new");
  });

  it("returns empty array when all properties exist", () => {
    const existing = [makeProperty({ id: "1", portalId: "A" })];
    const props = [makeProperty({ id: "2", portalId: "A" })];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateProperties([])).toHaveLength(0);
  });

  it("filters properties matching existing by full dedup key", () => {
    const existing = [makeProperty({ id: "existing", portalId: "A" })];
    const props = [
      makeProperty({ id: "1", portalId: "A", url: "https://different-url.com/x" }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(0);
  });

  it("does not filter properties with different prices from existing", () => {
    const existing = [makeProperty({ id: "existing", price: 100000 })];
    const props = [
      makeProperty({ id: "1", price: 100000 }),
      makeProperty({ id: "2", price: 200000 }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("preserves input order when filtering against existing", () => {
    const existing = [makeProperty({ id: "existing", portalId: "Z" })];
    const props = [
      makeProperty({ id: "first", portalId: "X" }),
      makeProperty({ id: "second", portalId: "Y" }),
      makeProperty({ id: "existing-dup", portalId: "Z" }),
    ];
    const result = deduplicateProperties(props, existing);
    expect(result.map((p) => p.id)).toEqual(["first", "second"]);
  });
});

describe("generatePropertyHash", () => {
  it("generates consistent hash for same property", () => {
    const prop = makeProperty();
    expect(generatePropertyHash(prop)).toBe(generatePropertyHash(prop));
  });

  it("generates different hashes for different properties", () => {
    const a = makeProperty({ portalId: "A" });
    const b = makeProperty({ portalId: "B" });
    expect(generatePropertyHash(a)).not.toBe(generatePropertyHash(b));
  });

  it("generates different hashes for different prices", () => {
    const a = makeProperty({ price: 100 });
    const b = makeProperty({ price: 200 });
    expect(generatePropertyHash(a)).not.toBe(generatePropertyHash(b));
  });

  it("returns a base-36 string", () => {
    const hash = generatePropertyHash(makeProperty());
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });
});
