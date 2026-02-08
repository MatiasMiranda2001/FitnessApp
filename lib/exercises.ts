import type { Exercise } from "./types"

export const defaultExercises: Exercise[] = [
  // --- PIERNAS ---
  {
    id: "squat",
    name: "Sentadilla con Barra",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=sentadilla+con+barra+tecnica",
  },
  {
    id: "leg-press",
    name: "Prensa de Piernas",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=prensa+de+piernas+gym",
  },
  {
    id: "romanian-deadlift",
    name: "Peso Muerto Rumano",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=peso+muerto+rumano+tecnica",
  },
  {
    id: "bulgarian-split-squat",
    name: "Sentadilla Búlgara",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=sentadilla+bulgara",
  },
  {
    id: "quad-extension",
    name: "Extensiones de Cuádriceps",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=extensiones+de+cuadriceps",
  },
  {
    id: "hamstring-curl",
    name: "Curl Femoral (Tumbado/Sentado)",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=curl+femoral+maquina",
  },
  {
    id: "lunges",
    name: "Zancadas (Lunges)",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=zancadas+con+mancuernas",
  },
  {
    id: "calf-raise",
    name: "Elevación de Gemelos",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=elevacion+talones+gemelos",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://www.youtube.com/results?search_query=hip+thrust+tecnica",
  },

  // --- ESPALDA ---
  {
    id: "deadlift",
    name: "Peso Muerto Convencional",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=peso+muerto+convencional",
  },
  {
    id: "pull-ups",
    name: "Dominadas",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=dominadas+tecnica",
  },
  {
    id: "lat-pulldown",
    name: "Jalón al Pecho",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=jalon+al+pecho",
  },
  {
    id: "barbell-row",
    name: "Remo con Barra",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=remo+con+barra+tecnica",
  },
  {
    id: "dumbbell-row",
    name: "Remo con Mancuerna",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=remo+con+mancuerna",
  },
  {
    id: "cable-row",
    name: "Remo en Polea Baja",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=remo+en+polea+baja",
  },
  {
    id: "pullover-cable",
    name: "Pullover en Polea Alta",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://www.youtube.com/results?search_query=pullover+polea+alta+espalda",
  },

  // --- PECHO ---
  {
    id: "bench-press",
    name: "Press de Banca (Barra)",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+banca+tecnica",
  },
  {
    id: "dumbbell-press",
    name: "Press Plano con Mancuernas",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+plano+mancuernas",
  },
  {
    id: "incline-bench",
    name: "Press Inclinado (Mancuernas)",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+inclinado+mancuernas",
  },
  {
    id: "incline-barbell",
    name: "Press Inclinado (Barra)",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+inclinado+barra",
  },
  {
    id: "dips",
    name: "Fondos en Paralelas",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=fondos+paralelas+pecho",
  },
  {
    id: "cable-fly",
    name: "Cruce de Poleas (Aperturas)",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=cruce+de+poleas+pecho",
  },
  {
    id: "push-ups",
    name: "Flexiones (Push-ups)",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://www.youtube.com/results?search_query=flexiones+correctas",
  },

  // --- HOMBROS ---
  {
    id: "overhead-press",
    name: "Press Militar (Barra)",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+militar+barra",
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Press de Hombros (Mancuernas)",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+hombros+mancuernas",
  },
  {
    id: "lateral-raises",
    name: "Elevaciones Laterales",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://www.youtube.com/results?search_query=elevaciones+laterales+mancuernas",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://www.youtube.com/results?search_query=face+pull+hombro",
  },
  {
    id: "rear-delt-fly",
    name: "Pájaros (Posterior)",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://www.youtube.com/results?search_query=pajaros+mancuernas+hombro",
  },

  // --- BRAZOS (Bíceps/Tríceps) ---
  {
    id: "bicep-curl-barbell",
    name: "Curl de Bíceps con Barra",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=curl+barra+biceps",
  },
  {
    id: "bicep-curl-dumbbell",
    name: "Curl de Bíceps con Mancuernas",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=curl+mancuernas+biceps",
  },
  {
    id: "hammer-curl",
    name: "Curl Martillo",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=curl+martillo",
  },
  {
    id: "tricep-pushdown",
    name: "Extensión de Tríceps en Polea",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=extension+triceps+polea",
  },
  {
    id: "skull-crushers",
    name: "Press Francés",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=press+frances+triceps",
  },
  {
    id: "tricep-overhead",
    name: "Extensión de Tríceps sobre cabeza",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://www.youtube.com/results?search_query=extension+triceps+coplea+cabeza",
  },

  // --- ABDOMEN ---
  {
    id: "plank",
    name: "Plancha Abdominal (Plank)",
    muscleGroup: "Abdomen",
    videoPlaceholder: "https://www.youtube.com/results?search_query=plancha+abdominal+correcta",
  },
  {
    id: "leg-raises",
    name: "Elevación de Piernas (Colgado/Suelo)",
    muscleGroup: "Abdomen",
    videoPlaceholder: "https://www.youtube.com/results?search_query=elevacion+piernas+abdominales",
  },
  {
    id: "ab-wheel",
    name: "Rueda Abdominal",
    muscleGroup: "Abdomen",
    videoPlaceholder: "https://www.youtube.com/results?search_query=rueda+abdominal+tecnica",
  },
  {
    id: "crunch",
    name: "Crunch Abdominal",
    muscleGroup: "Abdomen",
    videoPlaceholder: "https://www.youtube.com/results?search_query=crunch+abdominal",
  },

  // --- CARDIO ---
  {
    id: "treadmill",
    name: "Cinta de Correr",
    muscleGroup: "Cardio",
    videoPlaceholder: "https://www.youtube.com/results?search_query=cinta+correr+hiit",
  },
  {
    id: "cycling",
    name: "Bicicleta Estática",
    muscleGroup: "Cardio",
    videoPlaceholder: "https://www.youtube.com/results?search_query=bicicleta+estatica+entrenamiento",
  },
  {
    id: "elliptical",
    name: "Elíptica",
    muscleGroup: "Cardio",
    videoPlaceholder: "https://www.youtube.com/results?search_query=eliptica+cardio",
  },
  {
    id: "jump-rope",
    name: "Salto a la Comba",
    muscleGroup: "Cardio",
    videoPlaceholder: "https://www.youtube.com/results?search_query=saltar+la+comba+rutina",
  },
]

export const muscleGroupLabels: Record<string, string> = {
  Piernas: "Piernas",
  Espalda: "Espalda",
  Pecho: "Pecho",
  Hombros: "Hombros",
  Brazos: "Brazos",
  Abdomen: "Abdomen",
  Cardio: "Cardio",
}