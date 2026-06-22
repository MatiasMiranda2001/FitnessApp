// Cron semanal: análisis de entrenamiento + nutrición con IA
// Corre los domingos a las 23:00 UTC (20:00 Argentina)
// Solo para usuarios Pro con email confirmado
// Cruza comida de la semana + progreso en ejercicios + objetivo del perfil
// y genera un análisis motivacional personalizado vía Gemini

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// ── Helpers de fecha ─────────────────────────────────────────────────────────

function toARDate(date: Date): Date {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000)
}

function dateRange(daysBack: number, daysBackEnd = 0): { start: string; end: string } {
  const now = toARDate(new Date())
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - daysBackEnd)
  const start = new Date(now)
  start.setUTCDate(start.getUTCDate() - daysBack)
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  }
}

// ── Envío de email vía Resend ─────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[weekly-analysis] RESEND_API_KEY no configurado")
    return false
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Rendi <hola@rendi.com.ar>",
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error("[weekly-analysis] Resend error:", err)
    return false
  }
  return true
}

// ── Template HTML del email ───────────────────────────────────────────────────

function buildEmailHtml(params: {
  name: string
  score: number
  analysis: string
  tip: string
  workoutCount: number
  avgCalories: number
  targetCalories: number
  topExerciseGain: string | null
  weekLabel: string
}): string {
  const { name, score, analysis, tip, workoutCount, avgCalories, targetCalories, weekLabel, topExerciseGain } = params

  const scoreColor = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444"
  const scorLabel  = score >= 8 ? "¡Semana excelente!" : score >= 5 ? "Semana regular" : "Semana para mejorar"

  const firstName = name.split(" ")[0] || "crack"

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu análisis semanal — Rendi</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background:#6D28D9;border-radius:16px 16px 0 0;padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://www.rendi.com.ar/icon-192.png" width="40" height="40" alt="Rendi" style="border-radius:10px;display:block;" />
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Rendi</p>
                    <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.75);">Entrenamiento inteligente</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);">${weekLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="background:#ffffff;padding:32px;">

              <p style="margin:0 0 4px;font-size:15px;color:#6b7280;">Hola, <strong>${firstName}</strong> 👋</p>
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Tu resumen de la semana</h1>

              <!-- SCORE -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">Score de la semana</p>
                          <p style="margin:4px 0 0;font-size:42px;font-weight:900;color:${scoreColor};line-height:1;">${score}<span style="font-size:20px;color:#9ca3af;">/10</span></p>
                          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${scoreColor};">${scorLabel}</p>
                        </td>
                        <td align="right" style="vertical-align:top;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:0 0 8px;">
                                <div style="background:#f3f4f6;border-radius:8px;padding:10px 16px;text-align:center;">
                                  <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;">ENTRENOS</p>
                                  <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#111827;">${workoutCount}</p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <div style="background:#f3f4f6;border-radius:8px;padding:10px 16px;text-align:center;">
                                  <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;">KCAL PROM</p>
                                  <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#111827;">${avgCalories}</p>
                                  <p style="margin:2px 0 0;font-size:9px;color:#9ca3af;">meta: ${targetCalories}</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${topExerciseGain ? `
              <!-- MEJOR PROGRESO -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#16a34a;letter-spacing:0.1em;text-transform:uppercase;">🏋️ Mejor progreso</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#166534;">${topExerciseGain}</p>
                  </td>
                </tr>
              </table>` : ""}

              <!-- ANÁLISIS IA -->
              <div style="margin-bottom:24px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">🤖 Análisis de tu semana</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">${analysis.replace(/\n/g, "<br/>")}</p>
              </div>

              <!-- TIP DE LA SEMANA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6D28D9,#7C3AED);border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.1em;text-transform:uppercase;">⚡ Tu foco para esta semana</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;line-height:1.5;">${tip}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.rendi.com.ar/app" style="display:inline-block;background:#6D28D9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">
                      Ver mi progreso →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">Este email es parte de tu plan <strong>Pro</strong>.</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">© 2025 Rendi · <a href="https://www.rendi.com.ar" style="color:#6D28D9;text-decoration:none;">rendi.com.ar</a></p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:11px;color:#d1d5db;">contacto.rendi@gmail.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "Falta GEMINI_API_KEY" }, { status: 500 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })

  // Rangos de fechas (Argentina)
  const thisWeek = dateRange(7, 0)
  const lastWeek = dateRange(14, 7)

  const arNow   = toARDate(new Date())
  const weekLabel = `Semana del ${new Date(thisWeek.start + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })} al ${arNow.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}`

  // Solo usuarios Pro con email
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, name, goal, tdee, protein, weight, height, gender, age")
    .eq("plan", "pro")

  if (pErr || !profiles?.length) {
    console.log("[weekly-analysis] Sin perfiles Pro:", pErr?.message)
    return NextResponse.json({ sent: 0 })
  }

  // Obtener emails desde auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap[u.id] = u.email
  }

  let sent = 0
  let errors = 0

  for (const profile of profiles) {
    const userId  = profile.user_id
    const email   = emailMap[userId]
    if (!email) continue

    try {
      // ── Datos de esta semana ──────────────────────────────────────────────
      const [foodRes, workoutRes, prevWorkoutRes] = await Promise.all([
        supabase
          .from("food_entries")
          .select("calories, protein, carbs, fat, name, created_at")
          .eq("user_id", userId)
          .gte("created_at", thisWeek.start)
          .lte("created_at", thisWeek.end + "T23:59:59"),
        supabase
          .from("workout_logs")
          .select("exercise_id, date, sets")
          .eq("user_id", userId)
          .gte("date", thisWeek.start)
          .lte("date", thisWeek.end),
        supabase
          .from("workout_logs")
          .select("exercise_id, date, sets")
          .eq("user_id", userId)
          .gte("date", lastWeek.start)
          .lte("date", lastWeek.end),
      ])

      const foodEntries   = foodRes.data   ?? []
      const workouts      = workoutRes.data  ?? []
      const prevWorkouts  = prevWorkoutRes.data ?? []

      // ── Cálculos de nutrición ─────────────────────────────────────────────
      const daysWithFood = new Set(foodEntries.map(f => f.created_at.slice(0, 10))).size
      const totalCal  = foodEntries.reduce((s, f) => s + (f.calories ?? 0), 0)
      const totalProt = foodEntries.reduce((s, f) => s + (f.protein  ?? 0), 0)
      const avgCalories = daysWithFood > 0 ? Math.round(totalCal / daysWithFood) : 0
      const avgProtein  = daysWithFood > 0 ? Math.round(totalProt / daysWithFood) : 0
      const targetCal   = profile.tdee ?? 2000
      const targetProt  = profile.protein ?? 120
      const adherence   = targetCal > 0 ? Math.round((avgCalories / targetCal) * 100) : 0

      // ── Cálculos de entrenamiento ─────────────────────────────────────────
      const workoutCount = new Set(workouts.map(w => w.date)).size

      // Comparar pesos máximos por ejercicio vs semana anterior
      type ExSets = { sets: Array<{ weight: number; reps: number }> }
      const maxWeightThisWeek: Record<string, number> = {}
      const maxWeightLastWeek: Record<string, number> = {}

      for (const log of workouts as Array<{ exercise_id: string } & ExSets>) {
        const exId = log.exercise_id
        for (const s of log.sets ?? []) {
          if ((s.weight ?? 0) > (maxWeightThisWeek[exId] ?? 0))
            maxWeightThisWeek[exId] = s.weight
        }
      }
      for (const log of prevWorkouts as Array<{ exercise_id: string } & ExSets>) {
        const exId = log.exercise_id
        for (const s of log.sets ?? []) {
          if ((s.weight ?? 0) > (maxWeightLastWeek[exId] ?? 0))
            maxWeightLastWeek[exId] = s.weight
        }
      }

      // Mejor ganancia de peso en un ejercicio
      let topGainKg   = 0
      let topGainExId = ""
      for (const [exId, wNow] of Object.entries(maxWeightThisWeek)) {
        const wPrev = maxWeightLastWeek[exId] ?? 0
        const gain  = wNow - wPrev
        if (gain > topGainKg) { topGainKg = gain; topGainExId = exId }
      }

      // Si el ID tiene __ (formato baseId__customSlug), usar la parte del customSlug
      // Si no, usar el baseId. Convertir slug a nombre legible.
      const rawExName = topGainExId.includes("__")
        ? topGainExId.split("__")[1]   // "sentadillas-pendular"
        : topGainExId.replace(/^custom-/, "")
      const exDisplayName = rawExName
        .replace(/-/g, " ")
        .replace(/^\w/, c => c.toUpperCase())

      const topExerciseGain = topGainKg > 0
        ? `Subiste ${topGainKg} kg en ${exDisplayName} respecto a la semana pasada 💪`
        : null

      // ── Score sintético (0-10) ────────────────────────────────────────────
      // Componentes: adherencia calórica (4pts), proteína (2pts), entrenamientos (4pts)
      const goalLabel: Record<string, string> = { cut: "bajar de peso", maintain: "mantener peso", bulk: "ganar músculo" }
      const calScore  = Math.min(4, Math.round((Math.min(adherence, 120) / 120) * 4))
      const protScore = avgProtein > 0 ? Math.min(2, Math.round((Math.min(avgProtein / targetProt, 1)) * 2)) : 0
      const gymScore  = Math.min(4, workoutCount)
      const score     = Math.max(1, calScore + protScore + gymScore)

      // ── Generar análisis con Gemini ───────────────────────────────────────
      const prompt = `Sos un coach fitness de Argentina que escribe mensajes motivacionales en español rioplatense (vos, che, etc.).

DATOS DE LA SEMANA de ${profile.name ?? "el usuario"}:
- Objetivo: ${goalLabel[profile.goal] ?? profile.goal}
- Entrenamientos realizados: ${workoutCount} días
- Días con comida registrada: ${daysWithFood}
- Calorías promedio/día: ${avgCalories} kcal (meta: ${targetCal} kcal)
- Proteína promedio/día: ${avgProtein}g (meta: ${targetProt}g)
- Score de la semana: ${score}/10
${topExerciseGain ? `- Mejor progreso: ${topExerciseGain}` : "- Sin datos de ejercicios comparables con semana anterior"}

Respondé en formato JSON exacto (sin markdown, sin backticks):
{
  "analysis": "<2-3 oraciones analizando la semana. Si fue buena, celebrala. Si fue regular, motivá sin juzgar. Si fue mala, sé compasivo y esperanzador. Mencioná datos concretos de los que tenés. Máximo 80 palabras.>",
  "tip": "<Una sola acción concreta y específica para la próxima semana. Que sea alcanzable. Máximo 25 palabras.>"
}`

      const result  = await model.generateContent(prompt)
      const rawText = result.response.text().trim()
        .replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim()

      let analysis = "¡Seguí adelante, cada semana es una nueva oportunidad!"
      let tip      = "Registrá al menos 4 días de entrenamiento y comida esta semana."

      try {
        const parsed = JSON.parse(rawText)
        if (parsed.analysis) analysis = parsed.analysis
        if (parsed.tip)      tip      = parsed.tip
      } catch {
        console.warn("[weekly-analysis] No se pudo parsear respuesta Gemini para", userId)
      }

      // ── Construir y enviar email ──────────────────────────────────────────
      const html = buildEmailHtml({
        name: profile.name ?? "Usuario",
        score,
        analysis,
        tip,
        workoutCount,
        avgCalories,
        targetCalories: targetCal,
        topExerciseGain,
        weekLabel,
      })

      const subject = score >= 8
        ? `🏆 Tu semana fue épica, ${(profile.name ?? "").split(" ")[0] || "crack"} — Resumen Rendi`
        : score >= 5
        ? `📊 Tu resumen semanal está listo — Rendi`
        : `💪 Nueva semana, nueva oportunidad — Resumen Rendi`

      const ok = await sendEmail(email, subject, html)
      if (ok) sent++
      else errors++

    } catch (err) {
      console.error(`[weekly-analysis] Error procesando userId=${userId}:`, (err as Error).message)
      errors++
    }
  }

  console.log(`[weekly-analysis] sent=${sent} errors=${errors}`)
  return NextResponse.json({ sent, errors })
}
