// Customer Portal: para que el usuario gestione/cancele su suscripción
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { stripe, APP_URL } from "@/lib/stripe/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const svc = createServiceClient()
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
  } catch (e: any) {
    console.error("[stripe/portal] error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
