// lib/wod.ts
// Helpers compartidos para bloques estilo CrossFit (AMRAP / EMOM / For Time):
// metadata de formato, creación de valores por defecto, y armado de resúmenes
// de texto para mostrar en las distintas pantallas (builder, hub de sesión, etc.).

import type { WodBlock, WodFormat, WodMovement } from "./types"

export const WOD_FORMATS: WodFormat[] = ["amrap", "emom", "for_time"]

export const WOD_FORMAT_META: Record<WodFormat, { label: string; shortLabel: string; emoji: string; hint: string }> = {
  amrap: {
    label: "AMRAP",
    shortLabel: "AMRAP",
    emoji: "🔄",
    hint: "As Many Rounds/Reps As Possible en un tiempo fijo",
  },
  emom: {
    label: "EMOM",
    shortLabel: "EMOM",
    emoji: "⏱️",
    hint: "Every Minute On the Minute — repetís al arrancar cada intervalo",
  },
  for_time: {
    label: "For Time",
    shortLabel: "For Time",
    emoji: "🏁",
    hint: "Completá el trabajo lo más rápido posible",
  },
}

let movementSeq = 0
export function newMovementId(): string {
  movementSeq += 1
  return `mv-${Date.now()}-${movementSeq}`
}

export function emptyMovement(): WodMovement {
  return { id: newMovementId(), name: "", reps: "" }
}

/** Bloque WOD con valores por defecto razonables para arrancar a editar. */
export function createDefaultWod(format: WodFormat = "amrap"): WodBlock {
  const base: WodBlock = { format, movements: [emptyMovement()] }
  if (format === "amrap") return { ...base, timeCapMin: 20 }
  if (format === "for_time") return { ...base, timeCapMin: 15 }
  if (format === "emom") return { ...base, emomIntervalSec: 60, emomRounds: 12 }
  return base
}

/** Al cambiar de formato, preserva movimientos/notas y resetea solo los campos de tiempo. */
export function switchWodFormat(wod: WodBlock, format: WodFormat): WodBlock {
  const { timeCapMin, rounds, emomIntervalSec, emomRounds, ...rest } = wod
  const timing = createDefaultWod(format)
  return {
    ...rest,
    format,
    timeCapMin: timing.timeCapMin,
    rounds: format === "for_time" ? rounds : undefined,
    emomIntervalSec: timing.emomIntervalSec,
    emomRounds: timing.emomRounds,
  }
}

export function totalWodSeconds(wod: WodBlock): number {
  if (wod.format === "emom") {
    return (wod.emomRounds ?? 0) * (wod.emomIntervalSec ?? 60)
  }
  return (wod.timeCapMin ?? 0) * 60
}

/** Resumen corto de una línea para mostrar en listas (ej. "AMRAP 20 min"). */
export function formatWodSummary(wod: WodBlock): string {
  if (wod.format === "amrap") {
    return `AMRAP ${wod.timeCapMin ?? "?"} min`
  }
  if (wod.format === "emom") {
    const intervalLabel = wod.emomIntervalSec === 60 ? "1:00" : `0:${String(wod.emomIntervalSec ?? 60).padStart(2, "0")}`
    return `EMOM ${wod.emomRounds ?? "?"} x ${intervalLabel}`
  }
  // for_time
  const roundsLabel = wod.rounds ? `${wod.rounds} rondas · ` : ""
  return `For Time · ${roundsLabel}cap ${wod.timeCapMin ?? "?"} min`
}

export function formatSecondsClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`
}
