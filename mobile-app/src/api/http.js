import axios from "axios";

// IMPORTANT:
// "192.168.1.5" la tujha laptop cha actual IPv4 address tak
// Example: http://192.168.29.120:5000/api
export const API_BASE_URL = "http://10.38.248.233/api";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;