import Trip from "../models/Trip.js";

export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("bus")
      .populate("route")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("getTrips error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trips",
      error: error.message,
    });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("bus")
      .populate("route");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error("getTripById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trip",
      error: error.message,
    });
  }
};