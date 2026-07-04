import type { WeeklyRoutine } from "./types"

export const routineTemplates: WeeklyRoutine[] = [
  {
    id: "template-ppl",
    name: "Push/Pull/Legs (Jeff Nippard)",
    isTemplate: true,
    days: [
      {
        dayNumber: 1,
        label: "Empuje",
        exercises: [
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "overhead-press", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "incline-bench", sets: 3, reps: "10-12", rpe: 7, section: "complementario" },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 8, section: "accesorio" },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
          { exerciseId: "dips", sets: 3, reps: "8-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 2,
        label: "Jalón",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8, section: "principal" },
          { exerciseId: "barbell-row", sets: 4, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8, section: "complementario" },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7, section: "accesorio" },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7, section: "accesorio" },
          { exerciseId: "bicep-curl", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
        ],
      },
      {
        dayNumber: 3,
        label: "Pierna",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 8, section: "complementario" },
          { exerciseId: "leg-curl", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
          { exerciseId: "hip-thrust", sets: 3, reps: "8-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 4,
        label: "Empuje 2",
        exercises: [
          { exerciseId: "overhead-press", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "incline-bench", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "cable-fly", sets: 3, reps: "12-15", rpe: 7, section: "accesorio" },
          { exerciseId: "lateral-raises", sets: 4, reps: "12-15", rpe: 8, section: "accesorio" },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
        ],
      },
      {
        dayNumber: 5,
        label: "Jalón 2",
        exercises: [
          { exerciseId: "barbell-row", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8, section: "complementario" },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7, section: "accesorio" },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7, section: "accesorio" },
          { exerciseId: "bicep-curl", sets: 4, reps: "8-12", rpe: 8, section: "accesorio" },
        ],
      },
      {
        dayNumber: 6,
        label: "Pierna 2",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 8, section: "principal" },
          { exerciseId: "leg-press", sets: 4, reps: "10-12", rpe: 8, section: "complementario" },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "10-12", rpe: 7, section: "complementario" },
          { exerciseId: "leg-curl", sets: 3, reps: "12-15", rpe: 8, section: "accesorio" },
          { exerciseId: "hip-thrust", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
        ],
      },
    ],
  },
  {
    id: "template-ul",
    name: "Upper/Lower (Torso/Pierna)",
    isTemplate: true,
    days: [
      {
        dayNumber: 1,
        label: "Torso A",
        exercises: [
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "barbell-row", sets: 4, reps: "6-8", rpe: 8, section: "complementario" },
          { exerciseId: "overhead-press", sets: 3, reps: "8-10", rpe: 7, section: "complementario" },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8, section: "accesorio" },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 7, section: "accesorio" },
          { exerciseId: "bicep-curl", sets: 2, reps: "10-12", rpe: 7, section: "accesorio" },
          { exerciseId: "tricep-pushdown", sets: 2, reps: "10-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 2,
        label: "Pierna A",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 7, section: "complementario" },
          { exerciseId: "leg-curl", sets: 3, reps: "10-12", rpe: 8, section: "accesorio" },
        ],
      },
      {
        dayNumber: 3,
        label: "Torso B",
        exercises: [
          { exerciseId: "incline-bench", sets: 4, reps: "8-10", rpe: 8, section: "principal" },
          { exerciseId: "cable-row", sets: 4, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "cable-fly", sets: 3, reps: "12-15", rpe: 7, section: "accesorio" },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7, section: "accesorio" },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 8, section: "accesorio" },
          { exerciseId: "dips", sets: 3, reps: "8-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 4,
        label: "Pierna B",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8, section: "principal" },
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 7, section: "complementario" },
          { exerciseId: "hip-thrust", sets: 3, reps: "8-12", rpe: 8, section: "accesorio" },
          { exerciseId: "leg-curl", sets: 3, reps: "12-15", rpe: 7, section: "accesorio" },
        ],
      },
    ],
  },
  {
    id: "template-fb",
    name: "Full Body (3 días)",
    isTemplate: true,
    days: [
      {
        dayNumber: 1,
        label: "Full Body A",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "barbell-row", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 7, section: "accesorio" },
          { exerciseId: "bicep-curl", sets: 2, reps: "10-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 2,
        label: "Full Body B",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8, section: "principal" },
          { exerciseId: "overhead-press", sets: 4, reps: "6-8", rpe: 8, section: "principal" },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8, section: "complementario" },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 7, section: "complementario" },
          { exerciseId: "tricep-pushdown", sets: 2, reps: "10-12", rpe: 7, section: "accesorio" },
        ],
      },
      {
        dayNumber: 3,
        label: "Full Body C",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 7, section: "principal" },
          { exerciseId: "incline-bench", sets: 3, reps: "8-10", rpe: 8, section: "principal" },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7, section: "complementario" },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8, section: "complementario" },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7, section: "accesorio" },
        ],
      },
    ],
  },
]
