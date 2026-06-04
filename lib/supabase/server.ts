// Cliente de Supabase para Server Components, Route Handlers y Server Actions
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado: los Server Components no pueden setear cookies.
            // El middleware se encarga del refresh de sesión.
          }
        },
      },
    }
  )
}

// Cliente "service role" — SOLO para webhooks y operaciones server-side de admin.
// Bypasea RLS, así que NUNCA exponer al cliente.
import { createClient as _createSupaClient } from "@supabase/supabase-js"
export function createServiceClient() {
  return _createSupaClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
