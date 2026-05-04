import React, { useEffect, useState } from "react";
import { addItem, deleteItem, getItems, updateItem } from "../../services/api";

const emptyForm = {
  tripName: "",
  busName: "",
  routeName: "",
  travelDate: "",
  departureTime: "",
  arrivalTime: "",
  fare: "",
  seats: "",
  status: "Scheduled",
};

export default function TripList() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const data = await getItems("trips");
    setTrips(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.tripName || !form.busName || !form.routeName || !form.travelDate || !form.departureTime || !form.arrivalTime || !form.fare || !form.seats) {
      alert("Please fill all fields");
      return;
    }

    if (editingId) {
      await updateItem("trips", editingId, form);
      setEditingId(null);
    } else {
      await addItem("trips", form);
    }

    setForm(emptyForm);
    loadTrips();
  };

  const handleEdit = (trip) => {
    setForm({
      tripName: trip.tripName,
      busName: trip.busName,
      routeName: trip.routeName,
      travelDate: trip.travelDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      fare: trip.fare,
      seats: trip.seats,
      status: trip.status,
    });
    setEditingId(trip.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trip?")) return;
    await deleteItem("trips", id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    loadTrips();
  };

  const handleReset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <PageHeader title="Trips" subtitle="Manage all bus trips for Shahaji Travels" />

      <Card>
        <h2 style={sectionTitle}>{editingId ? "Edit Trip" : "Add New Trip"}</h2>
        <div style={gridStyle}>
          <Input label="Trip Name *" name="tripName" value={form.tripName} onChange={handleChange} placeholder="Enter trip name" />
          <Input label="Bus Name *" name="busName" value={form.busName} onChange={handleChange} placeholder="Enter bus name" />
          <Input label="Route Name *" name="routeName" value={form.routeName} onChange={handleChange} placeholder="Ex. Pune - Kolhapur" />
          <Input label="Travel Date *" type="date" name="travelDate" value={form.travelDate} onChange={handleChange} />
          <Input label="Departure Time *" type="time" name="departureTime" value={form.departureTime} onChange={handleChange} />
          <Input label="Arrival Time *" type="time" name="arrivalTime" value={form.arrivalTime} onChange={handleChange} />
          <Input label="Fare (₹) *" name="fare" value={form.fare} onChange={handleChange} placeholder="Enter fare" />
          <Input label="Available Seats *" name="seats" value={form.seats} onChange={handleChange} placeholder="Enter available seats" />
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option>Scheduled</option>
              <option>Running</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={primaryBtn}>
            {editingId ? "Update Trip" : "Add Trip"}
          </button>
          <button onClick={handleReset} style={secondaryBtn}>Reset</button>
        </div>
      </Card>

      <Card>
        <h2 style={sectionTitle}>Trip List</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={thTd}>Trip Name</th>
                <th style={thTd}>Bus</th>
                <th style={thTd}>Route</th>
                <th style={thTd}>Date</th>
                <th style={thTd}>Departure</th>
                <th style={thTd}>Arrival</th>
                <th style={thTd}>Fare</th>
                <th style={thTd}>Seats</th>
                <th style={thTd}>Status</th>
                <th style={thTd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={thTd}>{trip.tripName}</td>
                  <td style={thTd}>{trip.busName}</td>
                  <td style={thTd}>{trip.routeName}</td>
                  <td style={thTd}>{trip.travelDate}</td>
                  <td style={thTd}>{trip.departureTime}</td>
                  <td style={thTd}>{trip.arrivalTime}</td>
                  <td style={thTd}>₹{trip.fare}</td>
                  <td style={thTd}>{trip.seats}</td>
                  <td style={thTd}><StatusBadge status={trip.status} /></td>
                  <td style={thTd}>
                    <button onClick={() => handleEdit(trip)} style={editBtn}>Edit</button>
                    <button onClick={() => handleDelete(trip.id)} style={deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={headerCard}>
      <h1 style={{ margin: 0, fontSize: "48px", color: "#0f172a" }}>{title}</h1>
      <p style={{ color: "#64748b", marginTop: "10px", fontSize: "16px" }}>{subtitle}</p>
    </div>
  );
}

function Card({ children }) {
  return <div style={cardStyle}>{children}</div>;
}

function StatusBadge({ status }) {
  const map = {
    Scheduled: { bg: "#dbeafe", color: "#1d4ed8" },
    Running: { bg: "#dcfce7", color: "#166534" },
    Completed: { bg: "#e0e7ff", color: "#4338ca" },
    Cancelled: { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || map.Scheduled;
  return <span style={{ padding: "8px 14px", borderRadius: "20px", background: s.bg, color: s.color, fontWeight: 600 }}>{status}</span>;
}

const headerCard = { background: "#ffffff", borderRadius: "24px", padding: "24px", marginBottom: "24px" };
const cardStyle = { background: "#ffffff", borderRadius: "24px", padding: "24px", marginBottom: "24px" };
const sectionTitle = { marginTop: 0, fontSize: "32px", color: "#0f172a" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: "18px" };
const inputStyle = { width: "100%", padding: "14px 16px", marginTop: "8px", borderRadius: "16px", border: "1px solid #cbd5e1", fontSize: "16px", outline: "none", boxSizing: "border-box" };
const primaryBtn = { background: "#2563eb", color: "white", border: "none", padding: "14px 22px", borderRadius: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer" };
const secondaryBtn = { background: "#e5e7eb", color: "#111827", border: "none", padding: "14px 22px", borderRadius: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer" };
const editBtn = { background: "#2563eb", color: "white", border: "none", padding: "10px 14px", borderRadius: "12px", marginRight: "8px", cursor: "pointer" };
const deleteBtn = { background: "#ef4444", color: "white", border: "none", padding: "10px 14px", borderRadius: "12px", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "18px" };
const thTd = { padding: "16px" };