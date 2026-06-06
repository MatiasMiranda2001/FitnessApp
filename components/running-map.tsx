"use client"

// Mapa GPS para la sesión de Running. Usa Leaflet + OpenStreetMap (ambos gratis y
// open-source, sin API key ni límites). Soporta:
// - Modo "live" durante la salida: auto-centra en el último punto.
// - Modo "preview" para revisar una salida pasada: fitBounds a toda la ruta.
// - Coloración de la línea por velocidad (verde lento → violeta normal → rojo rápido).
//
// Leaflet usa `window` así que TODO se inicializa dentro de useEffect (solo cliente).

import { useEffect, useRef } from "react"
import type { GpsPoint } from "@/lib/types"

interface Props {
  points: GpsPoint[]
  /** Si está corriendo en vivo, el mapa pansigue al último punto. Sino fitBounds. */
  liveMode?: boolean
  /** Altura del contenedor del mapa. */
  height?: string
  /** Si el componente está dentro de un container con padding, el mapa puede no calcular
   *  su tamaño correctamente al montarse. Pasar este flag fuerza un invalidateSize. */
  invalidateOnMount?: boolean
}

// Calcula distancia entre dos puntos GPS (km) — Haversine
function haversineKm(a: GpsPoint, b: GpsPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Calcula velocidad entre dos puntos GPS (km/h). Filtra ruido.
function speedKmh(a: GpsPoint, b: GpsPoint): number {
  const distKm = haversineKm(a, b)
  const dtHours = (b.ts - a.ts) / 1000 / 3600
  if (dtHours <= 0) return 0
  const v = distKm / dtHours
  // Filtrar valores absurdos (>30km/h corriendo = salto GPS)
  return v > 30 ? 0 : v
}

// Convierte velocidad a color del trazado.
// Verde-amarillo = caminando/trotando, violeta = corriendo, naranja-rojo = sprint.
function colorForSpeed(kmh: number): string {
  if (kmh < 5)  return "#10b981" // verde — caminando
  if (kmh < 8)  return "#fbbf24" // amarillo — trotando suave
  if (kmh < 12) return "#7C3AED" // violeta — corriendo (brand)
  if (kmh < 16) return "#f97316" // naranja — fuerte
  return "#ef4444"               // rojo — sprint
}

export function RunningMap({ points, liveMode = false, height = "260px", invalidateOnMount = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Refs sin tipo Leaflet (porque se importa dinámicamente)
  const mapRef = useRef<unknown>(null)
  const segmentsRef = useRef<unknown[]>([])
  const markerRef = useRef<unknown>(null)
  const userPulseRef = useRef<unknown>(null)
  const LRef = useRef<unknown>(null)

  // ── Inicializar mapa una sola vez ──────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    if (mapRef.current) return

    let cancelled = false

    ;(async () => {
      // Import dinámico (Leaflet referencia `window`)
      const leaflet = await import("leaflet")
      await import("leaflet/dist/leaflet.css")

      if (cancelled || !containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (leaflet as any).default ?? leaflet
      LRef.current = L

      const initialCenter: [number, number] = points.length > 0
        ? [points[0].lat, points[0].lng]
        : [-34.6037, -58.3816] // Buenos Aires default

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        // Touch interactions habilitadas (default)
      })

      // Tiles de OpenStreetMap (gratis, sin API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        // OSM pide un useragent y respetar fair use. Para apps pequeñas-medianas está ok.
      }).addTo(map)

      mapRef.current = map

      // Si el container se montó con tamaño no calculado (típico en sheets),
      // hacemos un invalidateSize en el siguiente tick.
      if (invalidateOnMount) {
        setTimeout(() => { try { map.invalidateSize() } catch {} }, 100)
      }
    })()

    return () => {
      cancelled = true
      if (mapRef.current) {
        try { (mapRef.current as { remove: () => void }).remove() } catch {}
        mapRef.current = null
        segmentsRef.current = []
        markerRef.current = null
        userPulseRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Actualizar trayecto y marcador cuando cambian los puntos ──
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = LRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = mapRef.current
    if (!L || !map) return
    if (points.length === 0) return

    // 1. Limpiar segmentos anteriores
    segmentsRef.current.forEach(seg => {
      try { (seg as { remove: () => void }).remove() } catch {}
    })
    segmentsRef.current = []

    // 2. Dibujar segmentos coloreados por velocidad
    //    Usamos varios polylines cortos en vez de uno solo para poder pintar segmentos
    //    con colores distintos.
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const cur = points[i]
      const v = speedKmh(prev, cur)
      const color = colorForSpeed(v)
      const segment = L.polyline(
        [[prev.lat, prev.lng], [cur.lat, cur.lng]],
        {
          color,
          weight: 5,
          opacity: 0.92,
          lineCap: "round",
          lineJoin: "round",
        }
      ).addTo(map)
      segmentsRef.current.push(segment)
    }

    // 3. Marcador en el punto actual
    const last = points[points.length - 1]
    const lastLatLng: [number, number] = [last.lat, last.lng]

    if (markerRef.current) {
      try { (markerRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng(lastLatLng) } catch {}
    } else {
      // Punto interior violeta + halo blanco + pulso animado (en CSS)
      markerRef.current = L.circleMarker(lastLatLng, {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: "#7C3AED",
        fillOpacity: 1,
      }).addTo(map)

      // Halo de pulso (otro circleMarker animado por CSS)
      userPulseRef.current = L.circleMarker(lastLatLng, {
        radius: 14,
        color: "#7C3AED",
        weight: 2,
        fillColor: "#7C3AED",
        fillOpacity: 0.25,
        className: "leaflet-rendi-pulse",
      }).addTo(map)
    }

    if (userPulseRef.current) {
      try { (userPulseRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng(lastLatLng) } catch {}
    }

    // 4. Centrar o ajustar zoom
    if (liveMode) {
      // Seguir al usuario en vivo
      try { map.panTo(lastLatLng, { animate: true, duration: 0.4 }) } catch {}
    } else if (points.length >= 2) {
      // Vista preview — fit a toda la ruta con padding
      try {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
      } catch {}
    }
  }, [points, liveMode])

  return (
    <>
      {/* CSS para la animación de pulso del marcador del usuario */}
      <style jsx global>{`
        @keyframes leafletRendiPulse {
          0%   { stroke-opacity: 0.8; fill-opacity: 0.4; transform: scale(0.6); }
          70%  { stroke-opacity: 0;   fill-opacity: 0;   transform: scale(1.6); }
          100% { stroke-opacity: 0;   fill-opacity: 0;   transform: scale(1.6); }
        }
        .leaflet-rendi-pulse {
          animation: leafletRendiPulse 1.8s ease-out infinite;
          transform-origin: center;
        }
        .leaflet-container {
          background: #e9eef3;
          font-family: inherit;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          height,
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          zIndex: 0,
        }}
      />
    </>
  )
}

// ── Componente de leyenda mini para mostrar los colores ──────────
export function RunningMapLegend() {
  return (
    <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground mt-2 flex-wrap">
      <LegendDot color="#10b981" label="Caminando" />
      <LegendDot color="#fbbf24" label="Trotando" />
      <LegendDot color="#7C3AED" label="Corriendo" />
      <LegendDot color="#f97316" label="Fuerte" />
      <LegendDot color="#ef4444" label="Sprint" />
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}
