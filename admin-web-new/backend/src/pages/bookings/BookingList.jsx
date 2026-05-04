import React, { useEffect, useState } from "react";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  return (
    <div style={{ padding: "24px", color: "white" }}>
      <h2>Bookings</h2>

      <table style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Seats</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((b, index) => (
            <tr key={index}>
              <td>{b.customerName}</td>
              <td>{b.seats?.join(", ")}</td>
              <td>₹{b.totalAmount}</td>
              <td>{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}