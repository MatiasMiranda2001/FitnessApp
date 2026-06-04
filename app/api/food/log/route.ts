// Endpoint para registrar una comida manual — chequea y consume el límite mensual.
// El mismo contador que los escaneos de foto (scan_count).
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { checkScanLimit, consumeScan, getAuthedUserId } from "@/lib/limits"
import { FREE_LIMITS } from "@/lib/types"

export async function POST() {
  const userId = await getAuthedUserId()
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const limit = await checkScanLimit(userId)

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message: `Llegaste al límite de ${FREE_LIMITS.scansPerMonth} registros de comida del mes. Mejorá a Pro para registros ilimitados.`,
        plan: limit.plan,
        used: limit.used,
        limit: limit.limit,
      },
      { status: 402 }
    )
  }

  const newCount = await consumeScan(userId)
  return NextResponse.json({ ok: true, used: newCount, limit: FREE_LIMITS.scansPerMonth })
}
