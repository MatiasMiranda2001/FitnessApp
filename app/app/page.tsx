"use client"

import { useState } from "react"
import { Loader2, X, Bot } from "lucide-react"

// Componentes
import { Onboarding } from "@/components/onboarding"
import { BottomNav } from "@/components/bottom-nav"
import { Dashboard } from "@/components/dashboard"
import { RoutineBuilder } from "@/components/routine-builder"
import { WorkoutTracker } from "@/components/workout-tracker"
import { NutritionTracker } from "@/components/nutrition-tracker"
import { AiCoach } from "@/components/ai-coach"
import { ProfileView } from "@/components/profile-view"
import { ProgressScreen } from "@/components/progress-screen"
import { RunningTracker } from "@/components/running-tracker"

// Tipos y store
import type { RoutineDay } from "@/lib/types"
import { useSupabase } from "@/lib/supabase/provider"
import { useAppData } from "@/lib/hooks/use-store"

/** Devuelve hasta 2 iniciales a partir del nombre o email del usuario. */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    const a = parts[0]?.[0] ?? ""
    const b = parts[1]?.[0] ?? ""
    return (a + b).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

export default function AppPage() {
  const { user, loading, hydrated, signOut } = useSupabase()
  const data = useAppData()

  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  const [activeTab, setActiveTab]         = useState("dashboard")
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [activeSession, setActiveSession]       = useState<RoutineDay | null>(null)
  const [showRunning, setShowRunning]     = useState(false)
  const [coachOpen, setCoachOpen]         = useState(false)
  const [profileOpen, setProfileOpen]     = useState(false)
  const [scanTrigger, setScanTrigger]     = useState(0)

  /* ─── Guards ────────────────────────────────────────────── */
  if (!user || loading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!data.profile) {
    return <Onboarding onComplete={() => refreshData()} />
  }

  const isTraining = activeExerciseId !== null || activeSession !== null
  const initials   = getInitials(data.profile?.name, user.email)

  return (
    <main
      className="min-h-screen bg-background font-sans"
      style={{ paddingBottom: "calc(5rem + max(env(safe-area-inset-bottom), 8px))" }}
    >

      {/* ─── Workout tracker (pantalla completa mientras entrena) ─── */}
      {isTraining ? (
        <WorkoutTracker
          workoutLogs={data.workoutLogs}
          runningLogs={data.runningLogs}
          initialExerciseId={activeExerciseId}
          initialSession={activeSession}
          onLogAdded={refreshData}
          onBack={() => {
            if (confirm("¿Salir del entrenamiento? Se guardará lo que hayas completado.")) {
              setActiveExerciseId(null)
              setActiveSession(null)
            }
          }}
        />
      ) : (
        <>
          {/* ── Dashboard ─────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="p-4">
              <Dashboard
                dataVersion={dataVersion}
                onNavigate={(tab) => {
                  if (tab === "coach") setCoachOpen(true)
                  else setActiveTab(tab)
                }}
              />
            </div>
          )}

          {/* ── Rutinas / Entreno ─────────────────── */}
          {activeTab === "workout" && !showRunning && (
            <RoutineBuilder
              dataVersion={dataVersion}
              onUpdate={refreshData}
              onStartWorkout={(exerciseId) => setActiveExerciseId(exerciseId)}
              onStartSession={(day) => setActiveSession(day)}
              onShowRunning={() => setShowRunning(true)}
            />
          )}
          {activeTab === "workout" && showRunning && (
            <RunningTracker
              runningLogs={data.runningLogs}
              onBack={() => setShowRunning(false)}
              onUpdate={refreshData}
            />
          )}

          {/* ── Nutrición ─────────────────────────── */}
          {activeTab === "nutrition" && (
            <NutritionTracker
              profile={data.profile}
              foodEntries={data.foodEntries}
              onUpdate={refreshData}
              scanTrigger={scanTrigger}
            />
          )}

          {/* ── Progreso ──────────────────────────── */}
          {activeTab === "progress" && (
            <ProgressScreen
              workoutLogs={data.workoutLogs}
              foodEntries={data.foodEntries}
              profile={data.profile}
            />
          )}

        </>
      )}

      {/* ─── Bottom nav ────────────────────────────────────────── */}
      {!isTraining && (
        <BottomNav
          current={activeTab}
          onChange={(tab) => { setActiveTab(tab); setShowRunning(false) }}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenScan={() => setScanTrigger(v => v + 1)}
        />
      )}

      {/* ─── FAB — Coach IA ────────────────────────────────────── */}
      {!isTraining && !coachOpen && (
        <button
          onClick={() => setCoachOpen(true)}
          className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl active:scale-95 transition-all"
          style={{
            bottom: "calc(5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 14px)",
            right: "16px",
            background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
            boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
          }}
          aria-label="Abrir Coach IA"
        >
          <Bot className="h-6 w-6" />
          {/* Anillo pulsante */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)" }}
          />
        </button>
      )}

      {/* ─── Overlay: Coach IA ─────────────────────────────────── */}
      {coachOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)" }}
              >
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">Coach IA</span>
            </div>
            <button
              onClick={() => setCoachOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AiCoach dataVersion={dataVersion} onUpdate={refreshData} />
          </div>
        </div>
      )}

      {/* ─── Overlay: Perfil ───────────────────────────────────── */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)" }}
              >
                {initials}
              </div>
              <span className="font-semibold text-sm">Mi perfil</span>
            </div>
            <button
              onClick={() => setProfileOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProfileView
              profile={data.profile}
              workoutLogs={data.workoutLogs}
              foodEntries={data.foodEntries}
              onReset={async () => {
                if (confirm("¿Cerrar sesión?")) await signOut()
              }}
            />
          </div>
        </div>
      )}

    </main>
  )
}
