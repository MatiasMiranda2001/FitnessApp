"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "./client"
import { hydrate, clearCache } from "@/lib/store"

interface SupabaseContextValue {
  user: User | null
  loading: boolean
  hydrated: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

export function SupabaseProvider({
  initialUser,
  children,
}: {
  initialUser: User | null
  children: React.ReactNode
}) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hidrata el caché al iniciar / cambiar de usuario
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        clearCache()
        setHydrated(false)
        return
      }
      setLoading(true)
      try {
        await hydrate(user.id)
        if (!cancelled) setHydrated(true)
      } catch (e) {
        console.error("Error hidratando datos:", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  // Escucha cambios de auth en el navegador
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      router.refresh()
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearCache()
    setUser(null)
    router.push("/")
  }, [supabase, router])

  const refresh = useCallback(async () => {
    if (user) await hydrate(user.id)
  }, [user])

  return (
    <SupabaseContext.Provider value={{ user, loading, hydrated, signOut, refresh }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error("useSupabase debe usarse dentro de <SupabaseProvider>")
  return ctx
}
