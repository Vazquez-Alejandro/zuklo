export interface NormalizedProperty {
  id: string;
  portal: string;
  portalId: string;
  url: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    lat?: number;
    lng?: number;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    areaUnit: string;
    parkingSpaces?: number;
    furnished?: boolean;
    petFriendly?: boolean;
  };
  images: string[];
  landlord?: {
    name: string;
    phone?: string;
    email?: string;
  };
  publishedAt: string;
  scrapedAt: string;
}

export interface PortalConfig {
  name: string;
  slug: string;
  actorId: string;
  urlPatterns: RegExp[];
  inputMapper: (url: string) => Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputMapper: (item: Record<string, any>) => Partial<NormalizedProperty>;
}

export interface ScrapingJob {
  id: string;
  url: string;
  portal: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: NormalizedProperty[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScrapingQueueConfig {
  intervalMinutes: number;
  portals: string[];
  maxConcurrent: number;
}
