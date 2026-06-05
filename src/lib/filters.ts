import { db } from "@/lib/db";
import { userFilters } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export interface UserFilter {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;

  priceRange: {
    min: number | null;
    max: number | null;
    currency: string | null;
  };

  expensesRange: {
    max: number | null;
  };

  location: {
    cities: string[];
    states: string[];
    country: string | null;
    radiusKm: number | null;
    centerLat: number | null;
    centerLng: number | null;
  };

  features: {
    minBedrooms: number | null;
    maxBedrooms: number | null;
    minBathrooms: number | null;
    maxBathrooms: number | null;
    minArea: number | null;
    maxArea: number | null;
    areaUnit: string | null;
    minParkingSpaces: number | null;
  };

  restrictions: {
    petFriendly: boolean | null;
    furnished: boolean | null;
    minContractMonths: number | null;
  };

  portals: string[];

  keywords: string[];

  excludeKeywords: string[];

  notification: {
    enabled: boolean;
    method: "push" | "email" | "both";
  };

  createdAt: string;
  updatedAt: string;
}

export interface CreateFilterInput {
  userId: string;
  name: string;
  priceRange?: UserFilter["priceRange"];
  expensesRange?: UserFilter["expensesRange"];
  location?: UserFilter["location"];
  features?: UserFilter["features"];
  restrictions?: UserFilter["restrictions"];
  portals?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
  notification?: UserFilter["notification"];
}

export interface UpdateFilterInput extends Partial<CreateFilterInput> {
  isActive?: boolean;
}

interface Row {
  id: string;
  userId: string;
  name: string;
  isActive: boolean | null;
  priceMin: string | null;
  priceMax: string | null;
  priceCurrency: string | null;
  expensesMax: string | null;
  cities: string[] | null;
  states: string[] | null;
  filterCountry: string | null;
  radiusKm: string | null;
  centerLat: number | null;
  centerLng: number | null;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minBathrooms: number | null;
  maxBathrooms: number | null;
  minArea: string | null;
  maxArea: string | null;
  areaUnit: string | null;
  minParkingSpaces: number | null;
  petFriendly: boolean | null;
  furnished: boolean | null;
  minContractMonths: number | null;
  portals: string[] | null;
  keywords: string[] | null;
  excludeKeywords: string[] | null;
  notificationEnabled: boolean | null;
  notificationMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToFilter(row: Row): UserFilter {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    isActive: row.isActive ?? true,
    priceRange: {
      min: row.priceMin ? Number(row.priceMin) : null,
      max: row.priceMax ? Number(row.priceMax) : null,
      currency: row.priceCurrency,
    },
    expensesRange: {
      max: row.expensesMax ? Number(row.expensesMax) : null,
    },
    location: {
      cities: row.cities ?? [],
      states: row.states ?? [],
      country: row.filterCountry,
      radiusKm: row.radiusKm ? Number(row.radiusKm) : null,
      centerLat: row.centerLat,
      centerLng: row.centerLng,
    },
    features: {
      minBedrooms: row.minBedrooms,
      maxBedrooms: row.maxBedrooms,
      minBathrooms: row.minBathrooms,
      maxBathrooms: row.maxBathrooms,
      minArea: row.minArea ? Number(row.minArea) : null,
      maxArea: row.maxArea ? Number(row.maxArea) : null,
      areaUnit: row.areaUnit,
      minParkingSpaces: row.minParkingSpaces,
    },
    restrictions: {
      petFriendly: row.petFriendly,
      furnished: row.furnished,
      minContractMonths: row.minContractMonths,
    },
    portals: row.portals ?? [],
    keywords: row.keywords ?? [],
    excludeKeywords: row.excludeKeywords ?? [],
    notification: {
      enabled: row.notificationEnabled ?? true,
      method: (row.notificationMethod as "push" | "email" | "both") ?? "push",
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function inputToRow(
  input: CreateFilterInput,
  overrides?: Record<string, unknown>
) {
  const now = new Date();
  return {
    id: overrides?.id as string | undefined,
    userId: input.userId,
    name: input.name,
    isActive: (overrides?.isActive as boolean) ?? true,
    priceMin: input.priceRange?.min != null ? String(input.priceRange.min) : null,
    priceMax: input.priceRange?.max != null ? String(input.priceRange.max) : null,
    priceCurrency: input.priceRange?.currency ?? null,
    expensesMax: input.expensesRange?.max != null ? String(input.expensesRange.max) : null,
    cities: input.location?.cities ?? [],
    states: input.location?.states ?? [],
    filterCountry: input.location?.country ?? null,
    radiusKm: input.location?.radiusKm != null ? String(input.location.radiusKm) : null,
    centerLat: input.location?.centerLat ?? null,
    centerLng: input.location?.centerLng ?? null,
    minBedrooms: input.features?.minBedrooms ?? null,
    maxBedrooms: input.features?.maxBedrooms ?? null,
    minBathrooms: input.features?.minBathrooms ?? null,
    maxBathrooms: input.features?.maxBathrooms ?? null,
    minArea: input.features?.minArea != null ? String(input.features.minArea) : null,
    maxArea: input.features?.maxArea != null ? String(input.features.maxArea) : null,
    areaUnit: input.features?.areaUnit ?? null,
    minParkingSpaces: input.features?.minParkingSpaces ?? null,
    petFriendly: input.restrictions?.petFriendly ?? null,
    furnished: input.restrictions?.furnished ?? null,
    minContractMonths: input.restrictions?.minContractMonths ?? null,
    portals: input.portals ?? [],
    keywords: input.keywords ?? [],
    excludeKeywords: input.excludeKeywords ?? [],
    notificationEnabled: input.notification?.enabled ?? true,
    notificationMethod: input.notification?.method ?? "push",
    createdAt: (overrides?.createdAt as Date) ?? now,
    updatedAt: (overrides?.updatedAt as Date) ?? now,
  };
}

export async function createFilter(input: CreateFilterInput): Promise<UserFilter> {
  const row = inputToRow(input);

  const [result] = await db.insert(userFilters).values(row).returning();

  return rowToFilter(result as Row);
}

export async function updateFilter(
  id: string,
  input: UpdateFilterInput
): Promise<UserFilter | null> {
  const [existing] = await db.select().from(userFilters)
    .where(eq(userFilters.id, id))
    .limit(1);

  if (!existing) {
    return null;
  }

  const merged: CreateFilterInput = {
    userId: input.userId ?? (existing as Row).userId,
    name: input.name ?? (existing as Row).name,
    priceRange: input.priceRange ?? {
      min: (existing as Row).priceMin ? Number((existing as Row).priceMin) : null,
      max: (existing as Row).priceMax ? Number((existing as Row).priceMax) : null,
      currency: (existing as Row).priceCurrency,
    },
    expensesRange: input.expensesRange ?? {
      max: (existing as Row).expensesMax ? Number((existing as Row).expensesMax) : null,
    },
    location: input.location ?? {
      cities: (existing as Row).cities ?? [],
      states: (existing as Row).states ?? [],
      country: (existing as Row).filterCountry,
      radiusKm: (existing as Row).radiusKm ? Number((existing as Row).radiusKm) : null,
      centerLat: (existing as Row).centerLat,
      centerLng: (existing as Row).centerLng,
    },
    features: input.features ?? {
      minBedrooms: (existing as Row).minBedrooms,
      maxBedrooms: (existing as Row).maxBedrooms,
      minBathrooms: (existing as Row).minBathrooms,
      maxBathrooms: (existing as Row).maxBathrooms,
      minArea: (existing as Row).minArea ? Number((existing as Row).minArea) : null,
      maxArea: (existing as Row).maxArea ? Number((existing as Row).maxArea) : null,
      areaUnit: (existing as Row).areaUnit,
      minParkingSpaces: (existing as Row).minParkingSpaces,
    },
    restrictions: input.restrictions ?? {
      petFriendly: (existing as Row).petFriendly,
      furnished: (existing as Row).furnished,
      minContractMonths: (existing as Row).minContractMonths,
    },
    portals: input.portals ?? (existing as Row).portals ?? [],
    keywords: input.keywords ?? (existing as Row).keywords ?? [],
    excludeKeywords:
      input.excludeKeywords ?? (existing as Row).excludeKeywords ?? [],
    notification: input.notification ?? {
      enabled: (existing as Row).notificationEnabled ?? true,
      method: ((existing as Row).notificationMethod as
        | "push"
        | "email"
        | "both") ?? "push",
    },
  };

  const row = inputToRow(merged, {
    isActive: input.isActive ?? ((existing as Row).isActive ?? true),
    updatedAt: new Date(),
  });

  const [result] = await db.update(userFilters)
    .set(row)
    .where(eq(userFilters.id, id))
    .returning();

  return rowToFilter(result as Row);
}

export async function getFilter(id: string): Promise<UserFilter | null> {
  const [row] = await db.select().from(userFilters)
    .where(eq(userFilters.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  return rowToFilter(row as Row);
}

export async function getFiltersByUser(userId: string): Promise<UserFilter[]> {
  const rows = await db.select().from(userFilters)
    .where(eq(userFilters.userId, userId))
    .orderBy(desc(userFilters.createdAt));

  return (rows as Row[]).map(rowToFilter);
}

export async function getActiveFilters(): Promise<UserFilter[]> {
  const rows = await db.select().from(userFilters)
    .where(eq(userFilters.isActive, true))
    .orderBy(desc(userFilters.createdAt));

  return (rows as Row[]).map(rowToFilter);
}

export async function deleteFilter(id: string): Promise<boolean> {
  try {
    await db.delete(userFilters).where(eq(userFilters.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deactivateFilter(id: string): Promise<boolean> {
  try {
    await db.update(userFilters)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userFilters.id, id));
    return true;
  } catch {
    return false;
  }
}
