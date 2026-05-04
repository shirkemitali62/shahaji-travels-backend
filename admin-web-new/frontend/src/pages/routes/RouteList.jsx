import React, { useEffect, useState } from "react";
import { addItem, deleteItem, getItems, updateItem } from "../../services/api";

const emptyForm = {
  from: "",
  to: "",
  distance: "",
  duration: "",
  boarding: "",
  dropping: "",
  status: "Active",
};

export default function RouteList() {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const data = await getItems("routes");
    setRoutes(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.from || !form.to || !form.distance || !form.duration || !form.boarding || !form.dropping) {
      alert("Please fill all fields");
      return;
    }

    if (editingId) {
      await updateItem("routes", editingId, form);
      setEditingId(null);
    } else {
      await addItem("routes", form);
    }

    setForm(emptyForm);
    loadRoutes();
  };

  const handleEdit = (route) => {
    setForm({
      from: route.from,
      to: route.to,
      distance: route.distance,
      duration: route.duration,
      boarding: route.boarding,
      dropping: route.dropping,
      status: route.status,
    });
    setEditingId(route.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this route?")) return;
    await deleteItem("routes", id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    loadRoutes();
  };

  const handleReset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <PageHeader title="Routes" subtitle="Manage all routes for Shahaji Travels" />

      <Card>
        <h2 style={sectionTitle}>{editingId ? "Edit Route" : "Add New Route"}</h2>
        <div style={gridStyle}>
          <Input label="From City *" name="from" value={form.from} onChange={handleChange} placeholder="Enter from city" />
          <Input label="To City *" name="to" value={form.to} onChange={handleChange} placeholder="Enter to city" />
          <Input label="Distance *" name="distance" value={form.distance} onChange={handleChange} placeholder="Ex. 230 km" />
          <Input label="Duration *" name="duration" value={form.duration} onChange={handleChange} placeholder="Ex. 5 hrs" />
          <Input label="Boarding Point *" name="boarding" value={form.boarding} onChange={handleChange} placeholder="Enter boarding point" />
          <Input label="Dropping Point *" name="dropping" value={form.dropping} onChange={handleChange} placeholder="Enter dropping point" />
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={primaryBtn}>
            {editingId ? "Update Route" : "Add Route"}
          </button>
          <button onClick={handleReset} style={secondaryBtn}>Reset</button>
        </div>
      </Card>

      <Card>
        <h2 style={sectionTitle}>Route List</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={thTd}>From</th>
                <th style={thTd}>To</th>
                <th style={thTd}>Distance</th>
                <th style={thTd}>Duration</th>
                <th style={thTd}>Boarding</th>
                <th style={thTd}>Dropping</th>
                <th style={thTd}>Status</th>
                <th style={thTd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={thTd}>{route.from}</td>
                  <td style={thTd}>{route.to}</td>
                  <td style={thTd}>{route.distance}</td>
                  <td style={thTd}>{route.duration}</td>
                  <td style={thTd}>{route.boarding}</td>
                  <td style={thTd}>{route.dropping}</td>
                  <td style={thTd}><StatusBadge status={route.status} /></td>
                  <td style={thTd}>
                    <button onClick={() => handleEdit(route)} style={editBtn}>Edit</button>
                    <button onClick={() => handleDelete(route.id)} style={deleteBtn}>Delete</button>
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
    Active: { bg: "#dcfce7", color: "#166534" },
    Inactive: { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || map.Active;
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