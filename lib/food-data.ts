// lib/food-data.ts
// Base de datos curada de alimentos — foco en comida argentina y latinoamericana.
// Macros por 100g salvo que la porción indique lo contrario.
// Fuentes: USDA FoodData, FAO / LATINFOODS, tablas ANMAT Argentina.

export interface FoodItem {
  id: string
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  category: "proteina" | "carbohidrato" | "fruta" | "verdura" | "lacteo" | "postre" | "snack" | "bebida" | "otro" | "comida_arg"
  image?: string
}

const getFoodImage = (category: string): string => {
  switch (category) {
    case "proteina":     return "🥩"
    case "carbohidrato": return "🍚"
    case "fruta":        return "🍓"
    case "verdura":      return "🥦"
    case "lacteo":       return "🥛"
    case "postre":       return "🍰"
    case "snack":        return "🍿"
    case "bebida":       return "🥤"
    case "comida_arg":   return "🫕"
    default:             return "🍽️"
  }
}

// Emoji específico para cada plato argentino según palabras clave del nombre.
// IMPORTANTE: el orden importa. Los matches más específicos van PRIMERO,
// los más genéricos al final, para que "Salpicón de pollo" → ensalada (no pollo).
const getArgentinianFoodEmoji = (name: string): string => {
  const n = name.toLowerCase()

  // === 1. SOPAS Y CALDOS (antes que pollo/fideo) ===
  if (n.includes("sopa") || n.includes("caldo"))                      return "🍜"

  // === 2. GUISOS / CAZUELAS / ESTOFADOS (antes que carne/pollo) ===
  if (n.includes("locro") || n.includes("carbonada") || n.includes("puchero") ||
      n.includes("guiso") || n.includes("guisada") || n.includes("guisado") ||
      n.includes("cazuela") || n.includes("estofado") || n.includes("estofada") ||
      n.includes("mondongo") || n.includes("porotos"))                return "🍲"

  // === 3. WOK / SALPICÓN / ENSALADAS (antes que pollo) ===
  if (n.includes("wok"))                                              return "🥡"
  if (n.includes("ensalada") || n.includes("salpicón") || n.includes("verduras grilladas")) return "🥗"

  // === 4. TUCO / SALSAS (antes que carne) ===
  if (n.includes("tuco") || n.includes("salsa boloñesa"))             return "🍅"

  // === 5. CERDO AGRIDULCE (cocina asiática) ===
  if (n.includes("agridulce"))                                        return "🥡"

  // === 6.0 Bebidas líquidas (prioridad alta — el contenedor define) ===
  if (n.includes("smoothie") || n.includes("licuado") || n.includes("batido")) return "🥤"
  if (n.includes("mate cocido") || /^mate\b/.test(n))                 return "🧉"

  // === 6.1 Preparaciones con huevo (antes de tostada para "huevos con tostada") ===
  if (n.includes("huevos revueltos") || n.includes("huevo revuelto") ||
      n.includes("huevo frito") || n.includes("tortilla de huevo") ||
      n.includes("tortilla de 2 huevos"))                              return "🍳"

  // === 6.2 Sándwiches y panificados ===
  if (n.includes("medialuna"))                                        return "🥐"
  if (n.includes("panqueque") || n.includes("waffle"))                return "🥞"
  if (n.includes("choripán") || n.includes("chori al pan"))           return "🌭"
  if (n.includes("pancho") || n.includes("hot dog"))                  return "🌭"
  if (n.includes("hamburguesa") || n.includes("hamburgesa"))          return "🍔"
  if (n.includes("lomito"))                                           return "🥪"
  if (n.includes("tostado") || n.includes("sandwich") || n.includes("sándwich")) return "🥪"
  if (n.includes("café con leche") || n.includes("café"))             return "☕"

  // === 6.5 Desayunos: granola > yogur > avena > cereal > tostada ===
  // Granola/muesli van antes que yogur porque son el ingrediente más distintivo.
  if (n.includes("granola") || n.includes("muesli"))                  return "🥣"
  if (n.includes("yogur") || n.includes("yoghurt"))                   return "🥛"
  if (n.includes("avena") || n.includes("porridge") || n.includes("overnight oats")) return "🥣"
  if (n.includes("cereal") || n.includes("corn flakes") || n.includes("special k") ||
      n.includes("choco krispis") || n.includes("all bran") || n.includes("frosties") ||
      n.includes("granix") || n.includes("trix"))                    return "🥣"
  if (n.includes("tostada") || n.includes("pan tostado") || n.includes("pan con")) return "🍞"

  // === 7. Pizzas y derivados ===
  if (n.includes("pizza") || n.includes("fugazzeta") || n.includes("matambre a la pizza")) return "🍕"
  if (n.includes("fainá"))                                            return "🍕"

  // === 8. Empanadas ===
  if (n.includes("empanada"))                                         return "🥟"

  // === 9. Pastas ===
  if (n.includes("canelone") || n.includes("ravioles") || n.includes("sorrentino") ||
      n.includes("lasagna") || n.includes("lasaña") || n.includes("ñoqui") ||
      n.includes("fideo") || n.includes("fetuccini") || n.includes("fetuchini") ||
      n.includes("spaghetti") || n.includes("espagueti"))             return "🍝"
  if (n.includes("risotto"))                                          return "🍚"

  // === 10. Maíz / polenta ===
  if (n.includes("humita") || n.includes("tamal") || n.includes("polenta")) return "🌽"

  // === 11. Quesos y huevos ===
  if (n.includes("provoleta"))                                        return "🧀"
  if (n.includes("revuelto") || n.includes("tortilla de papa") || n.includes("a caballo")) return "🍳"

  // === 12. Tartas y pasteles salados ===
  if (n.includes("tarta") || n.includes("pascualina") || n.includes("pastel de papa")) return "🥧"

  // === 13. Pescados ===
  if (n.includes("pescado") || n.includes("salmón") || n.includes("atún"))           return "🐟"

  // === 14. Pollo (incluye milanesa de pollo) ===
  if (n.includes("pollo") || n.includes("suprema") || n.includes("milanesa de pollo")) return "🍗"

  // === 15. Milanesas y carnes empanadas ===
  if (n.includes("cordero"))                                          return "🍖"
  if (n.includes("milanesa"))                                         return "🍖"
  if (n.includes("albóndiga"))                                        return "🍖"

  // === 16. Carnes a la parrilla y cortes ===
  if (n.includes("asado") || n.includes("vacío") || n.includes("costilla") ||
      n.includes("entraña") || n.includes("bife") || n.includes("lomo") ||
      n.includes("chorizo") || n.includes("morcilla") || n.includes("matambre") ||
      n.includes("peceto") || n.includes("cuadril") || n.includes("bondiola") ||
      n.includes("molleja") || n.includes("chinchulín") || n.includes("osobuco") ||
      n.includes("escalope") || n.includes("brochette"))              return "🥩"

  // === 17. Papas ===
  if (n.includes("croqueta"))                                         return "🥔"
  if (n.includes("papas frita"))                                      return "🍟"
  if (n.includes("papas"))                                            return "🥔"

  // === 18. Dulces / arroces ===
  if (n.includes("arroz con leche"))                                  return "🍚"

  return "🫕"
}

// Helper público: extrae los gramos del string de porción de un FoodItem.
// Ejemplos: "1 unidad (90g)" → 90, "100g" → 100, "1 plato (300g)" → 300,
// "1 taza (250ml)" → null (no son gramos), "1 unidad" → null.
export function extractGramsFromPortion(portion: string | undefined): number | undefined {
  if (!portion) return undefined
  // Buscar patrón con paréntesis primero: "(NNNg)"
  const paren = portion.match(/\((\d+(?:\.\d+)?)\s*g\)/i)
  if (paren) return parseFloat(paren[1])
  // Sino, patrón directo "NNNg" (al inicio o solo)
  const direct = portion.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*g(?:\b|$)/i)
  if (direct) return parseFloat(direct[1])
  return undefined
}

// Helper público: detecta el emoji apropiado a partir del nombre de la comida,
// sin necesidad de categoría. Útil para comidas registradas manualmente o desde IA scan.
// Primero busca match exacto en la base de datos (FOOD_DATABASE), si no encuentra,
// usa heurística por keywords (incluye toda la lógica argentina + categorías generales).
export function getEmojiForFoodName(name: string): string {
  if (!name) return "🍽️"

  // 1) Match exacto en la base
  const exact = FOOD_DATABASE.find(f => f.name.toLowerCase() === name.toLowerCase())
  if (exact?.image) return exact.image

  // 2) Heurística argentina (sirve para muchos platos en general)
  const argEmoji = getArgentinianFoodEmoji(name)
  if (argEmoji !== "🫕") return argEmoji

  // 3) Heurística por keywords de categoría general
  const n = name.toLowerCase()
  if (n.match(/manzana|banana|pera|uva|frutilla|naranja|kiwi|durazno|sandía|melón|ananá|piña|mango|frambuesa|arándano|mora/)) return "🍓"
  if (n.match(/lechuga|tomate|zanahoria|brócoli|coliflor|espinaca|pepino|cebolla|ajo|morrón|zapallo|verdura|berenjena|acelga|repollo|rúcula/)) return "🥦"
  if (n.match(/leche|yogur|queso|ricota|kéfir|lácteo|crema/)) return "🥛"
  if (n.match(/torta|alfajor|helado|brownie|bizcochuelo|flan|budín|postre|chocolate|galletita|dulce|mermelada/)) return "🍰"
  if (n.match(/papa frita|chizito|palito|maní|nuez|almendra|pochoclo|popcorn|snack|cheetos/)) return "🍿"
  if (n.match(/agua|jugo|gaseosa|cerveza|vino|café|té|mate|bebida|infusión|smoothie|batido/)) return "🥤"
  if (n.match(/pollo|pavo/)) return "🍗"
  if (n.match(/carne|res|ternera|vaca/)) return "🥩"
  if (n.match(/pescado|atún|salmón|merluza|trucha/)) return "🐟"
  if (n.match(/huevo/)) return "🍳"
  if (n.match(/arroz|quinoa|trigo|avena|cereal/)) return "🍚"
  if (n.match(/pan|tostada/)) return "🍞"

  return "🍽️"
}

const rawItems = [
  { id: "arg1", name: "Milanesa de carne", portion: "1 unidad (120g)", calories: 280, protein: 24, carbs: 14, fat: 14, category: "comida_arg" },
  { id: "arg2", name: "Milanesa a la napolitana", portion: "1 unidad (150g)", calories: 380, protein: 26, carbs: 16, fat: 22, category: "comida_arg" },
  { id: "arg3", name: "Milanesa de pollo", portion: "1 unidad (120g)", calories: 245, protein: 26, carbs: 12, fat: 11, category: "comida_arg" },
  { id: "arg4", name: "Empanada de carne (frita)", portion: "1 unidad (90g)", calories: 250, protein: 11, carbs: 22, fat: 13, category: "comida_arg" },
  { id: "arg5", name: "Empanada de carne (al horno)", portion: "1 unidad (90g)", calories: 210, protein: 11, carbs: 22, fat: 9, category: "comida_arg" },
  { id: "arg6", name: "Empanada de pollo", portion: "1 unidad (90g)", calories: 195, protein: 12, carbs: 21, fat: 8, category: "comida_arg" },
  { id: "arg7", name: "Empanada de jamón y queso", portion: "1 unidad (90g)", calories: 230, protein: 10, carbs: 20, fat: 13, category: "comida_arg" },
  { id: "arg8", name: "Empanada de humita", portion: "1 unidad (90g)", calories: 200, protein: 6, carbs: 27, fat: 8, category: "comida_arg" },
  { id: "arg9", name: "Asado de tira", portion: "100g", calories: 290, protein: 26, carbs: 0, fat: 20, category: "comida_arg" },
  { id: "arg10", name: "Vacío a la parrilla", portion: "100g", calories: 250, protein: 27, carbs: 0, fat: 16, category: "comida_arg" },
  { id: "arg11", name: "Costilla de cerdo a la parrilla", portion: "100g", calories: 290, protein: 24, carbs: 0, fat: 21, category: "comida_arg" },
  { id: "arg12", name: "Chori al pan", portion: "1 unidad completa", calories: 430, protein: 18, carbs: 30, fat: 27, category: "comida_arg" },
  { id: "arg13", name: "Chorizo parrillero", portion: "1 unidad (90g)", calories: 320, protein: 16, carbs: 2, fat: 28, category: "comida_arg" },
  { id: "arg14", name: "Morcilla", portion: "1 unidad (90g)", calories: 290, protein: 14, carbs: 3, fat: 25, category: "comida_arg" },
  { id: "arg15", name: "Entraña", portion: "100g", calories: 270, protein: 26, carbs: 0, fat: 18, category: "comida_arg" },
  { id: "arg16", name: "Bife de lomo", portion: "100g", calories: 215, protein: 29, carbs: 0, fat: 11, category: "comida_arg" },
  { id: "arg17", name: "Bife de chorizo", portion: "100g", calories: 250, protein: 26, carbs: 0, fat: 16, category: "comida_arg" },
  { id: "arg18", name: "Matambre a la pizza", portion: "100g", calories: 260, protein: 23, carbs: 6, fat: 16, category: "comida_arg" },
  { id: "arg19", name: "Locro", portion: "1 plato (300g)", calories: 420, protein: 22, carbs: 45, fat: 15, category: "comida_arg" },
  { id: "arg20", name: "Carbonada", portion: "1 plato (300g)", calories: 380, protein: 20, carbs: 40, fat: 14, category: "comida_arg" },
  { id: "arg21", name: "Guiso de lentejas", portion: "1 plato (300g)", calories: 340, protein: 18, carbs: 45, fat: 10, category: "comida_arg" },
  { id: "arg22", name: "Guiso de arroz con pollo", portion: "1 plato (300g)", calories: 360, protein: 22, carbs: 42, fat: 10, category: "comida_arg" },
  { id: "arg23", name: "Puchero", portion: "1 plato (350g)", calories: 400, protein: 28, carbs: 32, fat: 16, category: "comida_arg" },
  { id: "arg24", name: "Humita en chala", portion: "1 unidad (150g)", calories: 190, protein: 5, carbs: 30, fat: 6, category: "comida_arg" },
  { id: "arg25", name: "Tamales", portion: "1 unidad (120g)", calories: 220, protein: 9, carbs: 28, fat: 9, category: "comida_arg" },
  { id: "arg26", name: "Pizza muzzarella (porción)", portion: "1 porción (120g)", calories: 285, protein: 12, carbs: 33, fat: 12, category: "comida_arg" },
  { id: "arg27", name: "Fugazzeta", portion: "1 porción (130g)", calories: 310, protein: 13, carbs: 34, fat: 14, category: "comida_arg" },
  { id: "arg28", name: "Fainá", portion: "1 porción (80g)", calories: 190, protein: 7, carbs: 22, fat: 8, category: "comida_arg" },
  { id: "arg29", name: "Provoleta", portion: "100g", calories: 360, protein: 23, carbs: 2, fat: 30, category: "comida_arg" },
  { id: "arg30", name: "Revuelto gramajo", portion: "1 porción (200g)", calories: 420, protein: 22, carbs: 18, fat: 30, category: "comida_arg" },
  { id: "arg31", name: "Suprema de pollo", portion: "1 unidad (130g)", calories: 310, protein: 28, carbs: 12, fat: 16, category: "comida_arg" },
  { id: "arg32", name: "Sándwich de milanesa", portion: "1 unidad completo", calories: 580, protein: 32, carbs: 50, fat: 25, category: "comida_arg" },
  { id: "arg33", name: "Choripán", portion: "1 unidad", calories: 430, protein: 18, carbs: 30, fat: 27, category: "comida_arg" },
  { id: "arg34", name: "Pancho (hot dog)", portion: "1 unidad", calories: 310, protein: 12, carbs: 28, fat: 16, category: "comida_arg" },
  { id: "arg35", name: "Tortilla de papas", portion: "1 porción (120g)", calories: 220, protein: 10, carbs: 18, fat: 12, category: "comida_arg" },
  { id: "arg36", name: "Tarta de jamón y queso", portion: "1 porción (120g)", calories: 310, protein: 12, carbs: 22, fat: 19, category: "comida_arg" },
  { id: "arg37", name: "Tarta de verdura", portion: "1 porción (120g)", calories: 260, protein: 9, carbs: 24, fat: 15, category: "comida_arg" },
  { id: "arg38", name: "Canelones de ricota y espinaca", portion: "2 unidades (200g)", calories: 340, protein: 15, carbs: 32, fat: 16, category: "comida_arg" },
  { id: "arg39", name: "Ravioles de carne", portion: "200g con salsa", calories: 420, protein: 20, carbs: 45, fat: 16, category: "comida_arg" },
  { id: "arg40", name: "Ñoquis de papa", portion: "200g", calories: 260, protein: 7, carbs: 52, fat: 3, category: "comida_arg" },
  { id: "arg41", name: "Fideos con tuco", portion: "1 plato (300g)", calories: 380, protein: 15, carbs: 55, fat: 10, category: "comida_arg" },
  { id: "arg42", name: "Fideos con pesto", portion: "1 plato (250g)", calories: 450, protein: 14, carbs: 52, fat: 20, category: "comida_arg" },
  { id: "arg43", name: "Sorrentinos de jamón y queso", portion: "6 unidades (200g)", calories: 440, protein: 18, carbs: 48, fat: 18, category: "comida_arg" },
  { id: "arg44", name: "Polenta", portion: "100g cocida", calories: 70, protein: 2, carbs: 14, fat: 0.5, category: "comida_arg" },
  { id: "arg45", name: "Polenta con queso y salsa", portion: "1 plato (300g)", calories: 380, protein: 14, carbs: 42, fat: 16, category: "comida_arg" },
  { id: "arg46", name: "Pascualina", portion: "1 porción (120g)", calories: 240, protein: 10, carbs: 20, fat: 14, category: "comida_arg" },
  { id: "arg47", name: "Sopa de verduras", portion: "1 plato (300ml)", calories: 80, protein: 3, carbs: 14, fat: 1, category: "comida_arg" },
  { id: "arg48", name: "Cazuela de pollo", portion: "1 plato (300g)", calories: 320, protein: 26, carbs: 22, fat: 14, category: "comida_arg" },
  { id: "arg49", name: "Pescado al horno con papas", portion: "1 porción (280g)", calories: 320, protein: 28, carbs: 28, fat: 8, category: "comida_arg" },
  { id: "arg50", name: "Tuco de carne (salsa boloñesa)", portion: "100g", calories: 130, protein: 9, carbs: 8, fat: 7, category: "comida_arg" },
  { id: "p1", name: "Pechuga de pollo", portion: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6, category: "proteina" },
  { id: "p2", name: "Muslo de pollo sin piel", portion: "100g", calories: 177, protein: 25, carbs: 0, fat: 8, category: "proteina" },
  { id: "p3", name: "Pata de pollo sin piel", portion: "100g", calories: 165, protein: 24, carbs: 0, fat: 7, category: "proteina" },
  { id: "p4", name: "Pollo entero asado", portion: "100g", calories: 215, protein: 25, carbs: 0, fat: 12, category: "proteina" },
  { id: "p5", name: "Carne molida 5% grasa", portion: "100g", calories: 137, protein: 21, carbs: 0, fat: 5, category: "proteina" },
  { id: "p6", name: "Carne molida 20% grasa", portion: "100g", calories: 215, protein: 19, carbs: 0, fat: 15, category: "proteina" },
  { id: "p7", name: "Salmón", portion: "100g", calories: 208, protein: 20, carbs: 0, fat: 13, category: "proteina" },
  { id: "p8", name: "Atún en agua", portion: "100g", calories: 96, protein: 21, carbs: 0, fat: 1, category: "proteina" },
  { id: "p9", name: "Atún en aceite", portion: "100g", calories: 185, protein: 20, carbs: 0, fat: 11, category: "proteina" },
  { id: "p10", name: "Merluza", portion: "100g", calories: 82, protein: 18, carbs: 0, fat: 1, category: "proteina" },
  { id: "p11", name: "Lenguado", portion: "100g", calories: 91, protein: 19, carbs: 0, fat: 1.5, category: "proteina" },
  { id: "p12", name: "Trucha", portion: "100g", calories: 141, protein: 20, carbs: 0, fat: 6, category: "proteina" },
  { id: "p13", name: "Huevo entero", portion: "1 unidad grande", calories: 72, protein: 6, carbs: 0.4, fat: 5, category: "proteina" },
  { id: "p14", name: "Clara de huevo", portion: "1 unidad", calories: 17, protein: 3.6, carbs: 0.2, fat: 0, category: "proteina" },
  { id: "p15", name: "Protein Whey", portion: "30g scoop", calories: 120, protein: 24, carbs: 3, fat: 1, category: "proteina" },
  { id: "p16", name: "Proteína vegana (guisante)", portion: "30g scoop", calories: 115, protein: 22, carbs: 4, fat: 2, category: "proteina" },
  { id: "p17", name: "Tofu firme", portion: "100g", calories: 144, protein: 17, carbs: 3, fat: 8, category: "proteina" },
  { id: "p18", name: "Tempeh", portion: "100g", calories: 193, protein: 19, carbs: 10, fat: 11, category: "proteina" },
  { id: "p19", name: "Lentejas cocidas", portion: "100g", calories: 116, protein: 9, carbs: 20, fat: 0.4, category: "proteina" },
  { id: "p20", name: "Garbanzos cocidos", portion: "100g", calories: 164, protein: 9, carbs: 27, fat: 3, category: "proteina" },
  { id: "p21", name: "Porotos negros cocidos", portion: "100g", calories: 132, protein: 9, carbs: 24, fat: 0.5, category: "proteina" },
  { id: "p22", name: "Porotos colorados cocidos", portion: "100g", calories: 127, protein: 9, carbs: 23, fat: 0.5, category: "proteina" },
  { id: "p23", name: "Chuleta de cerdo", portion: "100g", calories: 231, protein: 24, carbs: 0, fat: 14, category: "proteina" },
  { id: "p24", name: "Lomo de cerdo", portion: "100g", calories: 189, protein: 25, carbs: 0, fat: 9, category: "proteina" },
  { id: "p25", name: "Salchicha de Viena", portion: "1 unidad (50g)", calories: 135, protein: 5, carbs: 1, fat: 12, category: "proteina" },
  { id: "p26", name: "Jamón cocido", portion: "1 feta (30g)", calories: 35, protein: 5, carbs: 0.5, fat: 1.5, category: "proteina" },
  { id: "p27", name: "Jamón crudo / serrano", portion: "1 feta (30g)", calories: 70, protein: 7, carbs: 0, fat: 5, category: "proteina" },
  { id: "p28", name: "Carne de cerdo magra", portion: "100g", calories: 180, protein: 26, carbs: 0, fat: 8, category: "proteina" },
  { id: "p29", name: "Hígado de res", portion: "100g", calories: 135, protein: 21, carbs: 4, fat: 4, category: "proteina" },
  { id: "p30", name: "Langostinos", portion: "100g", calories: 85, protein: 18, carbs: 1, fat: 1, category: "proteina" },
  { id: "c1", name: "Arroz blanco cocido", portion: "100g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: "carbohidrato" },
  { id: "c2", name: "Arroz integral cocido", portion: "100g", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, category: "carbohidrato" },
  { id: "c3", name: "Pasta cocida (spaghetti)", portion: "100g", calories: 131, protein: 5, carbs: 25, fat: 1, category: "carbohidrato" },
  { id: "c4", name: "Pasta integral cocida", portion: "100g", calories: 124, protein: 5, carbs: 23, fat: 1, category: "carbohidrato" },
  { id: "c5", name: "Avena cruda", portion: "40g", calories: 150, protein: 5, carbs: 27, fat: 3, category: "carbohidrato" },
  { id: "c6", name: "Papa cocida", portion: "100g", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, category: "carbohidrato" },
  { id: "c7", name: "Papa al horno", portion: "100g", calories: 93, protein: 2.5, carbs: 21, fat: 0.1, category: "carbohidrato" },
  { id: "c8", name: "Papas fritas caseras", portion: "100g", calories: 312, protein: 3.4, carbs: 41, fat: 15, category: "carbohidrato" },
  { id: "c9", name: "Batata / Camote", portion: "100g", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: "carbohidrato" },
  { id: "c10", name: "Pan francés / marraqueta", portion: "1 unidad (50g)", calories: 130, protein: 4, carbs: 25, fat: 0.8, category: "carbohidrato" },
  { id: "c11", name: "Pan lactal blanco", portion: "1 rebanada (25g)", calories: 65, protein: 2, carbs: 12, fat: 1, category: "carbohidrato" },
  { id: "c12", name: "Pan lactal integral", portion: "1 rebanada (25g)", calories: 60, protein: 3, carbs: 11, fat: 1, category: "carbohidrato" },
  { id: "c13", name: "Pan de campo / casero", portion: "1 rebanada (50g)", calories: 130, protein: 4, carbs: 25, fat: 1.5, category: "carbohidrato" },
  { id: "c14", name: "Galletitas de agua", portion: "4 unidades (20g)", calories: 90, protein: 2, carbs: 15, fat: 2.5, category: "carbohidrato" },
  { id: "c15", name: "Quinoa cocida", portion: "100g", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, category: "carbohidrato" },
  { id: "c16", name: "Polenta seca", portion: "100g", calories: 362, protein: 8, carbs: 76, fat: 2, category: "carbohidrato" },
  { id: "c17", name: "Harina de trigo 000", portion: "100g", calories: 364, protein: 10, carbs: 76, fat: 1, category: "carbohidrato" },
  { id: "c18", name: "Harina integral", portion: "100g", calories: 340, protein: 13, carbs: 70, fat: 2, category: "carbohidrato" },
  { id: "c19", name: "Maíz en grano cocido", portion: "100g", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, category: "carbohidrato" },
  { id: "c20", name: "Choclo en espiga (1/2)", portion: "1/2 espiga", calories: 88, protein: 3, carbs: 19, fat: 1, category: "carbohidrato" },
  { id: "c21", name: "Cuscús cocido", portion: "100g", calories: 112, protein: 3.8, carbs: 23, fat: 0.2, category: "carbohidrato" },
  { id: "c22", name: "Pan rallado", portion: "1 cucharada (15g)", calories: 56, protein: 2, carbs: 10, fat: 0.7, category: "carbohidrato" },
  { id: "c23", name: "Cereales desayuno (copos)", portion: "30g", calories: 113, protein: 2, carbs: 25, fat: 0.5, category: "carbohidrato" },
  { id: "c24", name: "Granola sin azúcar", portion: "40g", calories: 180, protein: 4.5, carbs: 23, fat: 8, category: "carbohidrato" },
  { id: "c25", name: "Tostada de trigo", portion: "1 unidad (10g)", calories: 40, protein: 1, carbs: 7, fat: 0.5, category: "carbohidrato" },
  { id: "f1", name: "Banana", portion: "1 unidad (120g)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, category: "fruta" },
  { id: "f2", name: "Manzana", portion: "1 unidad (180g)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: "fruta" },
  { id: "f3", name: "Naranja", portion: "1 unidad (130g)", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, category: "fruta" },
  { id: "f4", name: "Mandarina", portion: "1 unidad (90g)", calories: 47, protein: 0.7, carbs: 12, fat: 0.3, category: "fruta" },
  { id: "f5", name: "Frutillas", portion: "100g", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: "fruta" },
  { id: "f6", name: "Arándanos", portion: "100g", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, category: "fruta" },
  { id: "f7", name: "Palta / Aguacate", portion: "1/2 unidad (70g)", calories: 113, protein: 1.5, carbs: 6, fat: 10, category: "fruta" },
  { id: "f8", name: "Sandía", portion: "100g", calories: 30, protein: 0.6, carbs: 8, fat: 0.2, category: "fruta" },
  { id: "f9", name: "Melón", portion: "100g", calories: 34, protein: 0.8, carbs: 8, fat: 0.2, category: "fruta" },
  { id: "f10", name: "Uvas", portion: "100g", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, category: "fruta" },
  { id: "f11", name: "Ananá / Piña", portion: "100g", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, category: "fruta" },
  { id: "f12", name: "Mango", portion: "100g", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, category: "fruta" },
  { id: "f13", name: "Durazno", portion: "1 unidad (150g)", calories: 58, protein: 1.4, carbs: 14, fat: 0.4, category: "fruta" },
  { id: "f14", name: "Pera", portion: "1 unidad (170g)", calories: 100, protein: 0.6, carbs: 27, fat: 0.2, category: "fruta" },
  { id: "f15", name: "Ciruela", portion: "1 unidad (65g)", calories: 30, protein: 0.5, carbs: 8, fat: 0.2, category: "fruta" },
  { id: "f16", name: "Kiwi", portion: "1 unidad (75g)", calories: 46, protein: 0.9, carbs: 11, fat: 0.4, category: "fruta" },
  { id: "f17", name: "Pomelo", portion: "1/2 unidad (120g)", calories: 52, protein: 0.9, carbs: 13, fat: 0.2, category: "fruta" },
  { id: "f18", name: "Limón", portion: "1 unidad (60g)", calories: 17, protein: 0.6, carbs: 5, fat: 0.2, category: "fruta" },
  { id: "f19", name: "Papaya / Mamón", portion: "100g", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, category: "fruta" },
  { id: "f20", name: "Higo", portion: "1 unidad (50g)", calories: 37, protein: 0.4, carbs: 9.6, fat: 0.1, category: "fruta" },
  { id: "f21", name: "Cereza", portion: "100g", calories: 63, protein: 1, carbs: 16, fat: 0.2, category: "fruta" },
  { id: "f22", name: "Frambuesas", portion: "100g", calories: 52, protein: 1.2, carbs: 12, fat: 0.7, category: "fruta" },
  { id: "f23", name: "Tomate cherry", portion: "100g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: "fruta" },
  { id: "v1", name: "Brócoli", portion: "100g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: "verdura" },
  { id: "v2", name: "Coliflor", portion: "100g", calories: 25, protein: 1.9, carbs: 5, fat: 0.3, category: "verdura" },
  { id: "v3", name: "Espinaca cruda", portion: "100g", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: "verdura" },
  { id: "v4", name: "Acelga", portion: "100g", calories: 19, protein: 1.8, carbs: 3.7, fat: 0.2, category: "verdura" },
  { id: "v5", name: "Zanahoria", portion: "100g", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, category: "verdura" },
  { id: "v6", name: "Tomate perita", portion: "100g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: "verdura" },
  { id: "v7", name: "Lechuga mantecosa", portion: "100g", calories: 13, protein: 1.4, carbs: 2.2, fat: 0.2, category: "verdura" },
  { id: "v8", name: "Cebolla", portion: "100g", calories: 40, protein: 1.1, carbs: 9, fat: 0.1, category: "verdura" },
  { id: "v9", name: "Cebolla de verdeo", portion: "100g", calories: 32, protein: 1.8, carbs: 7, fat: 0.2, category: "verdura" },
  { id: "v10", name: "Morrón rojo", portion: "100g", calories: 31, protein: 1, carbs: 7, fat: 0.3, category: "verdura" },
  { id: "v11", name: "Morrón verde", portion: "100g", calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, category: "verdura" },
  { id: "v12", name: "Zapallo anco", portion: "100g", calories: 26, protein: 1, carbs: 7, fat: 0, category: "verdura" },
  { id: "v13", name: "Zapallito redondo", portion: "100g", calories: 16, protein: 1.2, carbs: 3.4, fat: 0.2, category: "verdura" },
  { id: "v14", name: "Berenjena", portion: "100g", calories: 25, protein: 1, carbs: 6, fat: 0.2, category: "verdura" },
  { id: "v15", name: "Pepino", portion: "100g", calories: 15, protein: 0.6, carbs: 3.6, fat: 0.1, category: "verdura" },
  { id: "v16", name: "Apio", portion: "100g", calories: 16, protein: 0.7, carbs: 3, fat: 0.2, category: "verdura" },
  { id: "v17", name: "Champiñones", portion: "100g", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, category: "verdura" },
  { id: "v18", name: "Choclo desgranado", portion: "100g", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, category: "verdura" },
  { id: "v19", name: "Arveja", portion: "100g", calories: 81, protein: 5, carbs: 14, fat: 0.4, category: "verdura" },
  { id: "v20", name: "Chaucha", portion: "100g", calories: 31, protein: 1.8, carbs: 7, fat: 0.1, category: "verdura" },
  { id: "v21", name: "Remolacha", portion: "100g", calories: 43, protein: 1.6, carbs: 10, fat: 0.2, category: "verdura" },
  { id: "v22", name: "Rúcula", portion: "100g", calories: 25, protein: 2.6, carbs: 3.6, fat: 0.7, category: "verdura" },
  { id: "v23", name: "Repollo", portion: "100g", calories: 25, protein: 1.3, carbs: 6, fat: 0.1, category: "verdura" },
  { id: "v24", name: "Repollito de Bruselas", portion: "100g", calories: 43, protein: 3.4, carbs: 9, fat: 0.3, category: "verdura" },
  { id: "v25", name: "Ajo", portion: "1 diente (5g)", calories: 7, protein: 0.3, carbs: 1.5, fat: 0, category: "verdura" },
  { id: "v26", name: "Puerro", portion: "100g", calories: 61, protein: 1.5, carbs: 14, fat: 0.3, category: "verdura" },
  { id: "v27", name: "Nabo", portion: "100g", calories: 28, protein: 0.9, carbs: 6, fat: 0.1, category: "verdura" },
  { id: "v28", name: "Alcaucil / Alcachofa", portion: "100g", calories: 47, protein: 3.3, carbs: 11, fat: 0.2, category: "verdura" },
  { id: "v29", name: "Espárrago", portion: "100g", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, category: "verdura" },
  { id: "v30", name: "Berro", portion: "100g", calories: 11, protein: 2.3, carbs: 1.3, fat: 0.1, category: "verdura" },
  { id: "l1", name: "Leche entera", portion: "200ml", calories: 122, protein: 6, carbs: 10, fat: 6.4, category: "lacteo" },
  { id: "l2", name: "Leche descremada", portion: "200ml", calories: 70, protein: 6.8, carbs: 10, fat: 0.2, category: "lacteo" },
  { id: "l3", name: "Leche semi descremada", portion: "200ml", calories: 95, protein: 6.5, carbs: 10, fat: 3, category: "lacteo" },
  { id: "l4", name: "Yogur griego", portion: "150g", calories: 120, protein: 15, carbs: 6, fat: 4, category: "lacteo" },
  { id: "l5", name: "Yogur natural sin azúcar", portion: "200g", calories: 120, protein: 8, carbs: 13, fat: 3, category: "lacteo" },
  { id: "l6", name: "Yogur light", portion: "200g", calories: 75, protein: 7, carbs: 10, fat: 0.5, category: "lacteo" },
  { id: "l7", name: "Queso muzzarella", portion: "30g", calories: 85, protein: 6, carbs: 1, fat: 6, category: "lacteo" },
  { id: "l8", name: "Queso cremoso", portion: "30g", calories: 90, protein: 5, carbs: 1, fat: 7, category: "lacteo" },
  { id: "l9", name: "Queso port salut", portion: "30g", calories: 95, protein: 6, carbs: 0.5, fat: 7.5, category: "lacteo" },
  { id: "l10", name: "Queso cheddar", portion: "30g", calories: 115, protein: 7, carbs: 0.5, fat: 9.5, category: "lacteo" },
  { id: "l11", name: "Queso parmesano rallado", portion: "1 cda (10g)", calories: 43, protein: 4, carbs: 0.4, fat: 3, category: "lacteo" },
  { id: "l12", name: "Queso sardo", portion: "30g", calories: 115, protein: 7, carbs: 0, fat: 10, category: "lacteo" },
  { id: "l13", name: "Queso cottage", portion: "100g", calories: 98, protein: 11, carbs: 3, fat: 4, category: "lacteo" },
  { id: "l14", name: "Queso untable / Philadelphia", portion: "30g", calories: 89, protein: 2, carbs: 1, fat: 9, category: "lacteo" },
  { id: "l15", name: "Ricota", portion: "100g", calories: 136, protein: 9, carbs: 4, fat: 9, category: "lacteo" },
  { id: "l16", name: "Manteca", portion: "1 cda (14g)", calories: 100, protein: 0, carbs: 0, fat: 11, category: "lacteo" },
  { id: "l17", name: "Crema de leche", portion: "1 cda (15g)", calories: 51, protein: 0.4, carbs: 0.4, fat: 5.5, category: "lacteo" },
  { id: "l18", name: "Leche en polvo entera", portion: "25g", calories: 124, protein: 6.5, carbs: 9.5, fat: 6.5, category: "lacteo" },
  { id: "d1", name: "Alfajor de chocolate", portion: "1 unidad (70g)", calories: 270, protein: 4, carbs: 38, fat: 11, category: "postre" },
  { id: "d2", name: "Alfajor de maicena", portion: "1 unidad (50g)", calories: 210, protein: 2, carbs: 30, fat: 9, category: "postre" },
  { id: "d3", name: "Medialuna de manteca", portion: "1 unidad (50g)", calories: 185, protein: 3, carbs: 22, fat: 10, category: "postre" },
  { id: "d4", name: "Medialuna de grasa", portion: "1 unidad (45g)", calories: 165, protein: 3, carbs: 20, fat: 9, category: "postre" },
  { id: "d5", name: "Factura / Vigilante", portion: "1 unidad (60g)", calories: 215, protein: 4, carbs: 30, fat: 10, category: "postre" },
  { id: "d6", name: "Dulce de leche", portion: "1 cda (20g)", calories: 63, protein: 1.5, carbs: 11, fat: 1.5, category: "postre" },
  { id: "d7", name: "Dulce de membrillo", portion: "1 cda (20g)", calories: 58, protein: 0.3, carbs: 14, fat: 0, category: "postre" },
  { id: "d8", name: "Dulce de batata", portion: "1 cda (20g)", calories: 54, protein: 0.2, carbs: 13, fat: 0, category: "postre" },
  { id: "d9", name: "Chocolate negro 70%", portion: "20g", calories: 120, protein: 2, carbs: 9, fat: 8, category: "postre" },
  { id: "d10", name: "Chocolate con leche", portion: "25g", calories: 130, protein: 2, carbs: 15, fat: 7.5, category: "postre" },
  { id: "d11", name: "Helado de vainilla (bocha)", portion: "60g", calories: 125, protein: 2, carbs: 15, fat: 7, category: "postre" },
  { id: "d12", name: "Helado de chocolate (bocha)", portion: "60g", calories: 143, protein: 2.5, carbs: 18, fat: 7, category: "postre" },
  { id: "d13", name: "Chocotorta", portion: "1 porción (100g)", calories: 350, protein: 4, carbs: 40, fat: 18, category: "postre" },
  { id: "d14", name: "Torta de cumpleaños", portion: "1 porción (120g)", calories: 380, protein: 5, carbs: 50, fat: 18, category: "postre" },
  { id: "d15", name: "Galletitas Oreo", portion: "3 unidades (33g)", calories: 160, protein: 1.5, carbs: 22, fat: 7, category: "postre" },
  { id: "d16", name: "Galletitas rellenas", portion: "3 unidades (36g)", calories: 175, protein: 2, carbs: 24, fat: 8, category: "postre" },
  { id: "d17", name: "Galletitas de agua", portion: "4 unidades (20g)", calories: 90, protein: 2, carbs: 15, fat: 2.5, category: "postre" },
  { id: "d18", name: "Vainillas", portion: "2 unidades (20g)", calories: 78, protein: 2, carbs: 16, fat: 1, category: "postre" },
  { id: "d19", name: "Bizcocho de grasa", portion: "1 unidad (40g)", calories: 150, protein: 3, carbs: 18, fat: 8, category: "postre" },
  { id: "d20", name: "Churro", portion: "1 unidad (50g)", calories: 155, protein: 2, carbs: 20, fat: 7, category: "postre" },
  { id: "d21", name: "Flan con dulce de leche", portion: "1 unidad (150g)", calories: 230, protein: 6, carbs: 38, fat: 5, category: "postre" },
  { id: "d22", name: "Budín de pan", portion: "1 porción (100g)", calories: 260, protein: 7, carbs: 38, fat: 9, category: "postre" },
  { id: "d23", name: "Turrón de maní", portion: "1 unidad (30g)", calories: 135, protein: 3, carbs: 18, fat: 6, category: "postre" },
  { id: "s1", name: "Almendras", portion: "28g (puñado)", calories: 164, protein: 6, carbs: 6, fat: 14, category: "snack" },
  { id: "s2", name: "Nueces", portion: "28g (puñado)", calories: 185, protein: 4, carbs: 4, fat: 18, category: "snack" },
  { id: "s3", name: "Maní tostado salado", portion: "28g", calories: 166, protein: 7, carbs: 6, fat: 14, category: "snack" },
  { id: "s4", name: "Mantequilla de maní", portion: "1 cda (16g)", calories: 96, protein: 4, carbs: 3, fat: 8, category: "snack" },
  { id: "s5", name: "Mantequilla de almendra", portion: "1 cda (16g)", calories: 100, protein: 3, carbs: 3, fat: 9, category: "snack" },
  { id: "s6", name: "Papas fritas (bolsa)", portion: "1 paquete (25g)", calories: 133, protein: 2, carbs: 13, fat: 9, category: "snack" },
  { id: "s7", name: "Palomitas de maíz (pop corn)", portion: "1 taza (30g)", calories: 100, protein: 3, carbs: 19, fat: 1, category: "snack" },
  { id: "s8", name: "Barrita de cereal", portion: "1 unidad (30g)", calories: 110, protein: 2, carbs: 20, fat: 3, category: "snack" },
  { id: "s9", name: "Barrita proteica", portion: "1 unidad (60g)", calories: 230, protein: 20, carbs: 20, fat: 8, category: "snack" },
  { id: "s10", name: "Grisines", portion: "3 unidades (20g)", calories: 80, protein: 2, carbs: 14, fat: 2, category: "snack" },
  { id: "s11", name: "Tostadas de arroz", portion: "2 unidades (18g)", calories: 72, protein: 1, carbs: 15, fat: 0.5, category: "snack" },
  { id: "s12", name: "Chips de manzana", portion: "25g", calories: 90, protein: 0.5, carbs: 22, fat: 0, category: "snack" },
  { id: "s13", name: "Semillas de girasol", portion: "28g", calories: 165, protein: 5.8, carbs: 5.5, fat: 14.3, category: "snack" },
  { id: "s14", name: "Semillas de chía", portion: "1 cda (12g)", calories: 58, protein: 2, carbs: 5, fat: 3.7, category: "snack" },
  { id: "s15", name: "Semillas de lino", portion: "1 cda (10g)", calories: 55, protein: 1.9, carbs: 3, fat: 4.3, category: "snack" },
  { id: "b1", name: "Agua", portion: "500ml", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },
  { id: "b2", name: "Agua con gas", portion: "500ml", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },
  { id: "b3", name: "Coca Cola", portion: "1 lata (354ml)", calories: 140, protein: 0, carbs: 39, fat: 0, category: "bebida" },
  { id: "b4", name: "Coca Cola Zero", portion: "1 lata (354ml)", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },
  { id: "b5", name: "Pepsi", portion: "1 lata (354ml)", calories: 150, protein: 0, carbs: 41, fat: 0, category: "bebida" },
  { id: "b6", name: "Sprite / 7UP", portion: "1 lata (354ml)", calories: 140, protein: 0, carbs: 38, fat: 0, category: "bebida" },
  { id: "b7", name: "Jugo de naranja natural", portion: "200ml", calories: 94, protein: 1.5, carbs: 21, fat: 0.4, category: "bebida" },
  { id: "b8", name: "Jugo Tang / powerade", portion: "200ml", calories: 80, protein: 0, carbs: 20, fat: 0, category: "bebida" },
  { id: "b9", name: "Mate amargo", portion: "1 cebadura", calories: 2, protein: 0.2, carbs: 0.2, fat: 0, category: "bebida" },
  { id: "b10", name: "Mate con azúcar", portion: "1 cebadura", calories: 20, protein: 0.2, carbs: 4.5, fat: 0, category: "bebida" },
  { id: "b11", name: "Café solo", portion: "1 taza (240ml)", calories: 2, protein: 0.3, carbs: 0, fat: 0, category: "bebida" },
  { id: "b12", name: "Café con leche", portion: "1 taza (240ml)", calories: 100, protein: 5, carbs: 9, fat: 4, category: "bebida" },
  { id: "b13", name: "Cortado", portion: "1 taza (120ml)", calories: 50, protein: 2.5, carbs: 4.5, fat: 2, category: "bebida" },
  { id: "b14", name: "Té negro (solo)", portion: "240ml", calories: 2, protein: 0, carbs: 0.5, fat: 0, category: "bebida" },
  { id: "b15", name: "Licuado de banana y leche", portion: "1 vaso (300ml)", calories: 235, protein: 7, carbs: 42, fat: 5, category: "bebida" },
  { id: "b16", name: "Jugo de manzana natural", portion: "200ml", calories: 94, protein: 0.3, carbs: 23, fat: 0.2, category: "bebida" },
  { id: "b17", name: "Cerveza rubia", portion: "1 lata (354ml)", calories: 153, protein: 1.3, carbs: 13, fat: 0, category: "bebida" },
  { id: "b18", name: "Cerveza sin alcohol", portion: "1 lata (354ml)", calories: 76, protein: 0.7, carbs: 14, fat: 0, category: "bebida" },
  { id: "b19", name: "Vino tinto", portion: "1 copa (150ml)", calories: 125, protein: 0.1, carbs: 4, fat: 0, category: "bebida" },
  { id: "b20", name: "Vino blanco", portion: "1 copa (150ml)", calories: 121, protein: 0.1, carbs: 4, fat: 0, category: "bebida" },
  { id: "b21", name: "Fernet con cola", portion: "1 trago (300ml)", calories: 190, protein: 0, carbs: 22, fat: 0, category: "bebida" },
  { id: "b22", name: "Gatorade", portion: "500ml", calories: 130, protein: 0, carbs: 34, fat: 0, category: "bebida" },
  { id: "b23", name: "Powerade Zero", portion: "500ml", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },
  { id: "b24", name: "Energizante Red Bull", portion: "250ml", calories: 110, protein: 0.9, carbs: 27, fat: 0, category: "bebida" },
  { id: "b25", name: "Leche vegetal de almendra", portion: "200ml", calories: 30, protein: 1, carbs: 1.5, fat: 2.5, category: "bebida" },
  { id: "o1", name: "Aceite de oliva", portion: "1 cda (14g)", calories: 119, protein: 0, carbs: 0, fat: 13.5, category: "otro" },
  { id: "o2", name: "Aceite de girasol", portion: "1 cda (14g)", calories: 124, protein: 0, carbs: 0, fat: 14, category: "otro" },
  { id: "o3", name: "Mayonesa", portion: "1 cda (15g)", calories: 90, protein: 0.1, carbs: 0.1, fat: 10, category: "otro" },
  { id: "o4", name: "Ketchup", portion: "1 cda (17g)", calories: 19, protein: 0.3, carbs: 4.5, fat: 0, category: "otro" },
  { id: "o5", name: "Mostaza", portion: "1 cda (5g)", calories: 3, protein: 0.2, carbs: 0.3, fat: 0.2, category: "otro" },
  { id: "o6", name: "Salsa de soja", portion: "1 cda (15ml)", calories: 10, protein: 1.5, carbs: 1, fat: 0, category: "otro" },
  { id: "o7", name: "Salsa criolla", portion: "1 cda (30g)", calories: 25, protein: 0.4, carbs: 3.5, fat: 1, category: "otro" },
  { id: "o8", name: "Chimichurri", portion: "1 cda (15g)", calories: 45, protein: 0.5, carbs: 1, fat: 4.5, category: "otro" },
  { id: "o9", name: "Sal", portion: "1 cdita (5g)", calories: 0, protein: 0, carbs: 0, fat: 0, category: "otro" },
  { id: "o10", name: "Azúcar", portion: "1 cda (12g)", calories: 46, protein: 0, carbs: 12, fat: 0, category: "otro" },
  { id: "o11", name: "Edulcorante", portion: "1 cdita", calories: 0, protein: 0, carbs: 0, fat: 0, category: "otro" },
  { id: "o12", name: "Miel", portion: "1 cda (21g)", calories: 64, protein: 0.1, carbs: 17, fat: 0, category: "otro" },
  { id: "o13", name: "Mermelada", portion: "1 cda (20g)", calories: 49, protein: 0.1, carbs: 13, fat: 0, category: "otro" },
  { id: "o14", name: "Salsa de tomate envasada", portion: "100ml", calories: 35, protein: 1.5, carbs: 7, fat: 0.5, category: "otro" },
  { id: "o15", name: "Crema de leche para cocinar", portion: "1 cda (15g)", calories: 48, protein: 0.4, carbs: 0.4, fat: 5, category: "otro" },

  // ── COMIDA ARGENTINA adicional (arg51-arg105) ──────────────────────────────
  { id: "arg51", name: "Hamburgesa casera de carne", portion: "1 unidad (130g)", calories: 340, protein: 22, carbs: 20, fat: 19, category: "comida_arg" },
  { id: "arg52", name: "Hamburguesa de pollo", portion: "1 unidad (120g)", calories: 280, protein: 24, carbs: 18, fat: 12, category: "comida_arg" },
  { id: "arg53", name: "Lomito completo", portion: "1 sándwich", calories: 620, protein: 38, carbs: 48, fat: 28, category: "comida_arg" },
  { id: "arg54", name: "Bife a caballo", portion: "1 porción (200g)", calories: 400, protein: 36, carbs: 1, fat: 28, category: "comida_arg" },
  { id: "arg55", name: "Peceto al horno", portion: "100g", calories: 195, protein: 28, carbs: 0, fat: 9, category: "comida_arg" },
  { id: "arg56", name: "Colita de cuadril a la parrilla", portion: "100g", calories: 218, protein: 27, carbs: 0, fat: 12, category: "comida_arg" },
  { id: "arg57", name: "Tapa de asado", portion: "100g", calories: 260, protein: 25, carbs: 0, fat: 17, category: "comida_arg" },
  { id: "arg58", name: "Matambre tierno", portion: "100g", calories: 250, protein: 24, carbs: 0, fat: 17, category: "comida_arg" },
  { id: "arg59", name: "Bondiola a la parrilla", portion: "100g", calories: 295, protein: 23, carbs: 0, fat: 22, category: "comida_arg" },
  { id: "arg60", name: "Molleja a la parrilla", portion: "100g", calories: 320, protein: 20, carbs: 0, fat: 26, category: "comida_arg" },
  { id: "arg61", name: "Chinchulín a la parrilla", portion: "100g", calories: 305, protein: 18, carbs: 0, fat: 25, category: "comida_arg" },
  { id: "arg62", name: "Osobuco estofado", portion: "1 porción (250g)", calories: 420, protein: 34, carbs: 8, fat: 24, category: "comida_arg" },
  { id: "arg63", name: "Pollo al horno con papas", portion: "1 porción (300g)", calories: 460, protein: 30, carbs: 28, fat: 24, category: "comida_arg" },
  { id: "arg64", name: "Milanesa de soja", portion: "1 unidad (100g)", calories: 215, protein: 18, carbs: 20, fat: 7, category: "comida_arg" },
  { id: "arg65", name: "Pastel de papa", portion: "1 porción (200g)", calories: 380, protein: 18, carbs: 35, fat: 18, category: "comida_arg" },
  { id: "arg66", name: "Albóndigas en salsa", portion: "4 unidades (200g)", calories: 360, protein: 22, carbs: 18, fat: 20, category: "comida_arg" },
  { id: "arg67", name: "Lasagna de carne", portion: "1 porción (200g)", calories: 420, protein: 22, carbs: 35, fat: 20, category: "comida_arg" },
  { id: "arg68", name: "Lasagna de verdura", portion: "1 porción (200g)", calories: 340, protein: 15, carbs: 34, fat: 16, category: "comida_arg" },
  { id: "arg69", name: "Fideos con crema y jamón", portion: "1 plato (280g)", calories: 480, protein: 18, carbs: 52, fat: 22, category: "comida_arg" },
  { id: "arg70", name: "Fideos al arrabiata", portion: "1 plato (280g)", calories: 380, protein: 12, carbs: 58, fat: 10, category: "comida_arg" },
  { id: "arg71", name: "Risotto de hongos", portion: "1 plato (280g)", calories: 400, protein: 10, carbs: 58, fat: 14, category: "comida_arg" },
  { id: "arg72", name: "Arroz con leche", portion: "1 porción (200g)", calories: 240, protein: 6, carbs: 42, fat: 5, category: "comida_arg" },
  { id: "arg73", name: "Ensalada rusa", portion: "1 porción (150g)", calories: 220, protein: 4, carbs: 22, fat: 13, category: "comida_arg" },
  { id: "arg74", name: "Salpicón de pollo", portion: "1 porción (200g)", calories: 250, protein: 26, carbs: 12, fat: 10, category: "comida_arg" },
  { id: "arg75", name: "Tarta de atún", portion: "1 porción (120g)", calories: 290, protein: 14, carbs: 22, fat: 16, category: "comida_arg" },
  { id: "arg76", name: "Pascualina de espinaca", portion: "1 porción (120g)", calories: 240, protein: 10, carbs: 20, fat: 14, category: "comida_arg" },
  { id: "arg77", name: "Croquetas de papa", portion: "3 unidades (120g)", calories: 260, protein: 6, carbs: 34, fat: 12, category: "comida_arg" },
  { id: "arg78", name: "Papas al natural", portion: "100g", calories: 87, protein: 2, carbs: 20, fat: 0.1, category: "comida_arg" },
  { id: "arg79", name: "Papas fritas con ojo (caseras)", portion: "150g", calories: 468, protein: 5, carbs: 61, fat: 23, category: "comida_arg" },
  { id: "arg80", name: "Verduras grilladas", portion: "150g", calories: 90, protein: 3, carbs: 15, fat: 2, category: "comida_arg" },
  { id: "arg81", name: "Wok de pollo y verduras", portion: "1 plato (300g)", calories: 310, protein: 28, carbs: 22, fat: 12, category: "comida_arg" },
  { id: "arg82", name: "Sopa de pollo casera", portion: "1 plato (350ml)", calories: 140, protein: 14, carbs: 12, fat: 4, category: "comida_arg" },
  { id: "arg83", name: "Caldo de verduras casero", portion: "1 taza (250ml)", calories: 25, protein: 1, carbs: 5, fat: 0.5, category: "comida_arg" },
  { id: "arg84", name: "Sopa de fideos con caldo", portion: "1 plato (350ml)", calories: 180, protein: 7, carbs: 30, fat: 3, category: "comida_arg" },
  { id: "arg85", name: "Brochette de carne a la parrilla", portion: "1 brochette (120g)", calories: 230, protein: 24, carbs: 5, fat: 13, category: "comida_arg" },
  { id: "arg86", name: "Brochette de pollo", portion: "1 brochette (120g)", calories: 190, protein: 26, carbs: 4, fat: 7, category: "comida_arg" },
  { id: "arg87", name: "Sandwich de jamón y queso", portion: "1 unidad", calories: 350, protein: 16, carbs: 34, fat: 16, category: "comida_arg" },
  { id: "arg88", name: "Tostado de jamón y queso", portion: "1 unidad", calories: 320, protein: 14, carbs: 30, fat: 16, category: "comida_arg" },
  { id: "arg89", name: "Medialunas con manteca y mermelada", portion: "2 unidades + aderezos", calories: 420, protein: 6, carbs: 52, fat: 21, category: "comida_arg" },
  { id: "arg90", name: "Panqueques (2 unidades)", portion: "2 panqueques (100g)", calories: 220, protein: 6, carbs: 28, fat: 10, category: "comida_arg" },
  { id: "arg91", name: "Fetuccini al limón y albahaca", portion: "1 plato (270g)", calories: 390, protein: 12, carbs: 55, fat: 14, category: "comida_arg" },
  { id: "arg92", name: "Pizza de rúcula y jamón crudo", portion: "1 porción (130g)", calories: 320, protein: 15, carbs: 32, fat: 15, category: "comida_arg" },
  { id: "arg93", name: "Pizza de verdura (sin muzz)", portion: "1 porción (110g)", calories: 220, protein: 7, carbs: 32, fat: 7, category: "comida_arg" },
  { id: "arg94", name: "Empanada de verdura", portion: "1 unidad (90g)", calories: 185, protein: 5, carbs: 25, fat: 7, category: "comida_arg" },
  { id: "arg95", name: "Empanada de atún", portion: "1 unidad (90g)", calories: 200, protein: 12, carbs: 22, fat: 7, category: "comida_arg" },
  { id: "arg96", name: "Lenteja guisada con chorizo", portion: "1 plato (300g)", calories: 420, protein: 22, carbs: 40, fat: 18, category: "comida_arg" },
  { id: "arg97", name: "Porotos con cuero", portion: "1 plato (300g)", calories: 380, protein: 18, carbs: 42, fat: 14, category: "comida_arg" },
  { id: "arg98", name: "Mondongo guisado", portion: "1 plato (280g)", calories: 310, protein: 20, carbs: 22, fat: 14, category: "comida_arg" },
  { id: "arg99", name: "Pollo al disco", portion: "1 porción (250g)", calories: 380, protein: 32, carbs: 14, fat: 22, category: "comida_arg" },
  { id: "arg100", name: "Escalope de ternera", portion: "1 unidad (120g)", calories: 220, protein: 25, carbs: 8, fat: 10, category: "comida_arg" },
  { id: "arg101", name: "Milanesa al horno", portion: "1 unidad (120g)", calories: 245, protein: 25, carbs: 13, fat: 11, category: "comida_arg" },
  { id: "arg102", name: "Bife de cuadril", portion: "100g", calories: 235, protein: 26, carbs: 0, fat: 14, category: "comida_arg" },
  { id: "arg103", name: "Cordero a la parrilla", portion: "100g", calories: 258, protein: 25, carbs: 0, fat: 17, category: "comida_arg" },
  { id: "arg104", name: "Cerdo agridulce con arroz", portion: "1 plato (300g)", calories: 480, protein: 22, carbs: 58, fat: 16, category: "comida_arg" },
  { id: "arg105", name: "Guiso de mondongo", portion: "1 plato (300g)", calories: 320, protein: 18, carbs: 28, fat: 14, category: "comida_arg" },

  // ── PROTEÍNAS adicionales (p31-p55) ───────────────────────────────────────
  { id: "p31", name: "Proteína en polvo (caseína)", portion: "30g scoop", calories: 110, protein: 24, carbs: 4, fat: 0.5, category: "proteina" },
  { id: "p32", name: "Batido proteico (whey + leche)", portion: "400ml", calories: 280, protein: 32, carbs: 22, fat: 6, category: "proteina" },
  { id: "p33", name: "Batido proteico (whey + agua)", portion: "350ml", calories: 125, protein: 25, carbs: 3, fat: 1, category: "proteina" },
  { id: "p34", name: "Batido proteico con banana", portion: "450ml", calories: 320, protein: 28, carbs: 38, fat: 5, category: "proteina" },
  { id: "p35", name: "Batido proteico con avena", portion: "400ml", calories: 350, protein: 30, carbs: 40, fat: 6, category: "proteina" },
  { id: "p36", name: "BCAA en polvo", portion: "10g", calories: 30, protein: 6, carbs: 0, fat: 0, category: "proteina" },
  { id: "p37", name: "Creatina (sin calorías)", portion: "5g", calories: 0, protein: 0, carbs: 0, fat: 0, category: "proteina" },
  { id: "p38", name: "Mass gainer", portion: "1 scoop (100g)", calories: 380, protein: 30, carbs: 55, fat: 5, category: "proteina" },
  { id: "p39", name: "Calamar", portion: "100g", calories: 92, protein: 16, carbs: 3, fat: 1.4, category: "proteina" },
  { id: "p40", name: "Mejillones", portion: "100g", calories: 86, protein: 12, carbs: 4, fat: 2.2, category: "proteina" },
  { id: "p41", name: "Caballa en lata", portion: "100g", calories: 156, protein: 19, carbs: 0, fat: 9, category: "proteina" },
  { id: "p42", name: "Sardinas en aceite", portion: "100g", calories: 208, protein: 25, carbs: 0, fat: 12, category: "proteina" },
  { id: "p43", name: "Bagre / Surubí", portion: "100g", calories: 105, protein: 18, carbs: 0, fat: 3.5, category: "proteina" },
  { id: "p44", name: "Pato (pechuga)", portion: "100g", calories: 201, protein: 28, carbs: 0, fat: 10, category: "proteina" },
  { id: "p45", name: "Conejo guisado", portion: "100g", calories: 173, protein: 25, carbs: 0, fat: 8, category: "proteina" },
  { id: "p46", name: "Porotos aduki cocidos", portion: "100g", calories: 128, protein: 8, carbs: 25, fat: 0.1, category: "proteina" },
  { id: "p47", name: "Soja en grano cocida", portion: "100g", calories: 173, protein: 17, carbs: 10, fat: 9, category: "proteina" },
  { id: "p48", name: "Edamame", portion: "100g", calories: 122, protein: 11, carbs: 9, fat: 5, category: "proteina" },
  { id: "p49", name: "Seitan (gluten de trigo)", portion: "100g", calories: 370, protein: 75, carbs: 14, fat: 2, category: "proteina" },
  { id: "p50", name: "Paleta de cerdo al horno", portion: "100g", calories: 215, protein: 24, carbs: 0, fat: 13, category: "proteina" },
  { id: "p51", name: "Jamón de pavo", portion: "1 feta (30g)", calories: 32, protein: 5.5, carbs: 0.5, fat: 0.8, category: "proteina" },
  { id: "p52", name: "Lomito de cerdo ahumado", portion: "30g", calories: 58, protein: 8, carbs: 0.5, fat: 2.5, category: "proteina" },
  { id: "p53", name: "Salame", portion: "3 fetas (30g)", calories: 122, protein: 6, carbs: 1, fat: 11, category: "proteina" },
  { id: "p54", name: "Pechuga de pavo", portion: "100g", calories: 135, protein: 29, carbs: 0, fat: 1.5, category: "proteina" },
  { id: "p55", name: "Huevo duro", portion: "1 unidad (50g)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, category: "proteina" },

  // ── CARBOHIDRATOS adicionales (c26-c45) ────────────────────────────────────
  { id: "c26", name: "Pan de salvado", portion: "1 rebanada (25g)", calories: 58, protein: 3, carbs: 10, fat: 1, category: "carbohidrato" },
  { id: "c27", name: "Pan de centeno", portion: "1 rebanada (30g)", calories: 70, protein: 2.5, carbs: 14, fat: 0.8, category: "carbohidrato" },
  { id: "c28", name: "Pan pita", portion: "1 unidad (60g)", calories: 165, protein: 5.5, carbs: 33, fat: 0.7, category: "carbohidrato" },
  { id: "c29", name: "Wrap / Tortilla de trigo", portion: "1 unidad (50g)", calories: 150, protein: 4, carbs: 26, fat: 3.5, category: "carbohidrato" },
  { id: "c30", name: "Batata asada", portion: "100g", calories: 90, protein: 2, carbs: 21, fat: 0.1, category: "carbohidrato" },
  { id: "c31", name: "Mandioca / Yuca cocida", portion: "100g", calories: 160, protein: 1.4, carbs: 38, fat: 0.3, category: "carbohidrato" },
  { id: "c32", name: "Trigo sarraceno cocido", portion: "100g", calories: 92, protein: 3.4, carbs: 20, fat: 0.6, category: "carbohidrato" },
  { id: "c33", name: "Amaranto cocido", portion: "100g", calories: 102, protein: 3.8, carbs: 19, fat: 1.6, category: "carbohidrato" },
  { id: "c34", name: "Fideos de arroz cocidos", portion: "100g", calories: 135, protein: 2.4, carbs: 30, fat: 0.2, category: "carbohidrato" },
  { id: "c35", name: "Ñoquis de papa cocidos", portion: "100g", calories: 130, protein: 3.5, carbs: 26, fat: 1.5, category: "carbohidrato" },
  { id: "c36", name: "Arroz de grano largo (basmati)", portion: "100g cocido", calories: 121, protein: 2.7, carbs: 25, fat: 0.4, category: "carbohidrato" },
  { id: "c37", name: "Arroz yamani (integral)", portion: "100g cocido", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, category: "carbohidrato" },
  { id: "c38", name: "Cuscús de trigo grueso", portion: "100g cocido", calories: 112, protein: 3.8, carbs: 23, fat: 0.2, category: "carbohidrato" },
  { id: "c39", name: "Farro cocido", portion: "100g", calories: 170, protein: 6.5, carbs: 34, fat: 0.7, category: "carbohidrato" },
  { id: "c40", name: "Maíz pisingallo (pochoclo sin manteca)", portion: "100g", calories: 375, protein: 12, carbs: 74, fat: 5, category: "carbohidrato" },
  { id: "c41", name: "Harina de garbanzo", portion: "100g", calories: 387, protein: 22, carbs: 58, fat: 7, category: "carbohidrato" },
  { id: "c42", name: "Muesli", portion: "40g", calories: 148, protein: 4, carbs: 26, fat: 3.5, category: "carbohidrato" },
  { id: "c43", name: "Boniato / Papa amarilla", portion: "100g", calories: 94, protein: 2, carbs: 22, fat: 0.1, category: "carbohidrato" },
  { id: "c44", name: "Papas fritas al horno (sin aceite)", portion: "100g", calories: 155, protein: 3.5, carbs: 36, fat: 0.2, category: "carbohidrato" },
  { id: "c45", name: "Wasa / Galletas integrales (2 u)", portion: "20g", calories: 72, protein: 2, carbs: 14, fat: 0.4, category: "carbohidrato" },

  // ── FRUTAS adicionales (f24-f35) ───────────────────────────────────────────
  { id: "f24", name: "Coco rallado natural", portion: "28g", calories: 99, protein: 1, carbs: 4.3, fat: 9.5, category: "fruta" },
  { id: "f25", name: "Dátiles Medjool", portion: "2 unidades (48g)", calories: 133, protein: 0.8, carbs: 36, fat: 0.1, category: "fruta" },
  { id: "f26", name: "Pasas de uva", portion: "28g", calories: 85, protein: 0.9, carbs: 22, fat: 0.1, category: "fruta" },
  { id: "f27", name: "Ciruela pasa", portion: "3 unidades (28g)", calories: 67, protein: 0.6, carbs: 18, fat: 0.1, category: "fruta" },
  { id: "f28", name: "Damasco / Albaricoque", portion: "2 unidades (70g)", calories: 34, protein: 1, carbs: 8, fat: 0.3, category: "fruta" },
  { id: "f29", name: "Maracuyá", portion: "100g", calories: 97, protein: 2.2, carbs: 23, fat: 0.7, category: "fruta" },
  { id: "f30", name: "Guayaba", portion: "100g", calories: 68, protein: 2.6, carbs: 14, fat: 1, category: "fruta" },
  { id: "f31", name: "Higo fresco", portion: "2 unidades (80g)", calories: 59, protein: 0.6, carbs: 15, fat: 0.2, category: "fruta" },
  { id: "f32", name: "Nectarina", portion: "1 unidad (150g)", calories: 63, protein: 1.5, carbs: 15, fat: 0.5, category: "fruta" },
  { id: "f33", name: "Litchi", portion: "100g", calories: 66, protein: 0.8, carbs: 17, fat: 0.4, category: "fruta" },
  { id: "f34", name: "Granada", portion: "100g (granos)", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, category: "fruta" },
  { id: "f35", name: "Mora negra", portion: "100g", calories: 43, protein: 1.4, carbs: 10, fat: 0.5, category: "fruta" },

  // ── VERDURAS adicionales (v31-v50) ─────────────────────────────────────────
  { id: "v31", name: "Coles de Bruselas", portion: "100g", calories: 43, protein: 3.4, carbs: 9, fat: 0.3, category: "verdura" },
  { id: "v32", name: "Endivia / Achicoria", portion: "100g", calories: 17, protein: 1.3, carbs: 3.4, fat: 0.2, category: "verdura" },
  { id: "v33", name: "Hinojo", portion: "100g", calories: 31, protein: 1.2, carbs: 7, fat: 0.2, category: "verdura" },
  { id: "v34", name: "Radicheta", portion: "100g", calories: 23, protein: 1.8, carbs: 4.5, fat: 0.3, category: "verdura" },
  { id: "v35", name: "Rabanito", portion: "100g", calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, category: "verdura" },
  { id: "v36", name: "Okra", portion: "100g", calories: 33, protein: 2, carbs: 7, fat: 0.2, category: "verdura" },
  { id: "v37", name: "Hongos portobello", portion: "100g", calories: 22, protein: 2.5, carbs: 3.9, fat: 0.5, category: "verdura" },
  { id: "v38", name: "Shiitake", portion: "100g", calories: 34, protein: 2.2, carbs: 7, fat: 0.5, category: "verdura" },
  { id: "v39", name: "Maíz bebé (baby corn)", portion: "100g", calories: 26, protein: 2, carbs: 5, fat: 0.3, category: "verdura" },
  { id: "v40", name: "Garbanzo verde (fresco)", portion: "100g", calories: 172, protein: 9, carbs: 27, fat: 3, category: "verdura" },
  { id: "v41", name: "Kale / Col rizada", portion: "100g", calories: 35, protein: 3.3, carbs: 4.4, fat: 1.5, category: "verdura" },
  { id: "v42", name: "Romanesco", portion: "100g", calories: 25, protein: 2, carbs: 5, fat: 0.3, category: "verdura" },
  { id: "v43", name: "Endibia (Belgian endive)", portion: "100g", calories: 17, protein: 0.9, carbs: 3.1, fat: 0.1, category: "verdura" },
  { id: "v44", name: "Choclo a la parrilla (1/2)", portion: "1/2 espiga", calories: 100, protein: 3.4, carbs: 21, fat: 1.5, category: "verdura" },
  { id: "v45", name: "Zapallo kabutia", portion: "100g", calories: 34, protein: 1, carbs: 8, fat: 0.1, category: "verdura" },
  { id: "v46", name: "Espinaca cocida", portion: "100g", calories: 23, protein: 3, carbs: 3.8, fat: 0.3, category: "verdura" },
  { id: "v47", name: "Brócoli al vapor", portion: "100g", calories: 35, protein: 3, carbs: 7, fat: 0.4, category: "verdura" },
  { id: "v48", name: "Zanahoria asada", portion: "100g", calories: 53, protein: 1.2, carbs: 12, fat: 0.3, category: "verdura" },
  { id: "v49", name: "Remolacha asada", portion: "100g", calories: 58, protein: 2, carbs: 13, fat: 0.2, category: "verdura" },
  { id: "v50", name: "Calabaza asada", portion: "100g", calories: 34, protein: 1.1, carbs: 8.5, fat: 0.1, category: "verdura" },

  // ── LÁCTEOS adicionales (l19-l33) ─────────────────────────────────────────
  { id: "l19", name: "Yogur de frutas (0% grasa)", portion: "150g", calories: 85, protein: 5.5, carbs: 14, fat: 0.2, category: "lacteo" },
  { id: "l20", name: "Kéfir", portion: "200ml", calories: 120, protein: 6.5, carbs: 11, fat: 4, category: "lacteo" },
  { id: "l21", name: "Queso brie", portion: "30g", calories: 101, protein: 6, carbs: 0.1, fat: 8.5, category: "lacteo" },
  { id: "l22", name: "Queso de cabra", portion: "30g", calories: 102, protein: 6, carbs: 0, fat: 8.5, category: "lacteo" },
  { id: "l23", name: "Queso fresco 0% grasa", portion: "100g", calories: 68, protein: 12, carbs: 2, fat: 0.5, category: "lacteo" },
  { id: "l24", name: "Queso parmesano en bloque", portion: "30g", calories: 122, protein: 11, carbs: 0.9, fat: 8, category: "lacteo" },
  { id: "l25", name: "Burrata", portion: "100g", calories: 260, protein: 14, carbs: 2, fat: 22, category: "lacteo" },
  { id: "l26", name: "Leche de avena", portion: "200ml", calories: 90, protein: 2, carbs: 16, fat: 2, category: "lacteo" },
  { id: "l27", name: "Leche de soja", portion: "200ml", calories: 80, protein: 7, carbs: 8, fat: 4, category: "lacteo" },
  { id: "l28", name: "Leche de coco (para cocinar)", portion: "100ml", calories: 197, protein: 2, carbs: 6, fat: 19, category: "lacteo" },
  { id: "l29", name: "Queso azul / Gorgonzola", portion: "30g", calories: 99, protein: 6, carbs: 0.7, fat: 8, category: "lacteo" },
  { id: "l30", name: "Crema agria / Sour cream", portion: "30g", calories: 58, protein: 0.6, carbs: 1, fat: 5.5, category: "lacteo" },
  { id: "l31", name: "Ghee (manteca clarificada)", portion: "1 cda (14g)", calories: 123, protein: 0, carbs: 0, fat: 14, category: "lacteo" },
  { id: "l32", name: "Queso mozzarella fresca", portion: "30g", calories: 74, protein: 5, carbs: 0.6, fat: 6, category: "lacteo" },
  { id: "l33", name: "Yogur skyr (proteico)", portion: "150g", calories: 105, protein: 17, carbs: 7, fat: 0.5, category: "lacteo" },

  // ── POSTRES adicionales (d24-d48) ──────────────────────────────────────────
  { id: "d24", name: "Helado de frutilla (bocha)", portion: "60g", calories: 110, protein: 1.5, carbs: 14, fat: 5, category: "postre" },
  { id: "d25", name: "Helado de dulce de leche (bocha)", portion: "60g", calories: 150, protein: 2.5, carbs: 19, fat: 7, category: "postre" },
  { id: "d26", name: "Helado de limón sorbete", portion: "60g", calories: 75, protein: 0.3, carbs: 19, fat: 0, category: "postre" },
  { id: "d27", name: "Helado de palito (Popsicle)", portion: "1 unidad (80ml)", calories: 70, protein: 0, carbs: 18, fat: 0, category: "postre" },
  { id: "d28", name: "Palito Rogel", portion: "1 unidad (80g)", calories: 290, protein: 3, carbs: 38, fat: 14, category: "postre" },
  { id: "d29", name: "Torta opera / Selva negra", portion: "1 porción (100g)", calories: 350, protein: 4, carbs: 42, fat: 18, category: "postre" },
  { id: "d30", name: "Brownie de chocolate", portion: "1 porción (50g)", calories: 230, protein: 3, carbs: 28, fat: 12, category: "postre" },
  { id: "d31", name: "Scone de queso", portion: "1 unidad (60g)", calories: 200, protein: 6, carbs: 24, fat: 9, category: "postre" },
  { id: "d32", name: "Budín inglés", portion: "1 porción (80g)", calories: 250, protein: 3.5, carbs: 38, fat: 10, category: "postre" },
  { id: "d33", name: "Caramelo / Toffee", portion: "1 unidad (10g)", calories: 41, protein: 0.3, carbs: 8, fat: 1, category: "postre" },
  { id: "d34", name: "Gelatina sin azúcar", portion: "100g", calories: 8, protein: 1.6, carbs: 0.4, fat: 0, category: "postre" },
  { id: "d35", name: "Gelatina con azúcar", portion: "100g", calories: 61, protein: 1.5, carbs: 14, fat: 0, category: "postre" },
  { id: "d36", name: "Pionono de dulce de leche", portion: "1 porción (80g)", calories: 270, protein: 5, carbs: 40, fat: 10, category: "postre" },
  { id: "d37", name: "Cannoli siciliano", portion: "1 unidad (80g)", calories: 260, protein: 5, carbs: 30, fat: 13, category: "postre" },
  { id: "d38", name: "Galletitas Terrabusi Surtidas (4)", portion: "4 unidades (24g)", calories: 115, protein: 1.5, carbs: 16, fat: 5, category: "postre" },
  { id: "d39", name: "Alfajor Oreo", portion: "1 unidad (60g)", calories: 250, protein: 3, carbs: 34, fat: 11, category: "postre" },
  { id: "d40", name: "Barquillo / Cucurucho (sin relleno)", portion: "1 unidad (8g)", calories: 33, protein: 0.5, carbs: 6.5, fat: 0.8, category: "postre" },
  { id: "d41", name: "Muffin de arándanos", portion: "1 unidad (90g)", calories: 310, protein: 4, carbs: 42, fat: 13, category: "postre" },
  { id: "d42", name: "Cheesecake de arándanos", portion: "1 porción (120g)", calories: 380, protein: 6, carbs: 35, fat: 24, category: "postre" },
  { id: "d43", name: "Crème brûlée", portion: "1 unidad (120g)", calories: 310, protein: 5, carbs: 28, fat: 20, category: "postre" },
  { id: "d44", name: "Mousse de chocolate", portion: "1 porción (100g)", calories: 280, protein: 5, carbs: 28, fat: 16, category: "postre" },
  { id: "d45", name: "Tiramisú", portion: "1 porción (120g)", calories: 320, protein: 6, carbs: 32, fat: 18, category: "postre" },
  { id: "d46", name: "Facturas de panadería (cañoncito)", portion: "1 unidad (50g)", calories: 185, protein: 3.5, carbs: 26, fat: 8, category: "postre" },
  { id: "d47", name: "Vigilante (membrillo y queso)", portion: "1 porción (80g)", calories: 190, protein: 5, carbs: 28, fat: 6, category: "postre" },
  { id: "d48", name: "Frutos rojos con crema", portion: "1 porción (150g)", calories: 170, protein: 2, carbs: 18, fat: 10, category: "postre" },

  // ── SNACKS adicionales (s16-s40) ───────────────────────────────────────────
  { id: "s16", name: "Nueces de Brasil", portion: "28g", calories: 185, protein: 4, carbs: 3.5, fat: 19, category: "snack" },
  { id: "s17", name: "Pistachos tostados", portion: "28g", calories: 159, protein: 6, carbs: 8, fat: 13, category: "snack" },
  { id: "s18", name: "Castañas de cajú", portion: "28g", calories: 157, protein: 5, carbs: 9, fat: 12, category: "snack" },
  { id: "s19", name: "Mix de frutos secos", portion: "28g", calories: 173, protein: 5, carbs: 6, fat: 15, category: "snack" },
  { id: "s20", name: "Banana chips", portion: "28g", calories: 147, protein: 0.6, carbs: 17, fat: 9, category: "snack" },
  { id: "s21", name: "Chips de kale", portion: "28g", calories: 120, protein: 4, carbs: 11, fat: 7, category: "snack" },
  { id: "s22", name: "Barritas de maní con miel", portion: "1 unidad (30g)", calories: 130, protein: 4, carbs: 16, fat: 6, category: "snack" },
  { id: "s23", name: "Orejones de durazno", portion: "28g", calories: 68, protein: 0.8, carbs: 18, fat: 0.1, category: "snack" },
  { id: "s24", name: "Garbanzos tostados", portion: "28g", calories: 103, protein: 5, carbs: 14, fat: 3, category: "snack" },
  { id: "s25", name: "Nachos con salsa", portion: "30g chips + 30g salsa", calories: 180, protein: 3, carbs: 22, fat: 9, category: "snack" },
  { id: "s26", name: "Hummus", portion: "2 cdas (30g)", calories: 70, protein: 2.5, carbs: 6, fat: 4.5, category: "snack" },
  { id: "s27", name: "Guacamole", portion: "2 cdas (30g)", calories: 60, protein: 0.8, carbs: 3.5, fat: 5.5, category: "snack" },
  { id: "s28", name: "Pepino con limón y sal", portion: "100g", calories: 18, protein: 0.7, carbs: 4, fat: 0.1, category: "snack" },
  { id: "s29", name: "Turrón de almendras", portion: "30g", calories: 140, protein: 3.5, carbs: 18, fat: 7, category: "snack" },
  { id: "s30", name: "Chocolate negro 85%", portion: "20g", calories: 126, protein: 1.8, carbs: 6.5, fat: 10.5, category: "snack" },
  { id: "s31", name: "Barritas de avena casera", portion: "1 barra (40g)", calories: 155, protein: 3.5, carbs: 22, fat: 6, category: "snack" },
  { id: "s32", name: "Gomitas de gelatina", portion: "30g", calories: 90, protein: 1.5, carbs: 22, fat: 0, category: "snack" },
  { id: "s33", name: "Chips de boniato al horno", portion: "30g", calories: 95, protein: 1.5, carbs: 20, fat: 0.3, category: "snack" },
  { id: "s34", name: "Tortitas de maíz inflado", portion: "1 paquete (20g)", calories: 78, protein: 1.5, carbs: 16, fat: 0.8, category: "snack" },
  { id: "s35", name: "Maní con pasas", portion: "28g", calories: 140, protein: 4, carbs: 15, fat: 8, category: "snack" },
  { id: "s36", name: "Pretzels", portion: "28g", calories: 108, protein: 3, carbs: 22, fat: 1, category: "snack" },
  { id: "s37", name: "Biscotti de almendras", portion: "1 unidad (20g)", calories: 88, protein: 2.5, carbs: 12, fat: 3.5, category: "snack" },
  { id: "s38", name: "Semillas de calabaza tostadas", portion: "28g", calories: 151, protein: 7, carbs: 5, fat: 13, category: "snack" },
  { id: "s39", name: "Bocaditos de soja texturizada", portion: "28g", calories: 105, protein: 14, carbs: 8, fat: 2, category: "snack" },
  { id: "s40", name: "Proteína de arroz en polvo", portion: "30g", calories: 117, protein: 23, carbs: 4, fat: 1.5, category: "snack" },

  // ── BEBIDAS adicionales (b26-b55) ──────────────────────────────────────────
  { id: "b26", name: "Batido verde (espinaca + banana + agua)", portion: "400ml", calories: 140, protein: 4, carbs: 32, fat: 1, category: "bebida" },
  { id: "b27", name: "Batido de avena y banana", portion: "400ml", calories: 290, protein: 9, carbs: 52, fat: 5, category: "bebida" },
  { id: "b28", name: "Batido de frutos rojos y yogur", portion: "350ml", calories: 190, protein: 10, carbs: 32, fat: 3, category: "bebida" },
  { id: "b29", name: "Jugo verde (apio + pepino + manzana)", portion: "300ml", calories: 80, protein: 1.5, carbs: 19, fat: 0.5, category: "bebida" },
  { id: "b30", name: "Licuado de mango y leche", portion: "300ml", calories: 190, protein: 6, carbs: 36, fat: 4, category: "bebida" },
  { id: "b31", name: "Jugo de zanahoria natural", portion: "200ml", calories: 82, protein: 1.8, carbs: 19, fat: 0.4, category: "bebida" },
  { id: "b32", name: "Kombucha", portion: "330ml", calories: 40, protein: 0, carbs: 10, fat: 0, category: "bebida" },
  { id: "b33", name: "Agua de coco natural", portion: "330ml", calories: 65, protein: 0.7, carbs: 15, fat: 0.7, category: "bebida" },
  { id: "b34", name: "Mate cocido (con leche)", portion: "200ml", calories: 80, protein: 4, carbs: 8, fat: 3, category: "bebida" },
  { id: "b35", name: "Cappuccino", portion: "240ml", calories: 120, protein: 6, carbs: 10, fat: 4.5, category: "bebida" },
  { id: "b36", name: "Flat white", portion: "240ml", calories: 130, protein: 6.5, carbs: 11, fat: 5, category: "bebida" },
  { id: "b37", name: "Latte (café con leche caliente)", portion: "300ml", calories: 150, protein: 8, carbs: 13, fat: 6, category: "bebida" },
  { id: "b38", name: "Frappé de café", portion: "400ml", calories: 250, protein: 5, carbs: 38, fat: 9, category: "bebida" },
  { id: "b39", name: "Té verde (solo)", portion: "240ml", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },
  { id: "b40", name: "Té de manzanilla", portion: "240ml", calories: 2, protein: 0, carbs: 0.5, fat: 0, category: "bebida" },
  { id: "b41", name: "Limonada natural sin azúcar", portion: "300ml", calories: 20, protein: 0.2, carbs: 5, fat: 0, category: "bebida" },
  { id: "b42", name: "Limonada con azúcar", portion: "300ml", calories: 110, protein: 0.2, carbs: 28, fat: 0, category: "bebida" },
  { id: "b43", name: "Naranjada natural", portion: "300ml", calories: 110, protein: 1.5, carbs: 26, fat: 0.4, category: "bebida" },
  { id: "b44", name: "Monster Energy", portion: "1 lata (473ml)", calories: 210, protein: 0, carbs: 54, fat: 0, category: "bebida" },
  { id: "b45", name: "Pre-workout en polvo", portion: "10g + agua", calories: 30, protein: 0, carbs: 7, fat: 0, category: "bebida" },
  { id: "b46", name: "Leche de arroz", portion: "200ml", calories: 94, protein: 0.7, carbs: 20, fat: 1.5, category: "bebida" },
  { id: "b47", name: "Jugo de remolacha", portion: "200ml", calories: 76, protein: 2.3, carbs: 18, fat: 0.1, category: "bebida" },
  { id: "b48", name: "Coctail de frutas (sin alcohol)", portion: "300ml", calories: 120, protein: 0.5, carbs: 30, fat: 0.1, category: "bebida" },
  { id: "b49", name: "Sidra de manzana", portion: "250ml", calories: 100, protein: 0, carbs: 24, fat: 0, category: "bebida" },
  { id: "b50", name: "Leche chocolatada (Chocolinas)", portion: "200ml", calories: 160, protein: 6, carbs: 24, fat: 4.5, category: "bebida" },
  { id: "b51", name: "Leche de avena sin azúcar", portion: "200ml", calories: 60, protein: 1.5, carbs: 9, fat: 1.5, category: "bebida" },
  { id: "b52", name: "Caldo de huesos", portion: "250ml", calories: 35, protein: 8, carbs: 0, fat: 0.5, category: "bebida" },
  { id: "b53", name: "Batido de proteína con café (preworkout)", portion: "300ml", calories: 175, protein: 26, carbs: 10, fat: 3, category: "bebida" },
  { id: "b54", name: "Yerba mate (cebadura promedio)", portion: "1 cebadura (6g yerba)", calories: 3, protein: 0.2, carbs: 0.5, fat: 0, category: "bebida" },
  { id: "b55", name: "Gaseosa sin azúcar (genérica)", portion: "354ml", calories: 0, protein: 0, carbs: 0, fat: 0, category: "bebida" },

  // ── OTROS adicionales (o16-o32) ────────────────────────────────────────────
  { id: "o16", name: "Aceite de coco", portion: "1 cda (14g)", calories: 121, protein: 0, carbs: 0, fat: 13.5, category: "otro" },
  { id: "o17", name: "Vinagre de manzana", portion: "1 cda (15ml)", calories: 3, protein: 0, carbs: 0.9, fat: 0, category: "otro" },
  { id: "o18", name: "Chimichurri casero", portion: "1 cda (15g)", calories: 45, protein: 0.5, carbs: 1.5, fat: 4.5, category: "otro" },
  { id: "o19", name: "Salsa golf", portion: "1 cda (15g)", calories: 65, protein: 0.2, carbs: 2.5, fat: 6, category: "otro" },
  { id: "o20", name: "Aderezo César", portion: "1 cda (15g)", calories: 75, protein: 0.5, carbs: 1, fat: 8, category: "otro" },
  { id: "o21", name: "Salsa barbacoa", portion: "1 cda (17g)", calories: 29, protein: 0.3, carbs: 7, fat: 0.1, category: "otro" },
  { id: "o22", name: "Sriracha / Salsa picante", portion: "1 cdita (5g)", calories: 6, protein: 0.1, carbs: 1.3, fat: 0, category: "otro" },
  { id: "o23", name: "Salsa teriyaki", portion: "1 cda (18ml)", calories: 27, protein: 0.8, carbs: 6, fat: 0, category: "otro" },
  { id: "o24", name: "Cacao en polvo sin azúcar", portion: "1 cda (7g)", calories: 15, protein: 1, carbs: 3, fat: 0.5, category: "otro" },
  { id: "o25", name: "Proteína en polvo sabor chocolate", portion: "30g", calories: 115, protein: 23, carbs: 5, fat: 1.5, category: "otro" },
  { id: "o26", name: "Canela en polvo", portion: "1 cdita (3g)", calories: 8, protein: 0.1, carbs: 2, fat: 0, category: "otro" },
  { id: "o27", name: "Extracto de vainilla", portion: "1 cdita (4ml)", calories: 12, protein: 0, carbs: 0.5, fat: 0, category: "otro" },
  { id: "o28", name: "Levadura de cerveza", portion: "1 cda (15g)", calories: 45, protein: 6, carbs: 5, fat: 0.5, category: "otro" },
  { id: "o29", name: "Salsa de pesto envasada", portion: "1 cda (20g)", calories: 82, protein: 2, carbs: 1.5, fat: 8, category: "otro" },
  { id: "o30", name: "Caldo concentrado (cubito)", portion: "1 cubito (10g)", calories: 25, protein: 1, carbs: 3, fat: 0.5, category: "otro" },
  { id: "o31", name: "Aceite de sésamo", portion: "1 cdita (5ml)", calories: 40, protein: 0, carbs: 0, fat: 4.5, category: "otro" },
  { id: "o32", name: "Tahini (pasta de sésamo)", portion: "1 cda (15g)", calories: 90, protein: 2.5, carbs: 3, fat: 8, category: "otro" },

  // ================================================================
  // DESAYUNOS — 100 opciones argentinas/latinas (tostadas, yogures, cereales)
  // ================================================================

  // ---- TOSTADAS Y VARIANTES (1-40) ----
  { id: "bk1",  name: "Tostada con queso crema",                       portion: "2 unidades", calories: 200, protein: 6,  carbs: 30, fat: 7,  category: "comida_arg" },
  { id: "bk2",  name: "Tostada con queso crema y mermelada",           portion: "2 unidades", calories: 260, protein: 6,  carbs: 45, fat: 7,  category: "comida_arg" },
  { id: "bk3",  name: "Tostada con queso crema y miel",                portion: "2 unidades", calories: 270, protein: 6,  carbs: 47, fat: 7,  category: "comida_arg" },
  { id: "bk4",  name: "Tostada con queso crema y palta",               portion: "2 unidades", calories: 280, protein: 7,  carbs: 32, fat: 14, category: "comida_arg" },
  { id: "bk5",  name: "Tostada con manteca",                           portion: "2 unidades", calories: 240, protein: 4,  carbs: 30, fat: 12, category: "comida_arg" },
  { id: "bk6",  name: "Tostada con manteca y mermelada",               portion: "2 unidades", calories: 310, protein: 4,  carbs: 50, fat: 12, category: "comida_arg" },
  { id: "bk7",  name: "Tostada con manteca y miel",                    portion: "2 unidades", calories: 320, protein: 4,  carbs: 52, fat: 12, category: "comida_arg" },
  { id: "bk8",  name: "Tostada con manteca y dulce de leche",          portion: "2 unidades", calories: 330, protein: 5,  carbs: 50, fat: 13, category: "comida_arg" },
  { id: "bk9",  name: "Tostada con dulce de leche",                    portion: "2 unidades", calories: 270, protein: 5,  carbs: 50, fat: 6,  category: "comida_arg" },
  { id: "bk10", name: "Tostada con palta y huevo",                     portion: "2 unidades", calories: 330, protein: 13, carbs: 32, fat: 17, category: "comida_arg" },
  { id: "bk11", name: "Tostada con palta y limón",                     portion: "2 unidades", calories: 230, protein: 5,  carbs: 31, fat: 11, category: "comida_arg" },
  { id: "bk12", name: "Tostada con jamón y queso",                     portion: "2 unidades", calories: 280, protein: 14, carbs: 31, fat: 11, category: "comida_arg" },
  { id: "bk13", name: "Tostada con jamón",                             portion: "2 unidades", calories: 200, protein: 11, carbs: 30, fat: 4,  category: "comida_arg" },
  { id: "bk14", name: "Tostada con queso",                             portion: "2 unidades", calories: 240, protein: 11, carbs: 30, fat: 9,  category: "comida_arg" },
  { id: "bk15", name: "Tostada con huevo revuelto",                    portion: "2 unidades", calories: 280, protein: 14, carbs: 30, fat: 12, category: "comida_arg" },
  { id: "bk16", name: "Tostada con huevo frito",                       portion: "2 unidades", calories: 290, protein: 12, carbs: 30, fat: 14, category: "comida_arg" },
  { id: "bk17", name: "Tostada francesa",                              portion: "2 unidades", calories: 320, protein: 12, carbs: 40, fat: 12, category: "comida_arg" },
  { id: "bk18", name: "Tostada con tomate y aceite de oliva",          portion: "2 unidades", calories: 220, protein: 5,  carbs: 33, fat: 8,  category: "comida_arg" },
  { id: "bk19", name: "Tostada con pasta de maní",                     portion: "2 unidades", calories: 320, protein: 11, carbs: 35, fat: 16, category: "comida_arg" },
  { id: "bk20", name: "Tostada con queso crema y salmón ahumado",      portion: "2 unidades", calories: 290, protein: 14, carbs: 30, fat: 12, category: "comida_arg" },
  { id: "bk21", name: "Tostada con ricota y miel",                     portion: "2 unidades", calories: 260, protein: 10, carbs: 40, fat: 7,  category: "comida_arg" },
  { id: "bk22", name: "Tostada con ricota y mermelada",                portion: "2 unidades", calories: 250, protein: 10, carbs: 38, fat: 7,  category: "comida_arg" },
  { id: "bk23", name: "Tostada integral con queso crema",              portion: "2 unidades", calories: 190, protein: 7,  carbs: 28, fat: 7,  category: "comida_arg" },
  { id: "bk24", name: "Tostada integral con palta",                    portion: "2 unidades", calories: 220, protein: 6,  carbs: 30, fat: 11, category: "comida_arg" },
  { id: "bk25", name: "Tostada integral con jamón y queso",            portion: "2 unidades", calories: 270, protein: 15, carbs: 28, fat: 11, category: "comida_arg" },
  { id: "bk26", name: "Tostada integral con manteca y mermelada",      portion: "2 unidades", calories: 290, protein: 5,  carbs: 47, fat: 11, category: "comida_arg" },
  { id: "bk27", name: "Tostada con hummus",                            portion: "2 unidades", calories: 250, protein: 8,  carbs: 35, fat: 9,  category: "comida_arg" },
  { id: "bk28", name: "Tostada con hummus y vegetales",                portion: "2 unidades", calories: 270, protein: 9,  carbs: 38, fat: 9,  category: "comida_arg" },
  { id: "bk29", name: "Tostada con queso untable light y mermelada",   portion: "2 unidades", calories: 220, protein: 7,  carbs: 42, fat: 3,  category: "comida_arg" },
  { id: "bk30", name: "Tostada con queso untable light y miel",        portion: "2 unidades", calories: 225, protein: 7,  carbs: 43, fat: 3,  category: "comida_arg" },
  { id: "bk31", name: "Tostada con mascarpone y mermelada",            portion: "2 unidades", calories: 290, protein: 6,  carbs: 45, fat: 11, category: "comida_arg" },
  { id: "bk32", name: "Tostada con dulce de membrillo",                portion: "2 unidades", calories: 270, protein: 4,  carbs: 55, fat: 3,  category: "comida_arg" },
  { id: "bk33", name: "Tostada con queso crema y dulce de membrillo",  portion: "2 unidades", calories: 290, protein: 6,  carbs: 50, fat: 7,  category: "comida_arg" },
  { id: "bk34", name: "Tostada con mantequilla de maní",               portion: "2 unidades", calories: 320, protein: 11, carbs: 35, fat: 16, category: "comida_arg" },
  { id: "bk35", name: "Tostada con mantequilla de maní y banana",      portion: "2 unidades", calories: 380, protein: 12, carbs: 50, fat: 16, category: "comida_arg" },
  { id: "bk36", name: "Tostada con queso crema y arándanos",           portion: "2 unidades", calories: 230, protein: 6,  carbs: 38, fat: 7,  category: "comida_arg" },
  { id: "bk37", name: "Tostada con queso crema y frutillas",           portion: "2 unidades", calories: 225, protein: 6,  carbs: 37, fat: 7,  category: "comida_arg" },
  { id: "bk38", name: "Pan tostado (solo)",                            portion: "2 rebanadas", calories: 160, protein: 5,  carbs: 30, fat: 2,  category: "comida_arg" },
  { id: "bk39", name: "Tostadas de arroz con queso crema",             portion: "3 unidades", calories: 130, protein: 4,  carbs: 18, fat: 5,  category: "comida_arg" },
  { id: "bk40", name: "Tostadas de arroz con palta",                   portion: "3 unidades", calories: 150, protein: 3,  carbs: 18, fat: 8,  category: "comida_arg" },

  // ---- YOGURES Y MEZCLAS (41-70) ----
  { id: "bk41", name: "Yogur natural",                                 portion: "1 vaso (125g)",  calories: 75,  protein: 6,   carbs: 9,  fat: 1.5, category: "lacteo" },
  { id: "bk42", name: "Yogur griego",                                  portion: "1 pote (150g)",  calories: 105, protein: 15,  carbs: 6,  fat: 2,   category: "lacteo" },
  { id: "bk43", name: "Yogur descremado",                              portion: "1 vaso (125g)",  calories: 55,  protein: 6,   carbs: 8,  fat: 0.2, category: "lacteo" },
  { id: "bk44", name: "Yogur entero",                                  portion: "1 vaso (125g)",  calories: 95,  protein: 5,   carbs: 9,  fat: 4,   category: "lacteo" },
  { id: "bk45", name: "Yogur sabor vainilla",                          portion: "1 pote (150g)",  calories: 140, protein: 6,   carbs: 24, fat: 2,   category: "lacteo" },
  { id: "bk46", name: "Yogur sabor frutilla",                          portion: "1 pote (150g)",  calories: 135, protein: 6,   carbs: 23, fat: 2,   category: "lacteo" },
  { id: "bk47", name: "Yogur sabor durazno",                           portion: "1 pote (150g)",  calories: 135, protein: 6,   carbs: 23, fat: 2,   category: "lacteo" },
  { id: "bk48", name: "Yogur sabor coco",                              portion: "1 pote (150g)",  calories: 150, protein: 6,   carbs: 22, fat: 4,   category: "lacteo" },
  { id: "bk49", name: "Yogur griego con miel",                         portion: "1 pote (170g)",  calories: 165, protein: 15,  carbs: 22, fat: 2,   category: "lacteo" },
  { id: "bk50", name: "Yogur griego con granola",                      portion: "1 bowl (200g)",  calories: 260, protein: 17,  carbs: 30, fat: 8,   category: "lacteo" },
  { id: "bk51", name: "Yogur natural con granola",                     portion: "1 bowl (200g)",  calories: 220, protein: 9,   carbs: 30, fat: 7,   category: "lacteo" },
  { id: "bk52", name: "Yogur natural con cereal",                      portion: "1 bowl (200g)",  calories: 200, protein: 8,   carbs: 36, fat: 3,   category: "lacteo" },
  { id: "bk53", name: "Yogur natural con frutas mixtas",               portion: "1 bowl (200g)",  calories: 140, protein: 7,   carbs: 23, fat: 2,   category: "lacteo" },
  { id: "bk54", name: "Yogur natural con banana",                      portion: "1 bowl (200g)",  calories: 160, protein: 7,   carbs: 30, fat: 2,   category: "lacteo" },
  { id: "bk55", name: "Yogur natural con frutilla",                    portion: "1 bowl (200g)",  calories: 120, protein: 7,   carbs: 19, fat: 2,   category: "lacteo" },
  { id: "bk56", name: "Yogur natural con arándanos",                   portion: "1 bowl (200g)",  calories: 130, protein: 7,   carbs: 22, fat: 2,   category: "lacteo" },
  { id: "bk57", name: "Yogur con manzana y canela",                    portion: "1 bowl (200g)",  calories: 140, protein: 7,   carbs: 26, fat: 2,   category: "lacteo" },
  { id: "bk58", name: "Yogur con avena y miel",                        portion: "1 bowl (220g)",  calories: 230, protein: 10,  carbs: 38, fat: 5,   category: "lacteo" },
  { id: "bk59", name: "Yogur con chía",                                portion: "1 bowl (180g)",  calories: 130, protein: 8,   carbs: 13, fat: 4,   category: "lacteo" },
  { id: "bk60", name: "Yogur con semillas de lino",                    portion: "1 bowl (180g)",  calories: 130, protein: 8,   carbs: 12, fat: 5,   category: "lacteo" },
  { id: "bk61", name: "Yogur con nueces",                              portion: "1 bowl (180g)",  calories: 200, protein: 9,   carbs: 12, fat: 13,  category: "lacteo" },
  { id: "bk62", name: "Yogur con almendras",                           portion: "1 bowl (180g)",  calories: 190, protein: 9,   carbs: 13, fat: 11,  category: "lacteo" },
  { id: "bk63", name: "Yogur con cacao en polvo",                      portion: "1 vaso (150g)",  calories: 100, protein: 8,   carbs: 12, fat: 2,   category: "lacteo" },
  { id: "bk64", name: "Yogur con mermelada",                           portion: "1 bowl (170g)",  calories: 150, protein: 6,   carbs: 28, fat: 2,   category: "lacteo" },
  { id: "bk65", name: "Yogur bebible",                                 portion: "1 botella (200ml)", calories: 130, protein: 5,  carbs: 23, fat: 2,   category: "lacteo" },
  { id: "bk66", name: "Yogur firme con frutas",                        portion: "1 pote (150g)",  calories: 140, protein: 6,   carbs: 24, fat: 2,   category: "lacteo" },
  { id: "bk67", name: "Yogur con granola y banana",                    portion: "1 bowl (250g)",  calories: 290, protein: 10,  carbs: 48, fat: 7,   category: "lacteo" },
  { id: "bk68", name: "Yogur con granola y frutilla",                  portion: "1 bowl (250g)",  calories: 250, protein: 10,  carbs: 38, fat: 7,   category: "lacteo" },
  { id: "bk69", name: "Yogur con granola y arándanos",                 portion: "1 bowl (250g)",  calories: 260, protein: 10,  carbs: 40, fat: 7,   category: "lacteo" },
  { id: "bk70", name: "Yogur proteico con frutas",                     portion: "1 pote (180g)",  calories: 160, protein: 20,  carbs: 16, fat: 2,   category: "lacteo" },

  // ---- CEREALES, AVENA, GRANOLAS (71-90) ----
  { id: "bk71", name: "Avena cocida con agua",                         portion: "1 plato (200g)", calories: 130, protein: 5,   carbs: 22, fat: 3,   category: "carbohidrato" },
  { id: "bk72", name: "Avena cocida con leche",                        portion: "1 plato (250g)", calories: 220, protein: 11,  carbs: 32, fat: 6,   category: "carbohidrato" },
  { id: "bk73", name: "Avena con leche y miel",                        portion: "1 plato (250g)", calories: 280, protein: 11,  carbs: 50, fat: 6,   category: "carbohidrato" },
  { id: "bk74", name: "Avena con leche y banana",                      portion: "1 plato (300g)", calories: 320, protein: 12,  carbs: 55, fat: 6,   category: "carbohidrato" },
  { id: "bk75", name: "Avena con leche y frutos secos",                portion: "1 plato (270g)", calories: 380, protein: 14,  carbs: 38, fat: 18,  category: "carbohidrato" },
  { id: "bk76", name: "Porridge de avena con frutas",                  portion: "1 bowl (300g)",  calories: 310, protein: 11,  carbs: 55, fat: 6,   category: "carbohidrato" },
  { id: "bk77", name: "Granola con leche",                             portion: "1 bowl (40g+leche)", calories: 240, protein: 8, carbs: 34, fat: 7,  category: "carbohidrato" },
  { id: "bk78", name: "Granola con yogur",                             portion: "1 bowl (40g+yog)",   calories: 245, protein: 11, carbs: 33, fat: 7, category: "carbohidrato" },
  { id: "bk79", name: "Cereal Corn Flakes con leche",                  portion: "1 bowl (30g+leche)", calories: 175, protein: 6, carbs: 32, fat: 2,  category: "carbohidrato" },
  { id: "bk80", name: "Cereal Choco Krispis con leche",                portion: "1 bowl (30g+leche)", calories: 200, protein: 5, carbs: 39, fat: 3,  category: "carbohidrato" },
  { id: "bk81", name: "Cereal All Bran con leche",                     portion: "1 bowl (30g+leche)", calories: 170, protein: 7, carbs: 30, fat: 3,  category: "carbohidrato" },
  { id: "bk82", name: "Cereal Frosties con leche",                     portion: "1 bowl (30g+leche)", calories: 200, protein: 5, carbs: 40, fat: 2,  category: "carbohidrato" },
  { id: "bk83", name: "Cereal Granix con leche",                       portion: "1 bowl (30g+leche)", calories: 180, protein: 6, carbs: 33, fat: 3,  category: "carbohidrato" },
  { id: "bk84", name: "Cereal integral con leche",                     portion: "1 bowl (30g+leche)", calories: 175, protein: 7, carbs: 30, fat: 3,  category: "carbohidrato" },
  { id: "bk85", name: "Muesli con leche",                              portion: "1 bowl (40g+leche)", calories: 220, protein: 9, carbs: 33, fat: 6,  category: "carbohidrato" },
  { id: "bk86", name: "Muesli con yogur",                              portion: "1 bowl (40g+yog)",   calories: 230, protein: 12, carbs: 32, fat: 6, category: "carbohidrato" },
  { id: "bk87", name: "Overnight oats (avena remojada)",               portion: "1 bowl (300g)", calories: 290, protein: 11,  carbs: 45, fat: 8,   category: "carbohidrato" },
  { id: "bk88", name: "Avena con manzana y canela",                    portion: "1 plato (300g)", calories: 250, protein: 8,   carbs: 48, fat: 5,   category: "carbohidrato" },
  { id: "bk89", name: "Cereal Trix con leche",                         portion: "1 bowl (30g+leche)", calories: 195, protein: 5, carbs: 38, fat: 2,  category: "carbohidrato" },
  { id: "bk90", name: "Cereal Special K con leche",                    portion: "1 bowl (30g+leche)", calories: 175, protein: 9, carbs: 30, fat: 2,  category: "carbohidrato" },

  // ---- OTROS DESAYUNOS (91-100) ----
  { id: "bk91",  name: "Café con leche y medialunas (2 un.)",          portion: "Combo",          calories: 530, protein: 9,   carbs: 60, fat: 27,  category: "comida_arg" },
  { id: "bk92",  name: "Mate cocido con tostadas (2 un.)",             portion: "Combo",          calories: 200, protein: 5,   carbs: 35, fat: 4,   category: "comida_arg" },
  { id: "bk93",  name: "Tostado de jamón y queso",                     portion: "1 unidad",       calories: 320, protein: 14,  carbs: 30, fat: 16,  category: "comida_arg" },
  { id: "bk94",  name: "Sándwich de queso crema y mermelada",          portion: "1 unidad",       calories: 300, protein: 8,   carbs: 48, fat: 9,   category: "comida_arg" },
  { id: "bk95",  name: "Smoothie de banana y avena",                   portion: "1 vaso (300ml)", calories: 250, protein: 8,   carbs: 45, fat: 5,   category: "bebida" },
  { id: "bk96",  name: "Smoothie de frutilla y yogur",                 portion: "1 vaso (300ml)", calories: 180, protein: 8,   carbs: 28, fat: 4,   category: "bebida" },
  { id: "bk97",  name: "Licuado de banana y leche",                    portion: "1 vaso (300ml)", calories: 220, protein: 9,   carbs: 38, fat: 4,   category: "bebida" },
  { id: "bk98",  name: "Pan con queso y mate",                         portion: "Combo arg",      calories: 280, protein: 12,  carbs: 35, fat: 11,  category: "comida_arg" },
  { id: "bk99",  name: "Tortilla de 2 huevos con tostada",             portion: "Plato (180g)",   calories: 290, protein: 18,  carbs: 18, fat: 16,  category: "comida_arg" },
  { id: "bk100", name: "Huevos revueltos con tostada y palta",         portion: "Plato (220g)",   calories: 380, protein: 17,  carbs: 30, fat: 22,  category: "comida_arg" },
]

export const FOOD_DATABASE: FoodItem[] = rawItems.map((item: any) => ({
  ...item,
  image:
    item.image
    || (item.category === "comida_arg"
      ? getArgentinianFoodEmoji(item.name)
      : getFoodImage(item.category)),
}))

// Helper para buscar en la base de datos
export function searchFoods(query: string, category?: string, limit = 50): FoodItem[] {
  const q = query.toLowerCase().trim()
  return FOOD_DATABASE
    .filter((f) => {
      const matchName = !q || f.name.toLowerCase().includes(q)
      const matchCat  = !category || f.category === category
      return matchName && matchCat
    })
    .slice(0, limit)
}
