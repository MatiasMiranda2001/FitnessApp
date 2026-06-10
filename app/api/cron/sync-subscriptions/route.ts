// Cron diario: re-sincroniza el estado de las suscripciones con Mercado Pago.
//
// Por qué: el webhook ya hace el grueso del trabajo, pero si MP no nos manda
// un evento (problema de red, evento perdido, retry agotado) podemos quedar
// con datos desactualizados. Este cron es la red de seguridad: una vez al día
// recorre todos los profiles con preapproval_id, le pregunta a MP el status
// real y reconcilia.
//
// Corre todos los días a las 06:00 UTC (03:00 Argentina) — bajo tráfico.
// Protegido con CRON_SECRET igual que los otros crons.

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PreApproval } from "mercadopago"
import { mpClient } from "@/lib/mercadopago/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Marker que usamos cuando un Pro fue activado manualmente (admin/testing).
// Estos profiles NO se sincronizan con MP — son manuales.
const MANUAL_OVERRIDE_MARKER = "manual-test"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Traer todos los profiles con mp_preapproval_id, salvo manuales
  const { data: profiles, error: queryErr } = await supabase
    .from("profiles")
    .select("user_id, plan, mp_preapproval_id, mp_subscription_status")
    .not("mp_preapproval_id", "is", null)
    .neq("mp_preapproval_id", MANUAL_OVERRIDE_MARKER)

  if (queryErr) {
    console.error("[cron/sync-subscriptions] error queryeando profiles:", queryErr)
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  if (!profiles?.length) {
    console.log("[cron/sync-subscriptions] sin profiles para sincronizar")
    return NextResponse.json({ checked: 0, updated: 0 })
  }

  const preapprovalClient = new PreApproval(mpClient)

  let checked = 0
  let updated = 0
  let errors = 0
  const updates: Array<{ userId: string; from: string | null; to: string | null }> = []

  for (const profile of profiles) {
    checked++
    const preapprovalId = profile.mp_preapproval_id as string

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let preapproval: any
    try {
      preapproval = await preapprovalClient.get({ id: preapprovalId })
    } catch (e) {
      // Preapproval inexistente o token expirado — lo logueamos pero no tocamos
      // el profile (no queremos pasar a Free por un error transitorio de MP).
      console.warn(
        `[cron/sync-subscriptions] preapproval no encontrado userId=${profile.user_id} preapprovalId=${preapprovalId}`,
        (e as Error).message
      )
      errors++
      continue
    }

    const realStatus = preapproval.status as string | null
    const isActive = realStatus === "authorized"
    const desiredPlan = isActive ? "pro" : "free"

    // Solo actualizamos si difiere de lo guardado (para no tocar updated_at sin razón)
    const statusDiffers = (profile.mp_subscription_status ?? null) !== (realStatus ?? null)
    const planDiffers = profile.plan !== desiredPlan

    if (!statusDiffers && !planDiffers) {
      continue // Todo en orden, próximo
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        plan: desiredPlan,
        mp_subscription_status: realStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", profile.user_id)

    if (updErr) {
      console.error(
        `[cron/sync-subscriptions] error actualizando profile userId=${profile.user_id}`,
        updErr
      )
      errors++
      continue
    }

    updated++
    updates.push({
      userId: profile.user_id,
      from: profile.mp_subscription_status ?? null,
      to: realStatus ?? null,
    })
    console.log(
      `[cron/sync-subscriptions] sync userId=${profile.user_id} ${profile.mp_subscription_status} -> ${realStatus} plan=${desiredPlan}`
    )
  }

  console.log(
    `[cron/sync-subscriptions] checked=${checked} updated=${updated} errors=${errors}`
  )

  return NextResponse.json({
    checked,
    updated,
    errors,
    changes: updates,
  })
}
