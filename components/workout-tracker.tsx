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
} from "lucide-react"
import type { Exercise, WorkoutLog, WorkoutSet } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { addWorkoutLog, addCustomExercise, loadData, estimate1RM } from "@/lib/store"

interface WorkoutTrackerProps {
  workoutLogs: WorkoutLog[]
  onLogAdded: () => void
}

export function WorkoutTracker({ workoutLogs, onLogAdded }: WorkoutTrackerProps) {
  const [search, setSearch] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0, rpe: 7 }])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customMuscle, setCustomMuscle] = useState("")

  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises]
  }, [])

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
      muscleGroup: customMuscle || "Other",
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
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">{selectedExercise.name}</h2>
          <div className="w-5" />
        </div>

        {/* Previous best */}
        {prev && (
          <Card className="border-border bg-secondary">
            <CardContent className="flex items-center justify-between p-3">
              <span className="text-xs text-muted-foreground">Previous Best</span>
              <span className="text-sm font-semibold text-foreground">
                {prev.weight} kg x {prev.reps} reps (est. 1RM:{" "}
                {estimate1RM(prev.weight, prev.reps)} kg)
              </span>
            </CardContent>
          </Card>
        )}

        {/* Progress badge */}
        {isProgress && (
          <Badge className="w-fit bg-primary text-primary-foreground">
            <TrendingUp className="mr-1 h-3 w-3" /> Progress!
          </Badge>
        )}

        {/* Video placeholder */}
        {selectedExercise.videoPlaceholder && (
          <Card className="border-border bg-secondary">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Technique Video</p>
                <p className="text-xs text-muted-foreground">Watch proper form guide</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sets */}
        <div>
          <div className="mb-2 grid grid-cols-[1fr_2fr_2fr_2fr_auto] items-center gap-2">
            <span className="text-center text-xs font-medium text-muted-foreground">Set</span>
            <span className="text-center text-xs font-medium text-muted-foreground">
              Weight (kg)
            </span>
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
                aria-label="Remove set"
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
            <Plus className="mr-2 h-4 w-4" /> Add Set
          </Button>
        </div>

        {/* RPE Guide */}
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              RPE Guide
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">10</span> - Max effort, no reps left
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">9</span> - Could do 1 more rep
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">8</span> - Could do 2 more reps
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">7</span> - Could do 3 more reps
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
          <Check className="mr-2 h-4 w-4" /> Log Workout
        </Button>
      </div>
    )
  }

  // Exercise list view
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Workout</h1>
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-transparent">
              <Plus className="mr-1 h-4 w-4" /> Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Add Custom Exercise</DialogTitle>
              <DialogDescription>Create a new exercise with a custom name and muscle group.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Exercise Name</Label>
                <Input
                  className="mt-1.5 bg-secondary"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Hack Squat"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Muscle Group</Label>
                <Input
                  className="mt-1.5 bg-secondary"
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="e.g. Legs"
                />
              </div>
              <Button onClick={handleAddCustom} disabled={!customName.trim()}>
                Add Exercise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="bg-secondary pl-10"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {filteredExercises ? (
        <div className="flex flex-col gap-2">
          {filteredExercises.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No exercises found</p>
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
        /* Grouped by muscle */
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
              Last: {prevBest.weight}kg x {prevBest.reps}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No previous data</span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
