import type {
  AppData,
  UserProfile,
  WorkoutLog,
  FoodEntry,
  Exercise,
  WeeklyRoutine,
  ChatMessage,
} from "./types"

const STORAGE_KEY = "fittrack-data"

function getDefaultData(): AppData {
  return {
    profile: null,
    workoutLogs: [],
    foodEntries: [],
    customExercises: [],
    routines: [],
    activeRoutineId: null,
    chatMessages: [],
  }
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    const parsed = JSON.parse(raw)
    return {
      ...getDefaultData(),
      ...parsed,
    }
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

export function saveRoutine(routine: WeeklyRoutine) {
  const data = loadData()
  const idx = data.routines.findIndex((r) => r.id === routine.id)
  if (idx >= 0) {
    data.routines[idx] = routine
  } else {
    data.routines.push(routine)
  }
  saveData(data)
}

export function deleteRoutine(id: string) {
  const data = loadData()
  data.routines = data.routines.filter((r) => r.id !== id)
  if (data.activeRoutineId === id) data.activeRoutineId = null
  saveData(data)
}

export function setActiveRoutine(id: string | null) {
  const data = loadData()
  data.activeRoutineId = id
  saveData(data)
}

export function addChatMessage(msg: ChatMessage) {
  const data = loadData()
  data.chatMessages.push(msg)
  saveData(data)
}

export function calculateTDEE(
  gender: string,
  age: number,
  heightCm: number,
  weightKg: number
): number {
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

  const protein = Math.round(weightKg * 2.2)
  const fats = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)

  return { calories, protein, carbs, fats }
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}
