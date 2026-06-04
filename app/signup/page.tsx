"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { FitTrackLogo } from "@/components/fittrack-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Fortaleza de contraseña
  const passwordStrength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()
  const strengthConfig = [
    { label: "Muy débil", color: "bg-red-500" },
    { label: "Débil",     color: "bg-orange-500" },
    { label: "Media",     color: "bg-yellow-500" },
    { label: "Buena",     color: "bg-lime-500" },
    { label: "Fuerte",    color: "bg-green-500" },
    { label: "Muy fuerte",color: "bg-emerald-600" },
  ][Math.min(passwordStrength, 5)]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      // Mapear errores de Supabase a mensajes en español
      const msg = error.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        setError("Ya existe una cuenta con ese email. ¿Querés iniciar sesión?")
      } else if (msg.includes("invalid email")) {
        setError("El email no es válido.")
      } else if (msg.includes("password")) {
        setError("La contraseña debe tener al menos 6 caracteres.")
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        setError("Demasiados intentos. Esperá unos minutos e intentá de nuevo.")
      } else {
        setError("Ocurrió un error al crear la cuenta. Intentá de nuevo.")
      }
      setLoading(false)
      return
    }

    // Si Supabase está configurado para confirmar email, no hay sesión activa todavía
    if (data.session) {
      router.push("/app")
      router.refresh()
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Revisa tu email</h1>
          <p className="text-muted-foreground mb-6">
            Te enviamos un enlace de confirmación a <span className="font-semibold text-foreground">{email}</span>.
            Haz click para activar tu cuenta.
          </p>
          <Link href="/login">
            <Button variant="outline" className="rounded-xl">Volver al login</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-8">
          <FitTrackLogo size={48} showText />
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Crea tu cuenta</h1>
        <p className="text-muted-foreground mb-8">Empieza gratis, sin tarjeta de crédito.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">Nombre</Label>
            <Input
              id="name"
              type="text"
              required
              placeholder="Tu nombre"
              className="h-12 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="h-12 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">Contraseña</Label>
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
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Indicador de fortaleza */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0,1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength ? strengthConfig.color : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strengthConfig.label}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
              {error.includes("Ya existe una cuenta") && (
                <Link href="/login" className="block mt-1.5 font-semibold underline text-destructive">
                  → Ir al login
                </Link>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
