import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

// ✅ ADD BOOKING
router.post("/", async (req, res) => {
  try {
    console.log("Incoming booking:", req.body);

    const booking = await Booking.create(req.body);

    res.status(201).json({
      success: true,
      message: "Booking added successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).json({
      message: "Error adding booking",
      error: error.message,
    });
  }
});

// ✅ GET ALL BOOKINGS
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

export default router;