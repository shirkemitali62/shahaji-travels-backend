import Booking from "../../models/Booking.js";
import Trip from "../../models/Trip.js";
const generatePNR = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SHT${Date.now().toString().slice(-6)}${random}`;
};

export const createBooking = async (req, res) => {
  try {
    const {
      customerName,
      mobile,
      email,
      tripId,
      boardingPoint,
      droppingPoint,
      passengers,
      paymentMethod,
    } = req.body;

    if (!customerName || !mobile || !tripId || !boardingPoint || !droppingPoint) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Passengers are required",
      });
    }

    const seatNumbers = passengers.map((p) => p.seatNumber?.trim()).filter(Boolean);

    if (seatNumbers.length !== passengers.length) {
      return res.status(400).json({
        success: false,
        message: "Every passenger must have a seat number",
      });
    }

    const uniqueSeats = [...new Set(seatNumbers)];
    if (uniqueSeats.length !== seatNumbers.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate seats selected",
      });
    }

    const trip = await Trip.findById(tripId).populate("bus route");
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const alreadyBooked = seatNumbers.filter((seat) =>
      trip.bookedSeats.includes(seat)
    );

    if (alreadyBooked.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seats already booked: ${alreadyBooked.join(", ")}`,
      });
    }

    const totalAmount = seatNumbers.length * trip.price;

    const booking = await Booking.create({
      customerName,
      mobile,
      email: email || "",
      bus: trip.bus._id,
      route: trip.route._id,
      trip: trip._id,
      journeyDate: trip.tripDate,
      boardingPoint,
      droppingPoint,
      passengers,
      seatNumbers,
      totalAmount,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      pnr: generatePNR(),
    });

    trip.bookedSeats.push(...seatNumbers);
    await trip.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("bus")
      .populate("route")
      .populate("trip");

    res.status(201).json({
      success: true,
      message: "Booking confirmed",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("bus")
      .populate("route")
      .populate("trip")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("getBookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("bus")
      .populate("route")
      .populate("trip");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    const trip = await Trip.findById(booking.trip);
    if (trip) {
      trip.bookedSeats = trip.bookedSeats.filter(
        (seat) => !booking.seatNumbers.includes(seat)
      );
      await trip.save();
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};