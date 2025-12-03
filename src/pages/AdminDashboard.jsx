// src/pages/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import Spinner from "./loding.jsx";
import { toast } from "react-toastify";
import { API_URL } from "../api"; // ✅ shared base URL

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // all | admin | officer | citizen
  const [complaintDateFilter, setComplaintDateFilter] = useState("all"); // all | 7 | 30

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("No token from Clerk.");

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [usersRes, summaryRes, complaintsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/users`, { headers }),
          fetch(`${API_URL}/api/admin/dashboard-summary`, { headers }),
          fetch(`${API_URL}/api/admin/complaints?status=all`, { headers }),
        ]);

        if (!usersRes.ok || !summaryRes.ok || !complaintsRes.ok) {
          throw new Error("Failed to load admin data");
        }

        const [usersData, summaryData, complaintsData] = await Promise.all([
          usersRes.json(),
          summaryRes.json(),
          complaintsRes.json(),
        ]);

        setUsers(usersData);
        setSummary(summaryData);
        setComplaints(complaintsData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isSignedIn, getToken]);

  // Officer list for assignment
  const officerOptions = useMemo(
    () => users.filter((u) => u.role === "officer"),
    [users]
  );

  // Complaints filtered by recency
  const filteredComplaints = useMemo(() => {
    if (complaintDateFilter === "all") return complaints;
    const days = parseInt(complaintDateFilter, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return complaints.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return created >= cutoff;
    });
  }, [complaints, complaintDateFilter]);

  // Users filtered by role
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === "all") return users;
    return users.filter((u) => u.role === userRoleFilter);
  }, [users, userRoleFilter]);

  const updateStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
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
    } catch (err) {
      toast.error(err.message || "Error updating status");
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to change role");
      }
      const updated = await res.json();
      toast.success("User role updated");
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u))
      );
    } catch (err) {
      toast.error(err.message || "Error updating user role");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete user");
      }
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toast.error(err.message || "Error deleting user");
    }
  };

  const assignComplaintToOfficer = async (complaintId, officerId) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/api/admin/complaints/${complaintId}/assign-officer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ officerId }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to assign officer");
      }
      const data = await res.json();
      toast.success("Officer assigned");
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? data.complaint : c))
      );
    } catch (err) {
      toast.error(err.message || "Error assigning officer");
    }
  };

  const updateComplaintDepartment = async (complaintId, department) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ department }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update department");
      }
      const data = await res.json();
      toast.success("Department updated");
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? data.complaint : c))
      );
    } catch (err) {
      toast.error(err.message || "Error updating department");
    }
  };

  const deleteComplaint = async (complaintId) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/api/admin/complaints/${complaintId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete complaint");
      }
      toast.success("Complaint deleted");
      setComplaints((prev) => prev.filter((c) => c._id !== complaintId));
    } catch (err) {
      toast.error(err.message || "Error deleting complaint");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Complaints</p>
            <p className="text-2xl font-semibold">
              {summary.counts.pending ?? 0}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Resolved (Closed)</p>
            <p className="text-2xl font-semibold">
              {summary.counts.closed ?? 0}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Complaints</p>
            <p className="text-2xl font-semibold">
              {summary.counts.total ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Recent complaints */}
      {summary && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Recent Complaints</h2>
          {summary.recentComplaints.length === 0 ? (
            <p className="text-gray-600 text-sm">No complaints yet.</p>
          ) : (
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="border px-2 py-1 text-left">Title</th>
                  <th className="border px-2 py-1 text-left">Type</th>
                  <th className="border px-2 py-1 text-left">Status</th>
                  <th className="border px-2 py-1 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentComplaints.map((c) => (
                  <tr key={c._id} className="text-sm">
                    <td className="border px-2 py-1">{c.title}</td>
                    <td className="border px-2 py-1">{c.complaintType}</td>
                    <td className="border px-2 py-1 capitalize">{c.status}</td>
                    <td className="border px-2 py-1">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All complaints with filters and controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">All Complaints</h2>

          {/* Recent filter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">Show:</span>
            <select
              className="border rounded px-2 py-1"
              value={complaintDateFilter}
              onChange={(e) => setComplaintDateFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <p className="text-gray-600 text-sm">No complaints found.</p>
        ) : (
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Title</th>
                <th className="border px-2 py-1 text-left">Citizen Name</th>
                <th className="border px-2 py-1 text-left">Type</th>
                <th className="border px-2 py-1 text-left">Department</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Officer</th>
                <th className="border px-2 py-1 text-left">Assign To</th>
                <th className="border px-2 py-1 text-left">Images</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr key={c._id}>
                  <td className="border px-2 py-1">{c.title}</td>
                  <td className="border px-2 py-1">{c.name || "-"}</td>
                  <td className="border px-2 py-1">{c.complaintType}</td>
                  {/* Department */}
                  <td className="border px-2 py-1">
                    <select
                      className="border rounded px-1 py-0.5 text-xs"
                      value={c.department || ""}
                      onChange={(e) =>
                        updateComplaintDepartment(c._id, e.target.value)
                      }
                    >
                      <option value="">Unassigned</option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Roads">Roads</option>
                      <option value="Garbage">Garbage</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Health">Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1 capitalize">{c.status}</td>
                  <td className="border px-2 py-1">
                    {c.assignedOfficerName || "-"}
                    {c.assignedOfficerEmail
                      ? ` (${c.assignedOfficerEmail})`
                      : ""}
                  </td>
                  {/* Assign officer */}
                  <td className="border px-2 py-1">
                    <select
                      className="border rounded px-1 py-0.5 text-xs"
                      value={c.assignedOfficerId || ""}
                      onChange={(e) =>
                        assignComplaintToOfficer(c._id, e.target.value)
                      }
                    >
                      <option value="">Unassigned</option>
                      {officerOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.email || o.id}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Images */}
                  <td className="border px-2 py-1">
                    {c.imageUrls && c.imageUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.imageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={`${API_URL}${url}`} // ✅ use API_URL here
                            alt={`complaint-${i}`}
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  {/* Status + Delete */}
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
                      onClick={() => deleteComplaint(c._id)}
                      className="w-full px-1 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Users table with filters, role change, delete */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">All Users</h2>

          {/* User role filter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">Filter by role:</span>
            <select
              className="border rounded px-2 py-1"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
              <option value="citizen">Citizen</option>
            </select>
          </div>
        </div>

        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">ID</th>
              <th className="border px-2 py-1 text-left">Name / Username</th>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Role</th>
              <th className="border px-2 py-1 text-left">Change Role</th>
              <th className="border px-2 py-1 text-left">Delete</th>
              <th className="border px-2 py-1 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="border px-2 py-1">{u.id}</td>
                <td className="border px-2 py-1">
                  {u.username || u.fullName || u.email || "-"}
                </td>
                <td className="border px-2 py-1">{u.email || "-"}</td>
                <td className="border px-2 py-1">{u.role}</td>
                <td className="border px-2 py-1">
                  <select
                    className="border rounded px-1 py-0.5 text-xs"
                    value={u.role}
                    onChange={(e) => changeUserRole(u.id, e.target.value)}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
                <td className="border px-2 py-1">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
