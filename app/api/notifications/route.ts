// Route consolidada para push notifications + cron job de recordatorios.
// Esto reemplaza /api/push (POST) y /api/cron/send-reminders (GET) en un
// solo file para mantenernos debajo del límite de 12 lambdas del Hobby plan.
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { createClient as createServiceSupabase } from "@supabase/supabase-js"
import webpush from "web-push"

export const dynamic = "force-dynamic"

// ════════════════════════════════════════════════════════════════════
// POST — gestionar suscripciones push del usuario logueado
// Acciones: subscribe | unsubscribe | save-prefs
// (reemplazo del viejo /api/push)
// ════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === "subscribe") {
    const { endpoint, keys } = body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: "user_id,endpoint" }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === "unsubscribe") {
    const { endpoint } = body
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === "save-prefs") {
    const { prefs } = body
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: prefs })
      .eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

// ════════════════════════════════════════════════════════════════════
// GET — cron job que envía recordatorios (corre cada hora via Vercel Cron)
// Protegido con header `Authorization: Bearer <CRON_SECRET>`
// (reemplazo del viejo /api/cron/send-reminders)
// ════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  webpush.setVapidDetails(
    "mailto:hola@rendi.com.ar",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hora actual en Argentina (UTC-3)
  const now = new Date()
  const arTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const currentHour = arTime.getUTCHours()
  const currentMinute = arTime.getUTCMinutes()
  // El cron corre cada 15 min — solo procesar en :00, :15, :30, :45
  const validMinutes = [0, 15, 30, 45]
  if (!validMinutes.includes(currentMinute)) {
    return NextResponse.json({ skipped: true, reason: "not on 15min mark" })
  }
  // Normalizar minutos al múltiplo de 15 más cercano para comparar con las prefs del usuario
  const normalizedMinute = Math.floor(currentMinute / 15) * 15
  const currentHHMM = `${String(currentHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, notification_prefs")
    .not("notification_prefs", "is", null)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  // Para cada comida: etiqueta, conector ("del" o "de la" según género) y emoji
  const mealMeta: Record<string, { label: string; connector: string; emoji: string }> = {
    breakfast: { label: "Desayuno", connector: "del",   emoji: "☕" },
    lunch:     { label: "Almuerzo", connector: "del",   emoji: "🍽️" },
    snack:     { label: "Merienda", connector: "de la", emoji: "🍎" },
    dinner:    { label: "Cena",     connector: "de la", emoji: "🌙" },
  }

  let sent = 0

  for (const profile of profiles) {
    const prefs = profile.notification_prefs as NotificationPrefs
    if (!prefs?.enabled) continue

    const userId = profile.user_id
    const notifications: { title: string; body: string; url: string }[] = []

    // === Comidas ===
    // Ventana de "última hora" = real UTC, NO el arTime desplazado.
    // Si usamos arTime.getTime() - 1h estaríamos comparando timestamps shifteados (-3h)
    // contra created_at que está en UTC real, dando una ventana de 4h en vez de 1h.
    const oneHourAgoIso = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

    for (const [meal, meta] of Object.entries(mealMeta)) {
      const cfg = prefs.meals?.[meal as keyof typeof prefs.meals]
      if (cfg?.enabled && cfg.time === currentHHMM) {
        const { count, error } = await supabase
          .from("food_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", oneHourAgoIso)

        if (error) console.error("[notifications] food_entries query error:", error)

        if ((count ?? 0) === 0) {
          notifications.push({
            title: `${meta.emoji} Hora ${meta.connector} ${meta.label}`,
            body: `¿Ya registraste tu ${meta.label.toLowerCase()}? Abrí Rendi y cargá tus comidas.`,
            url: "/app",
          })
        }
      }
    }

    // === Entrenamiento ===
    // El campo correcto en workout_logs es `created_at` (no `logged_at`).
    // Comparamos contra hoy en hora Argentina (date column es local).
    const workout = prefs.workout
    if (workout?.enabled && workout.time === currentHHMM) {
      const todayAr = `${arTime.getUTCFullYear()}-${String(arTime.getUTCMonth() + 1).padStart(2, "0")}-${String(arTime.getUTCDate()).padStart(2, "0")}`
      const { count, error } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("date", todayAr)

      if (error) console.error("[notifications] workout_logs query error:", error)

      if ((count ?? 0) === 0) {
        notifications.push({
          title: "💪 ¡Hora de entrenar!",
          body: "Todavía no registraste ningún entrenamiento hoy. ¡Dale que podés!",
          url: "/app",
        })
      }
    }

    if (notifications.length === 0) continue

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId)

    if (!subs?.length) continue

    for (const notif of notifications) {
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ ...notif, icon: "/icon-192.png", badge: "/icon-192.png" })
          )
          sent++
        } catch (err: unknown) {
          // Suscripción expirada (410) — limpiarla
          if ((err as { statusCode?: number })?.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
          }
        }
      }
    }
  }

  return NextResponse.json({ sent, time: currentHHMM })
}

// ── Types ──────────────────────────────────────────────────
interface MealConfig { enabled: boolean; time: string }
interface NotificationPrefs {
  enabled: boolean
  meals: { breakfast: MealConfig; lunch: MealConfig; snack: MealConfig; dinner: MealConfig }
  workout: MealConfig
}
