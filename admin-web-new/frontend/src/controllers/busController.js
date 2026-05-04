import Bus from "../models/Bus.js";

export const addBus = async (req, res) => {
  try {
    console.log("BODY:", req.body); // debug

    const {
      name,
      numberPlate,
      type,
      totalSeats,
      price,
      status,
    } = req.body;

    const newBus = new Bus({
      name,
      numberPlate,
      type,
      totalSeats,
      price,
      status,
    });

    await newBus.save();

    res.status(201).json({
      success: true,
      message: "Bus added successfully",
      data: newBus,
    });

  } catch (error) {
    console.log("ADD BUS ERROR:", error); // 🔥 MAIN DEBUG

    res.status(500).json({
      success: false,
      message: "Error adding bus",
      error: error.message,
    });
  }
};