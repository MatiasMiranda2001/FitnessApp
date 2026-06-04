"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dumbbell, Target, TrendingUp, Flame, AlertTriangle, ChevronLeft, Scale, Info, TrendingDown } from "lucide-react"
import type { Gender, Goal, UserProfile } from "@/lib/types"
import { calculateTDEE, calculateMacros, saveProfile } from "@/lib/store"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  // Pasos: 
  // 0: Bienvenida
  // 1: Perfil (Edad, Peso, Altura)
  // 2: Objetivo
  const [step, setStep] = useState(0)
  
  const [gender, setGender] = useState<Gender>("male")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [goal, setGoal] = useState<Goal>("maintain")
  const [showWarning, setShowWarning] = useState(false)

  // --- LÓGICA DE NEGOCIO ---
  function getWarning(): string | null {
    const w = Number.parseFloat(weightKg)
    if (!w) return null
    if (goal === "cut" && w < 50) {
      return "Tu peso ya es bajo. Una fase de definición podría ser riesgosa. Considera mantenimiento o volumen."
    }
    if (goal === "bulk" && w > 120) {
      return "Con tu peso actual, un superávit calórico podría no ser lo ideal. Considera primero una fase de definición."
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

    const tdeeCalc = calculateTDEE(gender, ageNum, heightNum, weightNum)
    const macros = calculateMacros(tdeeCalc, weightNum, goal)

    // CREACIÓN DEL PERFIL (CORREGIDO Y EXPLÍCITO)
    // Asignamos cada campo manualmente para evitar errores de TypeScript
    const profile: UserProfile = {
      name: name.trim() || undefined,
      gender: gender,
      age: ageNum,
      height: heightNum,
      weight: weightNum,
      goal: goal,
      tdee: Math.round(tdeeCalc),
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat
    }

    saveProfile(profile)
    onComplete(profile)
  }

  // --- PASO 0: BIENVENIDA ---
  if (step === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Rendi</h1>
            <p className="mt-2 text-muted-foreground">
              Entrenamiento y nutrición basados en ciencia
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-left text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border">
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
              <span>Nutrición de precisión con macros</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full max-w-xs text-base font-bold h-12 rounded-xl"
            size="lg"
            onClick={() => setStep(1)}
          >
            Comenzar
          </Button>
        </div>
      </div>
    )
  }

  // --- PASO 1: DATOS PERSONALES ---
  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col px-6 pt-12 pb-6 animate-in slide-in-from-right">
        {/* Header simple */}
        <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => setStep(0)} className="-ml-2 rounded-full">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1 mx-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-primary rounded-full"></div>
            </div>
            <div className="w-8" /> 
        </div>

        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Tu Perfil</h2>
            <p className="text-lg text-muted-foreground">
              Necesitamos estos datos para calibrar tu plan.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Nombre <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                className="h-12 bg-card border-border rounded-xl"
                type="text"
                placeholder="¿Cómo te llaman?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Género</Label>
              <Select value={gender} onValueChange={(v: Gender) => setGender(v)}>
                <SelectTrigger className="h-12 bg-card border-border rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <Label className="text-sm font-medium mb-1.5 block">Edad</Label>
                <Input
                    className="h-12 bg-card border-border rounded-xl"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                />
                </div>
                <div>
                <Label className="text-sm font-medium mb-1.5 block">Altura (cm)</Label>
                <Input
                    className="h-12 bg-card border-border rounded-xl"
                    type="number"
                    placeholder="175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                />
                </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Peso (kg)</Label>
              <Input
                className="h-12 bg-card border-border rounded-xl"
                type="number"
                placeholder="80"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                size="lg"
                disabled={!age || !heightCm || !weightKg}
                onClick={() => setStep(2)}
            >
                Continuar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- PASO 2: OBJETIVO ---
  const warning = getWarning()
  
  const goalOptions = [
    {
      id: "cut",
      title: "Perder peso",
      description: "Quemar grasa y definir",
      icon: TrendingDown,
      colorClass: "bg-green-100 dark:bg-green-900/30 text-green-600",
      detail: {
        emoji: "🔥",
        headline: "Tu objetivo: Definición / Pérdida de grasa",
        items: [
          { icon: "🍽️", label: "Dieta", text: "Déficit de ~500 kcal/día. Base en proteína alta (pollo, huevo, atún) para preservar músculo. Carbohidratos moderados alrededor del entreno (avena, arroz integral). Pocas grasas saturadas." },
          { icon: "🏋️", label: "Entrenamiento", text: "Pesas 3–5x/semana para no perder músculo. Cardio opcional (HIIT o caminata) para acelerar el déficit." },
          { icon: "📉", label: "Progreso", text: "Espera perder 0.5–1 kg/semana. Más rápido puede significar pérdida de músculo." },
        ]
      }
    },
    {
      id: "maintain",
      title: "Mantener peso",
      description: "Comer sano y mantenerte",
      icon: Scale,
      colorClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-500",
      detail: {
        emoji: "⚖️",
        headline: "Tu objetivo: Mantenimiento / Composición corporal",
        items: [
          { icon: "🍽️", label: "Dieta", text: "Calorías de mantenimiento. Balance equilibrado: 40% carbos, 30% proteína, 30% grasas. Priorizá alimentos enteros y proteína alta para recomposición." },
          { icon: "🏋️", label: "Entrenamiento", text: "Pesas 3–4x/semana combinando fuerza y algo de cardio. El objetivo es rendimiento y bienestar a largo plazo." },
          { icon: "📊", label: "Progreso", text: "El peso se mantiene pero podés mejorar la composición corporal gradualmente (más músculo, menos grasa)." },
        ]
      }
    },
    {
      id: "bulk",
      title: "Ganar músculo",
      description: "Fuerza y volumen",
      icon: Dumbbell,
      colorClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-500",
      detail: {
        emoji: "💪",
        headline: "Tu objetivo: Volumen / Ganancia muscular",
        items: [
          { icon: "🍽️", label: "Dieta", text: "Superávit de ~300 kcal/día. Alta en carbohidratos (arroz, papa, avena, pan integral) para energía y recuperación. Proteína 2g/kg de peso. Grasas saludables sin restricción." },
          { icon: "🏋️", label: "Entrenamiento", text: "Pesas 4–6x/semana. Enfocate en ejercicios compuestos: sentadilla, press de banca, peso muerto, dominadas. Progresión de carga cada semana." },
          { icon: "📈", label: "Progreso", text: "Espera ganar 0.5–2 kg/mes. La ganancia muscular real es lenta — la consistencia es clave." },
        ]
      }
    }
  ] as const

  return (
    <div className="flex min-h-screen flex-col px-6 pt-12 pb-6 animate-in slide-in-from-right">
       {/* HEADER */}
       <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="-ml-2 rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 mx-4 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="w-full h-full bg-primary rounded-full transition-all duration-500"></div>
          </div>
          <div className="w-8" />
       </div>

       <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-3 tracking-tight">¿Cuál es tu objetivo?</h1>
            <p className="text-muted-foreground text-lg">
                Usaremos esto para personalizar tu plan de nutrición y metas diarias.
            </p>
          </div>

          <div className="space-y-3">
            {goalOptions.map((option) => {
                const isSelected = goal === option.id
                const Icon = option.icon

                return (
                <div key={option.id} className="space-y-0">
                  <button
                      onClick={() => {
                          setGoal(option.id as Goal)
                          setShowWarning(false)
                      }}
                      className={cn(
                      "w-full flex items-center p-5 border-2 transition-all duration-200 text-left relative group",
                      isSelected
                          ? "border-primary bg-primary/5 shadow-sm rounded-t-2xl rounded-b-none"
                          : "border-border hover:border-primary/50 bg-card rounded-2xl"
                      )}
                  >
                      <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mr-4 transition-colors shrink-0",
                      option.colorClass
                      )}>
                      <Icon className="h-8 w-8" />
                      </div>

                      <div className="flex-1">
                      <h3 className="font-bold text-lg">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>

                      <div className={cn(
                      "w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors shrink-0",
                      isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-current rounded-full" />}
                      </div>
                  </button>

                  {/* Panel explicativo que aparece al seleccionar */}
                  {isSelected && (
                    <div className="border-2 border-t-0 border-primary bg-primary/5 rounded-b-2xl px-5 pb-5 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-sm font-bold text-primary mb-3">{option.detail.emoji} {option.detail.headline}</p>
                      <div className="space-y-3">
                        {option.detail.items.map((item) => (
                          <div key={item.label} className="flex gap-3">
                            <span className="text-base shrink-0">{item.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase tracking-wide">{item.label}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )
            })}
          </div>

          {/* Advertencias IA */}
          {showWarning && warning && (
            <div className="mt-6 p-4 border border-yellow-500/40 bg-yellow-500/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-yellow-500">Recomendación IA</p>
                    <p className="text-sm text-yellow-500/80 leading-relaxed mt-1">{warning}</p>
                    <p className="text-xs text-muted-foreground mt-2">Pulsa "Continuar" de nuevo si estás seguro.</p>
                </div>
            </div>
          )}

          {!showWarning && (
            <div className="mt-8 p-4 bg-secondary/50 rounded-xl flex items-start gap-3">
                <Info className="text-muted-foreground h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                Puedes cambiar tu objetivo en cualquier momento desde los ajustes de perfil.
                </p>
            </div>
          )}

          <div className="mt-auto pt-8 pb-4">
            <Button 
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={handleSubmit}
            >
                {showWarning ? "Continuar de todos modos" : "Continuar"}
            </Button>
          </div>
       </div>
    </div>
  )
}