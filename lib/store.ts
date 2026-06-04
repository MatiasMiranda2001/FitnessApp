// =============================================================
// Rendi - Store
// Caché en memoria con write-through a Supabase. La API pública
// se mantiene síncrona para minimizar cambios en componentes.
// El proveedor `SupabaseProvider` (lib/supabase/provider.tsx) llama
// a `hydrate()` al montar la app.
// =============================================================

import {
  AppData, UserProfile, WorkoutLog, RunningLog, Exercise, FoodEntry,
  WeeklyRoutine, Gender, Goal, ChatMessage, BillingState, Plan,
} from "./types"
import { routineTemplates } from "./routine-templates"
import { createClient } from "./supabase/client"

// --- 1. HELPERS DE CÁLCULO (sin cambios — funciones puras) ---
export function calculateTDEE(gender: Gender, age: number, height: number, weight: number): number {
  let bmr = 10 * weight + 6.25 * height - 5 * age
  if (gender === "male") bmr += 5
  else bmr -= 161
  return bmr * 1.55
}

export function calculateMacros(tdee: number, weight: number, goal: Goal) {
  let targetCalories = tdee
  if (goal === "cut") targetCalories -= 500
  if (goal === "bulk") targetCalories += 300

  const protein = Math.round(weight * 2)
  const fat = Math.round(weight * 0.8)
  const proteinCal = protein * 4
  const fatCal = fat * 9
  const remainingCal = targetCalories - proteinCal - fatCal
  const carbs = Math.max(0, Math.round(remainingCal / 4))

  return { tdee: Math.round(targetCalories), protein, fat, carbs }
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// --- 2. ESTADO EN MEMORIA --------------------------------------
function emptyBilling(): BillingState {
  const month = new Date().toISOString().slice(0, 7) // YYYY-MM
  return {
    plan: "free",
    scanCount: 0,
    scanCountMonth: month,
    aiMessageCount: 0,
    aiMessageCountMonth: month,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: null,
    currentPeriodEnd: null,
    mpPreapprovalId: null,
    mpSubscriptionStatus: null,
  }
}

function emptyState(): AppData {
  return {
    profile: null,
    workoutLogs: [],
    runningLogs: [],
    customExercises: [],
    routines: routineTemplates,
    activeRoutineId: null,
    foodEntries: [],
    chatHistory: [],
    billing: emptyBilling(),
    userId: null,
    hydrated: false,
  }
}

let cache: AppData = emptyState()
type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => {
    try { l() } catch {}
  })
}

export function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

// --- 3. HYDRATE DESDE SUPABASE ---------------------------------
// Llamar UNA vez por sesión cuando hay usuario autenticado.
export async function hydrate(userId: string): Promise<AppData> {
  const supabase = createClient()

  const [profileRes, workoutsRes, exercisesRes, routinesRes, foodsRes, chatRes, runningRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("workout_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(500),
    supabase.from("custom_exercises").select("*").eq("user_id", userId),
    supabase.from("routines").select("*").eq("user_id", userId),
    supabase.from("food_entries").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(500),
    supabase.from("chat_messages").select("*").eq("user_id", userId).order("timestamp", { ascending: true }).limit(200),
    supabase.from("running_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(200),
  ])

  // ----- profile -----
  let profile: UserProfile | null = null
  let billing = emptyBilling()
  let activeRoutineId: string | null = null

  if (profileRes.data) {
    const p = profileRes.data
    if (p.onboarded && p.age && p.weight && p.height && p.gender && p.goal) {
      profile = {
        name: p.name ?? undefined,
        age: p.age,
        weight: Number(p.weight),
        height: Number(p.height),
        gender: p.gender,
        goal: p.goal,
        activityLevel: p.activity_level ?? undefined,
        tdee: p.tdee ?? 0,
        protein: p.protein ?? 0,
        carbs: p.carbs ?? 0,
        fat: p.fat ?? 0,
        notification_prefs: p.notification_prefs ?? null,
      }
    }
    billing = {
      plan: (p.plan ?? "free") as Plan,
      scanCount: p.scan_count ?? 0,
      scanCountMonth: p.scan_count_month ?? new Date().toISOString().slice(0, 7),
      aiMessageCount: p.ai_message_count ?? 0,
      aiMessageCountMonth: p.ai_message_count_month ?? new Date().toISOString().slice(0, 7),
      stripeCustomerId: p.stripe_customer_id,
      stripeSubscriptionId: p.stripe_subscription_id,
      stripeSubscriptionStatus: p.stripe_subscription_status,
      currentPeriodEnd: p.current_period_end,
      mpPreapprovalId: p.mp_preapproval_id ?? null,
      mpSubscriptionStatus: p.mp_subscription_status ?? null,
    }
    activeRoutineId = p.active_routine_id ?? null
  }

  // ----- workouts -----
  const workoutLogs: WorkoutLog[] = (workoutsRes.data ?? []).map((row) => ({
    id: row.id,
    exerciseId: row.exercise_id,
    date: row.date,
    sets: row.sets ?? [],
  }))

  // ----- custom exercises -----
  const customExercises: Exercise[] = (exercisesRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    videoPlaceholder: row.video_placeholder ?? undefined,
    isCustom: true,
  }))

  // ----- routines (mezcla con templates si el usuario no tiene ninguna propia) -----
  const userRoutines: WeeklyRoutine[] = (routinesRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    days: row.days ?? [],
    isTemplate: row.is_template ?? false,
  }))
  const routines = userRoutines.length > 0 ? userRoutines : routineTemplates

  // ----- food entries -----
  const foodEntries: FoodEntry[] = (foodsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    date: row.date,
    grams: row.grams ?? undefined,
    image: row.image ?? undefined,
  }))

  // ----- chat history -----
  const chatHistory: ChatMessage[] = (chatRes.data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
  }))

  // ----- running logs -----
  const runningLogs: RunningLog[] = (runningRes.data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    distanceKm: Number(row.distance_km),
    durationSec: row.duration_sec,
    paceSeckm: row.pace_sec_km ?? Math.round(row.duration_sec / Number(row.distance_km)),
    calories: row.calories ?? undefined,
    notes: row.notes ?? undefined,
    gpsPath: row.gps_path ?? undefined,
  }))

  cache = {
    profile,
    workoutLogs,
    runningLogs,
    customExercises,
    routines,
    activeRoutineId,
    foodEntries,
    chatHistory,
    billing,
    userId,
    hydrated: true,
  }
  notify()
  return cache
}

// Vacía el caché — usar al cerrar sesión
export function clearCache() {
  cache = emptyState()
  notify()
}

// --- 4. API PÚBLICA SÍNCRONA -----------------------------------

export function loadData(): AppData {
  return cache
}

export function getUserId(): string | null {
  return cache.userId
}

// Helper: log de errores. Envuelve con Promise.resolve porque el query builder
// de Supabase es "thenable" pero no un Promise real (no expone .catch directamente).
function fireAndForget(promise: PromiseLike<any>, label: string) {
  Promise.resolve(promise).then(
    undefined,
    (err) => console.error(`[store:${label}] error:`, err)
  )
}

// -- PERFIL: actualizar notification_prefs en el cache local (la persistencia
// remota la hace /api/notifications save-prefs) --
export function updateNotificationPrefsCache(prefs: import("./types").NotificationPrefs) {
  if (!cache.profile) return
  cache = { ...cache, profile: { ...cache.profile, notification_prefs: prefs } }
  notify()
}

// -- PERFIL --
export async function saveProfile(profile: UserProfile): Promise<void> {
  cache = { ...cache, profile }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  // Upsert para cubrir el caso (raro) en que el trigger no haya creado la fila.
  // Usamos await para garantizar que la escritura completó antes de que el componente
  // re-hidrate — evita el bug en mobile donde se veía el valor viejo tras guardar.
  const { error } = await supabase.from("profiles").upsert({
    user_id: cache.userId,
    name: profile.name ?? null,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    gender: profile.gender,
    goal: profile.goal,
    activity_level: profile.activityLevel ?? null,
    tdee: profile.tdee,
    protein: profile.protein,
    carbs: profile.carbs,
    fat: profile.fat,
    onboarded: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })

  if (error) {
    console.error("[store:saveProfile] error al guardar perfil:", error)
    // Si falló la escritura, re-hidratamos desde Supabase para no mostrar datos incorrectos
    if (cache.userId) await hydrate(cache.userId)
  }
}

// -- ENTRENAMIENTO --
export function addWorkoutLog(log: WorkoutLog) {
  cache = { ...cache, workoutLogs: [...cache.workoutLogs, log] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("workout_logs").insert({
      id: log.id,
      user_id: cache.userId,
      exercise_id: log.exerciseId,
      date: log.date,
      sets: log.sets,
    }),
    "addWorkoutLog"
  )
}

// -- RUNNING --
export function addRunningLog(log: RunningLog) {
  cache = { ...cache, runningLogs: [log, ...cache.runningLogs] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("running_logs").insert({
      id: log.id,
      user_id: cache.userId,
      date: log.date,
      distance_km: log.distanceKm,
      duration_sec: log.durationSec,
      pace_sec_km: log.paceSeckm,
      calories: log.calories ?? null,
      notes: log.notes ?? null,
      gps_path: log.gpsPath ?? null,
    }),
    "addRunningLog"
  )
}

export function updateRunningLog(log: RunningLog) {
  cache = { ...cache, runningLogs: cache.runningLogs.map(r => r.id === log.id ? log : r) }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("running_logs").update({
      distance_km: log.distanceKm,
      duration_sec: log.durationSec,
      pace_sec_km: log.paceSeckm,
      calories: log.calories ?? null,
      notes: log.notes ?? null,
    }).eq("id", log.id),
    "updateRunningLog"
  )
}

export function deleteRunningLog(id: string) {
  cache = { ...cache, runningLogs: cache.runningLogs.filter(r => r.id !== id) }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("running_logs").delete().eq("id", id),
    "deleteRunningLog"
  )
}

export function addCustomExercise(exercise: Exercise) {
  cache = { ...cache, customExercises: [...cache.customExercises, exercise] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("custom_exercises").insert({
      id: exercise.id,
      user_id: cache.userId,
      name: exercise.name,
      muscle_group: exercise.muscleGroup,
      video_placeholder: exercise.videoPlaceholder ?? null,
    }),
    "addCustomExercise"
  )
}

// -- RUTINAS --
export function saveRoutine(routine: WeeklyRoutine) {
  const existingIndex = cache.routines.findIndex((r) => r.id === routine.id)
  let newRoutines = [...cache.routines]
  if (existingIndex >= 0) newRoutines[existingIndex] = routine
  else newRoutines.push(routine)
  cache = { ...cache, routines: newRoutines }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("routines").upsert({
      id: routine.id,
      user_id: cache.userId,
      name: routine.name,
      days: routine.days,
      is_template: routine.isTemplate ?? false,
      updated_at: new Date().toISOString(),
    }),
    "saveRoutine"
  )
}

export function deleteRoutine(routineId: string) {
  const newRoutines = cache.routines.filter((r) => r.id !== routineId)
  const newActiveId = cache.activeRoutineId === routineId ? null : cache.activeRoutineId
  cache = { ...cache, routines: newRoutines, activeRoutineId: newActiveId }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("routines").delete().eq("id", routineId).eq("user_id", cache.userId),
    "deleteRoutine"
  )
  if (newActiveId !== cache.activeRoutineId) {
    fireAndForget(
      supabase.from("profiles").update({ active_routine_id: newActiveId }).eq("user_id", cache.userId),
      "deleteRoutine.activeId"
    )
  }
}

export function setActiveRoutine(routineId: string | null) {
  cache = { ...cache, activeRoutineId: routineId }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("profiles").update({ active_routine_id: routineId }).eq("user_id", cache.userId),
    "setActiveRoutine"
  )
}

// -- NUTRICIÓN --
export function addFoodEntry(entry: FoodEntry) {
  cache = { ...cache, foodEntries: [...cache.foodEntries, entry] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("food_entries").insert({
      id: entry.id,
      user_id: cache.userId,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      date: entry.date,
      grams: entry.grams ?? null,
      image: entry.image ?? null,
    }),
    "addFoodEntry"
  )
}

export function removeFoodEntry(id: string) {
  cache = { ...cache, foodEntries: cache.foodEntries.filter((e) => e.id !== id) }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("food_entries").delete().eq("id", id).eq("user_id", cache.userId),
    "removeFoodEntry"
  )
}

export function updateFoodEntry(id: string, updated: Partial<FoodEntry>) {
  cache = {
    ...cache,
    foodEntries: cache.foodEntries.map((e) => (e.id === id ? { ...e, ...updated } : e)),
  }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  // Construimos el objeto de update solo con los campos que llegaron.
  // Esto evita pisar columnas con `undefined` cuando el caller solo cambia un par de fields.
  const payload: Record<string, unknown> = {}
  if (updated.name      !== undefined) payload.name      = updated.name
  if (updated.calories  !== undefined) payload.calories  = updated.calories
  if (updated.protein   !== undefined) payload.protein   = updated.protein
  if (updated.carbs     !== undefined) payload.carbs     = updated.carbs
  if (updated.fat       !== undefined) payload.fat       = updated.fat
  if (updated.grams     !== undefined) payload.grams     = updated.grams
  if (updated.image     !== undefined) payload.image     = updated.image

  fireAndForget(
    supabase
      .from("food_entries")
      .update(payload)
      .eq("id", id)
      .eq("user_id", cache.userId),
    "updateFoodEntry"
  )
}

// -- CHAT IA --
export function addChatMessage(message: ChatMessage) {
  cache = { ...cache, chatHistory: [...cache.chatHistory, message] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("chat_messages").insert({
      id: message.id,
      user_id: cache.userId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }),
    "addChatMessage"
  )
}

export function clearChatHistory() {
  cache = { ...cache, chatHistory: [] }
  notify()

  if (!cache.userId) return
  const supabase = createClient()
  fireAndForget(
    supabase.from("chat_messages").delete().eq("user_id", cache.userId),
    "clearChatHistory"
  )
}

// -- BILLING / PLAN ---------------------------------------------
// El backend (route handlers) es la fuente de verdad para los contadores.
// El cliente puede consultar `getBilling()` después de cualquier acción que los modifique.

export function getBilling(): BillingState {
  return cache.billing
}

export function setBilling(b: Partial<BillingState>) {
  cache = { ...cache, billing: { ...cache.billing, ...b } }
  notify()
}

// Re-lee solo la fila profiles para refrescar plan + contadores
export async function refreshBilling(): Promise<BillingState> {
  if (!cache.userId) return cache.billing
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("plan, scan_count, scan_count_month, ai_message_count, ai_message_count_month, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, current_period_end, mp_preapproval_id, mp_subscription_status")
    .eq("user_id", cache.userId)
    .maybeSingle()
  if (data) {
    setBilling({
      plan: (data.plan ?? "free") as Plan,
      scanCount: data.scan_count ?? 0,
      scanCountMonth: data.scan_count_month ?? new Date().toISOString().slice(0, 7),
      aiMessageCount: data.ai_message_count ?? 0,
      aiMessageCountMonth: data.ai_message_count_month ?? new Date().toISOString().slice(0, 7),
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeSubscriptionStatus: data.stripe_subscription_status,
      currentPeriodEnd: data.current_period_end,
      mpPreapprovalId: data.mp_preapproval_id ?? null,
      mpSubscriptionStatus: data.mp_subscription_status ?? null,
    })
  }
  return cache.billing
}
