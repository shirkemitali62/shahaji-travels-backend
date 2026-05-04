import React, { useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import Dashboard from "../pages/dashboard/Dashboard";

function SimplePage({ title }) {
  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>{title}</h1>
      <p>{title} page coming soon.</p>
    </div>
  );
}

export default function AppRoutes() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Buses":
        return <SimplePage title="Buses" />;
      case "Routes":
        return <SimplePage title="Routes" />;
      case "Trips":
        return <SimplePage title="Trips" />;
      case "Bookings":
        return <SimplePage title="Bookings" />;
      case "Customers":
        return <SimplePage title="Customers" />;
      case "Reports":
        return <SimplePage title="Reports" />;
      case "Settings":
        return <SimplePage title="Settings" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </AdminLayout>
  );
}