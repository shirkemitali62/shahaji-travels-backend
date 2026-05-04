import Booking from "../models/Booking.js";
import Bus from "../models/Bus.js";
import Trip from "../models/Trip.js";

export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const todayBookings = await Booking.countDocuments({ bookingDate: today });

    const todayRevenueData = await Booking.find({
      bookingDate: today,
      paymentStatus: "Paid",
    });

    const todayRevenue = todayRevenueData.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const activeBuses = await Bus.countDocuments({ status: "Active" });

    const cancelledBookings = await Booking.countDocuments({
      ticketStatus: "Cancelled",
    });

    const recentBookings = await Booking.find()
      .populate("customer")
      .populate({
        path: "trip",
        populate: ["bus", "route"],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalTrips = await Trip.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      ticketStatus: "Confirmed",
    });

    const occupancy = totalTrips > 0 ? Math.min(100, confirmedBookings * 10) : 0;

    res.json({
      todayBookings,
      todayRevenue,
      activeBuses,
      cancelledBookings,
      occupancy,
      topRoutes: [],
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};