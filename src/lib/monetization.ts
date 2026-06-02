import { supabaseAdmin } from "./supabase";
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
  lastResetAt: string;
}

const subscriptionsStore = new Map<string, UserSubscription>();
const usageStore = new Map<string, UserUsage>();

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const local = subscriptionsStore.get(userId);
  if (local) return local;

  const { data } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) {
    const sub: UserSubscription = {
      id: data.id,
      userId: data.user_id,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      planId: data.plan_id,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    subscriptionsStore.set(userId, sub);
    return sub;
  }

  return null;
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const local = usageStore.get(userId);
  if (local) return local;

  const { data } = await supabaseAdmin
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) {
    const usage: UserUsage = {
      userId: data.user_id,
      searchAlertsUsed: data.search_alerts_used,
      filtersCreated: data.filters_created,
      tenantProfilesCreated: data.tenant_profiles_created,
      pdfExportsUsed: data.pdf_exports_used,
      lastResetAt: data.last_reset_at,
    };
    usageStore.set(userId, usage);
    return usage;
  }

  const newUsage: UserUsage = {
    userId,
    searchAlertsUsed: 0,
    filtersCreated: 0,
    tenantProfilesCreated: 0,
    pdfExportsUsed: 0,
    lastResetAt: new Date().toISOString(),
  };

  await supabaseAdmin.from("user_usage").insert({
    user_id: userId,
    search_alerts_used: 0,
    filters_created: 0,
    tenant_profiles_created: 0,
    pdf_exports_used: 0,
    last_reset_at: newUsage.lastResetAt,
  });

  usageStore.set(userId, newUsage);
  return newUsage;
}

export async function incrementUsage(
  userId: string,
  field: keyof Omit<UserUsage, "userId" | "lastResetAt">
): Promise<UserUsage> {
  const usage = await getUserUsage(userId);

  const updated = {
    ...usage,
    [field]: usage[field] + 1,
  };

  await supabaseAdmin
    .from("user_usage")
    .update({ [field]: updated[field] })
    .eq("user_id", userId);

  usageStore.set(userId, updated);
  return updated;
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
  const now = new Date().toISOString();
  const sub: UserSubscription = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };

  await supabaseAdmin.from("user_subscriptions").insert({
    id: sub.id,
    user_id: sub.userId,
    stripe_customer_id: sub.stripeCustomerId,
    stripe_subscription_id: sub.stripeSubscriptionId,
    plan_id: sub.planId,
    status: sub.status,
    current_period_start: sub.currentPeriodStart,
    current_period_end: sub.currentPeriodEnd,
    cancel_at_period_end: sub.cancelAtPeriodEnd,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
  });

  subscriptionsStore.set(userId, sub);
  return sub;
}

export async function updateSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription | null> {
  const existing = await getUserSubscription(userId);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      plan_id: updated.planId,
      status: updated.status,
      stripe_subscription_id: updated.stripeSubscriptionId,
      current_period_start: updated.currentPeriodStart,
      current_period_end: updated.currentPeriodEnd,
      cancel_at_period_end: updated.cancelAtPeriodEnd,
      updated_at: updated.updatedAt,
    })
    .eq("user_id", userId);

  subscriptionsStore.set(userId, updated);
  return updated;
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
