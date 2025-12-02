// src/App.jsx
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./pages/navbar.jsx";
import Complaint from "./pages/Complait_reg.jsx";
import Track from "./pages/track_com.jsx";
import {
  SignIn,
  SignUp,
  RedirectToSignIn,
  useUser,
} from "@clerk/clerk-react";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import OfficerDashboard from "./pages/officerDashboard.jsx";

// Route wrapper that only allows admins
function AdminRoute({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const role = user?.publicMetadata?.role;

  if (role !== "admin") {
    // Not an admin → kick them back home (or show 403 page)
    return <Navigate to="/" replace />;
  }

  return children;
}

// Route wrapper that only allows officers (and optionally admin)
function OfficerRoute({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const role = user?.publicMetadata?.role;

  if (role !== "officer" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin-only page */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Officer-only page */}
        <Route
          path="/officer"
          element={
            <OfficerRoute>
              <OfficerDashboard />
            </OfficerRoute>
          }
        />

        {/* Auth routes */}
        <Route
          path="/sign-in/*"
          element={<SignIn routing="path" path="/sign-in" />}
        />
        <Route
          path="/sign-up/*"
          element={<SignUp routing="path" path="/sign-up" />}
        />

        {/* Citizen pages */}
        <Route path="/creg" element={<Complaint />} />
        <Route path="/Track" element={<Track />} />
      </Routes>
    </>
  );
}

export default App;