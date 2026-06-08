// src/pages/publicMap.jsx
import React, { useEffect, useState, useCallback } from "react";
import { API_URL } from "../api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// ── Fix Leaflet default icons ──────────────────────────────────────────────
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ── Constants ──────────────────────────────────────────────────────────────
const INDIA_CENTER  = [22.9734, 78.6569];
const DEFAULT_ZOOM  = 5;
const GEO_CACHE_KEY = "fmc_geo_cache_v2";

const STATUS_STYLES = {
  closed:        { dot: "#10b981", badge: "bg-emerald-900/30 text-emerald-400 border-emerald-700" },
  resolved:      { dot: "#10b981", badge: "bg-emerald-900/30 text-emerald-400 border-emerald-700" },
  in_progress:   { dot: "#f59e0b", badge: "bg-amber-900/30 text-amber-400 border-amber-700"       },
  "in-progress": { dot: "#f59e0b", badge: "bg-amber-900/30 text-amber-400 border-amber-700"       },
  pending:       { dot: "#ef4444", badge: "bg-red-900/30 text-red-400 border-red-700"             },
};

function getStatusStyle(s = "pending") {
  return STATUS_STYLES[s.toLowerCase()] || STATUS_STYLES.pending;
}

// ── Geocache helpers ───────────────────────────────────────────────────────
function getGeoCache() {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}"); }
  catch { return {}; }
}
function saveGeoCache(c) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c)); } catch {}
}

// ── Normalize backend shapes ───────────────────────────────────────────────
function normalize(c) {
  let lat = null, lng = null;

  if (c?.location?.lat != null && c?.location?.lng != null) {
    lat = Number(c.location.lat);
    lng = Number(c.location.lng);
  } else if (
    Array.isArray(c?.location?.coordinates) &&
    c.location.coordinates.length === 2
  ) {
    lng = Number(c.location.coordinates[0]);
    lat = Number(c.location.coordinates[1]);
  } else if (c?.lat != null && c?.lng != null) {
    lat = Number(c.lat);
    lng = Number(c.lng);
  } else if (c?.latitude != null && c?.longitude != null) {
    lat = Number(c.latitude);
    lng = Number(c.longitude);
  }

  const address =
    c.address || c.location?.address || c.area || c.locality || c.landmark || "";

  const code =
    c.ticketId || c.ticket || c.complaintNumber || c.publicToken || c._id || "";

  return {
    id:            c._id || code || Math.random().toString(36).slice(2),
    code,
    title:         c.title || c.subject || "(no title)",
    complaintType: c.complaintType || c.category || "-",
    status:        c.status || "pending",
    lat:           isFinite(lat) && lat !== 0 ? lat : null,
    lng:           isFinite(lng) && lng !== 0 ? lng : null,
    address,
    description:   c.description || "",
    createdAt:     c.createdAt || null,
  };
}

// ── Fetch complaints — tries multiple endpoints ────────────────────────────
// ✅ FIX: was `ENDPOINTS` (undefined) — now correctly uses `endpoints`
async function fetchComplaints() {
  const endpoints = [
    `${API_URL}/api/complaints/public`,
    `${API_URL}/api/public/complaints`,
    `${API_URL}/api/complaints?public=1`,
    `${API_URL}/api/summary`,
  ];

  const errors = [];

  for (const url of endpoints) {           // ← was `ENDPOINTS` (bug)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const raw =
        (Array.isArray(json)                    && json)                    ||
        (Array.isArray(json.complaints)         && json.complaints)         ||
        (Array.isArray(json.data)               && json.data)               ||
        (Array.isArray(json.items)              && json.items)              ||
        (Array.isArray(json.results)            && json.results)            ||
        (Array.isArray(json.recentComplaints)   && json.recentComplaints)   ||
        [];

      if (raw.length === 0) {
        // endpoint responded but empty — try next
        errors.push(`${url} → responded but returned 0 items`);
        continue;
      }

      return { items: raw.map(normalize), source: url, error: "" };
    } catch (e) {
      errors.push(`${url} → ${e.message}`);
    }
  }

  return {
    items:  [],
    source: "",
    error:  "Could not load complaints.\n" + errors.join("\n"),
  };
}

// ── Geocode addresses via Nominatim ───────────────────────────────────────
async function geocodeMissing(items, maxN = 10) {
  const cache = getGeoCache();
  const out   = [...items];
  let hits    = 0;

  for (let i = 0; i < out.length && hits < maxN; i++) {
    const it = out[i];
    if (it.lat != null || !it.address) continue;

    const key = it.address.trim().toLowerCase();
    if (cache[key]) {
      const [la, ln] = cache[key];
      out[i] = { ...it, lat: la, lng: ln };
      continue;
    }

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(it.address)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d?.[0]) {
          const la = Number(d[0].lat), ln = Number(d[0].lon);
          if (isFinite(la) && isFinite(ln)) {
            out[i]     = { ...it, lat: la, lng: ln };
            cache[key] = [la, ln];
            saveGeoCache(cache);
          }
        }
      }
    } catch {}

    hits++;
    await new Promise((r) => setTimeout(r, 700));
  }

  return out;
}

// ── Auto-fit map to marker bounds ─────────────────────────────────────────
function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    try {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    } catch {}
  }, [markers, map]);
  return null;
}

// ── Colored SVG pin ───────────────────────────────────────────────────────
function makePinIcon(color = "#ef4444") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z"
          fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    className:   "",
    html:        svg,
    iconSize:    [28, 38],
    iconAnchor:  [14, 38],
    popupAnchor: [0, -40],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════
export default function PublicMap() {
  const [allItems,  setAllItems]  = useState([]);
  const [markers,   setMarkers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error,     setError]     = useState("");
  const [source,    setSource]    = useState("");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");

  // ── Load data ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setGeocoding(false);
    setAllItems([]);
    setMarkers([]);

    const { items, source: src, error: err } = await fetchComplaints();

    setAllItems(items);
    setSource(src);

    // Only set error if we truly got nothing
    if (items.length === 0) setError(err);

    // Separate items that already have coordinates
    let withCoords = items.filter((x) => x.lat != null && x.lng != null);

    // If zero have coords but some have an address → geocode
    if (withCoords.length === 0 && items.some((x) => x.address)) {
      setGeocoding(true);
      const geocoded = await geocodeMissing(items, 10);
      withCoords = geocoded.filter((x) => x.lat != null && x.lng != null);
      setAllItems(geocoded);
      setGeocoding(false);
    }

    setMarkers(withCoords);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered feed ─────────────────────────────────────────────────────
  const displayFeed = allItems.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(q)         ||
      c.code.toLowerCase().includes(q)          ||
      c.complaintType.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);

    const st = c.status?.toLowerCase();
    const matchFilter =
      filter === "all" ||
      st === filter ||
      (filter === "in_progress" && st === "in-progress") ||
      (filter === "resolved"    && st === "closed");

    return matchSearch && matchFilter;
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  const total      = allItems.length;
  const totalPend  = allItems.filter((c) => c.status?.toLowerCase() === "pending").length;
  const totalInPro = allItems.filter((c) =>
    ["in_progress", "in-progress"].includes(c.status?.toLowerCase())).length;
  const totalRes   = allItems.filter((c) =>
    ["resolved", "closed"].includes(c.status?.toLowerCase())).length;

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Spinner keyframes (injected once) ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .custom-scroll::-webkit-scrollbar       { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>

      {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              🗺️ Live Complaints Map
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Public view — real-time civic issues in your area
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading || geocoding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold
                       transition-colors"
          >
            {loading || geocoding ? <><Spinner size={14} /> Loading…</> : "↺ Refresh"}
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="max-w-7xl mx-auto mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total"       value={total}      color="sky"     />
            <StatCard label="Pending"     value={totalPend}  color="red"     />
            <StatCard label="In Progress" value={totalInPro} color="amber"   />
            <StatCard label="Resolved"    value={totalRes}   color="emerald" />
          </div>
        )}
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            {loading ? (
              <MapPlaceholder>
                <Spinner size={36} />
                <p className="text-slate-400 mt-3 text-sm">Loading complaints…</p>
              </MapPlaceholder>

            ) : geocoding ? (
              <MapPlaceholder>
                <Spinner size={36} />
                <p className="text-slate-400 mt-3 text-sm">
                  Geocoding addresses… please wait
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  (up to 10 addresses, ~7 s)
                </p>
              </MapPlaceholder>

            ) : markers.length === 0 ? (
              <MapPlaceholder>
                <span className="text-5xl">📍</span>
                <p className="text-slate-300 mt-3 font-semibold">No map locations available</p>
                <p className="text-slate-500 text-xs mt-1 max-w-xs text-center leading-relaxed">
                  Complaints need <code>lat</code>/<code>lng</code> (or a geocodable address)
                  to appear on the map. The feed still shows all complaints.
                </p>
                {error && (
                  <p className="text-red-400 text-xs mt-3 max-w-sm text-center whitespace-pre-wrap">
                    {error}
                  </p>
                )}
                <button
                  onClick={load}
                  className="mt-4 px-4 py-2 text-xs rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold"
                >
                  ↺ Retry
                </button>
              </MapPlaceholder>

            ) : (
              <MapContainer
                center={INDIA_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: 520, width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds markers={markers} />

                {markers.map((m) => {
                  const { dot } = getStatusStyle(m.status);
                  return (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={makePinIcon(dot)}>
                      <Popup maxWidth={240}>
                        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 13, lineHeight: 1.5 }}>
                          <p style={{ fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>
                            {m.title}
                          </p>
                          {m.complaintType !== "-" && (
                            <p style={{ color: "#64748b", marginBottom: 2, fontSize: 12 }}>
                              {m.complaintType}
                            </p>
                          )}
                          <p style={{ color: dot, fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
                            ● {m.status?.replace(/_/g, " ")}
                          </p>
                          {m.address && (
                            <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>
                              📍 {m.address}
                            </p>
                          )}
                          {m.createdAt && (
                            <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>
                              🗓 {new Date(m.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          )}
                          {m.code && (
                            <a
                              href={`/t/${m.code}`}
                              style={{
                                color: "#0ea5e9",
                                fontSize: 12,
                                textDecoration: "underline",
                                display: "block",
                              }}
                            >
                              🔗 Track this complaint
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>

          {/* Legend + source */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {[
                { color: "bg-red-500",     label: "Pending"     },
                { color: "bg-amber-500",   label: "In Progress" },
                { color: "bg-emerald-500", label: "Resolved"    },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />
                  {label}
                </span>
              ))}
            </div>
            {source && (
              <p className="text-[10px] text-slate-700 truncate max-w-xs" title={source}>
                src: {source}
              </p>
            )}
          </div>
        </div>

        {/* ── FEED ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-3">

          {/* Search + filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="🔍  Search title, ID, type, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                         text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500
                         text-slate-200 transition-colors"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all",         label: "All"         },
                { key: "pending",     label: "Pending"     },
                { key: "in_progress", label: "In Progress" },
                { key: "resolved",    label: "Resolved"    },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors
                    ${filter === key
                      ? "bg-sky-600 border-sky-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed list */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1">
            <h2 className="font-semibold text-white mb-3">
              Complaints
              <span className="ml-2 text-xs text-slate-500 font-normal">
                ({displayFeed.length})
              </span>
            </h2>

            {/* Show error in feed if we have items (partial error) */}
            {error && allItems.length > 0 && (
              <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <p className="text-yellow-400 text-xs">⚠️ Loaded from fallback endpoint</p>
              </div>
            )}

            {/* Hard error — no items at all */}
            {error && allItems.length === 0 && !loading && (
              <div className="mb-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-xs whitespace-pre-wrap">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : displayFeed.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">
                  {search || filter !== "all"
                    ? "No complaints match your filter."
                    : "No complaints found."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 custom-scroll">
                {displayFeed.map((c) => {
                  const { dot, badge } = getStatusStyle(c.status);
                  return (
                    <div
                      key={c.id}
                      className="border border-slate-800 rounded-lg p-3
                                 hover:bg-slate-800/40 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-1 flex-1 text-slate-100">
                          {c.title}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border
                                         uppercase font-semibold shrink-0 ${badge}`}>
                          {c.status?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-400">{c.complaintType}</p>
                        {c.createdAt && (
                          <p className="text-[10px] text-slate-600">
                            {new Date(c.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>

                      {c.address && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          📍 {c.address}
                        </p>
                      )}

                      {c.code && (
                        <a
                          href={`/t/${c.code}`}
                          className="inline-block mt-1.5 text-xs text-sky-400
                                     hover:text-sky-300 underline underline-offset-2"
                        >
                          Track →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  const cls = {
    sky:     "text-sky-400     border-sky-900     bg-sky-900/20",
    red:     "text-red-400     border-red-900     bg-red-900/20",
    amber:   "text-amber-400   border-amber-900   bg-amber-900/20",
    emerald: "text-emerald-400 border-emerald-900 bg-emerald-900/20",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

function MapPlaceholder({ children }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: 520 }}>
      {children}
    </div>
  );
}

function Spinner({ size = 20 }) {
  return (
    <div
      style={{
        width:          size,
        height:         size,
        border:         `${Math.max(2, Math.round(size / 8))}px solid #1e293b`,
        borderTopColor: "#38bdf8",
        borderRadius:   "50%",
        animation:      "spin 0.7s linear infinite",   // ✅ keyframes in <style> above
        flexShrink:     0,
      }}
    />
  );
}