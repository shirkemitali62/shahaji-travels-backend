import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    fromCity: {
      type: String,
      required: true,
      trim: true,
    },
    toCity: {
      type: String,
      required: true,
      trim: true,
    },
    boardingPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    droppingPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    distanceKm: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Route", routeSchema);