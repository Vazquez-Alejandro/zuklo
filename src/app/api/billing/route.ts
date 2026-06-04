import { NextRequest, NextResponse } from "next/server";
import {
  PLANS,
  createCheckoutSession,
  createBillingPortalSession,
  createStripeCustomer,
  getStripeCustomerByEmail,
  getCustomerSubscriptions,
  cancelSubscription,
  type PlanId,
} from "@/lib/stripe";
import { getUserPlan, getUserUsage, checkFeatureAccess, getPlanLimitsSummary } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`billing:post:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { action, planId } = body;

    switch (action) {
      case "checkout": {
        if (!planId || !PLANS[planId as PlanId]) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/billing", 400, duration, user.id);
          return NextResponse.json(
            { error: "Invalid plan ID" },
            { status: 400 }
          );
        }

        const plan = PLANS[planId as PlanId];
        if (!plan.stripePriceId) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/billing", 400, duration, user.id);
          return NextResponse.json(
            { error: "This plan cannot be purchased" },
            { status: 400 }
          );
        }

        let customer = await getStripeCustomerByEmail(user.email!);
        if (!customer) {
          customer = await createStripeCustomer(
            user.email!,
            user.user_metadata?.full_name || user.email!,
            { userId: user.id }
          );
        }

        const session = await createCheckoutSession(
          customer.id,
          plan.stripePriceId,
          `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
          { userId: user.id, planId }
        );

        const duration = Date.now() - start;
        logRequest("POST", "/api/billing", 200, duration, user.id);
        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
        });
      }

      case "portal": {
        const customer = await getStripeCustomerByEmail(user.email!);
        if (!customer) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/billing", 404, duration, user.id);
          return NextResponse.json(
            { error: "No billing account found" },
            { status: 404 }
          );
        }

        const session = await createBillingPortalSession(
          customer.id,
          `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        );

        const duration = Date.now() - start;
        logRequest("POST", "/api/billing", 200, duration, user.id);
        return NextResponse.json({
          url: session.url,
        });
      }

      case "cancel": {
        const currentPlan = await getUserPlan(user.id);
        if (currentPlan === "free") {
          const duration = Date.now() - start;
          logRequest("POST", "/api/billing", 400, duration, user.id);
          return NextResponse.json(
            { error: "No active subscription to cancel" },
            { status: 400 }
          );
        }

        const subscriptions = await getCustomerSubscriptions(
          (await getStripeCustomerByEmail(user.email!))?.id || ""
        );

        if (subscriptions.data.length === 0) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/billing", 404, duration, user.id);
          return NextResponse.json(
            { error: "No active subscription found" },
            { status: 404 }
          );
        }

        await cancelSubscription(subscriptions.data[0].id);

        const duration = Date.now() - start;
        logRequest("POST", "/api/billing", 200, duration, user.id);
        return NextResponse.json({
          canceled: true,
          message: "Subscription will be canceled at the end of the billing period",
        });
      }

      default:
        const duration = Date.now() - start;
        logRequest("POST", "/api/billing", 400, duration, user.id);
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/billing", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Billing error:", error);
    const duration = Date.now() - start;
    logRequest("POST", "/api/billing", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`billing:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const planId = await getUserPlan(user.id);
    const usage = await getUserUsage(user.id);
    const features = await checkFeatureAccess(user.id, "maxSearchAlerts");
    const limitsSummary = getPlanLimitsSummary(planId);

    const duration = Date.now() - start;
    logRequest("GET", "/api/billing", 200, duration, user.id);
    return NextResponse.json({
      plan: limitsSummary,
      usage: {
        searchAlerts: usage.searchAlertsUsed,
        filters: usage.filtersCreated,
        tenantProfiles: usage.tenantProfilesCreated,
        pdfExports: usage.pdfExportsUsed,
      },
      featureCheck: features,
      subscription: {
        planId,
        isPremium: planId !== "free",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/billing", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/billing", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
