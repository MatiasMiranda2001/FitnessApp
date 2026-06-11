"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Plus, Copy, Trash2, ChevronDown, ChevronUp, Play, BookOpen, Dumbbell, Search, ExternalLink, Settings2, Pencil, FileSpreadsheet, PersonStanding, ChevronRight, Wand2, Sparkles } from "lucide-react"
import type { WeeklyRoutine, RoutineDay, RoutineExercise } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"
import { loadData, saveRoutine, deleteRoutine, setActiveRoutine, addCustomExercise } from "@/lib/store"
import { routineTemplates } from "@/lib/routine-templates"
import { ImportRoutineModal, ExportRoutineButton } from "@/components/import-routine-modal"
import { RoutineAiWizard } from "@/components/routine-ai-wizard"

interface RoutineBuilderProps {
  onShowRunning?: () => void
  dataVersion: number
  onUpdate: () => void
  onStartWorkout: (exerciseId: string) => void
  // ✨ NUEVO: Prop para iniciar el día completo
  onStartSession: (day: RoutineDay) => void
}

export function RoutineBuilder({ dataVersion, onUpdate, onStartWorkout, onStartSession, onShowRunning }: RoutineBuilderProps) {
  const [view, setView] = useState<"list" | "edit" | "templates">("list")
  const [editingRoutine, setEditingRoutine] = useState<WeeklyRoutine | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [aiWizardOpen, setAiWizardOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("Otro")

  const data = useMemo(() => loadData(), [dataVersion])
  const activeRoutineId = data.activeRoutineId

  const allExercises = useMemo(() => {
    return [...defaultExercises, ...data.customExercises].sort((a, b) => a.name.localeCompare(b.name))
  }, [data.customExercises])

  const getExerciseName = useCallback((id: string, customName?: string) => {
      if (customName) return customName
      const ex = allExercises.find((e) => e.id === id)
      if (ex) return ex.name
      // Convertir cualquier ID desconocido en nombre legible
      // "incline-dumbbell-press" → "Incline dumbbell press"
      const readable = id
        .replace(/^custom-/, "")
        .replace(/-/g, " ")
        .replace(/\w/, (c) => c.toUpperCase())
      return readable || "Ejercicio personalizado"
  }, [allExercises])

  // Mismo cálculo de ID efectivo que workout-tracker: si hay customName distinto
  // al nombre del catálogo, usa un ID compuesto para evitar mezclar historiales.
  const getEffectiveId = useCallback((exerciseId: string, customName?: string): string => {
    if (!customName) return exerciseId
    const catalogName = allExercises.find(e => e.id === exerciseId)?.name ?? ""
    if (catalogName === customName) return exerciseId
    const slug = customName.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    return `${exerciseId}__${slug}`
  }, [allExercises])

  const getLastWeight = useCallback((exerciseId: string, customName?: string): string | null => {
      const effectiveId = getEffectiveId(exerciseId, customName)
      const logs = data.workoutLogs
        .filter(l => l.exerciseId === effectiveId && l.sets && l.sets.length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (logs.length === 0) return null
      const weights = logs[0].sets.map((s: any) => s.weight).filter((w: number) => w > 0)
      if (weights.length === 0) return null
      return `${Math.max(...weights)} kg`
  }, [data.workoutLogs, getEffectiveId])

  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof allExercises> = {}
    const filtered = allExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    filtered.forEach(ex => {
      const group = ex.muscleGroup || "Otro"
      if (!groups[group]) groups[group] = []
      groups[group].push(ex)
    })
    return groups
  }, [allExercises, search])

  // --- HANDLERS (Igual que antes) ---
  function handleCreateNew() {
    const routine: WeeklyRoutine = { id: `routine-${Date.now()}`, name: "Nueva Rutina", days: [{ dayNumber: 1, label: "Día 1", exercises: [] }] }
    setEditingRoutine(routine); setView("edit"); setExpandedDay(0)
  }
  function handleCloneTemplate(template: WeeklyRoutine) {
    const clone: WeeklyRoutine = { ...JSON.parse(JSON.stringify(template)), id: `routine-${Date.now()}`, isTemplate: false }
    saveRoutine(clone); onUpdate(); setView("list")
  }
  function handleSave() { if (!editingRoutine) return; saveRoutine(editingRoutine); onUpdate(); setEditingRoutine(null); setView("list") }
  function handleDelete(id: string) { deleteRoutine(id); onUpdate() }
  function handleActivate(id: string) { setActiveRoutine(activeRoutineId === id ? null : id); onUpdate() }
  function handleAddDay() { if (!editingRoutine || editingRoutine.days.length >= 7) return; const newDay: RoutineDay = { dayNumber: editingRoutine.days.length + 1, label: `Día ${editingRoutine.days.length + 1}`, exercises: [] }; setEditingRoutine({ ...editingRoutine, days: [...editingRoutine.days, newDay] }); setExpandedDay(editingRoutine.days.length) }
  function handleRemoveDay(idx: number) { if (!editingRoutine || editingRoutine.days.length <= 1) return; const newDays = editingRoutine.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1 })); setEditingRoutine({ ...editingRoutine, days: newDays }) }
  function handleAddExercise(dayIndex: number, exerciseId: string) { if (!editingRoutine) return; const day = editingRoutine.days[dayIndex]; const newEx: RoutineExercise = { exerciseId, sets: 3, reps: "8-12", rpe: 7 }; const newDays = [...editingRoutine.days]; newDays[dayIndex] = { ...day, exercises: [...day.exercises, newEx] }; setEditingRoutine({ ...editingRoutine, days: newDays }) }
  function handleRemoveExercise(dIdx: number, eIdx: number) { if (!editingRoutine) return; const newDays = [...editingRoutine.days]; newDays[dIdx] = { ...newDays[dIdx], exercises: newDays[dIdx].exercises.filter((_, i) => i !== eIdx) }; setEditingRoutine({ ...editingRoutine, days: newDays }) }
  function handleMoveExercise(dIdx: number, eIdx: number, dir: "up" | "down") { if (!editingRoutine) return; const exs = [...editingRoutine.days[dIdx].exercises]; const target = dir === "up" ? eIdx - 1 : eIdx + 1; if (target < 0 || target >= exs.length) return; [exs[eIdx], exs[target]] = [exs[target], exs[eIdx]]; const newDays = [...editingRoutine.days]; newDays[dIdx] = { ...newDays[dIdx], exercises: exs }; setEditingRoutine({ ...editingRoutine, days: newDays }) }
  function handleExerciseFieldChange(dIdx: number, eIdx: number, field: keyof RoutineExercise, val: string | number) { if (!editingRoutine) return; const newDays = [...editingRoutine.days]; const exs = [...newDays[dIdx].exercises]; exs[eIdx] = { ...exs[eIdx], [field]: val }; newDays[dIdx] = { ...newDays[dIdx], exercises: exs }; setEditingRoutine({ ...editingRoutine, days: newDays }) }
  function handleImportRoutine(routine: WeeklyRoutine) {
    saveRoutine(routine)
    onUpdate()
    setActiveRoutine(routine.id)
    onUpdate()
  }
  function handleCreateCustomAndAdd(dayIndex: number) { if (!newExerciseName.trim()) return; const newEx = { id: `custom-${Date.now()}`, name: newExerciseName, muscleGroup: newExerciseMuscle, isCustom: true, videoPlaceholder: `https://www.youtube.com/results?search_query=${encodeURIComponent(newExerciseName + " tecnica")}` }; addCustomExercise(newEx); onUpdate(); handleAddExercise(dayIndex, newEx.id); setIsCreating(false); setNewExerciseName(""); setSearch("") }

  // --- RENDER ---
  if (view === "templates") {
    return ( /* ... (Código de plantillas igual) ... */ 
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Plantillas</h1><Button variant="ghost" size="sm" onClick={() => setView("list")}>Volver</Button></div>{routineTemplates.map((t) => (<Card key={t.id} className="border-border bg-card"><CardContent className="p-4 flex justify-between items-center"><div><h3 className="font-semibold">{t.name}</h3><p className="text-xs text-muted-foreground">{t.days.length} días</p></div><Button size="sm" onClick={() => handleCloneTemplate(t)}><Copy className="mr-1 h-3 w-3" /> Usar</Button></CardContent></Card>))}</div>
    )
  }

  if (view === "edit" && editingRoutine) {
    return ( /* ... (Código de editar igual, solo comprimido aquí para ahorrar espacio) ... */ 
       <div className="flex flex-col gap-4 px-4 pb-24 pt-6"><div className="flex items-center justify-between"><h1 className="text-xl font-bold">Editar Rutina</h1><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingRoutine(null); setView("list") }}>Cancelar</Button><Button size="sm" onClick={handleSave}>Guardar</Button></div></div><div><Label>Nombre</Label><Input className="mt-1 bg-secondary" value={editingRoutine.name} onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })} /></div><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{editingRoutine.days.length} días</span><Button variant="outline" size="sm" onClick={handleAddDay} disabled={editingRoutine.days.length >= 7}><Plus className="mr-1 h-3 w-3" /> Día</Button></div>{editingRoutine.days.map((day, dIdx) => (<Card key={day.dayNumber} className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedDay(expandedDay === dIdx ? null : dIdx)}>{expandedDay === dIdx ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}</Button><span className="font-semibold">Día {day.dayNumber}</span></div><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveDay(dIdx)}><Trash2 className="h-4 w-4" /></Button></div>{expandedDay === dIdx && (<div className="space-y-3"><Input className="bg-secondary text-sm" value={day.label} onChange={(e) => {const nd=[...editingRoutine.days]; nd[dIdx].label=e.target.value; setEditingRoutine({...editingRoutine, days:nd})}} placeholder="Nombre del día" />{day.exercises.map((ex, eIdx) => (<div key={eIdx} className="bg-secondary/40 p-2 rounded-md border border-border/50"><div className="flex justify-between items-start gap-2 mb-2"><Input className="h-7 text-sm font-medium bg-background flex-1" value={getExerciseName(ex.exerciseId, (ex as any).customName)} onChange={(e) => handleExerciseFieldChange(dIdx, eIdx, "customName" as keyof RoutineExercise, e.target.value)} placeholder="Nombre del ejercicio" /><div className="flex items-center gap-0.5 shrink-0"><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={eIdx === 0} onClick={() => handleMoveExercise(dIdx, eIdx, "up")}><ChevronUp className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={eIdx === day.exercises.length - 1} onClick={() => handleMoveExercise(dIdx, eIdx, "down")}><ChevronDown className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleRemoveExercise(dIdx, eIdx)}><Trash2 className="h-3 w-3" /></Button></div></div><div className="flex gap-2"><div className="flex-1"><span className="text-[10px] text-muted-foreground">Series</span><Input className="h-7 text-center bg-background" type="number" value={ex.sets} onChange={(e) => handleExerciseFieldChange(dIdx, eIdx, "sets", Number(e.target.value))} /></div><div className="flex-1"><span className="text-[10px] text-muted-foreground">Reps</span><Input className="h-7 text-center bg-background" value={ex.reps} onChange={(e) => handleExerciseFieldChange(dIdx, eIdx, "reps", e.target.value)} /></div><div className="flex-1"><span className="text-[10px] text-muted-foreground">Peso (kg)</span><Input className="h-7 text-center bg-background" type="number" min={0} placeholder="—" value={ex.weight ?? ""} onChange={(e) => handleExerciseFieldChange(dIdx, eIdx, "weight", e.target.value ? Number(e.target.value) : 0)} /></div></div></div>))}<Dialog onOpenChange={(o) => !o && setSearch("")}><DialogTrigger asChild><Button variant="outline" size="sm" className="w-full border-dashed mt-2"><Plus className="mr-1 h-3 w-3" /> Agregar Ejercicio</Button></DialogTrigger><DialogContent className="max-h-[85vh] flex flex-col"><DialogHeader><DialogTitle>{isCreating?"Crear":"Seleccionar"}</DialogTitle></DialogHeader>{!isCreating && (<div className="relative mb-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>)}<div className="flex-1 overflow-y-auto pr-2">{isCreating ? (<div className="space-y-3"><div><Label>Nombre</Label><Input value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} /></div><div><Label>Músculo</Label><select className="w-full h-10 rounded-md border bg-background px-3" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)}>{["Piernas","Espalda","Pecho","Hombros","Brazos","Abdomen","Cardio","Otro"].map(m=><option key={m} value={m}>{m}</option>)}</select></div><div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>Volver</Button><Button className="flex-1" onClick={() => handleCreateCustomAndAdd(dIdx)} disabled={!newExerciseName}>Crear</Button></div></div>) : (<div className="space-y-4">{Object.entries(groupedExercises).map(([m, exs]) => (<div key={m}><h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">{m}</h4>{exs.map(ex => (<DialogClose key={ex.id} asChild><button className="w-full text-left p-2 rounded hover:bg-secondary text-sm flex justify-between" onClick={() => handleAddExercise(dIdx, ex.id)}>{ex.name} <Plus className="h-4 w-4 text-muted-foreground"/></button></DialogClose>))}</div>))}<Button variant="ghost" className="w-full mt-2" onClick={() => setIsCreating(true)}>+ Crear personalizado</Button></div>)}</div></DialogContent></Dialog></div>)}</CardContent></Card>))}</div>
    )
  }

  // --- LISTA PRINCIPAL (AQUI ESTA EL CAMBIO IMPORTANTE) ---
  const userRoutines = data.routines.filter((r) => !r.isTemplate)
  const activeRoutine = userRoutines.find((r) => r.id === activeRoutineId)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between pr-2">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setView("templates")}><BookOpen className="h-3.5 w-3.5 sm:mr-1"/><span className="hidden sm:inline">Plantillas</span></Button>
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setImportModalOpen(true)}><FileSpreadsheet className="h-3.5 w-3.5 sm:mr-1"/><span className="hidden sm:inline">Importar</span></Button>
          <Button size="sm" className="h-8 px-2.5 text-xs" onClick={handleCreateNew}><Plus className="h-3.5 w-3.5 mr-1"/> Nueva</Button>
        </div>
      </div>

      {/* Botón destacado: Crear rutina con IA. Gradiente brand para llamar la atención
          sin opacar el resto. Sutilmente animado con un Sparkles que pulsea. */}
      <button
        onClick={() => setAiWizardOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
        style={{ background: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #A78BFA 100%)" }}
      >
        {/* Brillo decorativo sutil */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 relative">
          <Wand2 className="h-6 w-6 text-white" />
          <Sparkles className="h-3 w-3 text-white absolute top-1 right-1 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2">
            <p className="text-base font-extrabold text-white">Crear con IA</p>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded">Nuevo</span>
          </div>
          <p className="text-xs text-white/80 leading-tight mt-0.5">Rutina personalizada según tu objetivo, nivel y tiempo</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/80 shrink-0 relative" />
      </button>

      {/* Card de Running — acceso directo, independiente de rutinas */}
      <button
        onClick={onShowRunning}
        className="w-full flex items-center justify-between bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors rounded-xl px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <PersonStanding className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-primary">Running</p>
            <p className="text-xs text-muted-foreground">Registrá tus salidas con GPS</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>

      {activeRoutine && (
        <Card className="border-primary/30 bg-card shadow-lg shadow-primary/5 animate-in fade-in">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-start">
               <div>
                 <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 gap-1"><Dumbbell className="h-3 w-3"/> Activa</Badge>
                 <h2 className="text-lg font-bold">{activeRoutine.name}</h2>
               </div>
               <Button variant="ghost" size="sm" onClick={() => { setEditingRoutine(activeRoutine); setView("edit"); }}>
                 <Pencil className="h-4 w-4 mr-1" /> Editar
               </Button>
            </div>

            <div className="divide-y divide-border">
              {activeRoutine.days.map((day) => (
                <div key={day.dayNumber} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                     <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <span className="bg-primary/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{day.dayNumber}</span>
                        {day.label}
                     </h3>
                     {/* ✨ BOTÓN GRANDE PARA ARRANCAR EL DÍA COMPLETO */}
                     <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={() => onStartSession(day)}>
                        <Play className="h-3 w-3 mr-1 fill-current" /> Entrenar
                     </Button>
                  </div>

                  <div className="space-y-2 pl-7 border-l-2 border-border ml-2.5">
                    {day.exercises.map((ex, i) => (
                       <div key={i} className="flex justify-between items-center text-sm py-0.5">
                          <span className="font-medium text-foreground/80">{getExerciseName(ex.exerciseId, (ex as any).customName)}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {getLastWeight(ex.exerciseId, (ex as any).customName) && (
                              <span className="text-[11px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                {getLastWeight(ex.exerciseId, (ex as any).customName)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground opacity-70">{ex.sets} × {ex.reps}</span>
                          </div>
                       </div>
                    ))}
                    {day.exercises.length === 0 && <span className="text-xs text-muted-foreground italic">Día de descanso</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 mt-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Otras Rutinas</h3>
        {userRoutines.filter(r => r.id !== activeRoutineId).map((routine) => (
            <Card key={routine.id} className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div><h4 className="font-medium">{routine.name}</h4><p className="text-xs text-muted-foreground">{routine.days.length} días</p></div>
                <div className="flex gap-2"><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleActivate(routine.id)}>Activar</Button><ExportRoutineButton routine={routine} /><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRoutine(routine); setView("edit"); }}><Settings2 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirmId(routine.id)}><Trash2 className="h-4 w-4"/></Button></div>
              </CardContent>
            </Card>
        ))}
      </div>

      <ImportRoutineModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportRoutine}
      />

      {/* ── Wizard de creación con IA ── */}
      <RoutineAiWizard
        open={aiWizardOpen}
        onClose={() => setAiWizardOpen(false)}
        onCreated={(routine) => { onUpdate(); setActiveRoutine(routine.id); onUpdate() }}
        profile={data.profile}
        workoutLogs={data.workoutLogs}
      />

      {/* ── Dialog de confirmación de eliminación ── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Eliminar rutina
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que querés eliminar{" "}
            <strong className="text-foreground">
              {data.routines.find((r) => r.id === deleteConfirmId)?.name ?? "esta rutina"}
            </strong>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDelete(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}