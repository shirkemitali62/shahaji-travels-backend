import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const addBus = async (busData) => {
  const res = await axios.post(`${BASE_URL}/api/buses`, busData);
  return res.data;
};

export const getBuses = async () => {
  const res = await axios.get(`${BASE_URL}/api/buses`);
  return res.data;
};

export const deleteBus = async (id) => {
  const res = await axios.delete(`${BASE_URL}/api/buses/${id}`);
  return res.data;
};

export const updateBus = async (id, busData) => {
  const res = await axios.put(`${BASE_URL}/api/buses/${id}`, busData);
  return res.data;
};