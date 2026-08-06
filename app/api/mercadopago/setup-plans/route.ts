// Ruta de USO ÚNICO: crea en Mercado Pago los dos "preapproval_plan" (mensual y
// anual) que después usamos para generar links de suscripción sin exigir un
// payer_email fijo. Se llama una sola vez a mano (GET con ?create=true), se
// copian los IDs que devuelve a las env vars MP_PLAN_ID_MONTHLY / MP_PLAN_ID_ANNUAL,
// y después se puede borrar este archivo — no forma parte del flujo normal de la app.
import { NextResponse } from "next/server"
import { PreApprovalPlan } from "mercadopago"
import { mpClient, MP_PRICE_ARS, MP_PRICE_ANNUAL_ARS, APP_URL } from "@/lib/mercadopago/server"

export async function GET(req: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  if (searchParams.get("create") !== "true") {
    return NextResponse.json({
      message:
        "Esta ruta crea los planes de suscripción en tu cuenta de Mercado Pago. " +
        "Se ejecuta UNA sola vez. Para confirmar, entrá a esta misma URL agregando ?create=true. " +
        `Precios actuales: mensual $${MP_PRICE_ARS} ARS, anual $${MP_PRICE_ANNUAL_ARS} ARS.`,
    })
  }

  try {
    const client = new PreApprovalPlan(mpClient)

    const monthly = await client.create({
      body: {
        reason: "Rendi - Plan Pro Mensual",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: MP_PRICE_ARS,
          currency_id: "ARS",
        },
        back_url: `${APP_URL}/billing?mp_success=1&plan=monthly`,
      },
    })

    const annual = await client.create({
      body: {
        reason: "Rendi - Plan Pro Anual",
        auto_recurring: {
          frequency: 12,
          frequency_type: "months",
          transaction_amount: MP_PRICE_ANNUAL_ARS,
          currency_id: "ARS",
        },
        back_url: `${APP_URL}/billing?mp_success=1&plan=annual`,
      },
    })

    return NextResponse.json({
      ok: true,
      next_steps:
        "Copiá estos dos valores en las variables de entorno de Vercel " +
        "(MP_PLAN_ID_MONTHLY y MP_PLAN_ID_ANNUAL), redeployá, y después borrá este archivo " +
        "(app/api/mercadopago/setup-plans/route.ts) para que no quede expuesto.",
      MP_PLAN_ID_MONTHLY: monthly.id,
      MP_PLAN_ID_ANNUAL: annual.id,
    })
  } catch (e: any) {
    console.error("[mp/setup-plans] error:", e)
    return NextResponse.json({ error: e.message ?? "Error desconocido al crear los planes" }, { status: 500 })
  }
}
