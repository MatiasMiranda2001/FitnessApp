"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dumbbell, Target, TrendingUp, Flame, AlertTriangle } from "lucide-react"
import type { Gender, Goal, UserProfile } from "@/lib/types"
import { calculateTDEE, calculateMacros, saveProfile } from "@/lib/store"

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [gender, setGender] = useState<Gender>("male")
  const [age, setAge] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [goal, setGoal] = useState<Goal>("maintain")
  const [showWarning, setShowWarning] = useState(false)

  function getWarning(): string | null {
    const w = Number.parseFloat(weightKg)
    if (!w) return null
    if (goal === "cut" && w < 50) {
      return "Tu peso ya es bajo. Una fase de definici\u00f3n podr\u00eda ser riesgosa. Considera mantenimiento o volumen."
    }
    if (goal === "bulk" && w > 120) {
      return "Con tu peso actual, un superav\u00edt cal\u00f3rico podr\u00eda no ser lo ideal. Considera primero una fase de definici\u00f3n."
    }
    return null
  }

  function handleSubmit() {
    const ageNum = Number.parseInt(age)
    const heightNum = Number.parseFloat(heightCm)
    const weightNum = Number.parseFloat(weightKg)

    if (!ageNum || !heightNum || !weightNum) return

    const warning = getWarning()
    if (warning && !showWarning) {
      setShowWarning(true)
      return
    }

    const tdee = calculateTDEE(gender, ageNum, heightNum, weightNum)
    const macros = calculateMacros(tdee, weightNum, goal)

    const profile: UserProfile = {
      gender,
      age: ageNum,
      heightCm: heightNum,
      weightKg: weightNum,
      goal,
      tdee: Math.round(tdee),
      ...macros,
    }

    saveProfile(profile)
    onComplete(profile)
  }

  const goalLabels: Record<Goal, string> = {
    cut: "Definici\u00f3n",
    maintain: "Mantenimiento",
    bulk: "Volumen",
  }

  const goals: { value: Goal; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "cut",
      label: "Definici\u00f3n",
      desc: "Perder grasa, preservar m\u00fasculo",
      icon: <Flame className="h-5 w-5" />,
    },
    {
      value: "maintain",
      label: "Mantenimiento",
      desc: "Mantener peso actual",
      icon: <Target className="h-5 w-5" />,
    },
    {
      value: "bulk",
      label: "Volumen",
      desc: "Ganar m\u00fasculo y fuerza",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  if (step === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">FitTrack Pro</h1>
            <p className="mt-2 text-muted-foreground">
              Entrenamiento y nutrici\u00f3n basados en ciencia
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-left text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span>Seguimiento de sobrecarga progresiva</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span>Control de calidad por RPE/RIR</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <span>Nutrici\u00f3n de precisi\u00f3n con macros personalizados</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full max-w-xs text-base font-semibold"
            size="lg"
            onClick={() => setStep(1)}
          >
            Comenzar
          </Button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Paso 1 de 2
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Tu Perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usamos estos datos para calcular tus objetivos
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <Label className="text-sm text-muted-foreground">G\u00e9nero</Label>
              <Select value={gender} onValueChange={(v: Gender) => setGender(v)}>
                <SelectTrigger className="mt-1.5 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Edad</Label>
              <Input
                className="mt-1.5 bg-secondary"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Altura (cm)</Label>
              <Input
                className="mt-1.5 bg-secondary"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Peso (kg)</Label>
              <Input
                className="mt-1.5 bg-secondary"
                type="number"
                placeholder="80"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="mt-8 w-full font-semibold"
            size="lg"
            disabled={!age || !heightCm || !weightKg}
            onClick={() => setStep(2)}
          >
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  const warning = getWarning()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Paso 2 de 2
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">Tu Objetivo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esto determina tu objetivo cal\u00f3rico
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {goals.map((g) => (
            <Card
              key={g.value}
              className={`cursor-pointer transition-all ${
                goal === g.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
              onClick={() => {
                setGoal(g.value)
                setShowWarning(false)
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    goal === g.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {g.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{g.label}</p>
                  <p className="text-sm text-muted-foreground">{g.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Warning for unrealistic goals */}
        {showWarning && warning && (
          <Card className="mt-4 border-yellow-500/40 bg-yellow-500/10">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Advertencia IA</p>
                <p className="mt-1 text-xs text-yellow-300/80">{warning}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Pulsa de nuevo &quot;Calcular&quot; para continuar de todas formas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="mt-8 w-full font-semibold"
          size="lg"
          onClick={handleSubmit}
        >
          Calcular Mis Objetivos
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setStep(1)}
        >
          Atr\u00e1s
        </Button>
      </div>
    </div>
  )
}
