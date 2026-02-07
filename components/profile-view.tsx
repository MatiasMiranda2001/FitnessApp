"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, TrendingUp, Calendar, Dumbbell, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { UserProfile, WorkoutLog } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { estimate1RM, loadData } from "@/lib/store"

interface ProfileViewProps {
  profile: UserProfile
  workoutLogs: WorkoutLog[]
  onReset: () => void
}

export function ProfileView({ profile, workoutLogs, onReset }: ProfileViewProps) {
  const allExercises = useMemo(() => {
    const data = loadData()
    return [...defaultExercises, ...data.customExercises]
  }, [])

  const exercisesWithLogs = useMemo(() => {
    const ids = new Set(workoutLogs.map((l) => l.exerciseId))
    return allExercises.filter((e) => ids.has(e.id))
  }, [workoutLogs, allExercises])

  const [selectedExercise, setSelectedExercise] = useState(
    exercisesWithLogs[0]?.id || ""
  )
  const [chartMode, setChartMode] = useState<"1rm" | "volume">("1rm")

  const chartData = useMemo(() => {
    if (!selectedExercise) return []

    const logs = workoutLogs
      .filter((l) => l.exerciseId === selectedExercise)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return logs.map((log) => {
      const best1RM = Math.max(
        ...log.sets.map((s) => estimate1RM(s.weight, s.reps))
      )
      const totalVolume = log.sets.reduce(
        (sum, s) => sum + s.weight * s.reps,
        0
      )
      return {
        date: new Date(log.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        "Est. 1RM": best1RM,
        Volume: totalVolume,
      }
    })
  }, [selectedExercise, workoutLogs])

  const totalWorkouts = new Set(workoutLogs.map((l) => l.date)).size
  const totalSets = workoutLogs.reduce((s, l) => s + l.sets.length, 0)
  const totalVolume = workoutLogs.reduce(
    (s, l) => s + l.sets.reduce((ss, set) => ss + set.weight * set.reps, 0),
    0
  )

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* User info */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {profile.gender === "male" ? "Male" : "Female"}, {profile.age} years
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.heightCm}cm | {profile.weightKg}kg |{" "}
              <span className="capitalize text-primary">{profile.goal}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* All-time stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground">Workouts</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <Dumbbell className="h-5 w-5 text-chart-2" />
            <p className="text-lg font-bold text-foreground">{totalSets}</p>
            <p className="text-[10px] text-muted-foreground">Total Sets</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <TrendingUp className="h-5 w-5 text-chart-3" />
            <p className="text-lg font-bold text-foreground">
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}k`
                : totalVolume}
            </p>
            <p className="text-[10px] text-muted-foreground">Volume (kg)</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics chart */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Progress Analytics
            </h3>
          </div>

          {exercisesWithLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Log some workouts to see analytics
            </p>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                <Select
                  value={selectedExercise}
                  onValueChange={setSelectedExercise}
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercisesWithLogs.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={chartMode === "1rm" ? "default" : "outline"}
                  size="sm"
                  className={chartMode !== "1rm" ? "bg-transparent" : ""}
                  onClick={() => setChartMode("1rm")}
                >
                  1RM
                </Button>
                <Button
                  variant={chartMode === "volume" ? "default" : "outline"}
                  size="sm"
                  className={chartMode !== "volume" ? "bg-transparent" : ""}
                  onClick={() => setChartMode("volume")}
                >
                  Vol
                </Button>
              </div>

              {chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data for this exercise yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartMode === "1rm" ? "Est. 1RM" : "Volume"}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{
                        fill: "hsl(var(--primary))",
                        r: 4,
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Targets */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Calculated Targets
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TDEE</span>
              <span className="font-semibold text-foreground">
                {profile.tdee} kcal
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Calories</span>
              <span className="font-semibold text-foreground">
                {profile.calories} kcal
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Protein</span>
              <span className="font-semibold text-foreground">
                {profile.protein}g
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Carbs</span>
              <span className="font-semibold text-foreground">
                {profile.carbs}g
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fats</span>
              <span className="font-semibold text-foreground">
                {profile.fats}g
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={onReset}
      >
        Reset All Data
      </Button>
    </div>
  )
}
