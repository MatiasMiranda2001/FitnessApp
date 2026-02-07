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
import { Dumbbell, Target, TrendingUp, Flame } from "lucide-react"
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

  function handleSubmit() {
    const ageNum = Number.parseInt(age)
    const heightNum = Number.parseFloat(heightCm)
    const weightNum = Number.parseFloat(weightKg)

    if (!ageNum || !heightNum || !weightNum) return

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

  const goals: { value: Goal; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "cut",
      label: "Cut",
      desc: "Lose fat, preserve muscle",
      icon: <Flame className="h-5 w-5" />,
    },
    {
      value: "maintain",
      label: "Maintain",
      desc: "Stay at current weight",
      icon: <Target className="h-5 w-5" />,
    },
    {
      value: "bulk",
      label: "Bulk",
      desc: "Build muscle, gain strength",
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
              Science-based training and nutrition tracking
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-left text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span>Progressive overload tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span>RPE-based set quality tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <span>Precision nutrition with macro targets</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full max-w-xs text-base font-semibold"
            size="lg"
            onClick={() => setStep(1)}
          >
            Get Started
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
              Step 1 of 3
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">About You</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We use this to calculate your targets
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <Label className="text-sm text-muted-foreground">Gender</Label>
              <Select value={gender} onValueChange={(v: Gender) => setGender(v)}>
                <SelectTrigger className="mt-1.5 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Age</Label>
              <Input
                className="mt-1.5 bg-secondary"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Height (cm)</Label>
              <Input
                className="mt-1.5 bg-secondary"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Weight (kg)</Label>
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
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Step 2 of 3
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">Your Goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This determines your caloric target
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
              onClick={() => setGoal(g.value)}
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

        <Button
          className="mt-8 w-full font-semibold"
          size="lg"
          onClick={handleSubmit}
        >
          Calculate My Targets
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setStep(1)}
        >
          Back
        </Button>
      </div>
    </div>
  )
}
