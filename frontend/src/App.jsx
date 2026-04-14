import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Accommodations from "./pages/Accommodations";
import Gallery from "./pages/Gallery";
import Feedback from "./pages/Feedback";
import AgentRegistration from "./pages/AgentRegistration";
import AdminLogin from "./pages/Admin";
import AdminRegistration from "./pages/AdminRegistration";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
// Change this import to use MySearchPage instead of SearchPage
import MySearchPage from "./pages/MySearchPage";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminResetPassword from "./pages/AdminResetPassword";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* ========== PUBLIC PAGES ========== */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<MySearchPage />} /> {/* Updated */}
            <Route path="/accommodations" element={<Accommodations />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/feedback" element={<Feedback />} />

            {/* User authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings" element={<Bookings />} />

            {/* Agent registration */}
            <Route path="/agent-registration" element={<AgentRegistration />} />

            {/* ========== ADMIN AUTH PAGES ========== */}
            {/* These pages will show navbar */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/Admin" element={<AdminLogin />} />
            <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />
            <Route path="/AdminRegistration" element={<AdminRegistration />} />

            {/* 404 Page */}
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;