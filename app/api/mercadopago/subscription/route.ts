// Crea una suscripción (PreApproval) de Mercado Pago y devuelve la URL de pago.
// Acepta { plan: "monthly" | "annual" } en el body. Default: "monthly".
import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import {
  mpClient,
  MP_PLAN_ID_MONTHLY,
  MP_PLAN_ID_ANNUAL,
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
    const planId = isAnnual ? MP_PLAN_ID_ANNUAL : MP_PLAN_ID_MONTHLY

    if (!planId) {
      console.error(
        `[mp/subscription] Falta MP_PLAN_ID_${isAnnual ? "ANNUAL" : "MONTHLY"}. ` +
        "Corré /api/mercadopago/setup-plans?create=true una vez y cargá los IDs en las env vars."
      )
      return NextResponse.json(
        { error: "La suscripción no está configurada todavía. Probá de nuevo en unos minutos." },
        { status: 500 }
      )
    }

    // Preapproval vinculado a un plan: precio y frecuencia ya están definidos en
    // el plan, así que NO mandamos payer_email — Mercado Pago deja que cualquiera
    // complete el pago con su propia cuenta, sin exigir que coincida con ningún email.
    const preapproval = await new PreApproval(mpClient).create({
      body: {
        preapproval_plan_id: planId,
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
