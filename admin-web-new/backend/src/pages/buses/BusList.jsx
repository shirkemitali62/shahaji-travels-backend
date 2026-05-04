import React, { useEffect, useState } from "react";
import { addItem, deleteItem, getItems, updateItem } from "../../services/api";

const emptyForm = {
  name: "",
  number: "",
  busType: "AC",
  category: "Sleeper",
  totalSeats: "",
  availableSeats: "",
  status: "Active",
};

export default function BusList() {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      const data = await getItems("buses");
      setBuses(data);
    } catch (error) {
      console.error("Error loading buses:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.number || !form.totalSeats || !form.availableSeats) {
      alert("Please fill all fields");
      return;
    }

    if (Number(form.availableSeats) > Number(form.totalSeats)) {
      alert("Available seats cannot be more than total seats");
      return;
    }

    try {
      if (editingId) {
        await updateItem("buses", editingId, form);
        setEditingId(null);
      } else {
        await addItem("buses", form);
      }

      setForm(emptyForm);
      loadBuses();
    } catch (error) {
      console.error("Bus save error:", error);
    }
  };

  const handleEdit = (bus) => {
    setForm({
      name: bus.name || "",
      number: bus.number || "",
      busType: bus.busType || "AC",
      category: bus.category || "Sleeper",
      totalSeats: bus.totalSeats || "",
      availableSeats: bus.availableSeats || "",
      status: bus.status || "Active",
    });
    setEditingId(bus.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bus?")) return;

    try {
      await deleteItem("buses", id);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      loadBuses();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleReset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div style={{ padding: "24px", background: "#020617", minHeight: "100vh" }}>
      <PageHeader title="Buses" subtitle="Manage all buses for Shahaji Travels" />

      <Card>
        <h2 style={sectionTitle}>{editingId ? "Edit Bus" : "Add New Bus"}</h2>

        <div style={gridStyle}>
          <Input
            label="Bus Name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter bus name"
          />

          <Input
            label="Bus Number *"
            name="number"
            value={form.number}
            onChange={handleChange}
            placeholder="Enter bus number"
          />

          <div>
            <label style={labelStyle}>Bus Type</label>
            <select
              name="busType"
              value={form.busType}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>AC</option>
              <option>Non-AC</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>Sleeper</option>
              <option>Seater</option>
              <option>Semi-Sleeper</option>
            </select>
          </div>

          <Input
            label="Total Seats *"
            name="totalSeats"
            value={form.totalSeats}
            onChange={handleChange}
            placeholder="Enter total seats"
          />

          <Input
            label="Available Seats *"
            name="availableSeats"
            value={form.availableSeats}
            onChange={handleChange}
            placeholder="Enter available seats"
          />

          <div>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={primaryBtn}>
            {editingId ? "Update Bus" : "Add Bus"}
          </button>

          <button onClick={handleReset} style={secondaryBtn}>
            Reset
          </button>
        </div>
      </Card>

      <Card>
        <h2 style={sectionTitle}>Bus List</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#111827", textAlign: "left" }}>
                <th style={thTd}>Bus Name</th>
                <th style={thTd}>Bus Number</th>
                <th style={thTd}>Bus Type</th>
                <th style={thTd}>Category</th>
                <th style={thTd}>Total Seats</th>
                <th style={thTd}>Available Seats</th>
                <th style={thTd}>Status</th>
                <th style={thTd}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {buses.map((bus) => (
                <tr key={bus.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={thTd}>{bus.name}</td>
                  <td style={thTd}>{bus.number}</td>
                  <td style={thTd}>{bus.busType}</td>
                  <td style={thTd}>{bus.category}</td>
                  <td style={thTd}>{bus.totalSeats}</td>
                  <td style={thTd}>{bus.availableSeats}</td>
                  <td style={thTd}>
                    <StatusBadge status={bus.status} />
                  </td>
                  <td style={thTd}>
                    <button onClick={() => handleEdit(bus)} style={editBtn}>
                      Edit
                    </button>

                    <button onClick={() => handleDelete(bus.id)} style={deleteBtn}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {buses.length === 0 && (
                <tr>
                  <td style={emptyTd} colSpan="8">
                    No buses found
                  </td>
                </tr>
              )}
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
      <label style={labelStyle}>{label}</label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "48px", color: "white" }}>{title}</h1>
      <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "16px" }}>
        {subtitle}
      </p>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
        color: "white",
      }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Active: { bg: "#dcfce7", color: "#166534" },
    Inactive: { bg: "#fee2e2", color: "#991b1b" },
    Maintenance: { bg: "#ffedd5", color: "#9a3412" },
  };

  const s = map[status] || map.Active;

  return (
    <span
      style={{
        padding: "8px 14px",
        borderRadius: "20px",
        background: s.bg,
        color: s.color,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

const labelStyle = {
  color: "white",
  fontSize: "15px",
};

const sectionTitle = {
  marginTop: 0,
  fontSize: "32px",
  color: "white",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
  gap: "18px",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginTop: "8px",
  borderRadius: "16px",
  border: "1px solid #334155",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
  background: "#020617",
  color: "white",
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
  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.25)",
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
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  marginRight: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const deleteBtn = {
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "700",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "17px",
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
