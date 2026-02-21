const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

/** Parse free-text patient description → structured profile */
export async function parseIntake(freeText) {
  return request("/api/intake", {
    method: "POST",
    body: JSON.stringify({ free_text: freeText }),
  });
}

/** Match trials to a patient profile */
export async function matchTrials(profile) {
  return request("/api/match", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

/** Get Gemini explanation for a trial + patient */
export async function explainTrial(payload) {
  return request("/api/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
