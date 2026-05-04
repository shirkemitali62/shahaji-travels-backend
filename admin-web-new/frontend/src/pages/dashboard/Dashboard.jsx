import React, { useEffect, useState } from "react";
import { getDashboard } from "../../services/api";

export default function Dashboard() {
  const [data, setData] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalBuses: 0,
    totalCustomers: 0,
    totalTrips: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res);
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  const cards = [
    { title: "Total Bookings", value: data.totalBookings, sub: "All bookings" },
    { title: "Today Bookings", value: data.todayBookings, sub: "Today count" },
    { title: "Total Buses", value: data.totalBuses, sub: "Fleet count" },
    { title: "Customers", value: data.totalCustomers || 0, sub: "Registered users" },
    { title: "Trips", value: data.totalTrips || 0, sub: "Running + planned" },
    { title: "Revenue", value: `₹${data.revenue || 0}`, sub: "Total earnings" },
  ];

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #111c34 100%)",
          border: "1px solid #1e293b",
          borderRadius: "28px",
          padding: "30px",
          marginBottom: "24px",
          color: "white",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "52px", fontWeight: "900" }}>
          Dashboard
        </h1>
        <p style={{ marginTop: "10px", color: "#94a3b8", fontSize: "18px" }}>
          Welcome back. Here is your live Shahaji Travels business summary.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        {cards.map((item) => (
          <div
            key={item.title}
            style={{
              background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
              border: "1px solid #1e293b",
              borderRadius: "24px",
              padding: "24px",
              color: "white",
              boxShadow: "0 14px 30px rgba(0, 0, 0, 0.22)",
            }}
          >
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "16px" }}>
              {item.title}
            </p>
            <h2
              style={{
                margin: "14px 0 8px",
                fontSize: "42px",
                fontWeight: "800",
              }}
            >
              {item.value}
            </h2>
            <p style={{ margin: 0, color: "#60a5fa", fontSize: "14px" }}>
              {item.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}