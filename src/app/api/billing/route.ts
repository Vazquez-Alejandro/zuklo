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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { action, planId } = body;

    switch (action) {
      case "checkout": {
        if (!planId || !PLANS[planId as PlanId]) {
          return NextResponse.json(
            { error: "Invalid plan ID" },
            { status: 400 }
          );
        }

        const plan = PLANS[planId as PlanId];
        if (!plan.stripePriceId) {
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

        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
        });
      }

      case "portal": {
        const customer = await getStripeCustomerByEmail(user.email!);
        if (!customer) {
          return NextResponse.json(
            { error: "No billing account found" },
            { status: 404 }
          );
        }

        const session = await createBillingPortalSession(
          customer.id,
          `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        );

        return NextResponse.json({
          url: session.url,
        });
      }

      case "cancel": {
        const currentPlan = await getUserPlan(user.id);
        if (currentPlan === "free") {
          return NextResponse.json(
            { error: "No active subscription to cancel" },
            { status: 400 }
          );
        }

        const subscriptions = await getCustomerSubscriptions(
          (await getStripeCustomerByEmail(user.email!))?.id || ""
        );

        if (subscriptions.data.length === 0) {
          return NextResponse.json(
            { error: "No active subscription found" },
            { status: 404 }
          );
        }

        await cancelSubscription(subscriptions.data[0].id);

        return NextResponse.json({
          canceled: true,
          message: "Subscription will be canceled at the end of the billing period",
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Billing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const planId = await getUserPlan(user.id);
    const usage = await getUserUsage(user.id);
    const features = await checkFeatureAccess(user.id, "maxSearchAlerts");
    const limitsSummary = getPlanLimitsSummary(planId);

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
