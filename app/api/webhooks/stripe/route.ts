import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceRoleClient()

  // Idempotency: Stripe retries webhooks, so a session we've already turned into an order is a no-op.
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle()

  if (existingOrder) return

  const stripe = getStripe()
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
    limit: 100,
  })

  const meta = session.metadata ?? {}
  const subtotalCents = session.amount_subtotal ?? 0
  const shippingCents = session.shipping_cost?.amount_total ?? 0
  const taxCents = session.total_details?.amount_tax ?? 0
  const totalCents = session.amount_total ?? 0

  const { data: orderNumberResult } = await supabase.rpc("generate_order_number")
  const orderNumber = orderNumberResult ?? `PETORA-${Date.now()}`

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: meta.customer_id || null,
      email: session.customer_email ?? session.customer_details?.email ?? "",
      status: "paid",
      subtotal_cents: subtotalCents,
      discount_cents: 0,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      currency: (session.currency ?? "usd").toUpperCase(),
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      stripe_checkout_session_id: session.id,
    })
    .select("id")
    .single()

  if (orderError || !order) {
    console.error("handleCheckoutCompleted: failed to create order", orderError?.message)
    throw new Error("Failed to create order")
  }

  const variantIds: string[] = []

  for (const line of lineItems.data) {
    const product = line.price?.product
    const productMeta = typeof product === "object" && product && "metadata" in product ? product.metadata : {}
    const variantId = (productMeta as Record<string, string>)?.variant_id

    await supabase.from("order_items").insert({
      order_id: order.id,
      variant_id: variantId || null,
      product_name: line.description ?? "Product",
      variant_label: null,
      sku: (productMeta as Record<string, string>)?.sku ?? "",
      quantity: line.quantity ?? 1,
      unit_price_cents: line.price?.unit_amount ?? 0,
      total_cents: line.amount_total ?? 0,
    })

    if (variantId) {
      variantIds.push(variantId)
      const { data: inv } = await supabase
        .from("inventory")
        .select("quantity_available")
        .eq("variant_id", variantId)
        .single()

      if (inv) {
        await supabase
          .from("inventory")
          .update({ quantity_available: Math.max(0, inv.quantity_available - (line.quantity ?? 1)) })
          .eq("variant_id", variantId)
      }
    }
  }

  await supabase.from("order_addresses").insert([
    {
      order_id: order.id,
      type: "shipping",
      full_name: meta.full_name || session.customer_details?.name || "",
      line1: meta.line1 || "",
      line2: meta.line2 || null,
      city: meta.city || "",
      state: meta.state || "",
      postal_code: meta.postal_code || "",
      country: "US",
      phone: meta.phone || null,
    },
  ])

  await supabase.from("payments").insert({
    order_id: order.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    amount_cents: totalCents,
    currency: (session.currency ?? "usd").toUpperCase(),
    status: "succeeded",
    method: "card",
  })

  if (meta.cart_id) {
    await supabase.from("cart_items").delete().eq("cart_id", meta.cart_id)
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createServiceRoleClient()
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (!order) return

  const status = charge.refunded ? "refunded" : "processing"
  await supabase.from("orders").update({ status }).eq("id", order.id)

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (payment) {
    await supabase.from("refunds").insert({
      payment_id: payment.id,
      order_id: order.id,
      amount_cents: charge.amount_refunded,
      status: "succeeded",
      stripe_refund_id: charge.id,
    })
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        break
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
