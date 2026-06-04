// Cron dominical: envía resumen semanal de progreso por push notification
// Corre todos los domingos a las 23:00 UTC (20:00 Argentina)
// Protegido con CRON_SECRET igual que send-reminders

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

export const dynamic = "force-dynamic"

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

  // Rango de la semana en Argentina (UTC-3)
  const now = new Date()
  const arNow = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const weekStart = new Date(arNow)
  weekStart.setUTCDate(arNow.getUTCDate() - 6) // últimos 7 días
  weekStart.setUTCHours(0, 0, 0, 0)

  // Traer todos los usuarios con notificaciones habilitadas
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, notification_prefs")
    .not("notification_prefs", "is", null)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const profile of profiles) {
    const prefs = profile.notification_prefs as { enabled?: boolean } | null
    if (!prefs?.enabled) continue

    const userId = profile.user_id

    // Contar entrenamientos de la semana
    const { count: workoutCount } = await supabase
      .from("workout_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", weekStart.toISOString().slice(0, 10))

    // Contar días con comida registrada esta semana
    const { data: foodDays } = await supabase
      .from("food_entries")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString())

    const uniqueFoodDays = new Set(
      (foodDays ?? []).map((f) => f.created_at.slice(0, 10))
    ).size

    // Armar el mensaje según el progreso
    const workouts = workoutCount ?? 0
    const firstName = (profile.name ?? "").split(" ")[0] || "crack"

    let title: string
    let body: string

    if (workouts === 0) {
      title = "💤 Semana tranquila, ¿no?"
      body = `Esta semana no registraste ningún entrenamiento. ¡La próxima semana es tu momento, ${firstName}!`
    } else if (workouts <= 2) {
      title = `💪 ${workouts} entrenamiento${workouts > 1 ? "s" : ""} esta semana`
      body = `Buen comienzo, ${firstName}. Intentá sumar más sesiones la próxima semana.`
    } else if (workouts <= 4) {
      title = `🔥 ${workouts} entrenamientos esta semana`
      body = `¡Muy bien, ${firstName}! Mantuviste la constancia. ${uniqueFoodDays > 3 ? "Y tu nutrición también estuvo buena 🥗" : "Intentá registrar más comidas también."}`
    } else {
      title = `🏆 ${workouts} entrenamientos — ¡semana épica!`
      body = `${firstName}, esta semana te superaste. ${uniqueFoodDays > 4 ? "Nutrición + entrenamiento = combo ganador 🎯" : "¡Seguí así!"}`
    }

    // Traer suscripciones push del usuario
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId)

    if (!subs?.length) continue

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title,
            body,
            url: "/app",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
          })
        )
        sent++
      } catch (err: unknown) {
        if ((err as { statusCode?: number })?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        }
      }
    }
  }

  console.log(`[cron/send-summary] Resúmenes enviados: ${sent}`)
  return NextResponse.json({ sent })
}
