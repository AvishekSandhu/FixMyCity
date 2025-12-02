// src/pages/track_com.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import Spinner from "./loding.jsx";

const API_BASE = "http://localhost:3001";

const Track = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyTexts, setReplyTexts] = useState({}); // { [complaintId]: text }

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setError("Please sign in to view your complaints.");
      return;
    }

    const fetchComplaints = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/complaints/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load complaints");
        }

        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isLoaded, isSignedIn, getToken]);

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
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
        `${API_BASE}/api/complaints/${complaintId}/replies`,
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

      // Update list + selected complaint
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
        {error || "Please sign in to view your complaints."}
      </p>
    );
  }

  if (error && complaints.length === 0) {
    return (
      <p className="text-center mt-10 text-red-600 font-medium">
        {error}
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-4">
        My Complaints
      </h1>

      {/* Complaints list */}
      {complaints.length === 0 ? (
        <p className="text-center text-gray-600">
          You have not submitted any complaints yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    c.status === "closed"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : c.status === "in_progress"
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : "bg-red-100 text-red-700 border border-red-300"
                  }`}
                >
                  {c.status ? c.status.replace("_", " ") : "pending"}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Submitted: {new Date(c.createdAt).toLocaleString()}
              </p>

              <p className="text-sm text-gray-700 line-clamp-2">
                {c.description}
              </p>

              <p className="text-xs text-gray-600">
                <span className="font-medium">Type:</span> {c.complaintType}
              </p>

              <p className="text-xs text-gray-600">
                <span className="font-medium">Department:</span>{" "}
                {c.department || "-"}
              </p>

              <p className="text-xs text-gray-600">
                <span className="font-medium">Handling Officer:</span>{" "}
                {c.assignedOfficerName || "Not assigned yet"}{" "}
                {c.assignedOfficerEmail
                  ? `(${c.assignedOfficerEmail})`
                  : ""}
              </p>

              {/* Images */}
              {c.imageUrls && c.imageUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={`${API_BASE}${url}`}
                      alt={`complaint-${i}`}
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                  ))}
                </div>
              )}

              {/* Per-complaint track button */}
              <button
                onClick={() => openDetails(c)}
                className="mt-2 self-start px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-500 rounded hover:bg-blue-50"
              >
                View & Track
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detailed tracking + replies */}
      {selectedComplaint && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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

          <p className="text-xs text-gray-500 mb-1">
            Submitted:{" "}
            {new Date(selectedComplaint.createdAt).toLocaleString()}
          </p>

          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Status:</span>{" "}
            <span className="capitalize">
              {selectedComplaint.status
                ? selectedComplaint.status.replace("_", " ")
                : "pending"}
            </span>
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
            <span className="font-medium">Address:</span>{" "}
            {selectedComplaint.address}
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
            <span className="font-medium">Handling Officer:</span>{" "}
            {selectedComplaint.assignedOfficerName ||
              "Not assigned yet"}{" "}
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

          {/* Images in detail view */}
          {selectedComplaint.imageUrls &&
            selectedComplaint.imageUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedComplaint.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={`${API_BASE}${url}`}
                    alt={`complaint-${i}`}
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}

          {/* Replies (conversation) */}
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Conversation</h3>
            {(!selectedComplaint.replies ||
              selectedComplaint.replies.length === 0) && (
              <p className="text-sm text-gray-500">
                No replies yet. You can send a message to the officer once
                assigned.
              </p>
            )}
            {selectedComplaint.replies &&
              selectedComplaint.replies.length > 0 && (
                <div className="space-y-1 max-h-56 overflow-y-auto">
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

          {/* Reply box for citizen */}
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-1">
              Reply to officer / admin
            </h3>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your response or follow-up question..."
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

export default Track;