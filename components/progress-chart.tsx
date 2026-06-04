"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ChartData {
  date: string
  value: number
}

interface ProgressChartProps {
  data: ChartData[]
  title: string
  color?: string
}

export function ProgressChart({ data, title, color = "#22c55e" }: ProgressChartProps) {
  // Estado para saber qué punto estamos tocando
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, value: number, date: string } | null>(null)

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  if (sortedData.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-xs border border-dashed rounded-lg bg-secondary/10">
        Sin datos registrados
      </div>
    )
  }

  // Configuración
  const svgWidth = 400
  const svgHeight = 200
  const margin = { top: 20, right: 20, bottom: 30, left: 45 }
  const chartWidth = svgWidth - margin.left - margin.right
  const chartHeight = svgHeight - margin.top - margin.bottom

  const values = sortedData.map(d => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values) * 1.05 
  const rangeVal = maxVal - minVal || 1

  const getX = (index: number) => {
    if (sortedData.length === 1) return margin.left + chartWidth / 2
    return margin.left + (index / (sortedData.length - 1)) * chartWidth
  }
  
  const getY = (value: number) => {
      if (rangeVal === 0) return margin.top + chartHeight / 2
      return margin.top + chartHeight - ((value - minVal) / rangeVal) * chartHeight
  }

  const pointsStr = sortedData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(" ")

  const yLabels = sortedData.length === 1 
    ? [minVal] 
    : [minVal, minVal + rangeVal / 2, maxVal].map(v => Math.round(v))

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end px-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="text-right">
           <span className="text-2xl font-bold text-foreground leading-none">
             {values[values.length-1]}<span className="text-sm font-normal text-muted-foreground ml-0.5">kg</span>
           </span>
           <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Último registro</p>
        </div>
      </div>
      
      <div className="relative h-48 w-full bg-card rounded-xl border border-border p-2 shadow-sm">
         <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-full cursor-crosshair" 
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setHoveredPoint(null)} // Ocultar al salir del gráfico
         >
            
            {/* Ejes y Etiquetas (Código igual al anterior) */}
            {yLabels.map((label, i) => {
               const y = rangeVal === 0 ? margin.top + chartHeight / 2 : getY(label)
               return (
                 <g key={i}>
                   <line x1={margin.left} y1={y} x2={margin.left + chartWidth} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                   <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">{label}</text>
                 </g>
               )
            })}
            <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} stroke="currentColor" strokeOpacity="0.2" />
            
            {sortedData.length > 1 && (
                <>
                    <text x={margin.left} y={svgHeight - 5} textAnchor="start" fontSize="11" fill="currentColor" opacity="0.6">
                    {format(new Date(sortedData[0].date), "d MMM", { locale: es })}
                    </text>
                    <text x={margin.left + chartWidth} y={svgHeight - 5} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.6">
                    {format(new Date(sortedData[sortedData.length - 1].date), "d MMM", { locale: es })}
                    </text>
                </>
            )}
            {sortedData.length === 1 && (
                 <text x={margin.left + chartWidth / 2} y={svgHeight - 5} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6">
                    {format(new Date(sortedData[0].date), "d MMM", { locale: es })}
                 </text>
            )}

            {sortedData.length > 1 && (
                <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                points={pointsStr}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm"
                />
            )}
            
            {/* Puntos Interactivos */}
            {sortedData.map((d, i) => {
               const x = getX(i)
               const y = getY(d.value)
               return (
                  <g key={i}>
                    {/* Zona de impacto invisible más grande para facilitar el toque en móvil */}
                    <circle 
                        cx={x} cy={y} r="15" fill="transparent" 
                        onMouseEnter={() => setHoveredPoint({ x, y, value: d.value, date: d.date })}
                    />
                    {/* El punto visible */}
                    <circle 
                        cx={x} cy={y} r="5" 
                        fill="var(--background)" 
                        stroke={color} 
                        strokeWidth="2.5" 
                        className="transition-all duration-200"
                        style={{ r: (hoveredPoint?.date === d.date) ? 7 : 5 }} // Se agranda al pasar mouse
                    />
                  </g>
               )
            })}
         </svg>

         {/* Tooltip Flotante */}
         {hoveredPoint && (
            <div 
                className="absolute bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-md border border-border pointer-events-none transform -translate-x-1/2 -translate-y-[140%]"
                style={{ 
                    // Convertimos coordenadas SVG a % para posicionar el div
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
                    top: `${(hoveredPoint.y / svgHeight) * 100}%` 
                }}
            >
                <p className="font-bold">{hoveredPoint.value} kg</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(hoveredPoint.date), "d MMM", { locale: es })}</p>
            </div>
         )}
      </div>
    </div>
  )
}