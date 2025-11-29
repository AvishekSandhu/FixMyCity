// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const AdminDashboard = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchUsers = async () => {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error("No token from Clerk (user not signed in?)");
        }

        const res = await fetch("http://localhost:3001/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with ${res.status}`);
        }

        const data = await res.json();
        setUsers(data);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    };

    fetchUsers();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <h2 className="text-2xl font-semibold mb-2">All Users</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Role</th>
            <th className="border px-2 py-1">Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="border px-2 py-1">{u.id}</td>
              <td className="border px-2 py-1">{u.email}</td>
              <td className="border px-2 py-1">{u.role}</td>
              <td className="border px-2 py-1">
                {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;