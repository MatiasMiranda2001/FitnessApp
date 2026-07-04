"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, ChevronRight, TrendingUp, Play, X, Check, ChevronLeft, CalendarClock, Dumbbell, Flag, Timer, Hourglass, PersonStanding } from "lucide-react"
import type { Exercise, WorkoutLog, WorkoutSet, RoutineDay, RunningLog } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { addWorkoutLog, addCustomExercise, loadData } from "@/lib/store"
import { SECTION_META, groupBySection } from "@/lib/routine-sections"
import { RunningTracker } from "@/components/running-tracker"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface WorkoutTrackerProps {
  workoutLogs: WorkoutLog[]
  runningLogs?: RunningLog[]
  onLogAdded: () => void
  initialExerciseId?: string | null
  initialSession?: RoutineDay | null
  onBack?: () => void
}

export function WorkoutTracker({ workoutLogs, runningLogs = [], onLogAdded, initialExerciseId, initialSession, onBack }: WorkoutTrackerProps) {
  const [showRunning, setShowRunning] = useState(false)

  // Carga de datos
  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  // --- ESTADOS DE TEMPORIZADOR ---
  // 1. Cronómetro Global (Tiempo Total) — basado en timestamps reales para que
  //    el contador sea correcto aunque la pantalla se apague o el navegador
  //    suspenda los setIntervals (común en iOS Safari + PWA).
  //    El startTimestamp se persiste en localStorage para que sobreviva refresh.
  const SESSION_START_KEY = "ft_workout_session_start_ts"
  const sessionStartRef = useRef<number>(Date.now())
  const [nowTick, setNowTick] = useState<number>(Date.now())

  // 2. Temporizador de Descanso (Countdown) — también basado en timestamp.
  const [restEndTs, setRestEndTs] = useState<number | null>(null)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)

  // Estado del Ejercicio Individual
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0, rpe: 7 }])
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  // Estados Custom
  const [search, setSearch] = useState("")
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customMuscle, setCustomMuscle] = useState("")

  // EFECTO: Inicializar el cronómetro global a partir de localStorage.
  // Esto se ejecuta UNA vez al montar el componente.
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(SESSION_START_KEY)
    const savedTs = saved ? parseInt(saved, 10) : 0
    // Si hay un session activo guardado y no es más viejo que 24h, lo retomamos.
    // Si no, arrancamos uno nuevo en este momento.
    if (savedTs && Date.now() - savedTs < 24 * 60 * 60 * 1000) {
      sessionStartRef.current = savedTs
    } else {
      sessionStartRef.current = Date.now()
      localStorage.setItem(SESSION_START_KEY, String(sessionStartRef.current))
    }
    setNowTick(Date.now())
  }, [])

  // EFECTO: Cronómetro Global (refresca el render cada segundo).
  // El cálculo del tiempo es Date.now() - startTimestamp, así que aunque
  // el setInterval se pause durante la pantalla apagada, al reanudarse
  // mostrará el tiempo correcto.
  useEffect(() => {
    const tick = () => setNowTick(Date.now())
    const interval = setInterval(tick, 1000)
    // Cuando la pantalla vuelve a estar visible, refrescamos inmediatamente
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") tick()
    }
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible)
    if (typeof window !== "undefined") {
      window.addEventListener("focus", tick)
      window.addEventListener("pageshow", tick)
    }
    return () => {
      clearInterval(interval)
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisible)
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", tick)
        window.removeEventListener("pageshow", tick)
      }
    }
  }, [])

  // Tiempo de sesión calculado en base a timestamps (correcto siempre)
  const sessionSeconds = Math.max(0, Math.floor((nowTick - sessionStartRef.current) / 1000))

  // EFECTO: Temporizador de Descanso (Cuenta regresiva)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restEndTs !== null) {
      // Calcular segundos restantes en cada tick usando timestamp real
      const updateRest = () => {
        const remaining = Math.max(0, Math.ceil((restEndTs - Date.now()) / 1000))
        setRestSeconds(remaining)
        if (remaining === 0) {
          setIsResting(false)
          setRestSeconds(null)
          setRestEndTs(null)
        }
      }
      updateRest()
      interval = setInterval(updateRest, 250) // ticks más rápidos por precisión visual
    }
    return () => clearInterval(interval)
  }, [isResting, restEndTs])

  // EFECTO DE INICIO
  useEffect(() => {
    if (initialExerciseId && !initialSession) {
        const found = allExercises.find((e) => e.id === initialExerciseId)
        if (found) setSelectedExercise(found)
    }
  }, [initialExerciseId, initialSession, allExercises])


  // --- HELPERS ---
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const startRest = (seconds: number) => {
    // Guardamos el timestamp en el que el descanso termina.
    // Esto hace que el countdown sea correcto aunque la pantalla se apague.
    setRestEndTs(Date.now() + seconds * 1000)
    setRestSeconds(seconds)
    setIsResting(true)
  }

  // Finaliza la sesión: limpia el timer persistido y vuelve al hub.
  const handleFinishSession = () => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(SESSION_START_KEY) } catch {}
    }
    if (onBack) onBack()
  }

  const getExerciseName = (id: string, customName?: string) => {
    // Si el usuario puso un nombre custom, ese gana (incluso sobre el catálogo)
    if (customName && customName.trim()) return customName.trim()
    const found = allExercises.find(e => e.id === id)?.name
    if (found) return found
    // Fallback: ID legible (sin "Cargando..." ni placeholders raros)
    const readable = id.replace(/^custom-/i, "").replace(/-/g, " ").trim()
    return readable || "Ejercicio personalizado"
  }

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    const filtered = allExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    filtered.forEach(ex => {
      const group = ex.muscleGroup || "Otro"
      if (!groups[group]) groups[group] = []
      groups[group].push(ex)
    })
    return groups
  }, [allExercises, search])

  // Devuelve un ID único para cada ejercicio. Si tiene customName distinto al
  // nombre del catálogo, usa un ID compuesto para evitar que dos ejercicios
  // distintos con el mismo exerciseId base compartan historial.
  const getEffectiveId = (exerciseId: string, customName?: string): string => {
    if (!customName) return exerciseId
    const catalogName = allExercises.find(e => e.id === exerciseId)?.name ?? ""
    if (catalogName === customName) return exerciseId
    const slug = customName.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    return `${exerciseId}__${slug}`
  }

  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return []
    return workoutLogs.filter(l => l.exerciseId === selectedExercise.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [workoutLogs, selectedExercise])

  const previousBest = useMemo(() => {
    if (exerciseHistory.length === 0) return null
    let bestWeight = 0; let bestReps = 0
    for (const log of exerciseHistory) {
        for (const set of log.sets) {
            if (set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
                bestWeight = set.weight; bestReps = set.reps
            }
        }
    }
    return { weight: bestWeight, reps: bestReps }
  }, [exerciseHistory])

  // --- HANDLERS ---
  function handleAddSet() { setSets([...sets, { ...sets[sets.length - 1] }]) }
  function handleRemoveSet(index: number) { if (sets.length <= 1) return; setSets(sets.filter((_, i) => i !== index)) }
  function handleSetChange(index: number, field: keyof WorkoutSet, value: number) { const newSets = [...sets]; newSets[index] = { ...newSets[index], [field]: value }; setSets(newSets) }

  function handleLogWorkout() {
    if (!selectedExercise) return
    const validSets = sets.filter((s) => s.weight > 0 && s.reps > 0)
    
    if (validSets.length > 0) {
        addWorkoutLog({ id: Date.now().toString(), exerciseId: selectedExercise.id, date: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}` })(), sets: validSets })
    }
    onLogAdded()
    setCompletedExercises(prev => new Set(prev).add(selectedExercise.id))

    if (initialSession) {
        setSelectedExercise(null)
        setSets([{ weight: 0, reps: 0, rpe: 7 }])
    } else {
        if (onBack) onBack()
        else { setSelectedExercise(null); setSets([{ weight: 0, reps: 0, rpe: 7 }]) }
    }
  }

  function handleAddCustom() {
      if (!customName.trim()) return
      const exercise: Exercise = { id: `custom-${Date.now()}`, name: customName, muscleGroup: customMuscle || "Otro", isCustom: true }
      addCustomExercise(exercise)
      setCustomName(""); setCustomMuscle(""); setCustomDialogOpen(false); onLogAdded()
  }

  // --- RUNNING ---
  if (showRunning) {
    return <RunningTracker runningLogs={runningLogs} onBack={() => setShowRunning(false)} onUpdate={onLogAdded} />
  }

  // --- COMPONENTE VISUAL: POP-UP DE DESCANSO ---
  if (isResting && restSeconds !== null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="text-center space-y-8 p-6">
          <div className="animate-pulse">
            <Hourglass className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Descansando</h2>
            <p className="text-muted-foreground">Recupera el aliento...</p>
          </div>
          
          <div className="text-8xl font-mono font-bold text-primary tabular-nums tracking-tighter">
            {formatTime(restSeconds)}
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-14 px-8 font-bold"
              onClick={() => setRestEndTs(prev => (prev ? prev + 30 * 1000 : Date.now() + 30 * 1000))}
            >
              +30s
            </Button>
            <Button 
              variant="default" 
              size="lg" 
              className="h-14 px-8 bg-white text-black hover:bg-white/90 font-bold"
              onClick={() => { setIsResting(false); setRestSeconds(null); setRestEndTs(null) }}
            >
              Saltar / Listo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Detecta si el ejercicio es unilateral para mostrar "kg/lado"
  const UNILATERAL_KEYWORDS = ["unilateral", "un brazo", "un lado", "alternado", "single", "a un brazo", "por brazo", "por lado"]
  const isUnilateral = selectedExercise
    ? UNILATERAL_KEYWORDS.some(kw => selectedExercise.name.toLowerCase().includes(kw))
    : false

  // --- MODO 1: DETALLE DE EJERCICIO (LOGGER) ---
  if (selectedExercise) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6 animate-in slide-in-from-right">
        {/* Header con Cronómetro */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedExercise(null)} className="-ml-2">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex flex-col">
               <h2 className="text-lg font-bold leading-none truncate max-w-[200px]">{selectedExercise.name}</h2>
               <p className="text-xs text-muted-foreground">{selectedExercise.muscleGroup}</p>
            </div>
          </div>
          {/* Cronómetro Global */}
          <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
             <Timer className="h-3.5 w-3.5 text-primary animate-pulse" />
             <span className="font-mono text-xs font-medium tabular-nums">{formatTime(sessionSeconds)}</span>
          </div>
        </div>

        {previousBest && (<Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center gap-3 p-3"><div className="bg-primary/10 p-2 rounded-full"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-medium text-muted-foreground uppercase">Tu Récord Global</p><p className="text-sm font-bold text-foreground">{previousBest.weight}{isUnilateral ? "kg/lado" : "kg"} <span className="font-normal text-muted-foreground">x {previousBest.reps} reps</span></p></div></CardContent></Card>)}
        {selectedExercise.videoPlaceholder && (<a href={selectedExercise.videoPlaceholder} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"><div className="flex items-center gap-3"><Play className="h-4 w-4 text-red-500 fill-red-500" /><span className="text-sm font-medium">Ver técnica en YouTube</span></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></a>)}

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-semibold">Registrar Hoy</h3>
             {/* BOTÓN DE DESCANSO RÁPIDO */}
             <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => startRest(60)}>1:00</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => startRest(90)}>1:30</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => startRest(120)}>2:00</Button>
             </div>
          </div>
          
          <div className="mb-2 grid grid-cols-[0.5fr_1.5fr_1.5fr_1fr_0.5fr] text-center text-xs font-medium text-muted-foreground px-1">
            <span>#</span>
            <span>{isUnilateral ? "kg/lado" : "Kilos"}</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
          </div>
          {isUnilateral && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                ⚡ peso por lado — no total
              </span>
            </div>
          )}
          {sets.map((set, i) => (
            <div key={i} className="mb-2 grid grid-cols-[0.5fr_1.5fr_1.5fr_1fr_0.5fr] items-center gap-2">
              <span className="text-center text-sm font-bold text-muted-foreground bg-secondary/50 rounded-full w-6 h-6 flex items-center justify-center">{i + 1}</span>
              <Input type="number" className="bg-secondary text-center font-medium" placeholder="0" value={set.weight || ""} onChange={(e) => handleSetChange(i, "weight", Number(e.target.value))} />
              <Input type="number" className="bg-secondary text-center font-medium" placeholder="0" value={set.reps || ""} onChange={(e) => handleSetChange(i, "reps", Number(e.target.value))} />
              <Input type="number" className="bg-secondary text-center" placeholder="7" value={set.rpe || ""} onChange={(e) => handleSetChange(i, "rpe", Number(e.target.value))} />
              <button onClick={() => handleRemoveSet(i)} className="flex justify-center text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2 w-full border-dashed" onClick={handleAddSet}><Plus className="mr-2 h-4 w-4" /> Agregar Serie</Button>
          <Button className="w-full mt-4 font-semibold" size="lg" onClick={handleLogWorkout}><Check className="mr-2 h-4 w-4" /> {initialSession ? "Terminar Ejercicio" : "Guardar Entrenamiento"}</Button>
        </div>

        {/* HISTORIAL SIEMPRE VISIBLE */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Historial</h3>
          </div>
          {exerciseHistory.length === 0 ? (
            <div className="bg-secondary/20 border border-dashed border-border rounded-xl p-5 text-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Sin historial previo</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tu primer registro aparecerá aquí la próxima vez</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exerciseHistory.map((log, idx) => (
                <div key={log.id} className={`border rounded-xl p-3 ${idx === 0 ? "bg-primary/5 border-primary/25" : "bg-secondary/20 border-border"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-muted-foreground capitalize">
                      {idx === 0 && <span className="text-primary mr-1">↑ Última vez •</span>}
                      {format(new Date(log.date), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <span className="text-xs text-muted-foreground">{log.sets.length} series</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {log.sets.map((s, i) => (
                      <Badge key={i} variant="outline" className={`text-xs font-normal ${idx === 0 ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-muted-foreground/30"}`}>
                        <strong className="mr-0.5">{s.weight}</strong>kg × {s.reps} reps
                        {s.rpe ? <span className="ml-1 opacity-60">RPE {s.rpe}</span> : null}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- MODO 2: SESIÓN DE ENTRENAMIENTO (HUB) ---
  if (initialSession) {
    const progress = (completedExercises.size / initialSession.exercises.length) * 100
    
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6 h-screen flex flex-col">
        {/* Header de Sesión */}
        <div className="flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1"><Dumbbell className="h-3 w-3"/> Entrenando</Badge>
                 {/* Cronómetro Global en el Hub */}
                 <Badge variant="secondary" className="font-mono tabular-nums gap-1">
                    <Timer className="h-3 w-3" /> {formatTime(sessionSeconds)}
                 </Badge>
              </div>
              <h1 className="text-2xl font-bold">{initialSession.label}</h1>
           </div>
           <Button variant="ghost" size="icon" onClick={handleFinishSession}><X className="h-6 w-6" /></Button>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
           <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground text-right">{completedExercises.size} de {initialSession.exercises.length} completados</p>

        {/* Lista de Tareas */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
           {groupBySection(initialSession.exercises).map(({ section, entries }) => (
             <div key={section} className="space-y-2">
               <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1 pl-1">
                 <span>{SECTION_META[section].emoji}</span> {SECTION_META[section].label}
               </p>
               {entries.map(({ item: ex, index: i }) => {
                 const effectiveId = getEffectiveId(ex.exerciseId, ex.customName)
                 const isDone = completedExercises.has(effectiveId)
                 // Si el ejercicio no está en el catálogo, crear uno fallback con el nombre disponible
                 const baseInfo = allExercises.find(e => e.id === ex.exerciseId) ?? {
                   id: ex.exerciseId,
                   name: getExerciseName(ex.exerciseId, ex.customName),
                   muscleGroup: "Otro",
                   isCustom: true,
                 }
                 // Siempre usar el ID efectivo y el nombre correcto (customName tiene prioridad)
                 const exerciseInfo = {
                   ...baseInfo,
                   id: effectiveId,
                   name: ex.customName || baseInfo.name,
                 }

                 return (
                   <Card
                      key={i}
                      className={`border transition-all cursor-pointer ${isDone ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/50"}`}
                      onClick={() => {
                         setSelectedExercise(exerciseInfo)
                         setSets([{ weight: 0, reps: 0, rpe: 7 }])
                      }}
                   >
                     <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isDone ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                              {isDone ? <Check className="h-5 w-5" /> : <span className="font-bold text-xs">{i + 1}</span>}
                           </div>
                           <div>
                              <p className={`font-semibold ${isDone ? "text-primary" : "text-foreground"}`}>{exerciseInfo.name}</p>
                              <p className="text-xs text-muted-foreground">{ex.sets} series x {ex.reps} reps</p>
                           </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     </CardContent>
                   </Card>
                 )
               })}
             </div>
           ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border">
           <Button className="w-full font-bold text-lg h-12" onClick={handleFinishSession}>
              <Flag className="mr-2 h-5 w-5" /> Finalizar Entrenamiento
           </Button>
        </div>
      </div>
    )
  }

  // --- MODO 3: LISTA LIBRE ---
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      {/* Botón de Running */}
      <button
        onClick={() => setShowRunning(true)}
        className="w-full flex items-center justify-between bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors rounded-xl px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <PersonStanding className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-primary">Running</p>
            <p className="text-xs text-muted-foreground">Registrá tus salidas con GPS</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>

      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">Ejercicios</h1>
         {/* Cronómetro también aquí */}
         <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
             <Timer className="h-3.5 w-3.5 text-muted-foreground" />
             <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">{formatTime(sessionSeconds)}</span>
         </div>
         <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}><DialogTrigger asChild><Button size="sm" variant="outline" className="ml-2"><Plus className="h-4 w-4 mr-1"/> Crear</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuevo Ejercicio</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><div><Label>Nombre</Label><Input value={customName} onChange={e => setCustomName(e.target.value)} /></div><div><Label>Músculo</Label><select className="w-full h-10 rounded-md border bg-background px-3" value={customMuscle} onChange={e => setCustomMuscle(e.target.value)}>{["Piernas","Pecho","Espalda","Hombros","Brazos","Abdomen","Cardio","Otro"].map(m=><option key={m} value={m}>{m}</option>)}</select></div><Button onClick={handleAddCustom} disabled={!customName}>Guardar</Button></div></DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9 bg-secondary border-transparent" placeholder="Buscar ejercicio..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="space-y-4">{Object.entries(groupedExercises).map(([m, exs]) => (<div key={m}><h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">{m}</h3><div className="grid gap-2">{exs.map(ex => (<Card key={ex.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedExercise(ex)}><CardContent className="p-3 flex justify-between items-center"><div><p className="font-medium text-sm">{ex.name}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></CardContent></Card>))}</div></div>))}</div>
    </div>
  )
}