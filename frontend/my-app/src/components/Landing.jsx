import React from "react";
import "./styles/Landing.css";
import { FaUser } from "react-icons/fa";

export default function Landing({ onGetStarted }) {
  return (
    <div className="landing-page-wrapper">
      <div className="landing-grid-container">
        {/* Decorative Grid Lines */}
        <div className="grid-line-h" style={{ top: "33.33%" }} />
        <div className="grid-line-h" style={{ top: "66.66%" }} />
        <div className="grid-line-v" style={{ left: "33.33%" }} />
        <div className="grid-line-v" style={{ left: "66.66%" }} />

        {/* Crosshair Markers at intersections */}
        {[33.33, 66.66].map((x) =>
          [33.33, 66.66].map((y) => (
            <div key={`${x}-${y}`} className="grid-crosshair" style={{ left: `${x}%`, top: `${y}%` }} />
          ))
        )}

        {/* Hero Content (Top Row) */}
        <div className="hero-text-wrapper">
        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: '#0f172a' }}>
            Find your match <br />
            <span style={{ color: 'var(--primary)' }}>clinical trials.</span>
        </h1>
        <p className="hero-description">
            CuraMatch translates patient profiles into structured medical features, 
            scores eligibility across active trials, and ranks geographically accessible matches.
        </p>
        <div className="hero-actions">
            <button className="btn-main-cta" onClick={onGetStarted} style={{background: 'var(--primary)'}}>
            Start Matching +
            </button>
            <button className="btn-secondary-cta">How it works</button>
        </div>
        </div>

        {/* Left Side Info Block (Row 2, Col 1) */}
        <div className="grid-cell info-block">
          <div className="info-icon">⛨</div>
          <p>Secure your medical future with AI-driven advocacy and real-time trial tracking.</p>
        </div>

        {/* Center Floating Card (Row 2, Col 2) */}
        <div className="floating-card-main">
          <div className="card-header">
            <div className="status-pill">Match Engine Active</div>
            <div className="avatar-circle">
              <FaUser size={30} color="teal" />
            </div>
          </div>
          
          <div className="chart-container">
            {/* Simple SVG Sparkline */}
            <svg viewBox="0 0 100 40" className="sparkline">
              <path 
                d="M0,35 Q20,35 40,15 T80,5 T100,20" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="80" cy="5" r="3" fill="var(--primary)" />
            </svg>
          </div>

          <div className="card-stats">
            <span className="match-value">98%</span>
            <span className="match-label">Compatibility Score</span>
          </div>

          <div className="card-footer">
            <div className="footer-item">
              <span className="dot" /> Keep track of growth
            </div>
          </div>
        </div>

        {/* Right Side Pills (Row 2, Col 3) */}
        <div className="grid-cell pills-block">
          <div className="pill-list">
            <div className="pill-item"><span>◈</span> CUSTOMIZABLE</div>
            <div className="pill-item"><span>◈</span> FLEXIBLE</div>
            <div className="pill-item"><span>◈</span> FULL CONTROL</div>
          </div>
        </div>
      </div>
    </div>
  );
}