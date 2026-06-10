// Webhook de Mercado Pago: actualiza el plan al suscribirse, renovar o cancelar
// Esta ruta debe quedar fuera del middleware de auth (excluida en middleware.ts)
//
// Mejoras v2:
//   1. Idempotencia: usamos tabla mp_webhook_events con UNIQUE en event_key
//      para evitar procesar dos veces el mismo evento (MP a veces reintenta).
//   2. Listener "subscription_authorized_payment": cuando MP confirma un cobro
//      recurrente, también actualizamos el status (por las dudas que se haya
//      perdido un evento previo de preapproval).
//
import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import { mpClient } from "@/lib/mercadopago/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// Helper: actualiza el plan del usuario basado en el status del preapproval
async function applyPreapprovalStatus(preapprovalId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let preapproval: any
  try {
    preapproval = await new PreApproval(mpClient).get({ id: preapprovalId })
  } catch {
    console.warn("[mp/webhook] preapproval no encontrado, ignorando:", preapprovalId)
    return { ok: false, reason: "preapproval_not_found" as const }
  }

  // external_reference tiene formato "userId:plan" (ej: "abc-123:monthly")
  const [userId] = (preapproval.external_reference ?? "").split(":")
  if (!userId) {
    console.error("[mp/webhook] preapproval sin external_reference:", preapprovalId)
    return { ok: false, reason: "no_user_reference" as const }
  }

  const isActive = preapproval.status === "authorized"
  const svc = createServiceClient()

  // Si el perfil tiene override manual, no lo tocamos desde el webhook
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("mp_preapproval_id")
    .eq("user_id", userId)
    .single()

  if (existingProfile?.mp_preapproval_id === "manual-test") {
    console.log(`[mp/webhook] userId=${userId} tiene override manual, ignorando webhook`)
    return { ok: true, userId, status: "manual_override_skipped", plan: "pro" } as const
  }

  const { error } = await svc.from("profiles").update({
    plan: isActive ? "pro" : "free",
    mp_preapproval_id: preapprovalId,
    mp_subscription_status: preapproval.status ?? null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId)

  if (error) {
    console.error("[mp/webhook] error actualizando profile:", error)
    return { ok: false, reason: "db_update_failed" as const, userId, status: preapproval.status }
  }

  console.log(
    `[mp/webhook] userId=${userId} status=${preapproval.status} plan=${isActive ? "pro" : "free"}`
  )
  return { ok: true, userId, status: preapproval.status, plan: isActive ? "pro" : "free" } as const
}

// Helper: fetch directo a /authorized_payments para obtener el preapproval_id
// del cobro recurrente. El SDK de mercadopago no expone esta clase, así que
// hacemos fetch crudo con el access token.
async function fetchAuthorizedPayment(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error("[mp/webhook] MP_ACCESS_TOKEN no configurado")
    return null
  }
  const res = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!res.ok) {
    console.warn("[mp/webhook] authorized_payment no encontrado:", paymentId, res.status)
    return null
  }
  return res.json()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, data } = body
    const resourceId = data?.id ? String(data.id) : null

    // MP manda distintos tipos de notificaciones — solo nos interesan suscripciones
    const isPreapproval = type === "subscription_preapproval"
    const isAuthorizedPayment = type === "subscription_authorized_payment"

    if (!isPreapproval && !isAuthorizedPayment) {
      return NextResponse.json({ received: true, ignored: true, type })
    }

    if (!resourceId) {
      return NextResponse.json({ error: "No resource id" }, { status: 400 })
    }

    // ─── Idempotencia ──────────────────────────────────────────────────────
    // event_key = "<type>:<resourceId>" — si ya lo procesamos, salimos OK
    const eventKey = `${type}:${resourceId}`
    const svc = createServiceClient()

    const { error: insertErr } = await svc.from("mp_webhook_events").insert({
      event_key: eventKey,
      event_type: type,
      resource_id: resourceId,
      payload: body,
    })

    // Si el insert falló por UNIQUE constraint → ya lo procesamos
    if (insertErr) {
      // 23505 = duplicate key (postgres). El SDK lo expone como string.
      const isDuplicate =
        insertErr.code === "23505" ||
        /duplicate key|unique constraint|already exists/i.test(insertErr.message)
      if (isDuplicate) {
        console.log(`[mp/webhook] evento duplicado, ignorando: ${eventKey}`)
        return NextResponse.json({ received: true, duplicate: true })
      }
      // Otro error de DB — lo logueamos pero seguimos procesando (no queremos
      // perder el evento por un problema transitorio).
      console.warn("[mp/webhook] error insertando event log:", insertErr)
    }

    // ─── Procesamiento del evento ──────────────────────────────────────────
    let result: { ok: boolean; reason?: string; userId?: string; status?: string; plan?: string }

    if (isPreapproval) {
      result = await applyPreapprovalStatus(resourceId)
    } else {
      // subscription_authorized_payment: cobro recurrente confirmado.
      // Obtenemos el preapproval_id del payment y re-sincronizamos.
      const payment = await fetchAuthorizedPayment(resourceId)
      const preapprovalId = payment?.preapproval_id
      if (!preapprovalId) {
        console.warn("[mp/webhook] authorized_payment sin preapproval_id:", resourceId)
        result = { ok: false, reason: "no_preapproval_in_payment" }
      } else {
        result = await applyPreapprovalStatus(preapprovalId)
      }
    }

    // Actualizamos el log con el resultado y el user_id (si lo tenemos)
    try {
      await svc.from("mp_webhook_events").update({
        result_status: result.ok ? "ok" : `error:${result.reason ?? "unknown"}`,
        user_id: result.userId ?? null,
      }).eq("event_key", eventKey)
    } catch {
      // No bloquea la respuesta
    }

    return NextResponse.json({ received: true, ...result })
  } catch (e) {
    const err = e as Error
    console.error("[mp/webhook] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
