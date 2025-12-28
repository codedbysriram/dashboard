import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLogin.css";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const nav = useNavigate();

  const login = (e) => {
    e.preventDefault();

    // simple demo login
    if (user === "admin" && pass === "admin123") {
      localStorage.setItem("admin", "true");
      nav("/admin/dashboard");
    } else {
      alert("Invalid login");
    }
  };

  return (

    <div className="login-page">
      {/* LOGIN BOX */}
      <div className="login-box">
        <h2>Admin Login</h2>
        <form onSubmit={login}>
          <input
            placeholder="Username"
            onChange={e => setUser(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setPass(e.target.value)}
          />
          <button>Login</button>
        </form>
      </div>
      {/* BACK TO HOME */}
      <button className="back-btn"style={{textSizeAdjust:"10px"}} onClick={() => nav("/")}>
        ← Back to Student Dashboard
      </button>
    </div>

  );
}
