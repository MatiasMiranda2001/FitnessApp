// Routines routes: export-excel + import-excel merged into one file to stay within Vercel Hobby lambda limit
// Use ?action=export or ?action=import query param to distinguish
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getAuthedUserId } from "@/lib/limits"

const AVAILABLE_EXERCISES = [
  { id: "squat", name: "Sentadilla con Barra", muscleGroup: "Piernas" },
  { id: "leg-press", name: "Prensa de Piernas", muscleGroup: "Piernas" },
  { id: "romanian-deadlift", name: "Peso Muerto Rumano", muscleGroup: "Piernas" },
  { id: "bulgarian-split-squat", name: "Sentadilla Búlgara", muscleGroup: "Piernas" },
  { id: "quad-extension", name: "Extensiones de Cuádriceps", muscleGroup: "Piernas" },
  { id: "hamstring-curl", name: "Curl Femoral (Tumbado/Sentado)", muscleGroup: "Piernas" },
  { id: "lunges", name: "Zancadas (Lunges)", muscleGroup: "Piernas" },
  { id: "calf-raise", name: "Elevación de Gemelos", muscleGroup: "Piernas" },
  { id: "hip-thrust", name: "Hip Thrust", muscleGroup: "Piernas" },
  { id: "deadlift", name: "Peso Muerto Convencional", muscleGroup: "Espalda" },
  { id: "pull-ups", name: "Dominadas", muscleGroup: "Espalda" },
  { id: "lat-pulldown", name: "Jalón al Pecho", muscleGroup: "Espalda" },
  { id: "barbell-row", name: "Remo con Barra", muscleGroup: "Espalda" },
  { id: "dumbbell-row", name: "Remo con Mancuerna", muscleGroup: "Espalda" },
  { id: "cable-row", name: "Remo en Polea Baja", muscleGroup: "Espalda" },
  { id: "pullover-cable", name: "Pullover en Polea Alta", muscleGroup: "Espalda" },
  { id: "bench-press", name: "Press de Banca (Barra)", muscleGroup: "Pecho" },
  { id: "dumbbell-press", name: "Press Plano con Mancuernas", muscleGroup: "Pecho" },
  { id: "incline-bench", name: "Press Inclinado (Mancuernas)", muscleGroup: "Pecho" },
  { id: "incline-barbell", name: "Press Inclinado (Barra)", muscleGroup: "Pecho" },
  { id: "dips", name: "Fondos en Paralelas", muscleGroup: "Pecho" },
  { id: "cable-fly", name: "Cruce de Poleas (Aperturas)", muscleGroup: "Pecho" },
  { id: "push-ups", name: "Flexiones (Push-ups)", muscleGroup: "Pecho" },
  { id: "overhead-press", name: "Press Militar (Barra)", muscleGroup: "Hombros" },
  { id: "dumbbell-shoulder-press", name: "Press de Hombros (Mancuernas)", muscleGroup: "Hombros" },
  { id: "lateral-raises", name: "Elevaciones Laterales", muscleGroup: "Hombros" },
  { id: "face-pull", name: "Face Pull", muscleGroup: "Hombros" },
  { id: "rear-delt-fly", name: "Pájaros (Posterior)", muscleGroup: "Hombros" },
  { id: "bicep-curl-barbell", name: "Curl de Bíceps con Barra", muscleGroup: "Brazos" },
  { id: "bicep-curl-dumbbell", name: "Curl de Bíceps con Mancuernas", muscleGroup: "Brazos" },
  { id: "hammer-curl", name: "Curl Martillo", muscleGroup: "Brazos" },
  { id: "tricep-pushdown", name: "Extensión de Tríceps en Polea", muscleGroup: "Brazos" },
  { id: "skull-crushers", name: "Press Francés", muscleGroup: "Brazos" },
  { id: "tricep-overhead", name: "Extensión de Tríceps sobre cabeza", muscleGroup: "Brazos" },
  { id: "plank", name: "Plancha Abdominal (Plank)", muscleGroup: "Abdomen" },
  { id: "leg-raises", name: "Elevación de Piernas (Colgado/Suelo)", muscleGroup: "Abdomen" },
  { id: "ab-wheel", name: "Rueda Abdominal", muscleGroup: "Abdomen" },
  { id: "crunch", name: "Crunch Abdominal", muscleGroup: "Abdomen" },
  { id: "treadmill", name: "Cinta de Correr", muscleGroup: "Cardio" },
  { id: "cycling", name: "Bicicleta Estática", muscleGroup: "Cardio" },
  { id: "elliptical", name: "Elíptica", muscleGroup: "Cardio" },
  { id: "jump-rope", name: "Salto a la Comba", muscleGroup: "Cardio" },
]

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  if (action === "export") {
    return handleExport(req)
  }
  if (action === "import") {
    return handleImport(req)
  }
  return NextResponse.json({ error: "Acción inválida. Usá ?action=export o ?action=import" }, { status: 400 })
}

async function handleExport(req: Request) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { routine, exerciseNames } = await req.json()
    if (!routine || !routine.days) return NextResponse.json({ error: "Rutina inválida" }, { status: 400 })

    const workbook = XLSX.utils.book_new()

    routine.days.forEach((day: any) => {
      const rows: any[][] = [["Ejercicio", "Series", "Repeticiones", "RPE", "Notas"]]

      if (day.exercises.length === 0) {
        rows.push(["Día de descanso", "", "", "", ""])
      } else {
        day.exercises.forEach((ex: any) => {
          const name = exerciseNames?.[ex.exerciseId] ?? ex.customName ?? ex.exerciseId
          rows.push([name, ex.sets, ex.reps, ex.rpe ?? "", ""])
        })
      }

      const sheet = XLSX.utils.aoa_to_sheet(rows)
      sheet["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 20 }]
      const sheetName = day.label.slice(0, 31)
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    })

    const summaryRows: any[][] = [
      ["Rutina", routine.name],
      ["Total de días", routine.days.length],
      [],
      ["Día", "Ejercicios"],
    ]
    routine.days.forEach((day: any) => {
      const count = day.exercises.length
      summaryRows.push([day.label, count === 0 ? "Descanso" : `${count} ejercicios`])
    })
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const filename = `${routine.name.replace(/[^a-z0-9áéíóúñ ]/gi, "")}.xlsx`

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error("[export-excel]", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

async function handleImport(req: Request) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Falta la API Key de Gemini" }, { status: 500 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })

    let sheetContent = ""
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet, { skipHidden: true })
      if (csv.trim()) {
        sheetContent += `\n--- Hoja: ${sheetName} ---\n${csv}\n`
      }
    })

    if (!sheetContent.trim()) {
      return NextResponse.json({ error: "El archivo está vacío o no tiene datos" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })

    const exerciseList = AVAILABLE_EXERCISES.map(
      (e) => `  - id: "${e.id}" | nombre: "${e.name}" | músculo: ${e.muscleGroup}`
    ).join("\n")

    const prompt = `Sos un asistente fitness experto. El usuario subió una planilla Excel con su rutina de entrenamiento.

Convertila en este JSON exacto (sin texto extra, sin markdown, sin backticks):

{
  "name": "Nombre de la rutina",
  "days": [
    {
      "dayNumber": 1,
      "label": "Día 1 - Piernas",
      "exercises": [
        { "exerciseId": "squat", "sets": 4, "reps": "8-10" }
      ]
    }
  ]
}

REGLAS:
1. Mapeá cada ejercicio al ID más apropiado de esta lista:
${exerciseList}
2. Si no hay equivalente, usá: { "exerciseId": "custom-NOMBRE", "sets": 3, "reps": "8-12", "customName": "Nombre original" }
3. sets = número entero (default 3). reps = string como "8-12" (default "8-12"). rpe opcional.
4. Agrupá por días/sesiones. Días de descanso: "exercises": [].
5. SOLO el JSON, nada más.

PLANILLA:
${sheetContent}`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text().trim()

    let parsedRoutine
    try {
      const cleaned = rawText.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim()
      parsedRoutine = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "No se pudo interpretar la planilla. Probá con un formato más simple (columnas: Día, Ejercicio, Series, Reps)." },
        { status: 422 }
      )
    }

    if (!parsedRoutine.name || !Array.isArray(parsedRoutine.days)) {
      return NextResponse.json({ error: "Respuesta de IA con formato inválido" }, { status: 422 })
    }

    const routine = {
      id: `routine-${Date.now()}`,
      name: String(parsedRoutine.name),
      days: (parsedRoutine.days as any[]).map((day, i) => ({
        dayNumber: day.dayNumber ?? i + 1,
        label: String(day.label ?? `Día ${i + 1}`),
        exercises: (day.exercises ?? []).map((ex: any) => ({
          exerciseId: String(ex.exerciseId),
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps ?? "8-12"),
          ...(ex.rpe ? { rpe: Number(ex.rpe) } : {}),
          ...(ex.customName ? { customName: String(ex.customName) } : {}),
        })),
      })),
    }

    return NextResponse.json({ routine })
  } catch (err: any) {
    console.error("[import-excel]", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
