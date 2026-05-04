import Bus from "../models/Bus.js";

export const getBuses = async (req, res) => {
  try {
    const { search = "", status = "", sort = "latest" } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { busNumber: { $regex: search, $options: "i" } },
        { busName: { $regex: search, $options: "i" } },
        { busType: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const buses = await Bus.find(query).sort(sortOption);

    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch buses", error: error.message });
  }
};