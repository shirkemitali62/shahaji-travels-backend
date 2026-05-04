const busSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  number:        { type: String, required: true, trim: true },
  busNumber:     { type: String, trim: true },
  numberPlate:   { type: String, trim: true },
  type:          { type: String, trim: true, default: "" },
  from:          { type: String, default: "" },
  to:            { type: String, default: "" },
  seats:         { type: Number, default: 36 },
  totalSeats:    { type: Number, default: 36 },
  price:         { type: Number, default: 0 },
  seaterPrice:   { type: Number, default: 0 },   // ✅ हे add करा
  sleeperPrice:  { type: Number, default: 0 },   // ✅ हे add करा
  departureTime: { type: String, default: "" },
  departure:     { type: String, default: "" },
  arrivalTime:   { type: String, default: "" },
  arrival:       { type: String, default: "" },
  duration:      { type: String, default: "" },
  date:          { type: String, default: "" },
  status:        { type: String, enum: ["Active","Inactive"], default: "Active" },
  blockedSeats: [String],
ladiesSeats: [String],
}, { timestamps: true });