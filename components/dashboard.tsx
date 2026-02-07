"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Dumbbell, TrendingUp, Zap } from "lucide-react"
import type { UserProfile, WorkoutLog, FoodEntry } from "@/lib/types"

interface DashboardProps {
  profile: UserProfile
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
}

function CircularProgress({
  value,
  max,
  label,
  unit,
  color,
  size = 100,
}: {
  value: number
  max: number
  label: string
  unit: string
  color: string
  size?: number
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

export function Dashboard({ profile, workoutLogs, foodEntries }: DashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0]

  const todayFood = useMemo(
    () => foodEntries.filter((e) => e.date === todayStr),
    [foodEntries, todayStr]
  )

  const todayCalories = todayFood.reduce((s, e) => s + e.calories, 0)
  const todayProtein = todayFood.reduce((s, e) => s + e.protein, 0)
  const todayCarbs = todayFood.reduce((s, e) => s + e.carbs, 0)
  const todayFats = todayFood.reduce((s, e) => s + e.fats, 0)

  const todayWorkouts = workoutLogs.filter((l) => l.date === todayStr)
  const totalSetsToday = todayWorkouts.reduce((s, l) => s + l.sets.length, 0)
  const totalVolumeToday = todayWorkouts.reduce(
    (s, l) => s + l.sets.reduce((ss, set) => ss + set.weight * set.reps, 0),
    0
  )

  const weekLogs = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return workoutLogs.filter((l) => new Date(l.date) >= weekAgo)
  }, [workoutLogs])

  const weekWorkoutDays = new Set(weekLogs.map((l) => l.date)).size

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Calorie Ring */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <CircularProgress
            value={todayCalories}
            max={profile.calories}
            label="Calories"
            unit="kcal"
            color="hsl(var(--primary))"
            size={140}
          />
          <div className="flex w-full justify-around">
            <CircularProgress
              value={todayProtein}
              max={profile.protein}
              label="Protein"
              unit="g"
              color="hsl(var(--chart-2))"
              size={72}
            />
            <CircularProgress
              value={todayCarbs}
              max={profile.carbs}
              label="Carbs"
              unit="g"
              color="hsl(var(--chart-3))"
              size={72}
            />
            <CircularProgress
              value={todayFats}
              max={profile.fats}
              label="Fats"
              unit="g"
              color="hsl(var(--chart-4))"
              size={72}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {profile.calories - todayCalories}
              </p>
              <p className="text-xs text-muted-foreground">kcal remaining</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/15">
              <Dumbbell className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalSetsToday}</p>
              <p className="text-xs text-muted-foreground">sets today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/15">
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {totalVolumeToday.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">volume (kg)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/15">
              <Zap className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{weekWorkoutDays}/7</p>
              <p className="text-xs text-muted-foreground">days this week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targets Summary */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Daily Targets
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "Calories", target: profile.calories, unit: "kcal" },
              { label: "Protein", target: profile.protein, unit: "g" },
              { label: "Carbs", target: profile.carbs, unit: "g" },
              { label: "Fats", target: profile.fats, unit: "g" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">
                  {item.target} {item.unit}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-secondary p-3">
            <p className="text-xs text-muted-foreground">
              TDEE: <span className="font-semibold text-foreground">{profile.tdee} kcal</span>
              {" | "}
              Goal: <span className="font-semibold capitalize text-primary">{profile.goal}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
