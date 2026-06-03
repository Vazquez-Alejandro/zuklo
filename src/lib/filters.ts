import { supabaseAdmin } from "./supabase";

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
  user_id: string;
  name: string;
  is_active: boolean;
  price_min: number | null;
  price_max: number | null;
  price_currency: string | null;
  expenses_max: number | null;
  cities: string[];
  states: string[];
  country: string | null;
  radius_km: number | null;
  center_lat: number | null;
  center_lng: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  min_bathrooms: number | null;
  max_bathrooms: number | null;
  min_area: number | null;
  max_area: number | null;
  area_unit: string | null;
  min_parking_spaces: number | null;
  pet_friendly: boolean | null;
  furnished: boolean | null;
  min_contract_months: number | null;
  portals: string[];
  keywords: string[];
  exclude_keywords: string[];
  notification_enabled: boolean;
  notification_method: string;
  created_at: string;
  updated_at: string;
}

function rowToFilter(row: Row): UserFilter {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isActive: row.is_active,
    priceRange: {
      min: row.price_min,
      max: row.price_max,
      currency: row.price_currency,
    },
    expensesRange: {
      max: row.expenses_max,
    },
    location: {
      cities: row.cities ?? [],
      states: row.states ?? [],
      country: row.country,
      radiusKm: row.radius_km,
      centerLat: row.center_lat,
      centerLng: row.center_lng,
    },
    features: {
      minBedrooms: row.min_bedrooms,
      maxBedrooms: row.max_bedrooms,
      minBathrooms: row.min_bathrooms,
      maxBathrooms: row.max_bathrooms,
      minArea: row.min_area,
      maxArea: row.max_area,
      areaUnit: row.area_unit,
      minParkingSpaces: row.min_parking_spaces,
    },
    restrictions: {
      petFriendly: row.pet_friendly,
      furnished: row.furnished,
      minContractMonths: row.min_contract_months,
    },
    portals: row.portals ?? [],
    keywords: row.keywords ?? [],
    excludeKeywords: row.exclude_keywords ?? [],
    notification: {
      enabled: row.notification_enabled,
      method: row.notification_method as "push" | "email" | "both",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inputToRow(
  input: CreateFilterInput,
  overrides?: Partial<Row>
): Omit<Row, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
} {
  const now = new Date().toISOString();
  return {
    id: overrides?.id,
    user_id: input.userId,
    name: input.name,
    is_active: overrides?.is_active ?? true,
    price_min: input.priceRange?.min ?? null,
    price_max: input.priceRange?.max ?? null,
    price_currency: input.priceRange?.currency ?? null,
    expenses_max: input.expensesRange?.max ?? null,
    cities: input.location?.cities ?? [],
    states: input.location?.states ?? [],
    country: input.location?.country ?? null,
    radius_km: input.location?.radiusKm ?? null,
    center_lat: input.location?.centerLat ?? null,
    center_lng: input.location?.centerLng ?? null,
    min_bedrooms: input.features?.minBedrooms ?? null,
    max_bedrooms: input.features?.maxBedrooms ?? null,
    min_bathrooms: input.features?.minBathrooms ?? null,
    max_bathrooms: input.features?.maxBathrooms ?? null,
    min_area: input.features?.minArea ?? null,
    max_area: input.features?.maxArea ?? null,
    area_unit: input.features?.areaUnit ?? null,
    min_parking_spaces: input.features?.minParkingSpaces ?? null,
    pet_friendly: input.restrictions?.petFriendly ?? null,
    furnished: input.restrictions?.furnished ?? null,
    min_contract_months: input.restrictions?.minContractMonths ?? null,
    portals: input.portals ?? [],
    keywords: input.keywords ?? [],
    exclude_keywords: input.excludeKeywords ?? [],
    notification_enabled: input.notification?.enabled ?? true,
    notification_method: input.notification?.method ?? "push",
    created_at: overrides?.created_at ?? now,
    updated_at: overrides?.updated_at ?? now,
  };
}

export async function createFilter(input: CreateFilterInput): Promise<UserFilter> {
  const row = inputToRow(input);

  const { data, error } = await supabaseAdmin
    .from("user_filters")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create filter: ${error.message}`);
  }

  return rowToFilter(data as Row);
}

export async function updateFilter(
  id: string,
  input: UpdateFilterInput
): Promise<UserFilter | null> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("user_filters")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return null;
  }

  const merged: CreateFilterInput = {
    userId: input.userId ?? (existing as Row).user_id,
    name: input.name ?? (existing as Row).name,
    priceRange: input.priceRange ?? {
      min: (existing as Row).price_min,
      max: (existing as Row).price_max,
      currency: (existing as Row).price_currency,
    },
    expensesRange: input.expensesRange ?? {
      max: (existing as Row).expenses_max,
    },
    location: input.location ?? {
      cities: (existing as Row).cities ?? [],
      states: (existing as Row).states ?? [],
      country: (existing as Row).country,
      radiusKm: (existing as Row).radius_km,
      centerLat: (existing as Row).center_lat,
      centerLng: (existing as Row).center_lng,
    },
    features: input.features ?? {
      minBedrooms: (existing as Row).min_bedrooms,
      maxBedrooms: (existing as Row).max_bedrooms,
      minBathrooms: (existing as Row).min_bathrooms,
      maxBathrooms: (existing as Row).max_bathrooms,
      minArea: (existing as Row).min_area,
      maxArea: (existing as Row).max_area,
      areaUnit: (existing as Row).area_unit,
      minParkingSpaces: (existing as Row).min_parking_spaces,
    },
    restrictions: input.restrictions ?? {
      petFriendly: (existing as Row).pet_friendly,
      furnished: (existing as Row).furnished,
      minContractMonths: (existing as Row).min_contract_months,
    },
    portals: input.portals ?? (existing as Row).portals ?? [],
    keywords: input.keywords ?? (existing as Row).keywords ?? [],
    excludeKeywords:
      input.excludeKeywords ?? (existing as Row).exclude_keywords ?? [],
    notification: input.notification ?? {
      enabled: (existing as Row).notification_enabled,
      method: (existing as Row).notification_method as
        | "push"
        | "email"
        | "both",
    },
  };

  const row = inputToRow(merged, {
    is_active: input.isActive ?? (existing as Row).is_active,
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await supabaseAdmin
    .from("user_filters")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update filter: ${error.message}`);
  }

  return rowToFilter(data as Row);
}

export async function getFilter(id: string): Promise<UserFilter | null> {
  const { data, error } = await supabaseAdmin
    .from("user_filters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToFilter(data as Row);
}

export async function getFiltersByUser(userId: string): Promise<UserFilter[]> {
  const { data, error } = await supabaseAdmin
    .from("user_filters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as Row[]).map(rowToFilter);
}

export async function getActiveFilters(): Promise<UserFilter[]> {
  const { data, error } = await supabaseAdmin
    .from("user_filters")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as Row[]).map(rowToFilter);
}

export async function deleteFilter(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("user_filters")
    .delete()
    .eq("id", id);

  return !error;
}

export async function deactivateFilter(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("user_filters")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}
