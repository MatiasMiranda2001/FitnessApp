"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, Loader2, Bot, Trash2, Flame, Zap, Utensils, Dumbbell, Plus, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import type { ChatMessage, WeeklyRoutine } from "@/lib/types"
import { addChatMessage, loadData, clearChatHistory, saveRoutine } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { defaultExercises } from "@/lib/exercises"

interface AiCoachProps {
  dataVersion: number
  onUpdate: () => void
}

// Mapa de ID → nombre de ejercicio
const EXERCISE_NAMES: Record<string, string> = Object.fromEntries(
  defaultExercises.map((e) => [e.id, e.name])
)

// Extrae el JSON de rutina del mensaje si existe
function extractRoutine(text: string): { cleanText: string; routine: WeeklyRoutine | null } {
  const match = text.match(/<ROUTINE_JSON>([\s\S]*?)<\/ROUTINE_JSON>/)
  if (!match) return { cleanText: text, routine: null }
  const cleanText = text.replace(/<ROUTINE_JSON>[\s\S]*?<\/ROUTINE_JSON>/, "").trim()
  try {
    const parsed = JSON.parse(match[1].trim())
    if (!parsed.name || !Array.isArray(parsed.days)) return { cleanText, routine: null }
    const routine: WeeklyRoutine = {
      id: `routine-${Date.now()}`,
      name: String(parsed.name),
      days: parsed.days.map((d: any, i: number) => ({
        dayNumber: d.dayNumber ?? i + 1,
        label: String(d.label ?? `Día ${i + 1}`),
        exercises: (d.exercises ?? []).map((ex: any) => ({
          exerciseId: String(ex.exerciseId),
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps ?? "8-12"),
        })),
      })),
    }
    return { cleanText, routine }
  } catch {
    return { cleanText, routine: null }
  }
}

// Tarjeta de preview de rutina generada por IA
function RoutineCard({ routine, onAdd }: { routine: WeeklyRoutine; onAdd: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    saveRoutine(routine)
    setAdded(true)
    onAdd()
  }

  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">{routine.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{routine.days.length} días</span>
      </div>

      <div className="divide-y divide-border/50">
        {routine.days.map((day, i) => (
          <div key={i}>
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-primary/5 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                  {day.dayNumber}
                </span>
                <span className="text-xs font-medium">{day.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {day.exercises.length === 0 ? "Descanso" : `${day.exercises.length} ej.`}
                </span>
                {expanded === i ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </div>
            </button>
            {expanded === i && day.exercises.length > 0 && (
              <div className="px-3 pb-2 space-y-1">
                {day.exercises.map((ex, j) => (
                  <div key={j} className="flex justify-between items-center text-xs py-0.5">
                    <span className="text-foreground/80">{EXERCISE_NAMES[ex.exerciseId] ?? ex.exerciseId}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{ex.sets} × {ex.reps}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-2.5 border-t border-primary/20">
        {added ? (
          <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium py-0.5">
            <CheckCircle2 className="h-4 w-4" /> ¡Rutina agregada!
          </div>
        ) : (
          <Button size="sm" className="w-full h-8 text-xs bg-primary hover:bg-primary/90" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar a mis rutinas
          </Button>
        )}
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  "¿Cómo estuvo mi día?",
  "Haceme una rutina de 3 días",
  "¿Qué ejercicios para glúteos?",
  "¿Cómo están mis macros?",
]

const MEALS_GOAL = 4

export function AiCoach({ dataVersion, onUpdate }: AiCoachProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => loadData(), [dataVersion])
  const { chatHistory: storedMessages, profile, foodEntries, workoutLogs } = data

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(storedMessages)

  useEffect(() => {
    setLocalMessages(storedMessages)
  }, [storedMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages, isTyping])

  // ── Datos de hoy ──────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0]

  const todayEntries = foodEntries.filter((f) => f.date === today)
  const todayCalories = todayEntries.reduce((acc, f) => acc + f.calories, 0)
  const todayProtein  = todayEntries.reduce((acc, f) => acc + f.protein,  0)
  const todayCarbs    = todayEntries.reduce((acc, f) => acc + f.carbs,    0)
  const todayFat      = todayEntries.reduce((acc, f) => acc + f.fat,      0)
  const todayMealCount = todayEntries.length

  const todayHasWorkout = workoutLogs.some((l) => l.date === today)

  // ── Racha de entrenamiento (fines de semana no rompen la racha) ──
  const workoutDays = new Set(workoutLogs.map((l) => l.date))
  let workoutStreak = 0
  const wDate = new Date()
  for (let i = 0; i < 500; i++) {
    const dow = wDate.getDay() // 0=Dom, 6=Sab
    const ds  = wDate.toISOString().split("T")[0]
    const isWeekend  = dow === 0 || dow === 6
    const hasWorkout = workoutDays.has(ds)

    if (hasWorkout) {
      workoutStreak++
    } else if (isWeekend) {
      // fin de semana sin entrenamiento → se saltea sin romper
    } else if (ds === today) {
      // hoy es día de semana pero todavía no entrenó → no romper
    } else {
      break // día de semana pasado sin entrenamiento → racha terminada
    }
    wDate.setDate(wDate.getDate() - 1)
  }

  // ── Racha de nutrición (4+ registros por día = día completo) ──
  const entriesByDate: Record<string, number> = {}
  foodEntries.forEach((e) => {
    entriesByDate[e.date] = (entriesByDate[e.date] || 0) + 1
  })

  let nutritionStreak = 0
  const nDate = new Date()
  for (let i = 0; i < 365; i++) {
    const ds    = nDate.toISOString().split("T")[0]
    const count = entriesByDate[ds] || 0
    if (count >= MEALS_GOAL) {
      nutritionStreak++
    } else if (ds === today) {
      // hoy todavía en progreso → no romper
    } else {
      break
    }
    nDate.setDate(nDate.getDate() - 1)
  }

  // ── Sesiones únicas en los últimos 7 días ──
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weekStart = sevenDaysAgo.toISOString().split("T")[0]
  const weeklyWorkouts = new Set(
    workoutLogs.filter((l) => l.date >= weekStart).map((l) => l.date)
  ).size

  // ── Insight de nutrición (aparece cuando se completan las 4 comidas) ──
  const nutritionInsight = useMemo(() => {
    if (todayMealCount < MEALS_GOAL || !profile) return null
    const calPct  = profile.tdee    ? (todayCalories / profile.tdee)    * 100 : 0
    const protPct = profile.protein ? (todayProtein  / profile.protein) * 100 : 0
    const name    = profile.name || "crack"

    if (calPct >= 88 && calPct <= 112 && protPct >= 85) {
      return {
        emoji: "🎯",
        text: `Día de nutrición perfecto, ${name}. Calorías y proteína en punto — así se construye el físico.`,
        variant: "green",
      }
    }
    if (protPct < 70) {
      return {
        emoji: "⚡",
        text: `4 comidas registradas — excelente hábito. Mañana priorizá proteína: hoy llegaste a ${todayProtein}g de ${profile.protein}g objetivo.`,
        variant: "amber",
      }
    }
    if (calPct > 115) {
      return {
        emoji: "📊",
        text: `Todo registrado. Calorías un poco sobre el objetivo — mañana ajustás. Lo importante: lo trackeaste.`,
        variant: "amber",
      }
    }
    if (calPct < 75) {
      return {
        emoji: "⚠️",
        text: `4 comidas registradas pero calorías bajas (${todayCalories} de ${profile.tdee} kcal). Si fue déficit intencional, perfecto. Si no, recordá comer suficiente.`,
        variant: "amber",
      }
    }
    return {
      emoji: "✅",
      text: `4 comidas registradas hoy. La consistencia en el tracking es el 80% del resultado.`,
      variant: "green",
    }
  }, [todayMealCount, todayCalories, todayProtein, profile])

  // ── Contexto para la API ──────────────────────────────────────
  const userContext = {
    name:           profile?.name,
    goal:           profile?.goal,
    weight:         profile?.weight,
    height:         profile?.height,
    age:            profile?.age,
    gender:         profile?.gender,
    targetCalories: profile?.tdee,
    targetProtein:  profile?.protein,
    targetCarbs:    profile?.carbs,
    targetFat:      profile?.fat,
    todayCalories,
    todayProtein,
    todayCarbs,
    todayFat,
    todayHasWorkout,
    workoutStreak,
    nutritionStreak,
    weeklyWorkouts,
    todayMealCount,
  }

  const userName = profile?.name || "Atleta"

  // ── Helpers visuales ─────────────────────────────────────────
  function streakFires(n: number) {
    if (n === 0) return ""
    if (n >= 14) return "🔥🔥🔥"
    if (n >= 7)  return "🔥🔥"
    return "🔥"
  }

  // ── Enviar mensaje ────────────────────────────────────────────
  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    const newHistory = [...localMessages, userMsg]
    setLocalMessages(newHistory)
    addChatMessage(userMsg)
    setInput("")
    setIsTyping(true)
    onUpdate()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, userContext }),
      })
      const rd = await response.json()

      if (!response.ok) {
        if (rd.error === "limit_reached") {
          const lm: ChatMessage = { id: (Date.now()+1).toString(), role: "assistant", content: rd.message, timestamp: new Date().toISOString() }
          setLocalMessages((p) => [...p, lm])
          addChatMessage(lm)
          onUpdate()
          return
        }
        throw new Error(rd.error || "Error en la respuesta")
      }

      const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), role: "assistant", content: rd.content || "Lo siento, no pude procesar eso.", timestamp: new Date().toISOString() }
      setLocalMessages((p) => [...p, aiMsg])
      addChatMessage(aiMsg)
      onUpdate()
    } catch {
      const em: ChatMessage = { id: Date.now().toString(), role: "assistant", content: "⚠️ Hubo un error de conexión. Intentá de nuevo.", timestamp: new Date().toISOString() }
      setLocalMessages((p) => [...p, em])
    } finally {
      setIsTyping(false)
    }
  }

  function handleSend() { sendMessage(input) }

  function handleClear() {
    if (confirm("¿Borrar todo el historial de chat?")) {
      clearChatHistory(); setLocalMessages([]); onUpdate()
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> FitCoach IA
        </h2>
        {localMessages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Calorías */}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">{todayCalories} <span className="text-[10px] font-normal text-muted-foreground">/ {profile?.tdee ?? "--"}</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">kcal hoy</p>
          </div>
        </div>
        {/* Proteína */}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">{todayProtein}g <span className="text-[10px] font-normal text-muted-foreground">/ {profile?.protein ?? "--"}g</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">proteína</p>
          </div>
        </div>
        {/* Racha entreno */}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none">
              {workoutStreak > 0 ? `${workoutStreak}` : todayHasWorkout ? "1" : "0"}
              {workoutStreak > 0 && <span className="ml-1 text-xs">{streakFires(workoutStreak)}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">racha entreno</p>
          </div>
        </div>
        {/* Nutrición */}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Utensils className="h-4 w-4 text-green-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold leading-none">{todayMealCount}/{MEALS_GOAL}</p>
              {nutritionStreak > 0 && (
                <span className="text-[10px] text-green-500 font-semibold">{streakFires(nutritionStreak)} {nutritionStreak}d</span>
              )}
            </div>
            {/* Mini progress bar */}
            <div className="mt-1.5 h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayMealCount / MEALS_GOAL) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">comidas hoy</p>
          </div>
        </div>
      </div>

      {/* Insight card de nutrición (aparece al completar las 4 comidas) */}
      {nutritionInsight && (
        <div className={cn(
          "rounded-xl px-3 py-2.5 mb-2 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300",
          nutritionInsight.variant === "green"
            ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
        )}>
          <span className="text-base shrink-0 -mt-0.5">{nutritionInsight.emoji}</span>
          <p className="leading-relaxed">{nutritionInsight.text}</p>
        </div>
      )}

      {/* Chat */}
      <Card className="flex-1 overflow-hidden flex flex-col border-secondary bg-background shadow-inner">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {localMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Bot className="h-10 w-10 text-primary mb-3" />
              <p className="font-semibold text-base">Holá, {userName} 👋</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Soy tu coach personal. Preguntame sobre tu entrenamiento, dieta o cómo vas hoy.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            localMessages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex w-full justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-none px-4 py-3 text-sm shadow-sm bg-primary text-primary-foreground">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )
              }
              const { cleanText, routine } = extractRoutine(msg.content)
              return (
                <div key={msg.id} className="flex w-full justify-start">
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm bg-secondary text-secondary-foreground">
                      <p className="whitespace-pre-wrap leading-relaxed">{cleanText}</p>
                    </div>
                    {routine && (
                      <RoutineCard routine={routine} onAdd={onUpdate} />
                    )}
                  </div>
                </div>
              )
            })
          )}

          {isTyping && (
            <div className="flex justify-start w-full animate-in fade-in">
              <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Escribiendo...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions cuando ya hay mensajes */}
        {localMessages.length > 0 && (
          <div className="px-3 pt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                disabled={isTyping}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full border border-border text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-card border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Preguntá lo que quieras..."
              className="pr-12 h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="absolute right-1 top-1 h-10 w-10 rounded-lg shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
