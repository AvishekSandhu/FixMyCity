// src/api.js
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Optional helper for requests
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Request failed: ${res.status}`);
  }

  return res;
}
