const API_BASE = "https://shahaji-travels-backend.onrender.com";

export const sendOtp = async (phone) => {
  const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);
  if (!cleaned || cleaned.length < 10)
    throw new Error("Valid 10-digit mobile number enter करा.");
  if (!/^[6-9]\d{9}$/.test(cleaned))
    throw new Error("Valid Indian mobile number enter करा.");

  const res  = await fetch(`${API_BASE}/api/otp/send`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone: cleaned }),
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message || "OTP पाठवता आला नाही.");
  return { success: true };
};

export const verifyOtp = async (otp, phone) => {
  const otpStr  = String(otp || "").trim();
  const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);
  if (!otpStr || otpStr.length < 6)
    throw new Error("6 अंकी OTP enter करा.");

  const res  = await fetch(`${API_BASE}/api/otp/verify`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone: cleaned, otp: otpStr }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errMap = {
      OTP_EXPIRED: "OTP expire झाला. नवीन OTP मागवा.",
      MAX_RETRIES: "खूप जास्त attempts. नवीन OTP मागवा.",
      WRONG_OTP:   data.message,
    };
    throw new Error(errMap[data.errorCode] || data.message || "OTP चुकीचा आहे.");
  }
  return { verified: true };
};

export const resetOtpState = () => {};