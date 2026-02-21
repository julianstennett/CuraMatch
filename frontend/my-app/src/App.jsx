import { useState } from "react";
import PatientIntake from "./components/PatientIntake.jsx";
import TrialResults from "./components/TrialResults.jsx";
import "./App.css";

export default function App() {
  const [trials, setTrials] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showResults, setShowResults] = useState(false);

  function handleResults(trialList, patientProfile) {
    setTrials(trialList);
    setProfile(patientProfile);
    setShowResults(true);
  }

  function handleReset() {
    setShowResults(false);
    setTrials(null);
    setProfile(null);
  }

  return (
    <div className="app">
      {/* Background decoration */}
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⊕</span>
          <span className="logo-text">CareCompass</span>
          <span className="logo-ai">AI</span>
        </div>
        <p className="tagline">Clinical trial matching for Type 2 Diabetes</p>
      </header>

      <main className="app-main">
        {!showResults ? (
          <div className="intake-section">
            <div className="hero-copy">
              <h1>Find your next<br /><em>clinical trial</em></h1>
              <p>
                Describe your situation in plain English. Our AI extracts your
                medical profile and matches you against active US trials.
              </p>
            </div>
            <PatientIntake
              onResults={handleResults}
              onProfileChange={setProfile}
            />
          </div>
        ) : (
          <TrialResults
            trials={trials}
            patientProfile={profile}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          CareCompass AI is for informational purposes only — always consult
          your physician before joining a clinical trial.
        </p>
      </footer>
    </div>
  );
}
