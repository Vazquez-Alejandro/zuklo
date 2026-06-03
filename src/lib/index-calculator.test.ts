import { describe, it, expect } from "vitest";
import {
  calculateRentIncrease,
  calculateNextAdjustmentDate,
  getIndexValue,
  getLatestIndexValue,
} from "./index-calculator";

describe("calculateRentIncrease", () => {
  describe("fixed index", () => {
    it("calculates fixed percentage increase", () => {
      const result = calculateRentIncrease(100000, "fixed", "2024-01-01", "2024-07-01", 10);
      expect(result.previousRent).toBe(100000);
      expect(result.newRent).toBe(110000);
      expect(result.increasePercentage).toBe(10);
      expect(result.increaseAmount).toBe(10000);
      expect(result.indexUsed).toBe("FIXED");
    });

    it("handles zero percentage", () => {
      const result = calculateRentIncrease(100000, "fixed", "2024-01-01", "2024-07-01", 0);
      expect(result.newRent).toBe(100000);
      expect(result.increasePercentage).toBe(0);
    });

    it("defaults to 0% when customPercentage is omitted", () => {
      const result = calculateRentIncrease(100000, "fixed", "2024-01-01", "2024-07-01");
      expect(result.newRent).toBe(100000);
    });
  });

  describe("custom index", () => {
    it("uses custom percentage like fixed", () => {
      const result = calculateRentIncrease(200000, "custom", "2024-01-01", "2024-07-01", 5.5);
      expect(result.newRent).toBe(211000);
      expect(result.increasePercentage).toBe(5.5);
    });
  });

  describe("ipc index", () => {
    it("calculates increase based on IPC values", () => {
      const result = calculateRentIncrease(100000, "ipc", "2024-01-01", "2024-06-01");
      expect(result.previousRent).toBe(100000);
      expect(result.newRent).toBeGreaterThan(100000);
      expect(result.indexPreviousValue).toBe(206.4);
      expect(result.indexCurrentValue).toBe(246.2);
      expect(result.indexUsed).toContain("Precios al Consumidor");
      expect(result.formula).toContain("/");
    });

    it("returns same rent for same date", () => {
      const result = calculateRentIncrease(100000, "ipc", "2024-06-01", "2024-06-01");
      expect(result.increasePercentage).toBe(0);
      expect(result.newRent).toBe(100000);
    });
  });

  describe("icl index", () => {
    it("calculates increase based on ICL values", () => {
      const result = calculateRentIncrease(100000, "icl", "2024-01-01", "2024-06-01");
      expect(result.indexPreviousValue).toBe(100.0);
      expect(result.indexCurrentValue).toBe(139.0);
      expect(result.indexUsed).toContain("Contratos de Locación");
    });
  });

  it("rounds newRent and increaseAmount to integers", () => {
    const result = calculateRentIncrease(100000, "ipc", "2024-01-01", "2024-03-01");
    expect(Number.isInteger(result.newRent)).toBe(true);
    expect(Number.isInteger(result.increaseAmount)).toBe(true);
  });
});

describe("calculateNextAdjustmentDate", () => {
  it("adds 1 month for monthly frequency", () => {
    expect(calculateNextAdjustmentDate("2024-01-15", "monthly")).toBe("2024-02-15");
  });

  it("adds 3 months for quarterly frequency", () => {
    expect(calculateNextAdjustmentDate("2024-01-15", "quarterly")).toBe("2024-04-15");
  });

  it("adds 6 months for biannual frequency", () => {
    expect(calculateNextAdjustmentDate("2024-01-15", "biannual")).toBe("2024-07-15");
  });

  it("adds 1 year for annual frequency", () => {
    expect(calculateNextAdjustmentDate("2024-01-15", "annual")).toBe("2025-01-15");
  });

  it("handles month rollover (Jan -> Feb)", () => {
    expect(calculateNextAdjustmentDate("2024-01-15T00:00:00Z", "monthly")).toBe("2024-02-15");
  });

  it("handles quarter rollover across years", () => {
    expect(calculateNextAdjustmentDate("2024-10-15T00:00:00Z", "quarterly")).toBe("2025-01-15");
  });
});

describe("getIndexValue", () => {
  it("returns IPC value for exact date", () => {
    const result = getIndexValue("ipc", "2024-06-01");
    expect(result).not.toBeNull();
    expect(result!.value).toBe(246.2);
    expect(result!.source).toBe("INDEC");
  });

  it("returns ICL value for exact date", () => {
    const result = getIndexValue("icl", "2024-06-01");
    expect(result).not.toBeNull();
    expect(result!.value).toBe(139.0);
  });

  it("returns closest value for date between months", () => {
    const result = getIndexValue("ipc", "2024-03-15");
    expect(result).not.toBeNull();
  });
});

describe("getLatestIndexValue", () => {
  it("returns latest IPC value", () => {
    const result = getLatestIndexValue("ipc");
    expect(result.date).toBe("2026-05");
    expect(result.value).toBe(460.0);
  });

  it("returns latest ICL value", () => {
    const result = getLatestIndexValue("icl");
    expect(result.date).toBe("2026-05");
    expect(result.value).toBe(377.4);
  });
});
