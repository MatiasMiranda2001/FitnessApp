"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronLeft, ChevronRight, Utensils, Camera, Sparkles, Loader2, Search, Pencil, Trash2, RefreshCw, Minus, Zap } from "lucide-react"
import Link from "next/link"
import type { UserProfile, FoodEntry } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { searchFoods, getEmojiForFoodName, extractGramsFromPortion, type FoodItem } from "@/lib/food-data"
import { addFoodEntry, removeFoodEntry, updateFoodEntry } from "@/lib/store"

/** Devuelve "YYYY-MM-DD" usando la fecha LOCAL del dispositivo (no UTC). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface NutritionTrackerProps {
  profile: UserProfile
  foodEntries: FoodEntry[]
  onUpdate: () => void
  /** Incrementar este número desde afuera abre el modal de scan automáticamente */
  scanTrigger?: number
}

export function NutritionTracker({ profile, foodEntries, onUpdate, scanTrigger }: NutritionTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [showScanLimit, setShowScanLimit] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedFood, setAnalyzedFood] = useState<Partial<FoodEntry> | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualForm, setManualForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [foodLimitError, setFoodLimitError] = useState<string | null>(null)
  // --- EDITAR PORCIONES ---
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null)
  const [editPortions, setEditPortions] = useState(1)
  const [editMacros, setEditMacros] = useState({ cal: "", prot: "", carb: "", fat: "", grams: "" })
  // Valores base por gramo (calculados al abrir el modal)
  const [basePerGram, setBasePerGram] = useState<{ cal: number; prot: number; carb: number; fat: number } | null>(null)

  // Abre el modal de scan cuando se dispara desde afuera (botón cámara del nav)
  useEffect(() => {
    if (scanTrigger && scanTrigger > 0) {
      setIsScanOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanTrigger])

  const filteredFoods = useMemo(
    () => searchFoods(searchTerm, categoryFilter ?? undefined, 60),
    [searchTerm, categoryFilter]
  )

  // --- HANDLER MODIFICADO PARA USAR TU API ROUTE ---
  async function handleAnalyzeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Mostrar preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setIsAnalyzing(true)
    setAnalyzedFood(null)

    try {
      // 2. Preparamos el FormData para tu API
      const formData = new FormData()
      formData.append("image", file) // Tu API espera el campo "image"

      // 3. Llamamos a tu ruta /api/analyze-food
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.status === 402) {
        setPreviewUrl(null)
        setIsScanOpen(false)
        setShowScanLimit(true)
        return
      }

      if (response.ok && result) {
        // 4. Mapeamos la respuesta de tu API a nuestro formato interno
        setAnalyzedFood({
          name: result.food_name, // Tu API devuelve food_name
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fats        // Tu API devuelve fats (plural)
        })
      } else {
        // Scan falló → activar modo manual con el nombre que devolvió la IA si hay algo
        setPreviewUrl(null)
        setManualForm({ name: result.food_name || "", calories: "", protein: "", carbs: "", fat: "" })
        setManualMode(true)
      }
    } catch (error) {
      console.error("Error conectando con la API:", error)
      setPreviewUrl(null)
      setManualForm({ name: "", calories: "", protein: "", carbs: "", fat: "" })
      setManualMode(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleSaveAnalyzedFood() {
    if (!analyzedFood) return

    const foodName = analyzedFood.name || "Comida Escaneada"
    const newEntry: FoodEntry = {
        id: Date.now().toString(),
        name: foodName,
        calories: analyzedFood.calories || 0,
        protein: analyzedFood.protein || 0,
        carbs: analyzedFood.carbs || 0,
        fat: analyzedFood.fat || 0,
        date: toLocalDateStr(selectedDate),
        image: getEmojiForFoodName(foodName),
    }

    addFoodEntry(newEntry)
    onUpdate()
    setAnalyzedFood(null)
    setPreviewUrl(null)
    setIsScanOpen(false)
  }

  async function handleSaveManual() {
    setFoodLimitError(null)
    try {
      const res = await fetch("/api/food/log", { method: "POST" })
      if (res.status === 402) {
        setIsScanOpen(false)
        setShowScanLimit(true)
        return
      }
    } catch { /* si la API no responde, permitir igualmente */ }
    const name = manualForm.name.trim() || "Comida manual"
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name,
      calories: parseFloat(manualForm.calories) || 0,
      protein:  parseFloat(manualForm.protein)  || 0,
      carbs:    parseFloat(manualForm.carbs)    || 0,
      fat:      parseFloat(manualForm.fat)      || 0,
      date: toLocalDateStr(selectedDate),
      image: getEmojiForFoodName(name),
    }
    addFoodEntry(newEntry)
    onUpdate()
    setManualMode(false)
    setManualForm({ name: "", calories: "", protein: "", carbs: "", fat: "" })
    setIsScanOpen(false)
  }

  function openEditEntry(entry: FoodEntry) {
    setEditEntry(entry)
    setEditPortions(1)
    setEditMacros({
      cal:   String(entry.calories),
      prot:  String(entry.protein),
      carb:  String(entry.carbs),
      fat:   String(entry.fat),
      grams: entry.grams ? String(entry.grams) : "",
    })
    // Si tenemos gramos registrados, calculamos base por gramo para poder recalcular
    if (entry.grams && entry.grams > 0) {
      setBasePerGram({
        cal:  entry.calories / entry.grams,
        prot: entry.protein  / entry.grams,
        carb: entry.carbs    / entry.grams,
        fat:  entry.fat      / entry.grams,
      })
    } else {
      setBasePerGram(null)
    }
  }

  function handleSavePortions() {
    if (!editEntry) return
    updateFoodEntry(editEntry.id, {
      calories: parseFloat(editMacros.cal)   || 0,
      protein:  parseFloat(editMacros.prot)  || 0,
      carbs:    parseFloat(editMacros.carb)  || 0,
      fat:      parseFloat(editMacros.fat)   || 0,
      grams:    editMacros.grams ? parseFloat(editMacros.grams) : undefined,
    })
    onUpdate()
    setEditEntry(null)
  }

  function handleAddPortion() {
    if (!editEntry) return
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: editEntry.name,
      calories: editEntry.calories,
      protein:  editEntry.protein,
      carbs:    editEntry.carbs,
      fat:      editEntry.fat,
      date:     editEntry.date,
    }
    addFoodEntry(newEntry)
    onUpdate()
    setEditEntry(null)
  }

  function handleDeleteEntry(id: string) {
    removeFoodEntry(id)
    onUpdate()
    setEditEntry(null)
  }

  function handleRepeatEntry(entry: FoodEntry) {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: entry.name,
      calories: entry.calories,
      protein:  entry.protein,
      carbs:    entry.carbs,
      fat:      entry.fat,
      date:     toLocalDateStr(selectedDate),
      image:    entry.image || getEmojiForFoodName(entry.name),
    }
    addFoodEntry(newEntry)
    onUpdate()
  }

  async function handleAddFood(food: FoodItem | Partial<FoodEntry>) {
    setFoodLimitError(null)
    try {
      const res = await fetch("/api/food/log", { method: "POST" })
      if (res.status === 402) {
        setShowScanLimit(true)
        return
      }
    } catch { /* si la API no responde, permitir igualmente */ }
    const foodName = food.name || "Comida"
    // Extraer gramos de la porción si viene del catálogo (ej: "1 unidad (90g)" → 90)
    const portion = (food as FoodItem).portion
    const grams = (food as FoodEntry).grams ?? extractGramsFromPortion(portion)
    const newEntry: FoodEntry = {
        id: Date.now().toString(),
        name: foodName,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        date: toLocalDateStr(selectedDate),
        image: (food as FoodItem).image || (food as FoodEntry).image || getEmojiForFoodName(foodName),
        ...(grams !== undefined ? { grams } : {}),
    }

    addFoodEntry(newEntry)
    onUpdate()
    setIsSearchOpen(false)
  }

  // Cálculos UI
  const dateStr = toLocalDateStr(selectedDate)
  const todaysEntries = foodEntries.filter(e => e.date === dateStr)
  
  const consumed = todaysEntries.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories, protein: acc.protein + curr.protein, carbs: acc.carbs + curr.carbs, fat: acc.fat + curr.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const targets = { calories: profile.tdee || 2000, protein: profile.protein || 150, carbs: profile.carbs || 200, fat: profile.fat || 60 }
  const remainingCalories = targets.calories - consumed.calories
  const progressPercent = Math.min(100, (consumed.calories / targets.calories) * 100)
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'proteina':    return "bg-red-100 text-red-700 border-red-200";
      case 'fruta':       return "bg-orange-100 text-orange-700 border-orange-200";
      case 'verdura':     return "bg-green-100 text-green-700 border-green-200";
      case 'postre':      return "bg-pink-100 text-pink-700 border-pink-200";
      case 'comida_arg':  return "bg-sky-100 text-sky-700 border-sky-200";
      case 'lacteo':      return "bg-blue-100 text-blue-700 border-blue-200";
      case 'bebida':      return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case 'carbohidrato':return "bg-amber-100 text-amber-700 border-amber-200";
      case 'snack':       return "bg-purple-100 text-purple-700 border-purple-200";
      default:            return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in">
      
      {/* HEADER */}
      <header className="px-6 pt-6 pb-4 flex justify-between items-center sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 1)))}><ChevronLeft className="h-6 w-6 text-muted-foreground" /></Button>
        <div className="text-center"><h1 className="text-xs font-bold uppercase tracking-widest text-primary">Resumen Diario</h1><p className="text-sm font-medium text-foreground capitalize">{format(selectedDate, "EEEE, d MMM", { locale: es })}</p></div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 1)))}><ChevronRight className="h-6 w-6 text-muted-foreground" /></Button>
      </header>

      <main className="px-6 space-y-6">
        
        {/* HERO ANILLO */}
        <section className="relative bg-card rounded-3xl p-8 shadow-sm border border-border flex flex-col items-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-secondary" cx="96" cy="96" r={radius} fill="transparent" stroke="currentColor" strokeWidth="12" />
              <circle className="text-primary transition-all duration-1000 ease-out" cx="96" cy="96" r={radius} fill="transparent" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={cn("text-4xl font-extrabold tracking-tight", remainingCalories < 0 ? "text-destructive" : "text-foreground")}>{Math.abs(remainingCalories)}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{remainingCalories >= 0 ? "Kcal Restantes" : "Excedidas"}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-8 w-full border-t border-border pt-6">
            <div className="text-center"><p className="text-[10px] uppercase font-bold text-muted-foreground">Consumido</p><p className="text-lg font-bold">{consumed.calories}</p></div>
            <div className="text-center border-l border-border"><p className="text-[10px] uppercase font-bold text-muted-foreground">Meta</p><p className="text-lg font-bold">{targets.calories}</p></div>
          </div>
        </section>

        {/* MACROS */}
        <section className="grid grid-cols-3 gap-3">
          <MacroCard label="Prot" current={consumed.protein} target={targets.protein} colorClass="bg-primary" />
          <MacroCard label="Carb" current={consumed.carbs} target={targets.carbs} colorClass="bg-amber-400" />
          <MacroCard label="Gras" current={consumed.fat} target={targets.fat} colorClass="bg-rose-400" />
        </section>

        {/* CARD EDUCATIVA DE ENFOQUE */}
        {profile?.goal && <GoalApproachCard goal={profile.goal} tdee={targets.calories} />}

        {/* ACCIONES */}
        <div className="grid grid-cols-2 gap-3">
           
           {/* 1. BUSCADOR MANUAL */}
           <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <SheetTrigger asChild>
                 <Button variant="outline" className="h-14 rounded-xl border-dashed border-2 flex items-center gap-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5">
                    <Search className="h-5 w-5" /> Buscar Comida
                 </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
                  <div className="h-full flex flex-col bg-background">
                     <div className="px-6 pt-6 pb-2">
                        <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-4">Registrar Comida</h2>
                        {foodLimitError && (
                          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                            🚫 {foodLimitError}
                          </div>
                        )}
                        
                        <div className="relative group mb-4">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                           <Input 
                              className="pl-12 bg-secondary/50 border-none h-12"
                              placeholder="Ej: Pollo, Helado, Arroz..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              autoFocus
                           />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                           <button onClick={() => setCategoryFilter(null)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!categoryFilter ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Todos</button>
                           <button onClick={() => setCategoryFilter('comida_arg')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'comida_arg' ? 'bg-sky-600 text-white' : 'bg-secondary text-muted-foreground'}`}>🇦🇷 Argentina</button>
                           <button onClick={() => setCategoryFilter('proteina')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'proteina' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Proteínas</button>
                           <button onClick={() => setCategoryFilter('carbohidrato')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'carbohidrato' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Carbos</button>
                           <button onClick={() => setCategoryFilter('verdura')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'verdura' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Verduras</button>
                           <button onClick={() => setCategoryFilter('fruta')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'fruta' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Frutas</button>
                           <button onClick={() => setCategoryFilter('lacteo')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'lacteo' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Lácteos</button>
                           <button onClick={() => setCategoryFilter('postre')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'postre' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Postres 🍩</button>
                           <button onClick={() => setCategoryFilter('bebida')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === 'bebida' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Bebidas</button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3">
                        {filteredFoods.map(food => (
                           <div key={food.id} className="flex items-center p-3 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/50 transition-all cursor-pointer group" onClick={() => handleAddFood(food)}>
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mr-4 shrink-0 text-2xl">
                                 {food.image}
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-bold text-sm">{food.name}</h3>
                                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 border ${getCategoryColor(food.category)}`}>
                                       {food.category}
                                    </Badge>
                                 </div>
                                 <p className="text-xs text-muted-foreground">{food.portion} • <span className="text-primary font-bold">{food.calories} kcal</span></p>
                              </div>
                              <button
                                 onClick={e => { e.stopPropagation(); handleAddFood(food) }}
                                 className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all active:scale-90"
                              >
                                 <Plus className="h-5 w-5" />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
              </SheetContent>
           </Sheet>

           {/* Modal: sin escaneos */}
           <Dialog open={showScanLimit} onOpenChange={setShowScanLimit}>
             <DialogContent className="sm:max-w-sm text-center">
               <div className="flex flex-col items-center gap-4 py-2">
                 <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                   <Camera className="h-8 w-8 text-destructive" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold mb-1">Te quedaste sin escaneos</h2>
                   <p className="text-sm text-muted-foreground">Usaste todos tus escaneos del mes. Si querés seguir escaneando tus comidas con IA, podés pasarte al Plan Pro.</p>
                 </div>
                 <div className="w-full space-y-2 pt-2">
                   <Link href="/billing" onClick={() => setShowScanLimit(false)}>
                     <Button className="w-full font-semibold gap-2">
                       <Zap className="h-4 w-4" /> Ver Plan Pro
                     </Button>
                   </Link>
                   <Button variant="ghost" className="w-full" onClick={() => setShowScanLimit(false)}>
                     Ahora no
                   </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>

           {/* 2. ESCÁNER IA */}
           <Dialog open={isScanOpen} onOpenChange={(open) => {
             setIsScanOpen(open)
             if (!open) {
               setManualMode(false)
               setPreviewUrl(null)
               setAnalyzedFood(null)
               setManualForm({ name: "", calories: "", protein: "", carbs: "", fat: "" })
             }
           }}>
              <DialogTrigger asChild>
                 <Button
                   className="h-14 rounded-xl flex items-center gap-2 bg-brand-gradient text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                   onClick={async (e) => {
                     // Chequear límite antes de abrir
                     try {
                       const res = await fetch("/api/analyze-food/check", { method: "GET" }).catch(() => null)
                       if (res?.status === 402) {
                         e.preventDefault()
                         setShowScanLimit(true)
                         return
                       }
                     } catch {}
                   }}
                 >
                    <Sparkles className="h-5 w-5" /> IA Scan
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                 <DialogHeader><DialogTitle>Escáner Inteligente</DialogTitle></DialogHeader>
                 {manualMode ? (
                    /* ── MODO MANUAL: scan falló ── */
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <span className="text-xl">🤔</span>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">No pudimos reconocer la comida automáticamente. Completá los datos manualmente.</p>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Nombre de la comida"
                          value={manualForm.name}
                          onChange={(e) => setManualForm(f => ({ ...f, name: e.target.value }))}
                          className="h-11"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Calorías (kcal)</label>
                            <Input type="number" inputMode="numeric" placeholder="0" value={manualForm.calories} onChange={(e) => setManualForm(f => ({ ...f, calories: e.target.value }))} className="h-11" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Proteína (g)</label>
                            <Input type="number" inputMode="numeric" placeholder="0" value={manualForm.protein} onChange={(e) => setManualForm(f => ({ ...f, protein: e.target.value }))} className="h-11" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Carbos (g)</label>
                            <Input type="number" inputMode="numeric" placeholder="0" value={manualForm.carbs} onChange={(e) => setManualForm(f => ({ ...f, carbs: e.target.value }))} className="h-11" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Grasas (g)</label>
                            <Input type="number" inputMode="numeric" placeholder="0" value={manualForm.fat} onChange={(e) => setManualForm(f => ({ ...f, fat: e.target.value }))} className="h-11" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setManualMode(false); setPreviewUrl(null) }}>
                          Reintentar scan
                        </Button>
                        <Button className="flex-1" onClick={handleSaveManual} disabled={!manualForm.name.trim() && !manualForm.calories}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                 ) : !previewUrl ? (
                    <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/50 transition-colors group">
                       <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                          onChange={handleAnalyzeImage}
                       />
                       <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Camera className="h-8 w-8 text-primary" />
                       </div>
                       <h3 className="font-semibold text-lg">Toca para escanear</h3>
                       <p className="text-xs text-muted-foreground mt-1">Sube una foto de tu plato</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-inner">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                          
                          {isAnalyzing && (
                             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
                                <p className="font-medium animate-pulse">Analizando ingredientes...</p>
                             </div>
                          )}

                          {!isAnalyzing && analyzedFood && (
                              <div className="absolute bottom-0 left-0 right-0 bg-background/95 p-4 border-t border-border backdrop-blur-md animate-in slide-in-from-bottom-4">
                                 <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{analyzedFood.name}</h3>
                                    <span className="text-2xl font-bold text-primary">{analyzedFood.calories} <span className="text-xs font-normal text-foreground">kcal</span></span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="text-center p-1 bg-secondary rounded"><span className="block font-bold text-xs">{analyzedFood.protein}g</span><span className="text-[10px] text-muted-foreground">Prot</span></div>
                                    <div className="text-center p-1 bg-secondary rounded"><span className="block font-bold text-xs">{analyzedFood.carbs}g</span><span className="text-[10px] text-muted-foreground">Carb</span></div>
                                    <div className="text-center p-1 bg-secondary rounded"><span className="block font-bold text-xs">{analyzedFood.fat}g</span><span className="text-[10px] text-muted-foreground">Gras</span></div>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setPreviewUrl(null)}>Reintentar</Button>
                                    <Button className="flex-1" onClick={handleSaveAnalyzedFood}>Guardar</Button>
                                 </div>
                              </div>
                          )}
                       </div>
                    </div>
                 )}
              </DialogContent>
           </Dialog>
        </div>

        {/* LISTA HOY */}
        <section className="space-y-4 pt-2">
           <h2 className="text-lg font-bold flex items-center gap-2"><span className="w-1.5 h-6 bg-primary rounded-full"></span> Hoy</h2>
           {todaysEntries.length > 0 ? (
             <div className="space-y-3">
               {todaysEntries.map((entry) => (
                 <div key={entry.id} className="bg-card rounded-xl px-4 py-3 shadow-sm border border-border flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                      {entry.image || getEmojiForFoodName(entry.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.grams ? <span className="text-foreground font-medium">{entry.grams}g · </span> : null}
                        {entry.protein}p • {entry.carbs}c • {entry.fat}f
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">{entry.calories}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">kcal</p>
                    </div>
                    {/* Botón repetir (+1 porción instantáneo) */}
                    <button
                      onClick={() => handleRepeatEntry(entry)}
                      className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-90 transition-all shrink-0"
                      aria-label="Repetir porción"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    {/* Botón editar */}
                    <button
                      onClick={() => openEditEntry(entry)}
                      className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-90 transition-all shrink-0"
                      aria-label="Editar entrada"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8 bg-secondary/20 rounded-xl border border-dashed border-border"><p className="text-muted-foreground text-sm">Sin comidas registradas</p></div>
           )}
        </section>

        {/* SHEET: EDITOR DE PORCIONES */}
        <Sheet open={!!editEntry} onOpenChange={(open) => { if (!open) setEditEntry(null) }}>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8">
            {editEntry && (() => {
              const p = editPortions
              const newCal  = Math.round(editEntry.calories * p)
              const newProt = Math.round(editEntry.protein  * p * 10) / 10
              const newCarb = Math.round(editEntry.carbs    * p * 10) / 10
              const newFat  = Math.round(editEntry.fat      * p * 10) / 10
              return (
                <div className="space-y-5 pt-2">
                  <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto" />

                  {/* Nombre */}
                  <div className="text-center">
                    <p className="font-bold text-lg">{editEntry.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">1 porción = {editEntry.calories} kcal</p>
                  </div>

                  {/* Stepper de porciones — recalcula macros y gramos según P */}
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        const newP = Math.max(0.5, Math.round((editPortions - 0.5) * 10) / 10)
                        setEditPortions(newP)
                        setEditMacros(m => ({
                          ...m,
                          cal:  String(Math.round(editEntry.calories * newP)),
                          prot: String(Math.round(editEntry.protein  * newP * 10) / 10),
                          carb: String(Math.round(editEntry.carbs    * newP * 10) / 10),
                          fat:  String(Math.round(editEntry.fat      * newP * 10) / 10),
                          grams: editEntry.grams ? String(Math.round(editEntry.grams * newP * 10) / 10) : m.grams,
                        }))
                      }}
                      className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary/10 hover:text-primary active:scale-90 transition-all"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <div className="text-center min-w-[80px]">
                      <p className="text-4xl font-extrabold">{editPortions}</p>
                      <p className="text-xs text-muted-foreground">porciones</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newP = Math.round((editPortions + 0.5) * 10) / 10
                        setEditPortions(newP)
                        setEditMacros(m => ({
                          ...m,
                          cal:  String(Math.round(editEntry.calories * newP)),
                          prot: String(Math.round(editEntry.protein  * newP * 10) / 10),
                          carb: String(Math.round(editEntry.carbs    * newP * 10) / 10),
                          fat:  String(Math.round(editEntry.fat      * newP * 10) / 10),
                          grams: editEntry.grams ? String(Math.round(editEntry.grams * newP * 10) / 10) : m.grams,
                        }))
                      }}
                      className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-primary/10 hover:text-primary active:scale-90 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Campo de gramos — recalcula macros si hay base */}
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                    <span className="text-lg">⚖️</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Gramos consumidos</p>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          className="w-24 bg-transparent text-sm font-bold focus:outline-none text-foreground"
                          value={editMacros.grams}
                          onChange={e => {
                            const g = parseFloat(e.target.value)
                            setEditMacros(m => ({ ...m, grams: e.target.value }))
                            // Si hay base por gramo, recalcular macros automáticamente
                            const base = basePerGram ?? (editEntry && editEntry.grams && editEntry.grams > 0 ? {
                              cal:  editEntry.calories / editEntry.grams,
                              prot: editEntry.protein  / editEntry.grams,
                              carb: editEntry.carbs    / editEntry.grams,
                              fat:  editEntry.fat      / editEntry.grams,
                            } : null)
                            if (base && !isNaN(g) && g > 0) {
                              setEditMacros(m => ({
                                ...m,
                                grams: e.target.value,
                                cal:  String(Math.round(base.cal  * g)),
                                prot: String(Math.round(base.prot * g * 10) / 10),
                                carb: String(Math.round(base.carb * g * 10) / 10),
                                fat:  String(Math.round(base.fat  * g * 10) / 10),
                              }))
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">g</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right leading-relaxed">
                      {basePerGram ? "Recalcula\nmacros ↑" : "Editá los macros\nabajo si querés"}
                    </p>
                  </div>

                  {/* Macros editables directamente */}
                  <div>
                    <p className="text-[11px] text-center text-muted-foreground mb-2">✏️ Tocá cualquier valor para editarlo</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Kcal", key: "cal" as const, unit: "" },
                        { label: "Prot", key: "prot" as const, unit: "g" },
                        { label: "Carb", key: "carb" as const, unit: "g" },
                        { label: "Gras", key: "fat" as const, unit: "g" },
                      ].map(({ label, key, unit }) => (
                        <div key={label} className="bg-secondary rounded-xl p-2 text-center border-2 border-transparent focus-within:border-primary transition-colors">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
                          <div className="flex items-baseline justify-center gap-0.5">
                            <input
                              type="number"
                              inputMode="decimal"
                              className="w-full bg-transparent text-center text-sm font-extrabold focus:outline-none text-foreground"
                              value={editMacros[key]}
                              onChange={e => setEditMacros(m => ({ ...m, [key]: e.target.value }))}
                            />
                            {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guardar cambio / Eliminar */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDeleteEntry(editEntry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1 h-12 rounded-xl"
                      onClick={handleSavePortions}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              )
            })()}
          </SheetContent>
        </Sheet>

      </main>
    </div>
  )
}

// ── Card educativa según el objetivo nutricional ──────────────────
const GOAL_INFO: Record<string, {
  title: string
  emoji: string
  color: string
  bgColor: string
  approach: string
  foods: string
  training: string
}> = {
  cut: {
    title: "Definición",
    emoji: "🔥",
    color: "text-green-600",
    bgColor: "bg-green-500/10 border-green-500/20",
    approach: "Déficit calórico de ~500 kcal para quemar grasa preservando músculo.",
    foods: "Prioridad: proteína alta (pollo, huevo, atún, yogur griego). Carbohidratos moderados solo alrededor del entrenamiento (avena, arroz integral). Grasas saludables con moderación (palta, aceite de oliva).",
    training: "Pesas 3–5x/semana para preservar músculo + cardio opcional para acelerar el déficit.",
  },
  bulk: {
    title: "Volumen",
    emoji: "💪",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    approach: "Superávit calórico de ~300 kcal para maximizar la síntesis muscular sin acumular grasa de más.",
    foods: "Base en carbohidratos de calidad (arroz, papa, avena, pan integral) para energía. Proteína alta (2g/kg de peso) para crecer. Grasas saludables sin restricción.",
    training: "Pesas 4–6x/semana con progresión de carga semanal. Enfocate en ejercicios compuestos (sentadilla, press, peso muerto).",
  },
  maintain: {
    title: "Mantenimiento",
    emoji: "⚖️",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    approach: "Calorías de mantenimiento para sostener tu peso y mejorar la composición corporal progresivamente.",
    foods: "Balance equilibrado: carbohidratos (~40%), proteína (~30%), grasas (~30%). Priorizá alimentos enteros y minimizá ultraprocesados.",
    training: "Pesas 3–4x/semana. Podés combinar fuerza + cardio. El objetivo es rendimiento y bienestar a largo plazo.",
  },
}

function GoalApproachCard({ goal, tdee }: { goal: string; tdee: number }) {
  const [open, setOpen] = useState(false)
  const info = GOAL_INFO[goal]
  if (!info) return null

  return (
    <div className={`rounded-2xl border p-4 ${info.bgColor}`}>
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.emoji}</span>
          <div className="text-left">
            <p className={`text-sm font-bold ${info.color}`}>Enfoque: {info.title}</p>
            <p className="text-xs text-muted-foreground">Meta: {tdee} kcal/día · Tocá para ver tu plan</p>
          </div>
        </div>
        <span className={`text-xs font-bold ${info.color} transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <p className="font-semibold text-foreground mb-1">🎯 Estrategia calórica</p>
            <p className="text-muted-foreground leading-relaxed">{info.approach}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🍽️ Qué comer</p>
            <p className="text-muted-foreground leading-relaxed">{info.foods}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🏋️ Entrenamiento sugerido</p>
            <p className="text-muted-foreground leading-relaxed">{info.training}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function MacroCard({ label, current, target, colorClass }: any) {
    const percent = Math.min(100, (current / target) * 100)
    return (
        <div className={`bg-card p-4 rounded-xl shadow-sm border-b-4 ${colorClass.replace('bg-', 'border-')}`}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
            <p className="font-extrabold text-sm">{Math.round(current)}g<span className="text-[10px] font-normal text-muted-foreground ml-1">/ {target}g</span></p>
            <div className={`w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden`}><div className={`${colorClass} h-full transition-all duration-500`} style={{ width: `${percent}%` }}></div></div>
        </div>
    )
}