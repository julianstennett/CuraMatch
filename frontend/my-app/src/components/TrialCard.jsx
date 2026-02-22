import { useState } from "react";
import ExplainPanel from "./ExplainPanel.jsx";

const PHASE_COLOR = {
  "Phase 1": "#f59e0b",
  "Phase 2": "#3b82f6",
  "Phase 3": "#10b981",
  "Phase 4": "#8b5cf6",
  "N/A": "#6b7280",
};

function phaseColor(phase) {
  for (const [key, val] of Object.entries(PHASE_COLOR)) {
    if (phase?.includes(key)) return val;
  }
  return "#6b7280";
}

export default function TrialCard({ trial, patientProfile, rank }) {
  const [showExplain, setShowExplain] = useState(false);

  const color = phaseColor(trial.phase);

  return (
    <div className="trial-card" style={{ "--accent": color }}>
      <div className="trial-card-top">
        <div className="trial-rank">#{rank}</div>
        <div className="trial-meta">
          {trial.phase && (
            <span className="badge" style={{ background: color + "22", color }}>
              {trial.phase}
            </span>
          )}
          {trial.study_type && (
            <span className="badge badge-neutral">{trial.study_type}</span>
          )}
        </div>
        <a
          href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
          target="_blank"
          rel="noreferrer"
          className="nct-link"
        >
          {trial.nct_id} ↗
        </a>
      </div>

      <h3 className="trial-title">{trial.title}</h3>
      <h3 className="trial-title">Score: {trial.match_score}</h3>
      {trial.brief_summary && (
        <p className="trial-summary">{trial.brief_summary.slice(0, 280)}…</p>
      )}

      <div className="trial-details">
        {trial.us_cities && (
          <div className="detail-chip">
            <span>📍</span>
            <span>{trial.us_cities.split("|").slice(0, 3).join(", ")}</span>
          </div>
        )}
        {(trial.min_age || trial.max_age) && (
          <div className="detail-chip">
            <span>🎂</span>
            <span>
              {trial.min_age ?? "?"}–{trial.max_age ?? "?"} yrs
            </span>
          </div>
        )}
        {trial.sex && trial.sex !== "All" && (
          <div className="detail-chip">
            <span>⚧</span>
            <span>{trial.sex}</span>
          </div>
        )}
        {trial.last_updated && (
          <div className="detail-chip">
            <span>📅</span>
            <span>{trial.last_updated}</span>
          </div>
        )}
      </div>

      <button
        className="btn-explain"
        onClick={() => setShowExplain((v) => !v)}
        style={{ borderColor: color, color }}
      >
        {showExplain ? "▲ Hide AI explanation" : "✨ Explain this trial for me"}
      </button>

      {showExplain && (
        <ExplainPanel trial={trial} patientProfile={patientProfile} />
      )}
    </div>
  );
}
