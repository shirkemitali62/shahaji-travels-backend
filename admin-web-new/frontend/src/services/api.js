const API = "https://coucha-mythologically-brittany.ngrok-free.dev ";


// Dashboard
export const getDashboard = async () => {
  const res = await fetch(`${API}/dashboard`);
  return res.json();
};

// Settings
export const getSettings = async () => {
  const res = await fetch(`${API}/settings`);
  return res.json();
};

export const saveSettings = async (data) => {
  const res = await fetch(`${API}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Common CRUD
export const getItems = async (endpoint) => {
  const res = await fetch(`${API}/${endpoint}`);
  return res.json();
};

export const addItem = async (endpoint, data) => {
  const res = await fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateItem = async (endpoint, id, data) => {
  const res = await fetch(`${API}/${endpoint}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteItem = async (endpoint, id) => {
  const res = await fetch(`${API}/${endpoint}/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

// Reports
export const getReports = async () => {
  const res = await fetch(`${API}/reports`);
  return res.json();
};

// Seats
export const getBusSeats = async (busId) => {
  const res = await fetch(`${API}/buses/${busId}`);
  return res.json();
};

export const getTripSeats = async (tripId) => {
  const res = await fetch(`${API}/trips/${tripId}/seats`);
  return res.json();
};

export const bookTripSeats = async (tripId, selectedSeats) => {
  const res = await fetch(`${API}/trips/${tripId}/book-seats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ selectedSeats }),
  });

  return res.json();
};

export default API;