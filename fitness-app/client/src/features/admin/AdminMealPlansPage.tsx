import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  apiAdminCreateMealPlan,
  apiAdminDeleteMealPlan,
  apiAdminListUserMealPlans,
  apiAdminSearchUsers,
  apiAdminUpdateMealPlan,
} from "../../api/mealPlansApi";

type UserRow = {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
};

type MealPlanRow = {
  _id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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

function prettyDate(s?: string) {
  return s ? s : "—";
}

const starterPlan = {
  title: "Week Plan",
  startDate: "",
  endDate: "",
  notes: "",
  days: [
    {
      date: "",
      dayNotes: "",
      meals: [
        {
          name: "Breakfast",
          notes: "",
          items: [
            {
              name: "Oatmeal",
              quantity: "1 cup",
              calories: 300,
              protein: 10,
              carbs: 50,
              fat: 5,
            },
          ],
        },
      ],
    },
  ],
};

export default function AdminMealPlansPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [plans, setPlans] = useState<MealPlanRow[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(starterPlan, null, 2),
  );

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function searchUsers() {
    setLoadingUsers(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiAdminSearchUsers(q.trim(), 20);
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to search users",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to search users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadPlans(userId: string) {
    setLoadingPlans(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiAdminListUserMealPlans(userId);
      setPlans(Array.isArray(data?.mealPlans) ? data.mealPlans : []);
      setSelectedPlanId("");
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
      setLoadingPlans(false);
    }
  }

  function selectUser(u: UserRow) {
    setSelectedUser(u);
    void loadPlans(u._id);
  }

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  function loadPlanIntoEditor() {
    // Keep editor as JSON payload that the API expects for create/update
    if (!selectedPlan) return;
    setJsonText(
      JSON.stringify(
        {
          title: selectedPlan.title || "",
          startDate: selectedPlan.startDate || "",
          endDate: selectedPlan.endDate || "",
          notes: selectedPlan.notes || "",
          // admin list returns summaries; editor should include days for true edit
          // we keep it simple: admins can paste full plan JSON when editing.
          days: [],
        },
        null,
        2,
      ),
    );
  }

  function resetEditorToStarter() {
    setJsonText(JSON.stringify(starterPlan, null, 2));
  }

  async function createPlan() {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = JSON.parse(jsonText);
      await apiAdminCreateMealPlan(selectedUser._id, payload);
      setSuccess("Meal plan created ✅");
      await loadPlans(selectedUser._id);
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setError("JSON is invalid. Fix the JSON in the editor.");
      } else if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to create meal plan",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to create meal plan");
    } finally {
      setSaving(false);
    }
  }

  async function updatePlan() {
    if (!selectedUser || !selectedPlanId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = JSON.parse(jsonText);
      await apiAdminUpdateMealPlan(selectedUser._id, selectedPlanId, payload);
      setSuccess("Meal plan updated ✅");
      await loadPlans(selectedUser._id);
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setError("JSON is invalid. Fix the JSON in the editor.");
      } else if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to update meal plan",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to update meal plan");
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan() {
    if (!selectedUser || !selectedPlanId) return;
    const ok = confirm("Delete this meal plan? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiAdminDeleteMealPlan(selectedUser._id, selectedPlanId);
      setSuccess("Meal plan deleted ✅");
      setSelectedPlanId("");
      await loadPlans(selectedUser._id);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(
          (e.response?.data as { message?: string })?.message ||
            "Failed to delete meal plan",
        );
      } else if (e instanceof Error) setError(e.message);
      else setError("Failed to delete meal plan");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // Optional: auto-search on mount if you want
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Admin Meal Plans</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 16,
        }}
      >
        {/* LEFT: User Search */}
        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>1) Find a user</h2>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username or email…"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "white",
              }}
            />
            <button onClick={searchUsers} disabled={loadingUsers}>
              {loadingUsers ? "Searching…" : "Search"}
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {users.length === 0 && (
              <div style={{ color: "var(--muted)" }}>
                No users yet. Search for a username/email.
              </div>
            )}

            {users.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => selectUser(u)}
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background:
                    selectedUser?._id === u._id
                      ? "rgba(34,197,94,0.10)"
                      : "white",
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {u.username || "—"}{" "}
                  <span style={{ fontWeight: 600, color: "var(--muted)" }}>
                    ({u.role || "user"})
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {u.email || ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Meal plans list for user */}
        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>
            2) Select a meal plan
          </h2>

          {!selectedUser ? (
            <div style={{ color: "var(--muted)" }}>
              Select a user to view their meal plans.
            </div>
          ) : (
            <>
              <div style={{ color: "var(--muted)", marginBottom: 10 }}>
                User:{" "}
                <strong>{selectedUser.username || selectedUser._id}</strong>
              </div>

              {loadingPlans ? (
                <p>Loading plans…</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {plans.length === 0 && (
                    <div style={{ color: "var(--muted)" }}>
                      No meal plans yet for this user.
                    </div>
                  )}

                  {plans.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setSelectedPlanId(p._id)}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background:
                          selectedPlanId === p._id
                            ? "rgba(147,51,234,0.10)"
                            : "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <strong>{p.title || "Untitled plan"}</strong>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          {prettyDate(p.startDate)} → {prettyDate(p.endDate)}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {p.notes ? p.notes : "—"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ ...cardStyle(), marginTop: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>
          3) Create / Edit (JSON editor)
        </h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button onClick={resetEditorToStarter} disabled={saving}>
            New plan template
          </button>

          <button
            onClick={loadPlanIntoEditor}
            disabled={!selectedPlan || saving}
          >
            Load selected into editor
          </button>

          <button onClick={createPlan} disabled={!selectedUser || saving}>
            {saving ? "Saving…" : "Create plan"}
          </button>

          <button
            onClick={updatePlan}
            disabled={!selectedUser || !selectedPlanId || saving}
          >
            {saving ? "Saving…" : "Update selected"}
          </button>

          <button
            onClick={deletePlan}
            disabled={!selectedUser || !selectedPlanId || saving}
          >
            Delete selected
          </button>
        </div>

        {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
        {success && (
          <p style={{ color: "var(--primary)", marginTop: 10 }}>{success}</p>
        )}

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={16}
          spellCheck={false}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            border: "1px solid var(--border)",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 12,
            background: "white",
          }}
        />

        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
          Tip: This is intentionally MVP-simple. Once CRUD works, we can swap
          this JSON editor for a friendly form UI (days/meals/items).
        </div>
      </div>
    </div>
  );
}
