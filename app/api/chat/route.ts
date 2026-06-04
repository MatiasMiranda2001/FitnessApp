import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { checkAILimit, consumeAIMessage, getAuthedUserId } from "@/lib/limits";
import { FREE_LIMITS } from "@/lib/types";

export async function POST(req: Request) {
  try {
    // 1. Auth
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Límite de plan
    const limit = await checkAILimit(userId);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Has usado tus ${FREE_LIMITS.aiMessagesPerMonth} mensajes gratis con el coach este mes. Mejora a Pro para conversaciones ilimitadas.`,
          plan: limit.plan,
          used: limit.used,
          limit: limit.limit,
        },
        { status: 402 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta la API Key de Google en .env.local" },
        { status: 500 }
      );
    }

    const { messages, userContext } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No se enviaron mensajes" }, { status: 400 });
    }

    // 3. Construir contexto personalizado del usuario
    const ctx = userContext || {};

    const goalLabels: Record<string, string> = {
      cut:      "perder grasa (déficit calórico de ~500 kcal)",
      bulk:     "ganar músculo (superávit calórico de ~300 kcal)",
      maintain: "mantener peso y mejorar composición corporal",
    };

    const dietApproach: Record<string, string> = {
      cut:      "Dieta alta en proteína (2g/kg) para preservar músculo, carbohidratos moderados (preferentemente alrededor del entrenamiento), grasas saludables con moderación. Enfoque: déficit calórico sostenible.",
      bulk:     "Dieta alta en carbohidratos de calidad (arroz, avena, papa) como base energética para el entrenamiento y recuperación. Proteína alta (2g/kg) para síntesis muscular. Sin restricciones en grasas saludables. Superávit moderado para minimizar grasa acumulada.",
      maintain: "Dieta balanceada: ~40% carbos, ~30% proteína, ~30% grasas. Priorizá alimentos enteros y minimizá ultraprocesados. La proteína alta sigue siendo clave para la composición corporal.",
    };

    const userName = ctx.name ? `El usuario se llama ${ctx.name}.` : "";
    const physique = [ctx.weight && `Peso: ${ctx.weight}kg`, ctx.height && `Altura: ${ctx.height}cm`, ctx.age && `Edad: ${ctx.age} años`, ctx.gender && `Sexo: ${ctx.gender === "male" ? "masculino" : "femenino"}`].filter(Boolean).join(", ");
    const physiqueText = physique ? `Datos físicos: ${physique}.` : "";
    const goalText = ctx.goal
      ? `Su objetivo es ${goalLabels[ctx.goal] || ctx.goal}.`
      : "";
    const dietText = ctx.goal && dietApproach[ctx.goal]
      ? `ENFOQUE DIETARIO PARA SU OBJETIVO: ${dietApproach[ctx.goal]}`
      : "";

    const remainingProtein = (ctx.targetProtein ?? 0) - (ctx.todayProtein ?? 0)
    const remainingCarbs   = (ctx.targetCarbs   ?? 0) - (ctx.todayCarbs   ?? 0)
    const remainingFat     = (ctx.targetFat     ?? 0) - (ctx.todayFat     ?? 0)

    const nutritionText = ctx.targetCalories
      ? `NUTRICIÓN DE HOY: Consumió ${ctx.todayCalories ?? 0} kcal de ${ctx.targetCalories} kcal objetivo (${Math.round(((ctx.todayCalories ?? 0) / ctx.targetCalories) * 100)}%). Le quedan ${Math.max(0, ctx.targetCalories - (ctx.todayCalories ?? 0))} kcal para el día. Proteína: ${ctx.todayProtein ?? 0}g de ${ctx.targetProtein ?? 0}g (faltan ${Math.max(0, remainingProtein)}g). Carbos: ${ctx.todayCarbs ?? 0}g de ${ctx.targetCarbs ?? 0}g (faltan ${Math.max(0, remainingCarbs)}g). Grasas: ${ctx.todayFat ?? 0}g de ${ctx.targetFat ?? 0}g (faltan ${Math.max(0, remainingFat)}g).`
      : "Sin datos de nutrición de hoy.";

    const streakText =
      ctx.workoutStreak > 0
        ? `ENTRENAMIENTO: Lleva ${ctx.workoutStreak} día${ctx.workoutStreak > 1 ? "s" : ""} consecutivos entrenando (los fines de semana no cuentan para romperla). Sesiones esta semana: ${ctx.weeklyWorkouts ?? 0}.`
        : ctx.weeklyWorkouts > 0
        ? `ENTRENAMIENTO: Entrenó ${ctx.weeklyWorkouts} día${ctx.weeklyWorkouts > 1 ? "s" : ""} esta semana, pero la racha se rompió.`
        : "ENTRENAMIENTO: Aún no entrenó esta semana."

    const nutritionStreakText =
      ctx.nutritionStreak > 0
        ? `NUTRICIÓN RACHA: Lleva ${ctx.nutritionStreak} día${ctx.nutritionStreak > 1 ? "s" : ""} seguidos registrando sus 4 comidas. Hoy registró ${ctx.todayMealCount ?? 0} de 4 comidas.`
        : `NUTRICIÓN RACHA: Hoy registró ${ctx.todayMealCount ?? 0} de 4 comidas. Racha de registro: 0 días.`

    const todayWorkoutText = ctx.todayHasWorkout
      ? "Ya completó su sesión de hoy. 💪"
      : "Todavía no entrenó hoy.";

    const systemInstruction = `Sos RendiCoach, el entrenador personal IA de Rendi. Sos experto en ciencia del entrenamiento de fuerza y nutrición deportiva, al estilo Jeff Nippard: basado en evidencia, directo y sin vueltas.

DATOS ACTUALES DEL USUARIO:
${userName}
${physiqueText}
${goalText}
${dietText}
${nutritionText}
${streakText}
${nutritionStreakText}
${todayWorkoutText}

REGLAS DE COMPORTAMIENTO:
- Usá siempre los datos reales del usuario para personalizar cada respuesta. No des respuestas genéricas.
- Si el usuario pregunta cómo le fue, cómo van sus macros o su entrenamiento, respondé con los números concretos de arriba.
- Celebrá los logros y rachas de forma genuina pero sin exagerar. Una racha de varios días merece reconocimiento real.
- Si los macros van bien, decíselo específicamente. Si hay algo mejorable, decilo de forma constructiva.
- Para consejos de entrenamiento: basate en ciencia (volumen, frecuencia, progresión de carga, recuperación).
- Sé conciso: máximo 3-4 párrafos o bullets cortos. El usuario está en el teléfono.
- Tono: cálido y directo, como un amigo que sabe mucho de fitness. Sin frases motivacionales vacías.
- Solo respondés sobre fitness, nutrición, entrenamiento y recuperación. Para temas médicos, sugerís al doctor.
- Usá emojis con moderación 💪🔥.

GENERACIÓN DE RUTINAS:
Cuando el usuario pida explícitamente crear o diseñar una rutina de entrenamiento (ej: "haceme una rutina", "creame un plan", "armame una rutina de X días"), hacé lo siguiente:
1. Respondé normalmente explicando la rutina en texto.
2. Al FINAL de tu respuesta, agregá este bloque exacto (en una sola línea, sin saltos dentro del JSON):
<ROUTINE_JSON>{"name":"NOMBRE","days":[{"dayNumber":1,"label":"Día 1 - Nombre","exercises":[{"exerciseId":"ID","sets":N,"reps":"X-Y"}]}]}</ROUTINE_JSON>

IDs de ejercicios disponibles (usá SOLO estos):
squat, leg-press, romanian-deadlift, bulgarian-split-squat, quad-extension, hamstring-curl, lunges, calf-raise, hip-thrust, deadlift, pull-ups, lat-pulldown, barbell-row, dumbbell-row, cable-row, pullover-cable, bench-press, dumbbell-press, incline-bench, incline-barbell, dips, cable-fly, push-ups, overhead-press, dumbbell-shoulder-press, lateral-raises, face-pull, rear-delt-fly, bicep-curl-barbell, bicep-curl-dumbbell, hammer-curl, tricep-pushdown, skull-crushers, tricep-overhead, plank, leg-raises, ab-wheel, crunch, treadmill, cycling, elliptical, jump-rope

Reglas del JSON:
- "sets" número entero, "reps" string como "8-12" o "Al fallo"
- Días de descanso: "exercises": []
- El bloque <ROUTINE_JSON> debe estar en la última línea, sin texto después
- Si NO te piden crear una rutina, NO incluyas el bloque`.trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const conversationHistory = messages
      .map((m: any) => `${m.role === "user" ? "Usuario" : "Entrenador"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemInstruction}\n\nHistorial de conversación:\n${conversationHistory}\n\nEntrenador:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 4. Incrementar contador de mensajes
    const newCount = await consumeAIMessage(userId);

    return NextResponse.json({
      content: text,
      _usage: {
        plan: limit.plan,
        used: newCount,
        limit: limit.plan === "pro" ? -1 : FREE_LIMITS.aiMessagesPerMonth,
      },
    });
  } catch (error: any) {
    console.error("🔥 Error en API Chat:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
