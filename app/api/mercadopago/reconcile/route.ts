// Reconciliación activa con Mercado Pago: en lugar de depender solo del webhook
// (que puede perderse por redirecciones de dominio, reintentos agotados, etc.),
// este endpoint le pregunta directamente a MP por la suscripción del usuario
// logueado y actualiza su perfil. Se llama desde la pantalla de billing.
import { NextResponse } from "next/server"
import { PreApproval } from "mercadopago"
import { mpClient } from "@/lib/mercadopago/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPreapproval = any

export async function POST() {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const svc = createServiceClient()
    const { data: profile } = await svc
      .from("profiles")
      .select("plan, mp_preapproval_id, mp_subscription_status")
      .eq("user_id", user.id)
      .maybeSingle()

    // Perfiles con override manual no se tocan
    if (profile?.mp_preapproval_id === "manual-test") {
      return NextResponse.json({ ok: true, skipped: "manual_override" })
    }

    const client = new PreApproval(mpClient)
    let preapproval: AnyPreapproval = null

    // 1. Si ya tenemos un preapproval_id guardado, consultarlo directo
    if (profile?.mp_preapproval_id) {
      try {
        preapproval = await client.get({ id: profile.mp_preapproval_id })
      } catch {
        // ID guardado inválido/viejo — seguimos a la búsqueda
      }
    }

    // 2. Buscar por external_reference (= user.id) las suscripciones de este
    //    usuario en MP. Preferimos una "authorized"; si no, la más reciente.
    //    Esto cubre el caso donde el webhook nunca llegó y no hay ID guardado,
    //    o donde el usuario canceló y volvió a suscribirse.
    if (!preapproval || preapproval.status !== "authorized") {
      try {
        const res = await fetch(
          `https://api.mercadopago.com/preapproval/search?external_reference=${encodeURIComponent(user.id)}&sort=date_created:desc&limit=20`,
          {
            headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            cache: "no-store",
          }
        )
        if (res.ok) {
          const data = await res.json()
          // Filtro defensivo por si la API ignora el parámetro external_reference
          const mine: AnyPreapproval[] = (data.results ?? []).filter(
            (r: AnyPreapproval) => String(r.external_reference ?? "") === user.id
          )
          const authorized = mine.find((r) => r.status === "authorized")
          preapproval = authorized ?? preapproval ?? mine[0] ?? null
        }
      } catch {
        // Error de red contra MP — devolvemos lo que tengamos
      }
    }

    if (!preapproval?.id) {
      return NextResponse.json({ ok: true, found: false })
    }

    const status: string | null = preapproval.status ?? null
    const isActive = status === "authorized"
    const desiredPlan = isActive ? "pro" : "free"

    // Solo escribir si algo cambió
    const statusChanged = (profile?.mp_subscription_status ?? null) !== status
    const planChanged = (profile?.plan ?? "free") !== desiredPlan
    const idChanged = (profile?.mp_preapproval_id ?? null) !== preapproval.id

    if (statusChanged || planChanged || idChanged) {
      const { error } = await svc
        .from("profiles")
        .update({
          plan: desiredPlan,
          mp_preapproval_id: preapproval.id,
          mp_subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) {
        console.error("[mp/reconcile] error actualizando profile:", error)
        return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 })
      }
      console.log(`[mp/reconcile] userId=${user.id} status=${status} plan=${desiredPlan}`)
    }

    return NextResponse.json({ ok: true, found: true, status, plan: desiredPlan })
  } catch (e) {
    const err = e as Error
    console.error("[mp/reconcile] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
