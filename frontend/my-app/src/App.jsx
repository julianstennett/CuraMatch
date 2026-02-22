import { useState } from "react";
import PatientIntake from "./components/PatientIntake.jsx";
import TrialResults from "./components/TrialResults.jsx";
import Landing from "./components/Landing.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import About from "./components/About.jsx";
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
            <span className="nav-link" onClick={() => setRoute("how")} role="button" tabIndex={0}>How it works</span>
            <span className="nav-link" onClick={() => setRoute("about")} role="button" tabIndex={0}>About</span>
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
          <Landing 
            onGetStarted={() => setRoute("intake")} 
            onHowItWorks={() => setRoute("how")}
            onAbout={() => setRoute("about")}
          />
        )}

        {route === "how" && (
          <HowItWorks onGetStarted={() => setRoute("intake")} />
        )}

        {route === "about" && (
          <About onGetStarted={() => setRoute("intake")} />
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

