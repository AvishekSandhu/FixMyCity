// src/pages/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import Spinner from "./loding.jsx";
import { toast } from "react-toastify";
import { FaTrash, FaUserShield, FaClipboardList, FaCheckCircle, FaClock } from "react-icons/fa";
import { API_URL } from "../api";

const getCode = (c) => c?.ticket || c?.complaintNumber || c?.publicToken || c?._id || "-";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [complaintDateFilter, setComplaintDateFilter] = useState("all");

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

  const officerOptions = useMemo(
    () => users.filter((u) => u.role === "officer"),
    [users]
  );

  const filteredComplaints = useMemo(() => {
    if (complaintDateFilter === "all") return complaints;
    const days = parseInt(complaintDateFilter, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return complaints.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return created >= cutoff;
    });
  }, [complaints, complaintDateFilter]);

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
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to update status");
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
        headers: { Authorization: `Bearer ${token}` },
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
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/complaints/${complaintId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <span className="text-slate-500 text-sm">Manage complaints, officers, and users</span>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 p-4 rounded-lg">
            Error: {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className={cardClass}>
              <div className="p-3 bg-amber-900/30 rounded-full text-amber-500"><FaClock size={24} /></div>
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{summary.counts.pending ?? 0}</p>
              </div>
            </div>
            <div className={cardClass}>
              <div className="p-3 bg-emerald-900/30 rounded-full text-emerald-500"><FaCheckCircle size={24} /></div>
              <div>
                <p className="text-slate-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-white">{summary.counts.closed ?? 0}</p>
              </div>
            </div>
            <div className={cardClass}>
              <div className="p-3 bg-sky-900/30 rounded-full text-sky-500"><FaClipboardList size={24} /></div>
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{summary.counts.total ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent complaints */}
        {summary && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Recent Complaints</h2>
            {summary.recentComplaints.length === 0 ? (
              <p className="text-slate-500 text-sm">No complaints yet.</p>
            ) : (
              <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead>
                    <tr>
                      <th className={th}>Complaint #</th>
                      <th className={th}>Title</th>
                      <th className={th}>Type</th>
                      <th className={th}>Status</th>
                      <th className={th}>Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {summary.recentComplaints.map((c) => {
                      const code = getCode(c);
                      return (
                        <tr key={c._id} className="hover:bg-slate-800/40">
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
                          <td className={td}>{c.title}</td>
                          <td className={td}>{c.complaintType}</td>
                          <td className={`${td} capitalize`}>{c.status}</td>
                          <td className={td}>{new Date(c.createdAt).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* All complaints */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-t-xl border-b border-slate-800">
            <h2 className="text-xl font-semibold">All Complaints</h2>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm hidden sm:inline">Filter Date:</span>
              <select
                className={`${selectClass} py-2`}
                value={complaintDateFilter}
                onChange={(e) => setComplaintDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-b-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              {filteredComplaints.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No complaints found matching criteria.</div>
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
                      <th className={th}>Assigned To</th>
                      <th className={th}>Action</th>
                      <th className={th}>Media</th>
                      <th className={th}>Delete</th>
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
                            <div className="font-medium text-white truncate max-w-[220px]" title={c.title}>
                              {c.title}
                            </div>
                            <div className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className={td}>{c.name || "Anonymous"}</td>
                          <td className={td}>
                            <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                              {c.complaintType}
                            </span>
                          </td>
                          <td className={td}>
                            <select
                              className={selectClass}
                              value={c.department || ""}
                              onChange={(e) => updateComplaintDepartment(c._id, e.target.value)}
                            >
                              <option value="">-- Assign --</option>
                              <option value="Sanitation">Sanitation</option>
                              <option value="Roads">Roads</option>
                              <option value="Garbage">Garbage</option>
                              <option value="Lighting">Lighting</option>
                              <option value="Health">Health</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className={td}>
                            <select
                              className={`${selectClass} font-semibold ${
                                c.status === "closed"
                                  ? "text-emerald-400"
                                  : c.status === "in_progress"
                                  ? "text-amber-400"
                                  : "text-red-400"
                              }`}
                              value={c.status}
                              onChange={(e) => updateStatus(c._id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td className={td}>
                            <div className="flex flex-col gap-1">
                              <select
                                className={selectClass}
                                value={c.assignedOfficerId || ""}
                                onChange={(e) => assignComplaintToOfficer(c._id, e.target.value)}
                              >
                                <option value="">-- Officer --</option>
                                {officerOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.email || o.fullName || "Officer"}
                                  </option>
                                ))}
                              </select>
                              {c.assignedOfficerName && (
                                <span className="text-[10px] text-sky-400 truncate max-w-[140px]">
                                  Current: {c.assignedOfficerName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={td}>
                            <span className="text-xs text-slate-500">Updated</span>
                          </td>
                          <td className={td}>
                            {c.imageUrls && c.imageUrls.length > 0 ? (
                              <div className="flex -space-x-2 overflow-hidden">
                                {c.imageUrls.slice(0, 3).map((url, i) => (
                                  <a key={i} href={`${API_URL}${url}`} target="_blank" rel="noreferrer">
                                    <img
                                      src={`${API_URL}${url}`}
                                      alt="proof"
                                      className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"
                                    />
                                  </a>
                                ))}
                                {c.imageUrls.length > 3 && (
                                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-700 text-[10px] text-white">
                                    +{c.imageUrls.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">No img</span>
                            )}
                          </td>
                          <td className={td}>
                            <button
                              onClick={() => deleteComplaint(c._id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded transition-colors"
                              title="Delete Complaint"
                            >
                              <FaTrash />
                            </button>
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

        {/* Users table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-t-xl border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FaUserShield className="text-sky-500" />
              <h2 className="text-xl font-semibold text-white">User Management</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm hidden sm:inline">Role:</span>
              <select
                className={`${selectClass} py-2`}
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="admin">Admins</option>
                <option value="officer">Officers</option>
                <option value="citizen">Citizens</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-b-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead>
                  <tr>
                    <th className={th}>User Details</th>
                    <th className={th}>Current Role</th>
                    <th className={th}>Change Role</th>
                    <th className={th}>Joined Date</th>
                    <th className={th}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className={td}>
                        <div className="font-medium text-white">{u.username || u.fullName || "No Name"}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {u.id}</div>
                      </td>
                      <td className={td}>
                        <span
                          className={`px-2 py-0.5 rounded text-xs border capitalize ${
                            u.role === "admin"
                              ? "bg-purple-900/30 text-purple-300 border-purple-800"
                              : u.role === "officer"
                              ? "bg-emerald-900/30 text-emerald-300 border-emerald-800"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className={td}>
                        <select
                          className={selectClass}
                          value={u.role}
                          onChange={(e) => changeUserRole(u.id, e.target.value)}
                        >
                          <option value="citizen">Citizen</option>
                          <option value="officer">Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className={td}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className={td}>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded transition-colors"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;