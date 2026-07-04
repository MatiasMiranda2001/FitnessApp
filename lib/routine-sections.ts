// lib/routine-sections.ts
// Modelo compartido para agrupar los ejercicios de un día de rutina en secciones
// tipo "bloques" de entrenamiento: activación, principal, complementario, accesorio, cardio.
// Se usa tanto en el generador con IA, el builder manual, como en las pantallas de
// visualización/entrenamiento, para que todas muestren la misma agrupación y orden.

import type { RoutineSection } from "./types"

export const SECTION_ORDER: RoutineSection[] = [
  "activacion",
  "principal",
  "complementario",
  "accesorio",
  "cardio",
]

export const SECTION_META: Record<RoutineSection, { label: string; shortLabel: string; emoji: string; hint: string }> = {
  activacion: {
    label: "Activación",
    shortLabel: "Activación",
    emoji: "🔥",
    hint: "Calentamiento / movilidad antes de cargar peso",
  },
  principal: {
    label: "Bloque principal",
    shortLabel: "Principal",
    emoji: "🏋️",
    hint: "Ejercicios compuestos pesados, el foco de la sesión",
  },
  complementario: {
    label: "Complementario",
    shortLabel: "Complementario",
    emoji: "🔗",
    hint: "Segundo compuesto o variante para el mismo grupo muscular",
  },
  accesorio: {
    label: "Accesorio",
    shortLabel: "Accesorio",
    emoji: "🎯",
    hint: "Aislamiento / detalle muscular",
  },
  cardio: {
    label: "Cardio",
    shortLabel: "Cardio",
    emoji: "🏃",
    hint: "Cierre cardiovascular opcional",
  },
}

/** Devuelve una sección válida; si viene vacía/inválida, cae a "principal". */
export function normalizeSection(value: unknown): RoutineSection {
  if (typeof value === "string" && (SECTION_ORDER as string[]).includes(value)) {
    return value as RoutineSection
  }
  return "principal"
}

/**
 * Agrupa una lista de ejercicios (o cualquier objeto con `section?`) en el orden
 * fijo de SECTION_ORDER, preservando el índice original de cada ítem dentro del
 * array de origen (útil para no perder la referencia al editar/eliminar).
 */
export function groupBySection<T extends { section?: RoutineSection }>(
  items: T[]
): { section: RoutineSection; entries: { item: T; index: number }[] }[] {
  const buckets: Partial<Record<RoutineSection, { item: T; index: number }[]>> = {}
  items.forEach((item, index) => {
    const section = normalizeSection(item.section)
    if (!buckets[section]) buckets[section] = []
    buckets[section]!.push({ item, index })
  })
  return SECTION_ORDER
    .filter((s) => buckets[s] && buckets[s]!.length > 0)
    .map((s) => ({ section: s, entries: buckets[s]! }))
}
