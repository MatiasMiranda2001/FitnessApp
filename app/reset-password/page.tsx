"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { FitTrackLogo } from "@/components/fittrack-logo"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Verificamos que el usuario llegó acá vía email link válido (tiene sesión)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push("/app")
      router.refresh()
    }, 1800)
  }

  // Sesión inválida o expirada
  if (hasSession === false) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10 mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Enlace inválido o expirado</h1>
          <p className="text-muted-foreground mb-6">
            El enlace de recuperación expiró o ya fue usado. Pedí uno nuevo.
          </p>
          <Link href="/forgot-password">
            <Button className="rounded-xl bg-brand-gradient text-white">
              Pedir nuevo enlace
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  // Loading inicial mientras verificamos sesión
  if (hasSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Éxito
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">¡Contraseña actualizada!</h1>
          <p className="text-muted-foreground">
            Te estamos llevando a tu dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-6" />
        </div>
      </main>
    )
  }

  // Form principal
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-8">
          <FitTrackLogo size={48} showText />
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Nueva contraseña</h1>
        <p className="text-muted-foreground mb-8">
          Elegí una contraseña segura para tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="h-12 rounded-xl pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm" className="text-sm font-medium mb-1.5 block">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              className="h-12 rounded-xl"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-bold bg-brand-gradient text-white shadow-md shadow-primary/30">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar nueva contraseña"}
          </Button>
        </form>
      </div>
    </main>
  )
}
