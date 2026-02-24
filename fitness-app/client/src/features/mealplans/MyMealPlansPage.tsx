import { useEffect, useState } from "react";
import axios from "axios";
import { apiGetMyMealPlan, apiListMyMealPlans } from "../../api/mealPlansApi";

type MealPlanRow = {
  _id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

function cardStyle() {
  return {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  } as const;
}

export default function MyMealPlansPage() {
  const [plans, setPlans] = useState<MealPlanRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiListMyMealPlans();
      setPlans(Array.isArray(data?.mealPlans) ? data.mealPlans : []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to load meal plans",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to load meal plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setLoadingDetail(true);
    setError("");
    try {
      const data = await apiGetMyMealPlan(id);
      setDetail(data?.mealPlan ?? null);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to load meal plan",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to load meal plan");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId]);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>My Meal Plans</h1>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 14,
            marginTop: 16,
          }}
        >
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Plans</h2>

            {plans.length === 0 && (
              <p style={{ color: "var(--muted)" }}>No meal plans yet.</p>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {plans.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedId(p._id)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background:
                      selectedId === p._id ? "rgba(34,197,94,0.10)" : "white",
                  }}
                >
                  <strong>{p.title || "Untitled plan"}</strong>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {p.startDate || "—"} → {p.endDate || "—"}
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    {p.notes || "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Details</h2>

            {!selectedId ? (
              <p style={{ color: "var(--muted)" }}>
                Select a plan to view details.
              </p>
            ) : loadingDetail ? (
              <p>Loading details…</p>
            ) : !detail ? (
              <p style={{ color: "var(--muted)" }}>No details found.</p>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {detail.title || "Untitled"}
                </div>
                <div style={{ color: "var(--muted)", marginTop: 4 }}>
                  {detail.startDate || "—"} → {detail.endDate || "—"}
                </div>
                <div style={{ color: "var(--muted)", marginTop: 8 }}>
                  {detail.notes || ""}
                </div>

                <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                  {(detail.days || []).length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>
                      No days in this plan yet.
                    </p>
                  ) : (
                    (detail.days || []).map((d: any) => (
                      <div
                        key={d.date}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          padding: 12,
                          background: "white",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <strong>{d.date}</strong>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>
                            {(d.meals || []).length} meals
                          </span>
                        </div>

                        {d.dayNotes ? (
                          <div
                            style={{
                              color: "var(--muted)",
                              fontSize: 13,
                              marginTop: 6,
                            }}
                          >
                            {d.dayNotes}
                          </div>
                        ) : null}

                        <div
                          style={{ marginTop: 10, display: "grid", gap: 10 }}
                        >
                          {(d.meals || []).map((m: any, idx: number) => (
                            <div
                              key={`${d.date}-${idx}`}
                              style={{
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                                padding: 10,
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>
                                {m.name || "Meal"}
                              </div>
                              {m.notes ? (
                                <div
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}
                                >
                                  {m.notes}
                                </div>
                              ) : null}

                              <ul
                                style={{ margin: "8px 0 0", paddingLeft: 18 }}
                              >
                                {(m.items || []).map((it: any, j: number) => (
                                  <li key={j} style={{ color: "var(--muted)" }}>
                                    {it.name || "Item"}
                                    {it.quantity ? ` — ${it.quantity}` : ""}
                                    {typeof it.calories === "number" &&
                                    it.calories > 0
                                      ? ` • ${it.calories} cal`
                                      : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
