"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Dumbbell, Zap, Scale, Flame, BarChart3 } from "lucide-react"
import type { WorkoutLog, FoodEntry, UserProfile } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { loadData, estimate1RM } from "@/lib/store"
import { ProgressChart } from "./progress-chart"
import { format, subDays, startOfWeek, eachWeekOfInterval } from "date-fns"
import { es } from "date-fns/locale"

interface ProgressScreenProps {
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
  profile: UserProfile | null
}

type Range = "7d" | "30d" | "3m"

// ─── Mini bar chart SVG ───────────────────────────────────────
function BarChart({ bars, color }: { bars: { label: string; value: number; max: number }[]; color: string }) {
  if (bars.every(b => b.value === 0)) {
    return (
      <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">
        Sin datos en este período
      </div>
    )
  }
  const maxVal = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-28 w-full pt-2">
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((b.value / maxVal) * 80, b.value > 0 ? 4 : 0)}px`,
                backgroundColor: color,
                opacity: 0.85,
              }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground leading-none">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export function ProgressScreen({ workoutLogs, foodEntries, profile }: ProgressScreenProps) {
  const [range, setRange] = useState<Range>("30d")
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("none")

  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises]
  }, [])

  // ── Rango de fechas ──
  const cutoff = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    return subDays(new Date(), days)
  }, [range])

  const logsInRange = useMemo(
    () => workoutLogs.filter(l => new Date(l.date) >= cutoff),
    [workoutLogs, cutoff]
  )
  const foodInRange = useMemo(
    () => foodEntries.filter(f => new Date(f.date) >= cutoff),
    [foodEntries, cutoff]
  )

  // ── Métricas clave ──
  const metrics = useMemo(() => {
    // Sesiones
    const sessions = new Set(logsInRange.map(l => l.date)).size

    // Mejor PR mejorado en el rango
    let bestPrLabel = ""
    let bestPrDelta = 0
    const exerciseIds = [...new Set(logsInRange.map(l => l.exerciseId))]
    exerciseIds.forEach(id => {
      const logsForEx = workoutLogs.filter(l => l.exerciseId === id).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const inRange = logsForEx.filter(l => new Date(l.date) >= cutoff)
      const before = logsForEx.filter(l => new Date(l.date) < cutoff)
      if (inRange.length === 0) return

      const best1RMNow = Math.max(...inRange.flatMap(l => l.sets.map(s => estimate1RM(s.weight, s.reps))))
      const best1RMBefore = before.length > 0
        ? Math.max(...before.flatMap(l => l.sets.map(s => estimate1RM(s.weight, s.reps))))
        : 0
      const delta = best1RMNow - best1RMBefore
      if (delta > bestPrDelta) {
        bestPrDelta = delta
        const name = allExercises.find(e => e.id === id)?.name ?? "Ejercicio"
        bestPrLabel = name.length > 18 ? name.slice(0, 16) + "…" : name
      }
    })

    // Peso corporal delta
    let weightDelta: number | null = null
    if (profile?.weight) {
      // Usamos el peso actual del perfil como referencia
      weightDelta = null // No tenemos historial de peso aún, lo dejamos null
    }

    return { sessions, bestPrDelta, bestPrLabel, weightDelta }
  }, [logsInRange, workoutLogs, allExercises, profile, cutoff])

  // ── Volumen semanal ──
  const weeklyVolumeBars = useMemo(() => {
    const weeks = range === "7d" ? 1 : range === "30d" ? 4 : 12
    const bars = []
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = subDays(new Date(), i * 7)
      const weekStart = subDays(weekEnd, 6)
      const vol = workoutLogs
        .filter(l => {
          const d = new Date(l.date)
          return d >= weekStart && d <= weekEnd
        })
        .reduce((sum, l) => sum + l.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0)
      bars.push({
        label: range === "7d"
          ? format(weekStart, "dd/MM", { locale: es })
          : `S${weeks - i}`,
        value: vol,
        max: 0,
      })
    }
    return bars
  }, [workoutLogs, range])

  // ── Adherencia calórica semanal ──
  const adherenceBars = useMemo(() => {
    if (!profile?.tdee) return []
    const weeks = range === "7d" ? 1 : range === "30d" ? 4 : 12
    const bars = []
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = subDays(new Date(), i * 7)
      const weekStart = subDays(weekEnd, 6)
      const daysInWeek = 7
      const targetWeek = profile.tdee * daysInWeek
      const actualWeek = foodEntries
        .filter(f => {
          const d = new Date(f.date)
          return d >= weekStart && d <= weekEnd
        })
        .reduce((sum, f) => sum + f.calories, 0)
      // adherencia: % de días con al menos 1 registro
      const daysLogged = new Set(
        foodEntries
          .filter(f => { const d = new Date(f.date); return d >= weekStart && d <= weekEnd })
          .map(f => f.date)
      ).size
      const adherence = Math.min(Math.round((daysLogged / daysInWeek) * 100), 100)
      bars.push({
        label: range === "7d"
          ? format(weekStart, "dd/MM", { locale: es })
          : `S${weeks - i}`,
        value: adherence,
        max: 100,
      })
    }
    return bars
  }, [foodEntries, profile, range])

  // ── Ejercicios con historial (selector) ──
  const trainedExercises = useMemo(() => {
    const catalogMap = new Map(allExercises.map(e => [e.id, e]))
    const seen = new Map<string, { id: string; name: string }>()
    workoutLogs.forEach(log => {
      if (!seen.has(log.exerciseId)) {
        const found = catalogMap.get(log.exerciseId)
        const fallbackName = log.exerciseId
          .split("-")
          .filter(p => isNaN(Number(p)) && p.toLowerCase() !== "custom")
          .join(" ")
          .trim() || "Ejercicio"
        seen.set(log.exerciseId, {
          id: log.exerciseId,
          name: found?.name ?? fallbackName,
        })
      }
    })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [workoutLogs, allExercises])

  // ── Chart data para ejercicio seleccionado ──
  const chartData = useMemo(() => {
    if (selectedExerciseId === "none") return []
    const logs = workoutLogs.filter(l => l.exerciseId === selectedExerciseId)
    const bestByDay = new Map<string, number>()
    logs.forEach(log => {
      const best = Math.max(...log.sets.map(s => estimate1RM(s.weight, s.reps)))
      const dateKey = log.date.split("T")[0]
      if ((bestByDay.get(dateKey) ?? 0) < best) bestByDay.set(dateKey, best)
    })
    return Array.from(bestByDay.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [workoutLogs, selectedExerciseId])

  return (
    <div className="flex flex-col gap-5 px-4 pb-28 pt-6">

      {/* Header + selector de rango */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progreso</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["7d", "30d", "3m"] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                range === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-3 gap-2">
        {/* Sesiones */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <Dumbbell className="h-4 w-4 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-black text-primary leading-none">{metrics.sessions}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Sesiones</p>
          </CardContent>
        </Card>

        {/* Volumen total */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <BarChart3 className="h-4 w-4 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-emerald-500 leading-none">
              {logsInRange.reduce((sum, l) => sum + l.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0) > 999
                ? `${(logsInRange.reduce((sum, l) => sum + l.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0) / 1000).toFixed(0)}k`
                : logsInRange.reduce((sum, l) => sum + l.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">kg totales</p>
          </CardContent>
        </Card>

        {/* Mejor PR */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <Zap className="h-4 w-4 text-yellow-500 mx-auto mb-1.5" />
            {metrics.bestPrDelta > 0 ? (
              <>
                <p className="text-2xl font-black text-yellow-500 leading-none">+{metrics.bestPrDelta}<span className="text-sm font-medium">kg</span></p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight truncate px-1">{metrics.bestPrLabel}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-muted-foreground leading-none">—</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Sin PR nuevo</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico volumen semanal */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Volumen semanal (kg totales)
          </p>
          <BarChart bars={weeklyVolumeBars} color="#7C3AED" />
        </CardContent>
      </Card>

      {/* Gráfico adherencia nutricional */}
      {profile?.tdee ? (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Adherencia calórica (% días registrados)
            </p>
            <BarChart bars={adherenceBars} color="#10b981" />
          </CardContent>
        </Card>
      ) : null}

      {/* Sección: evolución por ejercicio */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold">Evolución por ejercicio</h2>
        </div>

        <select
          className="w-full h-11 px-3 rounded-lg border border-input bg-card text-sm shadow-sm focus:ring-1 focus:ring-primary mb-4"
          value={selectedExerciseId}
          onChange={e => setSelectedExerciseId(e.target.value)}
        >
          <option value="none">— Seleccionar ejercicio —</option>
          {trainedExercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        {selectedExerciseId !== "none" ? (
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <ProgressChart
                data={chartData}
                title="1RM estimado (kg)"
                color="#7C3AED"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="border border-dashed border-border rounded-xl p-8 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Seleccioná un ejercicio para ver tu curva de fuerza</p>
          </div>
        )}
      </div>

    </div>
  )
}
