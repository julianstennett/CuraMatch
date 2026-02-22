import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/PatientIntake.css";
import { parseIntake, matchTrials } from "../services/api.js";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

// Chat example for the AI helper input
const EXAMPLE_CHAT =
  "I'm 54 years old, HbA1c is 8.2%. I'm 5'10 and 216 lbs. I live in GA. I'm on metformin, not on insulin. No CKD, no pancreatitis, no Type 1 diabetes.";

// Structured example (fills the form)
const EXAMPLE_FORM = {
  age: "54",
  hba1c: "8.2",
  height_inches: "70",
  weight_lbs: "216",
  state: "GA",
  on_metformin: true,
  stable_metformin: true,
  on_insulin: false,
  recent_glp1: false,
  ckd: false,
  pancreatitis: false,
  type1_diabetes: false,
  pregnant: false,
  recent_cv_event: false,
  recent_malignancy: false,
  notes: "Type 2 diabetes diagnosed ~8 years ago. No known heart disease."
};

function calculateBMI(weightLbs, heightInches) {
  const w = Number(weightLbs);
  const h = Number(heightInches);
  if (!w || !h || h <= 0) return null;
  return Math.round(((w / (h * h)) * 703) * 10) / 10;
}

function bmiCategory(bmi) {
  if (bmi == null) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function labelFor(field) {
  const map = {
    age: "Age",
    hba1c: "HbA1c",
    height_inches: "Height",
    weight_lbs: "Weight",
    state: "State",
  };
  return map[field] || field;
}

function sanitizeState(s) {
  if (!s) return "";
  const up = String(s).trim().toUpperCase();
  return US_STATES.includes(up) ? up : "";
}

function missingMessage(missingFields) {
  if (!missingFields.length) return "All required fields are filled.";
  return missingFields.map((k) => `Missing ${labelFor(k).toLowerCase()}.`).join("\n");
}

/**
 * Convert your /api/intake response into a patch for this form.
 * Adjust here if your backend uses different key names.
 */
function intakeToPatch(intake) {
  if (!intake || typeof intake !== "object") return null;

  const patch = {};

  // core numbers
  if (intake.age != null && intake.age !== "") patch.age = String(Math.round(Number(intake.age)));
  if (intake.hba1c != null && intake.hba1c !== "") patch.hba1c = String(Math.round(Number(intake.hba1c) * 10) / 10);

  // allow variants
  const height = intake.height_inches ?? intake.heightInches ?? intake.height ?? null;
  const weight = intake.weight_lbs ?? intake.weightLbs ?? intake.weight ?? null;

  if (height != null && height !== "") patch.height_inches = String(Math.round(Number(height) * 10) / 10);
  if (weight != null && weight !== "") patch.weight_lbs = String(Math.round(Number(weight)));

  const state = sanitizeState(intake.state ?? intake.us_state ?? intake.location_state);
  if (state) patch.state = state;

  // booleans expected by matching
  const bools = [
    "on_metformin","stable_metformin","on_insulin","recent_glp1",
    "ckd","pancreatitis","type1_diabetes","pregnant","recent_cv_event","recent_malignancy"
  ];
  for (const k of bools) {
    if (typeof intake[k] === "boolean") patch[k] = intake[k];
  }

  // optional notes/summary
  if (intake.notes) patch.notes = String(intake.notes).slice(0, 1500);
  if (intake.summary) patch.notes = String(intake.summary).slice(0, 1500);

  return Object.keys(patch).length ? patch : null;
}

export default function PatientIntake({ onResults, onProfileChange }) {
  const [form, setForm] = useState({
    age: "",
    hba1c: "",
    height_inches: "",
    weight_lbs: "",
    state: "",

    on_metformin: true,
    stable_metformin: true,
    on_insulin: false,
    recent_glp1: false,

    ckd: false,
    pancreatitis: false,
    type1_diabetes: false,
    pregnant: false,
    recent_cv_event: false,
    recent_malignancy: false,

    notes: ""
  });

  const bmi = useMemo(
    () => calculateBMI(form.weight_lbs, form.height_inches),
    [form.weight_lbs, form.height_inches]
  );

  const missingFields = useMemo(() => {
    const missing = [];
    if (!form.age) missing.push("age");
    if (!form.hba1c) missing.push("hba1c");
    if (!form.height_inches) missing.push("height_inches");
    if (!form.weight_lbs) missing.push("weight_lbs");
    if (!form.state) missing.push("state");
    return missing;
  }, [form]);

  const canSubmit = useMemo(() => {
    return (
      form.age &&
      form.hba1c &&
      form.height_inches &&
      form.weight_lbs &&
      form.state &&
      bmi != null
    );
  }, [form, bmi]);

  // Build profile matching your /api/match schema (based on your Python)
  const profile = useMemo(() => {
    return {
      age: form.age ? Number(form.age) : null,
      hba1c: form.hba1c ? Number(form.hba1c) : null,
      bmi: bmi,
      state: form.state ? String(form.state).trim().toUpperCase() : null,

      on_insulin: !!form.on_insulin,
      recent_glp1: !!form.recent_glp1,
      ckd: !!form.ckd,
      pancreatitis: !!form.pancreatitis,
      pregnant: !!form.pregnant,
      type1_diabetes: !!form.type1_diabetes,
      recent_cv_event: !!form.recent_cv_event,
      recent_malignancy: !!form.recent_malignancy,

      on_metformin: !!form.on_metformin,
      stable_metformin: !!form.stable_metformin,

      notes: (form.notes || "").trim()
    };
  }, [form, bmi]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===== AI widget state =====
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", content: "Hi! I’m your CuraMatch AI helper." }
  ]);
  const [suggestedPatch, setSuggestedPatch] = useState(null);

  // Single scroll container ref (whole widget content)
  const aiScrollRef = useRef(null);

  // auto-scroll the entire widget content (not just chat)
  useEffect(() => {
    if (!aiOpen) return;
    if (!aiScrollRef.current) return;
    aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages, aiOpen, suggestedPatch]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyPatch(patch) {
    if (!patch) return;
    setForm((prev) => ({ ...prev, ...patch }));
    setSuggestedPatch(null);
  }

  function loadExample() {
    setForm(EXAMPLE_FORM);
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    try {
      onProfileChange?.(profile);
      const trials = await matchTrials(profile);
      onResults?.(trials, profile);
    } catch (err) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // AI: when opened, append a status message INTO the chat (no sidebar)
  useEffect(() => {
    if (!aiOpen) return;

    const status = missingMessage(missingFields);

    setAiMessages((prev) => {
      const already = prev.some(
        (m) => m.role === "assistant" && (m.content || "").startsWith("Current status:")
      );
      if (already) return prev;

      return [
        ...prev,
        {
          role: "assistant",
          content:
            "Tell me what you know (age, HbA1c, height, weight, state, meds). I’ll fill the form.\n\n" +
            "Current status:\n" +
            status
        }
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOpen]);

  // AI: keep the latest "Current status:" message updated as fields change
  useEffect(() => {
    if (!aiOpen) return;

    const status = "Current status:\n" + missingMessage(missingFields);

    setAiMessages((prev) => {
      const lastIdx = [...prev]
        .map((m, i) => ({ m, i }))
        .reverse()
        .find(({ m }) => m.role === "assistant" && (m.content || "").startsWith("Current status:"))?.i;

      if (lastIdx == null) return prev;

      const next = [...prev];
      next[lastIdx] = { role: "assistant", content: status };
      return next;
    });
  }, [missingFields, aiOpen]);

  // close panel on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setAiOpen(false);
    }
    if (aiOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen]);

  async function aiSend() {
    const msg = aiInput.trim();
    if (!msg || aiBusy) return;

    setAiBusy(true);
    setSuggestedPatch(null);
    setAiMessages((prev) => [...prev, { role: "user", content: msg }]);
    setAiInput("");

    try {
      const intake = await parseIntake(msg);
      const patch = intakeToPatch(intake);

      if (!patch) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I couldn’t extract structured fields from that. Try including age, HbA1c, height, weight, and state."
          }
        ]);
      } else {
        const filled = Object.keys(patch)
          .filter((k) => ["age","hba1c","height_inches","weight_lbs","state"].includes(k))
          .map((k) => `${labelFor(k)}=${patch[k]}`)
          .join(", ");

        const preview = { ...form, ...patch };
        const newMissing = [];
        if (!preview.age) newMissing.push("age");
        if (!preview.hba1c) newMissing.push("hba1c");
        if (!preview.height_inches) newMissing.push("height_inches");
        if (!preview.weight_lbs) newMissing.push("weight_lbs");
        if (!preview.state) newMissing.push("state");

        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              `Extracted: ${filled || "some details"}.\n` +
              (newMissing.length
                ? `Still missing:\n${newMissing.map((k) => `Missing ${labelFor(k).toLowerCase()}.`).join("\n")}`
                : "You’re ready to match.")
          }
        ]);

        setSuggestedPatch(patch);
      }
    } catch (e) {
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Couldn’t reach the intake parser. (${e?.message || "error"})` }
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="pi-shell">
      <div className="pi-card">
        <div className="pi-header">
          <div className="pi-icon" aria-hidden="true">🩺</div>

          <div className="pi-headtext">
            <h2>Patient Profile</h2>
            <p>Structured inputs for accurate trial matching</p>
          </div>

          <div className="pi-headactions">
            <button type="button" className="pi-btn-ghost" onClick={loadExample} disabled={loading}>
              Use example
            </button>

            <button type="button" className="pi-btn-ai" onClick={() => setAiOpen(true)} disabled={loading}>
              ✨ CuraMatch AI Helper
            </button>

            <button type="button" className="pi-btn-primary" onClick={handleSubmit} disabled={!canSubmit || loading}>
              {loading ? "Finding trials…" : "Find Matching Trials →"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pi-grid">
            <Field label="Age" hint="years">
              <input
                type="number"
                min="0"
                step="1"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                disabled={loading}
                placeholder="e.g. 58"
                required
              />
            </Field>

            <Field label="HbA1c" hint="%">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.hba1c}
                onChange={(e) => update("hba1c", e.target.value)}
                disabled={loading}
                placeholder="e.g. 7.2"
                required
              />
            </Field>

            <Field label="Height" hint="in">
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.height_inches}
                onChange={(e) => update("height_inches", e.target.value)}
                disabled={loading}
                placeholder="e.g. 64"
                required
              />
            </Field>

            <Field label="Weight" hint="lbs">
              <input
                type="number"
                min="0"
                step="1"
                value={form.weight_lbs}
                onChange={(e) => update("weight_lbs", e.target.value)}
                disabled={loading}
                placeholder="e.g. 165"
                required
              />
            </Field>

            <Field label="State" hint="US">
              <select
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="BMI" hint="auto">
              <div className="pi-bmi">
                <div className="pi-bmi-left">
                  <div className="pi-bmi-value">{bmi ?? "—"}</div>
                  <div className="pi-bmi-sub">{bmiCategory(bmi)}</div>
                </div>
                <div className="pi-bmi-pill">Calculated</div>
              </div>
            </Field>
          </div>

          <div className="pi-section">
            <div className="pi-section-title">Medications</div>
            <div className="pi-toggle-grid">
              <Toggle
                label="On metformin"
                checked={form.on_metformin}
                onChange={(v) => update("on_metformin", v)}
                disabled={loading}
              />
              <Toggle
                label="Stable on metformin"
                checked={form.stable_metformin}
                onChange={(v) => update("stable_metformin", v)}
                disabled={loading || !form.on_metformin}
                hint={!form.on_metformin ? "Enable “On metformin” first" : ""}
              />
              <Toggle
                label="Currently using insulin"
                checked={form.on_insulin}
                onChange={(v) => update("on_insulin", v)}
                disabled={loading}
              />
              <Toggle
                label="Recent GLP-1 use"
                checked={form.recent_glp1}
                onChange={(v) => update("recent_glp1", v)}
                disabled={loading}
                hint="e.g., semaglutide, liraglutide, dulaglutide, tirzepatide"
              />
            </div>
          </div>

          <div className="pi-section">
            <div className="pi-section-title">Medical History / Exclusions</div>
            <div className="pi-toggle-grid">
              <Toggle label="Chronic kidney disease (CKD)" checked={form.ckd} onChange={(v) => update("ckd", v)} disabled={loading} />
              <Toggle label="History of pancreatitis" checked={form.pancreatitis} onChange={(v) => update("pancreatitis", v)} disabled={loading} />
              <Toggle label="Type 1 diabetes" checked={form.type1_diabetes} onChange={(v) => update("type1_diabetes", v)} disabled={loading} />
              <Toggle label="Pregnant" checked={form.pregnant} onChange={(v) => update("pregnant", v)} disabled={loading} />
              <Toggle label="Recent cardiovascular event" checked={form.recent_cv_event} onChange={(v) => update("recent_cv_event", v)} disabled={loading} />
              <Toggle label="Recent malignancy" checked={form.recent_malignancy} onChange={(v) => update("recent_malignancy", v)} disabled={loading} />
            </div>
          </div>

          <div className="pi-section">
            <div className="pi-section-title">
              Plain-language notes <span className="pi-muted">(optional)</span>
            </div>
            <textarea
              className="pi-textarea"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional context for semantic matching (duration, complications, goals, etc.)"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="pi-actions">
            <div className="pi-missing">
              {missingFields.length ? (
                <>
                  <span className="pi-pill-warn">Missing</span>
                  <span className="pi-missing-text">{missingFields.map(labelFor).join(", ")}</span>
                </>
              ) : (
                <>
                  <span className="pi-pill-ok">Ready</span>
                  <span className="pi-missing-text">Core fields complete</span>
                </>
              )}
            </div>

            <div className="pi-actions-right">
              <button type="button" className="pi-btn-ghost" onClick={loadExample} disabled={loading}>
                Use example
              </button>
              <button type="submit" className="pi-btn-primary" disabled={!canSubmit || loading}>
                {loading ? "Finding trials…" : "Find Matching Trials →"}
              </button>
            </div>
          </div>

          {error && (
            <div className="pi-error">
              <span>⚠️</span> {error}
            </div>
          )}
        </form>
      </div>

      {/* ======================
          AI Helper Widget
         ====================== */}
      <div className="ai-widget" aria-label="CuraMatch AI Helper Widget">
        {!aiOpen && (
          <button
            type="button"
            className="ai-fab"
            onClick={() => setAiOpen(true)}
            aria-label="Open AI Helper"
          >
            ✨ <span className="ai-fab-text">CuraMatch AI Helper</span>
          </button>
        )}

        {aiOpen && (
          <div className="ai-panel" role="dialog" aria-modal="false">
            <div className="ai-header">
              <div>
                <div className="ai-title">CuraMatch AI Helper</div>
                <div className="ai-subtitle">
                  {missingFields.length
                    ? missingFields.map((k) => `Missing ${labelFor(k).toLowerCase()}`).join(" • ")
                    : "All required fields are filled"}
                </div>
              </div>
              <button
                className="ai-close"
                type="button"
                onClick={() => setAiOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ai-body">
              {/* ✅ Single scroll area for chat + quick actions + suggested patch */}
              <div className="ai-scroll" ref={aiScrollRef}>
                <ChatPane messages={aiMessages} />

                <div className="ai-quick">
                  <div className="ai-mini-title">Quick actions</div>
                  <div className="ai-chips">
                    <button
                      type="button"
                      className="ai-chip"
                      onClick={() => setAiInput(EXAMPLE_CHAT)}
                      disabled={aiBusy}
                    >
                      Paste example
                    </button>
                    <button
                      type="button"
                      className="ai-chip"
                      onClick={() => {
                        setAiMessages((prev) => [
                          ...prev,
                          { role: "assistant", content: "Current status:\n" + missingMessage(missingFields) }
                        ]);
                      }}
                      disabled={aiBusy}
                    >
                      What’s missing?
                    </button>
                    <button
                      type="button"
                      className="ai-chip"
                      onClick={() => setAiInput("I’m 5'4\" and 165 lbs — please fill height and weight.")}
                      disabled={aiBusy}
                    >
                      Convert height
                    </button>
                  </div>

                  {suggestedPatch && (
                    <>
                      <div className="ai-divider" />
                      <div className="ai-panel-title">Suggested updates</div>
                      <pre className="ai-pre">{JSON.stringify(suggestedPatch, null, 2)}</pre>
                      <button
                        type="button"
                        className="ai-apply"
                        onClick={() => {
                          applyPatch(suggestedPatch);
                          setAiMessages((prev) => [
                            ...prev,
                            { role: "assistant", content: "Applied. Anything else you want to add?" }
                          ]);
                        }}
                      >
                        Apply to form
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="ai-footer">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Type here… (e.g., “I’m 58, HbA1c 9.1, 5’4, 165 lbs, GA…”)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") aiSend();
                }}
                disabled={aiBusy}
              />
              <button type="button" onClick={aiSend} disabled={aiBusy || !aiInput.trim()}>
                {aiBusy ? "…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="pi-field">
      <label>
        {label} <span className="pi-hint">({hint})</span>
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled, hint }) {
  return (
    <label className={`pi-toggle ${disabled ? "is-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="pi-toggle-text">
        <span className="pi-toggle-label">{label}</span>
        {hint ? <span className="pi-toggle-hint">{hint}</span> : null}
      </span>
    </label>
  );
}

function ChatPane({ messages }) {
  return (
    <div className="ai-chat">
      {messages.map((m, idx) => (
        <div key={idx} className={`ai-msg ${m.role}`}>
          {m.content}
        </div>
      ))}
    </div>
  );
}