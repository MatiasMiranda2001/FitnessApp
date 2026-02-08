// app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // Recibimos el mensaje del usuario
    const { message } = await req.json();

    // Usamos el modelo rápido
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    // Personalidad del Entrenador
    const chat = model.startChat({
      history: [], // Aquí podrías pasar el historial si quisieras memoria
      systemInstruction: {
        role: "system",
        parts: [{ text: "Eres un entrenador personal experto y nutricionista deportivo basado en ciencia (estilo Jeff Nippard). Responde dudas de gym, técnica y dieta. Sé breve, motivador y usa emojis. Si te preguntan de otra cosa, diles que vuelvan a entrenar." }]
      }
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor del chat" }, { status: 500 });
  }
}