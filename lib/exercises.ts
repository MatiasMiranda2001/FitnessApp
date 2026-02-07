import type { Exercise } from "./types"

export const defaultExercises: Exercise[] = [
  {
    id: "squat",
    name: "Sentadilla con Barra",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://youtube.com/watch?v=example_squat",
  },
  {
    id: "deadlift",
    name: "Peso Muerto Convencional",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://youtube.com/watch?v=example_deadlift",
  },
  {
    id: "bench-press",
    name: "Press de Banca",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://youtube.com/watch?v=example_bench",
  },
  {
    id: "overhead-press",
    name: "Press Militar",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://youtube.com/watch?v=example_ohp",
  },
  {
    id: "barbell-row",
    name: "Remo con Barra",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://youtube.com/watch?v=example_row",
  },
  {
    id: "pull-ups",
    name: "Dominadas",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://youtube.com/watch?v=example_pullups",
  },
  {
    id: "lateral-raises",
    name: "Elevaciones Laterales",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://youtube.com/watch?v=example_lateral",
  },
  {
    id: "leg-press",
    name: "Prensa de Piernas",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://youtube.com/watch?v=example_legpress",
  },
  {
    id: "romanian-deadlift",
    name: "Peso Muerto Rumano",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://youtube.com/watch?v=example_rdl",
  },
  {
    id: "incline-bench",
    name: "Press Inclinado con Mancuernas",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://youtube.com/watch?v=example_incline",
  },
  {
    id: "cable-fly",
    name: "Aperturas en Polea",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://youtube.com/watch?v=example_fly",
  },
  {
    id: "bicep-curl",
    name: "Curl de Bíceps con Barra",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://youtube.com/watch?v=example_curl",
  },
  {
    id: "tricep-pushdown",
    name: "Extensión de Tríceps en Polea",
    muscleGroup: "Brazos",
    videoPlaceholder: "https://youtube.com/watch?v=example_tricep",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscleGroup: "Hombros",
    videoPlaceholder: "https://youtube.com/watch?v=example_facepull",
  },
  {
    id: "leg-curl",
    name: "Curl de Piernas",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://youtube.com/watch?v=example_legcurl",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Piernas",
    videoPlaceholder: "https://youtube.com/watch?v=example_hipthrust",
  },
  {
    id: "cable-row",
    name: "Remo en Polea",
    muscleGroup: "Espalda",
    videoPlaceholder: "https://youtube.com/watch?v=example_cablerow",
  },
  {
    id: "dips",
    name: "Fondos en Paralelas",
    muscleGroup: "Pecho",
    videoPlaceholder: "https://youtube.com/watch?v=example_dips",
  },
]

export const muscleGroupLabels: Record<string, string> = {
  Piernas: "Piernas",
  Espalda: "Espalda",
  Pecho: "Pecho",
  Hombros: "Hombros",
  Brazos: "Brazos",
}
