import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { getReports } from "../../services/api";

const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

export default function Reports() {
  const [data, setData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalTrips: 0,
    totalRoutes: 0,
    bookingStatusChart: [],
    busTypeChart: [],
    revenueByRoute: [],
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await getReports();
      setData(res);
    } catch (error) {
      console.error("Reports load error:", error);
    }
  };

  return (
    <div style={{ padding: "24px", background: "#020617", minHeight: "100vh" }}>
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "24px",
          padding: "28px",
          marginBottom: "24px",
          color: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "48px" }}>Reports & Analytics</h1>
        <p style={{ marginTop: "10px", color: "#94a3b8", fontSize: "18px" }}>
          Real performance overview of Shahaji Travels
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <StatCard title="Total Bookings" value={data.totalBookings} />
        <StatCard title="Total Revenue" value={`₹${data.totalRevenue}`} />
        <StatCard title="Customers" value={data.totalCustomers} />
        <StatCard title="Trips" value={data.totalTrips} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <Card title="Revenue by Route">
          <div style={{ width: "100%", height: "320px" }}>
            <ResponsiveContainer>
              <BarChart data={data.revenueByRoute}>
                <XAxis dataKey="route" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Booking Status">
          <div style={{ width: "100%", height: "320px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.bookingStatusChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {data.bookingStatusChart.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        <Card title="Bus Type Distribution">
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.busTypeChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {data.busTypeChart.map((entry, index) => (
                    <Cell key={index} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Routes Summary">
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#111827" }}>
                  <th style={thTd}>Route</th>
                  <th style={thTd}>Bookings</th>
                  <th style={thTd}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueByRoute.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={thTd}>{item.route}</td>
                    <td style={thTd}>{item.bookings}</td>
                    <td style={thTd}>₹{item.revenue}</td>
                  </tr>
                ))}
                {data.revenueByRoute.length === 0 && (
                  <tr>
                    <td colSpan="3" style={emptyTd}>
                      No route data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "20px",
        padding: "24px",
        color: "white",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "16px" }}>{title}</p>
      <h2 style={{ margin: "14px 0 0", fontSize: "40px" }}>{value}</h2>
    </div>
  );
}

function Card({ title, children }) {
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
      <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "28px" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "18px",
  color: "white",
};

const thTd = {
  padding: "16px",
  textAlign: "left",
};

const emptyTd = {
  padding: "24px",
  textAlign: "center",
  color: "#94a3b8",
};