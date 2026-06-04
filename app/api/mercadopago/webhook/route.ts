// Webhook de Mercado Pago: actualiza el plan al suscribirse, renovar o cancelar
// Esta ruta debe quedar fuera del middleware de auth (excluida en middleware.ts)
import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import { mpClient } from "@/lib/mercadopago/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, data } = body

    // MP manda distintos tipos de notificaciones — solo nos interesan suscripciones
    if (type !== "subscription_preapproval") {
      return NextResponse.json({ received: true })
    }

    const preapprovalId = data?.id
    if (!preapprovalId) {
      return NextResponse.json({ error: "No preapproval id" }, { status: 400 })
    }

    // Fetch de la suscripción para obtener status y external_reference (userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let preapproval: any
    try {
      preapproval = await new PreApproval(mpClient).get({ id: preapprovalId })
    } catch {
      // El ID puede ser fake (ej: simulación de MP) — respondemos 200 para no reintentar
      console.warn("[mp/webhook] preapproval no encontrado, ignorando:", preapprovalId)
      return NextResponse.json({ received: true })
    }

    // external_reference tiene formato "userId:plan" (ej: "abc-123:monthly")
    // Solo tomamos la parte antes del ":"
    const [userId] = (preapproval.external_reference ?? "").split(":")
    if (!userId) {
      console.error("[mp/webhook] preapproval sin external_reference:", preapprovalId)
      return NextResponse.json({ error: "No user reference" }, { status: 400 })
    }

    // "authorized" = activo; cualquier otro status = no activo
    const isActive = preapproval.status === "authorized"
    const svc = createServiceClient()

    await svc.from("profiles").update({
      plan: isActive ? "pro" : "free",
      mp_preapproval_id: preapprovalId,
      mp_subscription_status: preapproval.status ?? null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId)

    console.log(`[mp/webhook] userId=${userId} status=${preapproval.status} plan=${isActive ? "pro" : "free"}`)
    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error("[mp/webhook] error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
