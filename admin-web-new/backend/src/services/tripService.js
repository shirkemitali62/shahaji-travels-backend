const API = "http://localhost:5000/api";

export const fetchTrips = async () => {
  const res = await fetch(`${API}/trips`);
  return res.json();
};

export const fetchTripById = async (tripId) => {
  const res = await fetch(`${API}/trips/${tripId}`);
  return res.json();
};