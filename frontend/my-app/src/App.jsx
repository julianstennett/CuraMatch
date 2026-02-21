import { useState } from "react";
import PatientIntake from "./components/PatientIntake.jsx";
import TrialResults from "./components/TrialResults.jsx";
import Landing from "./components/Landing.jsx";
import { FaHeart } from "react-icons/fa";
import "./App.css";

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [route, setRoute] = useState("landing");

  const [profile, setProfile] = useState(null);
  const [trials, setTrials] = useState([]);

  function handleResults(trialList, patientProfile) {
    setTrials(trialList);
    setProfile(patientProfile);
    setShowResults(true);
  }

  function handleProfileChange(updatedProfile) {
    setProfile(updatedProfile);
  }

  function handleReset() {
    setShowResults(false);
    setTrials(null);
    setProfile(null);
  }

return (
    <div className="viewport-container">
      {/* Background decoration moved INSIDE the frame */}
      <div className="bg-grid" />
      
      <header className="app-header">
        <div className="logo-container">
          <div 
          className="logo clickable-logo" 
          onClick={() => setRoute("landing")}
          role="button"
          tabIndex={0}
        >
          <FaHeart color="teal" size={25} />
          <span className="logo-text" style={{ fontWeight: 700 }}>CuraMatch</span>
          <span className="logo-ai">AI</span>
        </div>
          <nav className="header-nav">
            <span>How it works</span>
            <span>About</span>
          </nav>
        </div>

        <div className="header-right">
          <button className="btn-ghost">Log in</button>
          <button className="btn-primary" onClick={() => setRoute("intake")} 
            style={{ borderRadius: '100px', background: '#0f172a' }}>
            Demo CuraMatch +
          </button>
        </div>
      </header>

      <main className="app-main">
        {route === "landing" && (
          <Landing onGetStarted={() => setRoute("intake")} />
        )}

        {route === "intake" && !showResults && (
          <PatientIntake
            onResults={handleResults}
            onProfileChange={handleProfileChange}
          />
        )}

        {route === "intake" && showResults && (
          <TrialResults
            trials={trials}
            patientProfile={profile}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>CuraMatch AI — Saving time and widening opportunities for patients.</p>
      </footer>
    </div>
  );
}

