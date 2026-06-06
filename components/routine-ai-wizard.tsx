"use client"

// Wizard para crear una rutina semanal con IA.
// Pregunta al usuario objetivo / frecuencia / duración / nivel / equipo / enfoque,
// pre-rellenando lo que ya sabemos del perfil (goal, frecuencia promedio).
// Llama a /api/generate-routine y muestra una preview antes de guardar.

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Sparkles, Wand2, ChevronLeft, Loader2, Check, RefreshCw, Flame,
  TrendingUp, Scale, Clock, Dumbbell, Home, PersonStanding,
} from "lucide-react"
import type { UserProfile, WeeklyRoutine, WorkoutLog, RoutineDay, Goal } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { saveRoutine, setActiveRoutine, loadData } from "@/lib/store"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (routine: WeeklyRoutine) => void
  profile?: UserProfile | null
  workoutLogs?: WorkoutLog[]
}

type Goal3 = "bulk" | "cut" | "maintain"
type Level = "beginner" | "intermediate" | "advanced"
type Equipment = "gym" | "home_dumbbells" | "bodyweight"
type Duration = 30 | 45 | 60

const GOAL_OPTIONS: { id: Goal3; label: string; icon: React.ElementType; tip: string }[] = [
  { id: "bulk",     label: "Ganar músculo", icon: TrendingUp, tip: "Hipertrofia y fuerza" },
  { id: "cut",      label: "Perder grasa",  icon: Flame,      tip: "Mantener músculo, déficit" },
  { id: "maintain", label: "Mantener",      icon: Scale,      tip: "Salud y forma general" },
]

const LEVEL_OPTIONS: { id: Level; label: string; tip: string }[] = [
  { id: "beginner",     label: "Principiante", tip: "Menos de 6 meses" },
  { id: "intermediate", label: "Intermedio",   tip: "6 a 24 meses" },
  { id: "advanced",     label: "Avanzado",     tip: "Más de 2 años" },
]

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; icon: React.ElementType }[] = [
  { id: "gym",            label: "Gimnasio completo",   icon: Dumbbell },
  { id: "home_dumbbells", label: "Casa con mancuernas", icon: Home },
  { id: "bodyweight",     label: "Solo peso corporal",  icon: PersonStanding },
]

const MUSCLE_GROUPS: { id: string; emoji: string; label: string }[] = [
  { id: "Pecho",    emoji: "💪", label: "Pecho" },
  { id: "Espalda",  emoji: "🔙", label: "Espalda" },
  { id: "Hombros",  emoji: "🏋️", label: "Hombros" },
  { id: "Brazos",   emoji: "💪", label: "Brazos" },
  { id: "Piernas",  emoji: "🦵", label: "Piernas" },
  { id: "Abdomen",  emoji: "🔥", label: "Abdomen" },
]

export function RoutineAiWizard({ open, onClose, onCreated, profile, workoutLogs = [] }: Props) {
  // ── Inferir defaults inteligentes desde el perfil ──
  const inferredGoal: Goal3 = (profile?.goal as Goal3) ?? "bulk"
  const inferredLevel: Level = useMemo(() => {
    const totalSessions = new Set((workoutLogs ?? []).map(l => l.date)).size
    if (totalSessions < 10) return "beginner"
    if (totalSessions < 50) return "intermediate"
    return "advanced"
  }, [workoutLogs])

  const inferredFrequency: number = useMemo(() => {
    if (!workoutLogs || workoutLogs.length === 0) return 3
    // Mirar últimos 28 días para calcular frecuencia semanal típica
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 28)
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}`
    const recent = workoutLogs.filter(l => l.date >= cutoffStr)
    const uniqueDays = new Set(recent.map(l => l.date)).size
    const perWeek = Math.round(uniqueDays / 4)
    return Math.max(2, Math.min(6, perWeek || 3))
  }, [workoutLogs])

  // ── Estado del form ──
  const [goal, setGoal] = useState<Goal3>(inferredGoal)
  const [frequency, setFrequency] = useState<number>(inferredFrequency)
  const [durationMin, setDurationMin] = useState<Duration>(45)
  const [level, setLevel] = useState<Level>(inferredLevel)
  const [equipment, setEquipment] = useState<Equipment>("gym")
  const [focusGroups, setFocusGroups] = useState<string[]>([])

  // ── Re-inferir cuando cambia el perfil ──
  useEffect(() => {
    if (open) {
      setGoal(inferredGoal)
      setLevel(inferredLevel)
      setFrequency(inferredFrequency)
      setDurationMin(45)
      setEquipment("gym")
      setFocusGroups([])
      setStep("form")
      setError(null)
      setPreview(null)
    }
  }, [open, inferredGoal, inferredLevel, inferredFrequency])

  // ── Generación y preview ──
  const [step, setStep] = useState<"form" | "loading" | "preview">("form")
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<WeeklyRoutine | null>(null)

  const toggleFocus = (id: string) => {
    setFocusGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleGenerate() {
    setError(null)
    setStep("loading")
    try {
      const res = await fetch("/api/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, frequency, durationMin, level, equipment, focusGroups }),
      })
      const json = await res.json()
      if (!res.ok || !json.routine) {
        setError(json.error || "No pudimos generar la rutina. Probá de nuevo.")
        setStep("form")
        return
      }
      setPreview(json.routine as WeeklyRoutine)
      setStep("preview")
    } catch {
      setError("Error de red. Verificá tu conexión y reintentá.")
      setStep("form")
    }
  }

  function handleSaveAndActivate() {
    if (!preview) return
    const routine: WeeklyRoutine = { ...preview, id: `routine-${Date.now()}`, isTemplate: false }
    saveRoutine(routine)
    setActiveRoutine(routine.id)
    onCreated(routine)
    onClose()
  }

  // ── Lookup de nombres de ejercicios para la preview ──
  const exerciseMap = useMemo(() => {
    const m: Record<string, string> = {}
    const data = loadData()
    ;[...defaultExercises, ...data.customExercises].forEach(e => { m[e.id] = e.name })
    return m
  }, [])

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
        {/* ── FORM ───────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="flex-1 overflow-y-auto">
            {/* Header con gradiente */}
            <div
              className="px-6 pt-8 pb-6 text-white relative"
              style={{ background: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #A78BFA 100%)" }}
            >
              <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Wand2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold leading-tight">Rutina con IA</h2>
                  <p className="text-xs text-white/80">Personalizada para tus objetivos</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="text-white/90">Ya pre-completamos según tu perfil. Ajustá lo que quieras.</span>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-6 space-y-6">

              {/* OBJETIVO */}
              <Section title="Objetivo" subtitle="¿Para qué entrenás?">
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map(opt => (
                    <PillCard
                      key={opt.id}
                      selected={goal === opt.id}
                      onClick={() => setGoal(opt.id)}
                      label={opt.label}
                      sublabel={opt.tip}
                      icon={opt.icon}
                    />
                  ))}
                </div>
              </Section>

              {/* FRECUENCIA */}
              <Section title="Entrenamientos por semana" subtitle="¿Cuántos días vas al gym?">
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFrequency(n)}
                      className={`h-14 rounded-xl font-extrabold text-lg transition-all active:scale-95 ${
                        frequency === n
                          ? "bg-brand-gradient text-white shadow-md shadow-primary/30"
                          : "bg-secondary text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </Section>

              {/* DURACIÓN */}
              <Section title="Tiempo por entrenamiento" subtitle="Promedio que tenés disponible">
                <div className="grid grid-cols-3 gap-2">
                  {([30, 45, 60] as Duration[]).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationMin(d)}
                      className={`h-14 rounded-xl font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                        durationMin === d
                          ? "bg-brand-gradient text-white shadow-md shadow-primary/30"
                          : "bg-secondary text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <span className="text-base">{d === 60 ? "60+" : d}</span>
                      <span className={`text-[10px] font-medium ${durationMin === d ? "text-white/80" : "text-muted-foreground"}`}>
                        min
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* NIVEL */}
              <Section title="Nivel" subtitle="Lo inferimos de tu historial, ajustá si querés">
                <div className="grid grid-cols-3 gap-2">
                  {LEVEL_OPTIONS.map(opt => (
                    <PillCard
                      key={opt.id}
                      selected={level === opt.id}
                      onClick={() => setLevel(opt.id)}
                      label={opt.label}
                      sublabel={opt.tip}
                    />
                  ))}
                </div>
              </Section>

              {/* EQUIPAMIENTO */}
              <Section title="Equipamiento disponible" subtitle="Para que los ejercicios sean realistas">
                <div className="space-y-2">
                  {EQUIPMENT_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const selected = equipment === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEquipment(opt.id)}
                        className={`w-full h-12 rounded-xl px-4 flex items-center gap-3 transition-all active:scale-[0.98] ${
                          selected
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-secondary border-2 border-transparent hover:bg-secondary/70"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* ENFOQUE OPCIONAL */}
              <Section
                title="Enfoque extra (opcional)"
                subtitle="Tocá los grupos que querés priorizar. Sin seleccionar = rutina balanceada"
              >
                <div className="grid grid-cols-3 gap-2">
                  {MUSCLE_GROUPS.map(g => {
                    const selected = focusGroups.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleFocus(g.id)}
                        className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                          selected
                            ? "bg-primary/15 border-2 border-primary"
                            : "bg-secondary border-2 border-transparent"
                        }`}
                      >
                        <span className="text-xl leading-none">{g.emoji}</span>
                        <span className={`text-[11px] font-bold ${selected ? "text-primary" : "text-foreground/70"}`}>
                          {g.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* Error inline */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-brand-gradient text-white font-bold text-base shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
                  onClick={handleGenerate}
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Generar rutina
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING ─────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div
                className="relative h-24 w-24 rounded-3xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #A78BFA 100%)" }}
              >
                <Wand2 className="h-12 w-12 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold mb-2">🤖 Armando tu rutina...</h2>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              La IA está combinando ejercicios según tu objetivo, nivel y tiempo disponible. Esto tarda unos segundos.
            </p>
            <Loader2 className="h-6 w-6 text-primary animate-spin mt-6" />
          </div>
        )}

        {/* ── PREVIEW ─────────────────────────────────────────── */}
        {step === "preview" && preview && (
          <div className="flex flex-col h-full">
            {/* Header preview */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-4" />
              <button onClick={() => setStep("form")} className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <ChevronLeft className="h-3 w-3" /> Cambiar parámetros
              </button>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold truncate">{preview.name}</h2>
                  <p className="text-xs text-muted-foreground">{preview.days.length} días · listo para usar</p>
                </div>
              </div>
              {(preview as WeeklyRoutine & { description?: string }).description && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  {(preview as WeeklyRoutine & { description?: string }).description}
                </p>
              )}
            </div>

            {/* Lista de días */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {preview.days.map((day: RoutineDay) => (
                <div key={day.dayNumber} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/15 text-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {day.dayNumber}
                    </span>
                    <p className="text-sm font-bold">{day.label}</p>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {day.exercises.length} ejercicios
                    </span>
                  </div>
                  <ul className="space-y-1 pl-8">
                    {day.exercises.map((ex, i) => (
                      <li key={i} className="text-xs flex items-center justify-between">
                        <span className="text-foreground/90 truncate">
                          {exerciseMap[ex.exerciseId] || ex.exerciseId}
                        </span>
                        <span className="text-muted-foreground shrink-0 ml-2 tabular-nums">
                          {ex.sets} × {ex.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 border-t border-border space-y-2">
              <Button
                className="w-full h-12 rounded-xl bg-brand-gradient text-white font-bold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all"
                onClick={handleSaveAndActivate}
              >
                <Check className="h-4 w-4 mr-2" /> Guardar y activar
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={handleGenerate}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Generar otra variante
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Sub-componentes UI ────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function PillCard({
  selected, onClick, label, sublabel, icon: Icon,
}: {
  selected: boolean
  onClick: () => void
  label: string
  sublabel?: string
  icon?: React.ElementType
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-auto py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
        selected
          ? "bg-primary/15 border-2 border-primary"
          : "bg-secondary border-2 border-transparent hover:bg-secondary/70"
      }`}
    >
      {Icon && <Icon className={`h-4 w-4 mb-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />}
      <span className={`text-xs font-bold leading-tight text-center ${selected ? "text-primary" : "text-foreground"}`}>
        {label}
      </span>
      {sublabel && (
        <span className={`text-[9px] leading-tight text-center ${selected ? "text-primary/70" : "text-muted-foreground"}`}>
          {sublabel}
        </span>
      )}
    </button>
  )
}
