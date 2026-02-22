import { useState } from "react";
import { 
  MapPin, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  Info 
} from "lucide-react";
import ExplainPanel from "./ExplainPanel.jsx";

// Helper to format date and remove 00:00:00
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "nan") return null;
  return dateStr.split(" ")[0].replace(/-/g, "/");
};

// Helper to filter out "nan" or empty strings
const isValid = (val) => val && val !== "nan" && val !== "null";

export default function TrialCard({ trial, patientProfile, rank }) {
  const [showExplain, setShowExplain] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Main Green Theme Colors
  const theme = {
    primary: "#10b981", // Emerald 500
    primaryLight: "#f0fdf4",
    border: "#e2e8f0",
    textMain: "#1e293b",
    textMuted: "#64748b"
  };

  return (
    <div className={`trial-card ${rank === 1 ? 'top-match' : ''}`} style={styles.card}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.badgeRow}>
          {rank === 1 && (
            <span style={styles.topMatchBadge}>
              <Sparkles size={14} style={{ marginRight: 4 }} />
              TOP MATCH
            </span>
          )}
          {isValid(trial.phase) && (
            <span style={styles.badge}>{trial.phase}</span>
          )}
          {isValid(trial.study_type) && (
            <span style={styles.badgeSecondary}>{trial.study_type}</span>
          )}
        </div>
        <a
          href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
          target="_blank"
          rel="noreferrer"
          style={styles.nctLink}
        >
          {trial.nct_id} <ExternalLink size={14} />
        </a>
      </div>

      <div style={styles.mainContent}>
        {/* Score Hero Section */}
        <div style={styles.scoreContainer}>
          <div style={styles.scoreValue}>
            {Math.round(trial.match_score)}
            <span style={styles.scorePercent}>%</span>
          </div>
          <div style={styles.scoreLabel}>Match Score</div>
          <div style={styles.confidenceTag}>
             <Info size={12} style={{marginRight: 4}} />
             {trial.confidence} Confidence
          </div>
        </div>

        {/* Title and Summary */}
        <div style={styles.infoContainer}>
          <h3 style={styles.title}>{trial.title}</h3>
          
          {isValid(trial.brief_summary) && (
            <div style={styles.summaryContainer}>
              <p style={styles.summary}>
                {isExpanded 
                  ? trial.brief_summary 
                  : `${trial.brief_summary.slice(0, 180)}...`}
              </p>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                style={styles.textBtn}
              >
                {isExpanded ? "Show Less" : "Read Full Description"}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div style={styles.detailsGrid}>
        {isValid(trial.us_cities) && (
          <div style={styles.detailItem}>
            <MapPin size={16} color={theme.primary} />
            <span>{trial.us_cities.split("|")[0]}</span>
          </div>
        )}
        {(trial.min_age || trial.max_age) && (
          <div style={styles.detailItem}>
            <User size={16} color={theme.primary} />
            <span>{trial.min_age ?? "0"}-{trial.max_age ?? "100"} yrs</span>
          </div>
        )}
        {isValid(trial.last_updated) && (
          <div style={styles.detailItem}>
            <Calendar size={16} color={theme.primary} />
            <span>Updated: {formatDate(trial.last_updated)}</span>
          </div>
        )}
      </div>

      {/* Action Area */}
      <button
        className="btn-explain"
        onClick={() => setShowExplain((v) => !v)}
        style={styles.explainBtn}
      >
        <Sparkles size={18} />
        {showExplain ? "Hide AI Analysis" : "Explain My Eligibility"}
      </button>

      {showExplain && (
        <div style={styles.panelWrapper}>
            <ExplainPanel trial={trial} patientProfile={patientProfile} />
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    fontFamily: "Inter, system-ui, sans-serif",
    position: "relative",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  badgeRow: { display: "flex", gap: "8px", alignItems: "center" },
  topMatchBadge: {
    background: "#10b981",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    letterSpacing: "0.05em"
  },
  badge: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #dcfce7"
  },
  badgeSecondary: {
    background: "#f8fafc",
    color: "#64748b",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid #e2e8f0"
  },
  nctLink: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  mainContent: {
    display: "flex",
    gap: "24px",
    marginBottom: "20px",
    alignItems: "flex-start"
  },
  scoreContainer: {
    textAlign: "center",
    padding: "16px",
    background: "#f0fdf4",
    borderRadius: "12px",
    minWidth: "110px",
    border: "1px solid #dcfce7"
  },
  scoreValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#065f46",
    lineHeight: "1"
  },
  scorePercent: { fontSize: "16px", marginLeft: "2px" },
  scoreLabel: {
    fontSize: "11px",
    color: "#059669",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: "4px"
  },
  confidenceTag: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  infoContainer: { flex: 1 },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
    lineHeight: "1.4"
  },
  summary: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: 0
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#10b981",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 0",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  detailsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    padding: "16px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9"
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500"
  },
  explainBtn: {
    width: "100%",
    marginTop: "20px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "transform 0.2s ease"
  },
  panelWrapper: {
      marginTop: "16px",
      animation: "slideIn 0.3s ease-out"
  }
};