// client/src/features/workouts/WorkoutDayPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { apiGetWorkoutDay, apiUpsertWorkoutDay } from "../../api/workoutsApi";

// Local TS types (since workoutsApi is JS)
type WorkoutSet = {
  reps: number;
  weight: number;
  restSeconds: number;
  completedAt: string | null;
};

type WorkoutEntry = {
  exerciseName: string;
  notes?: string;
  sets: WorkoutSet[];
};

type WorkoutDay = {
  date: string;
  workoutType: string;
  entries: WorkoutEntry[];
};

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValidYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

const WORKOUT_TYPES = [
  "",
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Cardio",
  "Mobility",
];

export default function WorkoutDayPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryDate = searchParams.get("date");
  const initialDate =
    queryDate && isValidYYYYMMDD(queryDate) ? queryDate : todayYYYYMMDD();

  const [date, setDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [day, setDay] = useState<WorkoutDay | null>(null);

  const safeEntries = useMemo(() => day?.entries ?? [], [day]);

  // Keep URL ?date= in sync with state so History links + refresh work
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("date", date);
        return next;
      },
      { replace: true },
    );
  }, [date, setSearchParams]);

  async function load(selectedDate: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiGetWorkoutDay(selectedDate);

      // Defensive normalize (so UI doesn’t break if backend returns nulls)
      const normalized: WorkoutDay = {
        date: String(data?.date || selectedDate),
        workoutType: String(data?.workoutType || ""),
        entries: Array.isArray(data?.entries) ? data.entries : [],
      };

      setDay(normalized);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const msg =
          (e.response?.data as { message?: string })?.message ||
          "Failed to load workout day";
        setError(msg);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to load workout day");
      }
      setDay(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function updateWorkoutType(value: string) {
    if (!day) return;
    setDay({ ...day, workoutType: value });
  }

  function addExercise() {
    if (!day) return;
    const name = prompt("Exercise name (e.g., Bench Press):");
    if (!name) return;

    const newEntry: WorkoutEntry = {
      exerciseName: name.trim(),
      notes: "",
      sets: [{ reps: 8, weight: 0, restSeconds: 90, completedAt: null }],
    };

    setDay({ ...day, entries: [...safeEntries, newEntry] });
  }

  function removeExercise(idx: number) {
    if (!day) return;
    const next = safeEntries.filter((_, i) => i !== idx);
    setDay({ ...day, entries: next });
  }

  function addSet(entryIdx: number) {
    if (!day) return;

    const next = safeEntries.map((e, i) => {
      if (i !== entryIdx) return e;

      const last =
        e.sets[e.sets.length - 1] ||
        ({ reps: 8, weight: 0, restSeconds: 90 } as WorkoutSet);

      return {
        ...e,
        sets: [
          ...e.sets,
          {
            reps: last.reps,
            weight: last.weight,
            restSeconds: last.restSeconds,
            completedAt: null,
          },
        ],
      };
    });

    setDay({ ...day, entries: next });
  }

  function updateSet(
    entryIdx: number,
    setIdx: number,
    field: "reps" | "weight" | "restSeconds",
    value: number,
  ) {
    if (!day) return;

    const next = safeEntries.map((e, i) => {
      if (i !== entryIdx) return e;
      const sets = e.sets.map((s, j) =>
        j === setIdx ? { ...s, [field]: value } : s,
      );
      return { ...e, sets };
    });

    setDay({ ...day, entries: next });
  }

  function toggleSetComplete(entryIdx: number, setIdx: number) {
    if (!day) return;

    const next = safeEntries.map((e, i) => {
      if (i !== entryIdx) return e;
      const sets = e.sets.map((s, j) => {
        if (j !== setIdx) return s;
        const completedAt = s.completedAt ? null : new Date().toISOString();
        return { ...s, completedAt };
      });
      return { ...e, sets };
    });

    setDay({ ...day, entries: next });
  }

  function updateNotes(entryIdx: number, notes: string) {
    if (!day) return;
    const next = safeEntries.map((en, i) =>
      i === entryIdx ? { ...en, notes } : en,
    );
    setDay({ ...day, entries: next });
  }

  async function save() {
    if (!day) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await apiUpsertWorkoutDay(day.date, {
        workoutType: day.workoutType,
        entries: day.entries,
      });

      const normalized: WorkoutDay = {
        date: String(updated?.date || day.date),
        workoutType: String(updated?.workoutType || ""),
        entries: Array.isArray(updated?.entries) ? updated.entries : [],
      };

      setDay(normalized);
      setSuccess("Saved ✅");
      try {
        const raw = localStorage.getItem("fitness_recent_cache");
        const cache = raw ? JSON.parse(raw) : { days: [] };

        const summary = {
          date: normalized.date,
          workoutType: normalized.workoutType,
          exerciseCount: normalized.entries.length,
        };

        const nextDays = [
          summary,
          ...(Array.isArray(cache.days)
            ? cache.days.filter((x: any) => x.date !== summary.date)
            : []),
        ].slice(0, 180);

        localStorage.setItem(
          "fitness_recent_cache",
          JSON.stringify({ days: nextDays }),
        );
      } catch {
        // ignore cache errors
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const msg =
          (e.response?.data as { message?: string })?.message ||
          "Failed to save workout day";
        setError(msg);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to save workout day");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1>Workout Day Logger</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label>
          Date{" "}
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const next = e.target.value;
              // If input is cleared (rare), do nothing.
              if (!next || !isValidYYYYMMDD(next)) return;
              setDate(next);
            }}
          />
        </label>

        <label>
          Workout Type{" "}
          <select
            value={day?.workoutType ?? ""}
            onChange={(e) => updateWorkoutType(e.target.value)}
            disabled={!day || loading}
          >
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "" ? "Select…" : t}
              </option>
            ))}
          </select>
        </label>

        <button onClick={addExercise} disabled={!day || loading}>
          + Add Exercise
        </button>

        <button onClick={save} disabled={!day || saving || loading}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {!loading && day && (
        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          {safeEntries.length === 0 && (
            <p>No exercises yet. Click “Add Exercise”.</p>
          )}

          {safeEntries.map((entry, entryIdx) => (
            <div
              key={`${entry.exerciseName}-${entryIdx}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{entry.exerciseName}</h3>
                  <small style={{ color: "#555" }}>
                    Sets: {entry.sets.length}
                  </small>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => addSet(entryIdx)}>+ Set</button>
                  <button onClick={() => removeExercise(entryIdx)}>
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>#</th>
                      <th style={{ textAlign: "left" }}>Reps</th>
                      <th style={{ textAlign: "left" }}>Weight</th>
                      <th style={{ textAlign: "left" }}>Rest (sec)</th>
                      <th style={{ textAlign: "left" }}>Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.sets.map((s, setIdx) => (
                      <tr key={setIdx}>
                        <td>{setIdx + 1}</td>
                        <td>
                          <input
                            type="number"
                            value={s.reps}
                            min={0}
                            onChange={(e) =>
                              updateSet(
                                entryIdx,
                                setIdx,
                                "reps",
                                Number(e.target.value),
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={s.weight}
                            min={0}
                            step="0.5"
                            onChange={(e) =>
                              updateSet(
                                entryIdx,
                                setIdx,
                                "weight",
                                Number(e.target.value),
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={s.restSeconds}
                            min={0}
                            onChange={(e) =>
                              updateSet(
                                entryIdx,
                                setIdx,
                                "restSeconds",
                                Number(e.target.value),
                              )
                            }
                            style={{ width: 120 }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!s.completedAt}
                            onChange={() => toggleSetComplete(entryIdx, setIdx)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10 }}>
                <label
                  style={{ display: "block", fontSize: 12, color: "#555" }}
                >
                  Notes
                </label>
                <textarea
                  value={entry.notes ?? ""}
                  onChange={(e) => updateNotes(entryIdx, e.target.value)}
                  rows={2}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
