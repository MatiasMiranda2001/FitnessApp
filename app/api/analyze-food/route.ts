import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Verificamos la clave
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta API Key" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No hay imagen" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // CAMBIO IMPORTANTE: Usamos 'gemini-1.5-pro' que suele fallar menos
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
      Actúa como nutricionista. Analiza esta foto.
      Devuelve SOLO un JSON válido (sin markdown) con este formato:
      {
        "food_name": "Nombre corto",
        "calories": 100,
        "protein": 10,
        "carbs": 10,
        "fats": 5
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: file.type } },
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Limpieza
    const cleanedText = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error: any) {
    console.error("🔥 Error Gemini:", error);
    return NextResponse.json({ error: "Error analizando: " + error.message }, { status: 500 });
  }
}