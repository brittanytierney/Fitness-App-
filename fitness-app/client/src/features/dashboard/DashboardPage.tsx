import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiListRecentWorkoutDays } from "../../api/workoutsApi";

type DaySummary = {
  date: string;
  workoutType: string;
  exerciseCount: number;
};

export default function DashboardPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRecentDays() {
    setLoading(true);
    setError("");
    try {
      const data = await apiListRecentWorkoutDays(30);
      setDays(Array.isArray(data?.days) ? data.days : []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const msg =
          (e.response?.data as { message?: string })?.message ||
          "Failed to load dashboard";
        setError(msg);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    void loadRecentDays();
   
  }, []);

  
  useEffect(() => {
    void loadRecentDays();
    
  }, [location.key]);

  const stats = useMemo(() => {
    const total = days.length;
    const types = new Map<string, number>();
    for (const d of days) {
      const key = d.workoutType || "Unspecified";
      types.set(key, (types.get(key) || 0) + 1);
    }
    const topType =
      [...types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const lastDate = days[0]?.date || "—";
    return { total, topType, lastDate };
  }, [days]);

  function openDay(date: string) {
    nav(`/workouts/day?date=${encodeURIComponent(date)}`);
  }
  function typeColor(type: string) {
    switch (type) {
      case "Push":
        return "#ef4444";
      case "Pull":
        return "#3b82f6";
      case "Legs":
        return "#22c55e";
      case "Upper":
        return "#9333ea";
      case "Lower":
        return "#f59e0b";
      case "Full Body":
        return "#14b8a6";
      case "Cardio":
        return "#ec4899";
      default:
        return "#64748b";
    }
  }


  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "baseline",
        }}
      >
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Link to="/history" style={{ fontSize: 14 }}>
          Workout History
        </Link>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ color: "#555", fontSize: 12 }}>
                Workouts (recent)
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ color: "#555", fontSize: 12 }}>
                Most common type
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {stats.topType}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ color: "#555", fontSize: 12 }}>Last workout</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {stats.lastDate}
              </div>
            </div>
          </div>

          <h2 style={{ marginTop: 24 }}>Recent workout days</h2>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {days.length === 0 && <p>No workouts yet. Log your first day!</p>}

            {days.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => openDay(d.date)}
                style={{
                  textAlign: "left",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                  cursor: "pointer",
                }}
                title="Open this workout day"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <strong>{d.date}</strong>
                  <span
                    style={{
                      background: typeColor(d.workoutType),
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {d.workoutType || "Workout"}
                  </span>
                </div>
                <small style={{ color: "#555" }}>
                  Exercises: {d.exerciseCount ?? 0}
                </small>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
