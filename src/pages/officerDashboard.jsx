// src/pages/OfficerDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import Spinner from "./loding.jsx";
import { API_URL } from "../api"; // ✅ use shared base URL

const OfficerDashboard = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | in_progress | closed
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyTexts, setReplyTexts] = useState({}); // { complaintId: text }

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
        const res = await fetch(
          `${API_URL}/api/officer/complaints?status=all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
      const res = await fetch(
        `${API_URL}/api/complaints/${complaintId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-center mt-10 text-red-600 font-medium">
        {error || "Please sign in as an officer to view this page."}
      </p>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Officer Dashboard</h1>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-2xl font-semibold">{counts.pending}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-500 text-sm">In Progress</p>
          <p className="text-2xl font-semibold">{counts.in_progress}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Closed</p>
          <p className="text-2xl font-semibold">{counts.closed}</p>
        </div>
      </div>

      {/* Complaints list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">Assigned Complaints</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">Filter by status:</span>
            <select
              className="border rounded px-2 py-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <p className="text-gray-600 text-sm">No complaints assigned.</p>
        ) : (
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Title</th>
                <th className="border px-2 py-1 text-left">Citizen</th>
                <th className="border px-2 py-1 text-left">Type</th>
                <th className="border px-2 py-1 text-left">Department</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Created At</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr key={c._id}>
                  <td className="border px-2 py-1">{c.title}</td>
                  <td className="border px-2 py-1">{c.name || "-"}</td>
                  <td className="border px-2 py-1">{c.complaintType}</td>
                  <td className="border px-2 py-1">{c.department || "-"}</td>
                  <td className="border px-2 py-1 capitalize">{c.status}</td>
                  <td className="border px-2 py-1">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1 space-y-1">
                    <select
                      className="border rounded px-1 py-0.5 text-xs w-full mb-1"
                      value={c.status}
                      onChange={(e) => updateStatus(c._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => openDetails(c)}
                      className="w-full px-1 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View & Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details panel */}
      {selectedComplaint && (
        <div className="mt-6 bg-white border rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold">
              {selectedComplaint.title}
            </h2>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Citizen:</span>{" "}
            {selectedComplaint.name || "-"}{" "}
            {selectedComplaint.phone ? `(${selectedComplaint.phone})` : ""}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Address:</span>{" "}
            {selectedComplaint.address}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Type:</span>{" "}
            {selectedComplaint.complaintType}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Department:</span>{" "}
            {selectedComplaint.department || "-"}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Date of Problem:</span>{" "}
            {selectedComplaint.dateOfProblem
              ? new Date(
                  selectedComplaint.dateOfProblem
                ).toLocaleDateString()
              : "N/A"}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Status:</span>{" "}
            <span className="capitalize">{selectedComplaint.status}</span>
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Handling Officer:</span>{" "}
            {selectedComplaint.assignedOfficerName || "-"}{" "}
            {selectedComplaint.assignedOfficerEmail
              ? `(${selectedComplaint.assignedOfficerEmail})`
              : ""}
          </p>

          <p className="text-sm text-gray-700 mt-2">
            <span className="font-medium">Description:</span>{" "}
            {selectedComplaint.description}
          </p>
          {selectedComplaint.additionalInfo && (
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Additional Info:</span>{" "}
              {selectedComplaint.additionalInfo}
            </p>
          )}

          {/* Images */}
          {selectedComplaint.imageUrls &&
            selectedComplaint.imageUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedComplaint.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={`${API_URL}${url}`} // ✅ updated
                    alt={`complaint-${i}`}
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}

          {/* Replies */}
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Conversation</h3>
            {(!selectedComplaint.replies ||
              selectedComplaint.replies.length === 0) && (
              <p className="text-sm text-gray-500">No replies yet.</p>
            )}
            {selectedComplaint.replies &&
              selectedComplaint.replies.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedComplaint.replies
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt) - new Date(b.createdAt)
                    )
                    .map((r, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">
                            {r.senderRole}
                          </span>
                          <span className="text-xs text-gray-500">
                            {r.createdAt
                              ? new Date(
                                  r.createdAt
                                ).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-gray-700">{r.message}</p>
                      </div>
                    ))}
                </div>
              )}
          </div>

          {/* Reply box */}
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-1">Reply to citizen</h3>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your response..."
              value={replyTexts[selectedComplaint._id] || ""}
              onChange={(e) =>
                handleReplyChange(selectedComplaint._id, e.target.value)
              }
            />
            <button
              onClick={() => handleReplySubmit(selectedComplaint._id)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"
            >
              Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
