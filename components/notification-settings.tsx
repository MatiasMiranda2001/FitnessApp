"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, Coffee, UtensilsCrossed, Apple, Moon, Dumbbell, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"
import { updateNotificationPrefsCache } from "@/lib/store"

interface MealConfig { enabled: boolean; time: string }
interface NotifPrefs {
  enabled: boolean
  meals: {
    breakfast: MealConfig
    lunch:     MealConfig
    snack:     MealConfig
    dinner:    MealConfig
  }
  workout: MealConfig
}

const DEFAULT_PREFS: NotifPrefs = {
  enabled: false,
  meals: {
    breakfast: { enabled: false, time: "08:00" },
    lunch:     { enabled: false, time: "13:00" },
    snack:     { enabled: false, time: "17:00" },
    dinner:    { enabled: false, time: "21:00" },
  },
  workout: { enabled: false, time: "19:00" },
}

const MEAL_META = [
  { key: "breakfast", label: "Desayuno",  icon: Coffee,          color: "text-yellow-400" },
  { key: "lunch",     label: "Almuerzo",  icon: UtensilsCrossed, color: "text-green-400"  },
  { key: "snack",     label: "Merienda",  icon: Apple,           color: "text-orange-400" },
  { key: "dinner",    label: "Cena",      icon: Moon,            color: "text-blue-400"   },
] as const

interface Props {
  initialPrefs?: NotifPrefs | null
}

export function NotificationSettings({ initialPrefs }: Props) {
  const { supported, permission, subscription, loading, subscribe, unsubscribe } = usePushNotifications()
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs ?? DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)

  const isSubscribed = !!subscription
  const isEnabled = prefs.enabled && isSubscribed

  // Re-sincronizar el estado local si el padre nos pasa unos prefs distintos
  // (p.ej. cuando el cache se hidrata después del primer render)
  useEffect(() => {
    if (initialPrefs) setPrefs(initialPrefs)
  }, [initialPrefs])

  // ── Guardar prefs cuando cambian ───────────────────────────
  async function savePrefs(newPrefs: NotifPrefs) {
    setPrefs(newPrefs)
    // Actualizar el cache local para que cuando vuelva al perfil, persista
    updateNotificationPrefsCache(newPrefs as never)
    setSaving(true)
    try {
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-prefs", prefs: newPrefs }),
      })
      if (!r.ok) {
        // Fallback al endpoint viejo por si todavía no se redeployó
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-prefs", prefs: newPrefs }),
        })
      }
    } catch (err) {
      console.error("save-prefs failed:", err)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Toggle global ──────────────────────────────────────────
  async function handleToggleGlobal() {
    if (!isSubscribed) {
      const ok = await subscribe()
      if (!ok) return
      const next = { ...prefs, enabled: true }
      await savePrefs(next)
      setExpanded(true)
    } else if (isEnabled) {
      const next = { ...prefs, enabled: false }
      await savePrefs(next)
    } else {
      const next = { ...prefs, enabled: true }
      await savePrefs(next)
      setExpanded(true)
    }
  }

  // ── Toggle comida ──────────────────────────────────────────
  function handleToggleMeal(key: keyof NotifPrefs["meals"]) {
    const next = {
      ...prefs,
      meals: { ...prefs.meals, [key]: { ...prefs.meals[key], enabled: !prefs.meals[key].enabled } },
    }
    savePrefs(next)
  }

  // ── Cambio de hora ─────────────────────────────────────────
  function handleTimeChange(key: keyof NotifPrefs["meals"] | "workout", time: string) {
    if (key === "workout") {
      savePrefs({ ...prefs, workout: { ...prefs.workout, time } })
    } else {
      savePrefs({ ...prefs, meals: { ...prefs.meals, [key]: { ...prefs.meals[key], time } } })
    }
  }

  if (!supported) return null

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isEnabled ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Recordatorios</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEnabled ? "Activados" : "Desactivados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {saved && !saving && <span className="text-[10px] text-primary">Guardado</span>}
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleGlobal}
                disabled={loading || permission === "denied"}
              />
            )}
          </div>
        </div>

        {permission === "denied" && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            Las notificaciones están bloqueadas en tu navegador. Habilitálas en Configuración → Sitio.
          </p>
        )}

        {/* Detalles expandibles */}
        {isEnabled && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Ocultar configuración" : "Configurar horarios"}
            </button>

            {expanded && (
              <div className="mt-4 space-y-3">
                {/* Comidas */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Comidas</p>
                {MEAL_META.map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                    <span className="text-sm flex-1">{label}</span>
                    <input
                      type="time"
                      value={prefs.meals[key].time}
                      onChange={(e) => handleTimeChange(key, e.target.value)}
                      disabled={!prefs.meals[key].enabled}
                      className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground disabled:opacity-40 w-24"
                    />
                    <Switch
                      checked={prefs.meals[key].enabled}
                      onCheckedChange={() => handleToggleMeal(key)}
                    />
                  </div>
                ))}

                {/* Separador */}
                <div className="border-t border-border pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Entrenamiento</p>
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                      <span className="text-sm">Recordatorio diario</span>
                      <p className="text-[10px] text-muted-foreground">Si no entrenaste al llegar la hora</p>
                    </div>
                    <input
                      type="time"
                      value={prefs.workout.time}
                      onChange={(e) => handleTimeChange("workout", e.target.value)}
                      disabled={!prefs.workout.enabled}
                      className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground disabled:opacity-40 w-24"
                    />
                    <Switch
                      checked={prefs.workout.enabled}
                      onCheckedChange={() => savePrefs({ ...prefs, workout: { ...prefs.workout, enabled: !prefs.workout.enabled } })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
