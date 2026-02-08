"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Bot, UserIcon, Trash2, AlertCircle } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { addChatMessage, loadData } from "@/lib/store"

interface AiCoachProps {
  dataVersion: number
  onUpdate: () => void
}

export function AiCoach({ dataVersion, onUpdate }: AiCoachProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Cargar mensajes guardados
  const storedMessages = useMemo(() => loadData().chatMessages, [dataVersion])
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(storedMessages)

  // Sincronizar mensajes si se borran externamente
  useEffect(() => {
    setLocalMessages(storedMessages)
  }, [storedMessages])

  // Auto-scroll al fondo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages, isTyping])

  async function handleSend() {
    if (!input.trim() || isTyping) return

    // 1. Crear mensaje del usuario y mostrarlo inmediatamente
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
    onUpdate() // Actualizar estado global

    try {
      // 2. Preparar el historial para que Gemini tenga contexto
      // Google espera: role "user" o "model" y parts: [{text: "..."}]
      const historyForApi = localMessages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }))

      // 3. Llamar a TU propia API (la que creamos en route.ts)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyForApi,
        }),
      })

      if (!response.ok) throw new Error("Error de conexión con el entrenador")

      const data = await response.json()

      // 4. Crear mensaje de respuesta de la IA
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.text || "Hubo un error al procesar tu respuesta.",
        timestamp: new Date().toISOString(),
      }

      addChatMessage(aiMsg)
      setLocalMessages((prev) => [...prev, aiMsg])
      
    } catch (error) {
      console.error("Error en chat:", error)
      // Mensaje de error amigable
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "😓 El entrenador está ocupado (Error de conexión). Intenta de nuevo.",
        timestamp: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
      onUpdate()
    }
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
    "Arma una rutina de empuje (Push)",
  ]

  // Función simple para renderizar negritas (Markdown básico)
  const renderMessageContent = (content: string) => {
    return content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-primary">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> Entrenador IA
          </h1>
          <p className="text-xs text-muted-foreground">
            Experto en biomecánica y nutrición
          </p>
        </div>
        {localMessages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 text-xs text-red-400 hover:text-red-500">
            <Trash2 className="mr-1 h-3 w-3" /> Limpiar
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {localMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-4 opacity-80">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg text-foreground">¡Hola! Soy tu Coach.</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                Pregúntame sobre técnica, rutinas de Jeff Nippard, o dudas nutricionales.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {suggestedQuestions.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2 whitespace-normal text-left"
                  onClick={() => setInput(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          localMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border border-border text-card-foreground rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analizando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          className="flex-1 bg-background border-input focus-visible:ring-primary"
          placeholder="Escribe tu duda sobre gym..."
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
          className={!input.trim() ? "opacity-50" : ""}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}