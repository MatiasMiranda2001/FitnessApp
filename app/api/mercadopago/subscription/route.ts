// Crea una suscripción (PreApproval) de Mercado Pago y devuelve la URL de pago.
// Acepta { plan: "monthly" | "annual" } en el body. Default: "monthly".
import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import {
  mpClient,
  MP_PRICE_ARS,
  MP_PRICE_ANNUAL_ARS,
  APP_URL,
  type MpPlan,
} from "@/lib/mercadopago/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Body opcional: { plan: "monthly" | "annual" }
    let plan: MpPlan = "monthly"
    try {
      const body = await req.json()
      if (body?.plan === "annual" || body?.plan === "monthly") plan = body.plan
    } catch {
      // Sin body → default monthly
    }

    // Verificar si el usuario ya tiene una suscripción activa de MP
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, mp_subscription_status, mp_preapproval_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.plan === "pro" && profile?.mp_subscription_status === "authorized") {
      return NextResponse.json(
        { error: "Ya tenés una suscripción activa con Mercado Pago." },
        { status: 409 }
      )
    }

    const isAnnual = plan === "annual"
    const amount = isAnnual ? MP_PRICE_ANNUAL_ARS : MP_PRICE_ARS

    const preapproval = await new PreApproval(mpClient).create({
      body: {
        reason: isAnnual ? "Rendi - Plan Pro Anual" : "Rendi - Plan Pro Mensual",
        auto_recurring: {
          // Anual: cobro cada 12 meses. Mensual: cada 1 mes.
          frequency: isAnnual ? 12 : 1,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "ARS",
        },
        // Sin payer_email: si lo mandamos, Mercado Pago exige que el comprador esté
        // logueado con esa misma cuenta/email exacto, y rechaza el pago si no coincide
        // ("Tu e-mail no coincide con el de la suscripción"). Como el email de Rendi
        // no siempre es el mismo que el de la cuenta de Mercado Pago del usuario,
        // lo dejamos libre para que cualquiera pueda completar el pago.
        back_url: `${APP_URL}/billing?mp_success=1&plan=${plan}`,
        // notification_url: le dice a MP dónde mandar los webhooks de esta suscripción
        notification_url: `${APP_URL}/api/mercadopago/webhook`,
        // external_reference: identifica al usuario en el webhook
        external_reference: user.id,
      },
    })

    if (!preapproval.init_point) {
      return NextResponse.json({ error: "No se pudo crear el link de pago" }, { status: 500 })
    }

    return NextResponse.json({ url: preapproval.init_point, plan })
  } catch (e: any) {
    console.error("[mp/subscription] error completo:", JSON.stringify(e, null, 2))

    const isAuthError =
      e?.status === 401 ||
      e?.message?.toLowerCase().includes("unauthorized") ||
      (Array.isArray(e?.cause) && e.cause.some((c: any) => c?.code === "unauthorized"))

    if (isAuthError) {
      console.error(
        "[mp/subscription] ⚠️  MP_ACCESS_TOKEN inválido o sin permisos de suscripciones. " +
        "Verificá el token en el Dashboard de Mercado Pago y actualizalo en Vercel."
      )
      return NextResponse.json(
        { error: "No se pudo conectar con Mercado Pago. Verificá tu conexión o elegí otro método de pago." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: e.message ?? "Error desconocido" }, { status: 500 })
  }
}
