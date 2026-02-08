"use client"

import { useState, useMemo, useRef } from "react"
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
  
  // Estados para los datos de la comida
  const [foodName, setFoodName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")
  
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  
  // ESTO ES LO IMPORTANTE: La referencia al input invisible
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    setFoodName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFats("")
    setShowForm(false)
    setScanResult(null)
    onUpdate()
  }

  function handleDelete(id: string) {
    removeFoodFromStore(id)
    onUpdate()
  }

  // ESTA ES LA FUNCIÓN REAL (NO SIMULADA)
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // 1. Empezamos a cargar
    setScanning(true)
    setScanResult(null)
    setShowForm(true) 

    const formData = new FormData()
    formData.append("image", file)

    try {
      // 2. Llamamos a TU servidor (que llama a Gemini)
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error de conexión")

      const data = await response.json()

      if (data.error) throw new Error(data.error)

      // 3. Rellenamos el formulario con lo que dijo la IA
      setFoodName(data.food_name || "Comida detectada")
      setCalories(String(data.calories || ""))
      setProtein(String(data.protein || ""))
      setCarbs(String(data.carbs || ""))
      setFats(String(data.fats || ""))
      
      setScanResult(`¡Detectado! ${data.food_name}`)

    } catch (error) {
      console.error(error)
      setScanResult("No pude reconocer la comida. Intenta de nuevo.")
    } finally {
      setScanning(false)
      // Limpiamos el input para poder subir la misma foto si queremos
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function MacroBar({ label, current, target, color }: any) {
    const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xs text-foreground">
            {current}<span className="text-muted-foreground">/{target}g</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nutrición</h1>
        <div className="flex gap-2">
          
          {/* AQUÍ ESTÁ EL TRUCO: Un input invisible */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden" 
            accept="image/*"
            capture="environment" 
          />
          
          {/* El botón ahora hace clic en el input invisible */}
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent"
            onClick={() => fileInputRef.current?.click()} 
            disabled={scanning}
          >
            {scanning ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-1 h-4 w-4" />
            )}
            Analizar Foto
          </Button>

          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Añadir
          </Button>
        </div>
      </div>

      {/* Resultado de la IA */}
      {scanResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">IA Gemini</p>
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
              <p className="text-sm font-medium text-yellow-400">Grasas Bajas</p>
              <p className="text-xs text-yellow-300/80">{"<30g de grasa afecta tus hormonas."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Macros */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calorías hoy</p>
              <p className="text-3xl font-bold text-foreground">{totals.calories}</p>
            </div>
            <p className="text-sm text-muted-foreground">meta: {profile.calories}</p>
          </div>
          <div className="flex flex-col gap-3">
            <MacroBar label="Proteína" current={totals.protein} target={profile.protein} color="hsl(var(--chart-2))" />
            <MacroBar label="Carbos" current={totals.carbs} target={profile.carbs} color="hsl(var(--chart-3))" />
            <MacroBar label="Grasas" current={totals.fats} target={profile.fats} color="hsl(var(--chart-4))" />
          </div>
        </CardContent>
      </Card>

      {/* Formulario (Se abre solo al escanear) */}
      {showForm && (
        <Card className="border-border bg-card animate-in slide-in-from-top-2 fade-in">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">{scanning ? "Analizando..." : "Editar"}</h3>
              {scanning && <Loader2 className="h-4 w-4 animate-spin text-primary"/>}
            </div>
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input className="mt-1 bg-secondary" value={foodName} onChange={(e) => setFoodName(e.target.value)} disabled={scanning} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Calorías</Label><Input type="number" className="mt-1 bg-secondary" value={calories} onChange={(e) => setCalories(e.target.value)} disabled={scanning} /></div>
              <div><Label className="text-xs">Proteína</Label><Input type="number" className="mt-1 bg-secondary" value={protein} onChange={(e) => setProtein(e.target.value)} disabled={scanning} /></div>
              <div><Label className="text-xs">Carbos</Label><Input type="number" className="mt-1 bg-secondary" value={carbs} onChange={(e) => setCarbs(e.target.value)} disabled={scanning} /></div>
              <div><Label className="text-xs">Grasas</Label><Input type="number" className="mt-1 bg-secondary" value={fats} onChange={(e) => setFats(e.target.value)} disabled={scanning} /></div>
            </div>
            <Button onClick={handleAdd} disabled={!foodName || scanning}>{scanning ? "Procesando..." : "Guardar"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de comidas */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Hoy</h3>
        {todayFood.map((entry) => (
          <Card key={entry.id} className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.calories} kcal | P:{entry.protein} C:{entry.carbs} F:{entry.fats}</p>
              </div>
              <Trash2 className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => handleDelete(entry.id)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    )
}