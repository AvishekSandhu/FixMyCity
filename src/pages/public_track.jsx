// src/pages/public_track.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL } from "../api";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    color:  "#ef4444",
    bg:     "bg-red-900/20",
    border: "border-red-800",
    text:   "text-red-400",
    icon:   "⏳",
    label:  "Pending",
    step:   0,
  },
  in_progress: {
    color:  "#f59e0b",
    bg:     "bg-amber-900/20",
    border: "border-amber-800",
    text:   "text-amber-400",
    icon:   "🔧",
    label:  "In Progress",
    step:   1,
  },
  "in-progress": {
    color:  "#f59e0b",
    bg:     "bg-amber-900/20",
    border: "border-amber-800",
    text:   "text-amber-400",
    icon:   "🔧",
    label:  "In Progress",
    step:   1,
  },
  resolved: {
    color:  "#10b981",
    bg:     "bg-emerald-900/20",
    border: "border-emerald-800",
    text:   "text-emerald-400",
    icon:   "✅",
    label:  "Resolved",
    step:   2,
  },
  closed: {
    color:  "#10b981",
    bg:     "bg-emerald-900/20",
    border: "border-emerald-800",
    text:   "text-emerald-400",
    icon:   "✅",
    label:  "Closed",
    step:   2,
  },
  rejected: {
    color:  "#6b7280",
    bg:     "bg-slate-800/40",
    border: "border-slate-700",
    text:   "text-slate-400",
    icon:   "❌",
    label:  "Rejected",
    step:   -1,
  },
};

function getStatusCfg(s = "pending") {
  return STATUS_CONFIG[s.toLowerCase()] || STATUS_CONFIG.pending;
}

const STEPS = ["Submitted", "In Progress", "Resolved"];

// ── Try multiple API endpoint shapes ───────────────────────────────────────
async function fetchComplaint(id) {
  const url = `${API_URL}/api/public/complaints/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return { complaint: null, error: "No complaint found with that ID. Please check and try again." };
    const json = await res.json();
    return { complaint: json.complaint || json, error: "" };
  } catch {
    return { complaint: null, error: "No complaint found with that ID. Please check and try again." };
  }
}

// ── Normalize fields from different backend shapes ─────────────────────────
function normalizeComplaint(d, fallbackId) {
  const code =
    d.ticketId || d.ticket || d.complaintNumber ||
    d.publicToken || d._id || fallbackId || "—";

  const status = d.status || "pending";

  return {
    code,
    status,
    title:         d.title       || d.subject      || "(no title)",
    description:   d.description || "",
    complaintType: d.complaintType || d.category   || "—",
    address:
      d.address || d.location?.address || d.area  || d.locality || "",
    createdAt:     d.createdAt   || null,
    updatedAt:     d.updatedAt   || null,
    assignedTo:    d.assignedOfficerName || d.assignedOfficer || d.assignedTo || d.officer || "",
    officerNote:   d.officerNote || d.adminNote    || d.remarks  || "",
    priority:      d.priority    || "",
    imageUrls:     Array.isArray(d.imageUrls) ? d.imageUrls : [],
    name:          d.name        || "",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
export default function PublicTrack() {
  // Support URL param  /t/:ticket  — pre-fills the input
  const { ticket: urlTicket } = useParams();
  const navigate = useNavigate();

  const [inputId,   setInputId]   = useState(urlTicket || "");
  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [searched,  setSearched]  = useState(false);
  const inputRef = useRef(null);

  // Auto-search if ticket is in URL
  useEffect(() => {
    if (urlTicket) doSearch(urlTicket);
    else inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTicket]);

  async function doSearch(id) {
    const clean = (id || inputId).trim();
    if (!clean) return;

    setLoading(true);
    setError("");
    setComplaint(null);
    setSearched(true);

    const { complaint: found, error: err } = await fetchComplaint(clean);

    if (found) {
      setComplaint(normalizeComplaint(found, clean));
      // Keep URL in sync without pushing history
      if (clean !== urlTicket) {
        navigate(`/t/${clean}`, { replace: true });
      }
    } else {
      setError(err);
    }

    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch(inputId);
  }

  function handleReset() {
    setComplaint(null);
    setError("");
    setSearched(false);
    setInputId("");
    navigate("/track", { replace: true });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const cfg         = complaint ? getStatusCfg(complaint.status) : null;
  const currentStep = cfg?.step ?? 0;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200 pb-16"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Track Your Complaint
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
          Enter your complaint / ticket ID below to get a real-time status
          update — <span className="text-sky-400 font-medium">no login required</span>.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">

        {/* ══ SEARCH BOX ═══════════════════════════════════════════════ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                🎫
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="e.g. TKT-2024-001234"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl
                           pl-10 pr-4 py-3 text-sm font-mono tracking-wide
                           placeholder-slate-600 text-slate-100
                           focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputId.trim()}
              className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-sm font-bold transition-colors whitespace-nowrap
                         flex items-center gap-2"
            >
              {loading ? <><Spinner size={14} /> Searching…</> : "Track →"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-3">
            💡 Your ticket ID was emailed to you when you filed the complaint
          </p>
        </div>

        {/* ══ ERROR ════════════════════════════════════════════════════ */}
        {!loading && error && (
          <div className="bg-red-900/20 border border-red-800 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-2">🚫</p>
            <p className="text-red-300 font-semibold">Complaint Not Found</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* ══ RESULT ═══════════════════════════════════════════════════ */}
        {!loading && complaint && cfg && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

            {/* ── Status banner ── */}
            <div className={`${cfg.bg} border-b ${cfg.border} px-6 py-4
                             flex flex-wrap items-center justify-between gap-4`}>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                  Current Status
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cfg.icon}</span>
                  <span className={`text-xl font-extrabold ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Ticket ID</p>
                <p className="font-mono font-bold text-sky-400 text-base tracking-wide">
                  {complaint.code}
                </p>
              </div>
            </div>

            {/* ── Progress stepper (skip for rejected) ── */}
            {cfg.step >= 0 && (
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center">
                  {STEPS.map((step, idx) => (
                    <React.Fragment key={step}>
                      {/* Circle */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center
                                     text-sm font-bold transition-all duration-300"
                          style={{
                            background: idx <= currentStep ? "#2563eb" : "#1e293b",
                            color:      idx <= currentStep ? "#fff"    : "#475569",
                            boxShadow:  idx === currentStep
                              ? "0 0 0 4px rgba(37,99,235,0.25)" : "none",
                          }}
                        >
                          {idx < currentStep ? "✓" : idx + 1}
                        </div>
                        <span
                          className="text-[10px] mt-1.5 font-semibold whitespace-nowrap"
                          style={{ color: idx <= currentStep ? "#60a5fa" : "#475569" }}
                        >
                          {step}
                        </span>
                      </div>

                      {/* Connector */}
                      {idx < STEPS.length - 1 && (
                        <div
                          className="flex-1 h-0.5 mx-1 mb-5 rounded transition-all duration-300"
                          style={{
                            background: idx < currentStep ? "#2563eb" : "#1e293b",
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* ── Detail cards grid ── */}
            <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <DetailCard icon="🗂" label="Category"   value={complaint.complaintType} />
              {complaint.name && (
                <DetailCard icon="👤" label="Complainant" value={complaint.name} />
              )}
              <DetailCard
                icon="📅"
                label="Submitted"
                value={
                  complaint.createdAt
                    ? new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "—"
                }
              />
              {complaint.updatedAt && (
                <DetailCard
                  icon="🔄"
                  label="Last Updated"
                  value={new Date(complaint.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                />
              )}

            
              {complaint.address && (
                <DetailCard icon="📍" label="Location" value={complaint.address} />
              )}
              <DetailCard
                icon="👷"
                label="Officer Assigned"
                value={complaint.assignedTo ? `Yes (${complaint.assignedTo})` : "No"}
              />
              {complaint.priority && (
                <DetailCard
                  icon="🚨"
                  label="Priority"
                  value={complaint.priority}
                  highlight={complaint.priority?.toLowerCase() === "high"}
                />
              )}
            </div>

            {/* ── Title ── */}
            <div className="px-6 mt-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
                Title
              </p>
              <p className="text-slate-100 font-semibold">{complaint.title}</p>
            </div>


            {/* ── Description ── */}
            {complaint.description && (
              <div className="px-6 mt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
                  📝 Description
                </p>
                <div className="bg-slate-800/50 rounded-xl p-4 text-slate-300 text-sm leading-relaxed border border-slate-800">
                  {complaint.description}
                </div>
              </div>
            )}

            {/* ── Officer note ── */}
            {complaint.officerNote && (
              <div className="px-6 mt-4">
                <p className="text-xs text-sky-500 uppercase tracking-wide font-semibold mb-1">
                  💬 Officer's Note
                </p>
                <div className="bg-sky-900/20 rounded-xl p-4 text-sky-200 text-sm
                                leading-relaxed border border-sky-900">
                  {complaint.officerNote}
                </div>
              </div>
            )}

            {/* ── Images ── */}
            {complaint.imageUrls.length > 0 && (
              <div className="px-6 mt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                  🖼 Images
                </p>
                <div className="flex flex-wrap gap-2">
                  {complaint.imageUrls.map((u, i) => (
                    <a
                      key={i}
                      href={u.startsWith("http") ? u : `${API_URL}${u}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={u.startsWith("http") ? u : `${API_URL}${u}`}
                        alt={`evidence-${i + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-slate-700
                                   hover:border-sky-500 transition-colors cursor-zoom-in"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="px-6 py-6 mt-4 border-t border-slate-800 flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300
                           hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                🔍 Search Another
              </button>
              <Link
                to="/creg"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500
                           text-white text-sm font-semibold transition-colors"
              >
                📝 File New Complaint
              </Link>
              <Link
                to="/explore"
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300
                           hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                🗺️ View Map
              </Link>
            </div>
          </div>
        )}

        {/* ══ HOW IT WORKS (shown before first search) ══════════════════ */}
        {!searched && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              ℹ️ How to track your complaint
            </h3>
            <ol className="space-y-3">
              {[
                ["📝", "File a complaint through our portal"],
                ["📧", "Receive a unique ticket ID via email"],
                ["🔍", "Enter the ticket ID in the box above"],
                ["📊", "View real-time status updates instantly"],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-xl shrink-0">{icon}</span>
                  {text}
                </li>
              ))}
            </ol>

            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap gap-3 justify-center">
              <Link
                to="/creg"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500
                           text-white text-sm font-semibold transition-colors"
              >
                📝 File a Complaint
              </Link>
              <Link
                to="/explore"
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300
                           hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                🗺️ Explore Map
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable small components ──────────────────────────────────────────────
function DetailCard({ icon, label, value, highlight = false }) {
  return (
    <div
      className={`rounded-xl p-3 border
        ${highlight
          ? "bg-red-900/20 border-red-800"
          : "bg-slate-800/40 border-slate-800"
        }`}
    >
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold ${highlight ? "text-red-400" : "text-slate-200"}`}>
        {icon} {value || "—"}
      </p>
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
        animation:      "spin 0.7s linear infinite",
        flexShrink:     0,
      }}
    />
  );
}