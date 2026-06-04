"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, Upload, Download, Sparkles, CheckCircle2, AlertCircle, Loader2, X, ChevronDown, ChevronUp } from "lucide-react"
import type { WeeklyRoutine } from "@/lib/types"
import { defaultExercises } from "@/lib/exercises"

interface ImportRoutineModalProps {
  open: boolean
  onClose: () => void
  onImport: (routine: WeeklyRoutine) => void
}

type Step = "upload" | "preview" | "success"

const EXERCISE_NAME_MAP: Record<string, string> = Object.fromEntries(
  defaultExercises.map((e) => [e.id, e.name])
)

function getExerciseName(exerciseId: string, customName?: string): string {
  if (customName) return customName
  return EXERCISE_NAME_MAP[exerciseId] ?? exerciseId
}

// Template Excel para descargar (hardcodeado como CSV luego convertido)
function downloadTemplate() {
  const rows = [
    ["Día", "Nombre del Día", "Ejercicio", "Series", "Repeticiones", "RPE (opcional)"],
    ["1", "Día 1 - Pecho y Tríceps", "Press de Banca", "4", "8-10", "8"],
    ["1", "Día 1 - Pecho y Tríceps", "Press Inclinado", "3", "10-12", "7"],
    ["1", "Día 1 - Pecho y Tríceps", "Fondos en Paralelas", "3", "Al fallo", ""],
    ["2", "Día 2 - Espalda y Bíceps", "Dominadas", "4", "6-8", "8"],
    ["2", "Día 2 - Espalda y Bíceps", "Remo con Barra", "4", "8-10", ""],
    ["2", "Día 2 - Espalda y Bíceps", "Curl de Bíceps", "3", "10-12", ""],
    ["3", "Día 3 - Descanso", "", "", "", ""],
    ["4", "Día 4 - Piernas", "Sentadilla con Barra", "4", "6-8", "9"],
    ["4", "Día 4 - Piernas", "Prensa de Piernas", "3", "12-15", ""],
    ["4", "Día 4 - Piernas", "Curl Femoral", "3", "10-12", ""],
  ]

  // Construir CSV
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "plantilla-rutina-rendi.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportRoutineModal({ open, onClose, onImport }: ImportRoutineModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewRoutine, setPreviewRoutine] = useState<WeeklyRoutine | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [editingName, setEditingName] = useState(false)
  const [routineName, setRoutineName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep("upload")
    setFileName("")
    setError("")
    setPreviewRoutine(null)
    setExpandedDay(0)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Formato no válido. Subí un archivo .xlsx, .xls o .csv")
      return
    }

    setFileName(file.name)
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/routines?action=import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al procesar el archivo")
        setLoading(false)
        return
      }

      setPreviewRoutine(data.routine)
      setRoutineName(data.routine.name)
      setStep("preview")
    } catch (e) {
      setError("Error de red. Revisá tu conexión e intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleConfirm = () => {
    if (!previewRoutine) return
    const final: WeeklyRoutine = { ...previewRoutine, name: routineName || previewRoutine.name }
    onImport(final)
    setStep("success")
    setTimeout(() => {
      handleClose()
    }, 1800)
  }

  const handleExportCurrent = async (routine: WeeklyRoutine) => {
    try {
      const res = await fetch("/api/routines?action=export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routine, exerciseNames: EXERCISE_NAME_MAP }),
      })
      if (!res.ok) throw new Error("Error exportando")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${routine.name}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("No se pudo exportar la rutina")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {step === "upload" && "Importar rutina desde Excel"}
            {step === "preview" && "Revisá tu rutina"}
            {step === "success" && "¡Rutina importada!"}
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: UPLOAD ── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Zona drag & drop */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">La IA está interpretando tu planilla…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Arrastrá tu planilla acá</p>
                    <p className="text-sm text-muted-foreground mt-1">o hacé clic para buscarla</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">.xlsx · .xls · .csv</Badge>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Cómo funciona */}
            <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Cómo funciona
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Subí <span className="text-foreground">cualquier formato</span> de planilla — la IA la interpreta</li>
                <li>• Podés revisar y corregir antes de guardar</li>
                <li>• Ejercicios no reconocidos se agregan como personalizados</li>
              </ul>
            </div>

            {/* Descargar template */}
            <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Descargar plantilla de ejemplo
            </Button>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === "preview" && previewRoutine && (() => {
          const hasCustom = previewRoutine.days.some((d) =>
            d.exercises.some((e) => (e as any).customName)
          )

          function updateExercise(dIdx: number, eIdx: number, patch: Partial<any>) {
            setPreviewRoutine((prev) => {
              if (!prev) return prev
              const days = prev.days.map((d, di) => {
                if (di !== dIdx) return d
                return {
                  ...d,
                  exercises: d.exercises.map((ex, ei) =>
                    ei === eIdx ? { ...ex, ...patch } : ex
                  ),
                }
              })
              return { ...prev, days }
            })
          }

          return (
            <div className="space-y-4">
              {/* Aviso IA */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>La IA interpretó <strong className="text-foreground">{fileName}</strong>. Revisá cada ejercicio antes de guardar.</span>
              </div>

              {/* Aviso ejercicios no reconocidos */}
              {hasCustom && (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Algunos ejercicios no están en la base de datos y aparecen como{" "}
                    <strong>personalizados</strong>. Podés editar su nombre, series, reps y peso
                    directamente en cada fila.
                  </span>
                </div>
              )}

              {/* Nombre editable */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nombre de la rutina</label>
                <Input
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="bg-secondary font-medium"
                />
              </div>

              {/* Días */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {previewRoutine.days.length} días detectados
                </label>
                {previewRoutine.days.map((day, dIdx) => (
                  <div key={dIdx} className="border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/40 transition-colors"
                      onClick={() => setExpandedDay(expandedDay === dIdx ? null : dIdx)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {day.dayNumber}
                        </span>
                        <span className="text-sm font-medium">{day.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {day.exercises.length === 0 ? "Descanso" : `${day.exercises.length} ejercicios`}
                        </span>
                        {expandedDay === dIdx
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expandedDay === dIdx && day.exercises.length > 0 && (
                      <div className="border-t border-border divide-y divide-border/40">
                        {day.exercises.map((ex, eIdx) => (
                          <div key={eIdx} className="px-3 py-3 space-y-2">
                            {/* Fila nombre */}
                            <div className="flex items-center gap-2">
                              {(ex as any).customName && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 text-amber-600 border-amber-500/40">
                                  nuevo
                                </Badge>
                              )}
                              <Input
                                className="h-7 text-sm bg-secondary flex-1 min-w-0"
                                value={getExerciseName(ex.exerciseId, (ex as any).customName)}
                                onChange={(e) =>
                                  updateExercise(dIdx, eIdx, { customName: e.target.value })
                                }
                              />
                            </div>
                            {/* Fila sets / reps / peso */}
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Series</p>
                                <Input
                                  className="h-7 text-center text-sm bg-secondary"
                                  type="number"
                                  min={1}
                                  value={ex.sets}
                                  onChange={(e) =>
                                    updateExercise(dIdx, eIdx, { sets: Number(e.target.value) || 1 })
                                  }
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Reps</p>
                                <Input
                                  className="h-7 text-center text-sm bg-secondary"
                                  value={ex.reps}
                                  onChange={(e) =>
                                    updateExercise(dIdx, eIdx, { reps: e.target.value })
                                  }
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Peso (kg)</p>
                                <Input
                                  className="h-7 text-center text-sm bg-secondary"
                                  type="number"
                                  min={0}
                                  placeholder="—"
                                  value={ex.weight ?? ""}
                                  onChange={(e) =>
                                    updateExercise(dIdx, eIdx, {
                                      weight: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Volver
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleConfirm}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Guardar rutina
                </Button>
              </div>
            </div>
          )
        })()}

        {/* ── STEP 3: SUCCESS ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">¡Rutina importada!</p>
              <p className="text-sm text-muted-foreground mt-1">Ya podés usarla desde la sección Rutinas</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Componente auxiliar para exportar una rutina existente
interface ExportButtonProps {
  routine: WeeklyRoutine
}

export function ExportRoutineButton({ routine }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/routines?action=export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routine, exerciseNames: EXERCISE_NAME_MAP }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${routine.name}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("No se pudo exportar la rutina")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} disabled={loading} title="Exportar a Excel">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </Button>
  )
}
