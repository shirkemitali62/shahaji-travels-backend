import React, { useEffect, useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: "",
    supportPhone: "",
    supportEmail: "",
    address: "",
    currency: "INR",
    theme: "Dark",
    cancellation: "Allowed",
    refund: "Partial Refund",
  });

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem("settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem("settings", JSON.stringify(settings));
    alert("Settings Saved Successfully ✅");
  };

  return (
    <div style={{ padding: "24px", background: "#020617", minHeight: "100vh" }}>
      <Header />

      <Card>
        <h2 style={title}>General Settings</h2>

        <div style={grid}>
          <Input
            label="Company Name"
            name="companyName"
            value={settings.companyName}
            onChange={handleChange}
          />

          <Input
            label="Support Phone"
            name="supportPhone"
            value={settings.supportPhone}
            onChange={handleChange}
          />

          <Input
            label="Support Email"
            name="supportEmail"
            value={settings.supportEmail}
            onChange={handleChange}
          />

          <Input
            label="Office Address"
            name="address"
            value={settings.address}
            onChange={handleChange}
          />

          <Select
            label="Currency"
            name="currency"
            value={settings.currency}
            onChange={handleChange}
            options={["INR", "USD", "EUR"]}
          />

          <Select
            label="Theme"
            name="theme"
            value={settings.theme}
            onChange={handleChange}
            options={["Dark", "Light"]}
          />

          <Select
            label="Booking Cancellation"
            name="cancellation"
            value={settings.cancellation}
            onChange={handleChange}
            options={["Allowed", "Not Allowed"]}
          />

          <Select
            label="Refund Policy"
            name="refund"
            value={settings.refund}
            onChange={handleChange}
            options={["Full Refund", "Partial Refund", "No Refund"]}
          />
        </div>

        <button onClick={handleSave} style={saveBtn}>
          Save Settings
        </button>
      </Card>
    </div>
  );
}

/* Components */

function Header() {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <h1 style={{ color: "white", margin: 0 }}>Settings</h1>
      <p style={{ color: "#94a3b8" }}>
        Manage Shahaji Travels system settings
      </p>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "24px",
        padding: "24px",
        color: "white",
      }}
    >
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select {...props} style={inputStyle}>
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* Styles */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
};

const title = {
  marginTop: 0,
  fontSize: "32px",
};

const labelStyle = {
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
};

const saveBtn = {
  marginTop: "20px",
  background: "#2563eb",
  border: "none",
  padding: "12px 20px",
  borderRadius: "10px",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};