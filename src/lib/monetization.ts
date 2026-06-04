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
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    planId: data.plan_id,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at !== null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const { start, end } = getCurrentPeriod();

  const { data } = await supabaseAdmin
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period_start", start)
    .single();

  if (data) {
    return {
      userId: data.user_id,
      searchAlertsUsed: data.search_alerts_used,
      filtersCreated: data.filters_created,
      tenantProfilesCreated: data.tenant_profiles_created,
      pdfExportsUsed: data.pdf_exports_used,
      periodStart: data.period_start,
      periodEnd: data.period_end,
    };
  }

  const newUsage = {
    user_id: userId,
    period_start: start,
    period_end: end,
    search_alerts_used: 0,
    filters_created: 0,
    tenant_profiles_created: 0,
    pdf_exports_used: 0,
  };

  await supabaseAdmin.from("user_usage").insert(newUsage);

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

  await supabaseAdmin
    .from("user_usage")
    .update({ [field === "searchAlertsUsed" ? "search_alerts_used" : field === "filtersCreated" ? "filters_created" : field === "tenantProfilesCreated" ? "tenant_profiles_created" : "pdf_exports_used"]: newValue })
    .eq("user_id", userId)
    .eq("period_start", usage.periodStart);

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
  const now = new Date().toISOString();

  const { data } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan_id: planId,
      status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  return {
    id: data.id,
    userId: data.user_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    planId: data.plan_id,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription | null> {
  const existing = await getUserSubscription(userId);
  if (!existing) return null;

  const now = new Date().toISOString();

  const { data } = await supabaseAdmin
    .from("subscriptions")
    .update({
      plan_id: updates.planId,
      status: updates.status,
      stripe_subscription_id: updates.stripeSubscriptionId,
      current_period_start: updates.currentPeriodStart,
      current_period_end: updates.currentPeriodEnd,
      updated_at: now,
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    planId: data.plan_id,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at !== null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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
