import type { NormalizedProperty } from "@/types/property";

export interface ParsedProperty {
  id: string;
  portal: string;
  portalId: string;
  url: string;
  title: string;
  description: string;

  price: number;
  currency: string;
  expenses: number;
  pricePerSqm: number;

  location: {
    address: string;
    fullAddress: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    lat: number | null;
    lng: number | null;
  };

  features: {
    bedrooms: number;
    bathrooms: number;
    totalRooms: number;
    area: number;
    areaUnit: string;
    coveredArea: number;
    landArea: number;
    parkingSpaces: number;
    floor: number | null;
    totalFloors: number | null;
    yearBuilt: number | null;
  };

  restrictions: {
    furnished: boolean | null;
    petFriendly: boolean | null;
    petTypes: string[];
    minContractMonths: number | null;
    allowedForStudents: boolean | null;
    allowedForPets: boolean | null;
  };

  amenities: string[];

  images: string[];
  mainImage: string;

  landlord: {
    name: string;
    phone: string | null;
    email: string | null;
    type: "owner" | "agent" | "platform";
  } | null;

  publishedAt: string;
  scrapedAt: string;
  parsedAt: string;
}

const EXPENSE_PATTERNS = [
  /expensas?\s*[:\$]?\s*([\d.,]+)/i,
  /expenses?\s*[:\$]?\s*([\d.,]+)/i,
  /commun[ae]s?\s*[:\$]?\s*([\d.,]+)/i,
  /maintenance?\s*[:\$]?\s*([\d.,]+)/i,
  /condominio\s*[:\$]?\s*([\d.,]+)/i,
];

const AMENITY_KEYWORDS = [
  "piscina", "pool", "gym", "gimnasio", "quincho", "parrilla", "bbq",
  "laundry", "lavadero", "estacionamiento", "parking", "garage", "cochera",
  "seguridad", "security", "garden", "jardín", "terrace", "terrazas",
  "balcony", "balcón", "balcon", "amoblado", "furnished", "aire acondicionado",
  "ac", "heating", "calefacción", "calefaccion", "elevator", "ascensor",
  "storage", "depósito", "deposito", "bbq", "quincho", "party room",
  "salón de fiestas", "salon de fiestas", "coworking", "workspace",
  "roof deck", "terraza", "views", "vistas", "beachfront", "frente al mar",
  "lakefront", "frente al lago", "mountain view", "vista a la montaña",
];

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function extractExpenses(text: string): number {
  for (const pattern of EXPENSE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return parseNumber(match[1]);
    }
  }
  return 0;
}

function extractAmenities(text: string): string[] {
  const lower = text.toLowerCase();
  return AMENITY_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

function extractRestrictions(
  property: NormalizedProperty,
  rawItem?: Record<string, unknown>
): ParsedProperty["restrictions"] {
  const desc = (property.description || "").toLowerCase();
  const raw = rawItem || {};

  return {
    furnished: property.features.furnished ?? (raw.furnished as boolean) ?? null,
    petFriendly:
      property.features.petFriendly ??
      (raw.pet_friendly as boolean) ??
      desc.includes("mascota") ||
        desc.includes("pet") ||
        desc.includes("permite mascotas"),
    petTypes: desc.includes("gato") || desc.includes("cat")
      ? ["dog", "cat"]
      : desc.includes("mascota") || desc.includes("pet")
        ? ["dog", "cat"]
        : [],
    minContractMonths: (raw.min_contract_months as number) ?? null,
    allowedForStudents:
      desc.includes("estudiante") || desc.includes("student") || null,
    allowedForPets:
      desc.includes("mascota") || desc.includes("pet") || desc.includes("permite") || null,
  };
}

export function parseProperty(
  property: NormalizedProperty,
  rawItem?: Record<string, unknown>
): ParsedProperty {
  const desc = property.description || "";
  const expenses = extractExpenses(desc);
  const amenities = extractAmenities(desc);
  const restrictions = extractRestrictions(property, rawItem);

  const pricePerSqm =
    property.features.area > 0
      ? Math.round(property.price / property.features.area)
      : 0;

  const fullAddress = [
    property.location.address,
    property.location.city,
    property.location.state,
    property.location.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: property.id,
    portal: property.portal,
    portalId: property.portalId,
    url: property.url,
    title: property.title,
    description: property.description,

    price: property.price,
    currency: property.currency,
    expenses,
    pricePerSqm,

    location: {
      address: property.location.address,
      fullAddress,
      city: property.location.city,
      state: property.location.state,
      country: property.location.country,
      zip: property.location.zip,
      lat: property.location.lat ?? null,
      lng: property.location.lng ?? null,
    },

    features: {
      bedrooms: property.features.bedrooms,
      bathrooms: property.features.bathrooms,
      totalRooms: property.features.bedrooms + property.features.bathrooms,
      area: property.features.area,
      areaUnit: property.features.areaUnit,
      coveredArea: (rawItem?.covered_area as number) ?? property.features.area,
      landArea: (rawItem?.land_area as number) ?? 0,
      parkingSpaces: property.features.parkingSpaces ?? 0,
      floor: (rawItem?.floor as number) ?? null,
      totalFloors: (rawItem?.total_floors as number) ?? null,
      yearBuilt: (rawItem?.year_built as number) ?? null,
    },

    restrictions,

    amenities,

    images: property.images.filter(Boolean),
    mainImage: property.images[0] || "",

    landlord: property.landlord
      ? {
          name: property.landlord.name,
          phone: property.landlord.phone ?? null,
          email: property.landlord.email ?? null,
          type: "agent",
        }
      : null,

    publishedAt: property.publishedAt,
    scrapedAt: property.scrapedAt,
    parsedAt: new Date().toISOString(),
  };
}

export function parseProperties(
  properties: NormalizedProperty[],
  rawItems?: Record<string, unknown>[]
): ParsedProperty[] {
  return properties.map((prop, i) =>
    parseProperty(prop, rawItems?.[i])
  );
}
