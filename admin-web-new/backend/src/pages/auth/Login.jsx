import React, { useState } from "react";

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  fontSize: "16px",
  boxSizing: "border-box",
};

import { useState } from "react";
import { loginAdmin } from "../services/authService";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginAdmin(email, password);

      if (data.success) {
        localStorage.setItem("adminLoggedIn", "true");
        onLogin();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
      console.log(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}