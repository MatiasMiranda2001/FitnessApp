"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, History, TrendingUp, BarChart3 } from "lucide-react"
import type { WorkoutLog } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { loadData, estimate1RM } from "@/lib/store"
import { ProgressChart } from "./progress-chart"

interface WorkoutHistoryProps {
  logs: WorkoutLog[]
}

export function WorkoutHistory({ logs }: WorkoutHistoryProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("all")

  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises]
  }, [])

  // Ejercicios que realmente has entrenado
  // Incluye también los que no están en el catálogo (ej: custom eliminados o de rutinas)
  const trainedExercises = useMemo(() => {
    const catalogMap = new Map(allExercises.map(e => [e.id, e]))
    const seen = new Map<string, { id: string; name: string; muscleGroup: string }>()
    logs.forEach(log => {
      if (!seen.has(log.exerciseId)) {
        const found = catalogMap.get(log.exerciseId)
        seen.set(log.exerciseId, found ?? {
          id: log.exerciseId,
          name: log.exerciseId.split("-").filter(p => isNaN(Number(p)) && p.toLowerCase() !== "custom").join(" ").trim() || "Ejercicio",
          muscleGroup: "Otro",
        })
      }
    })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [logs, allExercises])

  // 1. Filtrar logs por ejercicio seleccionado
  const filteredLogs = useMemo(() => {
    let data = logs
    if (selectedExerciseId !== "all") {
      data = data.filter(log => log.exerciseId === selectedExerciseId)
    }
    // Ordenamos por fecha descendente (más nuevo primero) para la tabla
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [logs, selectedExerciseId])

  // 2. Preparar datos para el GRÁFICO (Lógica corregida: Máximo del día)
  const chartData = useMemo(() => {
    if (selectedExerciseId === "all") return []

    // Map para guardar el MEJOR 1RM de cada fecha
    const bestByDay = new Map<string, number>()

    filteredLogs.forEach(log => {
      // a. Buscamos el mejor set de ESTA sesión
      const bestSetOfSession = log.sets.reduce((prev, current) => {
        const pRM = estimate1RM(prev.weight, prev.reps)
        const cRM = estimate1RM(current.weight, current.reps)
        return cRM > pRM ? current : prev
      }, log.sets[0] || { weight: 0, reps: 0 })

      const session1RM = estimate1RM(bestSetOfSession.weight, bestSetOfSession.reps)
      
      // b. Usamos solo la fecha (ignorando hora) como clave
      const dateKey = log.date.split('T')[0] 

      // c. Si ya hay un registro ese día, nos quedamos con el MAYOR (Fuerza Máxima Diaria)
      const currentBest = bestByDay.get(dateKey) || 0
      if (session1RM > currentBest) {
        bestByDay.set(dateKey, session1RM)
      }
    })

    // 3. Convertimos a array y ordenamos cronológicamente (Viejo -> Nuevo) para el gráfico
    return Array.from(bestByDay.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  }, [filteredLogs, selectedExerciseId])

  const getExerciseName = (id: string) => allExercises.find(e => e.id === id)?.name || "Ejercicio"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Progreso por ejercicio</h2>
      </div>

      <div className="space-y-4">
        {/* Selector de Ejercicio */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selecciona Ejercicio</label>
          <select
            className="w-full h-11 px-3 py-2 rounded-lg border border-input bg-card text-sm shadow-sm focus:ring-1 focus:ring-primary"
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
          >
            <option value="all">-- Seleccionar para ver Gráfico --</option>
            {trainedExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        {selectedExerciseId !== "all" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* GRÁFICO DE EVOLUCIÓN */}
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <ProgressChart 
                  data={chartData} 
                  title="Fuerza Máxima (Mejor 1RM por día)" 
                />
              </CardContent>
            </Card>

            {/* TABLA DETALLADA */}
            <div className="space-y-2">
               <div className="flex justify-between items-end px-1">
                 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Historial Detallado</h3>
                 <span className="text-[10px] text-muted-foreground">Más recientes primero</span>
               </div>
               
               <div className="rounded-lg border border-border overflow-hidden bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-muted-foreground bg-secondary/50 uppercase">
                      <tr>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium">Series Efectivas</th>
                        <th className="px-3 py-2 font-medium text-right">1RM Calc.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLogs.map((log) => {
                        // Calcular mejor set para mostrar su 1RM
                        const bestSet = log.sets.reduce((p, c) => 
                          (estimate1RM(c.weight, c.reps) > estimate1RM(p.weight, p.reps) ? c : p)
                        , log.sets[0] || {weight:0, reps:0})
                        
                        return (
                          <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                            <td className="px-3 py-3 font-medium whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(log.date), "dd MMM", { locale: es })}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                {log.sets.map((s, i) => (
                                  <span key={i} className="text-xs font-mono">
                                    <span className="font-bold text-foreground">{s.weight}kg</span>
                                    <span className="text-muted-foreground mx-0.5">x</span>
                                    <span>{s.reps}</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-primary font-bold text-xs align-top pt-3">
                              {estimate1RM(bestSet.weight, bestSet.reps)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-secondary/5 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
               <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Analiza tu rendimiento</h3>
            <p className="text-xs text-muted-foreground max-w-[250px] mt-1">
              Selecciona un ejercicio arriba para ver tu curva de fuerza y tus registros.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}