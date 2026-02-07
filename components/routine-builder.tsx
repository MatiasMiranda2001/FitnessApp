"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Dumbbell,
} from "lucide-react"
import type { WeeklyRoutine, RoutineDay, RoutineExercise } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { loadData, saveRoutine, deleteRoutine, setActiveRoutine } from "@/lib/store"
import { routineTemplates } from "@/lib/routine-templates"

interface RoutineBuilderProps {
  dataVersion: number
  onUpdate: () => void
  onStartWorkout: (exerciseId: string) => void
}

export function RoutineBuilder({ dataVersion, onUpdate, onStartWorkout }: RoutineBuilderProps) {
  const [view, setView] = useState<"list" | "edit" | "templates">("list")
  const [editingRoutine, setEditingRoutine] = useState<WeeklyRoutine | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  // Re-read from localStorage whenever dataVersion changes
  const data = useMemo(() => loadData(), [dataVersion])
  const userRoutines = data.routines.filter((r) => !r.isTemplate)
  const activeRoutineId = data.activeRoutineId

  const allExercises = useMemo(() => {
    return [...defaultExercises, ...data.customExercises]
  }, [data.customExercises])

  const getExerciseName = useCallback(
    (id: string) => allExercises.find((e) => e.id === id)?.name || id,
    [allExercises]
  )

  function handleCreateNew() {
    const routine: WeeklyRoutine = {
      id: `routine-${Date.now()}`,
      name: "Nueva Rutina",
      days: [
        { dayNumber: 1, label: "Día 1", exercises: [] },
      ],
    }
    setEditingRoutine(routine)
    setView("edit")
  }

  function handleCloneTemplate(template: WeeklyRoutine) {
    const clone: WeeklyRoutine = {
      ...JSON.parse(JSON.stringify(template)),
      id: `routine-${Date.now()}`,
      isTemplate: false,
    }
    saveRoutine(clone)
    onUpdate()
    setView("list")
  }

  function handleSave() {
    if (!editingRoutine) return
    saveRoutine(editingRoutine)
    onUpdate()
    setEditingRoutine(null)
    setView("list")
  }

  function handleDelete(id: string) {
    deleteRoutine(id)
    onUpdate()
  }

  function handleActivate(id: string) {
    setActiveRoutine(activeRoutineId === id ? null : id)
    onUpdate()
  }

  function handleAddDay() {
    if (!editingRoutine || editingRoutine.days.length >= 7) return
    const newDay: RoutineDay = {
      dayNumber: editingRoutine.days.length + 1,
      label: `Día ${editingRoutine.days.length + 1}`,
      exercises: [],
    }
    setEditingRoutine({
      ...editingRoutine,
      days: [...editingRoutine.days, newDay],
    })
  }

  function handleRemoveDay(dayIndex: number) {
    if (!editingRoutine || editingRoutine.days.length <= 1) return
    const newDays = editingRoutine.days
      .filter((_, i) => i !== dayIndex)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }))
    setEditingRoutine({ ...editingRoutine, days: newDays })
  }

  function handleDayLabelChange(dayIndex: number, label: string) {
    if (!editingRoutine) return
    const newDays = [...editingRoutine.days]
    newDays[dayIndex] = { ...newDays[dayIndex], label }
    setEditingRoutine({ ...editingRoutine, days: newDays })
  }

  function handleAddExercise(dayIndex: number, exerciseId: string) {
    if (!editingRoutine) return
    const day = editingRoutine.days[dayIndex]
    if (day.exercises.length >= 15) return
    const newEx: RoutineExercise = {
      exerciseId,
      sets: 3,
      reps: "8-12",
      rpe: 7,
    }
    const newDays = [...editingRoutine.days]
    newDays[dayIndex] = {
      ...day,
      exercises: [...day.exercises, newEx],
    }
    setEditingRoutine({ ...editingRoutine, days: newDays })
  }

  function handleRemoveExercise(dayIndex: number, exIndex: number) {
    if (!editingRoutine) return
    const newDays = [...editingRoutine.days]
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      exercises: newDays[dayIndex].exercises.filter((_, i) => i !== exIndex),
    }
    setEditingRoutine({ ...editingRoutine, days: newDays })
  }

  function handleExerciseFieldChange(
    dayIndex: number,
    exIndex: number,
    field: keyof RoutineExercise,
    value: string | number
  ) {
    if (!editingRoutine) return
    const newDays = [...editingRoutine.days]
    const exs = [...newDays[dayIndex].exercises]
    exs[exIndex] = { ...exs[exIndex], [field]: value }
    newDays[dayIndex] = { ...newDays[dayIndex], exercises: exs }
    setEditingRoutine({ ...editingRoutine, days: newDays })
  }

  // Templates view
  if (view === "templates") {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Rutinas Científicas</h1>
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            Volver
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Plantillas basadas en evidencia científica. Clona una para personalizar.
        </p>

        {routineTemplates.map((template) => (
          <Card key={template.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.days.length} {"días/semana"} &middot;{" "}
                    {template.days.reduce((s, d) => s + d.exercises.length, 0)} ejercicios totales
                  </p>
                </div>
                <Button size="sm" onClick={() => handleCloneTemplate(template)}>
                  <Copy className="mr-1 h-3 w-3" /> Clonar
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.days.map((day) => (
                  <Badge key={day.dayNumber} variant="secondary" className="text-xs">
                    D{day.dayNumber}: {day.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Edit view
  if (view === "edit" && editingRoutine) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Editar Rutina</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditingRoutine(null); setView("list") }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Nombre de la rutina</Label>
          <Input
            className="mt-1.5 bg-secondary"
            value={editingRoutine.name}
            onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
            placeholder="Mi rutina"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {editingRoutine.days.length} {"día(s) / semana"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent"
            onClick={handleAddDay}
            disabled={editingRoutine.days.length >= 7}
          >
            <Plus className="mr-1 h-3 w-3" /> Día
          </Button>
        </div>

        {editingRoutine.days.map((day, dayIndex) => (
          <Card key={day.dayNumber} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                >
                  {expandedDay === dayIndex ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">
                    Día {day.dayNumber}: {day.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {day.exercises.length} ej.
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveDay(dayIndex)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar día"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {expandedDay === dayIndex && (
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre del día</Label>
                    <Input
                      className="mt-1 bg-secondary text-sm"
                      value={day.label}
                      onChange={(e) => handleDayLabelChange(dayIndex, e.target.value)}
                      placeholder="Ej: Pierna, Empuje..."
                    />
                  </div>

                  {day.exercises.map((ex, exIndex) => (
                    <div
                      key={`${dayIndex}-${exIndex}`}
                      className="flex items-center gap-2 rounded-lg bg-secondary p-2"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">
                          {getExerciseName(ex.exerciseId)}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Input
                            className="h-7 w-12 bg-card text-center text-xs"
                            type="number"
                            value={ex.sets}
                            onChange={(e) =>
                              handleExerciseFieldChange(
                                dayIndex,
                                exIndex,
                                "sets",
                                Number(e.target.value)
                              )
                            }
                            aria-label="Series"
                          />
                          <span className="self-center text-[10px] text-muted-foreground">series</span>
                          <Input
                            className="h-7 w-16 bg-card text-center text-xs"
                            value={ex.reps}
                            onChange={(e) =>
                              handleExerciseFieldChange(dayIndex, exIndex, "reps", e.target.value)
                            }
                            aria-label="Reps"
                          />
                          <span className="self-center text-[10px] text-muted-foreground">reps</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar ejercicio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {day.exercises.length < 15 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Agregar ejercicio
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[70vh] overflow-y-auto bg-card">
                        <DialogHeader>
                          <DialogTitle>Seleccionar Ejercicio</DialogTitle>
                          <DialogDescription>
                            Elige un ejercicio para agregar al día {day.dayNumber}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-1">
                          {allExercises.map((exercise) => (
                            <DialogTrigger key={exercise.id} asChild>
                              <button
                                type="button"
                                className="flex items-center justify-between rounded-lg p-2.5 text-left text-sm transition-colors hover:bg-secondary"
                                onClick={() => handleAddExercise(dayIndex, exercise.id)}
                              >
                                <div>
                                  <span className="font-medium text-foreground">{exercise.name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {exercise.muscleGroup}
                                  </span>
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DialogTrigger>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {day.exercises.length >= 15 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Máximo 15 ejercicios por día alcanzado
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // List view
  const activeRoutine = userRoutines.find((r) => r.id === activeRoutineId)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Rutinas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => setView("templates")}>
            <BookOpen className="mr-1 h-3 w-3" /> Plantillas
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="mr-1 h-3 w-3" /> Nueva
          </Button>
        </div>
      </div>

      {activeRoutine && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Rutina Activa</h3>
            </div>
            <h4 className="font-semibold text-foreground">{activeRoutine.name}</h4>
            <div className="mt-3 flex flex-col gap-2">
              {activeRoutine.days.map((day) => (
                <div key={day.dayNumber} className="rounded-lg bg-secondary p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Día {day.dayNumber}: {day.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {day.exercises.length} ejercicios
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {day.exercises.slice(0, 4).map((ex, i) => (
                      <button
                        type="button"
                        key={`${day.dayNumber}-${i}`}
                        className="flex items-center gap-1 rounded bg-card px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-primary"
                        onClick={() => onStartWorkout(ex.exerciseId)}
                      >
                        <Play className="h-2.5 w-2.5" />
                        {getExerciseName(ex.exerciseId)}
                      </button>
                    ))}
                    {day.exercises.length > 4 && (
                      <span className="self-center text-[10px] text-muted-foreground">
                        +{day.exercises.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {userRoutines.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tienes rutinas aún. Crea una nueva o clona una plantilla científica.
            </p>
          </CardContent>
        </Card>
      ) : (
        userRoutines.map((routine) => (
          <Card
            key={routine.id}
            className={`border-border bg-card ${
              routine.id === activeRoutineId ? "border-primary/30" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{routine.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {routine.days.length} días &middot;{" "}
                    {routine.days.reduce((s, d) => s + d.exercises.length, 0)} ejercicios
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={routine.id === activeRoutineId ? "default" : "outline"}
                    size="sm"
                    className={routine.id !== activeRoutineId ? "bg-transparent" : ""}
                    onClick={() => handleActivate(routine.id)}
                  >
                    {routine.id === activeRoutineId ? "Activa" : "Activar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRoutine(JSON.parse(JSON.stringify(routine)))
                      setView("edit")
                    }}
                  >
                    Editar
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(routine.id)}
                    className="p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar rutina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
