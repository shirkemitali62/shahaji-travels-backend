import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Reports() {
  // 🔥 DEMO DATA
  const monthlyData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 18000 },
    { month: "Mar", revenue: 25000 },
    { month: "Apr", revenue: 22000 },
  ];

  const routeData = [
    { route: "Pune-Mumbai", bookings: 20 },
    { route: "Mumbai-Nashik", bookings: 15 },
    { route: "Pune-Goa", bookings: 10 },
  ];

  return (
    <div className="p-6 space-y-6 text-white">
      {/* HEADER */}
      <div className="bg-[#0f1c2e] p-6 rounded-2xl shadow">
        <h1 className="text-3xl font-bold">Reports 📊</h1>
        <p className="text-gray-400">
          Analyze bookings, revenue and performance
        </p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#16243a] p-5 rounded-xl">
          <h3>Total Revenue</h3>
          <p className="text-2xl font-bold text-green-400">₹72,000</p>
        </div>

        <div className="bg-[#16243a] p-5 rounded-xl">
          <h3>Paid</h3>
          <p className="text-2xl text-green-400">18</p>
        </div>

        <div className="bg-[#16243a] p-5 rounded-xl">
          <h3>Pending</h3>
          <p className="text-2xl text-yellow-400">5</p>
        </div>

        <div className="bg-[#16243a] p-5 rounded-xl">
          <h3>Failed</h3>
          <p className="text-2xl text-red-400">2</p>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-[#16243a] p-6 rounded-xl">
        <h2 className="mb-4 text-xl">Monthly Revenue</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" stroke="#aaa" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROUTE TABLE */}
      <div className="bg-[#16243a] p-6 rounded-xl">
        <h2 className="mb-4 text-xl">Top Routes</h2>

        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Route</th>
              <th>Bookings</th>
            </tr>
          </thead>

          <tbody>
            {routeData.map((r, i) => (
              <tr key={i}>
                <td>{r.route}</td>
                <td>{r.bookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}