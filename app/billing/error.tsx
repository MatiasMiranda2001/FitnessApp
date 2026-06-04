"use client"

// Error boundary local para /billing. Si algo se rompe al renderizar la página
// de facturación, capturamos el error y mostramos una UI amigable con un botón
// para reintentar. Esto evita la pantalla horrible "Application error".
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronLeft, RefreshCw } from "lucide-react"

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Mandar a la consola para debugging (queda en los logs del cliente)
    console.error("[billing/error]", error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Algo no anduvo bien</h1>
          <p className="text-sm text-muted-foreground">
            No pudimos cargar la página de facturación. Probá de nuevo en un
            momento, o volvé al inicio.
          </p>
          {error?.digest && (
            <p className="text-[10px] text-muted-foreground/70 mt-3 font-mono">
              ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-xl gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
          <Link href="/app">
            <Button variant="outline" className="rounded-xl gap-2 w-full">
              <ChevronLeft className="h-4 w-4" /> Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
