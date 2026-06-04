"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, Activity, Utensils, Pencil, Zap, Droplet, Flame, Crown, ChevronRight, Target, Scale, TrendingUp, Trophy } from "lucide-react"
import Link from "next/link"
import type { UserProfile, WorkoutLog, FoodEntry, Goal } from "@/lib/types"
import { WorkoutHistory } from "@/components/workout-history"
import { NotificationSettings } from "@/components/notification-settings"
import { saveProfile, calculateTDEE, calculateMacros } from "@/lib/store"
import { useAppData } from "@/lib/hooks/use-store"

interface ProfileViewProps {
  profile: UserProfile
  workoutLogs: WorkoutLog[]
  foodEntries?: FoodEntry[]
  onReset: () => void
}

export function ProfileView({ profile, workoutLogs, foodEntries = [], onReset }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(profile)
  const { billing } = useAppData()
  const isPro = billing.plan === "pro"

  // --- DATOS ENTRENAMIENTO ---
  const safeLogs = workoutLogs || []
  const totalWorkouts = safeLogs.length
  const totalSets = safeLogs.reduce((acc, log) => acc + (log.sets ? log.sets.length : 0), 0)
  
  // --- DATOS NUTRICIÓN (VERSION MEJORADA) ---
  const _t = new Date()
  const today = `${_t.getFullYear()}-${String(_t.getMonth()+1).padStart(2,"0")}-${String(_t.getDate()).padStart(2,"0")}`
  const todayEntries = foodEntries.filter(f => f.date === today)
  
  // Sumatorias de hoy
  const todayCalories = todayEntries.reduce((acc, curr) => acc + curr.calories, 0)
  const todayProtein = todayEntries.reduce((acc, curr) => acc + curr.protein, 0)
  const todayCarbs = todayEntries.reduce((acc, curr) => acc + curr.carbs, 0)
  const todayFats = todayEntries.reduce((acc, curr) => acc + curr.fat, 0)

  // Metas estimadas (Podríamos hacerlas editables en el futuro, por ahora usamos un estándar fitness)
  // Meta aprox basada en peso: Peso * 33 (ej: 70kg * 33 = 2300)
  const targetCalories = (profile?.weight || 75) * 33 
  const caloriesPercent = Math.min(100, (todayCalories / targetCalories) * 100)

  // Datos de usuario
  const userName = profile?.name || "Atleta"
  const initials = userName.substring(0, 2).toUpperCase()

  // --- IMC Y PESO IDEAL ---
  const bmi = profile?.height && profile?.weight
    ? profile.weight / Math.pow(profile.height / 100, 2)
    : null

  const bmiCategory = bmi === null ? null
    : bmi < 18.5 ? { label: "Bajo peso", color: "text-blue-500" }
    : bmi < 25   ? { label: "Normal", color: "text-green-500" }
    : bmi < 30   ? { label: "Sobrepeso", color: "text-yellow-500" }
    :              { label: "Obesidad", color: "text-red-500" }

  // Peso ideal según fórmula de Devine (rango ± 5 kg)
  const idealWeightBase = profile?.height
    ? (profile.gender === "female" ? 45.5 : 50) + 2.3 * ((profile.height / 2.54) - 60)
    : null
  const idealWeightRange = idealWeightBase
    ? { min: Math.round(idealWeightBase - 5), max: Math.round(idealWeightBase + 5) }
    : null

  const goalLabels: Record<Goal, string> = {
    cut:      "Perder grasa 🔥",
    bulk:     "Ganar músculo 💪",
    maintain: "Mantener peso ⚖️",
  }

  async function handleSaveProfile() {
    // Si cambió el objetivo, recalcular TDEE y macros
    const updated = { ...editForm }
    if (updated.goal !== profile.goal || updated.weight !== profile.weight || updated.height !== profile.height || updated.age !== profile.age) {
      const tdee = calculateTDEE(updated.gender, updated.age, updated.height, updated.weight)
      const macros = calculateMacros(tdee, updated.weight, updated.goal)
      updated.tdee    = macros.tdee
      updated.protein = macros.protein
      updated.carbs   = macros.carbs
      updated.fat     = macros.fat
    }
    await saveProfile(updated)
    setIsEditing(false)
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6">
      
      {/* --- ENCABEZADO --- */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
           <span className="font-bold text-2xl text-primary">{initials}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold truncate max-w-[180px]">{userName}</h1>
            
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input className="bg-secondary" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Edad</Label>
                      <Input className="bg-secondary" type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input className="bg-secondary" type="number" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Altura (cm)</Label>
                      <Input className="bg-secondary" type="number" value={editForm.height} onChange={e => setEditForm({...editForm, height: Number(e.target.value)})} placeholder="Ej: 175" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-sm"
                      value={editForm.goal}
                      onChange={e => setEditForm({...editForm, goal: e.target.value as Goal})}
                    >
                      <option value="cut">Perder grasa (déficit -500 kcal)</option>
                      <option value="maintain">Mantener peso (mantenimiento)</option>
                      <option value="bulk">Ganar músculo (superávit +300 kcal)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Al guardar se recalculan tus calorías y macros automáticamente.</p>
                  </div>
                  <Button className="w-full" onClick={handleSaveProfile}>Guardar Cambios</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {profile?.age || "--"} años • {profile?.weight || "--"} kg • {profile?.height || "--"} cm
          </p>
        </div>
      </div>

      {/* --- GRID DE RESUMEN (Ahora con Nutrición Vitaminada) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Tarjeta de Entrenamiento (Compacta) */}
        <Card className="bg-card border-border shadow-sm flex flex-row items-center p-4 gap-4">
           <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="h-5 w-5" />
           </div>
           <div>
              <p className="text-2xl font-bold leading-none">{totalWorkouts}</p>
              <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Sesiones Totales</p>
           </div>
           <div className="ml-auto text-right">
              <p className="text-lg font-bold leading-none">{totalSets}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Series</p>
           </div>
        </Card>

        {/* Tarjeta de Nutrición (ESTILO DASHBOARD) */}
        <Card className="bg-card border-border shadow-sm p-4 relative overflow-hidden">
           {/* Barra de progreso de fondo muy sutil */}
           <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${caloriesPercent}%` }}></div>
           </div>

           <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Utensils className="h-4 w-4" />
                 </div>
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hoy</span>
              </div>
              <div className="text-right">
                 <span className="text-xl font-bold">{todayCalories}</span>
                 <span className="text-xs text-muted-foreground ml-1">kcal</span>
              </div>
           </div>

           {/* Macros Mini Grid */}
           <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="flex flex-col items-center bg-secondary/50 rounded p-1.5">
                 <span className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                   <Zap className="h-3 w-3 text-blue-400" /> Prot
                 </span>
                 <span className="text-sm font-bold">{todayProtein}g</span>
              </div>
              <div className="flex flex-col items-center bg-secondary/50 rounded p-1.5">
                 <span className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                   <Droplet className="h-3 w-3 text-yellow-400" /> Carb
                 </span>
                 <span className="text-sm font-bold">{todayCarbs}g</span>
              </div>
              <div className="flex flex-col items-center bg-secondary/50 rounded p-1.5">
                 <span className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                   <Flame className="h-3 w-3 text-red-400" /> Gras
                 </span>
                 <span className="text-sm font-bold">{todayFats}g</span>
              </div>
           </div>
        </Card>

      </div>

      {/* --- CARD: MÉTRICAS CORPORALES + OBJETIVO --- */}
      {(bmi !== null || profile?.tdee) && (
        <Card className="bg-card border-border shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Métricas y objetivo</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* IMC */}
            {bmi !== null && (
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">IMC</span>
                </div>
                <p className="text-2xl font-bold leading-none">{bmi.toFixed(1)}</p>
                {bmiCategory && (
                  <p className={`text-xs font-semibold ${bmiCategory.color}`}>{bmiCategory.label}</p>
                )}
              </div>
            )}

            {/* Peso ideal */}
            {idealWeightRange && (
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Peso ideal</span>
                </div>
                <p className="text-xl font-bold leading-none">{idealWeightRange.min}–{idealWeightRange.max}</p>
                <p className="text-xs text-muted-foreground">kg estimados</p>
              </div>
            )}

            {/* Meta calórica */}
            {profile?.tdee && (
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Meta diaria</span>
                </div>
                <p className="text-2xl font-bold leading-none">{profile.tdee}</p>
                <p className="text-xs text-muted-foreground">kcal / día</p>
              </div>
            )}

            {/* Objetivo */}
            {profile?.goal && (
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Objetivo</span>
                </div>
                <p className="text-sm font-bold leading-snug">{goalLabels[profile.goal] ?? profile.goal}</p>
              </div>
            )}
          </div>

          {/* Nota sobre IMC */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            * El IMC es un indicador general. Si entrenás con pesas, puede subestimar tu composición corporal real.
          </p>
        </Card>
      )}

      {/* --- SECCIÓN PROGRESO --- */}
      <ProgressSection workoutLogs={safeLogs} foodEntries={foodEntries} tdee={profile?.tdee || 2000} />

      <WorkoutHistory logs={safeLogs} />

      {/* RECORDATORIOS */}
      <NotificationSettings initialPrefs={(profile as UserProfile & { notification_prefs?: unknown })?.notification_prefs as never} />

      {/* PLAN & FACTURACIÓN */}
      <Link href="/billing" className="block">
        <Card className={`bg-card border-border shadow-sm p-4 flex items-center gap-3 hover:border-primary/50 transition-colors ${isPro ? "border-primary/30 bg-gradient-to-r from-primary/5 to-transparent" : ""}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isPro ? "bg-brand-gradient text-white" : "bg-secondary text-muted-foreground"}`}>
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{isPro ? "Plan Pro" : "Plan Free"}</p>
            <p className="text-xs text-muted-foreground">
              {isPro ? "Suscripción activa — gestionar" : "Mejora a Pro · $7.500/mes"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      <div className="mt-4 pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onReset}
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
      </div>

      {/* SOPORTE */}
      <div className="mt-2 pb-2 text-center space-y-1">
        <p className="text-xs text-muted-foreground">¿Tenés ideas, sugerencias o necesitás ayuda?</p>
        <a
          href="mailto:contacto.rendi@gmail.com"
          className="text-xs font-medium text-primary hover:underline"
        >
          contacto.rendi@gmail.com
        </a>
        <p className="text-[10px] text-muted-foreground/50 pt-1">Rendi · Hecho con ❤️ en Argentina</p>
      </div>
    </div>
  )
}

// ── Sección de Progreso ──────────────────────────────────────────
type Period = "7d" | "30d" | "3m"

function ProgressSection({
  workoutLogs,
  foodEntries,
  tdee,
}: {
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
  tdee: number
}) {
  const [period, setPeriod] = useState<Period>("30d")
  const { customExercises } = useAppData()

  // Lookup nombre del ejercicio. WorkoutLog tiene exerciseId, no exerciseName.
  // Importamos defaultExercises de forma lazy para mantener el bundle chico.
  const lookup: Record<string, string> = (() => {
    const map: Record<string, string> = {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { defaultExercises } = require("@/lib/exercises") as {
        defaultExercises: { id: string; name: string }[]
      }
      defaultExercises.forEach(e => { map[e.id] = e.name })
    } catch {}
    customExercises?.forEach(e => { map[e.id] = e.name })
    return map
  })()

  const getExerciseName = (id: string): string => {
    if (lookup[id]) return lookup[id]
    // Fallback: ID legible
    return id.replace(/^custom-/i, "").replace(/-/g, " ") || "Ejercicio"
  }

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90

  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - periodDays)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}`

  const logsInPeriod = workoutLogs.filter(l => l.date >= cutoffStr)
  const foodInPeriod = foodEntries.filter(f => f.date >= cutoffStr)

  // Sesiones únicas por día (un workout_log = una entrada de ejercicio,
  // así que múltiples logs del mismo día son la misma sesión)
  const sessions = new Set(logsInPeriod.map(l => l.date)).size

  // Volumen total del período (kg × reps)
  const totalVolume = logsInPeriod.reduce(
    (acc, log) => acc + (log.sets ?? []).reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0
  )

  // PR: ejercicio con mayor mejora de peso máximo en el período (vs anterior al cutoff)
  const prExercise = (() => {
    if (!logsInPeriod.length) return null
    const periodMax: Record<string, number> = {}
    logsInPeriod.forEach(log => {
      const maxW = Math.max(0, ...(log.sets ?? []).map(s => s.weight ?? 0))
      if (maxW > 0) periodMax[log.exerciseId] = Math.max(periodMax[log.exerciseId] ?? 0, maxW)
    })
    const prevMax: Record<string, number> = {}
    workoutLogs.filter(l => l.date < cutoffStr).forEach(log => {
      const maxW = Math.max(0, ...(log.sets ?? []).map(s => s.weight ?? 0))
      if (maxW > 0) prevMax[log.exerciseId] = Math.max(prevMax[log.exerciseId] ?? 0, maxW)
    })
    let best: { name: string; diff: number } | null = null
    Object.entries(periodMax).forEach(([id, cur]) => {
      const diff = cur - (prevMax[id] ?? 0)
      if (diff > 0 && (!best || diff > best.diff)) {
        best = { name: getExerciseName(id), diff }
      }
    })
    return best
  })()

  // Gráfico volumen semanal (kg totales por semana)
  const totalWeeks = Math.ceil(periodDays / 7)
  const weeklyVolume = Array.from({ length: totalWeeks }, (_, i) => {
    const weekStart = new Date(cutoff); weekStart.setDate(weekStart.getDate() + i * 7)
    const weekEnd   = new Date(cutoff); weekEnd.setDate(weekEnd.getDate() + (i + 1) * 7)
    const wStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`
    const wEndStr   = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,"0")}-${String(weekEnd.getDate()).padStart(2,"0")}`
    const vol = logsInPeriod
      .filter(l => l.date >= wStartStr && l.date < wEndStr)
      .reduce((acc, log) => acc + (log.sets ?? []).reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0)
    return { label: `S${i + 1}`, value: vol }
  })

  // Adherencia calórica: % días donde las kcal del día están dentro de ±20% del TDEE
  const target = tdee || 2000
  const weeklyAdherence = Array.from({ length: totalWeeks }, (_, i) => {
    const weekStart = new Date(cutoff); weekStart.setDate(weekStart.getDate() + i * 7)
    const weekEnd   = new Date(cutoff); weekEnd.setDate(weekEnd.getDate() + (i + 1) * 7)
    const wStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`
    const wEndStr   = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,"0")}-${String(weekEnd.getDate()).padStart(2,"0")}`
    // Sumar kcal por día de la semana
    const byDay: Record<string, number> = {}
    foodInPeriod
      .filter(f => f.date >= wStartStr && f.date < wEndStr)
      .forEach(f => { byDay[f.date] = (byDay[f.date] ?? 0) + (f.calories ?? 0) })
    const dayKeys = Object.keys(byDay)
    if (dayKeys.length === 0) return { label: `S${i + 1}`, value: 0 }
    const goodDays = dayKeys.filter(d => Math.abs(byDay[d] - target) / target <= 0.20).length
    return { label: `S${i + 1}`, value: Math.round((goodDays / dayKeys.length) * 100) }
  })

  const maxVol = Math.max(...weeklyVolume.map(w => w.value), 1)
  const noData = sessions === 0 && foodInPeriod.length === 0

  return (
    <Card className="bg-card border-border shadow-sm p-4 space-y-4">
      {/* Header + selector de período */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Progreso
        </h3>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(["7d", "30d", "3m"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                period === p ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {noData ? (
        <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
          Sin datos en este período. ¡Empezá a entrenar y registrar comidas!
        </div>
      ) : (
        <>
          {/* Métricas clave — 3 cards estilo mockup */}
          <div className="grid grid-cols-3 gap-2">
            {/* Volumen total */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-primary leading-none tabular-nums">
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : totalVolume}
                <span className="text-xs font-bold ml-0.5">{totalVolume >= 1000 ? "" : "kg"}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Volumen total</p>
            </div>

            {/* Sesiones */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-emerald-500 leading-none tabular-nums">
                {sessions} <span className="text-xs font-bold">ses.</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Entrenamientos</p>
            </div>

            {/* PR */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
              {prExercise ? (
                <>
                  <p className="text-xl font-extrabold text-amber-500 leading-none tabular-nums">
                    +{(prExercise as { name: string; diff: number }).diff}<span className="text-xs font-bold">kg</span>
                  </p>
                  <p
                    className="text-[10px] text-muted-foreground mt-1 font-semibold truncate"
                    title={(prExercise as { name: string; diff: number }).name}
                  >
                    PR {(prExercise as { name: string; diff: number }).name.split(" ").slice(0, 2).join(" ")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-extrabold text-muted-foreground/50 leading-none">—</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Sin PR aún</p>
                </>
              )}
            </div>
          </div>

          {/* Gráfico volumen semanal */}
          {weeklyVolume.some(w => w.value > 0) && (
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Volumen semanal (kg totales)</p>
              <div className="flex items-end gap-1.5 h-16">
                {weeklyVolume.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (w.value / maxVol) * 52)}px`,
                        background: "linear-gradient(180deg, hsl(var(--primary) / .7), hsl(var(--primary)))",
                      }}
                      title={`${w.value.toLocaleString()} kg`}
                    />
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico adherencia calórica (% días dentro del target ±20%) */}
          {weeklyAdherence.some(w => w.value > 0) && (
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold text-muted-foreground">Adherencia calórica</p>
                <p className="text-[10px] text-muted-foreground">target ±20% · {target} kcal</p>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {weeklyAdherence.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (w.value / 100) * 52)}px`,
                        background: "linear-gradient(180deg, #34D399, #10B981)",
                      }}
                      title={`${w.value}% días en target`}
                    />
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
