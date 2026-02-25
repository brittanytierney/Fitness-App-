// fitness-app/client/src/api/workoutsApi.ts
import { http } from "./http";

/**
 * NOTE:
 * This file is intentionally typed to align with your existing UI page types.
 * Several functions return `any` so TS doesn't fight your page-level types
 * (DaySummary, RecentDay, PRRow, WeekRow, etc.) during production builds.
 */

export type WorkoutSet = {
  reps: number;
  weight?: number;
  restSeconds?: number;
  completedAt?: string | null; // ✅ allow null (your UI uses string | null)
};

export type WorkoutEntry = {
  exerciseName: string;
  sets: WorkoutSet[];
};

export type WorkoutDay = {
  _id?: string;
  date: string; // YYYY-MM-DD
  workoutType?: string;
  entries: WorkoutEntry[];
  completed?: boolean;
};

/**
 * GET one workout day by date
 * Expected: GET /workouts/day/:date
 */
export async function apiGetWorkoutDay(date: string): Promise<any> {
  const res = await http.get(`/workouts/day/${date}`);
  return res.data;
}

/**
 * UPSERT workout day by date
 * Expected: POST /workouts/day/:date
 *
 * Your UI calls this with { workoutType, entries } (no date),
 * so payload must be Partial<WorkoutDay>.
 */
export async function apiUpsertWorkoutDay(
  date: string,
  payload: Partial<WorkoutDay>,
): Promise<any> {
  const res = await http.post(`/workouts/day/${date}`, payload);
  return res.data;
}

/**
 * RANGE query
 * Expected: GET /workouts/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function apiListWorkoutDaysInRange(
  from: string,
  to: string,
): Promise<any> {
  const res = await http.get("/workouts/range", { params: { from, to } });
  return res.data;
}

/**
 * Dashboard: recent workout days
 * Your UI expects a response with .days
 * Expected: GET /workouts/recent?limit=#
 */
export async function apiListRecentWorkoutDays(limit = 10): Promise<any> {
  const res = await http.get("/workouts/recent", { params: { limit } });
  return res.data;
}

/**
 * History: recent workouts
 * Your UI expects a response with .days
 * Expected: GET /workouts/history?limit=#
 */
export async function apiGetRecentWorkouts(limit = 50): Promise<any> {
  const res = await http.get("/workouts/history", { params: { limit } });
  return res.data;
}

/**
 * Progress: PRs
 * Your UI calls apiGetPRs(requireCompleted)
 * Expected: GET /workouts/prs?requireCompleted=true|false
 * Response expected to include .prs
 */
export async function apiGetPRs(requireCompleted = false): Promise<any> {
  const res = await http.get("/workouts/prs", { params: { requireCompleted } });
  return res.data;
}

/**
 * Progress: weekly volume
 * Response expected to include .weeks
 * Expected: GET /workouts/volume?from=&to=&requireCompleted=
 */
export async function apiGetWeeklyVolume(
  from: string,
  to: string,
  requireCompleted = false,
): Promise<any> {
  const res = await http.get("/workouts/volume", {
    params: { from, to, requireCompleted },
  });
  return res.data;
}
