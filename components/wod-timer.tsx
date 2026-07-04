"use client"

// Cronómetro interactivo para bloques WOD (AMRAP / EMOM / For Time).
// Se abre desde el hub de sesión de entrenamiento cuando el día tiene un `wod`.

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Flag, X, Plus, Minus, Flame } from "lucide-react"
import type { WodBlock } from "@/lib/types"
import { WOD_FORMAT_META, formatWodSummary, formatSecondsClock, totalWodSeconds } from "@/lib/wod"

interface WodTimerProps {
  open: boolean
  onClose: () => void
  wod: WodBlock
  label: string
  /** Se llama al guardar el resultado final (texto libre, ej: "5 rondas + 8 reps"). */
  onFinish?: (summary: string) => void
}

type Phase = "idle" | "running" | "paused" | "done"

export function WodTimer({ open, onClose, wod, label, onFinish }: WodTimerProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [remainingSec, setRemainingSec] = useState<number>(() => totalWodSeconds(wod))
  const [elapsedSec, setElapsedSec] = useState(0)
  const [round, setRound] = useState(1) // EMOM: intervalo actual
  const [intervalRemaining, setIntervalRemaining] = useState(wod.emomIntervalSec ?? 60)
  const [amrapRounds, setAmrapRounds] = useState(0)
  const [amrapReps, setAmrapReps] = useState(0)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset completo cada vez que se abre con un WOD nuevo
  useEffect(() => {
    if (!open) return
    setPhase("idle")
    setRemainingSec(totalWodSeconds(wod))
    setElapsedSec(0)
    setRound(1)
    setIntervalRemaining(wod.emomIntervalSec ?? 60)
    setAmrapRounds(0)
    setAmrapReps(0)
    setFlash(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wod])

  useEffect(() => {
    if (phase !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      if (wod.format === "amrap") {
        setRemainingSec((s) => {
          if (s <= 1) { setPhase("done"); return 0 }
          return s - 1
        })
      } else if (wod.format === "for_time") {
        setElapsedSec((s) => {
          const cap = wod.timeCapMin ? wod.timeCapMin * 60 : null
          if (cap && s + 1 >= cap) { setPhase("done"); return cap }
          return s + 1
        })
      } else if (wod.format === "emom") {
        setIntervalRemaining((s) => {
          if (s <= 1) {
            setRound((r) => {
              const next = r + 1
              if (next > (wod.emomRounds ?? 1)) {
                setPhase("done")
                return r
              }
              setFlash(true)
              setTimeout(() => setFlash(false), 500)
              try { navigator.vibrate?.(200) } catch {}
              return next
            })
            return wod.emomIntervalSec ?? 60
          }
          return s - 1
        })
      }
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, wod])

  function handleReset() {
    setPhase("idle")
    setRemainingSec(totalWodSeconds(wod))
    setElapsedSec(0)
    setRound(1)
    setIntervalRemaining(wod.emomIntervalSec ?? 60)
    setAmrapRounds(0)
    setAmrapReps(0)
  }

  function handleFinish() {
    let summary = ""
    if (wod.format === "amrap") summary = `${amrapRounds} rondas + ${amrapReps} reps`
    else if (wod.format === "for_time") summary = formatSecondsClock(elapsedSec)
    else summary = `Completó ${Math.min(round, wod.emomRounds ?? round)} de ${wod.emomRounds ?? round} intervalos`
    onFinish?.(summary)
    setPhase("done")
  }

  const meta = WOD_FORMAT_META[wod.format]

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
        <div
          className={`px-6 pt-6 pb-5 text-white transition-colors duration-300 ${flash ? "bg-amber-400" : ""}`}
          style={!flash ? { background: "linear-gradient(135deg, #B45309 0%, #D97706 50%, #F59E0B 100%)" } : undefined}
        >
          <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 flex items-center gap-1"><Flame className="h-3 w-3" /> {label}</p>
              <h2 className="text-xl font-extrabold">{meta.emoji} {formatWodSummary(wod)}</h2>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Display principal del tiempo */}
          <div className="flex flex-col items-center justify-center py-4">
            {wod.format === "amrap" && (
              <>
                <span className="text-6xl font-mono font-extrabold tabular-nums">{formatSecondsClock(remainingSec)}</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Tiempo restante</span>
              </>
            )}
            {wod.format === "for_time" && (
              <>
                <span className="text-6xl font-mono font-extrabold tabular-nums">{formatSecondsClock(elapsedSec)}</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  {wod.timeCapMin ? `Tiempo transcurrido · cap ${wod.timeCapMin} min` : "Tiempo transcurrido"}
                </span>
              </>
            )}
            {wod.format === "emom" && (
              <>
                <span className="text-6xl font-mono font-extrabold tabular-nums">{formatSecondsClock(intervalRemaining)}</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  Intervalo {Math.min(round, wod.emomRounds ?? round)} de {wod.emomRounds ?? "—"}
                </span>
              </>
            )}

            {phase === "done" && (
              <p className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-400">¡Tiempo! Registrá tu resultado abajo.</p>
            )}
          </div>

          {/* Controles del cronómetro */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              className="h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setPhase((p) => (p === "running" ? "paused" : "running"))}
              disabled={phase === "done"}
            >
              {phase === "running" ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full text-primary border-primary/40" onClick={handleFinish}>
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          {/* Contador de rondas/reps para AMRAP */}
          {wod.format === "amrap" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Rondas completas</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAmrapRounds((r) => Math.max(0, r - 1))} className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                  <span className="text-2xl font-extrabold w-10 text-center">{amrapRounds}</span>
                  <button onClick={() => setAmrapRounds((r) => r + 1)} className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">+ Reps extra</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAmrapReps((r) => Math.max(0, r - 1))} className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                  <span className="text-2xl font-extrabold w-10 text-center">{amrapReps}</span>
                  <button onClick={() => setAmrapReps((r) => r + 1)} className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de movimientos de referencia */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Movimientos</p>
            {wod.movements.filter(m => m.name.trim()).map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-card border border-border rounded-lg px-3 py-2 text-sm">
                <span className="font-medium">{m.name}</span>
                {m.reps && <span className="text-muted-foreground text-xs">{m.reps}</span>}
              </div>
            ))}
            {wod.notes && <p className="text-xs text-muted-foreground italic pt-1">{wod.notes}</p>}
          </div>
        </div>

        {/* Footer: guardar resultado */}
        <div className="px-6 py-4 border-t border-border">
          <Button className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white" onClick={handleFinish}>
            <Flag className="h-4 w-4 mr-2" /> Guardar resultado y finalizar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
