"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Zap, Target, Flame, Star, CheckCircle2, Lock } from "lucide-react"
import type { WorkoutLog, FoodEntry } from "@/lib/types"

interface GamificationProps {
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
  workoutStreak: number
}

/* ─── tipos ─── */
interface Badge {
  id: string
  emoji: string
  name: string
  description: string
  earned: boolean
  earnedDate?: string
}

interface WeeklyChallenge {
  id: string
  title: string
  description: string
  current: number
  goal: number
  emoji: string
  color: string
}

/* ─── helpers de fechas ─── */
function getWeekStart(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1  // semana arranca lunes
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Fecha LOCAL "YYYY-MM-DD" para evitar desfase de timezone */
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function isSameWeek(dateStr: string): boolean {
  return dateStr >= toDateStr(getWeekStart())
}

/* ─── cálculo de streak ─── */
function calcWorkoutStreak(logs: WorkoutLog[]): number {
  if (!logs.length) return 0
  const dates = new Set(logs.map((l) => l.date))
  const today = toDateStr(new Date())
  let streak = 0
  const cursor = new Date()
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const ds = toDateStr(cursor)
    const dow = cursor.getDay()
    if (dates.has(ds)) {
      streak++
    } else if (dow === 0 || dow === 6) {
      // fin de semana sin entreno → no rompe
    } else if (ds === today) {
      // hoy todavía no entrenó → no rompe aún
    } else {
      break
    }
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break  // safety
  }
  return streak
}

/* ─── cálculo de racha nutrición ─── */
function calcNutritionStreak(entries: FoodEntry[]): number {
  const countByDay: Record<string, number> = {}
  for (const e of entries) {
    countByDay[e.date] = (countByDay[e.date] ?? 0) + 1
  }
  const today = toDateStr(new Date())
  let streak = 0
  const cursor = new Date()
  // si hoy no tiene 4 comidas aún, empieza desde ayer
  if ((countByDay[today] ?? 0) < 4) cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const ds = toDateStr(cursor)
    if ((countByDay[ds] ?? 0) >= 4) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
    if (streak > 365) break
  }
  return streak
}

/* ─── generador de badges ─── */
function buildBadges(
  logs: WorkoutLog[],
  entries: FoodEntry[],
  workoutStreak: number,
): Badge[] {
  const today = toDateStr(new Date())
  const nutritionStreak = calcNutritionStreak(entries)

  // días únicos de entrenamiento
  const workoutDays = new Set(logs.map((l) => l.date)).size

  // semanas donde entrenó 4+ días
  const weekMap: Record<string, Set<string>> = {}
  for (const log of logs) {
    const d = new Date(log.date)
    const monday = new Date(d)
    const dow = d.getDay()
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    const key = toDateStr(monday)
    if (!weekMap[key]) weekMap[key] = new Set()
    weekMap[key].add(log.date)
  }
  const perfectWeeks = Object.values(weekMap).filter((s) => s.size >= 4).length

  // meses con 12+ entrenamientos
  const monthMap: Record<string, number> = {}
  for (const log of logs) {
    const month = log.date.slice(0, 7)
    monthMap[month] = (monthMap[month] ?? 0) + 1
  }
  const activeMths = Object.values(monthMap).filter((c) => c >= 12).length

  // días con 4+ comidas
  const fullNutritionDays = Object.values(
    entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.date] = (acc[e.date] ?? 0) + 1
      return acc
    }, {})
  ).filter((c) => c >= 4).length

  // primer entrenamiento
  const firstWorkout = logs.length > 0

  // primer scan (entries que tengan "Escaneado" en el nombre)
  const hasScanned = entries.some((e) => e.name.toLowerCase().includes("escane"))

  return [
    {
      id: "first_workout",
      emoji: "💪",
      name: "Primer paso",
      description: "Registrá tu primer entrenamiento",
      earned: firstWorkout,
    },
    {
      id: "week_warrior",
      emoji: "⚡",
      name: "Week Warrior",
      description: "Entrenaste 4+ veces en una semana",
      earned: perfectWeeks >= 1,
    },
    {
      id: "streak_7",
      emoji: "🔥",
      name: "Semana de fuego",
      description: "7 días consecutivos entrenando",
      earned: workoutStreak >= 7,
    },
    {
      id: "streak_30",
      emoji: "🔥🔥",
      name: "Mes imparable",
      description: "30 días de racha de entrenamiento",
      earned: workoutStreak >= 30,
    },
    {
      id: "first_month",
      emoji: "🏅",
      name: "Primer mes",
      description: "12+ entrenamientos en un mes",
      earned: activeMths >= 1,
    },
    {
      id: "nutrition_starter",
      emoji: "🥗",
      name: "Primer día completo",
      description: "Registrá tus 4 comidas en un día",
      earned: fullNutritionDays >= 1,
    },
    {
      id: "nutrition_week",
      emoji: "🥦",
      name: "Nutricionista pro",
      description: "7 días seguidos con 4 comidas registradas",
      earned: nutritionStreak >= 7,
    },
    {
      id: "centurion",
      emoji: "🏆",
      name: "Centurión",
      description: "100 sesiones de entrenamiento",
      earned: workoutDays >= 100,
    },
    {
      id: "scanner",
      emoji: "📸",
      name: "Foodie digital",
      description: "Escaneá una comida con la cámara",
      earned: hasScanned,
    },
    {
      id: "consistent",
      emoji: "⭐",
      name: "Constante",
      description: "3 semanas perfectas (4+ días/semana)",
      earned: perfectWeeks >= 3,
    },
  ]
}

/* ─── generador de challenges semanales ─── */
function buildWeeklyChallenges(
  logs: WorkoutLog[],
  entries: FoodEntry[],
): WeeklyChallenge[] {
  const weekStart = toDateStr(getWeekStart())

  const workoutDaysThisWeek = new Set(
    logs.filter((l) => l.date >= weekStart).map((l) => l.date)
  ).size

  const totalSetsThisWeek = logs
    .filter((l) => l.date >= weekStart)
    .reduce((acc, l) => acc + l.sets.length, 0)

  const nutritionDaysThisWeek = Object.entries(
    entries
      .filter((e) => e.date >= weekStart)
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.date] = (acc[e.date] ?? 0) + 1
        return acc
      }, {})
  ).filter(([, count]) => count >= 4).length

  return [
    {
      id: "train_4",
      emoji: "🏋️",
      title: "Entrená 4 veces",
      description: "Completá 4 sesiones de entrenamiento esta semana",
      current: Math.min(workoutDaysThisWeek, 4),
      goal: 4,
      color: "primary",
    },
    {
      id: "nutrition_5",
      emoji: "🥗",
      title: "5 días de nutrición completa",
      description: "Registrá tus 4 comidas durante 5 días esta semana",
      current: Math.min(nutritionDaysThisWeek, 5),
      goal: 5,
      color: "primary",
    },
    {
      id: "volume_100",
      emoji: "💪",
      title: "100 series en la semana",
      description: "Hacé al menos 100 series de ejercicios",
      current: Math.min(totalSetsThisWeek, 100),
      goal: 100,
      color: "purple",
    },
  ]
}

/* ─── componentes visuales ─── */

function ChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  const pct = Math.round((challenge.current / challenge.goal) * 100)
  const done = challenge.current >= challenge.goal

  const colorClasses: Record<string, { bar: string; bg: string; text: string }> = {
    primary:  { bar: "bg-primary", bg: "bg-primary/10",   text: "text-primary" },
    emerald:  { bar: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600" },
    purple:   { bar: "bg-purple-500", bg: "bg-purple-500/10",  text: "text-purple-600" },
  }
  const c = colorClasses[challenge.color] ?? colorClasses.primary

  return (
    <div className={`rounded-2xl p-4 border transition-all ${done ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{challenge.emoji}</span>
          <div>
            <p className="text-sm font-bold leading-tight">{challenge.title}</p>
            <p className="text-xs text-muted-foreground leading-tight">{challenge.description}</p>
          </div>
        </div>
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        ) : (
          <span className={`text-xs font-bold ${c.text} shrink-0`}>{pct}%</span>
        )}
      </div>
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${done ? "bg-primary" : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[11px] font-semibold mt-1.5 ${c.text}`}>
        {challenge.current} / {challenge.goal}{done && " · ¡Completado! 🎉"}
      </p>
    </div>
  )
}

function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
        badge.earned
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-secondary/30 opacity-50 grayscale"
      }`}
    >
      <div className="relative">
        <span className="text-2xl">{badge.emoji}</span>
        {!badge.earned && (
          <Lock className="absolute -bottom-0.5 -right-1 h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <p className="text-[10px] font-bold text-center leading-tight line-clamp-2">{badge.name}</p>
    </div>
  )
}

/* ─── componente principal ─── */
export function Gamification({ workoutLogs, foodEntries, workoutStreak }: GamificationProps) {
  const streak = workoutStreak > 0 ? workoutStreak : calcWorkoutStreak(workoutLogs)

  const badges = useMemo(
    () => buildBadges(workoutLogs, foodEntries, streak),
    [workoutLogs, foodEntries, streak]
  )

  const challenges = useMemo(
    () => buildWeeklyChallenges(workoutLogs, foodEntries),
    [workoutLogs, foodEntries]
  )

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="space-y-4">
      {/* ─── CHALLENGES SEMANALES ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-bold">Desafíos de la semana</h2>
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {challenges.filter((c) => c.current >= c.goal).length}/{challenges.length} completos
          </span>
        </div>
        <div className="space-y-3">
          {challenges.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} />
          ))}
        </div>
      </section>

      {/* ─── BADGES ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
          <h2 className="text-lg font-bold">Logros</h2>
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-600">
            <Trophy className="h-3.5 w-3.5" />
            {earnedCount}/{badges.length}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {badges.map((b) => (
            <BadgeItem key={b.id} badge={b} />
          ))}
        </div>
      </section>
    </div>
  )
}
