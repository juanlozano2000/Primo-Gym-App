# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (Vite)
npm run build     # Production build
```

There is no test runner configured in this project.

## Environment Variables

Create a `.env` file at the root with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These are required — the app throws at startup if missing (`src/app/lib/supabase.ts`).

## Architecture

This is a **React + Vite + TypeScript** app styled with **Tailwind CSS v4** and **shadcn/ui** (Radix UI primitives). It is a mobile-first gym management app with two user roles: **coach** and **client**.

### Navigation model

There is no router. Navigation is entirely managed in `src/app/App.tsx` via React state (`clientScreen` / `coachScreen` discriminated unions). Each screen is a full-page component rendered conditionally. Screen transitions happen by calling navigate functions passed down as props.

- `ClientScreen` union: `home | workouts | workout-detail | account`
- `CoachScreen` union: `home | clients | client-detail | edit-plan | account | create-plan | add-workouts | add-exercises | assign-plan`

The coach plan-creation flow is a multi-step wizard: `CreatePlan -> AddWorkouts -> AddExercises -> AssignPlan`, with state threaded through props (`PlanBasicInfo`, `WorkoutData[]`).

### Auth

`src/app/context/AuthContext.tsx` wraps the app in `AuthProvider`. It uses Supabase Auth and reads user role/name from the `profiles` table. Profile data is cached in `localStorage` with the key `spoter_profile_<userId>` to avoid repeat DB calls. Sessions auto-expire after 30 minutes of inactivity.

`useAuth()` exposes: `user` (`{ id, email, role, fullName }`), `isAuthenticated`, `loading`, `login()`, `logout()`.

### Supabase / Data layer

- `src/app/lib/supabase.ts` — singleton Supabase client
- `src/app/services/dashboardService.ts` — coach dashboard queries (clients + sessions)
- `src/app/services/planService.ts` — workout plan CRUD, exercise lookup, on-the-fly exercise creation
- `src/app/services/clientService.ts` — client-facing data

Key Supabase tables: `profiles`, `coach_clients`, `workouts`, `workout_sessions`, `exercises`.

`src/app/data/mockData.ts` contains static fallback/demo data used by some screens.

### Component layers

- `src/app/components/ui/` — shadcn/ui primitives (do not edit unless updating the design system)
- `src/app/components/` — app-specific shared components (`AppBar`, `TabBar`, `CardWorkout`, `ClientListItem`, etc.)
- `src/app/screens/client/` and `src/app/screens/coach/` — full-page screen components

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`). Theme tokens are defined in `src/styles/theme.css`. Global styles in `src/styles/index.css`. Custom fonts in `src/styles/fonts.css`.
