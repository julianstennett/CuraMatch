import React from "react";
import "./styles/MarketingPages.css";
import { FaCheckCircle, FaShieldAlt, FaMapMarkedAlt, FaBrain, FaFileMedical } from "react-icons/fa";

export default function HowItWorks({ onGetStarted }) {
  return (
    <div className="cm-page">
      {/* Top glow / subtle grid */}
      <div className="cm-bg-grid" aria-hidden="true" />
      <div className="cm-bg-glow" aria-hidden="true" />

      <header className="cm-hero">
        <div className="cm-container">
          <div className="cm-breadcrumb">CuraMatch / How it works</div>

          <h1 className="cm-title">
            How CuraMatch finds the right <span className="cm-accent">clinical trials</span>
          </h1>
          <p className="cm-subtitle">
            We turn messy eligibility criteria into structured signals, score your fit probabilistically,
            and rank trials by both eligibility and location—so you can act quickly with confidence.
          </p>

          <div className="cm-hero-actions">
            <button className="cm-btn cm-btn-primary" onClick={onGetStarted}>
              Start Matching +
            </button>
            <a className="cm-btn cm-btn-ghost" href="#faq">
              See FAQs
            </a>
          </div>

          <div className="cm-hero-metrics">
            <div className="cm-metric">
              <div className="cm-metric-top">Structured</div>
              <div className="cm-metric-big">Patient Profile</div>
              <div className="cm-metric-sub">Age, labs, meds, comorbidities</div>
            </div>
            <div className="cm-metric">
              <div className="cm-metric-top">Scored</div>
              <div className="cm-metric-big">Eligibility</div>
              <div className="cm-metric-sub">Transparent reasons & weights</div>
            </div>
            <div className="cm-metric">
              <div className="cm-metric-top">Ranked</div>
              <div className="cm-metric-big">Near You</div>
              <div className="cm-metric-sub">Distance + site availability</div>
            </div>
          </div>
        </div>
      </header>

      <main className="cm-container">
        {/* Steps */}
        <section className="cm-section">
          <div className="cm-section-head">
            <h2 className="cm-h2">The workflow</h2>
            <p className="cm-muted">
              A clean pipeline from “patient story” → “clear trial matches.”
            </p>
          </div>

          <div className="cm-steps">
            <StepCard
              icon={<FaFileMedical />}
              step="01"
              title="Create a patient snapshot"
              text="Enter health details once. CuraMatch normalizes them into structured medical features (e.g., HbA1c, BMI, meds, history)."
              bullets={[
                "Human-friendly form",
                "No dense medical wording required",
                "You control what’s included",
              ]}
            />
            <StepCard
              icon={<FaBrain />}
              step="02"
              title="Translate trial criteria into signals"
              text="We parse inclusion/exclusion rules into measurable requirements so your profile can be compared consistently."
              bullets={[
                "Requirement extraction (ranges, conditions, meds)",
                "Handles missing fields gracefully",
                "Keeps “why” explanations for transparency",
              ]}
            />
            <StepCard
              icon={<FaCheckCircle />}
              step="03"
              title="Score eligibility probabilistically"
              text="Instead of a hard yes/no, CuraMatch produces a score that reflects uncertainty and partial matches—useful when data is incomplete."
              bullets={[
                "Weighted scoring per criterion",
                "Partial credit where appropriate",
                "Clear reasons for each score",
              ]}
            />
            <StepCard
              icon={<FaMapMarkedAlt />}
              step="04"
              title="Rank by fit + geography"
              text="Matches are ranked by both eligibility score and practical access—distance, trial sites, and filters you choose."
              bullets={[
                "Distance-aware ranking",
                "Site-level filtering",
                "Save & compare top trials",
              ]}
            />
            <StepCard
              icon={<FaShieldAlt />}
              step="05"
              title="Review & take action"
              text="Get a short list you can share with a clinician or use to contact study sites—without spending hours reading dense PDFs."
              bullets={[
                "Export/share summary",
                "Fast shortlist for next steps",
                "Designed to support privacy-minded workflows",
              ]}
            />
          </div>
        </section>

        {/* Transparency / premium block */}
        <section className="cm-section cm-split">
          <div className="cm-split-left">
            <h2 className="cm-h2">Transparent by design</h2>
            <p className="cm-muted">
              CuraMatch doesn’t just give results—it shows how it got there.
              Each match includes a breakdown of which criteria helped or hurt the score.
            </p>

            <div className="cm-callouts">
              <div className="cm-callout">
                <div className="cm-callout-title">Explainable scoring</div>
                <div className="cm-callout-text">
                  See criteria-level decisions (age range, HbA1c thresholds, medication requirements, etc.).
                </div>
              </div>
              <div className="cm-callout">
                <div className="cm-callout-title">Practical ranking</div>
                <div className="cm-callout-text">
                  A great match 800 miles away isn’t always useful. Location is built in from the start.
                </div>
              </div>
              <div className="cm-callout">
                <div className="cm-callout-title">User control</div>
                <div className="cm-callout-text">
                  Adjust filters, prioritize what matters, and save the shortlist you want.
                </div>
              </div>
            </div>
          </div>

          <div className="cm-split-right">
            <div className="cm-demo-card">
              <div className="cm-demo-top">
                <div className="cm-demo-pill">Match Summary</div>
                <div className="cm-demo-score">
                  <span className="cm-demo-score-big">0.82</span>
                  <span className="cm-demo-score-sub">Eligibility score</span>
                </div>
              </div>

              <div className="cm-demo-body">
                <DemoRow label="Age" value="Matched" tone="good" />
                <DemoRow label="HbA1c" value="Within range" tone="good" />
                <DemoRow label="BMI" value="Slightly high" tone="warn" />
                <DemoRow label="Medication" value="Metformin required" tone="good" />
                <DemoRow label="Distance" value="Same state" tone="good" />
              </div>

              <div className="cm-demo-footer">
                <div className="cm-muted">
                  *Example UI — your scores depend on your inputs and trial criteria.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="cm-section">
          <div className="cm-section-head">
            <h2 className="cm-h2">FAQs</h2>
            <p className="cm-muted">Quick answers for users, clinicians, and caregivers.</p>
          </div>

          <div className="cm-faq">
            <FaqItem
              q="Is CuraMatch a medical diagnosis tool?"
              a="No. CuraMatch is a trial discovery and matching assistant. Always confirm eligibility and medical decisions with a licensed clinician and the study team."
            />
            <FaqItem
              q="Why probabilistic scoring instead of yes/no?"
              a="Real eligibility can be uncertain—records may be incomplete and criteria can be nuanced. A score helps you prioritize likely fits and understand what to clarify next."
            />
            <FaqItem
              q="How do you handle missing information?"
              a="We avoid blocking you. Missing fields reduce confidence in the score and are clearly surfaced so you know what to fill in for stronger matches."
            />
            <FaqItem
              q="How does location affect ranking?"
              a="You can set radius and preferences. CuraMatch incorporates distance into ranking so nearby, high-fit trials rise to the top."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="cm-cta">
          <div className="cm-cta-inner">
            <h3 className="cm-h3">Ready to see matches near you?</h3>
            <p className="cm-muted">
              Build a patient snapshot and get ranked, explainable trial options in minutes.
            </p>
            <button className="cm-btn cm-btn-primary" onClick={onGetStarted}>
              Start Matching +
            </button>
          </div>
        </section>
      </main>

      <footer className="cm-footer">
        <div className="cm-container cm-footer-inner">
          <div className="cm-footer-brand">CuraMatch</div>
          <div className="cm-footer-links">
            <a href="/about">About</a>
            <a href="/how-it-works">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ icon, step, title, text, bullets }) {
  return (
    <div className="cm-step-card">
      <div className="cm-step-top">
        <div className="cm-step-icon">{icon}</div>
        <div className="cm-step-num">{step}</div>
      </div>
      <h3 className="cm-step-title">{title}</h3>
      <p className="cm-step-text">{text}</p>
      <ul className="cm-step-list">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function DemoRow({ label, value, tone }) {
  return (
    <div className={`cm-demo-row cm-tone-${tone}`}>
      <div className="cm-demo-label">{label}</div>
      <div className="cm-demo-value">{value}</div>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <details className="cm-faq-item">
      <summary className="cm-faq-q">{q}</summary>
      <div className="cm-faq-a">{a}</div>
    </details>
  );
}