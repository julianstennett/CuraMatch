import { useState, useEffect } from "react";
import { explainTrial } from "../services/api.js";

const VERDICT_STYLE = {
  "LIKELY QUALIFIES": { bg: "#dcfce7", color: "#16a34a", icon: "✅" },
  "MIGHT QUALIFY": { bg: "#fef9c3", color: "#ca8a04", icon: "⚠️" },
  "LIKELY DOES NOT QUALIFY": { bg: "#fee2e2", color: "#dc2626", icon: "❌" },
};

export default function ExplainPanel({ trial, patientProfile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    explainTrial({
      nct_id: trial.nct_id,
      title: trial.title,
      brief_summary: trial.brief_summary,
      eligibility: trial.eligibility,
      patient_profile: patientProfile,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trial.nct_id]);

  if (loading) {
    return (
      <div className="explain-panel explain-loading">
        <span className="spinner" />
        <span>Gemini is analyzing your eligibility…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explain-panel explain-error">
        <span>⚠️</span> {error}
      </div>
    );
  }

  const verdict = data?.eligibility_verdict || "MIGHT QUALIFY";
  const vstyle = VERDICT_STYLE[verdict] || VERDICT_STYLE["MIGHT QUALIFY"];

  return (
    <div className="explain-panel">
      {/* Verdict banner */}
      <div
        className="verdict-banner"
        style={{ background: vstyle.bg, color: vstyle.color }}
      >
        <span className="verdict-icon">{vstyle.icon}</span>
        <span className="verdict-text">{verdict}</span>
      </div>

      {/* Trial summary */}
      {data?.trial_summary && (
        <div className="explain-section">
          <h4>What this trial studies</h4>
          <p>{data.trial_summary}</p>
        </div>
      )}

      {/* Qualifying factors */}
      {data?.qualifying_factors?.length > 0 && (
        <div className="explain-section">
          <h4>✅ Why you may qualify</h4>
          <ul>
            {data.qualifying_factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential barriers */}
      {data?.potential_barriers?.length > 0 && (
        <div className="explain-section">
          <h4>⚠️ Potential barriers</h4>
          <ul>
            {data.potential_barriers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {data?.next_step && (
        <div className="explain-section next-step">
          <h4>💡 Recommended next step</h4>
          <p>{data.next_step}</p>
        </div>
      )}
    </div>
  );
}
