import { db } from "@/lib/db";
import { subscriptions, userUsage } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { PLANS, type PlanId, type PlanFeatures } from "./stripe";

export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  planId: PlanId;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserUsage {
  userId: string;
  searchAlertsUsed: number;
  filtersCreated: number;
  tenantProfilesCreated: number;
  pdfExportsUsed: number;
  periodStart: string;
  periodEnd: string;
}

function getCurrentPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const rows = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const data = rows[0] || null;

  if (!data) return null;

  return {
    id: data.id,
    userId: data.userId,
    stripeCustomerId: data.stripeCustomerId || "",
    stripeSubscriptionId: data.stripeSubscriptionId,
    planId: (data.planId || "free") as PlanId,
    status: (data.status || "active") as UserSubscription["status"],
    currentPeriodStart: data.currentPeriodStart?.toISOString() || "",
    currentPeriodEnd: data.currentPeriodEnd?.toISOString() || "",
    cancelAtPeriodEnd: data.cancelAt !== null,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const { start, end } = getCurrentPeriod();

  const rows = await db.select().from(userUsage)
    .where(and(eq(userUsage.userId, userId), eq(userUsage.periodStart, start)))
    .limit(1);

  const data = rows[0] || null;

  if (data) {
    return {
      userId: data.userId,
      searchAlertsUsed: data.searchAlertsUsed || 0,
      filtersCreated: data.filtersCreated || 0,
      tenantProfilesCreated: data.tenantProfilesCreated || 0,
      pdfExportsUsed: data.pdfExportsUsed || 0,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    };
  }

  await db.insert(userUsage).values({
    userId,
    periodStart: start,
    periodEnd: end,
    searchAlertsUsed: 0,
    filtersCreated: 0,
    tenantProfilesCreated: 0,
    pdfExportsUsed: 0,
  });

  return {
    userId,
    searchAlertsUsed: 0,
    filtersCreated: 0,
    tenantProfilesCreated: 0,
    pdfExportsUsed: 0,
    periodStart: start,
    periodEnd: end,
  };
}

export async function incrementUsage(
  userId: string,
  field: keyof Omit<UserUsage, "userId" | "periodStart" | "periodEnd">
): Promise<UserUsage> {
  const usage = await getUserUsage(userId);
  const newValue = usage[field] + 1;

  const dbField = field === "searchAlertsUsed" ? "searchAlertsUsed"
    : field === "filtersCreated" ? "filtersCreated"
    : field === "tenantProfilesCreated" ? "tenantProfilesCreated"
    : "pdfExportsUsed";

  await db.update(userUsage)
    .set({ [dbField]: newValue })
    .where(and(eq(userUsage.userId, userId), eq(userUsage.periodStart, usage.periodStart)));

  return { ...usage, [field]: newValue };
}

export async function createSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planId: PlanId,
  status: UserSubscription["status"],
  currentPeriodStart: string,
  currentPeriodEnd: string
): Promise<UserSubscription> {
  const [data] = await db.insert(subscriptions)
    .values({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      planId,
      status,
      currentPeriodStart: new Date(currentPeriodStart),
      currentPeriodEnd: new Date(currentPeriodEnd),
    })
    .returning();

  return {
    id: data.id,
    userId: data.userId,
    stripeCustomerId: data.stripeCustomerId || "",
    stripeSubscriptionId: data.stripeSubscriptionId,
    planId: (data.planId || "free") as PlanId,
    status: (data.status || "active") as UserSubscription["status"],
    currentPeriodStart: data.currentPeriodStart?.toISOString() || "",
    currentPeriodEnd: data.currentPeriodEnd?.toISOString() || "",
    cancelAtPeriodEnd: false,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription | null> {
  const existing = await getUserSubscription(userId);
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (updates.planId !== undefined) updateData.planId = updates.planId;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = updates.stripeSubscriptionId;
  if (updates.currentPeriodStart !== undefined) updateData.currentPeriodStart = new Date(updates.currentPeriodStart);
  if (updates.currentPeriodEnd !== undefined) updateData.currentPeriodEnd = new Date(updates.currentPeriodEnd);
  updateData.updatedAt = new Date();

  const [data] = await db.update(subscriptions)
    .set(updateData)
    .where(eq(subscriptions.userId, userId))
    .returning();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.userId,
    stripeCustomerId: data.stripeCustomerId || "",
    stripeSubscriptionId: data.stripeSubscriptionId,
    planId: (data.planId || "free") as PlanId,
    status: (data.status || "active") as UserSubscription["status"],
    currentPeriodStart: data.currentPeriodStart?.toISOString() || "",
    currentPeriodEnd: data.currentPeriodEnd?.toISOString() || "",
    cancelAtPeriodEnd: data.cancelAt !== null,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  const sub = await getUserSubscription(userId);
  if (!sub || sub.status !== "active") return "free";
  return sub.planId;
}

export async function getUserPlanFeatures(userId: string): Promise<PlanFeatures> {
  const planId = await getUserPlan(userId);
  return PLANS[planId].features as PlanFeatures;
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<{ allowed: boolean; reason?: string }> {
  const features = await getUserPlanFeatures(userId);
  const usage = await getUserUsage(userId);

  const featureValue = features[feature];

  if (typeof featureValue === "boolean") {
    if (!featureValue) {
      return {
        allowed: false,
        reason: `Esta función requiere plan Premium. Actualizá tu plan para desbloquearla.`,
      };
    }
    return { allowed: true };
  }

  if (typeof featureValue === "number") {
    const numValue = featureValue as number;
    if (numValue === -1) {
      return { allowed: true };
    }

    let used = 0;
    switch (feature) {
      case "maxSearchAlerts":
        used = usage.searchAlertsUsed;
        break;
      case "maxFilters":
        used = usage.filtersCreated;
        break;
    }

    if (used >= numValue) {
      return {
        allowed: false,
        reason: `Alcanzaste el límite de ${numValue} para el plan gratuito. Actualizá a Premium para acceso ilimitado.`,
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
}

export function getPlanLimitsSummary(planId: PlanId): {
  plan: string;
  price: string;
  alerts: string;
  filters: string;
  features: string[];
} {
  const plan = PLANS[planId];
  const features = plan.features;

  return {
    plan: plan.name,
    price:
      plan.price === 0
        ? "Gratis"
        : `$${plan.price.toLocaleString("es-AR")}/mes`,
    alerts:
      features.maxSearchAlerts === -1
        ? "Ilimitadas"
        : `${features.maxSearchAlerts} alerta(s)`,
    filters:
      features.maxFilters === -1
        ? "Ilimitados"
        : `${features.maxFilters} filtro(s)`,
    features: [
      features.realTimeAlerts ? "Alertas en tiempo real" : null,
      features.tenantProfile ? "Ficha de inquilino verificada" : null,
      features.rentCalculator ? "Calculadora de aumentos" : null,
      features.prioritySupport ? "Soporte prioritario" : null,
      (features as Record<string, unknown>).multiProperty
        ? "Gestión multi-propiedad"
        : null,
      (features as Record<string, unknown>).analytics
        ? "Analytics avanzados"
        : null,
    ].filter(Boolean) as string[],
  };
}
