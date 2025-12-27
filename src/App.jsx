import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentDashboard from "./student/StudentDashboard";
import BoardMembers from "./student/BoardMembers";   // ✅ ADD THIS
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import StudentsManager from "./admin/StudentsManager";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* STUDENT DASHBOARD */}
        <Route path="/" element={<StudentDashboard />} />

        {/* ✅ BOARD MEMBERS */}
        <Route path="/board-members" element={<BoardMembers />} />

        {/* ADMIN LOGIN */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* STUDENT MANAGEMENT */}
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute>
              <StudentsManager />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
