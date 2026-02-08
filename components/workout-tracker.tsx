"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
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
  Dumbbell,
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
  // Cargamos ejercicios (por defecto + personalizados)
  const allExercises = useMemo(() => {
    const data = loadData()
    // Unimos y ordenamos alfabéticamente
    return [...defaultExercises, ...data.customExercises].sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }, [workoutLogs]) // Recargamos si cambian los logs (por si añadimos uno nuevo)

  const [search, setSearch] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    initialExerciseId ? allExercises.find((e) => e.id === initialExerciseId) || null : null
  )
  
  // Estado para el entrenamiento actual
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0, rpe: 7 }])
  
  // Estado para crear ejercicio nuevo
  const [isCreating, setIsCreating] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("Otro")

  // Agrupar ejercicios por músculo
  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    
    // Filtramos primero por búsqueda
    const filtered = allExercises.filter(e => 
      e.name.toLowerCase().includes(search.toLowerCase())
    )

    filtered.forEach(ex => {
      const group = ex.muscleGroup || "Otro"
      if (!groups[group]) groups[group] = []
      groups[group].push(ex)
    })

    return groups
  }, [allExercises, search])

  // Lógica de progreso y estadísticas
  function getPreviousBest(exerciseId: string) {
    const logs = workoutLogs
      .filter((l) => l.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (logs.length === 0) return null

    // Buscamos el mejor set histórico (mayor peso o más reps con mismo peso)
    let bestSet = { weight: 0, reps: 0 }
    
    logs.forEach(log => {
        log.sets.forEach(set => {
            if (set.weight > bestSet.weight || (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
                bestSet = { weight: set.weight, reps: set.reps }
            }
        })
    })
    
    return bestSet.weight > 0 ? bestSet : null
  }

  function handleAddSet() {
    const lastSet = sets[sets.length - 1] || { weight: 0, reps: 0, rpe: 7 }
    setSets([...sets, { ...lastSet }])
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

  function handleSaveWorkout() {
    if (!selectedExercise) return
    
    // Filtramos sets vacíos
    const validSets = sets.filter(s => s.weight > 0 && s.reps > 0)
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

  function handleCreateExercise() {
    if (!newExerciseName.trim()) return

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExerciseName,
      muscleGroup: newExerciseMuscle,
      isCustom: true
    }

    addCustomExercise(newExercise)
    setIsCreating(false)
    setNewExerciseName("")
    setSearch("") // Limpiamos búsqueda para ver el nuevo ejercicio
    onLogAdded() // Forzar recarga
  }

  // --- VISTA DETALLE DE EJERCICIO ---
  if (selectedExercise) {
    const prevBest = getPreviousBest(selectedExercise.id)
    
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6 animate-in slide-in-from-right">
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExercise(null)}>
            <ChevronRight className="h-6 w-6 rotate-180" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold leading-none">{selectedExercise.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedExercise.muscleGroup}</p>
          </div>
        </div>

        {/* Tarjeta de Mejor Marca */}
        {prevBest && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tu Récord</p>
                <p className="font-bold text-foreground">
                  {prevBest.weight}kg <span className="text-muted-foreground font-normal">x {prevBest.reps} reps</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Tutorial (Si tiene link) */}
        {selectedExercise.videoPlaceholder && (
          <a 
            href={selectedExercise.videoPlaceholder} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Play className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="text-sm font-medium">Ver técnica en YouTube</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        )}

        {/* Tabla de Series */}
        <div className="space-y-3">
          <div className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1fr_0.5fr] gap-2 px-1 text-xs font-medium text-muted-foreground text-center">
            <span>#</span>
            <span>Kilos</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
          </div>

          {sets.map((set, idx) => (
            <div key={idx} className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1fr_0.5fr] gap-2 items-center">
              <span className="text-center font-bold text-sm text-muted-foreground">{idx + 1}</span>
              <Input 
                type="number" 
                placeholder="0" 
                className="text-center h-10 bg-card"
                value={set.weight || ""}
                onChange={(e) => handleSetChange(idx, "weight", parseFloat(e.target.value))}
              />
              <Input 
                type="number" 
                placeholder="0" 
                className="text-center h-10 bg-card"
                value={set.reps || ""}
                onChange={(e) => handleSetChange(idx, "reps", parseFloat(e.target.value))}
              />
              <Input 
                type="number" 
                placeholder="7" 
                className="text-center h-10 bg-card"
                value={set.rpe || ""}
                onChange={(e) => handleSetChange(idx, "rpe", parseFloat(e.target.value))}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSet(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full border-dashed" onClick={handleAddSet}>
            <Plus className="h-4 w-4 mr-2" /> Agregar Serie
          </Button>
        </div>

        <div className="flex-1" /> {/* Espaciador */}

        <Button size="lg" className="w-full mb-4" onClick={handleSaveWorkout}>
          <Check className="h-4 w-4 mr-2" /> Guardar Entrenamiento
        </Button>
      </div>
    )
  }

  // --- VISTA LISTA DE EJERCICIOS ---
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ejercicios</h1>
        
        {/* Botón rápido de crear */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Ejercicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input 
                  placeholder="Ej: Sentadilla Hack" 
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Músculo Principal</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newExerciseMuscle}
                  onChange={(e) => setNewExerciseMuscle(e.target.value)}
                >
                  <option value="Piernas">Piernas</option>
                  <option value="Espalda">Espalda</option>
                  <option value="Pecho">Pecho</option>
                  <option value="Hombros">Hombros</option>
                  <option value="Brazos">Brazos</option>
                  <option value="Abdomen">Abdomen</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <Button className="w-full" onClick={handleCreateExercise} disabled={!newExerciseName}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9 bg-secondary border-transparent focus:bg-background transition-colors"
          placeholder="Buscar ejercicio..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista Agrupada */}
      <div className="space-y-6">
        {Object.keys(groupedExercises).length === 0 ? (
           <div className="text-center py-10">
             <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
             <p className="text-muted-foreground">No encontramos "{search}"</p>
             <Button variant="link" onClick={() => { setNewExerciseName(search); setIsCreating(true); }}>
               Crearlo ahora
             </Button>
           </div>
        ) : (
          Object.entries(groupedExercises).map(([muscle, exercises]) => (
            <div key={muscle} className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                {muscle}
              </h3>
              <div className="grid gap-2">
                {exercises.map((ex) => {
                  const prevBest = getPreviousBest(ex.id)
                  return (
                    <Card 
                      key={ex.id} 
                      className="cursor-pointer hover:bg-secondary/50 transition-colors active:scale-[0.99]"
                      onClick={() => { setSelectedExercise(ex); setSearch(""); }}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{ex.name}</p>
                          {prevBest ? (
                            <p className="text-xs text-muted-foreground">
                              Récord: {prevBest.weight}kg x {prevBest.reps}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/50">Sin historial</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}