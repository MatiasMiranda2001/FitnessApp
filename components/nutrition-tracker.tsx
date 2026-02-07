"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Plus, Trash2, Loader2, Sparkles, AlertTriangle } from "lucide-react"
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

  const lowFatWarning = totals.fats > 0 && totals.fats < 30

  function handleAdd() {
    const trimmedName = foodName.trim()
    const calNum = Number(calories)
    if (!trimmedName || !calNum || calNum <= 0) return

    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: trimmedName,
      calories: calNum,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      date: todayStr,
    }

    addFoodEntry(entry)

    // Clear form first, then refresh parent state
    setFoodName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFats("")
    setShowForm(false)
    setScanResult(null)

    // Trigger parent refresh so foodEntries prop updates
    onUpdate()
  }

  function handleDelete(id: string) {
    removeFoodFromStore(id)
    onUpdate()
  }

  function handleScanMeal() {
    setScanning(true)
    setScanResult(null)

    setTimeout(() => {
      const mockResults = [
        { name: "Pechuga de Pollo y Arroz", cal: 550, p: 45, c: 60, f: 10 },
        { name: "Salmón con Verduras", cal: 480, p: 38, c: 20, f: 22 },
        { name: "Batido de Proteína", cal: 320, p: 50, c: 15, f: 8 },
        { name: "Tortilla de Pavo", cal: 450, p: 35, c: 42, f: 14 },
        { name: "Ensalada César con Pollo", cal: 380, p: 32, c: 18, f: 16 },
        { name: "Avena con Plátano y Whey", cal: 420, p: 35, c: 55, f: 8 },
      ]
      const result = mockResults[Math.floor(Math.random() * mockResults.length)]

      setScanResult(`${result.name} - ${result.cal} kcal`)
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
        <h1 className="text-2xl font-bold text-foreground">Nutrición</h1>
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
            Analizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Añadir
          </Button>
        </div>
      </div>

      {scanResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Detección IA</p>
              <p className="text-xs text-muted-foreground">{scanResult}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {lowFatWarning && (
        <Card className="border-yellow-500/40 bg-yellow-500/10">
          <CardContent className="flex items-start gap-3 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Advertencia de Grasas</p>
              <p className="text-xs text-yellow-300/80">
                {"Nivel de grasas bajo (<30g) para regulación hormonal. Asegúrate de incluir grasas saludables."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calorías consumidas</p>
              <p className="text-3xl font-bold text-foreground">{totals.calories}</p>
            </div>
            <p className="text-sm text-muted-foreground">de {profile.calories} kcal</p>
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
              label="Proteína"
              current={totals.protein}
              target={profile.protein}
              color="hsl(var(--chart-2))"
            />
            <MacroBar
              label="Carbohidratos"
              current={totals.carbs}
              target={profile.carbs}
              color="hsl(var(--chart-3))"
            />
            <MacroBar
              label="Grasas"
              current={totals.fats}
              target={profile.fats}
              color="hsl(var(--chart-4))"
            />
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Registrar Comida</h3>
            <div>
              <Label className="text-xs text-muted-foreground">Nombre del alimento</Label>
              <Input
                className="mt-1 bg-secondary"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Ej: Pechuga de pollo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Calorías</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Proteína (g)</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Carbos (g)</Label>
                <Input
                  className="mt-1 bg-secondary"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Grasas (g)</Label>
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
              Registrar Comida
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Registro de Hoy
        </h3>
        {todayFood.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No hay alimentos registrados hoy. Pulsa Añadir para comenzar.
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
                      {entry.calories} kcal | P: {entry.protein}g C: {entry.carbs}g G:{" "}
                      {entry.fats}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar entrada"
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
