const API = "http://localhost:5000/api";

export const fetchTrips = async () => {
  const res = await fetch(`${API}/trips`);
  return res.json();
};

export const fetchTripById = async (tripId) => {
  const res = await fetch(`${API}/trips/${tripId}`);
  return res.json();
};

export const createBooking = async (payload) => {
  const res = await fetch(`${API}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const fetchBookings = async () => {
  const res = await fetch(`${API}/bookings`);
  return res.json();
};

export const cancelBooking = async (bookingId) => {
  const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
    method: "PUT",
  });

  return res.json();
};