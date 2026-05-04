import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getBuses = async () => {
  const res = await API.get('/buses');
  return res.data.data;
};

export const getBookedSeats = async (busId) => {
  const res = await API.get(`/bookings/${busId}/seats`);
  return res.data.data;
};

export const createBooking = async (bookingData) => {
  const res = await API.post('/bookings', bookingData);
  return res.data.data;
};

export default API;