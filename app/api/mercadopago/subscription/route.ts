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
import { createClient, createServiceClient } from "@/lib/supabase/server"

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

    // Body opcional: { plan: "monthly" | "annual", payerEmail?: string }
    // payerEmail: email de la cuenta de Mercado Pago con la que el usuario va a
    // pagar. Puede diferir del email de su cuenta de Rendi — MP exige que el
    // pagador esté logueado con ese email exacto, así que dejamos que lo elija.
    let plan: MpPlan = "monthly"
    let payerEmail: string | undefined
    try {
      const body = await req.json()
      if (body?.plan === "annual" || body?.plan === "monthly") plan = body.plan
      if (typeof body?.payerEmail === "string") {
        const candidate = body.payerEmail.trim().toLowerCase()
        // Validación simple de formato de email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) payerEmail = candidate
      }
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

    // Suscripción SIN plan asociado (modelo "pago pendiente" de Mercado Pago):
    // devuelve un init_point al checkout hosteado donde el comprador elige su
    // método de pago (tarjeta o dinero en cuenta). NOTA: no usar preapproval_plan_id
    // acá — las suscripciones con plan asociado exigen card_token_id (tokenización
    // propia de tarjeta), y rompen el flujo de redirección.
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
        // payer_email es obligatorio en este modelo (Checkout Pro exige que el
        // comprador pague logueado en MP con este email exacto). Usamos el que el
        // usuario eligió en el formulario; fallback: el email de su cuenta de Rendi.
        payer_email: payerEmail ?? user.email ?? undefined,
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

    // Guardamos el ID de la suscripción recién creada en el perfil (estado
    // "pending" hasta que se pague). Así /api/mercadopago/reconcile puede
    // consultarla directo aunque el webhook de MP nunca llegue.
    if (preapproval.id) {
      try {
        const svc = createServiceClient()
        await svc
          .from("profiles")
          .update({
            mp_preapproval_id: preapproval.id,
            mp_subscription_status: preapproval.status ?? "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
      } catch (e) {
        // No bloquea el pago — la reconciliación por external_reference lo cubre
        console.warn("[mp/subscription] no se pudo guardar preapproval_id:", e)
      }
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
