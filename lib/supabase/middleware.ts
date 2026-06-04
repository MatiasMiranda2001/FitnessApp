// Helper que el middleware raíz (middleware.ts) usa para refrescar la sesión
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Importante: refrescar el token si está por expirar
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const protectedPaths = ["/app", "/billing"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(url)
  }

  // Rutas auth: si ya está logueado, redirigir a /app
  const authPaths = ["/login", "/signup"]
  if (authPaths.includes(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    return NextResponse.redirect(url)
  }

  return response
}
