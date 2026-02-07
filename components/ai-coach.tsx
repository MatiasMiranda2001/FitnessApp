"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, UserIcon, Trash2 } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { addChatMessage, loadData } from "@/lib/store"

interface AiCoachProps {
  onUpdate: () => void
}

// Simulated responses based on keyword matching (restricted to training + nutrition)
function generateResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  // Off-topic detection
  const offTopicKeywords = [
    "pol\u00edtica", "clima", "noticias", "pel\u00edcula", "deporte",
    "f\u00fatbol", "trabajo", "dinero", "viaje", "amor",
  ]
  if (offTopicKeywords.some((kw) => msg.includes(kw))) {
    return "Solo puedo ayudarte con temas de entrenamiento y nutrici\u00f3n. \u00bfTienes alguna pregunta sobre tu rutina, ejercicios o dieta?"
  }

  // Shoulder pain / press banca
  if ((msg.includes("hombro") || msg.includes("shoulder")) && (msg.includes("press") || msg.includes("dolor") || msg.includes("duele"))) {
    return "El dolor de hombro en press de banca suele deberse a mala retracci\u00f3n escapular o un agarre demasiado ancho. Recomendaciones:\n\n1. **Retracci\u00f3n escapular**: Junta las esc\u00e1pulas y mant\u00e9nlas apretadas durante todo el movimiento.\n2. **Arco tor\u00e1cico**: Un ligero arco reduce el estr\u00e9s en el hombro.\n3. **Agarre**: Prueba un agarre ligeramente m\u00e1s cerrado.\n4. **Calentamiento**: Haz rotaciones externas con banda antes de empezar.\n5. Si el dolor persiste, consulta a un profesional de salud."
  }

  // RPE / RIR
  if (msg.includes("rpe") || msg.includes("rir") || msg.includes("intensidad")) {
    return "El RPE (Rate of Perceived Exertion) mide qu\u00e9 tan cerca est\u00e1s del fallo muscular:\n\n- **RPE 10**: Fallo total, 0 repeticiones en reserva\n- **RPE 9**: Podr\u00edas hacer 1 m\u00e1s\n- **RPE 8**: Podr\u00edas hacer 2 m\u00e1s\n- **RPE 7**: Podr\u00edas hacer 3 m\u00e1s\n\nPara hipertrofia, Jeff Nippard recomienda trabajar entre RPE 7-9 en la mayor\u00eda de series. Reserva el RPE 10 solo para series top de fuerza ocasionalmente."
  }

  // Progressive overload
  if (msg.includes("progres") || msg.includes("sobrecarga") || msg.includes("estancado") || msg.includes("meseta")) {
    return "La sobrecarga progresiva es el principio m\u00e1s importante para ganar m\u00fasculo. Estrategias:\n\n1. **A\u00f1adir peso**: Incrementos peque\u00f1os (1-2.5 kg) cuando puedas completar todas las reps con buen RPE.\n2. **M\u00e1s repeticiones**: Si no puedes subir peso, a\u00f1ade 1-2 reps.\n3. **M\u00e1s series**: A\u00f1ade una serie extra por semana (periodizaci\u00f3n de volumen).\n4. **Mejor t\u00e9cnica**: Reducir el momentum cuenta como progreso.\n5. **Deload**: Si llevas +6 semanas sin progreso, haz una semana de descarga al 50-60%."
  }

  // Protein
  if (msg.includes("prote\u00edna") || msg.includes("protein")) {
    return "La ciencia actual recomienda entre 1.6-2.2g de prote\u00edna por kg de peso corporal para maximizar la s\u00edntesis proteica muscular. Puntos clave:\n\n- **Distribuci\u00f3n**: 4-5 comidas con 30-40g de prote\u00edna cada una.\n- **Timing**: La ventana anab\u00f3lica es m\u00e1s amplia de lo que se cre\u00eda (4-6 horas).\n- **Fuentes completas**: Pollo, pescado, huevos, l\u00e1cteos, legumbres + cereal.\n- **Suplementos**: Whey protein es conveniente post-entreno pero no es esencial si llegas con comida real."
  }

  // Creatine
  if (msg.includes("creatina") || msg.includes("suplemento")) {
    return "La creatina monohidrato es el suplemento con m\u00e1s evidencia cient\u00edfica:\n\n- **Dosis**: 3-5g diarios (no necesitas fase de carga).\n- **Timing**: Cualquier momento del d\u00eda.\n- **Beneficios**: +5-10% de fuerza, mejor recuperaci\u00f3n, beneficios cognitivos.\n- **Seguridad**: Completamente segura a largo plazo seg\u00fan la evidencia.\n\nOtros suplementos \u00fatiles: cafe\u00edna (pre-entreno), vitamina D, omega-3."
  }

  // Cutting / deficit
  if (msg.includes("definici\u00f3n") || msg.includes("perder grasa") || msg.includes("d\u00e9ficit") || msg.includes("cortar")) {
    return "Para una fase de definici\u00f3n efectiva:\n\n1. **D\u00e9ficit moderado**: 300-500 kcal bajo tu TDEE.\n2. **Prote\u00edna alta**: 2.2-2.5g/kg para preservar m\u00fasculo.\n3. **Entrenamiento pesado**: NO reduzcas pesos, mant\u00e9n la intensidad.\n4. **Cardio moderado**: 2-3 sesiones de 20-30 min, preferiblemente LISS.\n5. **Paciencia**: 0.5-1% de peso corporal por semana es un ritmo \u00f3ptimo.\n6. **Diet breaks**: Cada 8-12 semanas, sube a mantenimiento 1-2 semanas."
  }

  // Bulk / volumen
  if (msg.includes("volumen") || msg.includes("ganar m\u00fasculo") || msg.includes("super\u00e1vit") || msg.includes("bulk")) {
    return "Para una fase de volumen limpio:\n\n1. **Super\u00e1vit controlado**: +200-300 kcal sobre tu TDEE.\n2. **Prote\u00edna**: 1.8-2.2g/kg es suficiente.\n3. **Carbohidratos altos**: Son tu combustible para entrenar fuerte.\n4. **Entrenamiento progresivo**: Enfoque en sobrecarga progresiva.\n5. **Ganancia esperada**: 0.5-1kg/mes para intermedios.\n6. **Monitoreo**: Si ganas m\u00e1s de 1.5kg/mes, probablemente est\u00e1s acumulando grasa innecesaria."
  }

  // Sleep / recovery
  if (msg.includes("descanso") || msg.includes("sue\u00f1o") || msg.includes("dormir") || msg.includes("recuperaci\u00f3n")) {
    return "La recuperaci\u00f3n es cuando realmente creces. Claves:\n\n1. **Sue\u00f1o**: 7-9 horas por noche es lo ideal.\n2. **Frecuencia**: 48-72 horas entre sesiones del mismo grupo muscular.\n3. **Deload**: Cada 4-6 semanas de entrenamiento intenso.\n4. **Estr\u00e9s**: El cortisol elevado afecta la recuperaci\u00f3n muscular.\n5. **Nutrici\u00f3n post-entreno**: Prote\u00edna + carbohidratos dentro de las 2-3 horas siguientes."
  }

  // Default
  return "Buena pregunta. Como entrenador basado en ciencia, te recomiendo:\n\n1. Entr\u00e9nate con una intensidad de RPE 7-9 en la mayor\u00eda de series.\n2. Prioriza ejercicios compuestos (sentadilla, peso muerto, press).\n3. Come suficiente prote\u00edna (2.2g/kg).\n4. Duerme 7-9 horas.\n5. S\u00e9 consistente, el progreso lleva tiempo.\n\n\u00bfTienes alguna pregunta m\u00e1s espec\u00edfica sobre tu entrenamiento o nutrici\u00f3n?"
}

export function AiCoach({ onUpdate }: AiCoachProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = useMemo(() => loadData().chatMessages, [])
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages, isTyping])

  function handleSend() {
    if (!input.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    addChatMessage(userMsg)
    setLocalMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Simulate AI delay
    setTimeout(() => {
      const response = generateResponse(userMsg.content)
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      }
      addChatMessage(aiMsg)
      setLocalMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      onUpdate()
    }, 800 + Math.random() * 1200)
  }

  function handleClearChat() {
    if (typeof window !== "undefined") {
      const data = loadData()
      data.chatMessages = []
      localStorage.setItem("fittrack-data", JSON.stringify(data))
    }
    setLocalMessages([])
    onUpdate()
  }

  const suggestedQuestions = [
    "\u00bfQu\u00e9 es RPE y c\u00f3mo usarlo?",
    "Me duele el hombro en press banca",
    "\u00bfCu\u00e1nta prote\u00edna necesito?",
    "\u00bfC\u00f3mo romper una meseta?",
  ]

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrenador IA</h1>
          <p className="text-xs text-muted-foreground">
            Solo respuestas sobre entrenamiento y nutrici\u00f3n
          </p>
        </div>
        {localMessages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            <Trash2 className="mr-1 h-3 w-3" /> Limpiar
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {localMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Chat con Entrenador</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Preg\u00fantame sobre entrenamiento, nutrici\u00f3n o suplementaci\u00f3n
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-xs"
                  onClick={() => {
                    setInput(q)
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {localMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "border-primary/30 bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="whitespace-pre-wrap text-sm text-foreground">
                      {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={`${msg.id}-${i}`} className="font-semibold">
                              {part.slice(2, -2)}
                            </strong>
                          )
                        }
                        return <span key={`${msg.id}-${i}`}>{part}</span>
                      })}
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <Card className="border-border bg-card">
                  <CardContent className="flex items-center gap-2 p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Escribiendo...</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <Input
          className="flex-1 bg-secondary"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isTyping}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
