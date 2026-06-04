import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getAuthedUserId } from "@/lib/limits"

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { routine, exerciseNames } = await req.json()
    if (!routine || !routine.days) {
      return NextResponse.json({ error: "Rutina inválida" }, { status: 400 })
    }

    const workbook = XLSX.utils.book_new()

    // Una hoja por día
    routine.days.forEach((day: any) => {
      const rows: any[][] = [
        ["Ejercicio", "Series", "Repeticiones", "RPE", "Notas"],
      ]

      if (day.exercises.length === 0) {
        rows.push(["Día de descanso", "", "", "", ""])
      } else {
        day.exercises.forEach((ex: any) => {
          const name = exerciseNames?.[ex.exerciseId] ?? ex.customName ?? ex.exerciseId
          rows.push([name, ex.sets, ex.reps, ex.rpe ?? "", ""])
        })
      }

      const sheet = XLSX.utils.aoa_to_sheet(rows)

      // Ancho de columnas
      sheet["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 20 }]

      // Estilo header (negrita simulada con nombre de celda)
      const sheetName = day.label.slice(0, 31) // Excel limita a 31 chars
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    })

    // Hoja resumen
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
