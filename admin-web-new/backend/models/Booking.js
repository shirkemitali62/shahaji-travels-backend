import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, trim: true },
    seatNumber: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: "" },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", default: null }, // Required kadhun null kela
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    journeyDate: { type: String },
    boardingPoint: { type: String },
    droppingPoint: { type: String },
    passengers: [passengerSchema], // Admin madhun yeताना ha array asayla hava
    seatNumbers: [String],
    totalAmount: Number,
    paymentMethod: String,
    paymentStatus: String,
    bookingStatus: String,
    pnr: { type: String, unique: true, sparse: true }, // 'sparse' mule duplicate null cha error yenar nahi
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);