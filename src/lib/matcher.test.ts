import { describe, it, expect } from "vitest";
import { matchProperty, matchPropertyAgainstAllFilters } from "./matcher";
import type { ParsedProperty } from "./parser";
import type { UserFilter } from "./filters";

function makeProperty(overrides: Partial<ParsedProperty> = {}): ParsedProperty {
  return {
    id: overrides.id ?? "prop-1",
    portal: overrides.portal ?? "mercadolibre",
    portalId: overrides.portalId ?? "ML-123",
    url: overrides.url ?? "https://example.com/prop/1",
    title: overrides.title ?? "Departamento 2 ambientes en Palermo",
    description: overrides.description ?? "Hermoso departamento",
    price: overrides.price ?? 150000,
    currency: overrides.currency ?? "USD",
    expenses: overrides.expenses ?? 30000,
    pricePerSqm: overrides.pricePerSqm ?? 2308,
    location: overrides.location ?? {
      address: "Av. Santa Fe 1234",
      fullAddress: "Av. Santa Fe 1234, Buenos Aires, CABA, Argentina",
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
      totalRooms: 3,
      area: 65,
      areaUnit: "m2",
      coveredArea: 65,
      landArea: 0,
      parkingSpaces: 1,
      floor: null,
      totalFloors: null,
      yearBuilt: null,
    },
    restrictions: overrides.restrictions ?? {
      furnished: null,
      petFriendly: null,
      petTypes: [],
      minContractMonths: null,
      allowedForStudents: null,
      allowedForPets: null,
    },
    amenities: overrides.amenities ?? [],
    images: overrides.images ?? ["https://img.com/1.jpg"],
    mainImage: overrides.mainImage ?? "https://img.com/1.jpg",
    landlord: overrides.landlord ?? null,
    publishedAt: overrides.publishedAt ?? "2024-06-01",
    scrapedAt: overrides.scrapedAt ?? "2024-06-01T12:00:00Z",
    parsedAt: overrides.parsedAt ?? "2024-06-01T12:00:00Z",
  };
}

function makeFilter(overrides: Partial<UserFilter> = {}): UserFilter {
  return {
    id: overrides.id ?? "filter-1",
    userId: overrides.userId ?? "user-1",
    name: overrides.name ?? "Mi filtro",
    isActive: overrides.isActive ?? true,
    priceRange: overrides.priceRange ?? { min: null, max: null, currency: null },
    expensesRange: overrides.expensesRange ?? { max: null },
    location: overrides.location ?? {
      cities: [],
      states: [],
      country: null,
      radiusKm: null,
      centerLat: null,
      centerLng: null,
    },
    features: overrides.features ?? {
      minBedrooms: null,
      maxBedrooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      minArea: null,
      maxArea: null,
      areaUnit: null,
      minParkingSpaces: null,
    },
    restrictions: overrides.restrictions ?? {
      petFriendly: null,
      furnished: null,
      minContractMonths: null,
    },
    portals: overrides.portals ?? [],
    keywords: overrides.keywords ?? [],
    excludeKeywords: overrides.excludeKeywords ?? [],
    notification: overrides.notification ?? { enabled: true, method: "push" },
    createdAt: overrides.createdAt ?? "2024-06-01",
    updatedAt: overrides.updatedAt ?? "2024-06-01",
  };
}

describe("matchProperty", () => {
  describe("price matching", () => {
    it("matches when price is within range", () => {
      const filter = makeFilter({ priceRange: { min: 100000, max: 200000, currency: null } });
      const result = matchProperty(makeProperty({ price: 150000 }), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when price is below minimum", () => {
      const filter = makeFilter({ priceRange: { min: 200000, max: null, currency: null } });
      const result = matchProperty(makeProperty({ price: 150000 }), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Price out of range");
    });

    it("does not match when price is above maximum", () => {
      const filter = makeFilter({ priceRange: { min: null, max: 100000, currency: null } });
      const result = matchProperty(makeProperty({ price: 150000 }), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Price out of range");
    });

    it("matches with no price filter set", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.reasons).not.toContain("Price out of range");
    });
  });

  describe("expenses matching", () => {
    it("matches when expenses are within range", () => {
      const filter = makeFilter({ expensesRange: { max: 50000 } });
      const result = matchProperty(makeProperty({ expenses: 30000 }), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when expenses exceed max", () => {
      const filter = makeFilter({ expensesRange: { max: 20000 } });
      const result = matchProperty(makeProperty({ expenses: 30000 }), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Expenses too high");
    });
  });

  describe("location matching", () => {
    it("matches when city is in filter list", () => {
      const filter = makeFilter({ location: { cities: ["Buenos Aires"], states: [], country: null, radiusKm: null, centerLat: null, centerLng: null } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when city is not in filter list", () => {
      const filter = makeFilter({ location: { cities: ["Córdoba"], states: [], country: null, radiusKm: null, centerLat: null, centerLng: null } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Location doesn't match");
    });

    it("does not match when country differs", () => {
      const filter = makeFilter({ location: { cities: [], states: [], country: "Chile", radiusKm: null, centerLat: null, centerLng: null } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
    });

    it("matches within radius", () => {
      const filter = makeFilter({
        location: { cities: [], states: [], country: null, radiusKm: 10, centerLat: -34.6037, centerLng: -58.3816 },
      });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match outside radius", () => {
      const filter = makeFilter({
        location: { cities: [], states: [], country: null, radiusKm: 1, centerLat: 0, centerLng: 0 },
      });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
    });

    it("matches when no location filter is set", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.reasons).not.toContain("Location doesn't match");
    });
  });

  describe("features matching", () => {
    it("matches when bedrooms within range", () => {
      const filter = makeFilter({ features: { minBedrooms: 1, maxBedrooms: 3, minBathrooms: null, maxBathrooms: null, minArea: null, maxArea: null, areaUnit: null, minParkingSpaces: null } });
      const result = matchProperty(makeProperty({ features: { bedrooms: 2, bathrooms: 1, totalRooms: 3, area: 65, areaUnit: "m2", coveredArea: 65, landArea: 0, parkingSpaces: 1, floor: null, totalFloors: null, yearBuilt: null } }), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when bedrooms below minimum", () => {
      const filter = makeFilter({ features: { minBedrooms: 3, maxBedrooms: null, minBathrooms: null, maxBathrooms: null, minArea: null, maxArea: null, areaUnit: null, minParkingSpaces: null } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Features don't match");
    });

    it("does not match when area above maximum", () => {
      const filter = makeFilter({ features: { minBedrooms: null, maxBedrooms: null, minBathrooms: null, maxBathrooms: null, minArea: null, maxArea: 50, areaUnit: null, minParkingSpaces: null } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
    });

    it("does not match when parkingSpaces below minimum", () => {
      const filter = makeFilter({ features: { minBedrooms: null, maxBedrooms: null, minBathrooms: null, maxBathrooms: null, minArea: null, maxArea: null, areaUnit: null, minParkingSpaces: 2 } });
      const result = matchProperty(makeProperty(), filter);
      expect(result.matched).toBe(false);
    });
  });

  describe("restrictions matching", () => {
    it("does not match when petFriendly required but property disallows", () => {
      const filter = makeFilter({ restrictions: { petFriendly: true, furnished: null, minContractMonths: null } });
      const prop = makeProperty({ restrictions: { furnished: null, petFriendly: false, petTypes: [], minContractMonths: null, allowedForStudents: null, allowedForPets: null } });
      const result = matchProperty(prop, filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Restrictions don't match");
    });

    it("does not match when furnished required but property not furnished", () => {
      const filter = makeFilter({ restrictions: { petFriendly: null, furnished: true, minContractMonths: null } });
      const prop = makeProperty({ restrictions: { furnished: false, petFriendly: null, petTypes: [], minContractMonths: null, allowedForStudents: null, allowedForPets: null } });
      const result = matchProperty(prop, filter);
      expect(result.matched).toBe(false);
    });

    it("matches when restrictions are null (no preference)", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.reasons).not.toContain("Restrictions don't match");
    });
  });

  describe("portal matching", () => {
    it("matches when portal is in filter list", () => {
      const filter = makeFilter({ portals: ["mercadolibre", "argenprop"] });
      const result = matchProperty(makeProperty({ portal: "mercadolibre" }), filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when portal not in list", () => {
      const filter = makeFilter({ portals: ["argenprop", "properati"] });
      const result = matchProperty(makeProperty({ portal: "mercadolibre" }), filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Portal not in list");
    });

    it("matches when no portal filter set", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.reasons).not.toContain("Portal not in list");
    });
  });

  describe("keyword matching", () => {
    it("matches when required keywords are found", () => {
      const filter = makeFilter({ keywords: ["pileta"] });
      const prop = makeProperty({ title: "Departamento con pileta" });
      const result = matchProperty(prop, filter);
      expect(result.matched).toBe(true);
    });

    it("does not match when required keywords missing", () => {
      const filter = makeFilter({ keywords: ["pileta", "gym"] });
      const prop = makeProperty({ title: "Departamento normal" });
      const result = matchProperty(prop, filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Keywords don't match");
    });

    it("does not match when exclude keywords present", () => {
      const filter = makeFilter({ excludeKeywords: ["cochera"] });
      const prop = makeProperty({ title: "Departamento con cochera" });
      const result = matchProperty(prop, filter);
      expect(result.matched).toBe(false);
      expect(result.reasons).toContain("Keywords don't match");
    });

    it("matches when no keywords filter", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.reasons).not.toContain("Keywords don't match");
    });
  });

  describe("scoring", () => {
    it("returns score between 0 and 1", () => {
      const result = matchProperty(makeProperty(), makeFilter());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it("returns higher score for better matches", () => {
      const loose = matchProperty(makeProperty(), makeFilter());
      const tight = matchProperty(makeProperty(), makeFilter({
        priceRange: { min: 140000, max: 160000, currency: null },
        location: { cities: ["Buenos Aires"], states: [], country: null, radiusKm: null, centerLat: null, centerLng: null },
        features: { minBedrooms: 2, maxBedrooms: 2, minBathrooms: 1, maxBathrooms: 1, minArea: 60, maxArea: 70, areaUnit: null, minParkingSpaces: null },
      }));
      expect(tight.score).toBeGreaterThanOrEqual(loose.score);
    });
  });

  it("includes filterId and propertyId in result", () => {
    const result = matchProperty(makeProperty({ id: "p1" }), makeFilter({ id: "f1", name: "Test" }));
    expect(result.filterId).toBe("f1");
    expect(result.filterName).toBe("Test");
    expect(result.propertyId).toBe("p1");
  });
});

describe("matchPropertyAgainstAllFilters", () => {
  it("returns only matched results from active filters", () => {
    const prop = makeProperty({ price: 150000 });
    const filters = [
      makeFilter({ id: "f1", name: "Cheap", priceRange: { min: null, max: 100000, currency: null }, notification: { enabled: true, method: "push" } }),
      makeFilter({ id: "f2", name: "Mid", priceRange: { min: 100000, max: 200000, currency: null }, notification: { enabled: true, method: "push" } }),
    ];
    const results = matchPropertyAgainstAllFilters(prop, filters);
    expect(results).toHaveLength(1);
    expect(results[0].filterId).toBe("f2");
  });

  it("filters out inactive filters", () => {
    const prop = makeProperty({ price: 150000 });
    const filters = [
      makeFilter({ id: "f1", isActive: false, priceRange: { min: 100000, max: 200000, currency: null }, notification: { enabled: true, method: "push" } }),
    ];
    const results = matchPropertyAgainstAllFilters(prop, filters);
    expect(results).toHaveLength(0);
  });

  it("filters out filters with notifications disabled", () => {
    const prop = makeProperty({ price: 150000 });
    const filters = [
      makeFilter({ id: "f1", priceRange: { min: 100000, max: 200000, currency: null }, notification: { enabled: false, method: "push" } }),
    ];
    const results = matchPropertyAgainstAllFilters(prop, filters);
    expect(results).toHaveLength(0);
  });

  it("returns empty array for empty filters", () => {
    const results = matchPropertyAgainstAllFilters(makeProperty(), []);
    expect(results).toHaveLength(0);
  });

  it("returns multiple matches", () => {
    const prop = makeProperty({ price: 150000 });
    const filters = [
      makeFilter({ id: "f1", name: "A", priceRange: { min: 100000, max: 200000, currency: null }, notification: { enabled: true, method: "push" } }),
      makeFilter({ id: "f2", name: "B", priceRange: { min: 140000, max: 160000, currency: null }, notification: { enabled: true, method: "push" } }),
    ];
    const results = matchPropertyAgainstAllFilters(prop, filters);
    expect(results).toHaveLength(2);
  });
});
