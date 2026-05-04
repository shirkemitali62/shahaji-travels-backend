import http from "./http";

export const createBooking = async (payload) => {
  const res = await http.post("/bookings", payload);
  return res.data;
};

export const getBookingById = async (bookingId) => {
  const res = await http.get(`/bookings/${bookingId}`);
  return res.data;
};

export const getMyBookings = async (phone) => {
  const res = await http.get(`/bookings/user/${phone}`);
  return res.data;
};