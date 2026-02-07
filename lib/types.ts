export type Gender = "male" | "female"
export type Goal = "cut" | "maintain" | "bulk"

export interface UserProfile {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  goal: Goal
  tdee: number
  protein: number
  carbs: number
  fats: number
  calories: number
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  videoPlaceholder?: string
  isCustom?: boolean
}

export interface WorkoutSet {
  weight: number
  reps: number
  rpe: number
}

export interface WorkoutLog {
  id: string
  exerciseId: string
  date: string
  sets: WorkoutSet[]
}

export interface FoodEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  date: string
}

export interface RoutineExercise {
  exerciseId: string
  sets: number
  reps: string // e.g. "8-12"
  rpe: number
}

export interface RoutineDay {
  dayNumber: number
  label: string // e.g. "Pierna", "Empuje"
  exercises: RoutineExercise[]
}

export interface WeeklyRoutine {
  id: string
  name: string
  days: RoutineDay[]
  isTemplate?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface AppData {
  profile: UserProfile | null
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
  customExercises: Exercise[]
  routines: WeeklyRoutine[]
  activeRoutineId: string | null
  chatMessages: ChatMessage[]
}
