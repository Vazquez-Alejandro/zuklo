import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  getPlanByPriceId,
  type PlanId,
} from "@/lib/stripe";
import {
  createSubscription,
  updateSubscription,
} from "@/lib/monetization";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = await constructWebhookEvent(
      Buffer.from(body),
      signature
    );

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const customerId = subscription.customer as string;

        if (!userId) {
          console.error("No userId in subscription metadata");
          break;
        }

        const priceId =
          subscription.items.data[0]?.price?.id || "";
        const planId = getPlanByPriceId(priceId) || "free";

        const periodStart = new Date(
          (subscription as unknown as Record<string, unknown>).current_period_start as number * 1000
        ).toISOString();
        const periodEnd = new Date(
          (subscription as unknown as Record<string, unknown>).current_period_end as number * 1000
        ).toISOString();

        await createSubscription(
          userId,
          customerId,
          subscription.id,
          planId as PlanId,
          subscription.status as "active" | "canceled" | "past_due" | "trialing",
          periodStart,
          periodEnd
        );

        console.log(`Subscription created for user ${userId}: ${planId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error("No userId in subscription metadata");
          break;
        }

        const priceId =
          subscription.items.data[0]?.price?.id || "";
        const planId = getPlanByPriceId(priceId) || "free";

        const periodStart = new Date(
          (subscription as unknown as Record<string, unknown>).current_period_start as number * 1000
        ).toISOString();
        const periodEnd = new Date(
          (subscription as unknown as Record<string, unknown>).current_period_end as number * 1000
        ).toISOString();

        await updateSubscription(userId, {
          planId: planId as PlanId,
          status: subscription.status as "active" | "canceled" | "past_due" | "trialing",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          stripeSubscriptionId: subscription.id,
        });

        console.log(`Subscription updated for user ${userId}: ${planId} (${subscription.status})`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error("No userId in subscription metadata");
          break;
        }

        await updateSubscription(userId, {
          planId: "free",
          status: "canceled",
          stripeSubscriptionId: null,
        });

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

        if (subscriptionId) {
          console.log(`Payment succeeded for subscription ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

        if (subscriptionId) {
          console.log(`Payment failed for subscription ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Stripe webhook endpoint is active",
    supportedEvents: [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
    ],
  });
}
