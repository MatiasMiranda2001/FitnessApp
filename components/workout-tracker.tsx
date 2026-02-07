"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  ChevronRight,
  TrendingUp,
  Play,
  X,
  Check,
  AlertTriangle,
} from "lucide-react"
import type { Exercise, WorkoutLog, WorkoutSet } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { addWorkoutLog, addCustomExercise, loadData, estimate1RM } from "@/lib/store"

interface WorkoutTrackerProps {
  workoutLogs: WorkoutLog[]
  onLogAdded: () => void
  initialExerciseId?: string | null
}

export function WorkoutTracker({ workoutLogs, onLogAdded, initialExerciseId }: WorkoutTrackerProps) {
  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises]
  }, [])

  const [search, setSearch] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    initialExerciseId ? allExercises.find((e) => e.id === initialExerciseId) || null : null
  )
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0, rpe: 7 }])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customMuscle, setCustomMuscle] = useState("")

  const muscleGroups = useMemo(() => {
    const groups = new Map<string, Exercise[]>()
    for (const ex of allExercises) {
      const arr = groups.get(ex.muscleGroup) || []
      arr.push(ex)
      groups.set(ex.muscleGroup, arr)
    }
    return groups
  }, [allExercises])

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return null
    return allExercises.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, allExercises])

  function getPreviousBest(exerciseId: string): { weight: number; reps: number } | null {
    const logs = workoutLogs
      .filter((l) => l.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (logs.length === 0) return null

    const prevLog = logs[0]
    let bestWeight = 0
    let bestReps = 0
    for (const set of prevLog.sets) {
      if (set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
        bestWeight = set.weight
        bestReps = set.reps
      }
    }
    return { weight: bestWeight, reps: bestReps }
  }

  function checkProgress(exerciseId: string): boolean {
    const prev = getPreviousBest(exerciseId)
    if (!prev) return false
    return sets.some(
      (s) => s.weight > prev.weight || (s.weight === prev.weight && s.reps > prev.reps)
    )
  }

  function getSmartWarnings(exerciseId: string): string[] {
    const warnings: string[] = []
    const prev = getPreviousBest(exerciseId)

    for (const set of sets) {
      if (set.weight <= 0 || set.reps <= 0) continue

      if (prev && prev.weight > 0 && set.rpe >= 10) {
        const increase = ((set.weight - prev.weight) / prev.weight) * 100
        if (increase >= 20) {
          warnings.push(
            "Cuidado: Salto de carga muy alto (+20%) con RPE 10. Riesgo de lesión."
          )
          break
        }
      }

      if (set.rpe >= 10 && set.weight > 0) {
        warnings.push(
          "Consejo: Evita entrenar al fallo (RPE 10) frecuentemente. RPE 7-9 es más sostenible."
        )
        break
      }
    }

    return warnings
  }

  function handleAddSet() {
    const lastSet = sets[sets.length - 1]
    setSets([...sets, { weight: lastSet.weight, reps: lastSet.reps, rpe: lastSet.rpe }])
  }

  function handleRemoveSet(index: number) {
    if (sets.length <= 1) return
    setSets(sets.filter((_, i) => i !== index))
  }

  function handleSetChange(index: number, field: keyof WorkoutSet, value: number) {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: value }
    setSets(newSets)
  }

  function handleLogWorkout() {
    if (!selectedExercise) return
    const validSets = sets.filter((s) => s.weight > 0 && s.reps > 0)
    if (validSets.length === 0) return

    const log: WorkoutLog = {
      id: Date.now().toString(),
      exerciseId: selectedExercise.id,
      date: new Date().toISOString().split("T")[0],
      sets: validSets,
    }

    addWorkoutLog(log)
    onLogAdded()
    setSelectedExercise(null)
    setSets([{ weight: 0, reps: 0, rpe: 7 }])
  }

  function handleAddCustom() {
    if (!customName.trim()) return
    const exercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName,
      muscleGroup: customMuscle || "Otro",
      isCustom: true,
    }
    addCustomExercise(exercise)
    setCustomName("")
    setCustomMuscle("")
    setCustomDialogOpen(false)
    onLogAdded()
  }

  // Logging view
  if (selectedExercise) {
    const prev = getPreviousBest(selectedExercise.id)
    const isProgress = checkProgress(selectedExercise.id)
    const warnings = getSmartWarnings(selectedExercise.id)

    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setSelectedExercise(null)
              setSets([{ weight: 0, reps: 0, rpe: 7 }])
            }}
            className="text-sm text-muted-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">{selectedExercise.name}</h2>
          <div className="w-5" />
        </div>

        {prev && (
          <Card className="border-border bg-secondary">
            <CardContent className="flex items-center justify-between p-3">
              <span className="text-xs text-muted-foreground">Mejor anterior</span>
              <span className="text-sm font-semibold text-foreground">
                {prev.weight} kg x {prev.reps} reps (1RM est.:{" "}
                {estimate1RM(prev.weight, prev.reps)} kg)
              </span>
            </CardContent>
          </Card>
        )}

        {isProgress && (
          <Badge className="w-fit bg-primary text-primary-foreground">
            <TrendingUp className="mr-1 h-3 w-3" /> {"¡Progreso!"}
          </Badge>
        )}

        {warnings.map((w, i) => (
          <Card key={`warning-${i}`} className="border-yellow-500/40 bg-yellow-500/10">
            <CardContent className="flex items-start gap-3 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
              <p className="text-xs text-yellow-300/90">{w}</p>
            </CardContent>
          </Card>
        ))}

        {selectedExercise.videoPlaceholder && (
          <Card className="border-border bg-secondary">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Video de Técnica</p>
                <p className="text-xs text-muted-foreground">Ver guía de forma correcta</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-2 grid grid-cols-[1fr_2fr_2fr_2fr_auto] items-center gap-2">
            <span className="text-center text-xs font-medium text-muted-foreground">Serie</span>
            <span className="text-center text-xs font-medium text-muted-foreground">Peso (kg)</span>
            <span className="text-center text-xs font-medium text-muted-foreground">Reps</span>
            <span className="text-center text-xs font-medium text-muted-foreground">RPE</span>
            <span className="w-8" />
          </div>

          {sets.map((set, i) => (
            <div
              key={`set-${i}`}
              className="mb-2 grid grid-cols-[1fr_2fr_2fr_2fr_auto] items-center gap-2"
            >
              <span className="text-center text-sm font-semibold text-foreground">{i + 1}</span>
              <Input
                type="number"
                className="bg-secondary text-center"
                value={set.weight || ""}
                onChange={(e) => handleSetChange(i, "weight", Number(e.target.value))}
                placeholder="0"
              />
              <Input
                type="number"
                className="bg-secondary text-center"
                value={set.reps || ""}
                onChange={(e) => handleSetChange(i, "reps", Number(e.target.value))}
                placeholder="0"
              />
              <Input
                type="number"
                className="bg-secondary text-center"
                min={1}
                max={10}
                value={set.rpe || ""}
                onChange={(e) =>
                  handleSetChange(i, "rpe", Math.min(10, Math.max(1, Number(e.target.value))))
                }
                placeholder="7"
              />
              <button
                type="button"
                onClick={() => handleRemoveSet(i)}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-destructive"
                aria-label="Eliminar serie"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button
            variant="outline"
            className="mt-2 w-full border-dashed bg-transparent"
            onClick={handleAddSet}
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar Serie
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guía RPE
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">10</span> - Esfuerzo máximo, 0 reps más
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">9</span> - Podrías hacer 1 rep más
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">8</span> - Podrías hacer 2 reps más
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">7</span> - Podrías hacer 3 reps más
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full font-semibold"
          size="lg"
          onClick={handleLogWorkout}
          disabled={!sets.some((s) => s.weight > 0 && s.reps > 0)}
        >
          <Check className="mr-2 h-4 w-4" /> Registrar Entrenamiento
        </Button>
      </div>
    )
  }

  // Exercise list view
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Entrenamiento</h1>
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-transparent">
              <Plus className="mr-1 h-4 w-4" /> Personalizado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Agregar Ejercicio Personalizado</DialogTitle>
              <DialogDescription>Crea un nuevo ejercicio con nombre y grupo muscular.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre del ejercicio</Label>
                <Input
                  className="mt-1.5 bg-secondary"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej: Sentadilla Hack"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Grupo muscular</Label>
                <Input
                  className="mt-1.5 bg-secondary"
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="Ej: Piernas"
                />
              </div>
              <Button onClick={handleAddCustom} disabled={!customName.trim()}>
                Agregar Ejercicio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="bg-secondary pl-10"
          placeholder="Buscar ejercicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredExercises ? (
        <div className="flex flex-col gap-2">
          {filteredExercises.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron ejercicios
            </p>
          )}
          {filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onSelect={() => setSelectedExercise(ex)}
              prevBest={getPreviousBest(ex.id)}
            />
          ))}
        </div>
      ) : (
        Array.from(muscleGroups.entries()).map(([group, exercises]) => (
          <div key={group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </h3>
            <div className="flex flex-col gap-2">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onSelect={() => setSelectedExercise(ex)}
                  prevBest={getPreviousBest(ex.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function ExerciseCard({
  exercise,
  onSelect,
  prevBest,
}: {
  exercise: Exercise
  onSelect: () => void
  prevBest: { weight: number; reps: number } | null
}) {
  return (
    <Card
      className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary"
      onClick={onSelect}
    >
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{exercise.name}</span>
          {prevBest ? (
            <span className="text-xs text-muted-foreground">
              Último: {prevBest.weight}kg x {prevBest.reps}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sin datos previos</span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
