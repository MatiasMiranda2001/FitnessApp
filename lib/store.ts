import type { AppData, UserProfile, WorkoutLog, FoodEntry, Exercise } from "./types"

const STORAGE_KEY = "fittrack-data"

function getDefaultData(): AppData {
  return {
    profile: null,
    workoutLogs: [],
    foodEntries: [],
    customExercises: [],
  }
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    return JSON.parse(raw)
  } catch {
    return getDefaultData()
  }
}

function saveData(data: AppData) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function saveProfile(profile: UserProfile) {
  const data = loadData()
  data.profile = profile
  saveData(data)
}

export function addWorkoutLog(log: WorkoutLog) {
  const data = loadData()
  data.workoutLogs.push(log)
  saveData(data)
}

export function addFoodEntry(entry: FoodEntry) {
  const data = loadData()
  data.foodEntries.push(entry)
  saveData(data)
}

export function removeFoodEntry(id: string) {
  const data = loadData()
  data.foodEntries = data.foodEntries.filter((e) => e.id !== id)
  saveData(data)
}

export function addCustomExercise(exercise: Exercise) {
  const data = loadData()
  data.customExercises.push(exercise)
  saveData(data)
}

export function calculateTDEE(
  gender: string,
  age: number,
  heightCm: number,
  weightKg: number
): number {
  // Mifflin-St Jeor Equation
  if (gender === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5) * 1.55
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161) * 1.55
}

export function calculateMacros(
  tdee: number,
  weightKg: number,
  goal: string
): { calories: number; protein: number; carbs: number; fats: number } {
  let calories: number
  if (goal === "cut") calories = Math.round(tdee - 500)
  else if (goal === "bulk") calories = Math.round(tdee + 300)
  else calories = Math.round(tdee)

  // Protein: 2.2g per kg
  const protein = Math.round(weightKg * 2.2)
  // Fats: 25% of calories
  const fats = Math.round((calories * 0.25) / 9)
  // Carbs: remaining calories
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)

  return { calories, protein, carbs, fats }
}

export function estimate1RM(weight: number, reps: number): number {
  // Epley formula
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}
