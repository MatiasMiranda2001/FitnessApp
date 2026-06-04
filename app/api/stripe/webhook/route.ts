// Webhook de Stripe: actualiza el plan del usuario al suscribirse, renovar o cancelar
// Importante: esta ruta debe quedar fuera del middleware de auth (ya excluida en middleware.ts)
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
// El handler necesita el body raw — Next.js App Router lo expone con req.text()

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    console.error("[stripe/webhook] firma inválida:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const svc = createServiceClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId =
          (session.client_reference_id as string | null) ??
          (session.metadata?.supabase_user_id as string | undefined)

        if (!userId) break
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          await applySubscription(svc, userId, sub, session.customer as string)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(svc, sub)
        if (!userId) break
        await applySubscription(svc, userId, sub, sub.customer as string)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(svc, sub)
        if (!userId) break
        await svc.from("profiles").update({
          plan: "free",
          stripe_subscription_id: null,
          stripe_subscription_status: sub.status,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId)
        break
      }

      default:
        // Ignoramos eventos no relevantes
        break
    }
  } catch (e: any) {
    console.error("[stripe/webhook] error procesando evento:", event.type, e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function resolveUserId(svc: ReturnType<typeof createServiceClient>, sub: Stripe.Subscription) {
  // Preferimos metadata, pero si no hay buscamos por customer_id
  const meta = (sub.metadata?.supabase_user_id as string | undefined) ?? null
  if (meta) return meta
  const customerId = sub.customer as string
  const { data } = await svc.from("profiles").select("user_id").eq("stripe_customer_id", customerId).maybeSingle()
  return data?.user_id ?? null
}

async function applySubscription(
  svc: ReturnType<typeof createServiceClient>,
  userId: string,
  sub: Stripe.Subscription,
  customerId: string
) {
  const isActive = ["active", "trialing"].includes(sub.status)
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null

  await svc.from("profiles").update({
    plan: isActive ? "pro" : "free",
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_subscription_status: sub.status,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId)
}
