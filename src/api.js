// src/api.js
export const API_URL = (() => {
  // Vite or CRA env
  const vite = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined;
  const cra = typeof process !== "undefined" ? process.env?.REACT_APP_API_URL : undefined;
  const env = vite || cra;

  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    // Local dev (CRA 3000, Vite 5173)
    if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:3001";
    // Same-origin fallback (if reverse proxy)
    return origin.replace(/\/$/, "");
  }

  return "http://localhost:3001";
})();