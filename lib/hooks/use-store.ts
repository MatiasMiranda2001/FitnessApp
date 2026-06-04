// Hook para suscribirse al store en memoria. El store es síncrono pero
// las escrituras propagan cambios vía `subscribe`, así obligamos a re-render.
"use client"

import { useSyncExternalStore } from "react"
import { loadData, subscribe } from "@/lib/store"
import type { AppData } from "@/lib/types"

export function useAppData(): AppData {
  // `subscribe` ya devuelve la función de limpieza correcta
  return useSyncExternalStore(subscribe, loadData, loadData)
}
