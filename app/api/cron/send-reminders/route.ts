import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

export const dynamic = "force-dynamic"

// Cron job protegido con CRON_SECRET
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hora actual en Argentina (UTC-3)
  const now = new Date()
  const arTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const currentHour   = arTime.getUTCHours()
  const currentMinute = arTime.getUTCMinutes()
  // Ahora corre cada 15 min — solo disparar en :00, :15, :30, :45
  const validMinutes = [0, 15, 30, 45]
  if (!validMinutes.includes(currentMinute)) return NextResponse.json({ skipped: true })
  // Normalizar minutos al múltiplo de 15 para comparar con preferencias del usuario
  const normalizedMinute = Math.floor(currentMinute / 15) * 15
  const currentHHMM = `${String(currentHour).padStart(2,"0")}:${String(normalizedMinute).padStart(2,"0")}`

  // Traer todos los perfiles con notificaciones habilitadas + sus suscripciones
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, notification_prefs")
    .not("notification_prefs", "is", null)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const mealLabels: Record<string, string> = {
    breakfast: "Desayuno",
    lunch:     "Almuerzo",
    snack:     "Merienda",
    dinner:    "Cena",
  }

  let sent = 0

  for (const profile of profiles) {
    const prefs = profile.notification_prefs as NotificationPrefs
    if (!prefs?.enabled) continue

    const userId = profile.user_id
    const notifications: { title: string; body: string; url: string }[] = []

    // ── Chequear comidas ────────────────────────────────────
    for (const [meal, label] of Object.entries(mealLabels)) {
      const cfg = prefs.meals?.[meal as keyof typeof prefs.meals]
      if (cfg?.enabled && cfg.time === currentHHMM) {
        // Revisar si ya cargó comida en esta franja (±1h)
        const { count } = await supabase
          .from("food_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", new Date(arTime.getTime() - 60 * 60 * 1000).toISOString())

        if ((count ?? 0) === 0) {
          notifications.push({
            title: `🍽️ Hora del ${label}`,
            body:  `¿Ya registraste tu ${label.toLowerCase()}? Abrí Rendi y cargá tus comidas.`,
            url:   "/app",
          })
        }
      }
    }

    // ── Chequear entrenamiento ──────────────────────────────
    const workout = prefs.workout
    if (workout?.enabled && workout.time === currentHHMM) {
      const today = arTime.toISOString().slice(0, 10)
      const { count } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_at", today)

      if ((count ?? 0) === 0) {
        notifications.push({
          title: "💪 ¡Hora de entrenar!",
          body:  "Todavía no registraste ningún entrenamiento hoy. ¡Dale que podés!",
          url:   "/app",
        })
      }
    }

    if (notifications.length === 0) continue

    // Traer suscripciones del usuario
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
          // Suscripción expirada — limpiarla
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
