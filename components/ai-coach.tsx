"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, UserIcon, Trash2 } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { addChatMessage, loadData } from "@/lib/store"

interface AiCoachProps {
  dataVersion: number
  onUpdate: () => void
}

function generateResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  const offTopicKeywords = [
    "política", "clima", "noticias", "película", "deporte",
    "fútbol", "trabajo", "dinero", "viaje", "amor",
  ]
  if (offTopicKeywords.some((kw) => msg.includes(kw))) {
    return "Solo puedo ayudarte con temas de entrenamiento y nutrición. ¿Tienes alguna pregunta sobre tu rutina, ejercicios o dieta?"
  }

  if ((msg.includes("hombro") || msg.includes("shoulder")) && (msg.includes("press") || msg.includes("dolor") || msg.includes("duele"))) {
    return "El dolor de hombro en press de banca suele deberse a mala retracción escapular o un agarre demasiado ancho. Recomendaciones:\n\n1. **Retracción escapular**: Junta las escápulas y mantenlas apretadas durante todo el movimiento.\n2. **Arco torácico**: Un ligero arco reduce el estrés en el hombro.\n3. **Agarre**: Prueba un agarre ligeramente más cerrado.\n4. **Calentamiento**: Haz rotaciones externas con banda antes de empezar.\n5. Si el dolor persiste, consulta a un profesional de salud."
  }

  if (msg.includes("rpe") || msg.includes("rir") || msg.includes("intensidad")) {
    return "El RPE (Rate of Perceived Exertion) mide qué tan cerca estás del fallo muscular:\n\n- **RPE 10**: Fallo total, 0 repeticiones en reserva\n- **RPE 9**: Podrías hacer 1 más\n- **RPE 8**: Podrías hacer 2 más\n- **RPE 7**: Podrías hacer 3 más\n\nPara hipertrofia, Jeff Nippard recomienda trabajar entre RPE 7-9 en la mayoría de series. Reserva el RPE 10 solo para series top de fuerza ocasionalmente."
  }

  if (msg.includes("progres") || msg.includes("sobrecarga") || msg.includes("estancado") || msg.includes("meseta")) {
    return "La sobrecarga progresiva es el principio más importante para ganar músculo. Estrategias:\n\n1. **Añadir peso**: Incrementos pequeños (1-2.5 kg) cuando puedas completar todas las reps con buen RPE.\n2. **Más repeticiones**: Si no puedes subir peso, añade 1-2 reps.\n3. **Más series**: Añade una serie extra por semana (periodización de volumen).\n4. **Mejor técnica**: Reducir el momentum cuenta como progreso.\n5. **Deload**: Si llevas +6 semanas sin progreso, haz una semana de descarga al 50-60%."
  }

  if (msg.includes("proteína") || msg.includes("proteina") || msg.includes("protein")) {
    return "La ciencia actual recomienda entre 1.6-2.2g de proteína por kg de peso corporal para maximizar la síntesis proteica muscular. Puntos clave:\n\n- **Distribución**: 4-5 comidas con 30-40g de proteína cada una.\n- **Timing**: La ventana anabólica es más amplia de lo que se creía (4-6 horas).\n- **Fuentes completas**: Pollo, pescado, huevos, lácteos, legumbres + cereal.\n- **Suplementos**: Whey protein es conveniente post-entreno pero no es esencial si llegas con comida real."
  }

  if (msg.includes("creatina") || msg.includes("suplemento")) {
    return "La creatina monohidrato es el suplemento con más evidencia científica:\n\n- **Dosis**: 3-5g diarios (no necesitas fase de carga).\n- **Timing**: Cualquier momento del día.\n- **Beneficios**: +5-10% de fuerza, mejor recuperación, beneficios cognitivos.\n- **Seguridad**: Completamente segura a largo plazo según la evidencia.\n\nOtros suplementos útiles: cafeína (pre-entreno), vitamina D, omega-3."
  }

  if (msg.includes("definición") || msg.includes("definicion") || msg.includes("perder grasa") || msg.includes("déficit") || msg.includes("deficit") || msg.includes("cortar")) {
    return "Para una fase de definición efectiva:\n\n1. **Déficit moderado**: 300-500 kcal bajo tu TDEE.\n2. **Proteína alta**: 2.2-2.5g/kg para preservar músculo.\n3. **Entrenamiento pesado**: NO reduzcas pesos, mantén la intensidad.\n4. **Cardio moderado**: 2-3 sesiones de 20-30 min, preferiblemente LISS.\n5. **Paciencia**: 0.5-1% de peso corporal por semana es un ritmo óptimo.\n6. **Diet breaks**: Cada 8-12 semanas, sube a mantenimiento 1-2 semanas."
  }

  if (msg.includes("volumen") || msg.includes("ganar músculo") || msg.includes("ganar musculo") || msg.includes("superávit") || msg.includes("superavit") || msg.includes("bulk")) {
    return "Para una fase de volumen limpio:\n\n1. **Superávit controlado**: +200-300 kcal sobre tu TDEE.\n2. **Proteína**: 1.8-2.2g/kg es suficiente.\n3. **Carbohidratos altos**: Son tu combustible para entrenar fuerte.\n4. **Entrenamiento progresivo**: Enfoque en sobrecarga progresiva.\n5. **Ganancia esperada**: 0.5-1kg/mes para intermedios.\n6. **Monitoreo**: Si ganas más de 1.5kg/mes, probablemente estás acumulando grasa innecesaria."
  }

  if (msg.includes("descanso") || msg.includes("sueño") || msg.includes("dormir") || msg.includes("recuperación") || msg.includes("recuperacion")) {
    return "La recuperación es cuando realmente creces. Claves:\n\n1. **Sueño**: 7-9 horas por noche es lo ideal.\n2. **Frecuencia**: 48-72 horas entre sesiones del mismo grupo muscular.\n3. **Deload**: Cada 4-6 semanas de entrenamiento intenso.\n4. **Estrés**: El cortisol elevado afecta la recuperación muscular.\n5. **Nutrición post-entreno**: Proteína + carbohidratos dentro de las 2-3 horas siguientes."
  }

  return "Buena pregunta. Como entrenador basado en ciencia, te recomiendo:\n\n1. Entrénate con una intensidad de RPE 7-9 en la mayoría de series.\n2. Prioriza ejercicios compuestos (sentadilla, peso muerto, press).\n3. Come suficiente proteína (2.2g/kg).\n4. Duerme 7-9 horas.\n5. Sé consistente, el progreso lleva tiempo.\n\n¿Tienes alguna pregunta más específica sobre tu entrenamiento o nutrición?"
}

export function AiCoach({ dataVersion, onUpdate }: AiCoachProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Re-read messages from localStorage when dataVersion changes
  const storedMessages = useMemo(() => loadData().chatMessages, [dataVersion])
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(storedMessages)

  // Sync local messages when stored messages change (e.g. after clear)
  useEffect(() => {
    setLocalMessages(storedMessages)
  }, [storedMessages])

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
    "¿Qué es RPE y cómo usarlo?",
    "Me duele el hombro en press banca",
    "¿Cuánta proteína necesito?",
    "¿Cómo romper una meseta?",
  ]

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrenador IA</h1>
          <p className="text-xs text-muted-foreground">
            Solo respuestas sobre entrenamiento y nutrición
          </p>
        </div>
        {localMessages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            <Trash2 className="mr-1 h-3 w-3" /> Limpiar
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {localMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Chat con Entrenador</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pregúntame sobre entrenamiento, nutrición o suplementación
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
