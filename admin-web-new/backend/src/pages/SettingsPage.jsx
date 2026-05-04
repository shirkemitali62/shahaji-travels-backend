import React, { useState, useEffect } from "react";

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginTop: "8px",
  borderRadius: "16px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
};

export default function Settings() {
  const [settings, setSettings] = useState({
    company: "Shahaji Travels",
    phone: "9876543210",
    email: "support@shahajitravels.com",
    address: "Pune, Maharashtra",
    currency: "INR",
    theme: "Dark",
    cancellation: "Allowed",
    refund: "Partial Refund",
  });

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem("adminSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save function
  const handleSave = () => {
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    alert("Settings Saved Successfully ✅");
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "48px", color: "#0f172a" }}>
          Settings
        </h1>
        <p style={{ color: "#64748b", marginTop: "10px" }}>
          Manage Shahaji Travels admin settings
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "32px", color: "#0f172a" }}>
          General Settings
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          <div>
            <label>Company Name</label>
            <input
              style={inputStyle}
              value={settings.company}
              onChange={(e) =>
                setSettings({ ...settings, company: e.target.value })
              }
            />
          </div>

          <div>
            <label>Support Phone</label>
            <input
              style={inputStyle}
              value={settings.phone}
              onChange={(e) =>
                setSettings({ ...settings, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label>Support Email</label>
            <input
              style={inputStyle}
              value={settings.email}
              onChange={(e) =>
                setSettings({ ...settings, email: e.target.value })
              }
            />
          </div>

          <div>
            <label>Office Address</label>
            <input
              style={inputStyle}
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
            />
          </div>

          <div>
            <label>Currency</label>
            <select
              style={inputStyle}
              value={settings.currency}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
            >
              <option>INR</option>
              <option>USD</option>
            </select>
          </div>

          <div>
            <label>Theme</label>
            <select
              style={inputStyle}
              value={settings.theme}
              onChange={(e) =>
                setSettings({ ...settings, theme: e.target.value })
              }
            >
              <option>Dark</option>
              <option>Light</option>
            </select>
          </div>

          <div>
            <label>Booking Cancellation</label>
            <select
              style={inputStyle}
              value={settings.cancellation}
              onChange={(e) =>
                setSettings({ ...settings, cancellation: e.target.value })
              }
            >
              <option>Allowed</option>
              <option>Not Allowed</option>
            </select>
          </div>

          <div>
            <label>Refund Policy</label>
            <select
              style={inputStyle}
              value={settings.refund}
              onChange={(e) =>
                setSettings({ ...settings, refund: e.target.value })
              }
            >
              <option>Partial Refund</option>
              <option>Full Refund</option>
              <option>No Refund</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: "24px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "14px 22px",
            borderRadius: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}