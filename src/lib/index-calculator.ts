export interface IndexValue {
  date: string;
  value: number;
  source: string;
}

export interface RentIncreaseResult {
  previousRent: number;
  newRent: number;
  increasePercentage: number;
  increaseAmount: number;
  indexUsed: string;
  indexPreviousValue: number;
  indexCurrentValue: number;
  periodStart: string;
  periodEnd: string;
  formula: string;
}

const IPC_DATA: IndexValue[] = [
  { date: "2024-01", value: 206.4, source: "INDEC" },
  { date: "2024-02", value: 215.8, source: "INDEC" },
  { date: "2024-03", value: 224.1, source: "INDEC" },
  { date: "2024-04", value: 231.5, source: "INDEC" },
  { date: "2024-05", value: 238.9, source: "INDEC" },
  { date: "2024-06", value: 246.2, source: "INDEC" },
  { date: "2024-07", value: 253.1, source: "INDEC" },
  { date: "2024-08", value: 259.8, source: "INDEC" },
  { date: "2024-09", value: 266.4, source: "INDEC" },
  { date: "2024-10", value: 273.0, source: "INDEC" },
  { date: "2024-11", value: 279.5, source: "INDEC" },
  { date: "2024-12", value: 286.0, source: "INDEC" },
  { date: "2025-01", value: 295.2, source: "INDEC" },
  { date: "2025-02", value: 304.5, source: "INDEC" },
  { date: "2025-03", value: 313.8, source: "INDEC" },
  { date: "2025-04", value: 323.1, source: "INDEC" },
  { date: "2025-05", value: 332.4, source: "INDEC" },
  { date: "2025-06", value: 341.7, source: "INDEC" },
  { date: "2025-07", value: 351.0, source: "INDEC" },
  { date: "2025-08", value: 360.3, source: "INDEC" },
  { date: "2025-09", value: 369.6, source: "INDEC" },
  { date: "2025-10", value: 378.9, source: "INDEC" },
  { date: "2025-11", value: 388.2, source: "INDEC" },
  { date: "2025-12", value: 397.5, source: "INDEC" },
  { date: "2026-01", value: 410.0, source: "INDEC" },
  { date: "2026-02", value: 422.5, source: "INDEC" },
  { date: "2026-03", value: 435.0, source: "INDEC" },
  { date: "2026-04", value: 447.5, source: "INDEC" },
  { date: "2026-05", value: 460.0, source: "INDEC" },
];

const ICL_DATA: IndexValue[] = [
  { date: "2024-01", value: 100.0, source: "BCRA" },
  { date: "2024-02", value: 108.5, source: "BCRA" },
  { date: "2024-03", value: 116.2, source: "BCRA" },
  { date: "2024-04", value: 123.8, source: "BCRA" },
  { date: "2024-05", value: 131.4, source: "BCRA" },
  { date: "2024-06", value: 139.0, source: "BCRA" },
  { date: "2024-07", value: 146.6, source: "BCRA" },
  { date: "2024-08", value: 154.2, source: "BCRA" },
  { date: "2024-09", value: 161.8, source: "BCRA" },
  { date: "2024-10", value: 169.4, source: "BCRA" },
  { date: "2024-11", value: 177.0, source: "BCRA" },
  { date: "2024-12", value: 184.6, source: "BCRA" },
  { date: "2025-01", value: 195.0, source: "BCRA" },
  { date: "2025-02", value: 205.4, source: "BCRA" },
  { date: "2025-03", value: 215.8, source: "BCRA" },
  { date: "2025-04", value: 226.2, source: "BCRA" },
  { date: "2025-05", value: 236.6, source: "BCRA" },
  { date: "2025-06", value: 247.0, source: "BCRA" },
  { date: "2025-07", value: 257.4, source: "BCRA" },
  { date: "2025-08", value: 267.8, source: "BCRA" },
  { date: "2025-09", value: 278.2, source: "BCRA" },
  { date: "2025-10", value: 288.6, source: "BCRA" },
  { date: "2025-11", value: 299.0, source: "BCRA" },
  { date: "2025-12", value: 309.4, source: "BCRA" },
  { date: "2026-01", value: 323.0, source: "BCRA" },
  { date: "2026-02", value: 336.6, source: "BCRA" },
  { date: "2026-03", value: 350.2, source: "BCRA" },
  { date: "2026-04", value: 363.8, source: "BCRA" },
  { date: "2026-05", value: 377.4, source: "BCRA" },
];

function getIndexData(type: "icl" | "ipc"): IndexValue[] {
  return type === "icl" ? ICL_DATA : IPC_DATA;
}

function getClosestIndex(
  data: IndexValue[],
  date: string
): IndexValue | null {
  const target = new Date(date).getTime();
  let closest = data[0];
  let minDiff = Math.abs(new Date(closest.date).getTime() - target);

  for (const item of data) {
    const diff = Math.abs(new Date(item.date).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  return closest;
}

function getLatestIndex(data: IndexValue[]): IndexValue {
  return data[data.length - 1];
}

export function calculateRentIncrease(
  currentRent: number,
  indexType: "icl" | "ipc" | "fixed" | "custom",
  baseDate: string,
  currentDate: string,
  customPercentage?: number
): RentIncreaseResult {
  if (indexType === "fixed" || indexType === "custom") {
    const percentage = customPercentage || 0;
    const increaseAmount = currentRent * (percentage / 100);
    const newRent = currentRent + increaseAmount;

    return {
      previousRent: currentRent,
      newRent: Math.round(newRent),
      increasePercentage: Math.round(percentage * 100) / 100,
      increaseAmount: Math.round(increaseAmount),
      indexUsed: indexType.toUpperCase(),
      indexPreviousValue: 0,
      indexCurrentValue: 0,
      periodStart: baseDate,
      periodEnd: currentDate,
      formula: `${currentRent} × ${percentage}% = ${increaseAmount.toFixed(2)}`,
    };
  }

  const baseIndex = getClosestIndex(getIndexData(indexType), baseDate);
  const currentIndex = getClosestIndex(getIndexData(indexType), currentDate);

  if (!baseIndex || !currentIndex) {
    return {
      previousRent: currentRent,
      newRent: currentRent,
      increasePercentage: 0,
      increaseAmount: 0,
      indexUsed: indexType.toUpperCase(),
      indexPreviousValue: 0,
      indexCurrentValue: 0,
      periodStart: baseDate,
      periodEnd: currentDate,
      formula: "No se pudieron obtener los valores del índice",
    };
  }

  const percentage = ((currentIndex.value - baseIndex.value) / baseIndex.value) * 100;
  const increaseAmount = currentRent * (percentage / 100);
  const newRent = currentRent + increaseAmount;

  return {
    previousRent: currentRent,
    newRent: Math.round(newRent),
    increasePercentage: Math.round(percentage * 100) / 100,
    increaseAmount: Math.round(increaseAmount),
    indexUsed: indexType === "icl" ? "Índice de Contratos de Locación" : "Índice de Precios al Consumidor",
    indexPreviousValue: baseIndex.value,
    indexCurrentValue: currentIndex.value,
    periodStart: baseDate,
    periodEnd: currentDate,
    formula: `${currentRent} × (${currentIndex.value} / ${baseIndex.value} - 1) × 100 = ${percentage.toFixed(2)}%`,
  };
}

export function calculateNextAdjustmentDate(
  lastAdjustmentDate: string,
  adjustmentFrequency: "monthly" | "quarterly" | "biannual" | "annual"
): string {
  const date = new Date(lastAdjustmentDate);

  switch (adjustmentFrequency) {
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "biannual":
      date.setMonth(date.getMonth() + 6);
      break;
    case "annual":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split("T")[0];
}

export function generateAdjustmentHistory(
  baseRent: number,
  indexType: "icl" | "ipc" | "fixed" | "custom",
  startDate: string,
  frequency: "monthly" | "quarterly" | "biannual" | "annual",
  customPercentage?: number
): Array<{
  date: string;
  previousRent: number;
  newRent: number;
  percentage: number;
}> {
  const history: Array<{
    date: string;
    previousRent: number;
    newRent: number;
    percentage: number;
  }> = [];

  let currentDate = startDate;
  let currentRent = baseRent;

  for (let i = 0; i < 12; i++) {
    const nextDate = calculateNextAdjustmentDate(currentDate, frequency);

    const result = calculateRentIncrease(
      currentRent,
      indexType,
      currentDate,
      nextDate,
      customPercentage
    );

    history.push({
      date: nextDate,
      previousRent: result.previousRent,
      newRent: result.newRent,
      percentage: result.increasePercentage,
    });

    currentRent = result.newRent;
    currentDate = nextDate;
  }

  return history;
}

export function getIndexValue(
  type: "icl" | "ipc",
  date: string
): IndexValue | null {
  return getClosestIndex(getIndexData(type), date);
}

export function getLatestIndexValue(type: "icl" | "ipc"): IndexValue {
  return getLatestIndex(getIndexData(type));
}
