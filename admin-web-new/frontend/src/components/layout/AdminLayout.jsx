import React from "react";
import Sidebar from "./Sidebar";

export default function AdminLayout({
  children,
  activePage,
  setActivePage,
  onLogout,
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#020617",
      }}
    >
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div
        style={{
          flex: 1,
          background: "linear-gradient(180deg, #020617 0%, #071226 100%)",
          overflow: "auto",
        }}
      >
        <div style={{ padding: "18px 24px 0" }}>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.92)",
              border: "1px solid #1e293b",
              borderRadius: "22px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 12px 35px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "26px",
                  fontWeight: "800",
                }}
              >
                Shahaji Travels Admin
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                Professional bus booking management panel
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  background: "#0b1220",
                  border: "1px solid #1e293b",
                  color: "#cbd5e1",
                  fontWeight: "600",
                }}
              >
                Admin
              </div>

              <button
                onClick={onLogout}
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  border: "none",
                  padding: "11px 18px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  fontWeight: "700",
                  boxShadow: "0 10px 24px rgba(239, 68, 68, 0.25)",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}