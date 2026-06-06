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
    name: "Zonaprop",
    slug: "zonaprop",
    actorId: "ocrad/zonaprop-property-scraper",
    urlPatterns: [/zonaprop\.com\.ar/i],
    inputMapper: (url) => ({
      urls: [url],
      max_items_per_url: 50,
      max_retries_per_url: 2,
      ignore_url_failures: true,
    }),
    outputMapper: (item) => ({
      portal: "zonaprop",
      portalId: String(item.listingId || item.id || ""),
      url: item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(item.price || item.priceArs || 0),
      currency: item.currency || item.priceDisplayCurrency || "ARS",
      location: {
        address: item.address || "",
        city: item.city || item.neighborhood || "",
        state: item.province || "",
        country: "AR",
        zip: "",
        lat: item.latitude ? Number(item.latitude) : undefined,
        lng: item.longitude ? Number(item.longitude) : undefined,
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.totalArea || item.coveredArea || 0),
        areaUnit: "m2",
        parkingSpaces: Number(item.garages || 0),
        furnished: undefined,
        petFriendly: undefined,
      },
      images: Array.isArray(item.images) ? item.images : [],
      publishedAt: item.publishDate || item.publishedAt || new Date().toISOString(),
    }),
  },
  {
    name: "Argenprop",
    slug: "argenprop",
    actorId: "ecomscrape/argenprop-property-search-scraper",
    urlPatterns: [/argenprop\.com\.ar/i],
    inputMapper: (url) => ({
      urls: [url],
      max_items_per_url: 50,
      max_retries_per_url: 2,
      ignore_url_failures: true,
    }),
    outputMapper: (item) => ({
      portal: "argenprop",
      portalId: String(item.listingId || item.id || ""),
      url: item.url || "",
      title: item.title || "",
      description: item.description || "",
      price: Number(String(item.price).replace(/[^0-9]/g, "") || 0),
      currency: "ARS",
      location: {
        address: item.address || "",
        city: item.city || "",
        state: item.province || "",
        country: "AR",
        zip: "",
        lat: item.latitude ? Number(item.latitude) : undefined,
        lng: item.longitude ? Number(item.longitude) : undefined,
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        area: Number(item.totalArea || item.coveredArea || 0),
        areaUnit: "m2",
        parkingSpaces: Number(item.garages || 0),
        furnished: undefined,
        petFriendly: undefined,
      },
      images: Array.isArray(item.images) ? item.images : [],
      publishedAt: item.publishDate || item.publishedAt || new Date().toISOString(),
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
