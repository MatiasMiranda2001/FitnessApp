"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Activity, Flame, Dumbbell, TrendingUp, Camera, Bot,
  Apple, Zap, ChevronRight, Sparkles,
} from "lucide-react"
import { loadData } from "@/lib/store"
import type { WorkoutLog, FoodEntry } from "@/lib/types"
import { Gamification } from "@/components/gamification"

interface DashboardProps {
  dataVersion: number
  onNavigate?: (tab: string) => void
}

export function Dashboard({ dataVersion, onNavigate }: DashboardProps) {
  const { profile, foodEntries, workoutLogs } = useMemo(() => loadData(), [dataVersion])

  // ---------- TOTALES DE HOY ----------
  // Usamos fecha LOCAL para evitar desfase de timezone (ej. Argentina UTC-3)
  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,"0")}-${String(_now.getDate()).padStart(2,"0")}`

  const todaysMacros = foodEntries
    .filter((entry) => entry.date === today)
    .reduce(
      (acc, curr) => ({
        calories: acc.calories + (curr.calories || 0),
        protein: acc.protein + (curr.protein || 0),
        carbs: acc.carbs + (curr.carbs || 0),
        fat: acc.fat + (curr.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

  const targets = {
    calories: profile?.tdee || 2000,
    protein: profile?.protein || 150,
    carbs: profile?.carbs || 200,
    fat: profile?.fat || 60,
  }

  const todaysWorkouts = workoutLogs.filter((log) => log.date === today)
  const totalSets = todaysWorkouts.reduce((acc, log) => acc + log.sets.length, 0)

  const weeklyVolume = workoutLogs.reduce((acc, log) => {
    const vol = log.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0)
    return acc + vol
  }, 0)

  // ---------- DÍAS ENTRENADOS ESTA SEMANA ----------
  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay() // 0 = domingo, 1 = lunes, ...
    const diff = day === 0 ? 6 : day - 1 // empieza lunes
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const daysThisWeek = new Set(
    workoutLogs
      .filter((l) => new Date(l.date) >= weekStart)
      .map((l) => l.date)
  ).size

  // ---------- STREAK ----------
  const streak = useMemo(() => calculateStreak(workoutLogs), [workoutLogs])

  // ---------- ACTIVIDAD RECIENTE ----------
  const recentActivity = useMemo(
    () => buildRecentActivity(foodEntries, workoutLogs).slice(0, 4),
    [foodEntries, workoutLogs]
  )

  // ---------- SALUDO ----------
  const hour = new Date().getHours()
  const greeting =
    hour < 6 ? "Buenas noches" :
    hour < 13 ? "Buenos días" :
    hour < 20 ? "Buenas tardes" : "Buenas noches"
  const firstName = profile?.name?.trim().split(" ")[0] || "atleta"
  const dateLabel = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // ---------- HELPERS ----------
  const safePct = (current: number, target: number) => {
    if (!target) return 0
    const pct = (current / target) * 100
    return isNaN(pct) ? 0 : Math.min(100, pct)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ============ HEADER: SALUDO + STREAK ============ */}
      {/* pr-12 para no chocar con el círculo de perfil fijo */}
      <header className="pr-12">
        <p className="text-xs text-muted-foreground capitalize">{dateLabel}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, <span className="capitalize">{firstName}</span> 👋
          </h1>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1 shrink-0">
              <span className="text-sm leading-none">🔥</span>
              <span className="text-sm font-bold text-orange-600">{streak}</span>
              <span className="text-[9px] uppercase font-bold text-orange-600/70 tracking-wider">{streak === 1 ? "día" : "días"}</span>
            </div>
          )}
        </div>
      </header>

      {/* ============ QUICK ACTIONS ============ */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction
          icon={<Camera className="h-5 w-5" />}
          label="Escanear"
          sublabel="comida"
          gradient
          onClick={() => onNavigate?.("nutrition")}
        />
        <QuickAction
          icon={<Dumbbell className="h-5 w-5" />}
          label="Entrenar"
          sublabel="ahora"
          onClick={() => onNavigate?.("workout")}
        />
        <QuickAction
          icon={<Bot className="h-5 w-5" />}
          label="AI Coach"
          sublabel="preguntá"
          onClick={() => onNavigate?.("coach")}
        />
      </div>

      {/* ============ TARJETA PRINCIPAL: CALORÍAS + MACROS ============ */}
      <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm relative overflow-hidden">
        {/* Decoración blob */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--cream-blob)) 0%, transparent 70%)" }}
        />

        <CardContent className="p-6 sm:p-8 flex flex-col items-center relative z-10">
          {/* Header de la card */}
          <div className="w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Apple className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Hoy</p>
                <p className="text-sm font-bold">Resumen nutricional</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.("nutrition")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              Ver todo
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Anillo principal */}
          <CircularProgress
            size={180}
            strokeWidth={14}
            value={safePct(todaysMacros.calories, targets.calories)}
            color="text-primary"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold tracking-tight">
                {Math.round(todaysMacros.calories)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                de {targets.calories} kcal
              </span>
            </div>
          </CircularProgress>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full max-w-sm mt-8">
            <MacroCircle
              label="Proteína"
              current={todaysMacros.protein}
              target={targets.protein}
              color="text-primary"
            />
            <MacroCircle
              label="Carbos"
              current={todaysMacros.carbs}
              target={targets.carbs}
              color="text-amber-500"
            />
            <MacroCircle
              label="Grasas"
              current={todaysMacros.fat}
              target={targets.fat}
              color="text-rose-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* ============ STATS GRID ============ */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          color="orange"
          value={Math.max(0, targets.calories - todaysMacros.calories)}
          label="kcal restantes"
        />
        <StatCard
          icon={<Dumbbell className="h-4 w-4" />}
          color="blue"
          value={totalSets}
          label="series hoy"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
          value={weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}k` : weeklyVolume}
          label="volumen (kg)"
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          color="purple"
          value={`${daysThisWeek}/7`}
          label="días esta semana"
        />
      </div>

      {/* ============ GAMIFICACIÓN: DESAFÍOS + BADGES ============ */}
      <Gamification
        workoutLogs={workoutLogs}
        foodEntries={foodEntries}
        workoutStreak={streak}
      />

      {/* ============ ACTIVIDAD RECIENTE ============ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary rounded-full" />
            Actividad reciente
          </h2>
        </div>

        {recentActivity.length === 0 ? (
          <Card className="bg-secondary/30 border-dashed border-2 border-border">
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 mx-auto bg-card rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold mb-1">Aún sin actividad</p>
              <p className="text-xs text-muted-foreground mb-4">
                Empezá registrando una comida o tu primer entrenamiento.
              </p>
              <button
                onClick={() => onNavigate?.("nutrition")}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Registrar ahora
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((act) => (
              <ActivityRow key={act.id} {...act} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ----------------------- HELPERS DE CÁLCULO ----------------------- */

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function calculateStreak(workoutLogs: WorkoutLog[]): number {
  if (workoutLogs.length === 0) return 0
  const dates = new Set(workoutLogs.map((l) => l.date))
  let streak = 0
  const today = new Date()
  const todayStr = localDateStr(today)
  let cursor = new Date(today)
  if (!dates.has(todayStr)) cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const cursorStr = localDateStr(cursor)
    if (dates.has(cursorStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }
  return streak
}

type ActivityItem = {
  id: string
  type: "food" | "workout"
  emoji: string
  title: string
  subtitle: string
  date: string
}

function buildRecentActivity(foods: FoodEntry[], workouts: WorkoutLog[]): ActivityItem[] {
  const items: ActivityItem[] = [
    ...foods.map<ActivityItem>((f) => ({
      id: `f-${f.id}`,
      type: "food",
      emoji: "🍽️",
      title: f.name,
      subtitle: `${f.calories} kcal · ${f.protein}p ${f.carbs}c ${f.fat}g`,
      date: f.date,
    })),
    ...workouts.map<ActivityItem>((w) => ({
      id: `w-${w.id}`,
      type: "workout",
      emoji: "💪",
      title: "Entrenamiento",
      subtitle: `${w.sets.length} ${w.sets.length === 1 ? "serie" : "series"}`,
      date: w.date,
    })),
  ]
  return items.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/* ----------------------- SUB-COMPONENTES ----------------------- */

function QuickAction({
  icon, label, sublabel, gradient, onClick,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  gradient?: boolean
  onClick?: () => void
}) {
  const baseClasses = "rounded-2xl p-4 text-left transition-all active:scale-95 hover:shadow-lg"
  const gradientClasses = "bg-brand-gradient text-white shadow-md shadow-primary/30 hover:shadow-primary/40"
  const normalClasses = "bg-card border border-border text-foreground hover:border-primary/40"
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${gradient ? gradientClasses : normalClasses}`}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 ${gradient ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <p className="text-sm font-bold leading-tight">{label}</p>
      <p className={`text-[11px] leading-tight ${gradient ? "text-white/80" : "text-muted-foreground"}`}>
        {sublabel}
      </p>
    </button>
  )
}

function StatCard({
  icon, color, value, label,
}: {
  icon: React.ReactNode
  color: "orange" | "blue" | "green" | "purple"
  value: number | string
  label: string
}) {
  const colorMap = {
    orange: "bg-orange-500/15 text-orange-600",
    blue: "bg-blue-500/15 text-blue-600",
    green: "bg-primary/15 text-primary",
    purple: "bg-primary/15 text-primary",
  }
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex flex-col justify-center h-full">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium ml-11">{label}</p>
      </CardContent>
    </Card>
  )
}

function ActivityRow({ emoji, title, subtitle, date }: ActivityItem) {
  // Formato fecha relativo simple
  const today = localDateStr(new Date())
  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  const label =
    date === today ? "Hoy" :
    date === yesterday ? "Ayer" :
    new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">
        {label}
      </span>
    </div>
  )
}

function MacroCircle({
  label, current, target, color,
}: { label: string; current: number; target: number; color: string }) {
  const safeTarget = target || 1
  const pct = Math.min(100, (current / safeTarget) * 100)
  const safePctVal = isNaN(pct) ? 0 : pct
  const displayCurrent = isNaN(current) ? 0 : Math.round(current)

  return (
    <div className="flex flex-col items-center">
      <CircularProgress size={64} strokeWidth={6} value={safePctVal} color={color} bgColor="text-secondary">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">{displayCurrent}</span>
          <span className="text-[9px] text-muted-foreground">g</span>
        </div>
      </CircularProgress>
      <p className="text-xs font-medium text-muted-foreground mt-2">{label}</p>
    </div>
  )
}

function CircularProgress({
  size, strokeWidth, value, color, children, bgColor = "text-secondary",
}: any) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const safeValue = isNaN(value) ? 0 : value
  const offset = circumference - (safeValue / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          className={bgColor}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isNaN(offset) ? circumference : offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
