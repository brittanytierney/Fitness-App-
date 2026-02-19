// client/src/features/history/HistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiGetRecentWorkouts } from "../../api/workoutsApi";



type RecentDay = {
  date: string; // YYYY-MM-DD
  workoutType: string;
  exerciseCount: number;
  exerciseNames?: string[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function weekdayIndexSun0(d: Date) {
  // 0 = Sunday ... 6 = Saturday
  return d.getDay();
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [anchorMonth, setAnchorMonth] = useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const [days, setDays] = useState<RecentDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await apiGetRecentWorkouts(180);
        if (!alive) return;
        setDays(Array.isArray(data?.days) ? data.days : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load workout history.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // Quick lookup by date for calendar marking + click
  const byDate = useMemo(() => {
    const m = new Map<string, RecentDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const calendarCells = useMemo(() => {
    const first = startOfMonth(anchorMonth);
    const total = daysInMonth(anchorMonth);
    const leadingBlanks = weekdayIndexSun0(first);

    const cells: Array<{ dateStr?: string; dayNum?: number }> = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({});

    for (let day = 1; day <= total; day++) {
      const dt = new Date(
        anchorMonth.getFullYear(),
        anchorMonth.getMonth(),
        day,
      );
      cells.push({ dateStr: toYYYYMMDD(dt), dayNum: day });
    }

    // pad to full weeks (optional, makes grid clean)
    while (cells.length % 7 !== 0) cells.push({});

    return cells;
  }, [anchorMonth]);

  const monthDaysWithWorkouts = useMemo(() => {
    const ym = `${anchorMonth.getFullYear()}-${pad2(anchorMonth.getMonth() + 1)}-`;
    return days
      .filter((d) => d.date.startsWith(ym))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  }, [days, anchorMonth]);

  const location = useLocation();

  async function loadRecent() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetRecentWorkouts(180);
      setDays(Array.isArray(data?.days) ? data.days : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load workout history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecent();
    // this runs when you navigate back to /history
  }, [location.key]);


  function openWorkout(dateStr: string) {
    // Keep existing workout route — we just pass date as query param.
    navigate(`/workouts?date=${encodeURIComponent(dateStr)}`);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Workout History
      </h1>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Calendar Card */}
        <div
          style={{
            flex: "1 1 520px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setAnchorMonth((m) => addMonths(m, -1))}
              style={{ padding: "6px 10px" }}
            >
              ←
            </button>

            <div style={{ fontWeight: 700 }}>{monthLabel(anchorMonth)}</div>

            <button
              type="button"
              onClick={() => setAnchorMonth((m) => addMonths(m, 1))}
              style={{ padding: "6px 10px" }}
            >
              →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginTop: 10,
              fontSize: 12,
              opacity: 0.75,
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
              <div key={w} style={{ textAlign: "center", padding: "6px 0" }}>
                {w}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {calendarCells.map((cell, idx) => {
              const dateStr = cell.dateStr;
              const info = dateStr ? byDate.get(dateStr) : undefined;
              const hasWorkout = Boolean(info);
              const names = info?.exerciseNames ?? [];
              const preview = names.slice(0, 2).join(", ");
              const moreCount = names.length > 2 ? names.length - 2 : 0;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!dateStr}
                  onClick={() => dateStr && openWorkout(dateStr)}
                  title={
                    info
                      ? `${info.workoutType || "Workout"} • ${info.exerciseCount} exercises\n` +
                        (names.length ? names.join(", ") : "")
                      : dateStr
                        ? "No workout logged"
                        : ""
                  }
                  style={{
                    height: 64,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: dateStr ? "#fff" : "transparent",
                    cursor: dateStr ? "pointer" : "default",
                    opacity: dateStr ? 1 : 0,
                    padding: 8,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{cell.dayNum ?? ""}</div>

                  {hasWorkout ? (
                    <div style={{ fontSize: 12 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {info?.workoutType || "Workout"}
                      </div>

                      {/* ✅ Exercise preview line */}
                      {names.length > 0 && (
                        <div
                          style={{
                            opacity: 0.85,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {preview}
                          {moreCount ? ` +${moreCount}` : ""}
                        </div>
                      )}

                      <div style={{ opacity: 0.75 }}>
                        {info?.exerciseCount} exercises
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.45 }}>—</div>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? <p style={{ marginTop: 12 }}>Loading…</p> : null}
          {error ? (
            <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>
          ) : null}
        </div>

        {/* Month List Card */}
        <div
          style={{
            flex: "1 1 360px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              This Month
            </h2>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {monthDaysWithWorkouts.length} days
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {monthDaysWithWorkouts.length === 0 && !loading ? (
              <div style={{ opacity: 0.7 }}>No workouts logged this month.</div>
            ) : null}

            {monthDaysWithWorkouts.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => openWorkout(d.date)}
                style={{
                  textAlign: "left",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{d.date}</div>
                  <div style={{ opacity: 0.75 }}>
                    {d.exerciseCount} exercises
                  </div>
                </div>
                <div style={{ marginTop: 4, opacity: 0.85 }}>
                  {d.workoutType || "Workout"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
        Tip: click any date to open that day in your Workout page.
      </div>
    </div>
  );
}
