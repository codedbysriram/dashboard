import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const openOCRProject = () => {
    // Open deployed OCR frontend
    window.open("https://ocr-frontend-murex.vercel.app/", "_blank");
  };

  const logout = () => {
    localStorage.removeItem("admin");
    navigate("/admin"); // back to login
  };

  return (
    <div className="page">

      {/* TOP BAR */}
      <div className="top-bar">
        <button className="top-btn" onClick={() => navigate("/")}>
          ← Back to Student Dashboard
        </button>

        <button className="top-btn logout" onClick={logout}>
          Logout
        </button>
      </div>

      {/* TITLE */}
      <h2>Admin Panel – Computer Technology</h2>

      {/* MAIN ACTIONS */}
      <div className="admin-actions">
        <button onClick={openOCRProject}>
          Upload Result (OCR)
        </button>

        <button onClick={() => navigate("/admin/students")}>
          Student Management
        </button>
      </div>
    </div>
  );
}
