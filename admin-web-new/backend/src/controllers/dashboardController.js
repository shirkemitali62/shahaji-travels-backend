import Booking from "../models/Booking.js";
import Bus from "../models/Bus.js";
import Trip from "../models/Trip.js";
import Customer from "../models/Customer.js";
import Route from "../models/Route.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalBookings = await Booking.countDocuments();
    const todayBookings = await Booking.countDocuments({ bookingDate: today });
    const totalBuses = await Bus.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalTrips = await Trip.countDocuments();

    const cancelledBookings = await Booking.countDocuments({
      ticketStatus: "Cancelled",
    });

    const paidBookings = await Booking.find({ paymentStatus: "Paid" });
    const totalRevenue = paidBookings.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const todayRevenueData = await Booking.find({
      bookingDate: today,
      paymentStatus: "Paid",
    });

    const todayRevenue = todayRevenueData.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const recentBookings = await Booking.find()
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "bus", model: "Bus" },
          { path: "route", model: "Route" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const routeWiseRaw = await Booking.find()
      .populate({
        path: "trip",
        populate: [{ path: "route", model: "Route" }],
      });

    const routeMap = {};

    routeWiseRaw.forEach((booking) => {
      const route = booking?.trip?.route;
      if (!route) return;

      const routeName = `${route.fromCity} - ${route.toCity}`;
      routeMap[routeName] = (routeMap[routeName] || 0) + 1;
    });

    const topRoutes = Object.entries(routeMap)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const confirmedBookings = await Booking.countDocuments({
      ticketStatus: "Confirmed",
    });

    const occupancy =
      totalTrips > 0 ? Math.min(100, Math.round((confirmedBookings / totalTrips) * 10)) : 0;

    res.json({
      totalBookings,
      todayBookings,
      totalBuses,
      totalCustomers,
      totalTrips,
      cancelledBookings,
      totalRevenue,
      todayRevenue,
      occupancy,
      topRoutes,
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats",
      error: error.message,
    });
  }
};