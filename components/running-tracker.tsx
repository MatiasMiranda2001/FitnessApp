"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft, Play, Square, Pause, Pencil, Trash2,
  MapPin, Clock, Zap, Flame, FileText, AlertTriangle,
  Watch, Check, X, TrendingUp, Plus,
} from "lucide-react"
import type { RunningLog, GpsPoint } from "@/lib/types"
import { addRunningLog, updateRunningLog, deleteRunningLog } from "@/lib/store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RunningMap, RunningMapLegend } from "@/components/running-map"

interface RunningTrackerProps {
  runningLogs: RunningLog[]
  onBack: () => void
  onUpdate: () => void
}

// ─── Helpers ──────────────────────────────────────────────────
function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function fmtPace(secPerKm: number) {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm > 3600) return "--:--"
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function haversineKm(a: GpsPoint, b: GpsPoint) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function todayStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
}

function estimateCalories(km: number, durationSec: number) {
  // ~60 kcal/km aprox para 70kg de peso promedio
  return Math.round(km * 60)
}

// ─── Subcomponente: formulario de edición manual ──────────────
function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { distanceKm: number; durationSec: number; notes: string; calories?: number }
  onSave: (d: typeof initial) => void
  onCancel: () => void
}) {
  const [km, setKm] = useState(String(initial.distanceKm || ""))
  const [min, setMin] = useState(String(Math.floor(initial.durationSec / 60) || ""))
  const [sec, setSec] = useState(String(initial.durationSec % 60 || ""))
  const [notes, setNotes] = useState(initial.notes || "")
  const [cal, setCal] = useState(String(initial.calories || ""))

  function handleSave() {
    const kmN = parseFloat(km) || 0
    const totalSec = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0)
    if (kmN <= 0 || totalSec <= 0) return
    onSave({ distanceKm: kmN, durationSec: totalSec, notes, calories: parseInt(cal) || undefined })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Distancia (km)</Label>
          <Input type="number" step="0.01" placeholder="5.00" value={km} onChange={e => setKm(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Calorías (opcional)</Label>
          <Input type="number" placeholder="300" value={cal} onChange={e => setCal(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Tiempo total</Label>
        <div className="flex gap-2 items-center mt-1">
          <Input type="number" placeholder="28" value={min} onChange={e => setMin(e.target.value)} className="text-center" />
          <span className="text-muted-foreground text-sm font-bold">min</span>
          <Input type="number" placeholder="30" value={sec} onChange={e => setSec(e.target.value)} className="text-center" />
          <span className="text-muted-foreground text-sm font-bold">seg</span>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
        <Input placeholder="Ej: salida mañanera, buen clima..." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
        <Button className="flex-1" onClick={handleSave}><Check className="h-4 w-4 mr-1" /> Guardar</Button>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────
type Screen = "list" | "active" | "summary" | "manual" | "edit"

export function RunningTracker({ runningLogs, onBack, onUpdate }: RunningTrackerProps) {
  const [screen, setScreen] = useState<Screen>("list")
  const [editingLog, setEditingLog] = useState<RunningLog | null>(null)

  // ── Estado del tracking GPS ──
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showSummaryEdit, setShowSummaryEdit] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [gpsPath, setGpsPath] = useState<GpsPoint[]>([])
  const [currentPace, setCurrentPace] = useState(0)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [gpsGranted, setGpsGranted] = useState<boolean | null>(null)
  const [lastFinished, setLastFinished] = useState<RunningLog | null>(null)
  const [showIosWarning, setShowIosWarning] = useState(false)
  // ID de la salida expandida del historial (muestra mapa si tiene GPS)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const watchRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const lastPointRef = useRef<GpsPoint | null>(null)
  const isPausedRef = useRef(false)

  // Detectar iOS
  const isIos = typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)

  // ── Wake Lock ──
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
      }
    } catch { /* silencioso */ }
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }

  // ── Cronómetro ──
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, isPaused])

  // ── GPS ──
  function startGps() {
    if (!navigator.geolocation) {
      setGpsError("Tu navegador no soporta GPS.")
      return
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (isPausedRef.current) return
        const point: GpsPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }
        if (lastPointRef.current) {
          const d = haversineKm(lastPointRef.current, point)
          // Ignorar saltos GPS > 50m en < 5s (ruido)
          if (d < 0.05) {
            setDistanceKm(prev => {
              const next = prev + d
              const timeDelta = (point.ts - lastPointRef.current!.ts) / 1000
              if (timeDelta > 0 && d > 0) setCurrentPace(timeDelta / d)
              return next
            })
          }
        }
        lastPointRef.current = point
        setGpsPath(p => [...p, point])
        setGpsGranted(true)
        setGpsError(null)
      },
      (err) => {
        if (err.code === 1) setGpsError("Permiso de GPS denegado. Activalo en la configuración del teléfono.")
        else setGpsError("No se pudo obtener la ubicación.")
        setGpsGranted(false)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }

  function stopGps() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }

  // ── Iniciar salida ──
  async function handleStart() {
    if (isIos) setShowIosWarning(true)
    setIsRunning(true)
    setIsPaused(false)
    isPausedRef.current = false
    setElapsedSec(0)
    setDistanceKm(0)
    setGpsPath([])
    lastPointRef.current = null
    setGpsError(null)
    setScreen("active")
    await requestWakeLock()
    startGps()
  }

  function handlePause() {
    setIsPaused(true)
    isPausedRef.current = true
  }

  function handleResume() {
    setIsPaused(false)
    isPausedRef.current = false
    lastPointRef.current = null // evitar salto GPS al reanudar
  }

  function handleStop() {
    stopGps()
    releaseWakeLock()
    setIsRunning(false)
    setIsPaused(false)
    // Mostrar pantalla resumen
    setScreen("summary")
  }

  // ── Guardar desde resumen GPS ──
  function handleSaveGps(overrides?: { distanceKm?: number; durationSec?: number; notes?: string; calories?: number }) {
    const finalKm = overrides?.distanceKm ?? distanceKm
    const finalSec = overrides?.durationSec ?? elapsedSec
    const pace = finalKm > 0 ? Math.round(finalSec / finalKm) : 0
    const log: RunningLog = {
      id: Date.now().toString(),
      date: todayStr(),
      distanceKm: Math.round(finalKm * 100) / 100,
      durationSec: finalSec,
      paceSeckm: pace,
      calories: overrides?.calories ?? estimateCalories(finalKm, finalSec),
      notes: overrides?.notes,
      gpsPath: gpsPath.length > 0 ? gpsPath : undefined,
    }
    addRunningLog(log)
    onUpdate()
    setLastFinished(log)
    setScreen("list")
  }

  // ── Guardar manual ──
  function handleSaveManual(data: { distanceKm: number; durationSec: number; notes: string; calories?: number }) {
    const pace = data.distanceKm > 0 ? Math.round(data.durationSec / data.distanceKm) : 0
    const log: RunningLog = {
      id: Date.now().toString(),
      date: todayStr(),
      distanceKm: data.distanceKm,
      durationSec: data.durationSec,
      paceSeckm: pace,
      calories: data.calories ?? estimateCalories(data.distanceKm, data.durationSec),
      notes: data.notes || undefined,
    }
    addRunningLog(log)
    onUpdate()
    setLastFinished(log)
    setScreen("list")
  }

  // ── Editar log existente ──
  function handleUpdateLog(log: RunningLog, data: { distanceKm: number; durationSec: number; notes: string; calories?: number }) {
    const updated: RunningLog = {
      ...log,
      distanceKm: data.distanceKm,
      durationSec: data.durationSec,
      paceSeckm: data.distanceKm > 0 ? Math.round(data.durationSec / data.distanceKm) : 0,
      calories: data.calories,
      notes: data.notes || undefined,
    }
    updateRunningLog(updated)
    onUpdate()
    setEditingLog(null)
    setScreen("list")
  }

  function handleDelete(id: string) {
    deleteRunningLog(id)
    onUpdate()
  }

  // ─────────────────────────────────────────────────────────────
  // PANTALLA: ACTIVO (GPS corriendo)
  // ─────────────────────────────────────────────────────────────
  if (screen === "active") {
    const pace = distanceKm > 0.01 && elapsedSec > 0 ? elapsedSec / distanceKm : 0

    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        {/* Header compacto */}
        <div className="flex items-center justify-between px-4 pt-6 pb-3 border-b border-border shrink-0">
          <h2 className="text-base font-bold">Salida en curso</h2>
          {isPaused
            ? <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50">En pausa</Badge>
            : <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50 animate-pulse">● Grabando</Badge>
          }
        </div>

        {/* MAPA — ocupa la mayor parte de la pantalla */}
        <div className="flex-1 px-3 pt-3 relative min-h-0">
          <RunningMap points={gpsPath} liveMode={!isPaused} height="100%" invalidateOnMount />

          {/* Overlay: avisos GPS sobre el mapa */}
          {gpsGranted === null && !gpsError && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-md">
              <p className="text-[11px] text-muted-foreground animate-pulse flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Buscando señal GPS...
              </p>
            </div>
          )}
          {gpsError && (
            <div className="absolute top-5 left-3 right-3 bg-destructive/95 text-white rounded-xl px-3 py-2 shadow-lg">
              <p className="text-xs">{gpsError}</p>
            </div>
          )}

          {/* Aviso iOS solo aparece la primera vez */}
          {showIosWarning && isIos && (
            <div className="absolute bottom-3 left-3 right-3 bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2.5 flex gap-2 shadow-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-800 leading-snug flex-1">
                En dispositivos iOS, si bloqueás la pantalla el GPS puede perder precisión.
              </p>
              <button
                onClick={() => setShowIosWarning(false)}
                className="text-yellow-600 hover:text-yellow-800 shrink-0"
                aria-label="Cerrar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Métricas en card compacta abajo */}
        <div className="shrink-0 px-3 pt-3">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-lg">
            <div className="flex items-end justify-between gap-3">
              {/* Distancia (principal) */}
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Distancia</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black tabular-nums tracking-tighter text-primary leading-none">
                    {distanceKm.toFixed(2)}
                  </p>
                  <span className="text-sm font-bold text-muted-foreground">km</span>
                </div>
              </div>

              {/* Tiempo */}
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tiempo</p>
                <p className="text-xl font-extrabold tabular-nums leading-none mt-1">{fmtTime(elapsedSec)}</p>
              </div>

              {/* Ritmo */}
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ritmo</p>
                <p className="text-xl font-extrabold tabular-nums leading-none mt-1">{fmtPace(pace)}</p>
                <p className="text-[9px] text-muted-foreground">min/km</p>
              </div>
            </div>
            <RunningMapLegend />
          </div>
        </div>

        {/* Controles */}
        <div className="px-3 pt-3 pb-6 flex gap-3 shrink-0">
          {isPaused ? (
            <>
              <Button variant="outline" size="lg" className="flex-1 h-14 rounded-2xl" onClick={handleResume}>
                <Play className="h-5 w-5 mr-2" /> Retomar
              </Button>
              <Button variant="destructive" size="lg" className="flex-1 h-14 rounded-2xl" onClick={handleStop}>
                <Square className="h-5 w-5 mr-2" /> Terminar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="flex-1 h-14 rounded-2xl" onClick={handlePause}>
                <Pause className="h-5 w-5 mr-2" /> Pausa
              </Button>
              <Button variant="destructive" size="lg" className="flex-1 h-14 rounded-2xl" onClick={handleStop}>
                <Square className="h-5 w-5 mr-2" /> Terminar
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // PANTALLA: RESUMEN POST-SALIDA GPS
  // ─────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const pace = distanceKm > 0 ? elapsedSec / distanceKm : 0

    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <h2 className="text-xl font-bold">¡Salida completada! 🎉</h2>

        {/* Mapa del recorrido si hubo GPS */}
        {gpsPath.length > 1 && (
          <div>
            <RunningMap points={gpsPath} liveMode={false} height="220px" />
            <RunningMapLegend />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-black text-primary">{distanceKm.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">kilómetros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-black">{fmtTime(elapsedSec)}</p>
              <p className="text-xs text-muted-foreground">tiempo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-black">{fmtPace(pace)}</p>
              <p className="text-xs text-muted-foreground">min/km</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-black">{estimateCalories(distanceKm, elapsedSec)}</p>
              <p className="text-xs text-muted-foreground">kcal est.</p>
            </CardContent>
          </Card>
        </div>

        {!showSummaryEdit ? (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground text-center">
              ¿El GPS midió mal? Podés corregir los datos antes de guardar.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setShowSummaryEdit(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Corregir datos
            </Button>
            <Button className="w-full font-semibold" size="lg" onClick={() => handleSaveGps()}>
              <Check className="h-4 w-4 mr-2" /> Guardar salida
            </Button>
          </div>
        ) : (
          <div className="mt-2 border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Corregir datos</h3>
            <EditForm
              initial={{ distanceKm, durationSec: elapsedSec, notes: "", calories: estimateCalories(distanceKm, elapsedSec) }}
              onSave={(data) => handleSaveGps(data)}
              onCancel={() => setShowSummaryEdit(false)}
            />
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // PANTALLA: REGISTRO MANUAL
  // ─────────────────────────────────────────────────────────────
  if (screen === "manual") {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setScreen("list")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-bold">Registrar salida manual</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <EditForm
            initial={{ distanceKm: 0, durationSec: 0, notes: "", calories: undefined }}
            onSave={handleSaveManual}
            onCancel={() => setScreen("list")}
          />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // PANTALLA: EDITAR LOG EXISTENTE
  // ─────────────────────────────────────────────────────────────
  if (screen === "edit" && editingLog) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setScreen("list")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-bold">Editar salida</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <EditForm
            initial={{
              distanceKm: editingLog.distanceKm,
              durationSec: editingLog.durationSec,
              notes: editingLog.notes || "",
              calories: editingLog.calories,
            }}
            onSave={(data) => handleUpdateLog(editingLog, data)}
            onCancel={() => setScreen("list")}
          />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // PANTALLA: LISTA / HOME
  // ─────────────────────────────────────────────────────────────
  const totalKmWeek = runningLogs
    .filter(l => {
      const d = new Date(l.date)
      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
      return d >= weekStart
    })
    .reduce((sum, l) => sum + l.distanceKm, 0)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={onBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Running</h2>
          <p className="text-xs text-muted-foreground">Registrá tus salidas</p>
        </div>
      </div>

      {/* Volumen semanal */}
      {runningLogs.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
              <p className="text-2xl font-black text-primary">{totalKmWeek.toFixed(1)} km</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Total salidas</p>
              <p className="text-xl font-bold">{runningLogs.length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-16 flex-col gap-1 font-semibold" onClick={handleStart}>
          <Play className="h-5 w-5" />
          <span className="text-xs">Iniciar con GPS</span>
        </Button>
        <Button size="lg" variant="outline" className="h-16 flex-col gap-1" onClick={() => setScreen("manual")}>
          <Plus className="h-5 w-5" />
          <span className="text-xs">Cargar manual</span>
        </Button>
      </div>

      {/* Aviso reloj inteligente */}
      <div className="bg-secondary/50 border border-border rounded-xl p-3 flex gap-2">
        <Watch className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">¿Tenés reloj inteligente?</strong> Garmin, Apple Watch, Polar y similares miden más precisamente. Mirá los datos en tu app del reloj y usá <em>Cargar manual</em> para registrarlos acá.
        </p>
      </div>

      {/* Historial */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Historial</h3>
        {runningLogs.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Todavía no registraste ninguna salida.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tu primera salida aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runningLogs.map((log, idx) => {
              const hasGps = !!log.gpsPath && log.gpsPath.length > 1
              const isExpanded = expandedLogId === log.id
              return (
                <Card key={log.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {format(new Date(log.date), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {idx === 0 && <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-[10px]">Última salida</Badge>}
                          {hasGps && <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/5 text-emerald-600">📍 Con GPS</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingLog(log); setScreen("edit") }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(log.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-xl font-black text-primary">{log.distanceKm.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">km</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{fmtTime(log.durationSec)}</p>
                        <p className="text-[10px] text-muted-foreground">tiempo</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{fmtPace(log.paceSeckm)}</p>
                        <p className="text-[10px] text-muted-foreground">min/km</p>
                      </div>
                      {log.calories && (
                        <div className="text-center">
                          <p className="text-xl font-bold">{log.calories}</p>
                          <p className="text-[10px] text-muted-foreground">kcal</p>
                        </div>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-2 flex gap-1 items-center">
                        <FileText className="h-3 w-3" /> {log.notes}
                      </p>
                    )}

                    {/* Botón para ver mapa si la salida tiene GPS guardado */}
                    {hasGps && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="w-full mt-3 text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1"
                      >
                        {isExpanded ? "Ocultar recorrido" : "Ver recorrido en mapa"}
                      </button>
                    )}

                    {/* Mapa expandido */}
                    {hasGps && isExpanded && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                        <RunningMap points={log.gpsPath!} liveMode={false} height="220px" invalidateOnMount />
                        <RunningMapLegend />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
