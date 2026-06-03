import { parseProperty, type ParsedProperty } from "./parser";
import { getActiveFilters } from "./filters";
import { matchPropertyAgainstAllFilters, type MatchResult } from "./matcher";
import { sendPropertyAlert } from "./notifications";
import { supabaseAdmin } from "./supabase";
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
  const { data: existing } = await supabaseAdmin
    .from("device_tokens")
    .select("id")
    .eq("user_id", userId)
    .eq("token", token)
    .single();

  if (existing) return;

  await supabaseAdmin.from("device_tokens").insert({
    user_id: userId,
    token,
    is_active: true,
  });
}

export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await supabaseAdmin
    .from("device_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);
}

export async function getUserTokens(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("device_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("is_active", true);

  return data?.map((row) => row.token) || [];
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
      await supabaseAdmin.from("notification_logs").insert({
        id: log.id,
        property_id: log.propertyId,
        filter_id: log.filterId,
        filter_name: log.filterName,
        user_id: log.userId,
        status: log.status,
        sent_at: log.timestamp,
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

    await supabaseAdmin.from("notification_logs").insert({
      id: log.id,
      property_id: log.propertyId,
      filter_id: log.filterId,
      filter_name: log.filterName,
      user_id: log.userId,
      status: log.status,
      sent_at: log.timestamp,
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
  let query = supabaseAdmin
    .from("notification_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (filterId) {
    query = query.eq("filter_id", filterId);
  }

  const { data } = await query;

  return (data || []).map((row) => ({
    id: row.id,
    propertyId: row.property_id,
    filterId: row.filter_id,
    filterName: row.filter_name,
    userId: row.user_id,
    status: row.status,
    timestamp: row.sent_at,
  }));
}
