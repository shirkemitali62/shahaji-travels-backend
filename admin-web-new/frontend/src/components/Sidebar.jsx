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
        width: "220px",
        background: "#020617",
        borderRight: "1px solid #1e293b",
        padding: "20px",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>Admin</h2>

      {menu.map((item) => (
        <div
          key={item}
          onClick={() => setActivePage(item)}
          style={{
            padding: "12px 14px",
            marginBottom: "10px",
            borderRadius: "10px",
            cursor: "pointer",
            background: activePage === item ? "#1d4ed8" : "transparent",
            color: activePage === item ? "#ffffff" : "#94a3b8",
            fontWeight: activePage === item ? "600" : "400",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}