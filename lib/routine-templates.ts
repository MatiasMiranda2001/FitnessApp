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
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "overhead-press", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "incline-bench", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 8 },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rpe: 8 },
          { exerciseId: "dips", sets: 3, reps: "8-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 2,
        label: "Jal\u00f3n",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8 },
          { exerciseId: "barbell-row", sets: 4, reps: "8-10", rpe: 8 },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8 },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7 },
          { exerciseId: "bicep-curl", sets: 3, reps: "10-12", rpe: 8 },
        ],
      },
      {
        dayNumber: 3,
        label: "Pierna",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 8 },
          { exerciseId: "leg-curl", sets: 3, reps: "10-12", rpe: 8 },
          { exerciseId: "hip-thrust", sets: 3, reps: "8-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 4,
        label: "Empuje 2",
        exercises: [
          { exerciseId: "overhead-press", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "incline-bench", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "cable-fly", sets: 3, reps: "12-15", rpe: 7 },
          { exerciseId: "lateral-raises", sets: 4, reps: "12-15", rpe: 8 },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rpe: 8 },
        ],
      },
      {
        dayNumber: 5,
        label: "Jal\u00f3n 2",
        exercises: [
          { exerciseId: "barbell-row", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8 },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7 },
          { exerciseId: "bicep-curl", sets: 4, reps: "8-12", rpe: 8 },
        ],
      },
      {
        dayNumber: 6,
        label: "Pierna 2",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "leg-press", sets: 4, reps: "10-12", rpe: 8 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "leg-curl", sets: 3, reps: "12-15", rpe: 8 },
          { exerciseId: "hip-thrust", sets: 3, reps: "10-12", rpe: 8 },
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
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "barbell-row", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "overhead-press", sets: 3, reps: "8-10", rpe: 7 },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8 },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 7 },
          { exerciseId: "bicep-curl", sets: 2, reps: "10-12", rpe: 7 },
          { exerciseId: "tricep-pushdown", sets: 2, reps: "10-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 2,
        label: "Pierna A",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "leg-curl", sets: 3, reps: "10-12", rpe: 8 },
        ],
      },
      {
        dayNumber: 3,
        label: "Torso B",
        exercises: [
          { exerciseId: "incline-bench", sets: 4, reps: "8-10", rpe: 8 },
          { exerciseId: "cable-row", sets: 4, reps: "8-10", rpe: 8 },
          { exerciseId: "cable-fly", sets: 3, reps: "12-15", rpe: 7 },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7 },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 8 },
          { exerciseId: "dips", sets: 3, reps: "8-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 4,
        label: "Pierna B",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8 },
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 7 },
          { exerciseId: "hip-thrust", sets: 3, reps: "8-12", rpe: 8 },
          { exerciseId: "leg-curl", sets: 3, reps: "12-15", rpe: 7 },
        ],
      },
    ],
  },
  {
    id: "template-fb",
    name: "Full Body (3 d\u00edas)",
    isTemplate: true,
    days: [
      {
        dayNumber: 1,
        label: "Full Body A",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "bench-press", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "barbell-row", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "lateral-raises", sets: 3, reps: "12-15", rpe: 7 },
          { exerciseId: "bicep-curl", sets: 2, reps: "10-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 2,
        label: "Full Body B",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "5-6", rpe: 8 },
          { exerciseId: "overhead-press", sets: 4, reps: "6-8", rpe: 8 },
          { exerciseId: "pull-ups", sets: 3, reps: "6-10", rpe: 8 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "tricep-pushdown", sets: 2, reps: "10-12", rpe: 7 },
        ],
      },
      {
        dayNumber: 3,
        label: "Full Body C",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "8-10", rpe: 7 },
          { exerciseId: "incline-bench", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "cable-row", sets: 3, reps: "10-12", rpe: 7 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rpe: 8 },
          { exerciseId: "face-pull", sets: 3, reps: "15-20", rpe: 7 },
        ],
      },
    ],
  },
]
