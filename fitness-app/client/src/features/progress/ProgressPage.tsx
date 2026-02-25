
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiGetPRs, apiGetWeeklyVolume } from "../../api/workoutsApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type PRRow = {
  exerciseName: string;
  bestWeight: number;
  bestWeightReps: number;
  bestE1RM: number;
  bestE1RMSet: { weight: number; reps: number; date: string };
};

type WeekRow = {
  weekStart: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
};

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProgressPage() {
  const [prs, setPrs] = useState<PRRow[]>([]);
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [requireCompleted, setRequireCompleted] = useState(false);

  const to = todayYYYYMMDD();
  const from = useMemo(() => addDays(to, -7 * 12), [to]); 

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [prsRes, volRes] = await Promise.all([
          apiGetPRs(requireCompleted),
          apiGetWeeklyVolume(from, to, requireCompleted),
        ]);

        if (cancelled) return;

        setPrs(Array.isArray(prsRes?.prs) ? prsRes.prs : []);
        setWeeks(Array.isArray(volRes?.weeks) ? volRes.weeks : []);
      } catch (e: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(e)) {
          setError(
            (e.response?.data as { message?: string })?.message ||
              `Failed to load progress (${e.response?.status || "?"})`,
          );
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load progress");
        }

        setPrs([]);
        setWeeks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, to, requireCompleted]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <h1 style={{ margin: 0 }}>Progress</h1>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={requireCompleted}
            onChange={(e) => setRequireCompleted(e.target.checked)}
          />
          Only completed sets
        </label>
      </div>

      {loading && <p>Loading…</p>}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "crimson",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 style={{ marginTop: 24 }}>Weekly Volume (last 12 weeks)</h2>

          {/* Important: explicit height + minWidth prevents ResponsiveContainer -1 warnings */}
          <div
            style={{
              height: 280,
              width: "100%",
              minWidth: 0,
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 12,
              background: "var(--card)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            {weeks.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No volume data yet. Log some sets (reps/weight) to see this
                chart.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekStart" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <h2 style={{ marginTop: 24 }}>Personal Records (Top 10)</h2>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {prs.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                No PRs yet. Log workouts with reps/weight to generate PRs.
              </p>
            ) : (
              prs.slice(0, 10).map((p) => (
                <div
                  key={p.exerciseName}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 16,
                    background: "var(--card)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "baseline",
                    }}
                  >
                    <strong>{p.exerciseName}</strong>
                    <span style={{ color: "var(--muted)" }}>
                      e1RM: {Math.round(p.bestE1RM)}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "var(--muted)",
                      fontSize: 13,
                    }}
                  >
                    Best weight: {p.bestWeight} × {p.bestWeightReps}
                    {" • "}
                    Best e1RM set: {p.bestE1RMSet.weight} × {p.bestE1RMSet.reps}{" "}
                    on {p.bestE1RMSet.date}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
