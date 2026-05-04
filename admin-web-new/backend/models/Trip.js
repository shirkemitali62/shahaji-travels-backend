import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    deck: { type: String, default: "Single" },
    type: { type: String, default: "Seater" },
    price: { type: Number, default: 0 },
    isBooked: { type: Boolean, default: false },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripName: {
      type: String,
      required: true,
      trim: true,
    },
    busName: {
      type: String,
      required: true,
      trim: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    travelDate: {
      type: String,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
      default: 0,
    },
    seats: {
      type: [seatSchema],
      default: [],
    },
    status: {
      type: String,
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);