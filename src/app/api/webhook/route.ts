import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  getPlanByPriceId,
  getStripe,
  type PlanId,
} from "@/lib/stripe";
import {
  createSubscription,
  updateSubscription,
} from "@/lib/monetization";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`webhook:post:${ip}`, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

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

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const subscriptionId = session.subscription as string | null;
          const userId = session.metadata?.userId;

          if (!userId) {
            console.error(JSON.stringify({ level: "error", event: event.type, message: "No userId in checkout session metadata" }));
            break;
          }

          if (!subscriptionId) {
            console.error(JSON.stringify({ level: "error", event: event.type, userId, message: "No subscription ID on checkout session" }));
            break;
          }

          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price?.id || "";
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
            subscriptionId,
            planId as PlanId,
            subscription.status as "active" | "canceled" | "past_due" | "trialing",
            periodStart,
            periodEnd
          );

          console.log(JSON.stringify({ level: "info", event: event.type, userId, planId, subscriptionId, message: "Checkout completed, subscription activated" }));
          break;
        }

        case "customer.subscription.created": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error(JSON.stringify({ level: "error", event: event.type, message: "No userId in subscription metadata" }));
            break;
          }

          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price?.id || "";
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

          console.log(JSON.stringify({ level: "info", event: event.type, userId, planId, message: "Subscription created" }));
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error(JSON.stringify({ level: "error", event: event.type, message: "No userId in subscription metadata" }));
            break;
          }

          const priceId = subscription.items.data[0]?.price?.id || "";
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

          console.log(JSON.stringify({ level: "info", event: event.type, userId, planId, status: subscription.status, message: "Subscription updated" }));
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error(JSON.stringify({ level: "error", event: event.type, message: "No userId in subscription metadata" }));
            break;
          }

          await updateSubscription(userId, {
            planId: "free",
            status: "canceled",
            stripeSubscriptionId: null,
          });

          console.log(JSON.stringify({ level: "info", event: event.type, userId, message: "Subscription canceled" }));
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

          if (!subscriptionId) {
            console.log(JSON.stringify({ level: "info", event: event.type, message: "Invoice without subscription (one-time payment), skipping" }));
            break;
          }

          const periodStart = new Date(
            (invoice as unknown as Record<string, unknown>).period_start as number * 1000
          ).toISOString();
          const periodEnd = new Date(
            (invoice as unknown as Record<string, unknown>).period_end as number * 1000
          ).toISOString();

          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await updateSubscription(userId, {
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              status: "active",
            });
            console.log(JSON.stringify({ level: "info", event: event.type, userId, subscriptionId, message: "Payment succeeded, subscription period updated" }));
          } else {
            console.error(JSON.stringify({ level: "error", event: event.type, subscriptionId, message: "No userId in subscription metadata for invoice" }));
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

          if (!subscriptionId) {
            console.log(JSON.stringify({ level: "info", event: event.type, message: "Failed invoice without subscription, skipping" }));
            break;
          }

          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await updateSubscription(userId, {
              status: "past_due",
            });
            console.log(JSON.stringify({ level: "info", event: event.type, userId, subscriptionId, message: "Payment failed, subscription marked past_due" }));
          } else {
            console.error(JSON.stringify({ level: "error", event: event.type, subscriptionId, message: "No userId in subscription metadata for failed invoice" }));
          }
          break;
        }

        default:
          console.log(JSON.stringify({ level: "info", event: event.type, message: "Unhandled event type" }));
      }
    } catch (eventError) {
      console.error(JSON.stringify({
        level: "error",
        event: event.type,
        error: eventError instanceof Error ? eventError.message : String(eventError),
        stack: eventError instanceof Error ? eventError.stack : undefined,
        message: "Error processing webhook event",
      }));
    }

    const duration = Date.now() - start;
    logRequest("POST", "/api/webhook", 200, duration);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Webhook verification failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));
    const duration = Date.now() - start;
    logRequest("POST", "/api/webhook", 500, duration);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  const duration = 0;
  logRequest("GET", "/api/webhook", 200, duration);
  return NextResponse.json({
    message: "Stripe webhook endpoint is active",
    supportedEvents: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
    ],
  });
}
