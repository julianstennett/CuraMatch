import React from "react";
import "./styles/MarketingPages.css";
import { FaCompass, FaShieldAlt, FaBolt, FaHandsHelping } from "react-icons/fa";

export default function About({ onGetStarted }) {
  return (
    <div className="cm-page">
      <div className="cm-bg-grid" aria-hidden="true" />
      <div className="cm-bg-glow" aria-hidden="true" />

      <header className="cm-hero">
        <div className="cm-container">
          <div className="cm-breadcrumb">CuraMatch / About</div>

          <h1 className="cm-title">
            About <span className="cm-accent">CuraMatch</span>
          </h1>
          <p className="cm-subtitle">
            Clinical trials can be life-changing, but the search process is frustrating:
            dense criteria, confusing terminology, and limited time. CuraMatch exists to make
            trial discovery feel clear, fast, and human.
          </p>

          <div className="cm-hero-actions">
            <button className="cm-btn cm-btn-primary" onClick={onGetStarted}>
              Start Matching +
            </button>
            <a className="cm-btn cm-btn-ghost" href="#values">
              Our values
            </a>
          </div>
        </div>
      </header>

      <main className="cm-container">
        {/* Mission */}
        <section className="cm-section cm-split">
          <div className="cm-split-left">
            <h2 className="cm-h2">Our mission</h2>
            <p className="cm-muted">
              Help patients and caregivers quickly identify trials they’re likely eligible for,
              with transparent reasoning and location-aware ranking—so fewer opportunities are missed.
            </p>

            <div className="cm-bullets">
              <div className="cm-bullet">
                <FaCompass />
                <div>
                  <div className="cm-bullet-title">Clarity over complexity</div>
                  <div className="cm-muted">
                    Translate medical jargon into straightforward, structured insights.
                  </div>
                </div>
              </div>
              <div className="cm-bullet">
                <FaBolt />
                <div>
                  <div className="cm-bullet-title">Speed when it matters</div>
                  <div className="cm-muted">
                    Get ranked options in minutes instead of hours of manual searching.
                  </div>
                </div>
              </div>
              <div className="cm-bullet">
                <FaShieldAlt />
                <div>
                  <div className="cm-bullet-title">Privacy-minded design</div>
                  <div className="cm-muted">
                    Built to support privacy-conscious workflows and minimize unnecessary exposure of sensitive data.
                  </div>
                </div>
              </div>
              <div className="cm-bullet">
                <FaHandsHelping />
                <div>
                  <div className="cm-bullet-title">People-first</div>
                  <div className="cm-muted">
                    Make it easier to discuss options with clinicians and study coordinators.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cm-split-right">
            <div className="cm-panel">
              <div className="cm-panel-title">What CuraMatch is</div>
              <ul className="cm-panel-list">
                <li>A trial discovery assistant</li>
                <li>A scoring and ranking engine</li>
                <li>A transparent explanation layer</li>
                <li>A location-aware shortlist builder</li>
              </ul>

              <div className="cm-panel-divider" />

              <div className="cm-panel-title">What CuraMatch isn’t</div>
              <ul className="cm-panel-list">
                <li>A medical diagnosis tool</li>
                <li>A replacement for clinical judgment</li>
                <li>A guarantee of enrollment</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values */}
        <section id="values" className="cm-section">
          <div className="cm-section-head">
            <h2 className="cm-h2">Our principles</h2>
            <p className="cm-muted">How we build trust with users.</p>
          </div>

          <div className="cm-grid-3">
            <ValueCard
              title="Explainability"
              text="Users should understand why a trial ranks highly, not just see a score."
            />
            <ValueCard
              title="Fairness"
              text="Be careful with uncertainty and missing data; avoid false certainty."
            />
            <ValueCard
              title="Actionability"
              text="Rank results in a way that helps people take the next step, not just browse."
            />
          </div>
        </section>

        {/* Team / story block (generic, safe) */}
        <section className="cm-section">
          <div className="cm-section-head">
            <h2 className="cm-h2">Why we built this</h2>
            <p className="cm-muted">
              We saw how often trial access is limited by confusing eligibility language and time-consuming searches.
              CuraMatch focuses on the practical barriers: readability, uncertainty, and distance.
            </p>
          </div>

          <div className="cm-story">
            <div className="cm-story-card">
              <div className="cm-story-title">The problem</div>
              <p className="cm-muted">
                Eligibility criteria are often buried in long descriptions and written for experts, not patients.
                Even motivated users can miss important options.
              </p>
            </div>
            <div className="cm-story-card">
              <div className="cm-story-title">The approach</div>
              <p className="cm-muted">
                Structure the information, score it transparently, and rank it around real-world access—so
                the output is a shortlist, not a rabbit hole.
              </p>
            </div>
            <div className="cm-story-card">
              <div className="cm-story-title">The outcome</div>
              <p className="cm-muted">
                Faster discovery, clearer explanations, and a better starting point for conversations with clinicians
                and trial coordinators.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cm-cta">
          <div className="cm-cta-inner">
            <h3 className="cm-h3">Try CuraMatch</h3>
            <p className="cm-muted">
              Create a profile, tune your radius, and get a ranked list of trial options with clear reasoning.
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

function ValueCard({ title, text }) {
  return (
    <div className="cm-card">
      <div className="cm-card-title">{title}</div>
      <div className="cm-muted">{text}</div>
    </div>
  );
}