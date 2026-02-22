import TrialCard from "./TrialCard.jsx";

export default function TrialResults({ trials, patientProfile, onReset }) {
  if (!trials) return null;

  return (
    <div className="results-section">
      <div className="results-header">
        <div className="results-title">
          <h2 style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {trials.length > 0
              ? `${trials.length} Matching Trials Found`
              : "No Trials Found"}
          </h2>
          {patientProfile && (
            <div className="profile-pills">
              {patientProfile.age && (
                <span className="pill">Age: {patientProfile.age}</span>
              )}
              {patientProfile.sex && (
                <span className="pill">{patientProfile.sex}</span>
              )}
              {patientProfile.conditions?.map((c) => (
                <span className="pill pill-blue" key={c}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="btn-ghost" onClick={onReset}>
          ← New search
        </button>
      </div>

      {trials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No trials matched your current profile. Try broadening your description.</p>
        </div>
      ) : (
        <div className="trials-list">
          {trials.map((trial, i) => (
            <TrialCard
              key={trial.nct_id}
              trial={trial}
              patientProfile={patientProfile}
              rank={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
