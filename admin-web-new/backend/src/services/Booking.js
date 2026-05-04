import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    passengerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    age: {
      type: Number,
      default: 18,
    },
    boardingPoint: {
      type: String,
      default: "",
    },
    droppingPoint: {
      type: String,
      default: "",
    },
    paymentMode: {
      type: String,
      enum: ["UPI", "Cash", "Card"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Refunded"],
      default: "Pending",
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    bookingDate: {
      type: String,
      required: true,
    },
    seatNo: {
      type: String,
      default: "",
    },
    ticketStatus: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Pending"],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);