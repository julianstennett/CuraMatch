import { useState } from "react";

const EXAMPLE =
  "I'm a 54-year-old male with Type 2 Diabetes diagnosed 8 years ago. My HbA1c is 8.2%, BMI is 31. I take metformin and sitagliptin. No heart disease.";

export default function PatientIntake({ onResults, onProfileChange }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("idle"); // idle | parsing | searching

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const { parseIntake, matchTrials } = await import("../services/api.js");

      setStep("parsing");
      const profile = await parseIntake(text);
      onProfileChange(profile);

      setStep("searching");
      const trials = await matchTrials(profile);
      onResults(trials, profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  return (
    <div className="intake-card">
      <div className="intake-header">
        <div className="intake-icon">🩺</div>
        <div>
          <h2>Patient Profile</h2>
          <p>Describe your medical situation in plain language</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          className="intake-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I'm a 58-year-old woman with Type 2 Diabetes for 10 years, HbA1c of 9.1%, on insulin and metformin..."
          rows={6}
          disabled={loading}
        />

        <div className="intake-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setText(EXAMPLE)}
            disabled={loading}
          >
            Use example
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                {step === "parsing" ? "Analyzing profile…" : "Finding trials…"}
              </span>
            ) : (
              "Find Matching Trials →"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}
