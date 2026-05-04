import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

if (!accountSid || !authToken || !fromNumber) {
  console.warn("Twilio WhatsApp env vars are missing.");
}

const client = twilio(accountSid, authToken);

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

function getSeatDisplayLabel(seatNo) {
  const LOWER = [
    ["V1", ["1", "2"]],
    ["V2", ["3", "4"]],
    ["V3", ["5", "6"]],
    ["V4", ["7", "8"]],
    ["V5", ["9", "10"]],
    ["V6", ["11", "12"]],
    ["V7", ["13", "14"]],
    ["V8", ["15", "16"]],
    ["V9", ["17", "18"]],
    ["V10", ["19", "20"]],
    ["V11", ["21", "22"]],
    ["V12", ["23", "24"]]
  ];

  const UPPER = [
    ["A1", ["A", "B"]],
    ["A2", ["C", "D"]],
    ["A3", ["E", "F"]],
    ["A4", ["G", "H"]],
    ["A5", ["I", "J"]],
    ["A6", ["K", "L"]]
  ];

  for (const [row, seats] of LOWER) {
    if (seats.includes(String(seatNo))) return `${row} - ${seatNo}`;
  }
  for (const [row, seats] of UPPER) {
    if (seats.includes(String(seatNo))) return `${row} - ${seatNo}`;
  }
  return String(seatNo || "-");
}

export async function sendTicketOnWhatsApp(booking, pdfPublicUrl) {
  const to = `whatsapp:${normalizePhone(booking?.phone)}`;
  const body =
    `SHAHAJI TOURS & TRAVELS\n` +
    `Your booking is confirmed ✅\n\n` +
    `Booking ID: ${booking?.bookingCode}\n` +
    `Passenger: ${booking?.passengerName || "-"}\n` +
    `Route: ${booking?.boardingPoint || "-"} → ${booking?.droppingPoint || "-"}\n` +
    `Journey Date: ${booking?.journeyDate || booking?.date || "-"}\n` +
    `Seat: ${getSeatDisplayLabel(booking?.seatNo)}\n` +
    `Bus No: ${booking?.busNo || booking?.bus || "-"}\n` +
    `Amount: ₹${booking?.amount || 0}\n\n` +
    `Please find your ticket PDF attached.`;

  const message = await client.messages.create({
    from: fromNumber,
    to,
    body,
    mediaUrl: [pdfPublicUrl]
  });

  return message;
}