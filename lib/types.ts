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

export interface AppData {
  profile: UserProfile | null
  workoutLogs: WorkoutLog[]
  foodEntries: FoodEntry[]
  customExercises: Exercise[]
}
