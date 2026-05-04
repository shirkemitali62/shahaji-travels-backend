import React, { useEffect, useState } from "react";
import {
  addItem,
  deleteItem,
  getItems,
  updateItem,
} from "../../services/api";

const emptyForm = {
  passengerName: "",
  phone: "",
  gender: "Male",
  age: "",
  boardingPoint: "",
  droppingPoint: "",
  paymentMode: "Cash",
  paymentStatus: "Pending",
  amount: "",
  bookingDate: new Date().toISOString().split("T")[0],
  seatNo: "",
  ticketStatus: "Confirmed",
};

export default function BookingList() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getItems("bookings");
      setItems(data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.passengerName || !form.phone || !form.amount) {
      alert("Fill required fields");
      return;
    }

    try {
      if (editingId) {
        await updateItem("bookings", editingId, form);
        setEditingId(null);
      } else {
        await addItem("bookings", {
          ...form,
          bookingId: "BK" + Date.now(),
        });
      }

      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleEdit = (item) => {
    setForm({
      passengerName: item.passengerName || item.name || "",
      phone: item.phone || "",
      gender: item.gender || "Male",
      age: item.age || "",
      boardingPoint: item.boardingPoint || "",
      droppingPoint: item.droppingPoint || "",
      paymentMode: item.paymentMode || "Cash",
      paymentStatus: item.paymentStatus || "Pending",
      amount: item.amount || "",
      bookingDate: item.bookingDate || new Date().toISOString().split("T")[0],
      seatNo: item.seatNo || "",
      ticketStatus: item.ticketStatus || "Confirmed",
    });
    setEditingId(item._id || item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete booking?")) return;
    await deleteItem("bookings", id);
    load();
  };

  return (
    <div style={{ padding: "24px", background: "#020617", minHeight: "100vh", color: "white" }}>
      <h1 style={{ fontSize: "42px", marginBottom: "20px" }}>Bookings</h1>

      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "24px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
          {editingId ? "Edit Booking" : "Add Booking"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <input style={inputStyle} placeholder="Passenger Name" name="passengerName" value={form.passengerName} onChange={handleChange} />
          <input style={inputStyle} placeholder="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <input style={inputStyle} placeholder="Age" name="age" value={form.age} onChange={handleChange} />

          <select style={inputStyle} name="gender" value={form.gender} onChange={handleChange}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input style={inputStyle} placeholder="Boarding Point" name="boardingPoint" value={form.boardingPoint} onChange={handleChange} />
          <input style={inputStyle} placeholder="Dropping Point" name="droppingPoint" value={form.droppingPoint} onChange={handleChange} />

          <select style={inputStyle} name="paymentMode" value={form.paymentMode} onChange={handleChange}>
            <option>UPI</option>
            <option>Cash</option>
            <option>Card</option>
          </select>

          <select style={inputStyle} name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
            <option>Paid</option>
            <option>Pending</option>
            <option>Failed</option>
            <option>Refunded</option>
          </select>

          <input style={inputStyle} placeholder="Amount" name="amount" value={form.amount} onChange={handleChange} />

          <input style={inputStyle} placeholder="Booking Date" name="bookingDate" value={form.bookingDate} onChange={handleChange} />
          <input style={inputStyle} placeholder="Seat No" name="seatNo" value={form.seatNo} onChange={handleChange} />

          <select style={inputStyle} name="ticketStatus" value={form.ticketStatus} onChange={handleChange}>
            <option>Confirmed</option>
            <option>Cancelled</option>
            <option>Pending</option>
          </select>
        </div>

        <div style={{ marginTop: "18px", display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={primaryBtn}>
            {editingId ? "Update Booking" : "Add Booking"}
          </button>

          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
            }}
            style={secondaryBtn}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "24px",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Booking List</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
            <thead>
              <tr style={{ background: "#111827" }}>
                <th style={thTd}>Name</th>
                <th style={thTd}>Phone</th>
                <th style={thTd}>Payment</th>
                <th style={thTd}>Amount</th>
                <th style={thTd}>Seat</th>
                <th style={thTd}>Status</th>
                <th style={thTd}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length ? (
                items.map((b) => (
                  <tr key={b._id || b.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={thTd}>{b.passengerName || b.name}</td>
                    <td style={thTd}>{b.phone}</td>
                    <td style={thTd}>{b.paymentMode || "-"}</td>
                    <td style={thTd}>₹{b.amount || 0}</td>
                    <td style={thTd}>{b.seatNo || "-"}</td>
                    <td style={thTd}>{b.paymentStatus || "-"}</td>
                    <td style={thTd}>
                      <button onClick={() => handleEdit(b)} style={editBtn}>Edit</button>
                      <button onClick={() => handleDelete(b._id || b.id)} style={deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  fontSize: "15px",
  boxSizing: "border-box",
};

const primaryBtn = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryBtn = {
  background: "#334155",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
};

const editBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "10px",
  marginRight: "8px",
  cursor: "pointer",
};

const deleteBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "10px",
  cursor: "pointer",
};

const thTd = {
  padding: "14px",
  textAlign: "left",
};
