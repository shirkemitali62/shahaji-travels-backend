import Customer from "../models/Customer.js";

export const getCustomers = async (req, res) => {
  try {
    const { search = "", status = "", sort = "latest" } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const customers = await Customer.find(query).sort(sortOption);

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers", error: error.message });
  }
};