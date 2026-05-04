import React from "react";

const menu = [
  "Dashboard",
  "Bookings",
  "Trips",
  "Buses",
  "Routes",
  "Customers",
  "Reports",
  "Settings",
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        borderRight: "1px solid #1e293b",
        padding: "24px 18px",
        boxSizing: "border-box",
        color: "white",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: "900",
            letterSpacing: "0.5px",
          }}
        >
          Shahaji
        </h1>
        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Travels Admin Panel
        </p>
      </div>

      <div
        style={{
          height: "1px",
          background: "#1e293b",
          marginBottom: "22px",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {menu.map((item) => {
          const isActive = activePage === item;

          return (
            <button
              key={item}
              onClick={() => setActivePage(item)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "15px 16px",
                borderRadius: "16px",
                border: isActive ? "1px solid #3b82f6" : "1px solid transparent",
                background: isActive
                  ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "#cbd5e1",
                fontSize: "17px",
                fontWeight: isActive ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive
                  ? "0 10px 25px rgba(37, 99, 235, 0.25)"
                  : "none",
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}