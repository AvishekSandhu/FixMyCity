// src/pages/Dashboard.jsx
import { useUser } from "@clerk/clerk-react";

const Dashboard = () => {
  const { user } = useUser();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user?.firstName || user?.username || "user"}!</p>
    </div>
  );
};

export default Dashboard;