"use client"

import { useState, useEffect, useCallback } from "react"
import { Onboarding } from "@/components/onboarding"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { Dashboard } from "@/components/dashboard"
import { RoutineBuilder } from "@/components/routine-builder"
import { WorkoutTracker } from "@/components/workout-tracker"
import { NutritionTracker } from "@/components/nutrition-tracker"
import { AiCoach } from "@/components/ai-coach"
import { ProfileView } from "@/components/profile-view"
import type { UserProfile, WorkoutLog, FoodEntry } from "@/lib/types"
import { loadData } from "@/lib/store"

export default function Page() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [loaded, setLoaded] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)

  const refreshData = useCallback(() => {
    const data = loadData()
    setProfile(data.profile)
    setWorkoutLogs(data.workoutLogs)
    setFoodEntries(data.foodEntries)
    setDataVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    refreshData()
    setLoaded(true)
  }, [refreshData])

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={(p) => {
          setProfile(p)
          refreshData()
        }}
      />
    )
  }

  function handleReset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fittrack-data")
    }
    setProfile(null)
    setWorkoutLogs([])
    setFoodEntries([])
    setActiveTab("dashboard")
    setDataVersion(0)
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg">
      {activeTab === "dashboard" && (
        <Dashboard
          profile={profile}
          workoutLogs={workoutLogs}
          foodEntries={foodEntries}
        />
      )}
      {activeTab === "routine" && (
        <RoutineBuilder
          dataVersion={dataVersion}
          onUpdate={refreshData}
          onStartWorkout={(exerciseId) => {
            setActiveTab("dashboard")
            requestAnimationFrame(() => setActiveTab("routine"))
          }}
        />
      )}
      {activeTab === "nutrition" && (
        <NutritionTracker
          profile={profile}
          foodEntries={foodEntries}
          onUpdate={refreshData}
        />
      )}
      {activeTab === "chat" && (
        <AiCoach dataVersion={dataVersion} onUpdate={refreshData} />
      )}
      {activeTab === "profile" && (
        <ProfileView
          profile={profile}
          workoutLogs={workoutLogs}
          onReset={handleReset}
        />
      )}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </main>
  )
}
