"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Plus, Trash2, Loader2, Sparkles } from "lucide-react"
import type { UserProfile, FoodEntry } from "@/lib/types"
import { addFoodEntry, removeFoodEntry as removeFoodFromStore } from "@/lib/store"

interface NutritionTrackerProps {
  profile: UserProfile
  foodEntries: FoodEntry[]
  onUpdate: () => void
}

export function NutritionTracker({ profile, foodEntries, onUpdate }: NutritionTrackerProps) {
  const [showForm, setShowForm] = useState(false)
  const [foodName, setFoodName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split("T")[0]

  const todayFood = useMemo(
    () => foodEntries.filter((e) => e.date === todayStr),
    [foodEntries, todayStr]
  )

  const totals = useMemo(
    () => ({
      calories: todayFood.reduce((s, e) => s + e.calories, 0),
      protein: todayFood.reduce((s, e) => s + e.protein, 0),
      carbs: todayFood.reduce((s, e) => s + e.carbs, 0),
      fats: todayFood.reduce((s, e) => s + e.fats, 0),
    }),
    [todayFood]
  )

  function handleAdd() {
    if (!foodName.trim() || !calories) return

    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      date: todayStr,
    }

    addFoodEntry(entry)
    onUpdate()
    setFoodName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFats("")
    setShowForm(false)
  }

  function handleDelete(id: string) {
    removeFoodFromStore(id)
    onUpdate()
  }

  function handleScanMeal() {
    setScanning(true)
    setScanResult(null)

    // Simulated AI scan
    setTimeout(() => {
      const mockResults = [
        { name: "Chicken & Rice", cal: 600, p: 45, c: 65, f: 12 },
        { name: "Salmon & Veggies", cal: 480, p: 38, c: 20, f: 22 },
        { name: "Protein Shake", cal: 320, p: 50, c: 15, f: 8 },
        { name: "Turkey Sandwich", cal: 450, p: 35, c: 42, f: 14 },
      ]
      const result = mockResults[Math.floor(Math.random() * mockResults.length)]

      setScanResult(`${result.name} - ${result.cal}kcal`)
      setFoodName(result.name)
      setCalories(String(result.cal))
      setProtein(String(result.p))
      setCarbs(String(result.c))
      setFats(String(result.f))
      setScanning(false)
      setShowForm(true)
    }, 2000)
  }

  function MacroBar({
    label,
    current,
    target,
    color,
  }: {
    label: string
    current: number
    target: number
    color: string
  }) {
    const pct = Math.min((current / target) * 100, 100)
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xs text-foreground">
            {current}
            <span className="text-muted-foreground">/{target}g</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nutrition</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent"
            onClick={handleScanMeal}
            disabled={scanning}
          >
            {scanning ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-1 h-4 w-4" />
            )}
            Scan
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* AI Scan result */}
      {scanResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Detection</p>
              <p className="text-xs text-muted-foreground">{scanResult}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calorie summary */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calories consumed</p>
              <p className="text-3xl font-bold text-foreground">{totals.calories}</p>
            </div>
            <p className="text-sm text-muted-foreground">of {profile.calories} kcal</p>
          </div>
          <div className="mb-4 h-3 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.min((totals.calories / profile.calories) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <MacroBar
              label="Protein"
              current={totals.protein}
              target={profile.protein}
              color="hsl(var(--chart-2))"
            />
            <MacroBar
              label="Carbs"
              current={totals.carbs}
              target={profile.carbs}
              color="hsl(var(--chart-3))"
            />
            <MacroBar
              label="Fats"
              current={totals.fats}
              target={profile.fats}
              color="hsl(var(--chart-4))"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Food Form */}
      {showForm && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Log Food</h3>
            <div>
              <Label className="text-xs text-muted-foreground">Food Name</Label>
              <Input
                className="mt-1 bg-secondary"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Chicken Breast"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Calories</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fats (g)</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!foodName.trim() || !calories}>
              Log Food
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Food Log */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {"Today's Log"}
        </h3>
        {todayFood.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No food logged today. Tap Add to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {todayFood.map((entry) => (
              <Card key={entry.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.calories} kcal | P: {entry.protein}g C: {entry.carbs}g F:{" "}
                      {entry.fats}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete food entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
