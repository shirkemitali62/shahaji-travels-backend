// ============================================================
// src/api/api.js — Shahaji Travels Mobile API
// ✅ Route-aware boarding/dropping: passes from & to as query params
// ✅ All endpoints aligned with updated server.js
// ============================================================

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  "https://cycle-giving-flags-humor.trycloudflare.com"; // ← replace with your actual server URL

// ─── HELPER ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ─── API OBJECT ────────────────────────────────────────────────────
export const api = {

  // ── Auth ──────────────────────────────────────────────────────────
  register: (body) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  verifyOtp: (body) =>
    request("/api/auth/verify-otp", { method: "POST", body: JSON.stringify(body) }),

  resendOtp: (phone) =>
    request("/api/auth/resend-otp", { method: "POST", body: JSON.stringify({ phone }) }),

  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  // ── Customer ──────────────────────────────────────────────────────
  getUserProfile: (userId) =>
    request(`/api/customers/${userId}`),

  getWalletBalance: (userId) =>
    request(`/api/wallet/${userId}`),

  getUserBookings: (userId) =>
    request(`/api/bookings/user/${userId}`),

  // ── Buses ─────────────────────────────────────────────────────────
  // REPLACE searchBuses function in src/api/api.js
searchBuses: async (params) => {
  const { from, to, date } = params;

  // Normalize date: DD/MM/YYYY → YYYY-MM-DD for backend
  let normalizedDate = date || "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedDate)) {
    const [dd, mm, yyyy] = normalizedDate.split("/");
    normalizedDate = `${yyyy}-${mm}-${dd}`;
  }

  const response = await fetch(`${BASE_URL}/api/buses/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, date: normalizedDate }),
  });

  if (!response.ok) throw new Error("Search failed");
  return response.json();
},

  getBookedSeats: (busId, date) =>
    request(`/api/trips/${busId}/seats?date=${encodeURIComponent(date || "")}`),

  // ── Boarding / Dropping points ────────────────────────────────────
  // ✅ Passes from & to so server returns correct route-based points
  getBoardingPoints: (busId, from, to) =>
    request(`/api/buses/${busId}/boarding-points?from=${encodeURIComponent(from || "")}&to=${encodeURIComponent(to || "")}`),

  getDroppingPoints: (busId, from, to) =>
    request(`/api/buses/${busId}/dropping-points?from=${encodeURIComponent(from || "")}&to=${encodeURIComponent(to || "")}`),

  // ── Bookings ──────────────────────────────────────────────────────
  createBooking: (body) =>
    request("/api/bookings", { method: "POST", body: JSON.stringify(body) }),

  getBookingById: (id) =>
    request(`/api/bookings/${id}`),

  cancelBooking: (id) =>
    request(`/api/bookings/${id}/cancel`, { method: "POST" }),

  // ── Offers ────────────────────────────────────────────────────────
  getOffers: () =>
    request("/api/offers"),

  validateOffer: (code, amount) =>
    request("/api/offers/validate", { method: "POST", body: JSON.stringify({ code, amount }) }),
};