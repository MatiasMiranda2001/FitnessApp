"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { FitTrackLogo } from "@/components/fittrack-logo"

export default function LoginPage() {
  const router = useRouter()
  const [redirectedFrom, setRedirectedFrom] = useState("/app")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRedirectedFrom(params.get("redirectedFrom") || "/app")
  }, [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : error.message)
      setLoading(false)
      return
    }

    router.push(redirectedFrom)
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-8">
          <FitTrackLogo size={48} showText />
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Bienvenido de vuelta</h1>
        <p className="text-muted-foreground mb-8">Inicia sesión para continuar tu progreso.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
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
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}
