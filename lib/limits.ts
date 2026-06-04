// Helpers server-side para verificar y aplicar los límites de plan
import { createClient as createServerSupabase, createServiceClient } from "@/lib/supabase/server"
import { FREE_LIMITS } from "@/lib/types"

export type PlanCheckResult = {
  allowed: boolean
  plan: "free" | "pro"
  used: number
  limit: number
  reason?: string
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

/**
 * Verifica si el usuario puede hacer un escaneo nutricional.
 * No incrementa el contador — eso lo hace `consumeScan` después de un scan exitoso.
 */
export async function checkScanLimit(userId: string): Promise<PlanCheckResult> {
  const svc = createServiceClient()
  const { data, error } = await svc
    .from("profiles")
    .select("plan, scan_count, scan_count_month")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return { allowed: false, plan: "free", used: 0, limit: FREE_LIMITS.scansPerMonth, reason: "perfil no encontrado" }
  }

  if (data.plan === "pro") {
    return { allowed: true, plan: "pro", used: 0, limit: -1 }
  }

  const month = currentMonth()
  const used = data.scan_count_month === month ? (data.scan_count ?? 0) : 0
  const allowed = used < FREE_LIMITS.scansPerMonth

  return {
    allowed,
    plan: "free",
    used,
    limit: FREE_LIMITS.scansPerMonth,
    reason: allowed ? undefined : "límite mensual alcanzado",
  }
}

export async function consumeScan(userId: string): Promise<number> {
  const svc = createServiceClient()
  const { data, error } = await svc.rpc("increment_scan_count", { p_user_id: userId })
  if (error) {
    console.error("[limits] error incrementing scan:", error)
    return -1
  }
  return data as number
}

export async function checkAILimit(userId: string): Promise<PlanCheckResult> {
  const svc = createServiceClient()
  const { data, error } = await svc
    .from("profiles")
    .select("plan, ai_message_count, ai_message_count_month")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return { allowed: false, plan: "free", used: 0, limit: FREE_LIMITS.aiMessagesPerMonth, reason: "perfil no encontrado" }
  }

  if (data.plan === "pro") {
    return { allowed: true, plan: "pro", used: 0, limit: -1 }
  }

  const month = currentMonth()
  const used = data.ai_message_count_month === month ? (data.ai_message_count ?? 0) : 0
  const allowed = used < FREE_LIMITS.aiMessagesPerMonth

  return {
    allowed,
    plan: "free",
    used,
    limit: FREE_LIMITS.aiMessagesPerMonth,
    reason: allowed ? undefined : "límite mensual alcanzado",
  }
}

export async function consumeAIMessage(userId: string): Promise<number> {
  const svc = createServiceClient()
  const { data, error } = await svc.rpc("increment_ai_message_count", { p_user_id: userId })
  if (error) {
    console.error("[limits] error incrementing ai message:", error)
    return -1
  }
  return data as number
}

/** Helper común: obtiene el userId del request o devuelve null */
export async function getAuthedUserId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
