"use client"

import { Home, Dumbbell, Camera, Apple, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  current: string
  onChange: (view: string) => void
  onOpenProfile?: () => void
  onOpenScan?: () => void
}

const leftItems = [
  { id: "dashboard", label: "Inicio",  icon: Home },
  { id: "workout",   label: "Entreno", icon: Dumbbell },
]

const rightItems = [
  { id: "nutrition", label: "Nutrición", icon: Apple },
]

export function BottomNav({ current, onChange, onOpenProfile, onOpenScan }: BottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-lg z-50"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="flex justify-around items-end max-w-md mx-auto h-16 px-1">

        {/* Left items */}
        {leftItems.map((item) => {
          const isActive = current === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 h-full transition-all duration-200 active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-normal")}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* Center scan button */}
        <div className="flex flex-col items-center justify-end pb-1.5 px-1">
          <button
            onClick={() => { onChange("nutrition"); onOpenScan?.() }}
            className="flex items-center justify-center w-[52px] h-[52px] rounded-full shadow-lg active:scale-95 transition-all -mt-5"
            style={{
              background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
            }}
            aria-label="Escanear comida"
          >
            <Camera className="h-6 w-6 text-white" strokeWidth={2} />
          </button>
          <span className="text-[10px] font-normal text-muted-foreground mt-0.5">Escanear</span>
        </div>

        {/* Right items */}
        {rightItems.map((item) => {
          const isActive = current === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 h-full transition-all duration-200 active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-normal")}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* Perfil — ícono de personita */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center flex-1 gap-1 h-full transition-all duration-200 active:scale-95 text-muted-foreground"
          aria-label="Perfil"
        >
          <User className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-[10px] font-normal">Perfil</span>
        </button>

      </div>
    </div>
  )
}
