import React, { useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";

import Dashboard from "../pages/dashboard/Dashboard";
import BusList from "../pages/buses/BusList";
import RouteList from "../pages/routes/RouteList";
import TripList from "../pages/trips/TripList";
import BookingList from "../pages/bookings/BookingList";
import Customers from "../pages/customers/Customers";
import Settings from "../pages/settings/Settings";
import Reports from "../pages/reports/Reports";
import Login from "../pages/auth/Login";

export default function AppRoutes() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isAdminLoggedIn") === "true"
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminUser");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  let page = <Dashboard />;

  if (activePage === "Buses") page = <BusList />;
  else if (activePage === "Routes") page = <RouteList />;
  else if (activePage === "Trips") page = <TripList />;
  else if (activePage === "Bookings") page = <BookingList />;
  else if (activePage === "Customers") page = <Customers />;
  else if (activePage === "Reports") page = <Reports />;
  else if (activePage === "Settings") page = <Settings />;

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleLogout}
    >
      {page}
    </AdminLayout>
  );
}