"use client"

// Componente para compartir una salida de running.
// - Muestra preview de la imagen que se va a compartir (9:16, Stories-friendly)
// - Toggles para editar qué se muestra (tiempo, ritmo, kcal, mapa, fecha)
// - Botón "Compartir" usa Web Share API nativa (Instagram/WhatsApp/Stories/etc)
// - Fallback: descargar como PNG
// - Branding: logo Rendi + watermark rendi.com.ar siempre presentes
//
// Para convertir el DOM a imagen usamos html2canvas (cargado dinámicamente).

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Share2, Download, X, Loader2, MapPin, Clock, Zap, Flame, CalendarDays, Trophy } from "lucide-react"
import type { RunningLog, GpsPoint } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  open: boolean
  onClose: () => void
  log: RunningLog
}

// ── Formato helpers ───────────────────────────────────────────────
function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function fmtPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm)) return "--:--"
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// Genera el SVG path del recorrido GPS, normalizado al viewBox.
function buildSvgPathFromGps(points: GpsPoint[], width: number, height: number, padding = 12): string {
  if (points.length < 2) return ""
  const lats = points.map(p => p.lat)
  const lngs = points.map(p => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.0001
  const lngRange = maxLng - minLng || 0.0001
  // Mantener aspect ratio: usar el rango mayor para que no se estire
  const range = Math.max(latRange, lngRange)
  // Centrar el bounding box dentro del viewBox
  const offsetX = (range - lngRange) / 2
  const offsetY = (range - latRange) / 2
  const w = width - padding * 2
  const h = height - padding * 2
  return points.map((p, i) => {
    const x = padding + ((p.lng - minLng + offsetX) / range) * w
    const y = padding + h - ((p.lat - minLat + offsetY) / range) * h
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(" ")
}

export function RunningShareCard({ open, onClose, log }: Props) {
  // ── Toggles editables ──
  const [showTime, setShowTime] = useState(true)
  const [showPace, setShowPace] = useState(true)
  const [showCalories, setShowCalories] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const [showDate, setShowDate] = useState(true)

  // ── Sharing state ──
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Reset cuando se abre
  useEffect(() => {
    if (open) {
      setSharing(false)
      setError(null)
    }
  }, [open])

  const hasGps = !!log.gpsPath && log.gpsPath.length > 1
  const svgPath = hasGps ? buildSvgPathFromGps(log.gpsPath!, 280, 180, 16) : ""

  // ── Generar imagen y compartir ──
  async function handleShare(mode: "share" | "download") {
    if (!cardRef.current) return
    setSharing(true)
    setError(null)

    try {
      // Cargar html2canvas dinámicamente (no hace falta en SSR ni hasta que se use)
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 3x para mejor calidad al compartir
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95))
      if (!blob) throw new Error("No se pudo generar la imagen")

      const filename = `rendi-${log.date}-${log.distanceKm.toFixed(1)}km.png`

      if (mode === "share" && typeof navigator !== "undefined" && navigator.share) {
        const file = new File([blob], filename, { type: "image/png" })
        // Algunos navegadores no soportan compartir archivos
        const canShareFiles = typeof navigator.canShare === "function"
          ? navigator.canShare({ files: [file] })
          : true
        if (canShareFiles) {
          await navigator.share({
            files: [file],
            title: "Mi salida en Rendi",
            text: `Corrí ${log.distanceKm.toFixed(2)} km en ${fmtTime(log.durationSec)} con Rendi 🏃‍♂️ rendi.com.ar`,
          })
          setSharing(false)
          return
        }
      }

      // Fallback: descargar el PNG
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSharing(false)
    } catch (err: unknown) {
      console.error("[share] error:", err)
      const msg = err instanceof Error ? err.message : "Error al generar la imagen"
      // Cancelación del usuario en Web Share API no es un error
      if (msg.includes("AbortError") || msg.includes("cancel")) {
        setSharing(false)
        return
      }
      setError("No pudimos generar la imagen. Probá descargarla en vez de compartir.")
      setSharing(false)
    }
  }

  const dateLabel = format(new Date(log.date + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es })

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-3 border-b border-border shrink-0">
          <div className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Compartir salida</h2>
              <p className="text-xs text-muted-foreground">Editá lo que querés mostrar</p>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* ── PREVIEW DE LA IMAGEN ─────────────────────────── */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className="relative overflow-hidden text-white shadow-2xl"
              style={{
                width: "320px",
                height: "568px", // 9:16 aspect ratio
                borderRadius: "24px",
                background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 30%, #7C3AED 60%, #A78BFA 100%)",
              }}
            >
              {/* Blobs decorativos — sin blur para compatibilidad con html2canvas */}
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-50px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-80px",
                  left: "-40px",
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                }}
              />

              {/* HEADER: logo + nombre Rendi */}
              <div style={{ position: "relative", padding: "24px 24px 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  🏃
                </div>
                <div>
                  <p style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>Rendi</p>
                  <p style={{ fontSize: "10px", fontWeight: 500, opacity: 0.8, marginTop: "2px" }}>Entrenamiento inteligente</p>
                </div>
              </div>

              {/* DISTANCIA GIGANTE */}
              <div style={{ position: "relative", padding: "40px 24px 16px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", opacity: 0.75, marginBottom: "6px" }}>
                  DISTANCIA RECORRIDA
                </p>
                <p style={{
                  fontSize: "84px",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}>
                  {log.distanceKm.toFixed(2)}
                </p>
                <p style={{ fontSize: "20px", fontWeight: 700, opacity: 0.85, marginTop: "4px" }}>kilómetros</p>
              </div>

              {/* STATS SECUNDARIOS */}
              {(showTime || showPace || showCalories) && (
                <div style={{
                  position: "relative",
                  margin: "0 24px",
                  padding: "12px 8px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  gap: "8px",
                }}>
                  {showTime && (
                    <StatPillForShare
                      label="Tiempo"
                      value={fmtTime(log.durationSec)}
                    />
                  )}
                  {showPace && (
                    <StatPillForShare
                      label="Ritmo"
                      value={`${fmtPace(log.paceSeckm)}/km`}
                    />
                  )}
                  {showCalories && log.calories && (
                    <StatPillForShare
                      label="Kcal"
                      value={String(log.calories)}
                    />
                  )}
                </div>
              )}

              {/* MAPA SVG */}
              {showMap && hasGps && (
                <div style={{
                  position: "relative",
                  margin: "18px 24px 0 24px",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", opacity: 0.7, marginBottom: "8px", textAlign: "center" }}>
                    RECORRIDO
                  </p>
                  <svg
                    width="100%"
                    height="180"
                    viewBox="0 0 280 180"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Sombra del trazado */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform="translate(0 2)"
                    />
                    {/* Trazado principal */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Punto de inicio */}
                    {log.gpsPath && log.gpsPath.length > 0 && (() => {
                      const first = log.gpsPath[0]
                      const lats = log.gpsPath.map(p => p.lat)
                      const lngs = log.gpsPath.map(p => p.lng)
                      const minLat = Math.min(...lats), maxLat = Math.max(...lats)
                      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
                      const range = Math.max(maxLat - minLat, maxLng - minLng) || 0.0001
                      const offsetX = (range - (maxLng - minLng)) / 2
                      const offsetY = (range - (maxLat - minLat)) / 2
                      const x = 16 + ((first.lng - minLng + offsetX) / range) * (280 - 32)
                      const y = 16 + (280 - 32 - ((first.lat - minLat + offsetY) / range) * (180 - 32))
                      return <circle cx={x} cy={y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                    })()}
                    {/* Punto final */}
                    {log.gpsPath && log.gpsPath.length > 1 && (() => {
                      const last = log.gpsPath[log.gpsPath.length - 1]
                      const lats = log.gpsPath.map(p => p.lat)
                      const lngs = log.gpsPath.map(p => p.lng)
                      const minLat = Math.min(...lats), maxLat = Math.max(...lats)
                      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
                      const range = Math.max(maxLat - minLat, maxLng - minLng) || 0.0001
                      const offsetX = (range - (maxLng - minLng)) / 2
                      const offsetY = (range - (maxLat - minLat)) / 2
                      const x = 16 + ((last.lng - minLng + offsetX) / range) * (280 - 32)
                      const y = 16 + (280 - 32 - ((last.lat - minLat + offsetY) / range) * (180 - 32))
                      return <circle cx={x} cy={y} r="5" fill="#f97316" stroke="white" strokeWidth="2" />
                    })()}
                  </svg>
                </div>
              )}

              {/* FECHA */}
              {showDate && (
                <div style={{ position: "absolute", left: "24px", bottom: "60px" }}>
                  <p style={{ fontSize: "11px", opacity: 0.8, fontWeight: 600 }}>
                    {dateLabel}
                  </p>
                </div>
              )}

              {/* FOOTER con URL */}
              <div style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                padding: "16px 24px",
                background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <p style={{ fontSize: "11px", fontWeight: 700, opacity: 0.9 }}>
                  rendi.com.ar
                </p>
                <p style={{ fontSize: "10px", fontWeight: 600, opacity: 0.7 }}>
                  Hecho con Rendi 🚀
                </p>
              </div>
            </div>
          </div>

          {/* ── CONTROLES (toggles) ─────────────────────────── */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Qué mostrar</p>
            <div className="grid grid-cols-2 gap-2">
              <ToggleRow icon={Clock}        label="Tiempo"   checked={showTime}     onChange={setShowTime} />
              <ToggleRow icon={Zap}          label="Ritmo"    checked={showPace}     onChange={setShowPace} />
              <ToggleRow icon={Flame}        label="Calorías" checked={showCalories} onChange={setShowCalories} />
              <ToggleRow icon={MapPin}       label="Mapa"     checked={showMap}      onChange={setShowMap} disabled={!hasGps} />
              <ToggleRow icon={CalendarDays} label="Fecha"    checked={showDate}     onChange={setShowDate} />
              <ToggleRow icon={Trophy}       label="Distancia" checked disabled />
            </div>
            {!hasGps && (
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Esta salida no tiene recorrido GPS guardado.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* ── ACCIONES ────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={() => handleShare("download")}
            disabled={sharing}
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Download className="h-4 w-4 mr-2" /> Descargar</>
            )}
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl bg-brand-gradient text-white font-bold shadow-lg shadow-primary/30"
            onClick={() => handleShare("share")}
            disabled={sharing}
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Share2 className="h-4 w-4 mr-2" /> Compartir</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────
function StatPillForShare({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "4px 2px" }}>
      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", opacity: 0.7, marginBottom: "4px", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
    </div>
  )
}

function ToggleRow({
  icon: Icon, label, checked, onChange, disabled = false,
}: {
  icon: React.ElementType
  label: string
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-secondary/30"
          : checked
            ? "bg-primary/15 border border-primary/40"
            : "bg-secondary border border-transparent hover:bg-secondary/70"
      }`}
    >
      <Icon className={`h-4 w-4 ${checked ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-sm font-semibold ${checked ? "text-primary" : "text-foreground"}`}>{label}</span>
      <div className={`ml-auto w-8 h-4 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <div
          className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
    </button>
  )
}
