// src/pages/track_com.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Spinner from "./loding.jsx";
import { API_URL } from "../api";
import {
  FaSearch, FaComments, FaImage, FaArrowLeft,
  FaShare, FaCopy, FaExternalLinkAlt, FaRedo,
  FaFilter, FaMapMarkerAlt, FaClock, FaUser,
  FaChevronDown, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaTools,
} from "react-icons/fa";

// ── Normalize complaint ────────────────────────────────────────────────────
function normalizeComplaint(raw, codeFromUrl = "") {
  const c = raw?.complaint || raw || {};
  const code =
    c.ticketId || c.ticket || c.complaintNumber ||
    c.publicToken || codeFromUrl || c._id || "";

  return {
    _id:                  c._id || code,
    code,
    title:                c.title || c.subject || "(no title)",
    description:          c.description || "",
    complaintType:        c.complaintType || c.category || "-",
    department:           c.department || "",
    status:               c.status || "pending",
    priority:             c.priority || "",
    createdAt:            c.createdAt || null,
    updatedAt:            c.updatedAt || null,
    address:
      c.address || c.location?.address ||
      c.area || c.locality || c.landmark || "",
    name:                 c.name || "",
    phone:                c.phone || "",
    assignedOfficerName:  c.assignedOfficerName || c.assignedTo || "",
    assignedOfficerEmail: c.assignedOfficerEmail || "",
    officerNote:          c.officerNote || c.adminNote || c.remarks || "",
    imageUrls:            Array.isArray(c.imageUrls) ? c.imageUrls : [],
    replies:              Array.isArray(c.replies) ? c.replies : [],
    statusHistory:        Array.isArray(c.statusHistory)
      ? c.statusHistory
      : Array.isArray(c.history) ? c.history : [],
  };
}

 
// ── Endpoints to try ───────────────────────────────────────────────────────
const PUBLIC_URLS = (code) => [
  `${API_URL}/api/public/complaints/${encodeURIComponent(code)}`,
];

async function fetchByCodePublic(code) {
  for (const url of PUBLIC_URLS(code)) {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });

    // treat 401/403 same as "not found" (never mention login)
    if ([401, 403, 404].includes(res.status)) continue;
    if (!res.ok) continue;

    const data = await res.json().catch(() => ({}));
    const c = data.complaint || data;
    if (c) return normalizeComplaint(c, code);
  }

  throw new Error("No complaint found with that ID. Please check and try again.");
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:       { label: "Pending",     icon: FaHourglassHalf, color: "text-red-400",     bg: "bg-red-900/20",     border: "border-red-800",     dot: "#ef4444", step: 0 },
  in_progress:   { label: "In Progress", icon: FaTools,         color: "text-amber-400",   bg: "bg-amber-900/20",   border: "border-amber-800",   dot: "#f59e0b", step: 1 },
  "in-progress": { label: "In Progress", icon: FaTools,         color: "text-amber-400",   bg: "bg-amber-900/20",   border: "border-amber-800",   dot: "#f59e0b", step: 1 },
  resolved:      { label: "Resolved",    icon: FaCheckCircle,   color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-800", dot: "#10b981", step: 2 },
  closed:        { label: "Closed",      icon: FaCheckCircle,   color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-800", dot: "#10b981", step: 2 },
  rejected:      { label: "Rejected",    icon: FaTimesCircle,   color: "text-slate-400",   bg: "bg-slate-800/40",   border: "border-slate-700",   dot: "#6b7280", step: -1 },
};

function getStatusCfg(s = "pending") {
  return STATUS_CFG[s?.toLowerCase()] || STATUS_CFG.pending;
}

const STEPS = ["Submitted", "In Progress", "Resolved"];

// ── Priority badge ─────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  high:   "bg-red-900/30 text-red-400 border-red-700",
  medium: "bg-amber-900/30 text-amber-400 border-amber-700",
  low:    "bg-slate-800 text-slate-400 border-slate-700",
};

// ── Small shared components ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = getStatusCfg(status);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                      text-xs border uppercase font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-0.5 flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </p>
      <p className="text-slate-200 text-sm">{value}</p>
    </div>
  );
}

// ── Progress Stepper ───────────────────────────────────────────────────────
function Stepper({ step }) {
  if (step < 0) return null;
  return (
    <div className="flex items-center px-1">
      {STEPS.map((s, idx) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-xs font-bold transition-all duration-300"
              style={{
                background: idx <= step ? "#2563eb" : "#1e293b",
                color:      idx <= step ? "#fff"    : "#475569",
                boxShadow:  idx === step ? "0 0 0 4px rgba(37,99,235,0.25)" : "none",
              }}
            >
              {idx < step ? "✓" : idx + 1}
            </div>
            <span
              className="text-[10px] mt-1 font-semibold whitespace-nowrap"
              style={{ color: idx <= step ? "#60a5fa" : "#475569" }}
            >
              {s}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-1 mb-4 rounded transition-all duration-500"
              style={{ background: idx < step ? "#2563eb" : "#1e293b" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Status Timeline ────────────────────────────────────────────────────────
function Timeline({ history, createdAt }) {
  if (!history?.length) {
    return (
      <p className="text-sm text-slate-500">
        Created on {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {history.map((h, i) => {
        const cfg = getStatusCfg(h.status);
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex gap-3 items-start">
            <div className="mt-0.5 shrink-0">
              <Icon size={14} className={cfg.color} />
            </div>
            <div className="text-sm flex-1">
              <span className={`capitalize font-semibold ${cfg.color}`}>
                {(h.status || "").replace(/_/g, " ")}
              </span>
              {h.note && (
                <span className="text-slate-400"> — {h.note}</span>
              )}
              <div className="text-xs text-slate-600 mt-0.5">
                {h.at ? new Date(h.at).toLocaleString() : ""}
                {h.by ? ` • by ${h.by}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Complaint Detail Panel (shared for both public + my complaints) ─────────
function ComplaintDetail({
  complaint,
  isOwner = false,
  replyText = "",
  onReplyChange,
  onReplySubmit,
  onBack,
  sending = false,
}) {
  const cfg = getStatusCfg(complaint.status);
  const shareLink = complaint.code
    ? `${window.location.origin}/t/${encodeURIComponent(complaint.code)}`
    : "";

  function copyToast(text, label) {
    navigator.clipboard.writeText(text).then(() =>
      toast.success(`${label} copied`, { theme: "dark" })
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

      {/* ── Sticky header ── */}
      <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-4
                       flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10`}>
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400
                         hover:text-white transition-colors lg:hidden">
              <FaArrowLeft size={14} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-white text-base line-clamp-1">
              {complaint.title}
            </h2>
            <span className="text-xs text-sky-400 font-mono">
              #{complaint.code || complaint._id}
            </span>
          </div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      {/* ── Progress stepper ── */}
      <div className="px-5 pt-4 pb-1">
        <Stepper step={cfg.step} />
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Category"  value={complaint.complaintType} icon={FaFilter}        />
          <InfoRow label="Submitted" icon={FaClock}
            value={complaint.createdAt
              ? new Date(complaint.createdAt).toLocaleString("en-IN") : "—"}
          />
          {complaint.updatedAt && (
            <InfoRow label="Last Updated" icon={FaClock}
              value={new Date(complaint.updatedAt).toLocaleString("en-IN")}
            />
          )}
          {complaint.address && (
            <InfoRow label="Address" value={complaint.address} icon={FaMapMarkerAlt} />
          )}
          {complaint.assignedOfficerName && (
            <InfoRow
              label="Assigned Officer" icon={FaUser}
              value={`${complaint.assignedOfficerName}${
                complaint.assignedOfficerEmail ? ` (${complaint.assignedOfficerEmail})` : ""
              }`}
            />
          )}
          {complaint.priority && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-0.5">
                Priority
              </p>
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full border font-bold
                ${PRIORITY_COLORS[complaint.priority?.toLowerCase()] || PRIORITY_COLORS.low}`}>
                {complaint.priority}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {complaint.description && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
              📝 Description
            </p>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800
                            text-slate-300 text-sm leading-relaxed">
              {complaint.description}
            </div>
          </div>
        )}

        {/* Officer note */}
        {complaint.officerNote && (
          <div>
            <p className="text-xs text-sky-500 uppercase tracking-wide font-semibold mb-1">
              💬 Officer's Note
            </p>
            <div className="bg-sky-900/20 rounded-xl p-4 border border-sky-900
                            text-sky-200 text-sm leading-relaxed">
              {complaint.officerNote}
            </div>
          </div>
        )}

        {/* Status timeline */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
            📋 Status Timeline
          </p>
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
            <Timeline history={complaint.statusHistory} createdAt={complaint.createdAt} />
          </div>
        </div>

        {/* Images */}
        {complaint.imageUrls.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
              🖼 Images
            </p>
            <div className="flex flex-wrap gap-2">
              {complaint.imageUrls.map((u, i) => {
                const src = u.startsWith("http") ? u : `${API_URL}${u}`;
                return (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src}
                      alt={`evidence-${i + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-700
                                 hover:border-sky-500 transition-colors cursor-zoom-in"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversation (only for complaint owner) */}
        {isOwner && (
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <FaComments className="text-sky-500" />
              <h3 className="font-semibold text-white">Conversation</h3>
              {complaint.replies.length > 0 && (
                <span className="text-xs bg-sky-900/30 text-sky-400 border border-sky-900
                                 rounded-full px-2 py-0.5">
                  {complaint.replies.length}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-3 custom-scroll">
              {complaint.replies.length === 0 ? (
                <div className="text-center py-6 bg-slate-800/30 rounded-xl border border-slate-800">
                  <FaComments size={24} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">No messages yet.</p>
                </div>
              ) : (
                complaint.replies.map((r, idx) => {
                  const isOfficer = r.senderRole === "officer" || r.senderRole === "admin";
                  return (
                    <div
                      key={idx}
                      className={`text-sm p-3 rounded-xl border ${
                        isOfficer
                          ? "bg-sky-900/20 border-sky-800/50 ml-6"
                          : "bg-slate-800 border-slate-700 mr-6"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold uppercase ${
                          isOfficer ? "text-sky-400" : "text-slate-400"
                        }`}>
                          {isOfficer ? "🏛 Officer" : "👤 You"}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply input */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3">
              <textarea
                rows={2}
                className="w-full bg-transparent text-sm text-slate-200
                           placeholder-slate-600 focus:outline-none resize-none"
                placeholder="Write a message to the officer…"
                value={replyText}
                onChange={(e) => onReplyChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) onReplySubmit();
                }}
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                <span className="text-[10px] text-slate-700">Ctrl+Enter to send</span>
                <button
                  onClick={onReplySubmit}
                  disabled={sending || !replyText?.trim()}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40
                             disabled:cursor-not-allowed text-white text-xs font-bold
                             uppercase tracking-wide rounded-lg transition-colors
                             flex items-center gap-1.5"
                >
                  {sending ? <><Spinner size={10} /> Sending…</> : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share controls */}
        {complaint.code && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
            <button
              onClick={() => copyToast(complaint.code, "Complaint ID")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                         bg-slate-800 border border-slate-700 hover:bg-slate-700
                         text-slate-300 transition-colors"
            >
              <FaCopy size={10} /> Copy ID
            </button>
            {shareLink && (
              <>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                             bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                >
                  <FaExternalLinkAlt size={10} /> Open Link
                </a>
                <button
                  onClick={() => copyToast(shareLink, "Tracking link")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                             bg-slate-800 border border-slate-700 hover:bg-slate-700
                             text-slate-300 transition-colors"
                >
                  <FaShare size={10} /> Copy Link
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════
const Track = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { ticket: ticketFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Public search ─────────────────────────────────────────────────────
  const inputRef = useRef(null);
  const [code,            setCode]            = useState(ticketFromPath || searchParams.get("code") || "");
  const [publicLoading,   setPublicLoading]   = useState(false);
  const [publicErr,       setPublicErr]       = useState("");
  const [publicComplaint, setPublicComplaint] = useState(null);

  // ── My Complaints ──────────────────────────────────────────────────────
  const [complaints,     setComplaints]     = useState([]);
  const [listLoading,    setListLoading]    = useState(true);
  const [listError,      setListError]      = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [selectedId,     setSelectedId]     = useState(null);
  const [replyTexts,     setReplyTexts]     = useState({});
  const [sendingReply,   setSendingReply]   = useState(false);

  const selectedComplaint = useMemo(
    () => complaints.find((c) => c._id === selectedId) || null,
    [complaints, selectedId]
  );

  // ── Fetch my complaints ────────────────────────────────────────────────
  const loadMyComplaints = useCallback(async () => {
    if (!isLoaded || !isSignedIn) { setListLoading(false); return; }
    setListLoading(true);
    setListError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : data.complaints || data.items || [];
      setComplaints(arr.map((c) => normalizeComplaint(c)));
    } catch (e) {
      setListError(e.message || "Failed to load complaints");
    } finally {
      setListLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => { loadMyComplaints(); }, [loadMyComplaints]);

  // ── Auto-search from URL param ─────────────────────────────────────────
  useEffect(() => {
    const c = ticketFromPath || searchParams.get("code");
    if (!c) return;
    setCode(c);
    doPublicSearch(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketFromPath]);

  // ── Public search ──────────────────────────────────────────────────────
  const sanitize = (v) => (v || "").toString().trim().replace(/^#/, "").replace(/\s+/g, "");

  async function doPublicSearch(value) {
    const clean = sanitize(value ?? code);
    if (!clean) { inputRef.current?.focus(); return; }

    setPublicLoading(true);
    setPublicErr("");
    setPublicComplaint(null);

    try {
     const result = await fetchByCodePublic(clean);
      setPublicComplaint(result);
      // sync URL
      if (clean !== ticketFromPath) navigate(`/t/${clean}`, { replace: true });
    } catch (e) {
  setPublicErr("No complaint found with that ID. Please check and try again.");
} finally {
  setPublicLoading(false);
}
  }

  function handleReset() {
    setPublicComplaint(null);
    setPublicErr("");
    setCode("");
    navigate("/Track", { replace: true });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Reply ──────────────────────────────────────────────────────────────
  async function handleReplySubmit(complaintId) {
    const message = (replyTexts[complaintId] || "").trim();
    if (!message) return toast.error("Message cannot be empty");
    setSendingReply(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/complaints/${complaintId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const updated = normalizeComplaint(data.complaint || data);
      toast.success("Message sent ✓", { theme: "dark" });
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? updated : c))
      );
      setReplyTexts((p) => ({ ...p, [complaintId]: "" }));
    } catch (e) {
      toast.error(e.message || "Failed to send message", { theme: "dark" });
    } finally {
      setSendingReply(false);
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────
  const filteredComplaints = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return complaints.filter((c) => {
      const matchStatus =
        statusFilter === "all" ||
        c.status?.toLowerCase() === statusFilter ||
        (statusFilter === "in_progress" && c.status?.toLowerCase() === "in-progress");
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)  ||
        c.complaintType.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [complaints, statusFilter, searchQuery]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      complaints.length,
    pending:    complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => ["in_progress","in-progress"].includes(c.status)).length,
    resolved:   complaints.filter((c) => ["resolved","closed"].includes(c.status)).length,
  }), [complaints]);

  // ── Auth loading guard ─────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 pb-16"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .custom-scroll::-webkit-scrollbar       { width:4px; }
        .custom-scroll::-webkit-scrollbar-track { background:transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-10">

        {/* ══ PUBLIC SEARCH ════════════════════════════════════════════════ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <FaSearch className="text-sky-500" />
            <h1 className="text-xl font-bold">Track by Complaint ID</h1>
            <span className="ml-2 text-xs text-emerald-400 border border-emerald-800
                             bg-emerald-900/20 px-2 py-0.5 rounded-full font-semibold">
              No login required
            </span>
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); doPublicSearch(); }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                🎫
              </span>
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl
                           pl-9 pr-4 py-2.5 text-sm font-mono tracking-wide
                           placeholder-slate-600 text-slate-100
                           focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="e.g. 6a270fefae76031652ac47c667"
              />
            </div>
            <button
              type="submit"
              disabled={publicLoading || !sanitize(code)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40
                         disabled:cursor-not-allowed text-white rounded-xl text-sm
                         font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {publicLoading
                ? <><SpinnerInline /> Searching…</>
                : <><FaSearch size={12} /> Track</>}
            </button>
            {publicComplaint && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800
                           text-slate-300 rounded-xl text-sm font-semibold
                           transition-colors flex items-center gap-2"
              >
                <FaRedo size={11} /> Reset
              </button>
            )}
          </form>

          {publicErr && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <p className="text-red-400 text-sm">🚫 {publicErr}</p>
            </div>
          )}

          {publicLoading && !publicComplaint && (
            <div className="mt-6 flex justify-center py-10">
              <SpinnerInline size={32} />
            </div>
          )}

          {publicComplaint && !publicLoading && (
            <div className="mt-6">
              <ComplaintDetail complaint={publicComplaint} isOwner={false} />
            </div>
          )}

          {/* How-to hint (shown before first search) */}
          {!publicComplaint && !publicErr && !publicLoading && !ticketFromPath && (
            <div className="mt-5 bg-slate-800/30 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
                How it works
              </p>
              <ol className="space-y-1.5 text-sm text-slate-400">
                {[
                  "File a complaint through the portal",
                  "Receive your unique ticket ID via email",
                  "Enter the ID above to track status instantly",
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700
                                     text-xs flex items-center justify-center text-slate-500 shrink-0">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* ══ MY COMPLAINTS (signed-in only) ═══════════════════════════════ */}
        {isSignedIn && (
          <section>

            {/* Section header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                My Complaints
                {!listLoading && (
                  <span className="text-sm text-slate-500 font-normal">
                    ({complaints.length})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadMyComplaints}
                  disabled={listLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                             border border-slate-700 hover:bg-slate-800 text-slate-400
                             disabled:opacity-40 transition-colors"
                >
                  <FaRedo size={10} className={listLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats row */}
            {!listLoading && complaints.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Total",       value: stats.total,      cls: "text-sky-400     border-sky-900     bg-sky-900/10"     },
                  { label: "Pending",     value: stats.pending,    cls: "text-red-400     border-red-900     bg-red-900/10"     },
                  { label: "In Progress", value: stats.inProgress, cls: "text-amber-400   border-amber-900   bg-amber-900/10"   },
                  { label: "Resolved",    value: stats.resolved,   cls: "text-emerald-400 border-emerald-900 bg-emerald-900/10" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`rounded-xl border px-4 py-3 ${cls}`}>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs opacity-70 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            {!listLoading && complaints.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4 bg-slate-900 border border-slate-800
                              rounded-xl p-4">
                <div className="relative flex-1 min-w-40">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                  <input
                    type="text"
                    placeholder="Search complaints…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg
                               pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600
                               focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all",         label: "All"         },
                    { key: "pending",     label: "Pending"     },
                    { key: "in_progress", label: "In Progress" },
                    { key: "closed",      label: "Resolved"    },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-colors
                        ${statusFilter === key
                          ? "bg-sky-600 border-sky-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading / error / empty */}
            {listLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <Spinner />
                <p className="text-slate-500 text-sm mt-3">Loading your complaints…</p>
              </div>
            ) : listError ? (
              <div className="bg-slate-900 border border-red-900 rounded-2xl p-6 text-center">
                <p className="text-red-400 mb-3">{listError}</p>
                <button
                  onClick={loadMyComplaints}
                  className="text-xs px-4 py-2 bg-red-900/30 border border-red-800
                             text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                >
                  <FaRedo size={10} className="inline mr-1" /> Retry
                </button>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                <FaComments size={32} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-400 font-semibold">No complaints yet</p>
                <p className="text-slate-600 text-sm mt-1">
                  File a complaint and it will appear here.
                </p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-400">No complaints match your filter.</p>
              </div>
            ) : (
              /* ── Split layout ── */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* List panel */}
                <div className={`lg:col-span-5 space-y-3
                  ${selectedId ? "hidden lg:block" : "block"}`}>
                  {filteredComplaints.map((c) => {
                    const cfg = getStatusCfg(c.status);
                    const isSelected = selectedId === c._id;
                    return (
                      <div
                        key={c._id}
                        onClick={() => setSelectedId(c._id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all
                          ${isSelected
                            ? "bg-slate-800 border-sky-500 shadow-lg shadow-sky-900/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`font-semibold text-sm line-clamp-1 flex-1
                            ${isSelected ? "text-sky-400" : "text-white"}`}>
                            {c.title}
                          </p>
                          <StatusBadge status={c.status} />
                        </div>

                        <p className="text-[11px] text-sky-500 font-mono mb-1">
                          #{c.code || c._id}
                        </p>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {c.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px]
                                        text-slate-600 border-t border-slate-800/50 pt-2">
                          <span className="flex items-center gap-1">
                            <FaClock size={9} />
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : ""}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {c.complaintType}
                            {c.imageUrls?.length > 0 && (
                              <FaImage size={9} className="text-sky-600" />
                            )}
                            {c.replies?.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <FaComments size={9} className="text-sky-600" />
                                {c.replies.length}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detail panel */}
                <div className={`lg:col-span-7 ${!selectedId ? "hidden lg:block" : "block"}`}>
                  {!selectedComplaint ? (
                    <div className="h-full min-h-80 bg-slate-900 border border-slate-800
                                    rounded-2xl flex flex-col items-center justify-center
                                    text-center p-8">
                      <FaSearch size={36} className="text-slate-700 mb-3" />
                      <p className="text-slate-400 font-semibold">Select a complaint</p>
                      <p className="text-slate-600 text-sm mt-1">
                        Click any complaint on the left to view details
                      </p>
                    </div>
                  ) : (
                    <ComplaintDetail
                      complaint={selectedComplaint}
                      isOwner={true}
                      replyText={replyTexts[selectedComplaint._id] || ""}
                      onReplyChange={(text) =>
                        setReplyTexts((p) => ({ ...p, [selectedComplaint._id]: text }))
                      }
                      onReplySubmit={() => handleReplySubmit(selectedComplaint._id)}
                      onBack={() => setSelectedId(null)}
                      sending={sendingReply}
                    />
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Not signed in hint */}
        {!isSignedIn && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm">
              <span className="text-sky-400 font-semibold">Sign in</span> to view and manage
              your submitted complaints with full conversation history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;

// ── Inline spinner (no import needed) ─────────────────────────────────────
function SpinnerInline({ size = 16 }) {
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
        display:        "inline-block",
      }}
    />
  );
}