"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Check, Loader2, Sparkles, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase/provider"
import { useAppData } from "@/lib/hooks/use-store"
import { refreshBilling } from "@/lib/store"
import { FREE_LIMITS } from "@/lib/types"

type MpPlan = "monthly" | "annual"

// Wrapper: garantiza que el contenido del billing SOLO se renderice en el cliente.
// Si Next.js intenta hacer SSR de este page, devolvemos un loader sin ejecutar
// los hooks (useSupabase, useAppData) que tienen estado no-serializable.
export default function BillingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  return <BillingContent />
}

function BillingContent() {
  const router = useRouter()
  const { user, hydrated } = useSupabase()
  const data = useAppData()
  const [loading, setLoading] = useState<MpPlan | null>(null)
  const [banner, setBanner] = useState<{ msg: string; type: "success" | "error" | "neutral" } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("mp_success") === "1") {
      setBanner({ msg: "¡Pago iniciado con Mercado Pago! Tu plan se activará en segundos 🎉", type: "success" })
      const delays = [3000, 6000, 10000, 15000, 25000]
      delays.forEach(ms => setTimeout(() => refreshBilling(), ms))
    } else if (params.get("canceled") === "1") {
      setBanner({ msg: "Compra cancelada. Podés intentar de nuevo cuando quieras.", type: "neutral" })
    }
  }, [])

  if (!user || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const billing = data.billing
  const isPro = billing.plan === "pro"

  async function handleMPCheckout(plan: MpPlan) {
    setLoading(plan)
    setBanner(null)
    try {
      const res = await fetch("/api/mercadopago/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setBanner({ msg: json.error || "No se pudo abrir Mercado Pago. Intentá de nuevo.", type: "error" })
    } catch {
      setBanner({ msg: "Error de red. Verificá tu conexión e intentá de nuevo.", type: "error" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="px-6 pt-6 pb-4 flex items-center sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => router.push("/app")} className="-ml-2 rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold ml-2">Plan y facturación</h1>
      </header>

      <div className="px-6 max-w-md mx-auto space-y-6">
        {banner && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            banner.type === "error"
              ? "bg-destructive/10 border border-destructive/30 text-destructive"
              : banner.type === "success"
              ? "bg-primary/10 border border-primary/30 text-primary"
              : "bg-muted border border-border text-muted-foreground"
          }`}>
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{banner.msg}</span>
          </div>
        )}

        {/* Estado actual */}
        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-4">
            {isPro ? (
              <div className="h-12 w-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <Crown className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Plan actual</p>
              <p className="text-2xl font-bold">{isPro ? "Pro" : "Free"}</p>
            </div>
          </div>

          {!isPro && (
            <div className="space-y-3 mt-4">
              <UsageBar label="Registros de comida" used={billing.scanCount} limit={FREE_LIMITS.scansPerMonth} />
              <UsageBar label="Mensajes con AI Coach" used={billing.aiMessageCount} limit={FREE_LIMITS.aiMessagesPerMonth} />
              <p className="text-xs text-muted-foreground pt-2">Los contadores se reinician al inicio de cada mes.</p>
            </div>
          )}

          {isPro && billing.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground mt-2">
              Renueva el {new Date(billing.currentPeriodEnd).toLocaleDateString("es")}
            </p>
          )}

          {isPro && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-full bg-[#009EE3]" />
              Suscripción activa vía Mercado Pago
            </p>
          )}
        </Card>

        {/* Opciones de pago (solo si es free) */}
        {!isPro && (
          <>
            {/* Plan Mensual */}
            <Card className="p-6 rounded-2xl border-2 border-border">
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground">Rendi Pro</p>
                <p className="text-2xl font-bold">Mensual</p>
                <p className="text-3xl font-extrabold tracking-tight mt-2">
                  $7.500<span className="text-base font-normal text-muted-foreground">/mes</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Cancelá cuando quieras</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <Feature>Registros de comida ilimitados</Feature>
                <Feature>AI Coach ilimitado</Feature>
                <Feature>Historial y analíticas avanzadas</Feature>
              </ul>

              <Button
                onClick={() => handleMPCheckout("monthly")}
                disabled={loading !== null}
                variant="outline"
                className="w-full h-12 rounded-xl text-sm sm:text-base font-semibold border-[#009EE3]/40 hover:bg-[#009EE3]/5 hover:border-[#009EE3] transition-all px-3"
              >
                {loading === "monthly" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2 min-w-0">
                    <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#009EE3] shrink-0" />
                    <span className="truncate">
                      Pagar<span className="hidden sm:inline"> con Mercado Pago</span>
                    </span>
                  </span>
                )}
              </Button>
            </Card>

            {/* Plan Anual (destacado) */}
            <Card className="p-6 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden shadow-lg shadow-primary/10">
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-brand-gradient text-white shadow-md shadow-primary/30 mb-3">
                  ⭐ Mejor precio · Ahorrás $15.000
                </div>
                <p className="text-sm font-medium text-primary">Rendi Pro</p>
                <p className="text-2xl font-bold">Anual</p>
                <p className="text-3xl font-extrabold tracking-tight mt-2">
                  $75.000<span className="text-base font-normal text-muted-foreground">/año</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Equivale a $6.250/mes · 16% off</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <Feature>Todo lo del plan Mensual</Feature>
                <Feature>Acceso garantizado por 12 meses</Feature>
                <Feature>Olvidate de pagar mes a mes</Feature>
              </ul>

              <Button
                onClick={() => handleMPCheckout("annual")}
                disabled={loading !== null}
                className="w-full h-12 rounded-xl text-sm sm:text-base font-bold bg-brand-gradient text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all px-3"
              >
                {loading === "annual" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2 min-w-0">
                    <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/30 shrink-0" />
                    <span className="truncate">
                      Pagar Anual<span className="hidden sm:inline"> con Mercado Pago</span>
                    </span>
                  </span>
                )}
              </Button>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              Pagás de forma segura con Mercado Pago. Aceptamos dinero en cuenta, tarjeta de débito, crédito y transferencia bancaria.
            </p>
          </>
        )}

        {/* Gestión plan Pro */}
        {isPro && (
          <Card className="p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground mb-4">
              Para gestionar o cancelar tu suscripción, ingresá a Mercado Pago desde su app o sitio web.
            </p>
            <a
              href="https://www.mercadopago.com.ar/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full h-12 rounded-xl border-[#009EE3]/40 hover:bg-[#009EE3]/5 hover:border-[#009EE3] transition-all">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-[#009EE3] shrink-0" />
                  Gestionar en Mercado Pago
                </span>
              </Button>
            </a>
          </Card>
        )}
      </div>
    </main>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100)
  const exhausted = used >= limit
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={exhausted ? "text-destructive font-bold" : ""}>{used} / {limit}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${exhausted ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
