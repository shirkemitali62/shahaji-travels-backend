import React, { useEffect, useState } from "react";
import { addItem, deleteItem, getItems, updateItem } from "../../services/api";

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  bookings: "",
  status: "Active",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await getItems("customers");
    setCustomers(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.email || !form.city || !form.bookings) {
      alert("Please fill all fields");
      return;
    }

    if (editingId) {
      await updateItem("customers", editingId, form);
      setEditingId(null);
    } else {
      await addItem("customers", form);
    }

    setForm(emptyForm);
    loadCustomers();
  };

  const handleEdit = (customer) => {
    setForm({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      bookings: customer.bookings,
      status: customer.status,
    });
    setEditingId(customer.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    await deleteItem("customers", id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    loadCustomers();
  };

  const handleReset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <PageHeader title="Customers" subtitle="Manage all customers for Shahaji Travels" />

      <Card>
        <h2 style={sectionTitle}>{editingId ? "Edit Customer" : "Add New Customer"}</h2>
        <div style={gridStyle}>
          <Input label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" />
          <Input label="Phone *" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" />
          <Input label="Email *" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" />
          <Input label="City *" name="city" value={form.city} onChange={handleChange} placeholder="Enter city" />
          <Input label="Total Bookings *" name="bookings" value={form.bookings} onChange={handleChange} placeholder="Enter bookings" />
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
            {editingId ? "Update Customer" : "Add Customer"}
          </button>
          <button onClick={handleReset} style={secondaryBtn}>Reset</button>
        </div>
      </Card>

      <Card>
        <h2 style={sectionTitle}>Customer List</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={thTd}>Name</th>
                <th style={thTd}>Phone</th>
                <th style={thTd}>Email</th>
                <th style={thTd}>City</th>
                <th style={thTd}>Bookings</th>
                <th style={thTd}>Status</th>
                <th style={thTd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={thTd}>{customer.fullName}</td>
                  <td style={thTd}>{customer.phone}</td>
                  <td style={thTd}>{customer.email}</td>
                  <td style={thTd}>{customer.city}</td>
                  <td style={thTd}>{customer.bookings}</td>
                  <td style={thTd}><StatusBadge status={customer.status} /></td>
                  <td style={thTd}>
                    <button onClick={() => handleEdit(customer)} style={editBtn}>Edit</button>
                    <button onClick={() => handleDelete(customer.id)} style={deleteBtn}>Delete</button>
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