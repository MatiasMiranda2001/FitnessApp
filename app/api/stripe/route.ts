// Stripe routes: checkout + portal merged into one file to stay within Vercel Hobby lambda limit
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { stripe, PRO_PRICE_ID, APP_URL } from "@/lib/stripe/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { action } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const svc = createServiceClient()

    if (action === "portal") {
      const { data: profile } = await svc
        .from("profiles")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile?.stripe_customer_id) {
        return NextResponse.json({ error: "Sin customer de Stripe — suscríbete primero" }, { status: 400 })
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${APP_URL}/billing`,
      })

      return NextResponse.json({ url: session.url })
    }

    if (action === "checkout") {
      if (!PRO_PRICE_ID) {
        return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 })
      }

      const { data: profile } = await svc
        .from("profiles")
        .select("stripe_customer_id, name")
        .eq("user_id", user.id)
        .maybeSingle()

      let customerId = profile?.stripe_customer_id ?? null
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: profile?.name ?? undefined,
          metadata: { supabase_user_id: user.id },
        })
        customerId = customer.id
        await svc.from("profiles").update({ stripe_customer_id: customerId }).eq("user_id", user.id)
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
        success_url: `${APP_URL}/billing?success=1`,
        cancel_url: `${APP_URL}/billing?canceled=1`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: { supabase_user_id: user.id },
        },
        client_reference_id: user.id,
      })

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (e: any) {
    console.error("[stripe] error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
