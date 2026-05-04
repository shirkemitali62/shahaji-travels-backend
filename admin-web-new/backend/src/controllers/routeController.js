import Route from "../models/Route.js";

export const getRoutes = async (req, res) => {
  try {
    const { search = "", status = "", sort = "latest" } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fromCity: { $regex: search, $options: "i" } },
        { toCity: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const routes = await Route.find(query).sort(sortOption);

    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch routes", error: error.message });
  }
};