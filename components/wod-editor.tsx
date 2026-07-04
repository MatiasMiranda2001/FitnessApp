"use client"

// Editor de un bloque WOD (estilo CrossFit: AMRAP / EMOM / For Time) dentro de
// un día de rutina. Se usa en el builder manual (routine-builder.tsx).

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Flame, X } from "lucide-react"
import type { WodBlock, WodFormat, WodMovement } from "@/lib/types"
import { WOD_FORMATS, WOD_FORMAT_META, createDefaultWod, switchWodFormat, emptyMovement } from "@/lib/wod"

interface WodEditorProps {
  wod?: WodBlock
  onChange: (wod: WodBlock | undefined) => void
}

export function WodEditor({ wod, onChange }: WodEditorProps) {
  if (!wod) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed mt-2 text-amber-700 dark:text-amber-400 border-amber-400/50 hover:bg-amber-500/10"
        onClick={() => onChange(createDefaultWod("amrap"))}
      >
        <Flame className="mr-1 h-3.5 w-3.5" /> Agregar WOD (AMRAP / EMOM / For Time)
      </Button>
    )
  }

  function updateMovement(idx: number, patch: Partial<WodMovement>) {
    if (!wod) return
    const movements = wod.movements.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    onChange({ ...wod, movements })
  }
  function addMovement() {
    if (!wod) return
    onChange({ ...wod, movements: [...wod.movements, emptyMovement()] })
  }
  function removeMovement(idx: number) {
    if (!wod) return
    onChange({ ...wod, movements: wod.movements.filter((_, i) => i !== idx) })
  }

  return (
    <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-500/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <Flame className="h-3.5 w-3.5" /> Bloque WOD
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onChange(undefined)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Selector de formato */}
      <div className="flex gap-1.5">
        {WOD_FORMATS.map((f) => {
          const active = wod.format === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(switchWodFormat(wod, f))}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                active
                  ? "bg-amber-500 text-white"
                  : "bg-background text-muted-foreground border border-border"
              }`}
            >
              {WOD_FORMAT_META[f].emoji} {WOD_FORMAT_META[f].shortLabel}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">{WOD_FORMAT_META[wod.format].hint}</p>

      {/* Campos de tiempo según formato */}
      {(wod.format === "amrap" || wod.format === "for_time") && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <span className="text-[10px] text-muted-foreground">Tiempo cap (min)</span>
            <Input
              type="number" min={1} className="h-8 text-center bg-background"
              value={wod.timeCapMin ?? ""}
              onChange={(e) => onChange({ ...wod, timeCapMin: Number(e.target.value) || undefined })}
            />
          </div>
          {wod.format === "for_time" && (
            <div className="flex-1">
              <span className="text-[10px] text-muted-foreground">Rondas (opcional)</span>
              <Input
                type="number" min={1} placeholder="—" className="h-8 text-center bg-background"
                value={wod.rounds ?? ""}
                onChange={(e) => onChange({ ...wod, rounds: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}
        </div>
      )}

      {wod.format === "emom" && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <span className="text-[10px] text-muted-foreground">Segundos por intervalo</span>
            <Input
              type="number" min={10} step={5} className="h-8 text-center bg-background"
              value={wod.emomIntervalSec ?? 60}
              onChange={(e) => onChange({ ...wod, emomIntervalSec: Number(e.target.value) || 60 })}
            />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-muted-foreground">Cantidad de intervalos</span>
            <Input
              type="number" min={1} className="h-8 text-center bg-background"
              value={wod.emomRounds ?? ""}
              onChange={(e) => onChange({ ...wod, emomRounds: Number(e.target.value) || undefined })}
            />
          </div>
        </div>
      )}

      {/* Movimientos */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Movimientos</span>
        {wod.movements.map((m, idx) => (
          <div key={m.id} className="flex gap-1.5 items-center">
            <Input
              className="h-8 text-sm bg-background flex-[2]"
              placeholder="Ej: Burpees, Wall Balls 9kg, Run 400m"
              value={m.name}
              onChange={(e) => updateMovement(idx, { name: e.target.value })}
            />
            <Input
              className="h-8 text-sm bg-background flex-1"
              placeholder="Reps / dist."
              value={m.reps}
              onChange={(e) => updateMovement(idx, { reps: e.target.value })}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeMovement(idx)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full border-dashed h-8 text-xs" onClick={addMovement}>
          <Plus className="mr-1 h-3 w-3" /> Movimiento
        </Button>
      </div>

      {/* Notas */}
      <Textarea
        className="bg-background text-sm min-h-[60px]"
        placeholder="Notas (ej: 21-15-9 reps, scaling, etc.)"
        value={wod.notes ?? ""}
        onChange={(e) => onChange({ ...wod, notes: e.target.value })}
      />
    </div>
  )
}
