import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static, _next/image (assets)
     * - favicon, iconos
     * - rutas /api (las protegemos individualmente)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/stripe/webhook|api/mercadopago/webhook).*)",
  ],
}
