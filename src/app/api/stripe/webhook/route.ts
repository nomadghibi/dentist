import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, dentists } from "@/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const dentistId = session.metadata?.dentistId;
        const plan = session.metadata?.plan as "pro" | "premium";

        if (!dentistId || !plan) {
          console.error("Missing metadata in checkout session");
          break;
        }

        // Get subscription
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Upsert subscription
        await db
          .insert(subscriptions)
          .values({
            dentistId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: subscription.status === "active" ? "active" : "trialing",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .onConflictDoUpdate({
            target: subscriptions.dentistId,
            set: {
              stripeSubscriptionId: subscriptionId,
              plan,
              status: subscription.status === "active" ? "active" : "trialing",
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              updatedAt: new Date(),
            },
          });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find subscription in DB
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
          .limit(1);

        if (existing) {
          const status =
            subscription.status === "active"
              ? "active"
              : subscription.status === "canceled"
              ? "canceled"
              : subscription.status === "past_due"
              ? "past_due"
              : "trialing";

          await db
            .update(subscriptions)
            .set({
              status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

