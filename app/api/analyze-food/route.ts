import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { checkScanLimit, consumeScan, getAuthedUserId } from "@/lib/limits";
import { FREE_LIMITS } from "@/lib/types";

// Extrae el primer bloque {...} balanceado del texto, aunque Gemini lo envuelva
// en markdown, texto introductorio, o lo siga con comentarios.
function extractJsonObject(raw: string): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/```json|```/gi, "").trim()
  // Buscar el primer "{" y el último "}" — Gemini suele responder un solo objeto
  const first = cleaned.indexOf("{")
  const last  = cleaned.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) return null
  return cleaned.slice(first, last + 1)
}

async function callGemini(apiKey: string, base64Image: string, mimeType: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })
  const prompt = `
    Actúa como nutricionista experto en identificar productos alimenticios envasados de marca,
    además de comida casera/preparada. Analiza esta foto siguiendo estos pasos:

    1. IDENTIFICÁ QUÉ HAY EN LA FOTO:
       - Si es un producto envasado (paquete, caja, botella, wrapper), fijate si se ve el logo,
         la marca, el nombre del producto, colores y tipografía característicos del packaging
         (ej: "Oreo", "Granix", "Terrabusi", "Bagley", "Coca-Cola", "La Serenísima", etc.).
         Usá ese reconocimiento visual de marca aunque el texto esté parcialmente tapado o borroso.
       - Si en la foto se ve la tabla nutricional impresa en el paquete (valores por porción o
         por 100g) y es legible, PRIORIZÁ esos valores exactos por sobre cualquier estimación tuya.
       - Si es comida sin envase (plato casero, fruta, etc.), identificá los ingredientes y
         estimá la porción visible.

    2. ESTIMÁ LA CANTIDAD REAL VISIBLE en la foto (ej: "3 galletitas", "1 paquete completo",
       "200ml", "1 plato"), no asumas una porción estándar si en la imagen se ve una cantidad
       distinta.

    3. CALCULÁ los macros para ESA cantidad específica:
       - Si reconociste la marca y el producto exacto, usá los valores nutricionales reales
         conocidos de ese producto (los que figuran en su etiquetado oficial), ajustados a la
         cantidad visible.
       - Si no pudiste identificar la marca con certeza, estimá de forma conservadora basándote
         en productos similares de esa categoría.

    Devuelve SOLO un JSON válido (sin markdown, sin explicaciones, sin texto extra) con este
    formato exacto:
    {
      "food_name": "Marca + producto + cantidad, ej: Oreo Original (3 galletitas)",
      "calories": 100,
      "protein": 10,
      "carbs": 10,
      "fats": 5
    }
  `
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ])
  return result.response.text()
}

export async function POST(req: Request) {
  // 1. Auth
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Límite de plan
  const limit = await checkScanLimit(userId);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message: `Has usado tus ${FREE_LIMITS.scansPerMonth} escaneos gratis del mes. Mejora a Pro para escaneos ilimitados.`,
        plan: limit.plan,
        used: limit.used,
        limit: limit.limit,
      },
      { status: 402 } // Payment Required
    );
  }

  // 3. Verificamos la API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta API Key" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) return NextResponse.json({ error: "No hay imagen" }, { status: 400 });
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo no es una imagen" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    // === Llamada a Gemini con un retry simple en caso de rate limit / 5xx ===
    let text = ""
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        text = await callGemini(apiKey, base64Image, file.type)
        lastErr = null
        break
      } catch (err: unknown) {
        lastErr = err
        const code = (err as { status?: number; statusCode?: number })?.status
                   ?? (err as { status?: number; statusCode?: number })?.statusCode
        // Reintentar solo en rate limit (429) o errores transitorios (5xx)
        if (attempt < 2 && (code === 429 || (typeof code === "number" && code >= 500))) {
          await new Promise(r => setTimeout(r, 800 * attempt))
          continue
        }
        throw err
      }
    }
    if (lastErr) throw lastErr

    // === Parseo robusto del JSON que devuelve Gemini ===
    const jsonStr = extractJsonObject(text)
    if (!jsonStr) {
      console.error("🔥 Gemini no devolvió JSON parseable. Respuesta:", text.slice(0, 200))
      return NextResponse.json(
        { error: "El análisis no devolvió datos válidos. Probá con otra foto." },
        { status: 502 }
      )
    }

    let parsed: { food_name?: string; calories?: number; protein?: number; carbs?: number; fats?: number }
    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      console.error("🔥 JSON inválido de Gemini:", jsonStr.slice(0, 200))
      return NextResponse.json(
        { error: "No pudimos interpretar la respuesta del modelo. Probá de nuevo." },
        { status: 502 }
      )
    }

    // 4. Solo incrementamos el contador si Gemini respondió ok
    const newCount = await consumeScan(userId);

    return NextResponse.json({
      ...parsed,
      _usage: {
        plan: limit.plan,
        used: newCount,
        limit: limit.plan === "pro" ? -1 : FREE_LIMITS.scansPerMonth,
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number; message?: string }
    const code = err?.status ?? err?.statusCode
    const msg = err?.message ?? "Error desconocido"
    console.error("🔥 Error Gemini:", { code, msg })

    // Errores específicos para que el cliente pueda mostrar algo útil
    if (code === 429) {
      return NextResponse.json(
        { error: "Demasiados escaneos en poco tiempo. Esperá unos segundos y reintentá." },
        { status: 429 }
      )
    }
    if (code === 403 || /api[ _]?key/i.test(msg)) {
      return NextResponse.json(
        { error: "La API Key de Gemini no es válida. Revisá la configuración." },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "No pudimos analizar la imagen ahora. Probá de nuevo o cargá manualmente." },
      { status: 500 }
    );
  }
}
