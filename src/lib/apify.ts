import { ApifyClient } from "apify-client";
import type {
  NormalizedProperty,
  PortalConfig,
} from "@/types/property";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

const PORTALS: PortalConfig[] = [
  {
    name: "Zillow",
    slug: "zillow",
    actorId: "jupri/zillow-scraper",
    urlPatterns: [/zillow\.com/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "zillow",
      portalId: String(item.zpid || item.id || ""),
      url: item.detailUrl || item.url || "",
      title: item.addressStreet || item.address || "",
      description: item.description || "",
      price: Number(item.price || item.rentZestimate || 0),
      currency: "USD",
      location: {
        address: item.addressStreet || "",
        city: item.addressCity || "",
        state: item.addressState || "",
        country: "US",
        zip: item.addressZipcode || "",
        lat: item.latitude ? Number(item.latitude) : undefined,
        lng: item.longitude ? Number(item.longitude) : undefined,
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.livingArea || 0),
        areaUnit: "sqft",
        parkingSpaces: Number(item.garageSpaces || 0),
        furnished: undefined,
        petFriendly: undefined,
      },
      images: (item.imgSrc ? [item.imgSrc] : []).concat(
        Array.isArray(item.carouselPhotos)
          ? item.carouselPhotos.map((p: Record<string, string>) => p.url || "")
          : []
      ),
      publishedAt: item.datePosted || new Date().toISOString(),
    }),
  },
  {
    name: "Realtor",
    slug: "realtor",
    actorId: "jupri/realtor-scraper",
    urlPatterns: [/realtor\.com/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "realtor",
      portalId: String(item.property_id || item.id || ""),
      url: item.permalink ? `https://www.realtor.com${item.permalink}` : "",
      title: item.location?.address?.line || "",
      description: item.description || "",
      price: Number(item.list_price || item.price || 0),
      currency: "USD",
      location: {
        address: item.location?.address?.line || "",
        city: item.location?.address?.city || "",
        state: item.location?.address?.state_code || "",
        country: "US",
        zip: item.location?.address?.postal_code || "",
        lat: item.location?.address?.coordinate?.lat,
        lng: item.location?.address?.coordinate?.lon,
      },
      features: {
        bedrooms: Number(item.description?.beds || 0),
        bathrooms: Number(item.description?.baths || 0),
        area: Number(item.description?.sqft || 0),
        areaUnit: "sqft",
        parkingSpaces: Number(item.description?.garage || 0),
        furnished: undefined,
        petFriendly: undefined,
      },
      images: Array.isArray(item.primary_photo?.href)
        ? [item.primary_photo.href]
        : [],
      publishedAt: item.list_date || new Date().toISOString(),
    }),
  },
  {
    name: "ZAP Imóveis",
    slug: "zap",
    actorId: "jupri/zap-imoveis-scraper",
    urlPatterns: [/zapimoveis\.com\.br/i, /zap\.com\.br/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "zap",
      portalId: String(item.id || ""),
      url: item.link || item.url || "",
      title: item.subject || item.title || "",
      description: item.body || item.description || "",
      price: Number(item.pricingInfos?.[0]?.price || item.price || 0),
      currency: "BRL",
      location: {
        address: item.address?.street || "",
        city: item.address?.city || "",
        state: item.address?.state || "",
        country: "BR",
        zip: item.address?.zipCode || "",
        lat: item.address?.geoLocation?.lat,
        lng: item.address?.geoLocation?.lon,
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.usableAreas?.[0] || item.totalAreas?.[0] || 0),
        areaUnit: "m2",
        furnished: item.furnished === "SIM",
        petFriendly: undefined,
      },
      images: Array.isArray(item.medias)
        ? item.medias.map((m: Record<string, string>) => m.url || "")
        : [],
      publishedAt: item.createdAt || new Date().toISOString(),
    }),
  },
  {
    name: "VivaReal",
    slug: "vivareal",
    actorId: "jupri/vivareal-scraper",
    urlPatterns: [/vivareal\.com\.br/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "vivareal",
      portalId: String(item.id || ""),
      url: item.link || item.url || "",
      title: item.subject || item.title || "",
      description: item.body || item.description || "",
      price: Number(item.pricingInfos?.[0]?.price || item.price || 0),
      currency: "BRL",
      location: {
        address: item.address?.street || "",
        city: item.address?.city || "",
        state: item.address?.state || "",
        country: "BR",
        zip: item.address?.zipCode || "",
        lat: item.address?.geoLocation?.lat,
        lng: item.address?.geoLocation?.lon,
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.usableAreas?.[0] || item.totalAreas?.[0] || 0),
        areaUnit: "m2",
        furnished: item.furnished === "SIM",
        petFriendly: undefined,
      },
      images: Array.isArray(item.medias)
        ? item.medias.map((m: Record<string, string>) => m.url || "")
        : [],
      publishedAt: item.createdAt || new Date().toISOString(),
    }),
  },
  {
    name: "Zonaprop",
    slug: "zonaprop",
    actorId: "jupri/zonaprop-scraper",
    urlPatterns: [/zonaprop\.com\.ar/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "zonaprop",
      portalId: String(item.id || ""),
      url: item.link || item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(item.price || 0),
      currency: "ARS",
      location: {
        address: item.location?.address || "",
        city: item.location?.city || "",
        state: item.location?.province || "",
        country: "AR",
        zip: item.location?.zip || "",
        lat: item.location?.latitude,
        lng: item.location?.longitude,
      },
      features: {
        bedrooms: Number(item.rooms || item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.surface_total || 0),
        areaUnit: "m2",
        furnished: item.furnished,
        petFriendly: item.pet_friendly,
      },
      images: Array.isArray(item.images)
        ? item.images.map((i: Record<string, string>) => i.url || "")
        : [],
      publishedAt: item.created_at || new Date().toISOString(),
    }),
  },
  {
    name: "Argenprop",
    slug: "argenprop",
    actorId: "jupri/argenprop-scraper",
    urlPatterns: [/argenprop\.com\.ar/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "argenprop",
      portalId: String(item.id || ""),
      url: item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(item.price || 0),
      currency: "ARS",
      location: {
        address: item.location?.address || "",
        city: item.location?.city || "",
        state: item.location?.province || "",
        country: "AR",
        zip: item.location?.zip || "",
        lat: item.location?.latitude,
        lng: item.location?.longitude,
      },
      features: {
        bedrooms: Number(item.rooms || item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.surface_total || 0),
        areaUnit: "m2",
        furnished: item.furnished,
        petFriendly: item.pet_friendly,
      },
      images: Array.isArray(item.images)
        ? item.images.map((i: Record<string, string>) => i.url || "")
        : [],
      publishedAt: item.created_at || new Date().toISOString(),
    }),
  },
  {
    name: "MercadoLibre",
    slug: "mercadolibre",
    actorId: "jupri/mercadolibre-scraper",
    urlPatterns: [/mercadolibre\.com\.ar/i, /mercadolibre\.com\.uy/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "mercadolibre",
      portalId: String(item.id || ""),
      url: item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(item.price || 0),
      currency: "ARS",
      location: {
        address: item.location?.address || "",
        city: item.location?.city || "",
        state: item.location?.state || "",
        country: "AR",
        zip: item.location?.zip || "",
      },
      features: {
        bedrooms: Number(item.attributes?.bedrooms || 0),
        bathrooms: Number(item.attributes?.bathrooms || 0),
        area: Number(item.attributes?.total_area || 0),
        areaUnit: "m2",
      },
      images: Array.isArray(item.pictures)
        ? item.pictures.map((p: Record<string, string>) => p.url || "")
        : [],
      publishedAt: item.date_created || new Date().toISOString(),
    }),
  },
  {
    name: "OLX",
    slug: "olx",
    actorId: "jupri/olx-scraper",
    urlPatterns: [/olx\.com\.ar/i, /olx\.com\.br/i, /olx\.pl/i],
    inputMapper: (url) => ({ startUrls: [{ url }], maxItems: 50 }),
    outputMapper: (item) => ({
      portal: "olx",
      portalId: String(item.id || ""),
      url: item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(item.price || 0),
      currency: "ARS",
      location: {
        address: item.location?.address || "",
        city: item.location?.city || "",
        state: item.location?.state || "",
        country: "AR",
      },
      features: {
        bedrooms: Number(item.attributes?.bedrooms || 0),
        bathrooms: Number(item.attributes?.bathrooms || 0),
        area: Number(item.attributes?.area || 0),
        areaUnit: "m2",
      },
      images: Array.isArray(item.images)
        ? item.images.map((i: Record<string, string>) => i.url || "")
        : [],
      publishedAt: item.created_at || new Date().toISOString(),
    }),
  },
];

export function detectPortal(url: string): PortalConfig | null {
  for (const portal of PORTALS) {
    for (const pattern of portal.urlPatterns) {
      if (pattern.test(url)) {
        return portal;
      }
    }
  }
  return null;
}

export function getPortalBySlug(slug: string): PortalConfig | null {
  return PORTALS.find((p) => p.slug === slug) || null;
}

export function getAllPortals(): PortalConfig[] {
  return PORTALS;
}

export async function scrapeUrl(url: string): Promise<NormalizedProperty[]> {
  const portal = detectPortal(url);
  if (!portal) {
    throw new Error(`No portal detected for URL: ${url}`);
  }

  const input = portal.inputMapper(url);

  const run = await client.actor(portal.actorId).call(input, {
    waitSecs: 120,
  });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  const normalized: NormalizedProperty[] = items.map((item) => {
    const base = portal.outputMapper(item as Record<string, unknown>);
    return {
      id: `${portal.slug}-${base.portalId}-${Date.now()}`,
      portal: portal.slug,
      portalId: base.portalId || "",
      url: base.url || url,
      title: base.title || "",
      description: base.description || "",
      price: base.price || 0,
      currency: base.currency || "USD",
      location: base.location || {
        address: "",
        city: "",
        state: "",
        country: "",
        zip: "",
      },
      features: base.features || {
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        areaUnit: "sqft",
      },
      images: base.images || [],
      publishedAt: base.publishedAt || new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
    };
  });

  return normalized;
}

export async function scrapePortal(
  slug: string,
  maxItems: number = 50
): Promise<NormalizedProperty[]> {
  const portal = getPortalBySlug(slug);
  if (!portal) {
    throw new Error(`Unknown portal: ${slug}`);
  }

  const input = {
    maxItems,
    ...portal.inputMapper(`https://www.${portal.slug}.com`),
  };

  const run = await client.actor(portal.actorId).call(input, {
    waitSecs: 180,
  });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  return items.map((item) => {
    const base = portal.outputMapper(item as Record<string, unknown>);
    return {
      id: `${portal.slug}-${base.portalId}-${Date.now()}`,
      portal: portal.slug,
      portalId: base.portalId || "",
      url: base.url || "",
      title: base.title || "",
      description: base.description || "",
      price: base.price || 0,
      currency: base.currency || "USD",
      location: base.location || {
        address: "",
        city: "",
        state: "",
        country: "",
        zip: "",
      },
      features: base.features || {
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        areaUnit: "sqft",
      },
      images: base.images || [],
      landlord: base.landlord,
      publishedAt: base.publishedAt || new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
    };
  });
}
