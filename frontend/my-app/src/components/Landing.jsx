import React from "react";
import "./styles/Landing.css";
import { FaUser } from "react-icons/fa";

export default function Landing({ onGetStarted, onHowItWorks, onAbout }) {
  const breakdown = [
    { label: "Eligibility", value: 92, tone: "good" },
    { label: "Labs (HbA1c)", value: 88, tone: "good" },
    { label: "BMI", value: 62, tone: "warn" },
    { label: "Medications", value: 90, tone: "good" },
  ];

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
            <div
              key={`${x}-${y}`}
              className="grid-crosshair"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))
        )}

        {/* Hero Content (Top Row) */}
        <div className="hero-text-wrapper">
          <h1 style={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "#0f172a" }}>
            Find your match <br />
            <span style={{ color: "var(--primary)" }}>clinical trials.</span>
          </h1>

          <p className="hero-description">
            CuraMatch translates patient profiles into structured medical features, scores eligibility
            across active trials, and ranks geographically accessible matches.
          </p>

          <div className="hero-actions">
            <button
              className="btn-main-cta"
              onClick={onGetStarted}
              style={{ background: "var(--primary)" }}
            >
              Start Matching +
            </button>
            <button className="btn-secondary-cta" onClick={onHowItWorks}>
              How it works
            </button>
            <button className="btn-secondary-cta" onClick={onAbout}>
              About
            </button>
          </div>
        </div>

        {/* Left Side Info Block (Row 2, Col 1) */}
        <div className="grid-cell info-block">
          <div className="info-icon">⛨</div>
          <p>
            Find trials faster with transparent eligibility scoring and location-aware ranking—built
            to support patients and caregivers.
          </p>
        </div>

        {/* Center Floating Card (Row 2, Col 2) */}
        <div className="floating-card-main">
          <div className="card-header">
            <div className="status-pill">Top Match Found</div>
            <div className="avatar-circle" aria-hidden="true">
              <FaUser size={30} color="teal" />
            </div>
          </div>

          {/* Matching-focused visualization */}
          <div
            className="match-viz"
            style={{
              width: "100%",
              marginTop: "0.75rem",
              display: "block",
            }}
          >
            {/* Header: force spacing even without CSS */}
            <div
              className="match-viz-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: "0.9rem",
              }}
            >
              <span
                className="viz-title"
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "rgba(15,23,42,0.85)",
                }}
              >
                Match Breakdown
              </span>

              <span
                className="viz-pill"
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 650,
                  padding: "0.25rem 0.6rem",
                  borderRadius: 999,
                  border: "1px solid rgba(15,23,42,0.10)",
                  background: "rgba(15,23,42,0.03)",
                  color: "rgba(15,23,42,0.72)",
                  whiteSpace: "nowrap",
                }}
              >
                12 mi
              </span>
            </div>

            {/* Bars */}
            <div className="viz-bars" style={{ display: "grid", gap: "0.75rem" }}>
              {breakdown.map((item) => {
                const fillColor =
                  item.tone === "warn" ? "rgba(245,158,11,0.95)" : "var(--primary)";
                const valueColor =
                  item.tone === "warn" ? "rgba(245,158,11,0.95)" : "rgba(15,23,42,0.85)";

                return (
                  <div className="viz-row" key={item.label} style={{ display: "grid", gap: "0.35rem" }}>
                    <div
                      className="viz-row-top"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 10,
                      }}
                    >
                      <span
                        className="viz-label"
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "rgba(15,23,42,0.72)",
                        }}
                      >
                        {item.label}
                      </span>

                      <span
                        className={`viz-value viz-${item.tone}`}
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: valueColor,
                        }}
                      >
                        {item.value}%
                      </span>
                    </div>

                    <div
                      className="viz-track"
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className={`viz-fill viz-${item.tone}`}
                        style={{
                          width: `${item.value}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: fillColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="viz-footer"
              style={{
                marginTop: "0.9rem",
                fontSize: "0.82rem",
                color: "rgba(15,23,42,0.62)",
                lineHeight: 1.35,
              }}
            >
              Ranked by <strong>eligibility</strong> + <strong>distance</strong>
            </div>
          </div>

          <div className="card-stats">
            <span className="match-value">92%</span>
            <span className="match-label">Eligibility Score</span>
          </div>

          <div className="card-footer">
            <div className="footer-item">
              <span className="dot" /> Transparent scoring & nearby sites
            </div>
          </div>
        </div>

        {/* Right Side Pills (Row 2, Col 3) */}
        <div className="grid-cell pills-block">
          <div className="pill-list">
            <div className="pill-item">
              <span>◈</span> CUSTOMIZABLE
            </div>
            <div className="pill-item">
              <span>◈</span> FLEXIBLE
            </div>
            <div className="pill-item">
              <span>◈</span> FULL CONTROL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}