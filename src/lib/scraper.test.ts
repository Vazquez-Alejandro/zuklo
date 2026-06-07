import { describe, it, expect } from "vitest";
import { scrapeWithCheerio } from "./scraper";

describe("scraper", () => {
  it("returns empty array for unsupported portal", async () => {
    const result = await scrapeWithCheerio("https://www.mercadolibre.com.ar/propiedades");
    expect(result).toEqual([]);
  });

  it.skip("scrapeZonaprop returns array", async () => {
    const result = await scrapeWithCheerio("https://www.zonaprop.com.ar/departamentos-alquiler-palermo.html");
    expect(Array.isArray(result)).toBe(true);
  });

  it.skip("scrapeArgenprop returns array", async () => {
    const result = await scrapeWithCheerio("https://www.argenprop.com/departamentos-alquiler-palermo");
    expect(Array.isArray(result)).toBe(true);
  });
});
