// lib/types.ts

export type Gender = "male" | "female"
export type Goal = "cut" | "maintain" | "bulk"

// --- ENTRENAMIENTO ---
export interface WorkoutSet {
  weight: number
  reps: number
  rpe?: number
}

export interface WorkoutLog {
  id: string
  exerciseId: string
  date: string
  sets: WorkoutSet[]
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  videoPlaceholder?: string
  isCustom?: boolean
}

// --- PERFIL ---
export interface NotificationPrefs {
  enabled: boolean
  meals: {
    breakfast: { enabled: boolean; time: string }
    lunch:     { enabled: boolean; time: string }
    snack:     { enabled: boolean; time: string }
    dinner:    { enabled: boolean; time: string }
  }
  workout: { enabled: boolean; time: string }
}

export interface UserProfile {
  name?: string
  age: number
  weight: number
  height: number
  gender: Gender
  goal: Goal
  activityLevel?: string
  tdee: number
  protein: number
  carbs: number
  fat: number
  notification_prefs?: NotificationPrefs | null
}

// --- NUTRICIÓN ---
export interface FoodEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  date: string
  grams?: number   // Cantidad en gramos (opcional, informativo)
  image?: string   // Emoji asociado a la comida (ej: "🥩", "🍕")
}

// --- RUTINAS ---
export interface RoutineExercise {
  exerciseId: string
  sets: number | string
  reps: string
  rpe?: number
  weight?: number      // Peso sugerido en kg (opcional)
  customName?: string  // Nombre custom para ejercicios no en el catálogo
}

export interface RoutineDay {
  dayNumber: number
  label: string
  exercises: RoutineExercise[]
}

export interface WeeklyRoutine {
  id: string
  name: string
  days: RoutineDay[]
  isTemplate?: boolean
}

// --- CHAT IA (CORREGIDO) ---
export interface ChatMessage {
  id: string;        // ¡Agregado!
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ¡Agregado!
}

// --- BILLING / PLAN ---
export type Plan = "free" | "pro"

export interface BillingState {
  plan: Plan
  scanCount: number
  scanCountMonth: string         // formato YYYY-MM
  aiMessageCount: number
  aiMessageCountMonth: string    // formato YYYY-MM
  // Stripe
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripeSubscriptionStatus?: string | null
  currentPeriodEnd?: string | null
  // Mercado Pago
  mpPreapprovalId?: string | null
  mpSubscriptionStatus?: string | null
}

// Límites del plan free
export const FREE_LIMITS = {
  scansPerMonth: 5,
  aiMessagesPerMonth: 20,
} as const

// --- RUNNING ---
export interface GpsPoint {
  lat: number
  lng: number
  ts: number // timestamp ms
}

export interface RunningLog {
  id: string
  date: string          // YYYY-MM-DD
  distanceKm: number
  durationSec: number
  paceSeckm: number     // segundos por km
  calories?: number
  notes?: string
  gpsPath?: GpsPoint[]
}

// --- ESTADO GLOBAL ---
export interface AppData {
  profile: UserProfile | null
  workoutLogs: WorkoutLog[]
  runningLogs: RunningLog[]
  customExercises: Exercise[]
  routines: WeeklyRoutine[]
  activeRoutineId: string | null
  foodEntries: FoodEntry[]
  chatHistory: ChatMessage[]
  billing: BillingState
  userId: string | null
  hydrated: boolean
}