// src/pages/OfficerDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import Spinner from "./loding.jsx";
import { FaClipboardList, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa";
import { API_URL } from "../api";

const getCode = (c) => c?.ticket || c?.complaintNumber || c?.publicToken || c?._id || "-";

const OfficerDashboard = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setError("Please sign in as an officer.");
      return;
    }

    const fetchComplaints = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/officer/complaints?status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load complaints");
        }
        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isLoaded, isSignedIn, getToken]);

  const counts = useMemo(() => {
    const base = { pending: 0, in_progress: 0, closed: 0 };
    complaints.forEach((c) => {
      if (base[c.status] !== undefined) base[c.status]++;
    });
    return base;
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "all") return complaints;
    return complaints.filter((c) => c.status === statusFilter);
  }, [complaints, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, assignToSelf: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }
      const data = await res.json();
      toast.success("Status updated");
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? data.complaint : c))
      );
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint(data.complaint);
      }
    } catch (err) {
      toast.error(err.message || "Error updating status");
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyTexts((prev) => ({ ...prev, [id]: value }));
  };

  const handleReplySubmit = async (complaintId) => {
    const message = (replyTexts[complaintId] || "").trim();
    if (!message) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/complaints/${complaintId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send reply");
      }
      const data = await res.json();
      toast.success("Reply sent");

      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? data.complaint : c))
      );
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(data.complaint);
      }
      setReplyTexts((prev) => ({ ...prev, [complaintId]: "" }));
    } catch (err) {
      toast.error(err.message || "Error sending reply");
    }
  };

  const openDetails = (complaint) => setSelectedComplaint(complaint);

  const cardClass = "bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex items-center gap-4";
  const selectClass = "bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-sky-500";
  const th = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900 border-b border-slate-800 whitespace-nowrap";
  const td = "px-4 py-3 text-sm text-slate-300 border-b border-slate-800 whitespace-nowrap";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <p className="text-red-400 font-medium border border-red-900 bg-red-900/20 px-6 py-4 rounded-lg">
          {error || "Please sign in as an officer to view this page."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Officer Dashboard
          </h1>
          <span className="text-slate-500 text-sm">Manage your assigned complaints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={cardClass}>
            <div className="p-3 bg-amber-900/30 rounded-full text-amber-500"><FaClock size={24} /></div>
            <div><p className="text-slate-400 text-sm">Pending</p><p className="text-2xl font-bold text-white">{counts.pending}</p></div>
          </div>
          <div className={cardClass}>
            <div className="p-3 bg-blue-900/30 rounded-full text-blue-500"><FaClipboardList size={24} /></div>
            <div><p className="text-slate-400 text-sm">In Progress</p><p className="text-2xl font-bold text-white">{counts.in_progress}</p></div>
          </div>
          <div className={cardClass}>
            <div className="p-3 bg-emerald-900/30 rounded-full text-emerald-500"><FaCheckCircle size={24} /></div>
            <div><p className="text-slate-400 text-sm">Closed</p><p className="text-2xl font-bold text-white">{counts.closed}</p></div>
          </div>
        </div>

        {/* Complaints table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-t-xl border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Assigned Complaints</h2>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm hidden sm:inline">Status:</span>
              <select className={`${selectClass} py-2`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-b-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              {filteredComplaints.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No complaints assigned matching criteria.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-800">
                  <thead>
                    <tr>
                      <th className={th}>Complaint #</th>
                      <th className={th}>Title</th>
                      <th className={th}>Citizen</th>
                      <th className={th}>Type</th>
                      <th className={th}>Department</th>
                      <th className={th}>Status</th>
                      <th className={th}>Created At</th>
                      <th className={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredComplaints.map((c) => {
                      const code = getCode(c);
                      return (
                        <tr key={c._id} className="hover:bg-slate-800/50 transition-colors">
                          <td className={td}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{code}</span>
                              {code !== "-" && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(code)}
                                  className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </td>
                          <td className={td}>
                            <div className="font-medium text-white truncate max-w-[180px]" title={c.title}>
                              {c.title}
                            </div>
                          </td>
                          <td className={td}>{c.name || "Anonymous"}</td>
                          <td className={td}>
                            <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                              {c.complaintType}
                            </span>
                          </td>
                          <td className={td}>{c.department || "-"}</td>
                          <td className={td}>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${
                                c.status === "closed"
                                  ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                                  : c.status === "in_progress"
                                  ? "bg-amber-900/20 text-amber-400 border-amber-800"
                                  : "bg-red-900/20 text-red-400 border-red-800"
                              }`}
                            >
                              {c.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className={td}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className={td}>
                            <div className="flex flex-col gap-2 min-w-[140px]">
                              <select
                                className={`${selectClass} w-full`}
                                value={c.status}
                                onChange={(e) => updateStatus(c._id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                              </select>
                              <button
                                onClick={() => openDetails(c)}
                                className="px-2 py-1 text-xs bg-sky-600 text-white rounded hover:bg-sky-500 transition-colors"
                              >
                                View & Respond
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
                <div>
                  <h2 className="text-lg font-bold text-white truncate pr-4">{selectedComplaint.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    Complaint #: <span className="font-mono text-sky-400">{getCode(selectedComplaint)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(getCode(selectedComplaint))}
                      className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-white">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Citizen:</span> <span className="text-slate-200">{selectedComplaint.name || "Anonymous"}</span></div>
                  <div><span className="text-slate-500 block">Phone:</span> <span className="text-slate-200">{selectedComplaint.phone || "N/A"}</span></div>
                  <div><span className="text-slate-500 block">Address:</span> <span className="text-slate-200">{selectedComplaint.address}</span></div>
                  <div><span className="text-slate-500 block">Type:</span> <span className="text-slate-200">{selectedComplaint.complaintType}</span></div>
                  <div><span className="text-slate-500 block">Date of Problem:</span> <span className="text-slate-200">{selectedComplaint.dateOfProblem ? new Date(selectedComplaint.dateOfProblem).toLocaleDateString() : "N/A"}</span></div>
                  <div><span className="text-slate-500 block">Status:</span> <span className="text-sky-400 font-semibold capitalize">{selectedComplaint.status.replace("_"," ")}</span></div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Description</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedComplaint.description}</p>
                  {selectedComplaint.additionalInfo && (
                    <p className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-800">Note: {selectedComplaint.additionalInfo}</p>
                  )}
                </div>

                {selectedComplaint.imageUrls?.length > 0 && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wider block mb-2">Attachments</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedComplaint.imageUrls.map((url, i) => (
                        <a key={i} href={`${API_URL}${url}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${API_URL}${url}`}
                            alt={`evidence-${i}`}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-700 hover:border-sky-500 transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation */}
                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-md font-semibold text-white mb-3">Conversation</h3>
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                    {(!selectedComplaint.replies || selectedComplaint.replies.length === 0) ? (
                      <p className="text-sm text-slate-600 italic">No messages yet.</p>
                    ) : (
                      selectedComplaint.replies.map((r, idx) => (
                        <div key={idx} className={`text-sm p-3 rounded-lg border ${
                          r.senderRole === "officer"
                            ? "bg-sky-900/20 border-sky-800/50 ml-8"
                            : "bg-slate-800 border-slate-700 mr-8"
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-bold uppercase ${
                              r.senderRole === "officer" ? "text-sky-400" : "text-slate-400"
                            }`}>
                              {r.senderRole}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                            </span>
                          </div>
                          <p className="text-slate-300">{r.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <textarea
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="Write a reply to the citizen..."
                      value={replyTexts[selectedComplaint._id] || ""}
                      onChange={(e) => setReplyTexts((p) => ({ ...p, [selectedComplaint._id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleReplySubmit(selectedComplaint._id)}
                      className="self-end px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-500 transition-colors"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OfficerDashboard;