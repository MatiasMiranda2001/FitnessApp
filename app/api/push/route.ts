import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  // ── Subscribe ──────────────────────────────────────────────
  if (action === "subscribe") {
    const { endpoint, keys } = body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: "user_id,endpoint" }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Unsubscribe ────────────────────────────────────────────
  if (action === "unsubscribe") {
    const { endpoint } = body
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Save prefs ─────────────────────────────────────────────
  if (action === "save-prefs") {
    const { prefs } = body
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: prefs })
      .eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
