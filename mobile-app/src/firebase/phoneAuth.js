// src/firebase/phoneAuth.js
// ✅ Testing: OTP terminal मध्ये print होतो
// ✅ Production: MSG91 ने replace करा

const API_BASE = "https://cycle-giving-flags-humor.trycloudflare.com";

export const sendOtp = async (phone) => {
  const cleaned = String(phone).replace(/\D/g, "").slice(-10);
  if (cleaned.length < 10) throw new Error("Valid 10-digit phone number enter करा.");
  
  const res = await fetch(`${API_BASE}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: cleaned }),
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "OTP पाठवता आला नाही.");
};

export const verifyOtp = async (otp, phone) => {
  if (!otp || String(otp).length < 6) throw new Error("6 अंकी OTP enter करा.");
  
  const res = await fetch(`${API_BASE}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp: String(otp).trim() }),
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "OTP चुकीचा आहे.");
  return { verified: true };
};

export const resetOtpState = () => {
  // nothing to reset
};