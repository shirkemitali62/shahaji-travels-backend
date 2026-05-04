import express from "express";
import { createTicketPdf } from "../services/pdfTicket.js";
import { sendTicketOnWhatsApp } from "../services/whatsappService.js";

const router = express.Router();

router.post("/send-ticket-whatsapp", async (req, res) => {
  try {
    const booking = req.body;

    if (!booking?.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    if (!booking?.passengerName) {
      return res.status(400).json({
        success: false,
        message: "Passenger name is required"
      });
    }

    if (!booking?.bookingCode) {
      booking.bookingCode = `BK${String(Date.now()).slice(-6)}`;
    }

    const { fileName } = await createTicketPdf(booking);

    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    if (!publicBaseUrl) {
      return res.status(500).json({
        success: false,
        message: "PUBLIC_BASE_URL missing in env"
      });
    }

    const pdfUrl = `${publicBaseUrl}/tickets/${fileName}`;
    const message = await sendTicketOnWhatsApp(booking, pdfUrl);

    return res.json({
      success: true,
      message: "Ticket PDF sent on WhatsApp",
      pdfUrl,
      whatsappSid: message.sid
    });
  } catch (error) {
    console.error("send-ticket-whatsapp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp ticket",
      error: error.message
    });
  }
});

export default router;