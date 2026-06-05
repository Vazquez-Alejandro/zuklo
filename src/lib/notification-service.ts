import { parseProperty, type ParsedProperty } from "./parser";
import { getActiveFilters } from "./filters";
import { matchPropertyAgainstAllFilters, type MatchResult } from "./matcher";
import { sendPropertyAlert } from "./notifications";
import { db } from "@/lib/db";
import { deviceTokens, notificationLogs } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
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

export async function registerDeviceToken(userId: string, token: string): Promise<void> {
  const rows = await db.select({ id: deviceTokens.id })
    .from(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)))
    .limit(1);

  if (rows[0]) return;

  await db.insert(deviceTokens).values({
    id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    token,
    isActive: true,
  });
}

export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await db.delete(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
}

export async function getUserTokens(userId: string): Promise<string[]> {
  const rows = await db.select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));

  return rows.map((row) => row.token);
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
  const activeFilters = await getActiveFilters();
  const matches = matchPropertyAgainstAllFilters(parsed, activeFilters);

  const notifications: NotificationLog[] = [];

  for (const match of matches) {
    const filter = activeFilters.find((f) => f.id === match.filterId);
    if (!filter) continue;

    const tokens = await getUserTokens(filter.userId);

    if (tokens.length === 0) {
      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        propertyId: parsed.id,
        filterId: filter.id,
        filterName: filter.name,
        userId: filter.userId,
        status: "no-token",
        timestamp: new Date().toISOString(),
      };
      notifications.push(log);
      await db.insert(notificationLogs).values({
        id: log.id,
        propertyId: log.propertyId,
        filterId: log.filterId,
        filterName: log.filterName,
        userId: log.userId,
        status: log.status,
        sentAt: new Date(log.timestamp),
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

    const log: NotificationLog = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      propertyId: parsed.id,
      filterId: filter.id,
      filterName: filter.name,
      userId: filter.userId,
      status: result.success > 0 ? "sent" : "failed",
      timestamp: new Date().toISOString(),
    };
    notifications.push(log);

    await db.insert(notificationLogs).values({
      id: log.id,
      propertyId: log.propertyId,
      filterId: log.filterId,
      filterName: log.filterName,
      userId: log.userId,
      status: log.status,
      sentAt: new Date(log.timestamp),
    });
  }

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

export async function getNotificationLogs(
  filterId?: string,
  limit: number = 50
): Promise<NotificationLog[]> {
  const conditions = filterId
    ? eq(notificationLogs.filterId, filterId)
    : undefined;

  const data = await db.select().from(notificationLogs)
    .where(conditions)
    .orderBy(desc(notificationLogs.sentAt))
    .limit(limit);

  return (data || []).map((row) => ({
    id: row.id,
    propertyId: row.propertyId,
    filterId: row.filterId,
    filterName: row.filterName,
    userId: row.userId,
    status: row.status as NotificationLog["status"],
    timestamp: row.sentAt?.toISOString() || row.createdAt.toISOString(),
  }));
}
