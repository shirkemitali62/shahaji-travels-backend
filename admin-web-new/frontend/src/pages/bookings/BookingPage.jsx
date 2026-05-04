import React, { useState, useEffect } from "react";
import axios from "axios";
import { generateTicket } from "../../utils/generateTicket";

export default function BookingPage() {
 const [items, setItems] = useState([]);

  const handleDelete = (id) => {
    setItems(items.filter((b) => b.id !== id));
  };
const fetchBookings = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/bookings");
    setItems(res.data);
  } catch (err) {
    console.error("Error fetching bookings:", err);
  }
};
useEffect(() => {
  fetchBookings();
}, []);
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Booking List</h2>

      <table className="w-full text-left border">
        <thead>
          <tr>
            <th>#ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Route</th>
            <th>Seats</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

       <tbody>
  {items.map((b) => (
    <tr key={b._id}>
      <td>{b.bookingCode}</td>
      <td>{b.customerName}</td>
      <td>{b.mobile}</td>
      <td>{b.boardingPoint} - {b.droppingPoint}</td>
      <td>{b.seatNumbers?.join(", ")}</td>
      <td>₹{b.totalAmount}</td>
      <td>{b.bookingStatus}</td>

      <td>
        <button onClick={() => generateTicket(b)}>📄 Ticket</button>
      </td>
    </tr>
  ))}
</tbody>
             
      </table>
    </div>
  );
}