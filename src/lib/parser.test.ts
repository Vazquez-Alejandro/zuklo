import { describe, it, expect } from "vitest";
import { parseProperty } from "./parser";
import type { NormalizedProperty } from "@/types/property";

function makeNormalized(overrides: Partial<NormalizedProperty> = {}): NormalizedProperty {
  return {
    id: overrides.id ?? "prop-1",
    portal: overrides.portal ?? "mercadolibre",
    portalId: overrides.portalId ?? "ML-123",
    url: overrides.url ?? "https://example.com/prop/1",
    title: overrides.title ?? "Departamento 2 ambientes en Palermo",
    description: overrides.description ?? "Hermoso departamento con piscina y parrilla. Expensas 50000. Se permiten mascotas.",
    price: overrides.price ?? 150000,
    currency: overrides.currency ?? "USD",
    location: overrides.location ?? {
      address: "Av. Santa Fe 1234",
      city: "Buenos Aires",
      state: "CABA",
      country: "Argentina",
      zip: "1043",
      lat: -34.6037,
      lng: -58.3816,
    },
    features: overrides.features ?? {
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      areaUnit: "m2",
    },
    images: overrides.images ?? ["https://img.com/1.jpg", "https://img.com/2.jpg"],
    landlord: overrides.landlord ?? {
      name: "Juan Pérez",
      phone: "+5491155551234",
      email: "juan@example.com",
    },
    publishedAt: overrides.publishedAt ?? "2024-06-01",
    scrapedAt: overrides.scrapedAt ?? "2024-06-01T12:00:00Z",
  };
}

describe("parseProperty", () => {
  it("parses a basic property with all fields", () => {
    const result = parseProperty(makeNormalized());
    expect(result.id).toBe("prop-1");
    expect(result.portal).toBe("mercadolibre");
    expect(result.portalId).toBe("ML-123");
    expect(result.price).toBe(150000);
    expect(result.currency).toBe("USD");
  });

  it("calculates pricePerSqm from price and area", () => {
    const result = parseProperty(makeNormalized({ price: 130000, features: { bedrooms: 1, bathrooms: 1, area: 65, areaUnit: "m2" } }));
    expect(result.pricePerSqm).toBe(2000);
  });

  it("returns pricePerSqm 0 when area is 0", () => {
    const result = parseProperty(makeNormalized({ features: { bedrooms: 1, bathrooms: 1, area: 0, areaUnit: "m2" } }));
    expect(result.pricePerSqm).toBe(0);
  });

  it("builds fullAddress from location parts", () => {
    const result = parseProperty(makeNormalized());
    expect(result.location.fullAddress).toBe("Av. Santa Fe 1234, Buenos Aires, CABA, Argentina");
  });

  it("extracts expenses from description", () => {
    const result = parseProperty(makeNormalized({ description: "Expensas: 50000 pesos" }));
    expect(result.expenses).toBe(50000);
  });

  it("returns 0 expenses when no pattern matches", () => {
    const result = parseProperty(makeNormalized({ description: "Sin expensas" }));
    expect(result.expenses).toBe(0);
  });

  it("extracts amenities from description", () => {
    const result = parseProperty(makeNormalized({ description: "Tiene piscina y parrilla" }));
    expect(result.amenities).toContain("piscina");
    expect(result.amenities).toContain("parrilla");
  });

  it("extracts restrictions from description", () => {
    const result = parseProperty(makeNormalized({ description: "Se permiten mascotas" }));
    expect(result.restrictions.petFriendly).toBe(true);
    expect(result.restrictions.allowedForPets).toBeTruthy();
  });

  it("sets petTypes when cat is mentioned", () => {
    const result = parseProperty(makeNormalized({ description: "Se aceptan mascotas, gatos y perros" }));
    expect(result.restrictions.petTypes).toContain("cat");
    expect(result.restrictions.petTypes).toContain("dog");
  });

  it("uses rawItem for optional features", () => {
    const rawItem = { covered_area: 50, land_area: 200, floor: 3, total_floors: 10, year_built: 2020 };
    const result = parseProperty(makeNormalized(), rawItem);
    expect(result.features.coveredArea).toBe(50);
    expect(result.features.landArea).toBe(200);
    expect(result.features.floor).toBe(3);
    expect(result.features.totalFloors).toBe(10);
    expect(result.features.yearBuilt).toBe(2020);
  });

  it("defaults features from NormalizedProperty when no rawItem", () => {
    const result = parseProperty(makeNormalized());
    expect(result.features.coveredArea).toBe(65);
    expect(result.features.landArea).toBe(0);
    expect(result.features.floor).toBeNull();
  });

  it("sets totalRooms as bedrooms + bathrooms", () => {
    const result = parseProperty(makeNormalized({ features: { bedrooms: 3, bathrooms: 2, area: 80, areaUnit: "m2" } }));
    expect(result.features.totalRooms).toBe(5);
  });

  it("sets landlord type to agent", () => {
    const result = parseProperty(makeNormalized());
    expect(result.landlord!.type).toBe("agent");
    expect(result.landlord!.name).toBe("Juan Pérez");
  });

  it("returns null landlord when none provided", () => {
    const prop = makeNormalized();
    delete prop.landlord;
    const result = parseProperty(prop);
    expect(result.landlord).toBeNull();
  });

  it("sets mainImage to first image", () => {
    const result = parseProperty(makeNormalized({ images: ["https://a.com/1.jpg", "https://b.com/2.jpg"] }));
    expect(result.mainImage).toBe("https://a.com/1.jpg");
  });

  it("sets mainImage to empty when no images", () => {
    const result = parseProperty(makeNormalized({ images: [] }));
    expect(result.mainImage).toBe("");
  });

  it("filters out falsy images", () => {
    const result = parseProperty(makeNormalized({ images: ["https://a.com/1.jpg", "", "https://b.com/2.jpg"] }));
    expect(result.images).toHaveLength(2);
  });

  it("sets parsedAt to current ISO date", () => {
    const before = Date.now();
    const result = parseProperty(makeNormalized());
    const parsedTime = new Date(result.parsedAt).getTime();
    expect(parsedTime).toBeGreaterThanOrEqual(before);
    expect(parsedTime).toBeLessThanOrEqual(Date.now());
  });

  it("passes through publishedAt and scrapedAt", () => {
    const result = parseProperty(makeNormalized({ publishedAt: "2024-01-01", scrapedAt: "2024-06-15T10:00:00Z" }));
    expect(result.publishedAt).toBe("2024-01-01");
    expect(result.scrapedAt).toBe("2024-06-15T10:00:00Z");
  });

  it("detects furnished from NormalizedProperty", () => {
    const result = parseProperty(makeNormalized({ features: { bedrooms: 1, bathrooms: 1, area: 40, areaUnit: "m2", furnished: true } }));
    expect(result.restrictions.furnished).toBe(true);
  });

  it("detects petFriendly from NormalizedProperty", () => {
    const result = parseProperty(makeNormalized({ features: { bedrooms: 1, bathrooms: 1, area: 40, areaUnit: "m2", petFriendly: true } }));
    expect(result.restrictions.petFriendly).toBe(true);
  });
});
