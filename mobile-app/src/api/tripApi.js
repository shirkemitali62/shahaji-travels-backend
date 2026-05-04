import http from "./http";

export const getTrips = async ({ from, to, date }) => {
  const res = await http.get("/trips", {
    params: { from, to, date },
  });
  return res.data;
};

export const getTripById = async (tripId) => {
  const res = await http.get(`/trips/${tripId}`);
  return res.data;
};

export const getTripSeats = async (tripId) => {
  const res = await http.get(`/trips/${tripId}/seats`);
  return res.data;
};