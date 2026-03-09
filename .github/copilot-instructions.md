# Copilot Instructions — Primo Gym App

## Overview

Mobile-first gym management app (React + Vite + TypeScript) with two user roles: **coach** and **client**. Styled with Tailwind CSS v4 and shadcn/ui (Radix primitives). Backend is Supabase (auth + Postgres).

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (Vite)
npm run build     # Production build
```

No test runner is configured. There is no linter script — rely on TypeScript for correctness.

## Environment Variables

A `.env` file at the root must contain:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app throws at startup if these are missing (`src/app/lib/supabase.ts`).

## Architecture

### Navigation (no router)

All navigation lives in `src/app/App.tsx` via discriminated-union state — **no React Router**.

- **ClientScreen**: `home | workouts | workout-detail | account`
- **CoachScreen**: `home | clients | client-detail | edit-plan | account | create-plan | add-workouts | add-exercises | assign-plan`

Screen transitions happen by calling state-setter functions passed as props. To add a new screen:

1. Extend the union type in `App.tsx`.
2. Create the screen component in `src/app/screens/{role}/`.
3. Add the `case` in the render switch and wire navigation handlers.

The coach plan-creation flow is a **multi-step wizard** (`CreatePlan → AddWorkouts → AddExercises → AssignPlan`) with state threaded through props (`PlanBasicInfo`, `WorkoutData[]`, `WorkoutExercises[]`).

### Auth

`src/app/context/AuthContext.tsx` — `AuthProvider` wrapping the app.

- Supabase Auth session + profile from the `profiles` table.
- Profile cached in `localStorage` as `spoter_profile_<userId>` to skip repeated DB calls.
- 30-minute inactivity timeout auto-logs out.
- Use `useAuth()` for `{ user, isAuthenticated, loading, login(), logout() }`.

### Data layer (Supabase)

- `src/app/lib/supabase.ts` — singleton client (import from here, never create another).
- `src/app/services/dashboardService.ts` — coach dashboard (clients, sessions, alerts).
- `src/app/services/planService.ts` — CRUD for workout plans, exercises, assignment.
- `src/app/services/clientService.ts` — client-facing queries (upcoming workouts, weekly progress).

Key tables: `profiles`, `coach_clients`, `workouts`, `workout_items`, `workout_item_sets`, `exercises`, `assigned_plans`, `workout_sessions`, `exercise_logs`, `body_metrics`, `coach_details`.

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin.
- Theme tokens (CSS custom variables) in `src/styles/theme.css` — primary purple `#5B2C91`, accent orange `#FF6B35`.
- Global styles in `src/styles/index.css` — mobile viewport, safe-area helpers, smooth scrolling.
- Path alias: `@` → `./src` (configured in `vite.config.ts`).

### Component layers

| Layer | Path | Notes |
|-------|------|-------|
| shadcn/ui primitives | `src/app/components/ui/` | **Do not edit** unless updating the design system |
| Shared app components | `src/app/components/` | `AppBar`, `TabBar`, `CardWorkout`, `MetricChip`, etc. |
| Screen components | `src/app/screens/client/`, `src/app/screens/coach/` | Full-page components |

## Conventions

### Code style

- **TypeScript** — always type props with explicit interfaces; export them when other screens consume them.
- **Functional components** with hooks (`useState`, `useEffect`).
- **Callbacks**: prefix with `on` (e.g., `onBack`, `onNavigateToDetail`).
- **Services**: async functions returning typed payloads; errors handled with try/catch + `console.error`.
- **Icons**: `lucide-react` throughout.
- **Toasts**: `sonner` library, position `top-center richColors`.
- **Date utilities**: `date-fns`.

### Styling rules

- Use Tailwind utility classes — not inline styles or CSS modules.
- Reference theme tokens via CSS variables (`var(--primary)`, `var(--accent)`, etc.).
- Mobile-first: design for 430px width, use safe-area insets for iOS.
- `TabBar` is fixed at the bottom; only rendered for base screens (not detail/wizard screens).

### Anti-patterns to avoid

- **Do not** install or use React Router — navigation is state-driven.
- **Do not** create a second Supabase client — import from `src/app/lib/supabase.ts`.
- **Do not** edit files in `src/app/components/ui/` for feature work.
- **Do not** bypass the `useAuth` hook for user data.
- **Do not** store data in `localStorage` beyond the auth profile cache.
- **Do not** use `px` heights for full-screen layouts — use `dvh` units and safe-area env variables.

## Key dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| @supabase/supabase-js | ^2.95.3 | Backend client |
| tailwindcss | 4.1.12 | Styling |
| lucide-react | 0.487.0 | Icons |
| motion | 12.23.24 | Animations |
| sonner | 2.0.3 | Toast notifications |
| date-fns | 3.6.0 | Date formatting |
| recharts | 2.15.2 | Charts |
| react-hook-form | 7.55.0 | Form management |
| react-dnd | 16.0.1 | Drag & drop |
