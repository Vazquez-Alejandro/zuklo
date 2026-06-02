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

const filtersStore = new Map<string, UserFilter>();

export function createFilter(input: CreateFilterInput): UserFilter {
  const now = new Date().toISOString();
  const filter: UserFilter = {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    name: input.name,
    isActive: true,

    priceRange: input.priceRange ?? {
      min: null,
      max: null,
      currency: null,
    },
    expensesRange: input.expensesRange ?? { max: null },
    location: input.location ?? {
      cities: [],
      states: [],
      country: null,
      radiusKm: null,
      centerLat: null,
      centerLng: null,
    },
    features: input.features ?? {
      minBedrooms: null,
      maxBedrooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      minArea: null,
      maxArea: null,
      areaUnit: null,
      minParkingSpaces: null,
    },
    restrictions: input.restrictions ?? {
      petFriendly: null,
      furnished: null,
      minContractMonths: null,
    },
    portals: input.portals ?? [],
    keywords: input.keywords ?? [],
    excludeKeywords: input.excludeKeywords ?? [],
    notification: input.notification ?? {
      enabled: true,
      method: "push",
    },
    createdAt: now,
    updatedAt: now,
  };

  filtersStore.set(filter.id, filter);
  return filter;
}

export function updateFilter(
  id: string,
  input: UpdateFilterInput
): UserFilter | null {
  const existing = filtersStore.get(id);
  if (!existing) return null;

  const updated: UserFilter = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  filtersStore.set(id, updated);
  return updated;
}

export function getFilter(id: string): UserFilter | null {
  return filtersStore.get(id) ?? null;
}

export function getFiltersByUser(userId: string): UserFilter[] {
  return Array.from(filtersStore.values()).filter((f) => f.userId === userId);
}

export function getActiveFilters(): UserFilter[] {
  return Array.from(filtersStore.values()).filter((f) => f.isActive);
}

export function deleteFilter(id: string): boolean {
  return filtersStore.delete(id);
}

export function deactivateFilter(id: string): boolean {
  const filter = filtersStore.get(id);
  if (!filter) return false;
  filter.isActive = false;
  filter.updatedAt = new Date().toISOString();
  return true;
}
