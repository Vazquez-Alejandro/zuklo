import { parseProperty, type ParsedProperty } from "./parser";
import { getActiveFilters, type UserFilter } from "./filters";
import { matchPropertyAgainstAllFilters, type MatchResult } from "./matcher";
import { sendPropertyAlert } from "./notifications";
import type { NormalizedProperty } from "@/types/property";

export interface NotificationLog {
  id: string;
  propertyId: string;
  filterId: string;
  filterName: string;
  userId: string;
  status: "sent" | "failed" | "no-token";
  timestamp: string;
}

const notificationLogs: NotificationLog[] = [];

interface UserDeviceTokens {
  userId: string;
  tokens: string[];
}

const userTokensStore = new Map<string, string[]>();

export function registerDeviceToken(userId: string, token: string): void {
  const existing = userTokensStore.get(userId) || [];
  if (!existing.includes(token)) {
    existing.push(token);
    userTokensStore.set(userId, existing);
  }
}

export function removeDeviceToken(userId: string, token: string): void {
  const existing = userTokensStore.get(userId) || [];
  userTokensStore.set(
    userId,
    existing.filter((t) => t !== token)
  );
}

export function getUserTokens(userId: string): string[] {
  return userTokensStore.get(userId) || [];
}

export async function processNewProperty(
  property: NormalizedProperty,
  rawItem?: Record<string, unknown>
): Promise<{
  parsed: ParsedProperty;
  matches: MatchResult[];
  notifications: NotificationLog[];
}> {
  const parsed = parseProperty(property, rawItem);
  const activeFilters = getActiveFilters();
  const matches = matchPropertyAgainstAllFilters(parsed, activeFilters);

  const notifications: NotificationLog[] = [];

  for (const match of matches) {
    const filter = activeFilters.find((f) => f.id === match.filterId);
    if (!filter) continue;

    const tokens = getUserTokens(filter.userId);

    if (tokens.length === 0) {
      notifications.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        propertyId: parsed.id,
        filterId: filter.id,
        filterName: filter.name,
        userId: filter.userId,
        status: "no-token",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const result = await sendPropertyAlert(
      tokens,
      {
        id: parsed.id,
        title: parsed.title,
        price: parsed.price,
        currency: parsed.currency,
        city: parsed.location.city,
        bedrooms: parsed.features.bedrooms,
        bathrooms: parsed.features.bathrooms,
        area: parsed.features.area,
        mainImage: parsed.mainImage,
        url: parsed.url,
      },
      filter.name
    );

    notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      propertyId: parsed.id,
      filterId: filter.id,
      filterName: filter.name,
      userId: filter.userId,
      status: result.success > 0 ? "sent" : "failed",
      timestamp: new Date().toISOString(),
    });
  }

  notificationLogs.push(...notifications);

  return { parsed, matches, notifications };
}

export async function processBatchProperties(
  properties: NormalizedProperty[],
  rawItems?: Record<string, unknown>[]
): Promise<{
  total: number;
  matched: number;
  notificationsSent: number;
  results: Array<{
    propertyId: string;
    matches: number;
    notifications: number;
  }>;
}> {
  const results: Array<{
    propertyId: string;
    matches: number;
    notifications: number;
  }> = [];

  let totalMatched = 0;
  let totalNotifications = 0;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const rawItem = rawItems?.[i];

    const { matches, notifications } = await processNewProperty(
      property,
      rawItem
    );

    totalMatched += matches.length;
    totalNotifications += notifications.filter(
      (n) => n.status === "sent"
    ).length;

    results.push({
      propertyId: property.id,
      matches: matches.length,
      notifications: notifications.length,
    });
  }

  return {
    total: properties.length,
    matched: totalMatched,
    notificationsSent: totalNotifications,
    results,
  };
}

export function getNotificationLogs(
  filterId?: string,
  limit: number = 50
): NotificationLog[] {
  let logs = notificationLogs;
  if (filterId) {
    logs = logs.filter((l) => l.filterId === filterId);
  }
  return logs.slice(-limit);
}
