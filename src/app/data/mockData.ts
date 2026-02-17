import { WorkoutStatus } from "../components/CardWorkout";
import { SeriesData } from "../screens/coach/AddExercisesScreen";

// Datos del cliente
export const clientData = {
  plan: "Basic" as "Basic" | "Premium", // Plan actual del cliente

  weeklyProgress: {
    completedSets: 45,
    totalSets: 60,
    completedWorkouts: 4,
    totalWorkouts: 5,
    totalTime: "3h 20min",
  },

  insights: {
    weight: {
      value: 78.5,
      unit: "kg",
      trend: "down" as const,
      trendValue: "-1.2kg",
    },
    height: {
      value: 175,
      unit: "cm",
      trend: "neutral" as const,
    },
    bodyFat: {
      value: 18,
      unit: "%",
      trend: "down" as const,
      trendValue: "-2%",
    },
    bmi: {
      value: 25.6,
      unit: "",
      trend: "down" as const,
      trendValue: "-0.4",
    },
  },

  personalRecords: [
    {
      exercise: "Press Banca",
      value: "95kg",
      date: "2 días atrás",
    },
    {
      exercise: "Sentadilla",
      value: "120kg",
      date: "1 semana atrás",
    },
    {
      exercise: "Peso Muerto",
      value: "140kg",
      date: "3 días atrás",
    },
  ],

  coach: {
    name: "María González",
    rating: 4.9,
    specialty: "Hipertrofia y fuerza",
    certifications: [
      "NSCA-CPT",
      "CrossFit L2",
      "Nutrición deportiva",
    ],
  },
};

export const workouts: Array<{
  id: string;
  title: string;
  exercises: number;
  duration: string;
  status: WorkoutStatus;
  exerciseList?: Array<{
    id: string;
    name: string;
    sets: number;
    reps?: string;
    time?: string;
    rest: string;
    notes?: string;
    seriesData?: SeriesData[]; // Nueva propiedad para detalle por serie
  }>;
}> = [
  {
    id: "w1",
    title: "Pecho y Tríceps",
    exercises: 6,
    duration: "45 min",
    status: "completed",
    exerciseList: [
      {
        id: "e1",
        name: "Press Banca",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        // Ejemplo con seriesData detallado (plan Premium)
        seriesData: [
          { reps: "10", weight: "80kg", rir: "2" },
          { reps: "8", weight: "85kg", rir: "1" },
          { reps: "8", weight: "85kg", rir: "2" },
          { reps: "6", weight: "90kg", rir: "1" },
        ],
      },
      {
        id: "e2",
        name: "Press Inclinado",
        sets: 3,
        reps: "10-12",
        rest: "60s",
        seriesData: [
          { reps: "12", weight: "70kg", rir: "2" },
          { reps: "10", weight: "75kg", rir: "2" },
          { reps: "10", weight: "75kg", rir: "3" },
        ],
      },
      {
        id: "e3",
        name: "Aperturas con Mancuernas",
        sets: 3,
        reps: "12-15",
        rest: "60s",
        seriesData: [
          { reps: "15", weight: "20kg", rir: "3" },
          { reps: "12", weight: "22kg", rir: "2" },
          { reps: "12", weight: "22kg", rir: "2" },
        ],
      },
      {
        id: "e4",
        name: "Extensiones de Tríceps",
        sets: 3,
        reps: "12-15",
        rest: "45s",
      },
      {
        id: "e5",
        name: "Fondos",
        sets: 3,
        reps: "10-12",
        rest: "60s",
      },
      {
        id: "e6",
        name: "Press Francés",
        sets: 3,
        reps: "12-15",
        rest: "45s",
      },
    ],
  },
  {
    id: "w2",
    title: "Espalda y Bíceps",
    exercises: 6,
    duration: "50 min",
    status: "in-progress",
    exerciseList: [
      {
        id: "e7",
        name: "Dominadas",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        seriesData: [
          { reps: "10", weight: "BW", rir: "1" },
          { reps: "8", weight: "BW", rir: "0" },
          { reps: "8", weight: "BW", rir: "1" },
          { reps: "6", weight: "BW", rir: "0" },
        ],
      },
      {
        id: "e8",
        name: "Remo con Barra",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        seriesData: [
          { reps: "10", weight: "80%", rir: "2" },
          { reps: "8", weight: "85%", rir: "1" },
          { reps: "8", weight: "85%", rir: "2" },
          { reps: "8", weight: "80%", rir: "2" },
        ],
      },
      {
        id: "e9",
        name: "Peso Muerto Rumano",
        sets: 3,
        reps: "10-12",
        rest: "90s",
      },
      {
        id: "e10",
        name: "Curl con Barra",
        sets: 3,
        reps: "10-12",
        rest: "60s",
      },
      {
        id: "e11",
        name: "Curl Martillo",
        sets: 3,
        reps: "12-15",
        rest: "45s",
      },
      {
        id: "e12",
        name: "Curl Concentrado",
        sets: 3,
        reps: "12-15",
        rest: "45s",
      },
    ],
  },
  {
    id: "w3",
    title: "Piernas",
    exercises: 5,
    duration: "55 min",
    status: "pending",
    exerciseList: [
      {
        id: "e13",
        name: "Sentadilla",
        sets: 4,
        reps: "8-10",
        rest: "120s",
        seriesData: [
          { reps: "10", weight: "100kg", rir: "2" },
          { reps: "8", weight: "110kg", rir: "1" },
          { reps: "8", weight: "110kg", rir: "2" },
          { reps: "6", weight: "115kg", rir: "1" },
        ],
      },
      {
        id: "e14",
        name: "Prensa",
        sets: 4,
        reps: "10-12",
        rest: "90s",
      },
      {
        id: "e15",
        name: "Peso Muerto",
        sets: 3,
        reps: "8-10",
        rest: "120s",
      },
      {
        id: "e16",
        name: "Extensiones",
        sets: 3,
        reps: "12-15",
        rest: "60s",
      },
      {
        id: "e17",
        name: "Curl Femoral",
        sets: 3,
        reps: "12-15",
        rest: "60s",
      },
    ],
  },
];

// Datos del entrenador
export const coachData = {
  dailySummary: {
    activeClients: 12,
    completedWorkouts: 8,
    alerts: 3,
  },

  profile: {
    name: "María González",
    bio: "Entrenador certificado con 8 años de experiencia en hipertrofia, fuerza y acondicionamiento funcional.",
    specialties: ["Hipertrofia", "Fuerza", "Acondicionamiento"],
    certifications: [
      "NSCA-CPT",
      "CrossFit L2",
      "Nutrición deportiva",
      "ISSA",
    ],
    metrics: {
      retention: 92,
      nps: 87,
      activeClients: 35,
    },
  },

  customTemplates: [
    {
      id: "t1",
      name: "Plan Principiantes",
      description:
        "Ideal para clientes Basic sin experiencia previa",
      weeks: 6,
      days: 3,
      exercises: [
        {
          id: "e1",
          name: "Sentadilla Goblet",
          totalSets: 3,
          seriesData: [
            { reps: "12", weight: "10" },
            { reps: "12", weight: "10" },
            { reps: "15", weight: "10" },
          ],
          rest: "90s",
        },
        {
          id: "e2",
          name: "Press Banca con Mancuernas",
          totalSets: 3,
          seriesData: [
            { reps: "10", weight: "15" },
            { reps: "10", weight: "15" },
            { reps: "12", weight: "12.5" },
          ],
          rest: "90s",
        },
        {
          id: "e3",
          name: "Remo con Mancuernas",
          totalSets: 3,
          seriesData: [
            { reps: "12", weight: "12" },
            { reps: "12", weight: "12" },
            { reps: "15", weight: "10" },
          ],
          rest: "60s",
        },
        {
          id: "e4",
          name: "Peso Muerto Rumano",
          totalSets: 3,
          seriesData: [
            { reps: "10", weight: "40" },
            { reps: "10", weight: "40" },
            { reps: "12", weight: "35" },
          ],
          rest: "90s",
        },
        {
          id: "e5",
          name: "Press Militar con Mancuernas",
          totalSets: 3,
          seriesData: [
            { reps: "10", weight: "10" },
            { reps: "10", weight: "10" },
            { reps: "12", weight: "8" },
          ],
          rest: "60s",
        },
      ],
    },
    {
      id: "t2",
      name: "Fullbody Express",
      description:
        "Para clientes con poco tiempo, 45min por sesión",
      weeks: 4,
      days: 3,
      exercises: [
        {
          id: "e1",
          name: "Sentadilla con Barra",
          totalSets: 4,
          seriesData: [
            { reps: "8", weight: "60" },
            { reps: "8", weight: "60" },
            { reps: "10", weight: "55" },
            { reps: "10", weight: "55" },
          ],
          rest: "90s",
        },
        {
          id: "e2",
          name: "Press Banca",
          totalSets: 4,
          seriesData: [
            { reps: "8", weight: "70" },
            { reps: "8", weight: "70" },
            { reps: "10", weight: "65" },
            { reps: "10", weight: "65" },
          ],
          rest: "90s",
        },
        {
          id: "e3",
          name: "Remo con Barra",
          totalSets: 3,
          seriesData: [
            { reps: "10", weight: "50" },
            { reps: "10", weight: "50" },
            { reps: "12", weight: "45" },
          ],
          rest: "60s",
        },
        {
          id: "e4",
          name: "Estocadas",
          totalSets: 3,
          seriesData: [
            { reps: "10", weight: "20" },
            { reps: "10", weight: "20" },
            { reps: "12", weight: "17.5" },
          ],
          rest: "60s",
        },
        {
          id: "e5",
          name: "Curl con Barra",
          totalSets: 2,
          seriesData: [
            { reps: "12", weight: "25" },
            { reps: "15", weight: "20" },
          ],
          rest: "45s",
        },
        {
          id: "e6",
          name: "Extensiones de Tríceps",
          totalSets: 2,
          seriesData: [
            { reps: "12", weight: "15" },
            { reps: "15", weight: "12.5" },
          ],
          rest: "45s",
        },
      ],
    },
  ],

  clients: [
    {
      id: "c1",
      name: "Carlos Rodríguez",
      lastActivity: "Hoy, 14:30",
      adherence: 85,
      hasAlert: false,
      plan: "Premium" as "Basic" | "Premium",
    },
    {
      id: "c2",
      name: "Ana Martínez",
      lastActivity: "Hoy, 09:15",
      adherence: 92,
      hasAlert: false,
      plan: "Premium" as "Basic" | "Premium",
    },
    {
      id: "c3",
      name: "Juan Pérez",
      lastActivity: "Hace 3 días",
      adherence: 45,
      hasAlert: true,
      alertMessage: "Sin registros por 3 días",
      plan: "Basic" as "Basic" | "Premium",
    },
    {
      id: "c4",
      name: "Laura Fernández",
      lastActivity: "Ayer, 18:00",
      adherence: 78,
      hasAlert: false,
      plan: "Basic" as "Basic" | "Premium",
    },
    {
      id: "c5",
      name: "Diego López",
      lastActivity: "Hace 5 días",
      adherence: 35,
      hasAlert: true,
      alertMessage: "Baja adherencia últimas 2 semanas",
      plan: "Basic" as "Basic" | "Premium",
    },
  ],
};

export const clientDetail = {
  id: "c1",
  name: "Carlos Rodríguez",
  adherence: 85,
  metrics: [
    {
      label: "Peso",
      value: 78.5,
      unit: "kg",
      history: [80, 79.5, 79, 78.5],
    },
    {
      label: "% Grasa",
      value: 18,
      unit: "%",
      history: [22, 20, 19, 18],
    },
    {
      label: "IMC",
      value: 25.6,
      unit: "",
      history: [26.8, 26.2, 25.9, 25.6],
    },
  ],
  assignedPlans: [
    {
      id: "p1",
      name: "Hipertrofia 4 días",
      startDate: "2026-01-15",
      status: "active",
    },
  ],
  recentWorkouts: [
    {
      date: "2026-02-05",
      name: "Pecho y Tríceps",
      completed: true,
    },
    {
      date: "2026-02-04",
      name: "Espalda y Bíceps",
      completed: true,
    },
    { date: "2026-02-02", name: "Piernas", completed: true },
  ],
};