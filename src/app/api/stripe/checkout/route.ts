import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, dentists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const checkoutSchema = z.object({
  dentistId: z.string().uuid(),
  plan: z.enum(["pro", "premium"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dentistId, plan } = checkoutSchema.parse(body);

    // Get dentist
    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, dentistId)).limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // Check for existing subscription
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dentistId, dentistId))
      .limit(1);

    let customerId: string;

    if (existing) {
      customerId = existing.stripeCustomerId;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: dentist.phone || undefined, // Use phone as placeholder, should be email
        metadata: {
          dentistId,
        },
      });
      customerId = customer.id;
    }

    // Plan prices (set these in Stripe dashboard)
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || "price_xxx",
      premium: process.env.STRIPE_PRICE_PREMIUM || "price_xxx",
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dentist/dashboard?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        dentistId,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

