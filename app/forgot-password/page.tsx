"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { FitTrackLogo } from "@/components/fittrack-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Revisá tu email</h1>
          <p className="text-muted-foreground mb-6">
            Te enviamos un enlace a <span className="font-semibold text-foreground">{email}</span> para
            que puedas crear una nueva contraseña. El link es válido por 1 hora.
          </p>
          <Link href="/login">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Button>
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">
            ¿No recibís el email? Revisá la carpeta de spam, o{" "}
            <button
              type="button"
              onClick={() => { setSent(false); setEmail("") }}
              className="text-primary font-medium hover:underline"
            >
              probá con otro email
            </button>
            .
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-8">
          <FitTrackLogo size={48} showText />
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Recuperar contraseña</h1>
        <p className="text-muted-foreground mb-8">
          Ingresá tu email y te mandamos un enlace para crear una nueva.
        </p>

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

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-bold bg-brand-gradient text-white shadow-md shadow-primary/30">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link href="/login" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  )
}
