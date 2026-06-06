// Endpoint para generar una rutina semanal con IA (Gemini).
// Recibe los parámetros del wizard (objetivo, frecuencia, duración, nivel, equipo, foco)
// y devuelve un JSON estructurado tipo WeeklyRoutine usando IDs del catálogo defaultExercises.
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { getAuthedUserId } from "@/lib/limits"
import { defaultExercises } from "@/lib/exercises"

interface GenerateRequest {
  goal: "bulk" | "cut" | "maintain"
  frequency: number          // 1..6
  durationMin: 30 | 45 | 60
  level: "beginner" | "intermediate" | "advanced"
  equipment: "gym" | "home_dumbbells" | "bodyweight"
  focusGroups?: string[]     // ["Pecho", "Brazos", ...] opcional
}

// Extrae el primer objeto JSON balanceado del texto (Gemini a veces lo envuelve en markdown).
function extractJsonObject(raw: string): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/```json|```/gi, "").trim()
  const first = cleaned.indexOf("{")
  const last  = cleaned.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) return null
  return cleaned.slice(first, last + 1)
}

export async function POST(req: Request) {
  // 1. Auth — solo usuarios logueados pueden generar rutinas
  const userId = await getAuthedUserId()
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2. API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Falta API Key" }, { status: 500 })
  }

  // 3. Parsear body
  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const {
    goal, frequency, durationMin, level, equipment,
    focusGroups = [],
  } = body

  // Validaciones básicas
  if (!goal || !frequency || !durationMin || !level || !equipment) {
    return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
  }
  if (frequency < 1 || frequency > 6) {
    return NextResponse.json({ error: "Frecuencia inválida" }, { status: 400 })
  }

  // 4. Catálogo de ejercicios disponibles. Filtramos por equipamiento.
  //    Para "bodyweight" excluimos ejercicios con barra y máquinas (heurística por nombre).
  const catalog = defaultExercises.filter(e => {
    const n = e.name.toLowerCase()
    if (equipment === "bodyweight") {
      const requiresEquipment = /barra|máquina|maquina|polea|mancuerna|kettlebell|smith|press de banca|peso muerto|sentadilla con barra/.test(n)
      return !requiresEquipment
    }
    if (equipment === "home_dumbbells") {
      const onlyGym = /polea|máquina|maquina|smith|prensa de pierna|jalón al pecho con polea|cable/.test(n)
      return !onlyGym
    }
    return true
  })

  // Si tras el filtro queda muy poco, fallback al catálogo completo
  const finalCatalog = catalog.length >= 10 ? catalog : defaultExercises

  // 5. Mapeos legibles para el prompt
  const goalLabel: Record<string, string> = {
    bulk: "Ganar músculo (hipertrofia y fuerza)",
    cut: "Perder grasa (manteniendo músculo)",
    maintain: "Mantener / mejorar condición general",
  }
  const levelLabel: Record<string, string> = {
    beginner: "Principiante (menos de 6 meses de gym)",
    intermediate: "Intermedio (6-24 meses)",
    advanced: "Avanzado (más de 2 años)",
  }
  const equipmentLabel: Record<string, string> = {
    gym: "Gimnasio completo (barras, mancuernas, máquinas, poleas)",
    home_dumbbells: "Casa con mancuernas y barra básica",
    bodyweight: "Solo peso corporal (sin equipamiento)",
  }

  // 6. Construir prompt
  const exercisesByGroup: Record<string, { id: string; name: string }[]> = {}
  finalCatalog.forEach(e => {
    const g = e.muscleGroup || "Otro"
    if (!exercisesByGroup[g]) exercisesByGroup[g] = []
    exercisesByGroup[g].push({ id: e.id, name: e.name })
  })

  const catalogText = Object.entries(exercisesByGroup)
    .map(([group, items]) =>
      `### ${group}\n` + items.map(e => `- ID:"${e.id}" — ${e.name}`).join("\n")
    )
    .join("\n\n")

  const focusText = focusGroups.length > 0
    ? `El usuario quiere ENFASIS EXTRA en estos grupos: ${focusGroups.join(", ")}. Agrega 1-2 ejercicios extra por sesión cuando corresponda.`
    : `Distribuí los grupos musculares de forma balanceada.`

  // Cantidad sugerida de ejercicios por sesión según duración
  const exercisesPerSession =
    durationMin === 30 ? "4-5" :
    durationMin === 45 ? "5-7" :
    "7-9"

  const prompt = `
Sos un entrenador personal certificado con experiencia en planificación de rutinas de gym.
Vas a armar una rutina SEMANAL personalizada para un usuario con estos datos:

- Objetivo: ${goalLabel[goal]}
- Frecuencia: ${frequency} entrenamientos por semana
- Tiempo disponible por sesión: ${durationMin} minutos
- Nivel: ${levelLabel[level]}
- Equipamiento disponible: ${equipmentLabel[equipment]}
- ${focusText}

CATÁLOGO de ejercicios disponibles (USÁ EXCLUSIVAMENTE estos IDs, NO inventes nuevos):
${catalogText}

REGLAS DE PROGRAMACIÓN:
- Distribución según frecuencia y nivel:
  · 1-2 días → Full Body cada día
  · 3 días → Push / Pull / Legs (avanzado) o Full Body x3 (principiante)
  · 4 días → Upper/Lower x2
  · 5 días → Push / Pull / Legs / Upper / Lower
  · 6 días → Push / Pull / Legs x2
- Ejercicios por sesión: ${exercisesPerSession}
- Series: 3-4 para principiante, 3-5 para intermedio, 4-5 para avanzado
- Reps según objetivo:
  · Hipertrofia (bulk): "8-12" o "10-12"
  · Fuerza (bulk avanzado): "5-8"
  · Pérdida grasa (cut): "10-15" para mantener volumen
  · Resistencia/Mantener: "12-15"
- RPE: 7 para principiante, 7-8 para intermedio, 8-9 para avanzado
- Empezá cada día con ejercicios compuestos pesados, después accesorios

DEVOLVÉ EXCLUSIVAMENTE UN JSON VÁLIDO con esta estructura exacta (sin markdown, sin texto extra antes ni después):

{
  "name": "Nombre creativo y corto (max 40 chars) que refleje el objetivo y la frecuencia",
  "description": "Resumen en 1 frase de qué busca esta rutina",
  "days": [
    {
      "dayNumber": 1,
      "label": "Día 1 — [Tipo: Push / Pull / Legs / Upper / Lower / Full Body]",
      "exercises": [
        { "exerciseId": "id-exacto-del-catalogo", "sets": 4, "reps": "8-12", "rpe": 7 }
      ]
    }
  ]
}

IMPORTANTE: cada "exerciseId" debe ser uno de los IDs del catálogo de arriba, EXACTAMENTE como aparece.
`.trim()

  // 7. Llamada a Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: {
        // Forzar JSON mode si el modelo lo soporta
        responseMimeType: "application/json",
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // 8. Parsear JSON
    const jsonStr = extractJsonObject(text)
    if (!jsonStr) {
      console.error("[generate-routine] Gemini no devolvió JSON parseable:", text.slice(0, 300))
      return NextResponse.json(
        { error: "El modelo no devolvió una rutina válida. Probá de nuevo." },
        { status: 502 }
      )
    }

    let parsed: {
      name?: string
      description?: string
      days?: Array<{
        dayNumber?: number
        label?: string
        exercises?: Array<{ exerciseId?: string; sets?: number; reps?: string; rpe?: number; weight?: number }>
      }>
    }
    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      console.error("[generate-routine] JSON inválido:", jsonStr.slice(0, 200))
      return NextResponse.json(
        { error: "No pudimos interpretar la rutina generada. Probá de nuevo." },
        { status: 502 }
      )
    }

    // 9. Validar y sanitizar la rutina contra el catálogo
    if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      return NextResponse.json({ error: "La rutina generada está vacía" }, { status: 502 })
    }

    const validIds = new Set(finalCatalog.map(e => e.id))

    const sanitizedDays = parsed.days
      .slice(0, frequency)
      .map((day, idx) => {
        const exercises = (day.exercises ?? [])
          .filter(ex => ex.exerciseId && validIds.has(ex.exerciseId))
          .map(ex => ({
            exerciseId: ex.exerciseId!,
            sets: Math.max(1, Math.min(10, Number(ex.sets) || 3)),
            reps: typeof ex.reps === "string" && ex.reps.trim() ? ex.reps.trim() : "8-12",
            rpe: ex.rpe !== undefined ? Math.max(1, Math.min(10, Number(ex.rpe))) : 7,
            ...(ex.weight !== undefined ? { weight: Number(ex.weight) } : {}),
          }))

        return {
          dayNumber: idx + 1,
          label: day.label?.trim() || `Día ${idx + 1}`,
          exercises,
        }
      })
      .filter(d => d.exercises.length > 0)

    if (sanitizedDays.length === 0) {
      return NextResponse.json(
        { error: "La rutina generada no tiene ejercicios válidos" },
        { status: 502 }
      )
    }

    const routine = {
      id: `routine-ai-${Date.now()}`,
      name: parsed.name?.trim().slice(0, 60) || "Rutina IA",
      description: parsed.description?.trim().slice(0, 200),
      days: sanitizedDays,
      isTemplate: false,
    }

    return NextResponse.json({ routine })

  } catch (err: unknown) {
    const error = err as { status?: number; statusCode?: number; message?: string }
    const code = error?.status ?? error?.statusCode
    const msg = error?.message ?? "Error desconocido"
    console.error("[generate-routine] error:", { code, msg })

    if (code === 429) {
      return NextResponse.json(
        { error: "Demasiadas generaciones en poco tiempo. Esperá unos segundos y reintentá." },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { error: "No pudimos generar la rutina ahora. Probá de nuevo." },
      { status: 500 }
    )
  }
}
