import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
// ─── FIREBASE ADMIN SDK ───────────────────────────────────────────
import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized");
    } else {
      console.log("⚠️ Firebase not configured - FCM disabled");
    }
  } catch (e) {
    console.log("⚠️ Firebase init failed:", e.message);
  }
}
const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json({ limit: "10mb" }));

// ─── STATIC: ticket PDFs ───────────────────────────────────────────
const ticketsDir = path.join(process.cwd(), "tickets");
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });
app.use("/tickets", express.static(ticketsDir));

// ─── MONGODB CONNECTION ────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb://mitali27:Shahaji2027@ac-nzzrlco-shard-00-00.jxe13f4.mongodb.net:27017,ac-nzzrlco-shard-00-01.jxe13f4.mongodb.net:27017,ac-nzzrlco-shard-00-02.jxe13f4.mongodb.net:27017/shahaji?ssl=true&replicaSet=atlas-525bs5-shard-0&authSource=admin&retryWrites=true&w=majority";
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ─── MONGOOSE SCHEMAS ─────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ["info", "offer", "alert", "update"], default: "info" },
  source:  { type: String, default: "system" },
  userId:  { type: String, default: "" }, // ✅ specific user
  phone:   { type: String, default: "" }, // ✅ phone ने match
  sentAt:  { type: Date, default: Date.now },
}, { timestamps: true });
const Notification = mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
const adminSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  type:     { type: String, default: "admin" },
  role:     { type: String, enum: ["superadmin", "subadmin"], default: "superadmin" },
  permissions: [{
    type: String,
    enum: ["buses", "routes", "trips", "customers", "bookings", "offers", "reports", "settings", "notifications", "qr", "backup", "popular", "busreport", "refunds"]
  }]
}, { timestamps: true });
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
const offerSchema = new mongoose.Schema({
  title:         { type: String, default: "" },
  name:          { type: String, default: "" },
  description:   { type: String, default: "" },
  code:          { type: String, default: "", uppercase: true },
  couponCode:    { type: String, default: "" },
  discountType:  { type: String, enum: ["flat","percentage"], default: "flat" },
  discount:      { type: Number, default: 0 },
  discountValue: { type: Number, default: 0 },
  minAmount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiry:        { type: String, default: "" },
}, { timestamps: true });
const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);
 
// 2. Popular Routes Schema
const popularRouteSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },

  // ✅ NEW
  boardingPoints: { type: [String], default: [] },
  droppingPoints: { type: [String], default: [] },

  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });
const PopularRoute = mongoose.models.PopularRoute || mongoose.model("PopularRoute", popularRouteSchema);
// ✅ FIX: Both departure/departureTime and arrival/arrivalTime fields added
const busSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  number:        { type: String, required: true, trim: true },
  busNumber:     { type: String, trim: true },
  numberPlate:   { type: String, trim: true },
  type:          { type: String, trim: true, default: "" },
  from:          { type: String, required: true, default: "" },
  to:            { type: String, required: true, default: "" },
  seats:         { type: Number, default: 36 },
  totalSeats:    { type: Number, default: 36 },
  price:         { type: Number, default: 0 },
  seaterPrice:   { type: Number, default: 0 },
  sleeperPrice:  { type: Number, default: 0 },
  departureTime: { type: String, default: "" },
  departure:     { type: String, default: "" },
  arrivalTime:   { type: String, default: "" },
  arrival:       { type: String, default: "" },
  duration:      { type: String, default: "" },
  date:          { type: String, default: "" },
  time:          { type: String, default: "" },
  status:        { type: String, enum: ["Active","Inactive"], default: "Active" },
  blockedSeats:  { type: [String], default: [] },
  ladiesSeats:   { type: [String], default: [] },
  
  seatDetails: [{
    seatNo:        { type: String, required: true },
    isBooked:      { type: Boolean, default: false },
    isBlocked:     { type: Boolean, default: false },
    passengerName: { type: String, default: "" },
    gender:        { type: String, default: "" },
    bookingId:     { type: String, default: "" },
  }],
}, { timestamps: true });

delete mongoose.models.Bus;
const Bus = mongoose.model("Bus", busSchema);
const upiPaymentSchema = new mongoose.Schema({
  bookingId:   { type: String, required: true, unique: true },
  orderId:     { type: String, default: "" },
  utr:         { type: String, default: "", trim: true, uppercase: true },
  amount:      { type: Number, required: true },
  payeeName:   { type: String, default: "Shahaji Travels" },
  upiId:       { type: String, default: "" },
  status:      { type: String, enum: ["pending", "success", "failed", "expired"], default: "pending" },
  userId:      { type: String, default: "" },
  phone:       { type: String, default: "" },
  busId:       { type: String, default: "" },
  journeyDate: { type: String, default: "" },
  retryCount:  { type: Number, default: 0 },
  verifiedAt:  { type: Date, default: null },
  expiresAt:   { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
}, { timestamps: true });
 
// UTR unique index (prevent duplicate payments)
upiPaymentSchema.index({ utr: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { utr: { $exists: true, $ne: "" } }  // ✅ empty string exclude
});
 
const UPIPayment = mongoose.models.UPIPayment || mongoose.model("UPIPayment", upiPaymentSchema);

const routeSchema = new mongoose.Schema({
  name:            { type: String, trim: true },
  from:            { type: String, trim: true, default: "" },
  to:              { type: String, trim: true, default: "" },
  boardingPoints:  { type: Array, default: [] },
  droppingPoints:  { type: Array, default: [] },
  distance:        { type: Number, default: 0 },
  status:          { type: String, enum: ["Active","Inactive"], default: "Active" },
}, { timestamps: true });
const Route = mongoose.models.Route || mongoose.model("Route", routeSchema);

const tripSchema = new mongoose.Schema({
  name:            { type: String, trim: true, default: "" },
  tripName:        { type: String, trim: true, default: "" },
  routeId:         { type: String, default: "" },
  route:           { type: String, default: "" },
  routeName:       { type: String, default: "" },
  date:            { type: String, default: "" },
  travelDate:      { type: String, default: "" },
  time:            { type: String, default: "" },
  departureTime:   { type: String, default: "" },
  bus:             { type: String, default: "" },
  busName:         { type: String, default: "" },
  price:           { type: Number, default: 0 },
  fare:            { type: Number, default: 0 },
  status:          { type: String, enum: ["Active","Inactive"], default: "Active" },
  boardingPoints:  { type: Array, default: [] },
  droppingPoints:  { type: Array, default: [] },
  ladiesSeats:     { type: [String], default: [] },
  blockedSeats:    { type: [String], default: [] },
  seats:           { type: Array, default: [] },
}, { timestamps: true });
const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

const bookingSchema = new mongoose.Schema({
  passengerName:  { type: String, trim: true, default: "" },
  customerName:   { type: String, trim: true, default: "" },
  phone:          { type: String, trim: true, default: "" },
  mobile:         { type: String, trim: true, default: "" },
  email:          { type: String, trim: true, default: "" },
  age:            { type: Number, default: 0 },
  gender:         { type: String, default: "Male" },
  tripId:         { type: String, default: "" },
  bus:            { type: String, default: "" },
  baseAmount:     { type: Number, default: 0 },
  route:          { type: String, default: "" },
  trip:           { type: String, default: "" },
  journeyDate:    { type: String, default: "" },
  date:           { type: String, default: "" },
  boardingPoint:  { type: String, default: "" },
  droppingPoint:  { type: String, default: "" },
  busNo:          { type: String, default: "" },
  busName:        { type: String, default: "" },
  seatNo:         { type: String, default: "" },
  seatNumbers:    { type: [String], default: [] },
  amount:         { type: Number, default: 0 },
  totalAmount:    { type: Number, default: 0 },
  paymentMode:    { type: String, default: "Cash" },
  paymentMethod:  { type: String, default: "Cash" },
  paymentStatus:  { type: String, default: "Pending" },
  refundStatus:   { type: String, default: "Not Applicable" },
  bookingStatus:  { type: String, default: "Confirmed" },
  bookingCode:    { type: String, default: "" },
  pnr:            { type: String, default: null, sparse: true },
  conductorNote:  { type: String, default: "" },
  passengers:     { type: Array, default: [] },
  refundAmount:   { type: Number, default: 0 },
refundPercent:  { type: Number, default: 0 },
cancelledAt:    { type: Date, default: null },
}, { timestamps: true });

bookingSchema.index({ pnr: 1 }, { unique: true });

bookingSchema.pre("save", function () {
  if (!this.passengerName && this.customerName) this.passengerName = this.customerName;
  if (!this.customerName && this.passengerName) this.customerName = this.passengerName;
  if (!this.phone && this.mobile)  this.phone  = this.mobile;
  if (!this.mobile && this.phone)  this.mobile = this.phone;
  if (!this.amount && this.totalAmount)    this.amount      = this.totalAmount;
  if (!this.totalAmount && this.amount)    this.totalAmount = this.amount;
  if (!this.paymentMode && this.paymentMethod)  this.paymentMode   = this.paymentMethod;
  if (!this.paymentMethod && this.paymentMode)  this.paymentMethod = this.paymentMode;
  if (!this.seatNo && this.seatNumbers?.length) this.seatNo = this.seatNumbers[0];
  if (!this.seatNumbers?.length && this.seatNo) this.seatNumbers = [this.seatNo];
  if (!this.bookingCode && !this.pnr) {
    const code = "BK" + String(Date.now()).slice(-8) + Math.floor(Math.random()*100);
    this.bookingCode = code;
    this.pnr = code;
  }
  if (!this.bookingCode && this.pnr) this.bookingCode = this.pnr;
  if (!this.pnr && this.bookingCode) this.pnr = this.bookingCode;
});

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

const customerSchema = new mongoose.Schema({
  name:          { type: String, trim: true, default: "" },
  fullName:      { type: String, trim: true, default: "" },
  phone:         { type: String, trim: true, default: "" },
  email:         { type: String, trim: true, lowercase: true, default: "" },
  password:      { type: String, default: "" },
  city:          { type: String, default: "" },
  status:        { type: String, enum: ["Active","Inactive"], default: "Active" },
  totalBookings: { type: Number, default: 0 },
  wallet:        { type: Number, default: 0 },
  otp:           { type: String, default: null },
}, { timestamps: true });
const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
const SettingsSchema = new mongoose.Schema({
  company: String,
  phone: String,
  email: String,
  currency: String,
  contactPhone1: String,   // ✅ ADD
  contactPhone2: String,   // ✅ ADD
   cashPaymentEnabled: { type: Boolean, default: true },
  cashOverridePhones: { type: [String], default: [] }
});

const Settings = mongoose.model("Settings", SettingsSchema);
// ─── DEVICE FINGERPRINT SCHEMA ────────────────────────────────────
const allowedDeviceSchema = new mongoose.Schema({
  adminEmail:  { type: String, required: true },
  fingerprint: { type: String, required: true },
  deviceName:  { type: String, default: "Unknown Device" },
  status:      { type: String, enum: ["approved", "pending"], default: "pending" },
  addedAt:     { type: Date, default: Date.now },
});
const AllowedDevice = mongoose.models.AllowedDevice ||
  mongoose.model("AllowedDevice", allowedDeviceSchema);
// ─── QR PAYMENT SETTINGS ─────────────────────────────────────────
const qrSettingsSchema = new mongoose.Schema({
  upiId:          { type: String, default: "shmitali27@okhdfcbank" },
  upiName:        { type: String, default: "KAVIRAJ KRISHNAT BARGE" },
  qrImageBase64:  { type: String, default: "", maxlength: 5000000 }, // ✅ 5MB limit add
  qrEnabled:      { type: Boolean, default: true },
  razorpayEnabled:{ type: Boolean, default: true },
  cashEnabled:    { type: Boolean, default: true },
  updatedAt:      { type: Date, default: Date.now },
});
const QRSettings = mongoose.models.QRSettings ||
  mongoose.model("QRSettings", qrSettingsSchema);
// ─── MULTILINGUAL POINT DATA ──────────────────────────────────────
const KARAD_TO_MUMBAI_BOARDING = [
  { en:"Sanbur",                mr:"सांबूर",               hi:"सांबुर" },
  { en:"Banpuri",               mr:"बनपुरी",               hi:"बनपुरी" },
  { en:"Janugadewadi",          mr:"जानुगडेवाडी",           hi:"जानुगडेवाड़ी" },
  { en:"Dhebewadi",             mr:"धेबेवाडी",             hi:"धेबेवाड़ी" },
  { en:"Maldan",                mr:"मालदन",                hi:"मालदन" },
  { en:"Gudhe",                 mr:"गुढे",                 hi:"गुढे" },
  { en:"Talmavle",              mr:"ताळमावले",             hi:"ताळमावले" },
  { en:"Karpewadi",             mr:"कारपेवाडी",            hi:"कारपेवाड़ी" },
  { en:"Manegav",               mr:"मानेगाव",              hi:"मानेगाव" },
  { en:"Kadhne",                mr:"काढणे",                hi:"काढणे" },
  { en:"Tarukh",                mr:"तारूख",                hi:"तारुख" },
  { en:"Kusur",                 mr:"कुसूर",                hi:"कुसूर" },
  { en:"Kolewadi",              mr:"कोळेवाडी",             hi:"कोलेवाड़ी" },
  { en:"Kole",                  mr:"कोळे",                 hi:"कोले" },
  { en:"Gharewadi",             mr:"घारेवाडी",             hi:"घारेवाड़ी" },
  { en:"Shindewadi",            mr:"शिंदेवाडी",            hi:"शिंदेवाड़ी" },
  { en:"Ving",                  mr:"विंग",                 hi:"विंग" },
  { en:"Chachegaon",            mr:"चाचेगाव",              hi:"चाचेगाव" },
  { en:"Aagashiv Nagar",        mr:"आगाशिव नगर",           hi:"आगाशिव नगर" },
  { en:"Dhebewadi Fata",        mr:"धेबेवाडी फाटा",        hi:"धेबेवाड़ी फाटा" },
  { en:"Karad",                 mr:"कराड",                 hi:"कराड" },
  { en:"Varunji Fata",          mr:"वारुंजी फाटा",         hi:"वारुंजी फाटा" },
  { en:"Gote",                  mr:"गोटे",                 hi:"गोटे" },
  { en:"Khodshi",               mr:"खोडशी",                hi:"खोडशी" },
  { en:"Vahagaon",              mr:"वाहागाव",              hi:"वाहागाव" },
  { en:"Talbeed",               mr:"ताळबीड",               hi:"ताळबीड" },
  { en:"Tasawade Toll Plaza",   mr:"तासावडे टोल नाका",    hi:"तासावडे टोल प्लाजा" },
  { en:"Umbraj",                mr:"उंब्रज",               hi:"उंब्रज" },
  { en:"Indoli",                mr:"इंदोली",               hi:"इंदोली" },
  { en:"Kashil",                mr:"काशील",                hi:"काशील" },
  { en:"Atith",                 mr:"आटीत",                 hi:"आटीत" },
  { en:"Nisrale Fata",          mr:"निसराळे फाटा",         hi:"निसराले फाटा" },
  { en:"Nagthane",              mr:"नागठाणे",              hi:"नागठाणे" },
  { en:"Borgaon",               mr:"बोरगाव",               hi:"बोरगाव" },
  { en:"Shendre",               mr:"शेंद्रे",              hi:"शेंद्रे" },
  { en:"Satara",                mr:"सातारा",               hi:"सातारा" },
  { en:"Aanewadi Toll Plaza",   mr:"आणेवाडी टोल नाका",    hi:"आणेवाड़ी टोल प्लाजा" },
  { en:"Pachwad",               mr:"पाचवड",                hi:"पाचवड" },
  { en:"Bhuinj",                mr:"भुईंज",                hi:"भुईंज" },
  { en:"Surur",                 mr:"सुरूर",                hi:"सुरूर" },
  { en:"Vele",                  mr:"वेळे",                 hi:"वेले" },
  { en:"Khandala",              mr:"खंडाळा",               hi:"खंडाला" },
  { en:"Shirval",               mr:"शिरवळ",                hi:"शिरवल" },
  { en:"Khed Shivapur",         mr:"खेड शिवापूर",          hi:"खेड शिवापुर" },
  { en:"Navle Bridge (Katraj)", mr:"नवले ब्रिज (कात्रज)",  hi:"नवले ब्रिज (कात्रज)" },
  { en:"Varje",                 mr:"वारजे",                hi:"वारजे" },
  { en:"Chandani Chowk",        mr:"चांदणी चौक",           hi:"चांदनी चौक" },
  { en:"Vakad",                 mr:"वाकड",                 hi:"वाकड" },
  { en:"Ravet",                 mr:"रावेत",                hi:"रावेत" },
];

const KARAD_TO_MUMBAI_DROPPING = [
  { en:"Kalamboli",                  mr:"कळंबोळी",                  hi:"कलंबोली" },
  { en:"Kamotha",                    mr:"कामोठे",                    hi:"कामोठे" },
  { en:"Kharghar",                   mr:"खारघर",                    hi:"खारघर" },
  { en:"Nerul",                      mr:"नेरुळ",                    hi:"नेरुल" },
  { en:"Jui Nagar",                  mr:"जुई नगर",                  hi:"जुई नगर" },
  { en:"Sanpada",                    mr:"सानपाडा",                   hi:"सानपाडा" },
  { en:"Vashi",                      mr:"वाशी",                     hi:"वाशी" },
  { en:"Mankhurd",                   mr:"मानखुर्द",                 hi:"मानखुर्द" },
  { en:"Mankhurd Station",           mr:"मानखुर्द स्टेशन",          hi:"मानखुर्द स्टेशन" },
  { en:"Chembur (Maitri Park)",      mr:"चेंबूर (मैत्री पार्क)",    hi:"चेंबुर (मैत्री पार्क)" },
  { en:"Ghatla",                     mr:"घाटला",                    hi:"घाटला" },
  { en:"Shivaji Nagar",              mr:"शिवाजी नगर",               hi:"शिवाजी नगर" },
  { en:"Kamraj Nagar",               mr:"कामराज नगर",               hi:"कामराज नगर" },
  { en:"Nalanda Bus Stop",           mr:"नालंदा बस स्टॉप",          hi:"नालंदा बस स्टॉप" },
  { en:"Ramabai",                    mr:"रमाबाई",                   hi:"रमाबाई" },
  { en:"Ghatkopar Depo",             mr:"घाटकोपर डेपो",             hi:"घाटकोपर डिपो" },
  { en:"Ghatkopar Shreyas",          mr:"घाटकोपर श्रेयस",           hi:"घाटकोपर श्रेयस" },
  { en:"Ghatkopar R City Mall",      mr:"घाटकोपर आर सिटी मॉल",     hi:"घाटकोपर आर सिटी मॉल" },
  { en:"Vikhroli Depo",              mr:"विक्रोळी डेपो",            hi:"विक्रोली डिपो" },
  { en:"Vikhroli Station",           mr:"विक्रोळी स्टेशन",          hi:"विक्रोली स्टेशन" },
  { en:"Vikhroli Surya Nagar",       mr:"विक्रोळी सूर्यनगर",        hi:"विक्रोली सूर्यनगर" },
  { en:"Vikhroli Gandhinagar",       mr:"विक्रोळी गांधीनगर",        hi:"विक्रोली गांधीनगर" },
  { en:"Powai IIT",                  mr:"पवई IIT",                  hi:"पवई IIT" },
  { en:"Powai IIT Main Gate",        mr:"पवई IIT मेन गेट",          hi:"पवई IIT मेन गेट" },
  { en:"Powai Talav",                mr:"पवई तळाव",                 hi:"पवई तालाव" },
  { en:"Milind Nagar",               mr:"मिलिंद नगर",               hi:"मिलिंद नगर" },
  { en:"Seepaz",                     mr:"सीपझ",                     hi:"सीपज़" },
  { en:"Sariput Nagar",              mr:"सारीपुत नगर",              hi:"सारिपुत नगर" },
  { en:"Matoshri",                   mr:"मातोश्री",                 hi:"मातोश्री" },
  { en:"Durga Nagar",                mr:"दुर्गा नगर",               hi:"दुर्गा नगर" },
  { en:"Shyam Nagar",                mr:"श्याम नगर",                hi:"श्याम नगर" },
  { en:"Ramwadi",                    mr:"रामवाडी",                  hi:"रामवाड़ी" },
  { en:"Jaycoach",                   mr:"जयकोच",                    hi:"जयकोच" },
  { en:"Mahananda",                  mr:"महानंदा",                  hi:"महानंदा" },
  { en:"Goregaon Check Naka",        mr:"गोरेगाव चेकनाका",          hi:"गोरेगाव चेकनाका" },
  { en:"Goregaon Virwani",           mr:"गोरेगाव विरवाणी",          hi:"गोरेगाव विरवाणी" },
  { en:"Pathanwadi",                 mr:"पठाणवाडी",                 hi:"पठानवाड़ी" },
  { en:"Malad Shantaram Talav",      mr:"मालाड शांताराम तळाव",     hi:"मालाड शांताराम तालाव" },
  { en:"Malad Pushpa Park",          mr:"मालाड पुष्पा पार्क",       hi:"मालाड पुष्पा पार्क" },
  { en:"Kandivali Samta Nagar",      mr:"कांदिवली समता नगर",        hi:"कांदिवली समता नगर" },
  { en:"Mahindra Gate",              mr:"महिंद्रा गेट",             hi:"महिंद्रा गेट" },
  { en:"Sai Dham",                   mr:"साई धाम",                  hi:"साई धाम" },
  { en:"Borivali Tata Power",        mr:"बोरिवली टाटा पॉवर",        hi:"बोरिवली टाटा पावर" },
  { en:"Borivali Station",           mr:"बोरिवली स्टेशन",           hi:"बोरिवली स्टेशन" },
  { en:"Chikuwadi",                  mr:"चिकुवाडी",                 hi:"चिकुवाड़ी" },
  { en:"Mahaveer Nagar",             mr:"महावीर नगर",               hi:"महावीर नगर" },
  { en:"Ganesh Chowk",               mr:"गणेश चौक",                 hi:"गणेश चौक" },
  { en:"Bandar Pakhadi",             mr:"बंदर पाखाडी",              hi:"बंदर पखाड़ी" },
  { en:"Charkop Sahyadri Nagar",     mr:"चारकोप सह्याद्री नगर",    hi:"चारकोप सह्याद्री नगर" },
];

const MUMBAI_TO_KARAD_BOARDING = [...KARAD_TO_MUMBAI_DROPPING].reverse();
const MUMBAI_TO_KARAD_DROPPING = [...KARAD_TO_MUMBAI_BOARDING].reverse();

// ─── ROUTE DETECTION ──────────────────────────────────────────────
const KARAD_KEYWORDS  = ["karad","कराड","करड"];
const MUMBAI_KEYWORDS = ["mumbai","मुंबई","bombay"];

function isKarad(city)  { const c=(city||"").toLowerCase(); return KARAD_KEYWORDS.some(k=>c.includes(k)); }
function isMumbai(city) { const c=(city||"").toLowerCase(); return MUMBAI_KEYWORDS.some(k=>c.includes(k)); }

function getPointsForRoute(from, to) {
  if (isKarad(from)  && isMumbai(to)) return { boarding: KARAD_TO_MUMBAI_BOARDING, dropping: KARAD_TO_MUMBAI_DROPPING };
  if (isMumbai(from) && isKarad(to))  return { boarding: MUMBAI_TO_KARAD_BOARDING, dropping: MUMBAI_TO_KARAD_DROPPING };
  return { boarding: KARAD_TO_MUMBAI_BOARDING, dropping: KARAD_TO_MUMBAI_DROPPING };
}

function formatPoints(list) {
  return list.map((p, i) => ({
    id: i + 1,
    name: p.mr,
    nameEn: p.en,
    nameMr: p.mr,
    nameHi: p.hi,
    time: "",
  }));
}
async function sendFCMToAll(title, body) {
  try {
    const tokensData = await FCMToken.find({});
    if (!tokensData.length) {
      
      return { success: 0, failure: 0 };
    }

    const tokens = tokensData.map(t => t.token).filter(Boolean);
    console.log(`📨 Sending to ${tokens.length} device(s)...`);

    // Batch of 500 (FCM limit)
    const BATCH = 500;
    let totalSuccess = 0, totalFailure = 0;
    const toRemove = [];

    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "shahaji_channel",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code || "";
          console.log(`❌ Token failed [${code}]: ${batch[idx]?.slice(0,20)}...`);
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            toRemove.push(batch[idx]);
          }
        }
      });
    }

    // Invalid tokens cleanup
    if (toRemove.length) {
      await FCMToken.deleteMany({ token: { $in: toRemove } });
      console.log(`🗑️ Removed ${toRemove.length} invalid token(s)`);
    }

    console.log(`✅ FCM done: ${totalSuccess} sent, ${totalFailure} failed`);
    return { success: totalSuccess, failure: totalFailure };

  } catch (err) {
    console.error("❌ FCM sendFCMToAll error:", err.message);
    return { success: 0, failure: 0, error: err.message };
  }
}
 
// ─── HELPERS ─────────────────────────────────────────────────────
function generateTripSeats(busType, baseFare) {
  const seats = [];
  if (busType === "AC Sleeper") {
    for (let i=1;i<=12;i++) seats.push({ seatNumber:`V${i}`, deck:"Lower", type:"Sleeper",      price:baseFare, isBooked:false });
    for (let i=1;i<=6;i++)  seats.push({ seatNumber:`A${i}`, deck:"Upper", type:"Sleeper",      price:baseFare, isBooked:false });
  } else if (busType === "AC Seater") {
    for (let i=1;i<=40;i++) seats.push({ seatNumber:`S${i}`, deck:"Single", type:"Seater",      price:baseFare, isBooked:false });
  } else if (busType === "Semi-Sleeper") {
    for (let i=1;i<=30;i++) seats.push({ seatNumber:`SS${i}`,deck:"Single", type:"Semi-Sleeper",price:baseFare, isBooked:false });
  } else {
    for (let i=1;i<=35;i++) seats.push({ seatNumber:`N${i}`, deck:"Single", type:"Seater",      price:baseFare, isBooked:false });
  }
  return seats;
}
// ─── SEAT LOCK SCHEMA ─────────────────────────────────────────────
const seatLockSchema = new mongoose.Schema({
  busId:     { type: String, required: true },
  date:      { type: String, required: true },
  seats:     { type: [String], required: true },
  lockedBy:  { type: String, default: "" },
  expiresAt: { type: Date, required: true },
});
const SeatLock = mongoose.models.SeatLock || mongoose.model("SeatLock", seatLockSchema);
const fcmTokenSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true },
  userId:    { type: String, default: "" },
  phone:     { type: String, default: "" },
  platform:  { type: String, default: "android" },
  createdAt: { type: Date,   default: Date.now },
});
const FCMToken = mongoose.models.FCMToken || 
  mongoose.model("FCMToken", fcmTokenSchema);

app.post("/api/save-token", async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: "No token" });

  const exists = await FCMToken.findOne({ token });
  if (!exists) {
    await FCMToken.create({ token });
  }

  res.json({ success: true });
});

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status:"ok", message:"Shahaji Travels Backend Running ✅" }));
app.get("/api/health", (req, res) => res.json({ status:"ok", db: mongoose.connection.readyState===1?"connected":"disconnected" }));

// ─── ADMIN AUTH ───────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, fingerprint, deviceInfo } = req.body;
    if (!email||!password) 
      return res.status(400).json({ success:false, message:"Email and password required" });
    
    const admin = await Admin.findOne({ email:email.toLowerCase(), password });
    if (!admin) 
      return res.status(401).json({ success:false, message:"Invalid email or password" });

    // Fingerprint नाही → old login, allow कर
    if (!fingerprint) {
     return res.json({ 
  success: true, 
  message: "Login successful", 
  admin: { 
    email: admin.email,
    role: admin.role || "superadmin",
    permissions: admin.permissions || []
  } 
});
    }

    const devices = await AllowedDevice.find({ 
      adminEmail: email.toLowerCase(),
      status: "approved"
    });

    // पहिल्यांदा login — कोणताही device नाही — auto approve
    if (devices.length === 0) {
      await AllowedDevice.create({
        adminEmail: email.toLowerCase(),
        fingerprint,
        deviceName: deviceInfo || "Primary Device",
        status: "approved",
      });
     res.json({ success:true, message:"Login successful", admin:{ email:admin.email, role:admin.role||"superadmin", permissions:admin.permissions||[] } });
    }

    // Device allowed आहे का check कर
    const isAllowed = devices.some(d => d.fingerprint === fingerprint);
    
    if (!isAllowed) {
      // Pending request आधीच आहे का?
      const existing = await AllowedDevice.findOne({ 
        adminEmail: email.toLowerCase(),
        fingerprint,
        status: "pending"
      });
      
      if (!existing) {
        // नवीन pending request save कर
        await AllowedDevice.create({
          adminEmail: email.toLowerCase(),
          fingerprint,
          deviceName: deviceInfo || "New Device",
          status: "pending",
        });

        // Mitali ला FCM notification पाठव
        try {
          await sendFCMToAll(
            "🔐 New Device Login Request!",
            "Someone tried to access admin panel! Go to Settings → Devices to approve."
          );
          await Notification.create({
            title: "🔐 New Device Request",
            message: `New device tried to login. Go to Settings → Devices to approve.`,
            type: "alert",
          });
        } catch(e) {}
      }

      return res.status(403).json({ 
        success: false, 
        pending: true,
        message: "❌ हा device allowed नाही! Mitali ची permission घ्या. Request पाठवली आहे." 
      });
    }

    res.json({ success:true, message:"Login successful", admin:{ email:admin.email } });
  } catch(err) { 
    res.status(500).json({ success:false, message:"Server error" }); 
  }
});

app.get("/create-admin", async (req, res) => {
  try {
    const existing = await Admin.findOne({ email:"admin@shahajitravels.com" });
    if (existing) return res.json({ message:"Admin already exists", email:existing.email });
    await Admin.create({ email:"admin@shahajitravels.com", password:"123456" });
    res.json({ success:true, message:"Admin created! Email: admin@shahajitravels.com | Password: 123456" });
  } catch(err) { res.status(500).json({ message:err.message }); }
});


// ✅ RAZORPAY — server.js मध्ये एकदाच ठेवा
import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID     = 'rzp_test_SiAe7LkcA4ax88';
const RAZORPAY_KEY_SECRET = 'aohLAhaM9CFKa7IdkqOioluy';

const razorpay = new Razorpay({
  key_id:     RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ✅ Create Order — फक्त एकदा
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Invalid amount' });

    // Apply 2% if Razorpay (amount already has 2% added from frontend)
const order = await razorpay.orders.create({
  amount:   Math.round(amount * 100), // amount passed is already final (with 2%)
      currency: 'INR',
      receipt:  'rcpt_' + Date.now(),
    });
    res.json(order);
  } catch (err) {
    console.error('❌ Razorpay order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Payment — फक्त एकदा
app.post('/api/payment/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ success: false, message: 'Missing fields' });

    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET) // ✅ same secret
      .update(body)
      .digest('hex');

    if (expected === razorpay_signature) {
      res.json({ success: true, paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ─── MOBILE AUTH ──────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name||!phone||!password)
      return res.status(400).json({ success:false, message:"Name, phone and password required" });

    const otp = generateOtp();
    console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);

    let customer = await Customer.findOne({ $or:[{ phone },{ email:email?.toLowerCase() }] });
    if (customer) {
      customer.otp = otp;
      if (name)     customer.name     = name;
      if (email)    customer.email    = email.toLowerCase();
      if (password) customer.password = password;
      await customer.save();
    } else {
      customer = await Customer.create({
        fullName:name, name, phone,
        email: email ? email.toLowerCase() : `${phone}@shahaji.app`,
        password, otp, wallet:100, status:"Active",
      });
    }
    // ✅ Register notification
try {
  await sendFCMToAll(
    "🎉 New User Registered!",
    `${name} (${phone}) ने account create केला`
  );
  await Notification.create({
  title:   "🎉 New Registration",
  message: `...`,
  type:    "alert",  // ✅ alert = admin only
});
} catch (e) {}
    res.status(200).json({ success:true, message:"OTP sent. Check server console for OTP." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone||!otp) return res.status(400).json({ success:false, message:"Phone and OTP required" });
    const user = await Customer.findOne({ phone });
    if (!user)     return res.status(404).json({ success:false, message:"User not found. Please register first." });
    if (!user.otp) return res.status(400).json({ success:false, message:"No OTP found. Request a new OTP." });
    if (String(user.otp)!==String(otp))
      return res.status(400).json({ success:false, message:"Invalid OTP. Please try again." });
    user.otp = null;
    await user.save();
    res.json({ success:true, message:"OTP verified successfully" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success:false, message:"Phone required" });
    const user = await Customer.findOne({ phone });
    if (!user) return res.status(404).json({ success:false, message:"User not found." });
    const otp = generateOtp();
    console.log(`\n🔐 Resent OTP for ${phone}: ${otp}\n`);
    user.otp = otp;
    await user.save();
    res.json({ success:true, message:"OTP resent." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    if ((!email&&!phone)||!password)
      return res.status(400).json({ success:false, message:"Email/phone and password required" });
    const query = email
      ? { $or:[{ email:email.toLowerCase() },{ phone:email }] }
      : { phone };
    const customer = await Customer.findOne({ ...query, password });
    if (!customer) return res.status(401).json({ success:false, message:"Invalid credentials." });
    res.json({ success:true, message:"Login successful", user:customer });
    // ✅ Login notification
try {
  await sendFCMToAll(
    "👤 User Login",
    `${customer.name} (${customer.phone}) logged in`
  );
 await Notification.create({
  title:   "👤 User Login",
  message: `...`,
  type:    "alert",  // ✅ alert = admin only
});
} catch (e) {}
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.get("/api/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message:"Customer not found" });
    res.json({ success:true, user:customer });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.get("/api/wallet/:userId", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.userId);
    if (!customer) return res.status(404).json({ message:"Customer not found" });
    res.json({ success:true, balance:customer.wallet||0 });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

// ─── BUSES API ────────────────────────────────────────────────────
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await mongoose.connection.db
      .collection("buses")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, buses });
  } catch(err) {
    res.status(500).json({ success: false, buses: [], message: err.message });
  }
});
app.get("/api/buses/fix-from-to", async (req, res) => {
  try {
    // from/to empty असलेल्या buses ला Karad/Mumbai set करा
    const result = await mongoose.connection.db.collection("buses").updateMany(
      { $or: [{ from: "" }, { from: null }, { to: "" }, { to: null }] },
      { $set: { from: "Karad", to: "Mumbai" } }
    );
    
    // सर्व buses चे date format normalize करा
    const buses = await mongoose.connection.db.collection("buses").find({}).toArray();
    let dateFixed = 0;
    for (const bus of buses) {
      let newDate = bus.date;
      // DD-MM-YYYY → YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(bus.date)) {
        const [dd, mm, yyyy] = bus.date.split("-");
        newDate = `${yyyy}-${mm}-${dd}`;
      }
      // DD/MM/YYYY → YYYY-MM-DD  
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(bus.date)) {
        const [dd, mm, yyyy] = bus.date.split("/");
        newDate = `${yyyy}-${mm}-${dd}`;
      }
      if (newDate !== bus.date) {
        await mongoose.connection.db.collection("buses").updateOne(
          { _id: bus._id },
          { $set: { date: newDate } }
        );
        dateFixed++;
      }
    }
    
    res.json({ 
      success: true, 
      fromToFixed: result.modifiedCount,
      dateFixed,
      message: "Buses fixed!" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// REPLACE THIS ENTIRE BLOCK (find: app.get("/api/buses/search", async (req, res) => {)
app.get("/api/buses/search", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    if (!from?.trim() || !to?.trim() || !date?.trim())
      return res.status(400).json({ success: false, message: "from, to and date are all required" });

    // Normalize search date to YYYY-MM-DD
    let searchISO = date.trim();
if (/^\d{2}\/\d{2}\/\d{4}$/.test(searchISO)) {
  const [dd, mm, yyyy] = searchISO.split("/");
  searchISO = `${yyyy}-${mm}-${dd}`;   // 03/05/2026 → 2026-05-03
} else if (/^\d{2}-\d{2}-\d{4}$/.test(searchISO)) {
  const [dd, mm, yyyy] = searchISO.split("-");
  searchISO = `${yyyy}-${mm}-${dd}`;   // 03-05-2026 → 2026-05-03
}
    const allBuses = await mongoose.connection.db
      .collection("buses")
      .find({ status: "Active" })
      .toArray();

    // STRICT exact match — no partial, no reverse
   const filtered = allBuses.filter(b => {
  const busFrom = (b.from || "").toLowerCase().trim();
  const busTo   = (b.to   || "").toLowerCase().trim();
  const srcFrom = from.toLowerCase().trim();
  const srcTo   = to.toLowerCase().trim();
  if (busFrom !== srcFrom || busTo !== srcTo) return false;

  let busISO = (b.date || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(busISO)) {
    const [dd, mm, yyyy] = busISO.split("/");
    busISO = `${yyyy}-${mm}-${dd}`;
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(busISO)) {
    const [dd, mm, yyyy] = busISO.split("-");
    busISO = `${yyyy}-${mm}-${dd}`;
  }
  return busISO === searchISO;
});

    console.log(`🔍 SEARCH: "${from}"→"${to}" on ${searchISO} | Total buses: ${allBuses.length} | Matched: ${filtered.length}`);

    if (!filtered.length)
      return res.json({ success: true, buses: [], message: "Bus Not Found" });

    const result = filtered.map(b => ({
      id:             b._id,
      _id:            b._id,
      name:           b.name,
      type:           b.type || "AC Sleeper",
      number:         b.number || b.busNumber || b.numberPlate || "",
      price:          b.seaterPrice || b.price || 0,
      seaterPrice:    b.seaterPrice || b.price || 0,
      sleeperPrice:   b.sleeperPrice || b.price || 0,
      availableSeats: b.totalSeats || b.seats || 36,
      departure:      b.departureTime || b.departure || "",
      arrival:        b.arrivalTime   || b.arrival   || "",
      duration:       b.duration || "",
      from:           b.from,
      to:             b.to,
      date:           b.date,
      time:           b.time || b.departureTime || "",
      rating:         4.2,
      amenities:      ["AC", "Charging", "WiFi", "Water Bottle"],
      bookedSeats:    [],
    }));

    res.json({ success: true, buses: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/debug/bus-check", async (req, res) => {
  const buses = await mongoose.connection.db.collection("buses").find({}).toArray();
  res.json(buses.map(b => ({
    name: b.name,
    from: b.from,
    to:   b.to,
    date: b.date,
    status: b.status,
  })));
});
app.get("/api/debug/fix-empty-from-to", async (req, res) => {
  try {
    const result = await mongoose.connection.db.collection("buses").updateMany(
      { $or: [{ from: "" }, { from: null }, { to: "" }, { to: null }] },
      { $set: { from: "Karad", to: "Mumbai" } }
    );
    const buses = await mongoose.connection.db.collection("buses").find({}).toArray();
    res.json({ fixed: result.modifiedCount, buses: buses.map(b => ({ name: b.name, from: b.from, to: b.to, date: b.date })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/buses/fix-all-cities", async (req, res) => {
  try {
    const buses = await mongoose.connection.db.collection("buses").find({}).toArray();
    const results = [];
    
    for (const bus of buses) {
      // name वरून from/to guess करा किंवा manually set करा
      // तुमच्या buses: M = Mumbai→Karad? d = Karad→Mumbai?
      // आपण दोन्हींना Karad→Mumbai set करतो, नंतर admin मधून edit करा
      const update = {};
      if (!bus.from || bus.from === "") update.from = "Karad";
      if (!bus.to   || bus.to   === "") update.to   = "Mumbai";
      
      if (Object.keys(update).length > 0) {
        await mongoose.connection.db.collection("buses").updateOne(
          { _id: bus._id },
          { $set: update }
        );
        results.push({ name: bus.name, ...update });
      }
    }
    
    res.json({ success: true, fixed: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/buses/check-all", async (req, res) => {
  try {
    const buses = await mongoose.connection.db
      .collection("buses")
      .find({})
      .toArray();
    res.json(buses.map(b => ({
      id: b._id,
      name: b.name,
      from: b.from,
      to: b.to,
      date: b.date,
      status: b.status
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/buses/force-fix", async (req, res) => {
  try {
    const buses = await mongoose.connection.db.collection("buses").find({}).toArray();
    
    for (const bus of buses) {
      // Bus name वरून city set करा
      // "M" = Mumbai→Karad, "d" = Karad→Mumbai (तुमच्या buses प्रमाणे adjust करा)
      const fromCity = bus.name === "M" ? "Mumbai" : "Karad";
      const toCity   = bus.name === "M" ? "Karad"  : "Mumbai";
      
      await mongoose.connection.db.collection("buses").updateOne(
        { _id: bus._id },
        { 
          $set: { 
            from: fromCity, 
            to:   toCity,
          } 
        }
      );
    }
    
    const updated = await mongoose.connection.db.collection("buses").find({}).toArray();
    res.json({ success: true, buses: updated.map(b => ({ name: b.name, from: b.from, to: b.to, date: b.date })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ADD THIS NEW ROUTE — Mobile app POST search
app.post("/api/buses/search", async (req, res) => {
  try {
    const { from, to, date } = req.body;
    if (!from?.trim() || !to?.trim() || !date?.trim())
      return res.status(400).json({ success: false, message: "from, to and date are required" });

    let searchISO = date.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(searchISO)) {
      const [dd, mm, yyyy] = searchISO.split("-");
      searchISO = `${yyyy}-${mm}-${dd}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(searchISO)) {
      const [dd, mm, yyyy] = searchISO.split("/");
      searchISO = `${yyyy}-${mm}-${dd}`;
    }

    const allBuses = await mongoose.connection.db
      .collection("buses").find({ status: "Active" }).toArray();

    const buses = allBuses.filter(b => {
      const bFrom  = (b.from || "").toLowerCase().trim();
      const bTo    = (b.to   || "").toLowerCase().trim();
      const sFrom  = from.toLowerCase().trim();
      const sTo    = to.toLowerCase().trim();
      if (bFrom !== sFrom || bTo !== sTo) return false;

      let busISO = (b.date || "").trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(busISO)) {
        const [dd, mm, yyyy] = busISO.split("/");
        busISO = `${yyyy}-${mm}-${dd}`;
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(busISO)) {
        const [dd, mm, yyyy] = busISO.split("-");
        busISO = `${yyyy}-${mm}-${dd}`;
      }
      return busISO === searchISO;
    });

    if (!buses.length)
      return res.json({ success: true, buses: [], message: "Bus Not Found" });

    res.json({ success: true, buses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/debug/buses", async (req, res) => {
  const buses = await Bus.find().limit(3);
  res.json(buses);
});

// ✅ FIX 2: POST /api/buses — always saves BOTH departure+departureTime, arrival+arrivalTime
app.get("/api/buses/migrate-prices", async (req, res) => {
  try {
    const buses = await Bus.find({});
    let updated = 0;
    for (const bus of buses) {
      await Bus.findByIdAndUpdate(bus._id, {
        $set: {
          seaterPrice:  bus.seaterPrice  || bus.price || 0,
          sleeperPrice: bus.sleeperPrice || bus.price || 0,
        }
      });
      updated++;
    }
    res.json({ success: true, message: `${updated} buses updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/buses", async (req, res) => {
  try {
    const body = req.body;
    const number = (body.number || body.busNumber || body.numberPlate || "").trim();
    if (!body.name?.trim() || !number)
      return res.status(400).json({ success: false, message: "Bus name and number are required" });
    if (!body.from?.trim() || !body.to?.trim())
      return res.status(400).json({ success: false, message: "From and To cities are required" });
    if (!body.date?.trim())
      return res.status(400).json({ success: false, message: "Date is required" });
    const fromCity = body.from.trim();
    const toCity   = body.to.trim();
    if (fromCity.toLowerCase() === toCity.toLowerCase())
      return res.status(400).json({ success: false, message: "From and To cannot be same" });

    // Normalize date to YYYY-MM-DD
    let dateISO = body.date.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateISO)) {
      const [dd, mm, yyyy] = dateISO.split("/");
      dateISO = `${yyyy}-${mm}-${dd}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateISO)) {
      const [dd, mm, yyyy] = dateISO.split("-");
      dateISO = `${yyyy}-${mm}-${dd}`;
    }

    const dep = (body.departureTime || body.departure || "").trim();
    const arr = (body.arrivalTime   || body.arrival   || "").trim();
    const seaterPrice  = Number(body.seaterPrice  ?? body.price ?? 0);
    const sleeperPrice = Number(body.sleeperPrice ?? body.price ?? 0);

    const result = await mongoose.connection.db.collection("buses").insertOne({
      name:          body.name.trim(),
      number,
      busNumber:     number,
      numberPlate:   number,
      type:          (body.type || "").trim(),
      from: (body.from || body.fromCity || body.departure || "").trim(),
to:   (body.to   || body.toCity   || body.arrival   || "").trim(),
      seats:         Number(body.seats || 36),
      totalSeats:    Number(body.seats || 36),
      price:         seaterPrice,
      seaterPrice,
      sleeperPrice,
      departureTime: dep,
      departure:     dep,
      arrivalTime:   arr,
      arrival:       arr,
      duration:      (body.duration || "").trim(),
      date:          dateISO,
      time:          (body.time || dep).trim(),
      status:        body.status || "Active",
      blockedSeats:  [],
      ladiesSeats:   [],
      createdAt:     new Date(),
      updatedAt:     new Date(),
    });

    const saved = await mongoose.connection.db.collection("buses")
      .findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, bus: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ✅ FIX: PUT — syncs all time fields on every update
app.put("/api/buses/:id", async (req, res) => {
  try {
    const body = req.body;
    const fromCity = (body.from || "").trim();
    const toCity   = (body.to   || "").trim();
    if (fromCity && toCity && fromCity.toLowerCase() === toCity.toLowerCase())
      return res.status(400).json({ success: false, message: "From and To cannot be same" });

    // Normalize date
    let dateISO = (body.date || "").trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateISO)) {
      const [dd, mm, yyyy] = dateISO.split("/");
      dateISO = `${yyyy}-${mm}-${dd}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateISO)) {
      const [dd, mm, yyyy] = dateISO.split("-");
      dateISO = `${yyyy}-${mm}-${dd}`;
    }

    const number = (body.number || body.busNumber || body.numberPlate || "").trim();
    const dep    = (body.departureTime || body.departure || "").trim();
    const arr    = (body.arrivalTime   || body.arrival   || "").trim();

    const updateData = { updatedAt: new Date() };
    if (body.name)   updateData.name        = body.name.trim();
    if (number)      { updateData.number = number; updateData.busNumber = number; updateData.numberPlate = number; }
    if (body.type !== undefined) updateData.type = body.type;
   const resolvedFrom = (body.from || body.fromCity || "").trim();
const resolvedTo   = (body.to   || body.toCity   || "").trim();
if (resolvedFrom) updateData.from = resolvedFrom;
if (resolvedTo)   updateData.to   = resolvedTo;
    if (dep)         { updateData.departureTime = dep; updateData.departure = dep; updateData.time = dep; }
    if (arr)         { updateData.arrivalTime   = arr; updateData.arrival   = arr; }
    if (dateISO)     updateData.date          = dateISO;
    if (body.status) updateData.status        = body.status;
    if (body.seats)  { updateData.seats = Number(body.seats); updateData.totalSeats = Number(body.seats); }
    if (body.duration !== undefined) updateData.duration = body.duration;

    updateData.seaterPrice  = Number(body.seaterPrice  ?? body.price ?? 0);
    updateData.sleeperPrice = Number(body.sleeperPrice ?? body.price ?? 0);
    updateData.price        = Number(body.seaterPrice  ?? body.price ?? 0);

    let busObjectId;
    try { busObjectId = new mongoose.Types.ObjectId(req.params.id); }
    catch (e) { return res.status(400).json({ success: false, message: "Invalid bus ID" }); }

    const result = await mongoose.connection.db.collection("buses")
      .updateOne({ _id: busObjectId }, { $set: updateData });

    if (result.matchedCount === 0)
      return res.status(404).json({ success: false, message: "Bus not found" });

    const updated = await mongoose.connection.db.collection("buses")
      .findOne({ _id: busObjectId });
    res.json({ success: true, bus: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
app.get("/api/buses/:id", async (req, res) => {
  try {
    let busObjectId;
    try { busObjectId = new mongoose.Types.ObjectId(req.params.id); }
    catch { return res.status(400).json({ success: false, message: "Invalid bus ID" }); }

    const bus = await mongoose.connection.db
      .collection("buses")
      .findOne({ _id: busObjectId });

    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/debug/bus-blocked/:id", async (req, res) => {
  try {
    const bus = await mongoose.connection.db.collection("buses")
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({
      blockedSeats: bus?.blockedSeats,
      seats: bus?.seats,
    });
  } catch(err) {
    res.json({ error: err.message });
  }
});
app.get("/api/debug/clear-blocked/:id", async (req, res) => {
  try {
    await mongoose.connection.db.collection("buses").updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { 
        blockedSeats: [],
        seats: []
      }}
    );
    res.json({ success: true, message: "All blocked seats cleared" });
  } catch(err) {
    res.json({ error: err.message });
  }
});
app.delete("/api/buses/:id", async (req, res) => {
  try {
    const deleted = await Bus.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success:false, message:"Bus not found" });
    res.json({ success:true, message:"Bus deleted" });
  } catch(err) { res.status(400).json({ success:false, message:err.message }); }
});

// ─── FIX 3: ONE-TIME MIGRATION — existing buses fix ───────────────
// Visit: GET /fix-bus-times ONCE to sync all existing DB records
// After running, you can remove this endpoint (optional)
app.get("/fix-bus-times", async (req, res) => {
  try {
    const buses = await Bus.find();
    let fixed = 0;
    const details = [];

    for (const bus of buses) {
      let changed = false;

      // Sync departureTime ↔ departure
      if (bus.departureTime && !bus.departure) {
        bus.departure = bus.departureTime;
        changed = true;
      } else if (bus.departure && !bus.departureTime) {
        bus.departureTime = bus.departure;
        changed = true;
      }

      // Sync arrivalTime ↔ arrival
      if (bus.arrivalTime && !bus.arrival) {
        bus.arrival = bus.arrivalTime;
        changed = true;
      } else if (bus.arrival && !bus.arrivalTime) {
        bus.arrivalTime = bus.arrival;
        changed = true;
      }

      if (changed) {
        await bus.save();
        fixed++;
        details.push({
          name: bus.name,
          departure: bus.departure,
          arrival: bus.arrival,
        });
      }
    }

    res.json({
      success: true,
      message: `✅ Fixed ${fixed} out of ${buses.length} buses`,
      fixed: details,
    });
  } catch(err) {
    res.status(500).json({ success:false, message:err.message });
  }
});

// ─── BOARDING / DROPPING POINTS ───────────────────────────────────
app.get("/api/boarding-points", (req, res) => {
  const { from, to } = req.query;
  const { boarding } = getPointsForRoute(from, to);
  res.json({ success:true, points: formatPoints(boarding) });
});

app.get("/api/dropping-points", (req, res) => {
  const { from, to } = req.query;
  const { dropping } = getPointsForRoute(from, to);
  res.json({ success:true, points: formatPoints(dropping) });
});

app.get("/api/buses/:busId/boarding-points", (req, res) => {
  const { from, to } = req.query;
  const { boarding } = getPointsForRoute(from, to);
  res.json({ success:true, points: formatPoints(boarding) });
});

app.get("/api/buses/:busId/dropping-points", (req, res) => {
  const { from, to } = req.query;
  const { dropping } = getPointsForRoute(from, to);
  res.json({ success:true, points: formatPoints(dropping) });
});

// ─── ROUTES API ───────────────────────────────────────────────────
app.get("/api/routes", async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt:-1 });
    res.json(routes);
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.post("/api/routes", async (req, res) => {
  try {
    const body = req.body;
    const route = await Route.create({
      name:           body.name || `${body.from} to ${body.to}`,
    from: (body.from || body.fromCity || "").trim(),
to:   (body.to   || body.toCity   || "").trim(),
      boardingPoints: body.boardingPoints || [],
      droppingPoints: body.droppingPoints || [],
      distance:       Number(body.distance||0),
      status:         body.status || "Active",
    });
    res.status(201).json({ success:true, route });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.put("/api/routes/:id", async (req, res) => {
  try {
    const updated = await Route.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (!updated) return res.status(404).json({ message:"Route not found" });
    res.json({ success:true, route:updated });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.delete("/api/routes/:id", async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:"Route deleted" });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

// ─── TRIPS API ────────────────────────────────────────────────────
app.get("/api/trips", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt:-1 });
    res.json(trips);
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.post("/api/trips", async (req, res) => {
  try {
    const body = req.body;
    const seats = body.seats?.length
      ? body.seats
      : generateTripSeats(body.type||body.busType||"AC Sleeper", Number(body.price||body.fare||0));
    const trip = await Trip.create({
      name:          body.name||body.tripName||"",
      tripName:      body.tripName||body.name||"",
      routeId:       body.routeId||"",
      route:         body.route||body.routeName||"",
      routeName:     body.routeName||body.route||"",
      date:          body.date||body.travelDate||"",
      travelDate:    body.travelDate||body.date||"",
      time:          body.time||body.departureTime||"",
      departureTime: body.departureTime||body.time||"",
      bus:           body.bus||body.busName||"",
      busName:       body.busName||body.bus||"",
      price:         Number(body.price||body.fare||0),
      fare:          Number(body.fare||body.price||0),
      status:        body.status||"Active",
      boardingPoints:body.boardingPoints||[],
      droppingPoints:body.droppingPoints||[],
      ladiesSeats:   body.ladiesSeats||[],
      blockedSeats:  body.blockedSeats||[],
      seats,
    });
    res.status(201).json({ success:true, trip });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.put("/api/trips/:id", async (req, res) => {
  try {
    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (!updated) return res.status(404).json({ message:"Trip not found" });
    res.json({ success:true, trip:updated });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.delete("/api/trips/:id", async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:"Trip deleted" });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.patch("/api/trips/:id/seat-flag", async (req, res) => {
  try {
    const { seatNo, flagType } = req.body;
    if (!seatNo||!["ladiesSeats","blockedSeats"].includes(flagType))
      return res.status(400).json({ message:"Invalid seatNo or flagType" });
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message:"Trip not found" });
    const arr = trip[flagType] || [];
    trip[flagType] = arr.includes(String(seatNo))
      ? arr.filter(s=>s!==String(seatNo))
      : [...arr, String(seatNo)];
    await trip.save();
    res.json({ success:true, trip });
  } catch(err) { res.status(500).json({ message:err.message }); }
});
// 🔥 NEW: BUS SEAT BLOCK API
app.patch("/api/buses/:id/seat-flag", async (req, res) => {
  try {
    const { seatNo, flagType } = req.body;

    if (!seatNo || !["blockedSeats","ladiesSeats"].includes(flagType)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const bus = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    let seats = Array.isArray(bus.seats) ? bus.seats : [];
    const idx = seats.findIndex(s => String(s.seatNo) === String(seatNo));
  
    let updated;

    if (current.includes(seat)) {
      updated = current.filter(s => s !== seat); // UNBLOCK
    } else {
      updated = [...current, seat]; // BLOCK
    }

    await mongoose.connection.db
      .collection("buses")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { $set: { [flagType]: updated } }
      );

    const updatedBus = await mongoose.connection.db
      .collection("buses")
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    res.json({ success: true, bus: updatedBus });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/api/trips/:id/seats", async (req, res) => {
  try {
    const { date } = req.query;
    const busId = req.params.id;

    // ✅ Date normalize - DD/MM/YYYY आणि YYYY-MM-DD दोन्ही handle करा
    let searchDates = [];
    if (date) {
      let iso = date;
      let ddmm = date;

      // DD/MM/YYYY → YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split("/");
        iso = `${yyyy}-${mm}-${dd}`;
        ddmm = date;
      }
      // YYYY-MM-DD → DD/MM/YYYY
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [yyyy, mm, dd] = date.split("-");
        ddmm = `${dd}/${mm}/${yyyy}`;
        iso = date;
      }

      searchDates = [iso, ddmm, date];
    }

    // ✅ Bus ID normalize - string comparison
    const busIdStr = String(busId);

    // ✅ Query - busId किंवा busNo किंवा tripId ने match करा
    const orConditions = [
  { bus: busIdStr },
  { trip: busIdStr },
  { tripId: busIdStr },
  { busNo: busIdStr },
];
if (mongoose.Types.ObjectId.isValid(busIdStr)) {
  orConditions.push({ bus: new mongoose.Types.ObjectId(busIdStr) });
}

const query = {
  bookingStatus: { $ne: "Cancelled" },
  paymentStatus: { $nin: ["Failed", "Refunded"] },
  $or: orConditions,
};

    // Date filter add करा
   if (searchDates.length > 0) {
  // Also add YYYY-MM-DD format
  searchDates.forEach(d => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split("/");
      searchDates.push(`${yyyy}-${mm}-${dd}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [yyyy, mm, dd] = d.split("-");
      searchDates.push(`${dd}/${mm}/${yyyy}`);
    }
  });
}

    const bookings = await Booking.find(query);

    console.log(`🪑 Seats query for bus=${busIdStr}, date=${date}: found ${bookings.length} bookings`);

    const bookedSeats = [];
    bookings.forEach(booking => {
     const seats = (
        Array.isArray(booking.seatNumbers) && booking.seatNumbers.length
          ? booking.seatNumbers
          : booking.seatNo ? [booking.seatNo] : []
      ).map(String).filter(Boolean);

     seats.forEach((seatId, idx) => {
  const perSeatPassenger = (booking.passengers || []).find(
    p => String(p.seatNo || p.seatNumber || p.seat || "") === String(seatId)
  );
  const gender =
    perSeatPassenger?.gender ||
    booking.passengers?.[idx]?.gender ||
    booking.gender ||
    "Male";
  if (seatId) bookedSeats.push({ id: String(seatId), gender });
});
    });

    res.json({
      success: true,
      bookedSeats,
      total: bookedSeats.length,
    });
  } catch (err) {
    console.error("Seats error:", err);
    res.status(500).json({ message: err.message });
  }
});
// ─── BOOKINGS API ─────────────────────────────────────────────────
app.get("/api/bookings", async (req, res) => {
  try {
    const { userId, phone } = req.query;
    
    // No filter = admin wants all bookings
    if (!userId && !phone) {
      const bookings = await Booking.find({}).sort({ createdAt: -1 });
      return res.json(bookings);
    }
    
    let query = { $or: [] };
    
    if (userId) {
      query.$or.push(
        { userId: userId },
        { phone: userId },
        { mobile: userId },
      );
    }
    if (phone) {
      query.$or.push(
        { phone: phone },
        { mobile: phone },
      );
    }
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch(err) { 
    res.status(500).json({ message: err.message }); 
  }
});

app.get("/api/bookings/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orConditions = [
      { userId: userId },
      { phone: userId },
      { mobile: userId },
    ];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ _id: userId });
    }
    const bookings = await Booking.find({ $or: orConditions }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;
    try { booking = await Booking.findById(id); } catch {}
    if (!booking) booking = await Booking.findOne({ $or:[{ bookingCode:id },{ pnr:id }] });
    if (!booking) return res.status(404).json({ success:false, message:"Booking not found" });
    res.json({ success:true, booking });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const body = req.body;

    const passengerName = (
      body.passengerName || body.customerName ||
      (body.passengers?.[0]?.name) || ""
    ).trim();

    if (!passengerName)
      return res.status(400).json({ success: false, message: "Passenger name is required" });

    const busId   = body.bus   ? String(body.bus)   : "";
    const routeId = body.route ? String(body.route) : "";
    const tripId  = body.trip  ? String(body.trip)  : (body.tripId ? String(body.tripId) : "");

const seatNumbers = (
      Array.isArray(body.seatNumbers) && body.seatNumbers.length
        ? body.seatNumbers
        : Array.isArray(body.selectedSeats) && body.selectedSeats.length
        ? body.selectedSeats
        : body.seatNo ? [body.seatNo] : []
    ).map(String).filter(Boolean);

    const seatNo = seatNumbers[0] || "";

    console.log("✅ Booking seats:", seatNumbers);
    const uniqueCode = "BK" + Date.now() + Math.floor(Math.random() * 1000);
// 2% Razorpay charge calculation
const rawBase   = Number(body.amount || body.totalAmount || 0);
const payMethod = (body.paymentMode || body.paymentMethod || "Cash");
const computedFinal = payMethod === "Razorpay"
  ? Math.round(rawBase + rawBase * 0.02)
  : rawBase;
    const booking = new Booking({
      userId:        body.userId || "",
      passengerName,
      customerName:  passengerName,
      phone:         body.phone  || body.mobile  || (body.passengers?.[0]?.phone) || "",
      mobile:        body.mobile || body.phone   || (body.passengers?.[0]?.phone) || "",
      email:         body.email  || "",
      age:           Number(body.age || body.passengers?.[0]?.age || 0),
      gender:        body.gender || body.passengers?.[0]?.gender || "Male",
      tripId,
      bus:           busId,
      route:         routeId,
      trip:          tripId,
      journeyDate:   body.journeyDate || body.date || "",
      date:          body.date        || body.journeyDate || "",
      boardingPoint: body.boardingPoint || "",
      droppingPoint: body.droppingPoint || "",
      busNo:         body.busNo    || body.busName || "",
      busName:       body.busName  || body.busNo   || "",
      seatNo: seatNumbers[0] || "",
seatNumbers: seatNumbers,
     baseAmount:    rawBase,
amount:        computedFinal,
totalAmount:   computedFinal,
      paymentMode:   body.paymentMode   || body.paymentMethod || "Cash",
      paymentMethod: body.paymentMethod || body.paymentMode   || "Cash",
      paymentStatus: body.paymentStatus || "Paid",
      refundStatus:  body.refundStatus  || "Not Applicable",
      bookingStatus: body.bookingStatus || "Confirmed",
      bookingCode:   uniqueCode,
      pnr:           uniqueCode,
      conductorNote: body.conductorNote || "",
passengers: Array.isArray(body.passengers) &&
body.passengers.length
  ? body.passengers.map((p, index) => ({
      name:
        p.name ||
        p.passengerName ||
        passengerName,

      age: Number(
        p.age || body.age || 0
      ),

      gender: String(
        p.gender || "Male"
      ).trim(),

      seatNo: String(
        p.seatNo ||
        p.seat ||
        p.seatNumber ||
        seatNumbers[index] ||
        ""
      ),

      phone:
        p.phone ||
        body.mobile ||
        body.phone ||
        "",
    }))
  : [{
      name: passengerName,

      age: Number(
        body.age || 0
      ),

      gender: String(
        body.gender || "Male"
      ).trim(),

      seatNo: String(
        seatNo || ""
      ),

      phone:
        body.mobile ||
        body.phone ||
        "",
    }],
    });
if (busId && seatNumbers.length) {
  const bus = await Bus.findById(busId);

  if (bus) {
    if (!Array.isArray(bus.seatDetails)) {
      bus.seatDetails = [];
    }

    seatNumbers.forEach((seat, index) => {
      const passenger =
        booking.passengers?.find(
          p =>
            p.seatNo === seat ||
            p.seat === seat
        ) || {};

      const existingSeat =
        bus.seatDetails.find(
          s =>
            String(s.seatNo) ===
            String(seat)
        );

      if (existingSeat) {
        existingSeat.isBooked = true;
        existingSeat.isBlocked = false;

        existingSeat.passengerName =
          passenger.name || "";

        existingSeat.gender =
          String(
            passenger.gender ||
            "Male"
          ).trim();

        existingSeat.bookingId =
          String(booking._id);
      } else {
        bus.seatDetails.push({
          seatNo: String(seat),
          isBooked: true,
          isBlocked: false,

          passengerName:
            passenger.name || "",

          gender: String(
            passenger.gender ||
            "Male"
          ).trim(),

          bookingId:
            String(booking._id),
        });
      }
    });

    await bus.save();
  }
}
    const saved = await booking.save();

    // ✅ Notification AFTER successful save
    try {
      const seats  = seatNumbers.join(", ");
      const amount = Number(body.amount || 0);
      const date   = body.journeyDate || body.date || "";

      await sendFCMToAll(
        "🎫 New Booking Confirmed!",
        `${passengerName} | Seats: ${seats} | ₹${amount} | Date: ${date}`
      );

      await Notification.create({
  title:   "🎫 Booking Confirmed",
  message: `Your booking is confirmed! Seats: ${seats}, Amount: ₹${amount}, Date: ${date}`,
  type:    "info",
  source:  "user_booking", // ✅ user specific
  userId:  body.userId || "",
  phone:   body.phone || body.mobile || "",
});
    } catch (notifErr) {
      console.log("Notification send error:", notifErr.message);
    }

    res.status(201).json({
      success:   true,
      booking:   saved,
      bookingId: saved.bookingCode,
      ticket: {
        bookingId: saved.bookingCode,
        ...saved.toObject(),
      },
    });
  } catch (err) {
    console.error("Booking POST error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/bookings/:id", async (req, res) => {
  try {
    const body = req.body;
    if (body.passengerName && !body.customerName) body.customerName  = body.passengerName;
    if (body.customerName && !body.passengerName) body.passengerName = body.customerName;
    if (body.phone  && !body.mobile)  body.mobile = body.phone;
    if (body.mobile && !body.phone)   body.phone  = body.mobile;
    if (body.amount      && !body.totalAmount)  body.totalAmount = body.amount;
    if (body.totalAmount && !body.amount)        body.amount      = body.totalAmount;
    if (body.paymentMode   && !body.paymentMethod) body.paymentMethod = body.paymentMode;
    if (body.paymentMethod && !body.paymentMode)   body.paymentMode   = body.paymentMethod;
    if (body.seatNo && (!body.seatNumbers||!body.seatNumbers.length)) body.seatNumbers = [body.seatNo];
    const updated = await Booking.findByIdAndUpdate(req.params.id, body, { new:true, runValidators:false });
    if (!updated) return res.status(404).json({ message:"Booking not found" });
    res.json({ success:true, booking:updated });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.post("/api/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;
    try { booking = await Booking.findById(id); } catch {}
    if (!booking) 
      booking = await Booking.findOne({ $or:[{ bookingCode:id },{ pnr:id }] });
    if (!booking) 
      return res.status(404).json({ success:false, message:"Booking not found" });

    if (booking.bookingStatus === "Cancelled")
      return res.status(400).json({ success:false, message:"Already cancelled" });

    // ── Time-based refund calculate ──
    const now = new Date();
    const journeyDateStr = booking.journeyDate || booking.date || "";
    let refundPercent = 0;
    let refundAmount = 0;

    if (journeyDateStr) {
      // DD/MM/YYYY → parse
      let departure;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(journeyDateStr)) {
        const [dd, mm, yyyy] = journeyDateStr.split("/");
        departure = new Date(`${yyyy}-${mm}-${dd}`);
      } else {
        departure = new Date(journeyDateStr);
      }

      const hoursLeft = (departure - now) / (1000 * 60 * 60);
      const amount = Number(booking.amount || booking.totalAmount || 0);

      if (hoursLeft >= 24) {
        refundPercent = 100;
        refundAmount = amount;
      } else if (hoursLeft >= 6) {
        refundPercent = 50;
        refundAmount = Math.round(amount * 0.5);
      } else {
        refundPercent = 0;
        refundAmount = 0;
      }
    }
// ✅ passengerName fix — customerName fallback
if (!booking.passengerName && booking.customerName) {
  booking.passengerName = booking.customerName;
}
if (!booking.passengerName) {
  booking.passengerName = "Passenger";
}
    // ── Booking update ──
   booking.bookingStatus = "Cancelled";
booking.refundStatus  = refundAmount > 0 ? "Processing" : "Not Applicable";
booking.conductorNote = `Cancelled. Refund: ₹${refundAmount} (${refundPercent}%)`;
booking.refundAmount  = refundAmount;
booking.refundPercent = refundPercent;
booking.cancelledAt   = new Date();
await booking.save();
// ✅ SEAT AVAILABLE करा — Bus च्या seatDetails मधून remove करा
if (booking.bus && booking.seatNumbers?.length) {
  try {
    let busObjectId = new mongoose.Types.ObjectId(String(booking.bus));
    
    const bus = await mongoose.connection.db
      .collection("buses")
      .findOne({ _id: busObjectId });

    if (bus) {
      // seatDetails मधून isBooked = false करा
      let seatDetails = Array.isArray(bus.seatDetails) ? [...bus.seatDetails] : [];
      
      booking.seatNumbers.forEach(seatNo => {
        const idx = seatDetails.findIndex(
          s => String(s.seatNo) === String(seatNo)
        );
        if (idx >= 0) {
          seatDetails[idx].isBooked      = false;
          seatDetails[idx].passengerName = "";
          seatDetails[idx].gender        = "";
          seatDetails[idx].bookingId     = "";
        }
      });

      await mongoose.connection.db.collection("buses").updateOne(
        { _id: busObjectId },
        { $set: { seatDetails, updatedAt: new Date() } }
      );
    }
  } catch(e) {
    console.log("Seat release error:", e.message);
  }
}

// ✅ Admin ला notification
try {
  await Notification.create({
    title:   "❌ Booking Cancelled",
message: `${booking.passengerName} cancelled booking. Seats: ${booking.seatNumbers?.join(", ")} released.`,
    type:    "alert",
  });
} catch(_) {}
    // ── Wallet मध्ये refund add करा ──
    // ✅ Wallet नाही — Admin ला refund notification पाठवा
if (refundAmount > 0) {
  try {
    await Notification.create({
      title:   "💰 Refund Pending — Action Required",
     message: `Pay ₹${refundAmount} (${refundPercent}%) refund to ${booking.passengerName} (${booking.phone}). Booking: ${booking.bookingCode}. Payment Mode: ${booking.paymentMode || "Cash"}`,
      type:    "alert",
    });

    await sendFCMToAll(
      "💰 Refund Pending!",
      `${booking.passengerName} ला ₹${refundAmount} refund द्या — ${booking.bookingCode}`
    );
  } catch(_) {}
}

    res.json({
      success: true,
      message: "Booking cancelled",
      refundAmount,
      refundPercent,
      booking,
    });

  } catch(err) { 
    res.status(500).json({ success:false, message:err.message }); 
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message:"Booking not found" });
    res.json({ success:true, message:"Booking deleted" });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

// ─── CUSTOMERS API ────────────────────────────────────────────────
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt:-1 });
    res.json(customers);
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.post("/api/customers", async (req, res) => {
  try {
    const body = req.body;
    const customer = await Customer.create({
      name:body.name||body.fullName||"", fullName:body.fullName||body.name||"",
      phone:body.phone||"", email:body.email||"", city:body.city||"",
      status:body.status||"Active", password:body.password||"",
    });
    res.status(201).json({ success:true, customer });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (!updated) return res.status(404).json({ message:"Customer not found" });
    res.json({ success:true, customer:updated });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:"Customer deleted" });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

// ─── OFFERS ───────────────────────────────────────────────────────
app.get("/api/offers/all", async (req, res) => {
  try {
    const offers = await Offer.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// GET active offers only (mobile app)
app.get("/api/offers", async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    // Fallback: if DB empty, return default offers
    if (offers.length === 0) {
      return res.json({
        success: true,
        offers: [
          { code: "FIRST100", description: "₹100 off on first booking", discount: 100, discountType: "flat", isActive: true },
          { code: "SAVE50",   description: "₹50 off on booking above ₹500", discount: 50, discountType: "flat", isActive: true, minAmount: 500 },
        ]
      });
    }
    res.json({ success: true, offers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// POST create offer
app.post("/api/offers", async (req, res) => {
  try {
    const body = req.body;
    const offer = await Offer.create({
      title:        body.title || body.name || "",
      name:         body.name  || body.title || "",
      description:  body.description || "",
      code:         (body.code || body.couponCode || "").toUpperCase(),
      couponCode:   (body.code || body.couponCode || "").toUpperCase(),
      discountType: body.discountType || "flat",
      discount:     Number(body.discount || body.discountValue || 0),
      discountValue:Number(body.discountValue || body.discount || 0),
      minAmount:    Number(body.minAmount || body.minBookingAmount || 0),
      isActive:     body.isActive !== false,
      expiry:       body.expiry || "",
    });
    res.status(201).json({ success: true, offer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
 
// PUT update offer
app.put("/api/offers/:id", async (req, res) => {
  try {
    const body = req.body;
    const updateData = {};
    if (body.title !== undefined)       updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.code !== undefined)        { updateData.code = body.code.toUpperCase(); updateData.couponCode = body.code.toUpperCase(); }
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discount !== undefined)    { updateData.discount = Number(body.discount); updateData.discountValue = Number(body.discount); }
    if (body.minAmount !== undefined)   updateData.minAmount = Number(body.minAmount);
    if (body.isActive !== undefined)    updateData.isActive = body.isActive;
    if (body.expiry !== undefined)      updateData.expiry = body.expiry;
    const updated = await Offer.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Offer not found" });
    res.json({ success: true, offer: updated });
  } catch (err) { res.status(400).json({ message: err.message }); }
});
 
// DELETE offer
app.delete("/api/offers/:id", async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// Validate offer (mobile app uses this for coupon apply)
app.post("/api/offers/validate", async (req, res) => {
  const { code, amount } = req.body;
  try {
    const offer = await Offer.findOne({
      code: (code || "").toUpperCase(),
      isActive: true,
    });
    if (!offer) return res.status(400).json({ success: false, message: "Invalid or expired offer code" });
    if (offer.minAmount > 0 && Number(amount || 0) < offer.minAmount)
      return res.status(400).json({ success: false, message: `Minimum booking amount ₹${offer.minAmount} required` });
    res.json({ success: true, ...offer.toObject() });
  } catch (err) {
    // Fallback to static offers if DB fails
    const staticOffers = {
      "FIRST100": { code: "FIRST100", description: "₹100 off on first booking", discount: 100 },
      "SAVE50":   { code: "SAVE50",   description: "₹50 off on booking above ₹500", discount: 50 },
    };
    const staticOffer = staticOffers[(code || "").toUpperCase()];
    if (!staticOffer) return res.status(400).json({ success: false, message: "Invalid offer code" });
    res.json({ success: true, ...staticOffer });
  }
});
app.post("/api/offers/validate", (req, res) => {
  const { code, amount } = req.body;
  const offers = {
    "FIRST100": { code:"FIRST100", description:"₹100 off on first booking", discount:100 },
    "SAVE50":   { code:"SAVE50",   description:"₹50 off on booking above ₹500", discount:50 },
  };
  const offer = offers[(code||"").toUpperCase()];
  if (!offer) return res.status(400).json({ success:false, message:"Invalid offer code" });
  if (offer.code==="SAVE50" && Number(amount||0)<500)
    return res.status(400).json({ success:false, message:"Minimum booking amount ₹500 required" });
  res.json({ success:true, ...offer });
});
//GET all popular routes (mobile app + admin)
app.get("/api/popular-routes", async (req, res) => {
  try {
    const routes = await PopularRoute.find().sort({ order: 1, createdAt: 1 });
    // Fallback defaults
    if (routes.length === 0) {
      return res.json({
        success: true,
        routes: [
          { from: "Dhabewadi", to: "Borivali", isActive: true, order: 0 },
          { from: "Karad",     to: "Mumbai",   isActive: true, order: 1 },
          { from: "Satara",    to: "Pune",     isActive: true, order: 2 },
          { from: "Karad",     to: "Kolhapur", isActive: true, order: 3 },
          { from: "Sangli",    to: "Mumbai",   isActive: true, order: 4 },
          { from: "Islampur",  to: "Pune",     isActive: true, order: 5 },
        ]
      });
    }
    // For mobile app, filter only active
    const activeOnly = req.query.active === "true";
    const result = activeOnly ? routes.filter(r => r.isActive !== false) : routes;
    res.json({ success: true, routes: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// POST create popular route
app.post("/api/popular-routes", async (req, res) => {
  try {
    const { from, to, isActive, order } = req.body;
    if (!from || !to) return res.status(400).json({ message: "From and To required" });
    const count = await PopularRoute.countDocuments();
    const route = await PopularRoute.create({
      from, to,
      isActive: isActive !== false,
      order: order !== undefined ? Number(order) : count,
    });
    res.status(201).json({ success: true, route });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// PUT update popular route
app.put("/api/popular-routes/:id", async (req, res) => {
  try {
    const updated = await PopularRoute.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Route not found" });
    res.json({ success: true, route: updated });
  } catch (err) { res.status(400).json({ message: err.message }); }
});
 
// DELETE popular route
app.delete("/api/popular-routes/:id", async (req, res) => {
  try {
    await PopularRoute.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Route deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
// POST reorder popular routes
app.post("/api/popular-routes/reorder", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: "ids array required" });
    await Promise.all(
      ids.map((id, idx) =>
        PopularRoute.findByIdAndUpdate(id, { order: idx })
      )
    );
    res.json({ success: true, message: "Reordered" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
// ─── MSG91 OTP ────────────────────────────────────────────────────
const MSG91_AUTH_KEY    = process.env.MSG91_AUTH_KEY    || "";
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";

const otpStore   = {};
const OTP_EXPIRY = 5 * 60 * 1000;  // 5 minutes
const MAX_RETRIES = 3;

function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, "").slice(-10));
}

app.post("/api/otp/send", async (req, res) => {
  try {
    const { phone } = req.body;
    const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);

    if (!isValidIndianPhone(cleaned)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit Indian mobile number enter करा.",
      });
    }

    // 30 second rate limit
    const existing = otpStore[cleaned];
    if (existing && Date.now() < existing.sentAt + 30000) {
      const waitSec = Math.ceil((existing.sentAt + 30000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `${waitSec} seconds नंतर resend करा.`,
      });
    }

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + OTP_EXPIRY;

    // MSG91 पाठवा
    if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID) {
      try {
        const msg91Url =
          `https://control.msg91.com/api/v5/otp` +
          `?template_id=${MSG91_TEMPLATE_ID}` +
          `&mobile=91${cleaned}` +
          `&authkey=${MSG91_AUTH_KEY}` +
          `&otp=${otp}`;

        const response = await fetch(msg91Url, { method: "POST" });
        const data     = await response.json();

        if (data.type !== "success") {
          console.error("MSG91 error:", data);
          throw new Error(data.message || "MSG91 send failed");
        }
        console.log(`✅ MSG91 OTP sent to ${cleaned}`);
      } catch (msg91Err) {
        // MSG91 fail झाल्यास terminal ला fallback
        console.error("MSG91 failed, console fallback:", msg91Err.message);
        console.log(`\n🔐 OTP for ${cleaned}: ${otp}\n`);
      }
    } else {
      // Dev mode — no MSG91 keys
      console.log(`\n🔐 ================================`);
      console.log(`📱 OTP for ${cleaned}: ${otp}`);
      console.log(`⏰ Valid for 5 minutes`);
      console.log(`🔐 ================================\n`);
    }

    otpStore[cleaned] = { otp, expiry, retries: 0, sentAt: Date.now() };
    res.json({ success: true, message: "OTP sent successfully." });

  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({
      success: false,
      message: "OTP पाठवता आला नाही. पुन्हा try करा.",
    });
  }
});

app.post("/api/otp/verify", (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);

    if (!cleaned || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP required.",
      });
    }

    const record = otpStore[cleaned];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP सापडला नाही. पुन्हा send करा.",
      });
    }

    if (Date.now() > record.expiry) {
      delete otpStore[cleaned];
      return res.status(400).json({
        success: false,
        message: "OTP expire झाला. नवीन OTP मागवा.",
        errorCode: "OTP_EXPIRED",
      });
    }

    if (record.retries >= MAX_RETRIES) {
      delete otpStore[cleaned];
      return res.status(429).json({
        success: false,
        message: "खूप जास्त चुकीचे attempts. नवीन OTP मागवा.",
        errorCode: "MAX_RETRIES",
      });
    }

    if (String(record.otp) !== String(otp).trim()) {
      otpStore[cleaned].retries += 1;
      const left = MAX_RETRIES - otpStore[cleaned].retries;
      return res.status(400).json({
        success: false,
        message: `चुकीचा OTP. ${left} attempt${left !== 1 ? "s" : ""} शिल्लक.`,
        errorCode: "WRONG_OTP",
        attemptsLeft: left,
      });
    }

    delete otpStore[cleaned];
    res.json({ success: true, message: "OTP verified successfully." });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─── BOOKING OTP ─────────────────────────────────────────────────
 // { phone: { otp, expiry } }
// ─── SEAT LOCK ROUTES ─────────────────────────────────────────────
app.post("/api/seats/lock", async (req, res) => {
  try {
    const { busId, seats, date, lockDurationMinutes = 10 } = req.body;
    if (!busId || !seats?.length || !date)
      return res.status(400).json({ success: false, message: "busId, seats, date required" });

    const expiresAt = new Date(Date.now() + lockDurationMinutes * 60000);

    // Remove expired locks
    await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });

    // Check conflicts
    const conflicts = await SeatLock.find({
      busId,
      date,
      seats: { $in: seats },
      expiresAt: { $gt: new Date() },
    });
    if (conflicts.length > 0) {
      const lockedOnes = [...new Set(conflicts.flatMap(c => c.seats).filter(s => seats.includes(s)))];
      return res.status(409).json({ success: false, message: `Seats ${lockedOnes.join(", ")} are temporarily locked by another user. Try again in a few minutes.` });
    }

    await SeatLock.create({ busId, date, seats, expiresAt });
    res.json({ success: true, expiresAt, message: "Seats locked for 10 minutes" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/seats/locked/:busId", async (req, res) => {
  try {
    await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
    const locks = await SeatLock.find({ busId: req.params.busId, date: req.query.date || "" });
    const lockedSeats = locks.flatMap(l => l.seats);
    res.json({ success: true, lockedSeats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPI QR BOOKING ROUTES ────────────────────────────────────────
app.post("/api/bookings/upi-pending", async (req, res) => {
  try {
    const body = req.body;
    const passengerName = (body.customerName || body.passengerName || body.passengers?.[0]?.name || "").trim();
    if (!passengerName) return res.status(400).json({ success: false, message: "Passenger name required" });

    const code = "UPI" + Date.now();

    const booking = new Booking({
      userId:        body.userId || "",
      passengerName,
      customerName:  passengerName,
      phone:         body.phone || body.mobile || "",
      mobile:        body.phone || body.mobile || "",
      email:         body.email || "",
      bus:           String(body.bus || ""),
      busName:       body.busName || "",
      journeyDate:   body.date || body.journeyDate || "",
      date:          body.date || body.journeyDate || "",
      boardingPoint: body.boardingPoint || "",
      droppingPoint: body.droppingPoint || "",
      seatNumbers:   body.seatNumbers || [],
      seatNo:        body.seatNumbers?.[0] || "",
      amount:        Number(body.amount || 0),
      totalAmount:   Number(body.amount || 0),
      paymentMode:   "UPI_QR",
      paymentMethod: "UPI_QR",
      paymentStatus: "Pending",
      bookingStatus: "Pending",
      bookingCode:   code,
      pnr:           code,
      conductorNote: body.conductorNote || "",
      passengers:    body.passengers || [{ name: passengerName, phone: body.phone || "" }],
    });

    const saved = await booking.save();

    // Notify admin
    try {
      await sendFCMToAll(
        "💰 UPI Payment Pending",
        `${passengerName} | Seats: ${(body.seatNumbers || []).join(", ")} | ₹${body.amount}`
      );
      await Notification.create({
        title:   "💰 UPI Payment Pending",
        message: `${passengerName} ने UPI QR ने pay केले. Verify करा. UTR: ${body.conductorNote || "—"}`,
        type:    "alert",
      });
    } catch {}

    res.status(201).json({
      success:   true,
      booking:   saved,
      bookingId: code,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/bookings/:id/upi-approve", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid", bookingStatus: "Confirmed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Release seat lock
    await SeatLock.deleteMany({ busId: booking.bus, date: booking.date });

    try {
      await sendFCMToAll(
        "🎫 Booking Confirmed!",
        `${booking.passengerName} - Seats ${booking.seatNumbers?.join(", ")} confirmed`
      );
      await Notification.create({
        title:   "🎫 UPI Booking Confirmed",
        message: `${booking.passengerName} ची booking approve झाली. Seats: ${booking.seatNumbers?.join(", ")}`,
        type:    "info",
      });
    } catch {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/bookings/:id/upi-reject", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Failed", bookingStatus: "Cancelled", refundStatus: "Not Applicable" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Release seat lock
    await SeatLock.deleteMany({ busId: booking.bus, date: booking.date });

    try {
      await Notification.create({
        title:   "❌ UPI Payment Rejected",
        message: `${booking.passengerName} चे UPI payment reject झाले. Seats released.`,
        type:    "alert",
      });
    } catch {}

    res.json({ success: true, message: "Booking rejected, seats released" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DASHBOARD & REPORTS ─────────────────────────────────────────
app.get("/api/dashboard", async (req, res) => {
  try {
    const [totalBookings, totalBuses, totalCustomers, totalTrips, bookings] = await Promise.all([
      Booking.countDocuments(), Bus.countDocuments(),
      Customer.countDocuments(), Trip.countDocuments(),
      Booking.find({}, "amount totalAmount journeyDate paymentStatus"),
    ]);
    const revenue = bookings.filter(b=>b.paymentStatus==="Paid")
      .reduce((s,b)=>s+Number(b.amount||b.totalAmount||0),0);
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter(b=>(b.journeyDate||"").startsWith(today)).length;
    res.json({ totalBookings, todayBookings, totalBuses, totalCustomers, totalTrips, revenue });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

app.get("/api/reports", async (req, res) => {
  try {
    const [bookings, customers, trips, routes] = await Promise.all([
      Booking.find(), Customer.countDocuments(), Trip.countDocuments(), Route.countDocuments(),
    ]);
    const totalRevenue = bookings.reduce((s,b)=>s+Number(b.amount||b.totalAmount||0),0);
    const status = { confirmed:0, pending:0, cancelled:0 };
    const routeMap={}, busMap={}, payMap={}, monthMap={};
    bookings.forEach(b => {
      const st = String(b.paymentStatus||"").toLowerCase();
      if (["paid","confirmed"].includes(st))        status.confirmed++;
      else if (st==="pending")                       status.pending++;
      else if (["failed","cancelled","refunded"].includes(st)) status.cancelled++;
      const route=`${b.boardingPoint||""} → ${b.droppingPoint||""}`;
      routeMap[route]=(routeMap[route]||0)+1;
      const bus=b.busNo||b.bus||"—";
      busMap[bus]=(busMap[bus]||0)+1;
      const pm=b.paymentMode||b.paymentMethod||"—";
      payMap[pm]=(payMap[pm]||0)+1;
      const d=b.journeyDate||b.date||b.createdAt;
      const month=d?new Date(d).toLocaleString("en-US",{month:"short",year:"numeric"}):"Unknown";
      if (b.paymentStatus==="Paid") monthMap[month]=(monthMap[month]||0)+Number(b.amount||0);
    });
    res.json({
      totalBookings:bookings.length, totalRevenue, totalCustomers:customers, totalTrips:trips, totalRoutes:routes,
      bookingStatusChart:[
        { name:"Confirmed", value:status.confirmed },
        { name:"Pending",   value:status.pending },
        { name:"Cancelled", value:status.cancelled },
      ],
      topRoutes:      Object.entries(routeMap).map(([route,count])=>({route,count})).sort((a,b)=>b.count-a.count),
      busPerformance: Object.entries(busMap).map(([bus,count])=>({bus,count})).sort((a,b)=>b.count-a.count),
      paymentSummary: Object.entries(payMap).map(([mode,count])=>({mode,count})),
      monthlyRevenue: Object.entries(monthMap).map(([month,amount])=>({month,amount})),
    });
  } catch(err) { res.status(500).json({ message:err.message }); }
});

// ─── SETTINGS ─────────────────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        cashPaymentEnabled: true,
        cashOverridePhones: []
      });
    }
    res.json({
      cashPaymentEnabled: settings.cashPaymentEnabled === true,
      cashOverridePhones: Array.isArray(settings.cashOverridePhones) 
        ? settings.cashOverridePhones.map(String) 
        : [],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});
app.put("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    
    const body = req.body;
    if (body.companyName !== undefined)        settings.companyName        = body.companyName;
    if (body.supportNumber !== undefined)      settings.supportNumber      = body.supportNumber;
    if (body.supportEmail !== undefined)       settings.supportEmail       = body.supportEmail;
    if (body.contactName1 !== undefined)       settings.contactName1       = body.contactName1;
    if (body.contactPhone1 !== undefined)      settings.contactPhone1      = body.contactPhone1;
    if (body.contactPhone2 !== undefined)      settings.contactPhone2      = body.contactPhone2;
    if (body.refundPolicy !== undefined)       settings.refundPolicy       = body.refundPolicy;
    if (body.seatHoldMinutes !== undefined)    settings.seatHoldMinutes    = body.seatHoldMinutes;
    if (body.cashPaymentEnabled !== undefined) settings.cashPaymentEnabled = body.cashPaymentEnabled === true;
    if (body.cashOverridePhones !== undefined) settings.cashOverridePhones = Array.isArray(body.cashOverridePhones)
      ? body.cashOverridePhones.map(String)
      : [];

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET settings
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // 👇 DEFAULT VALUES ADD कर (IMPORTANT)
    if (!settings) {
      settings = {
        cashPaymentEnabled: true,
        cashOverridePhones: []
      };
    }

    res.json({
      cashPaymentEnabled: settings.cashPaymentEnabled ?? true,
      cashOverridePhones: settings.cashOverridePhones ?? [],
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});
app.post("/api/settings", async (req, res) => {
  try {
    const { cashPaymentEnabled, cashOverridePhones } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    // 🔥 IMPORTANT
    settings.cashPaymentEnabled = cashPaymentEnabled;
    settings.cashOverridePhones = cashOverridePhones || [];

    await settings.save();

    res.json({ success: true, settings });

  } catch (err) {
    res.status(500).json({ error: "Save failed" });
  }
});
app.post("/api/buses/raw-update", async (req, res) => {
  try {
    const { id, seaterPrice, sleeperPrice } = req.body;
    const result = await mongoose.connection.db
      .collection("buses")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { seaterPrice: Number(seaterPrice), sleeperPrice: Number(sleeperPrice) } }
      );
    const updated = await mongoose.connection.db
      .collection("buses")
      .findOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true, modified: result.modifiedCount, bus: updated });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/save-token", async (req, res) => {
  try {
    const { token, userId, phone, platform } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token missing" });

    console.log(`📱 Token received: ${token.slice(0, 30)}...`);

    await FCMToken.findOneAndUpdate(
      { token },
      { token, userId: userId || "", phone: phone || "", platform: platform || "android", createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Token saved" });
  } catch (err) {
    console.error("❌ Token save error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Test: get all stored tokens (admin use)
app.get("/api/tokens", async (req, res) => {
  try {
    const tokens = await FCMToken.find({});
    res.json({ success: true, count: tokens.length, tokens: tokens.map(t => ({ id: t._id, preview: t.token.slice(0, 20) + "..." })) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// ─── 5. NOTIFICATION ROUTES ──────────────────────────────────────────
 
// GET all notifications (admin panel polls this)
app.get("/api/notifications/all", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET notifications after a specific ID (for polling new ones)
app.get("/api/notifications", async (req, res) => {
  try {
    const { phone, userId } = req.query;

    // Conditions build करा
    const orConditions = [
      { source: "admin_manual" }, // Admin ने manually पाठवलेल्या
    ];

    // User specific notifications
    if (phone) {
      orConditions.push({ phone: phone, source: "user_booking" });
    }
    if (userId) {
      orConditions.push({ userId: userId, source: "user_booking" });
    }

    const notifications = await Notification.find({
      $or: orConditions,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST send notification → FCM + save to MongoDB
app.post("/api/notifications/send", async (req, res) => {
  try {
    const { title, message, type } = req.body;
 
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Title and message required" });
    }
 
    // 1. Save to MongoDB
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      source:  "admin_manual",
    });
 
    // 2. Send FCM push to all devices
    const fcmResult = await sendFCMToAll(title.trim(), message.trim());
 
    console.log(`🔔 Notification sent: "${title}" | FCM: ${JSON.stringify(fcmResult)}`);
 
    res.status(201).json({
      success: true,
      notification,
      fcm: fcmResult,
      message: `Notification sent. Push: ${fcmResult.success} success, ${fcmResult.failure} failed.`,
    });
  } catch (err) {
    console.error("❌ Send notification error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
 app.post("/api/send-notification", async (req, res) => {
  const { title, message } = req.body;

  const tokensData = await FCMToken.find({});
  const tokens = tokensData.map(t => t.token);

  const payload = {
    notification: {
      title,
      body: message,
    },
  };

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: payload.notification,
  });

  res.json(response);
});
// DELETE a notification
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Legacy route — keep for backward compatibility
app.post("/api/send-notification", async (req, res) => {
  const { title, body } = req.body;
  const result = await sendFCMToAll(title, body);
  res.json({ success: true, ...result });
});
// PATCH /api/buses/:id/seats — block/unblock individual seat
app.patch("/api/buses/:id/block-seat", async (req, res) => {
  try {
    const { seatNo, gender, passengerName, mobile, isBlocked, boardingPoint, droppingPoint } = req.body;
    if (!seatNo) return res.status(400).json({ success: false, message: "seatNo required" });

    let busObjectId;
    try { busObjectId = new mongoose.Types.ObjectId(req.params.id); }
    catch { return res.status(400).json({ success: false, message: "Invalid bus ID" }); }

    const bus = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    const shouldBlock = isBlocked !== false;
    const bp = boardingPoint || "";
    const dp = droppingPoint || "";

    // ✅ Safe array check
    let seats = [];
    if (Array.isArray(bus.seats)) {
      seats = bus.seats;
    } else if (Array.isArray(bus.seatDetails)) {
      seats = bus.seatDetails;
    }

    const idx = seats.findIndex(s => String(s.seatNo) === String(seatNo));

    const newSeat = {
      seatNo:        String(seatNo),
      isBooked:      false,
      isBlocked:     shouldBlock,
      gender:        shouldBlock ? (gender || "") : "",
      passengerName: shouldBlock ? (passengerName || "") : "",
      mobile:        shouldBlock ? (mobile || "") : "",
      boardingPoint: shouldBlock ? bp : "",
      droppingPoint: shouldBlock ? dp : "",
    };

    if (idx >= 0) {
      seats[idx] = { ...seats[idx], ...newSeat };
    } else {
      seats.push(newSeat);
    }

    // Sync blockedSeats 
    let blockedSeats = Array.isArray(bus.blockedSeats) ? [...bus.blockedSeats] : [];
    if (shouldBlock) {
      if (!blockedSeats.includes(String(seatNo))) blockedSeats.push(String(seatNo));
    } else {
      blockedSeats = blockedSeats.filter(s => s !== String(seatNo));
    }

    await mongoose.connection.db.collection("buses").updateOne(
      { _id: busObjectId },
      { $set: { seats, blockedSeats, updatedAt: new Date() } }
    );

    const updated = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    res.json({ success: true, bus: updated, seats: updated.seats || [], blockedSeats: updated.blockedSeats || [] });
  } catch (err) {
    console.error("block-seat error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
app.patch("/api/buses/:id/seats", async (req, res) => {
  try {
    const { seatNo, isBlocked } = req.body;
    if (!seatNo) return res.status(400).json({ success: false, message: "seatNo required" });

    let busObjectId;
    try { busObjectId = new mongoose.Types.ObjectId(req.params.id); }
    catch { return res.status(400).json({ success: false, message: "Invalid bus ID" }); }

    const bus = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    // 1. Sync blockedSeats array
    let blockedSeats = Array.isArray(bus.blockedSeats) ? [...bus.blockedSeats] : [];
    if (isBlocked) {
      if (!blockedSeats.includes(String(seatNo))) blockedSeats.push(String(seatNo));
    } else {
      blockedSeats = blockedSeats.filter(s => s !== String(seatNo));
    }

    // 2. Sync seats[] array (mobile app हे वापरतो)
    let seats = Array.isArray(bus.seats) ? [...bus.seats] : [];
    const seatsIdx = seats.findIndex(s => String(s.seatNo) === String(seatNo));
    if (seatsIdx >= 0) {
      seats[seatsIdx] = {
        ...seats[seatsIdx],
        isBlocked: !!isBlocked,
        gender:        isBlocked ? seats[seatsIdx].gender        : "",
        passengerName: isBlocked ? seats[seatsIdx].passengerName : "",
        mobile:        isBlocked ? seats[seatsIdx].mobile        : "",
      };
    } else if (isBlocked) {
      seats.push({ seatNo: String(seatNo), isBlocked: true, isBooked: false, gender: "", passengerName: "", mobile: "" });
    }

    // 3. Sync seatDetails[] array
    let seatDetails = Array.isArray(bus.seatDetails) ? [...bus.seatDetails] : [];
    const detailIdx = seatDetails.findIndex(s => String(s.seatNo) === String(seatNo));
    if (detailIdx >= 0) {
      seatDetails[detailIdx].isBlocked = !!isBlocked;
    } else {
      seatDetails.push({ seatNo: String(seatNo), isBlocked: !!isBlocked, isBooked: false, passengerName: "", gender: "", bookingId: "" });
    }

    await mongoose.connection.db.collection("buses").updateOne(
      { _id: busObjectId },
      { $set: { blockedSeats, seats, seatDetails, updatedAt: new Date() } }
    );

    const updated = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    res.json({ success: true, bus: updated, blockedSeats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/buses/:id/seat-status — get full seat map for a bus+date
app.get("/api/buses/:id/seat-status", async (req, res) => {
  try {
    const { date } = req.query;
    let busObjectId;
    try { busObjectId = new mongoose.Types.ObjectId(req.params.id); }
    catch { return res.status(400).json({ success: false, message: "Invalid bus ID" }); }

    const bus = await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    // Get booked seats for the date
    const searchDates = [];
    if (date) {
      let iso = date, ddmm = date;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split("/");
        iso = `${yyyy}-${mm}-${dd}`; ddmm = date;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [yyyy, mm, dd] = date.split("-");
        ddmm = `${dd}/${mm}/${yyyy}`; iso = date;
      }
      searchDates.push(iso, ddmm, date);
    }

    const bookingQuery = {
      bookingStatus: { $ne: "Cancelled" },
      paymentStatus: { $nin: ["Failed", "Refunded"] },
      $or: [
        { bus: String(req.params.id) },
        { bus: busObjectId },
      ]
    };
    if (searchDates.length) {
      bookingQuery.$and = [{ $or: [
        { journeyDate: { $in: searchDates } },
        { date: { $in: searchDates } },
      ]}];
    }

    const bookings = await Booking.find(bookingQuery);
    const bookedMap = {};
    bookings.forEach(b => {
  const seats = b.seatNumbers?.length ? b.seatNumbers : [b.seatNo].filter(Boolean);
  const name = b.passengerName || b.customerName || b.passengers?.[0]?.name || "";
  seats.forEach((seatId, idx) => {
    if (!seatId) return;
    const perSeatPassenger = (b.passengers || []).find(
      p => String(p.seatNo || p.seatNumber || p.seat || "") === String(seatId)
    );
    const gender =
      perSeatPassenger?.gender ||
      b.passengers?.[idx]?.gender ||
      b.gender ||
      "Male";
    bookedMap[String(seatId)] = { isBooked: true, gender, passengerName: name, bookingId: String(b._id) };
  });

      seats.forEach(seatId => {
        if (seatId) bookedMap[String(seatId)] = { isBooked: true, gender, passengerName: name, bookingId: String(b._id) };
      });
    });

    const blockedSeats = bus.blockedSeats || [];

    res.json({
      success: true,
      blockedSeats,
      bookedSeats: Object.keys(bookedMap),
      bookedMap,
      seatDetails: bus.seatDetails || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


 // ─── QR PAYMENT SETTINGS API ─────────────────────────────────────

// GET QR settings (mobile app fetches this)
// Add this after QRSettings model definition in server.js
// One-time: ensures only 1 settings doc
app.get("/api/settings", async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        cashPaymentEnabled: true,
        cashOverridePhones: []
      });
    }
    res.json({
      cashPaymentEnabled: settings.cashPaymentEnabled === true,
      cashOverridePhones: Array.isArray(settings.cashOverridePhones) 
        ? settings.cashOverridePhones.map(String) 
        : [],
      contactPhone1: settings.contactPhone1 || "",
      contactPhone2: settings.contactPhone2 || "",
      companyName:   settings.companyName   || "",
      supportEmail:  settings.supportEmail  || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PUT update QR settings (admin panel)
app.get("/api/qr-settings", async (req, res) => {
  try {
    let qr = await QRSettings.findOne();
    if (!qr) qr = await QRSettings.create({});
    res.json({ success: true, settings: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.put("/api/qr-settings", async (req, res) => {
  try {
    const {
      upiId, upiName, qrImageBase64,
      qrEnabled, razorpayEnabled, cashEnabled
    } = req.body;

    let qr = await QRSettings.findOne();
    if (!qr) qr = new QRSettings();

    if (upiId           !== undefined) qr.upiId           = upiId.trim();
    if (upiName         !== undefined) qr.upiName          = upiName.trim();
    if (qrEnabled       !== undefined) qr.qrEnabled        = qrEnabled;
    if (razorpayEnabled !== undefined) qr.razorpayEnabled  = razorpayEnabled;
    // cash is now controlled from Settings page only, not QR settings

    // Only update image if a new one was sent
    if (qrImageBase64 && qrImageBase64.length > 100) {
      qr.qrImageBase64 = qrImageBase64;
    }

    qr.updatedAt = new Date();
    await qr.save();

    res.json({ success: true, settings: qr });
  } catch (err) {
    console.error("QR settings save error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: User submits UTR after QR payment → pending booking
app.post("/api/bookings/qr-pending", async (req, res) => {
  try {
    const body = req.body;
    const passengerName = (
      body.customerName || body.passengerName ||
      body.passengers?.[0]?.name || ""
    ).trim();
    if (!passengerName)
      return res.status(400).json({ success: false, message: "Passenger name required" });

    const code = "QR" + Date.now();
    const booking = new Booking({
      userId:        body.userId || "",
      passengerName,
      customerName:  passengerName,
      phone:         body.phone || body.mobile || "",
      mobile:        body.phone || body.mobile || "",
      email:         body.email || "",
      bus:           String(body.bus || ""),
      busName:       body.busName || "",
      journeyDate:   body.date || body.journeyDate || "",
      date:          body.date || body.journeyDate || "",
      boardingPoint: body.boardingPoint || "",
      droppingPoint: body.droppingPoint || "",
      seatNumbers:   body.seatNumbers || [],
      seatNo:        body.seatNumbers?.[0] || "",
      amount:        Number(body.amount || 0),
      totalAmount:   Number(body.amount || 0),
      paymentMode:   "QR_UPI",
      paymentMethod: "QR_UPI",
      paymentStatus: "Pending",
      bookingStatus: "Pending",
      conductorNote: body.utrNumber || "",   // store UTR here
      bookingCode:   code,
      pnr:           code,
      passengers:    body.passengers || [{
        name:  passengerName,
        phone: body.phone || "",
      }],
    });

    const saved = await booking.save();

    // Notify admin
    try {
      await sendFCMToAll(
        "💰 QR Payment Pending — Verify!",
        `${passengerName} | UTR: ${body.utrNumber || "—"} | ₹${body.amount} | Seats: ${(body.seatNumbers || []).join(", ")}`
      );
      await Notification.create({
        title:   "💰 QR Payment — Verify",
        message: `${passengerName} paid via QR. UTR: ${body.utrNumber || "-"}. Please verify.`,
        type:    "alert",
      });
    } catch {}

    res.status(201).json({
      success:   true,
      booking:   saved,
      bookingId: code,
      message:   "Booking submitted. Admin will verify and confirm shortly.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Admin approves QR payment
app.post("/api/bookings/:id/qr-approve", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid", bookingStatus: "Confirmed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    try {
      await sendFCMToAll(
        "✅ Booking Confirmed!",
        `${booking.passengerName} — QR payment verified! Seats: ${booking.seatNumbers?.join(", ")}`
      );
      await Notification.create({
        title:   "✅ QR Booking Confirmed",
      message: `Booking confirmed for ${booking.passengerName}. Seats: ${booking.seatNumbers?.join(", ")}`,
        type:    "info",
      });
    } catch {}

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Admin rejects QR payment
app.post("/api/bookings/:id/qr-reject", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Failed", bookingStatus: "Cancelled" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    try {
      await Notification.create({
        title:   "❌ QR Payment Rejected",
        message: `${booking.passengerName} चे QR payment reject झाले. Seats released.`,
        type:    "alert",
      });
    } catch {}

    res.json({ success: true, message: "Booking rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─── BUS-WISE BOOKING REPORT API ─────────────────────────────────
app.get("/api/bookings/bus/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const { date } = req.query;

    // Match by bus ObjectId OR busNo string OR busName
    const orConditions = [
      { bus: busId },
      { busNo: busId },
      { busName: busId },
    ];
    if (mongoose.Types.ObjectId.isValid(busId)) {
      orConditions.push({ bus: new mongoose.Types.ObjectId(busId) });
    }

    const query = { $or: orConditions };
    if (date) {
      const searchDates = [date];
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [yyyy, mm, dd] = date.split("-");
        searchDates.push(`${dd}/${mm}/${yyyy}`);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split("/");
        searchDates.push(`${yyyy}-${mm}-${dd}`);
      }
      query.$and = [{ $or: [
        { journeyDate: { $in: searchDates } },
        { date: { $in: searchDates } },
      ]}];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    // ── Blocked seats fetch करा ──
    let blockedSeatsData = [];
    try {
      let busObjectId = null;
      if (mongoose.Types.ObjectId.isValid(busId)) {
        busObjectId = new mongoose.Types.ObjectId(busId);
      }
      const busDoc = busObjectId
        ? await mongoose.connection.db.collection("buses").findOne({ _id: busObjectId })
        : null;

      if (busDoc) {
        const seats = Array.isArray(busDoc.seats) ? busDoc.seats
          : Array.isArray(busDoc.seatDetails) ? busDoc.seatDetails : [];

        blockedSeatsData = seats
          .filter(s => s.isBlocked === true)
          .map(s => ({
            seatNo:        s.seatNo        || "—",
            passengerName: s.passengerName || "—",
            mobile:        s.mobile        || "—",
            gender:        s.gender        || "—",
            boardingPoint: s.boardingPoint || "—",
            droppingPoint: s.droppingPoint || "—",
            isBlocked:     true,
            type:          "BLOCKED",
          }));
      }
    } catch (e) {
      console.log("Blocked seats fetch error:", e.message);
    }

    res.json({
      success:      true,
      bookings,
      total:        bookings.length,
      blockedSeats: blockedSeatsData,
      blockedTotal: blockedSeatsData.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─── DEVICE MANAGEMENT ROUTES ─────────────────────────────────────

// सगळे devices बघ
app.get("/api/admin/devices", async (req, res) => {
  try {
    const devices = await AllowedDevice.find({}).sort({ addedAt: -1 });
    res.json({ success: true, devices });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

// Device approve कर
app.patch("/api/admin/devices/:id/approve", async (req, res) => {
  try {
    const device = await AllowedDevice.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: "Device not found" });
    
    // Notification
    try {
      await Notification.create({
        title: "✅ Device Approved",
message: `Access granted to ${device.deviceName}.`,
        type: "info",
      });
    } catch(e) {}
    
    res.json({ success: true, device });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

// Device reject/delete कर
app.delete("/api/admin/devices/:id", async (req, res) => {
  try {
    await AllowedDevice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Device removed" });
  } catch(err) { res.status(500).json({ message: err.message }); }
});
app.get("/api/admin/backups-list", async (req, res) => {
  try {
    const list = await Backup.find({}).sort({ savedAt: -1 }).lean();
    const result = list.map(b => ({
      _id:           b._id,
      savedAt:       b.savedAt,
      label:         b.label || "",
      busCount:      b.buses?.length      || 0,
      bookingCount:  b.bookings?.length   || 0,
      customerCount: b.customers?.length  || 0,
    }));
    res.json({ success: true, backups: result });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// SILENT AUTO BACKUP — MongoDB मध्ये save
const backupSchema = new mongoose.Schema({
  savedAt:   { type: Date, default: Date.now },
  label:     { type: String, default: "" },
  buses:     Array,
  bookings:  Array,
  customers: Array,
});
// Index for fast date queries
backupSchema.index({ savedAt: -1 });
const Backup =
  mongoose.models.Backup ||
  mongoose.model("Backup", backupSchema);
app.post("/api/admin/backup-silent", async (req, res) => {
  try {
    const [buses, bookings, customers] = await Promise.all([
      mongoose.connection.db.collection("buses").find({}).toArray(),
      Booking.find({}).lean(),
      Customer.find({}).lean(),
    ]);

    const now = new Date();
    const label = now.toISOString().slice(0, 10); // "2026-05-06"

    // Same date चा backup असेल तर UPDATE कर, नाहीतर NEW create कर
    await Backup.findOneAndUpdate(
      { label },
      { 
        buses, bookings, customers,
        savedAt: now,
        label,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Backup saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─── BACKUP & RESTORE ROUTES ─────────────────────────────────────

// DOWNLOAD FULL BACKUP
app.get("/api/admin/backup", async (req, res) => {
  try {
    const [buses, bookings, customers] = await Promise.all([
      mongoose.connection.db.collection("buses").find({}).toArray(),
      Booking.find({}).lean(),
      Customer.find({}).lean(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      buses,
      bookings,
      customers,
    };

    res.setHeader("Content-Disposition", `attachment; filename=shahaji_backup_${Date.now()}.json`);
    res.setHeader("Content-Type", "application/json");
    res.json(backup);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESTORE BUSES
app.post("/api/admin/restore/buses", async (req, res) => {
  try {
    const { buses } = req.body;
    if (!buses || !Array.isArray(buses))
      return res.status(400).json({ success: false, message: "Invalid data" });

    let restored = 0;
    for (const bus of buses) {
      const id = bus._id;
      if (!id) continue;
      try {
        const exists = await mongoose.connection.db
          .collection("buses")
          .findOne({ _id: new mongoose.Types.ObjectId(String(id)) });
        if (!exists) {
          await mongoose.connection.db.collection("buses").insertOne({
            ...bus,
            _id: new mongoose.Types.ObjectId(String(id)),
          });
          restored++;
        }
      } catch (e) { console.log("Bus restore skip:", e.message); }
    }
    res.json({ success: true, restored, total: buses.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESTORE BOOKINGS
app.post("/api/admin/restore/bookings", async (req, res) => {
  try {
    const { bookings } = req.body;
    if (!bookings || !Array.isArray(bookings))
      return res.status(400).json({ success: false, message: "Invalid data" });

    let restored = 0;
    for (const booking of bookings) {
      try {
        const exists = await Booking.findById(booking._id);
        if (!exists) {
          await Booking.create({ ...booking, _id: booking._id });
          restored++;
        }
      } catch (e) { console.log("Booking restore skip:", e.message); }
    }
    res.json({ success: true, restored, total: bookings.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESTORE CUSTOMERS
app.post("/api/admin/restore/customers", async (req, res) => {
  try {
    const { customers } = req.body;
    if (!customers || !Array.isArray(customers))
      return res.status(400).json({ success: false, message: "Invalid data" });

    let restored = 0;
    for (const customer of customers) {
      try {
        const exists = await Customer.findById(customer._id);
        if (!exists) {
          await Customer.create({ ...customer, _id: customer._id });
          restored++;
        }
      } catch (e) { console.log("Customer restore skip:", e.message); }
    }
    res.json({ success: true, restored, total: customers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// RESTORE FROM SILENT BACKUP
app.post("/api/admin/restore-silent", async (req, res) => {
  try {
    const backup = await Backup.findOne().sort({ savedAt: -1 });
    if (!backup) return res.status(404).json({ success: false, message: "No backup found" });

    let restoredBuses = 0, restoredBookings = 0, restoredCustomers = 0;

    // Buses restore
    for (const bus of (backup.buses || [])) {
      try {
        const exists = await mongoose.connection.db
          .collection("buses")
          .findOne({ _id: new mongoose.Types.ObjectId(String(bus._id)) });
        if (!exists) {
          await mongoose.connection.db.collection("buses").insertOne({
            ...bus,
            _id: new mongoose.Types.ObjectId(String(bus._id)),
          });
          restoredBuses++;
        }
      } catch(e) {}
    }

    // Bookings restore
    for (const booking of (backup.bookings || [])) {
      try {
        const exists = await Booking.findById(booking._id);
        if (!exists) {
          await Booking.create({ ...booking, _id: booking._id });
          restoredBookings++;
        }
      } catch(e) {}
    }

    // Customers restore
    for (const customer of (backup.customers || [])) {
      try {
        const exists = await Customer.findById(customer._id);
        if (!exists) {
          await Customer.create({ ...customer, _id: customer._id });
          restoredCustomers++;
        }
      } catch(e) {}
    }

    res.json({
      success: true,
      message: `Restored: ${restoredBuses} buses, ${restoredBookings} bookings, ${restoredCustomers} customers`,
      restoredBuses, restoredBookings, restoredCustomers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
function isValidUTR(utr) {
  if (!utr || typeof utr !== "string") return false;
  const clean = utr.trim().toUpperCase().replace(/\s+/g, "");
  // UTR formats:
  // Bank UTR: 22 chars alphanumeric (HDFC, ICICI, etc.)
  // PhonePe:  starts with T + digits (T2405121234567890123)
  // GPay:     starts with numbers, 12-25 chars
  // Paytm:    alphanumeric 12-25 chars
  if (clean.length < 8 || clean.length > 35) return false;
  if (!/^[A-Z0-9]+$/.test(clean)) return false;
  return true;
}
 
// ── POST /api/upi/init-payment ───────────────────────────────────────────────
// Creates a pending payment record before user opens UPI app
app.post("/api/upi/init-payment", async (req, res) => {
  try {
    const { bookingId, amount, userId, phone, busId, journeyDate } = req.body;
 
    if (!bookingId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "bookingId and amount are required" });
    }
 
    // Check if already exists (idempotent)
    let payment = await UPIPayment.findOne({ bookingId });
    if (payment) {
      if (payment.status === "success") {
        return res.json({ success: true, alreadyPaid: true, payment });
      }
      // Reset expiry for retry
      payment.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      payment.retryCount += 1;
      await payment.save();
      return res.json({ success: true, payment, isRetry: true });
    }
 
    // Fetch UPI settings from DB
    const qrSettings = await QRSettings.findOne();
    const upiId   = qrSettings?.upiId   || "shmitali27@okhdfcbank";
    const payeeName = qrSettings?.upiName || "SHAHAJI TRAVELS";
 
    payment = await UPIPayment.create({
      bookingId,
      amount: Number(amount),
      userId:      userId      || "",
      phone:       phone       || "",
      busId:       busId       || "",
      journeyDate: journeyDate || "",
      upiId,
      payeeName,
      status: "pending",
    });
 
    res.status(201).json({ success: true, payment });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await UPIPayment.findOne({ bookingId: req.body.bookingId });
      return res.json({ success: true, payment: existing, isDuplicate: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ── POST /api/upi/verify-payment ─────────────────────────────────────────────
// Called when user submits UTR after completing UPI payment
app.post("/api/upi/verify-payment", async (req, res) => {
  try {
    const { bookingId, utr, amount } = req.body;

    if (!bookingId || !utr) {
      return res.status(400).json({ success: false, message: "bookingId and utr are required" });
    }

    const cleanUTR = utr.trim().toUpperCase().replace(/\s+/g, "");

    // ✅ Empty UTR check
    if (!cleanUTR || cleanUTR.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Valid UTR enter करा.",
        errorCode: "INVALID_UTR_FORMAT"
      });
    }

    if (!isValidUTR(cleanUTR)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UTR format.",
        errorCode: "INVALID_UTR_FORMAT"
      });
    }

    // ✅ Duplicate UTR check आधी करा
    const existingUTR = await UPIPayment.findOne({ utr: cleanUTR });
    if (existingUTR && existingUTR.bookingId !== bookingId) {
      return res.status(400).json({
        success: false,
        message: "हा UTR already दुसऱ्या booking साठी use झाला आहे.",
        errorCode: "DUPLICATE_UTR"
      });
    }

    let payment = await UPIPayment.findOne({ bookingId });
    if (!payment) {
      payment = new UPIPayment({
        bookingId,
        amount: Number(amount || 0),
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        // ✅ utr आधी set करू नका
      });
      await payment.save();
    }

    if (payment.status === "success") {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: "Payment already verified.",
        payment
      });
    }

    if (new Date() > payment.expiresAt) {
      payment.status = "expired";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment session expired.",
        errorCode: "PAYMENT_EXPIRED"
      });
    }

    // ✅ UTR set करा आणि save करा
    payment.utr = cleanUTR;
    payment.status = "success";
    payment.verifiedAt = new Date();
    
    try {
      await payment.save();
    } catch (saveErr) {
      // ✅ Duplicate key error handle करा
      if (saveErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "हा UTR already use झाला आहे. दुसरा UTR enter करा.",
          errorCode: "DUPLICATE_UTR"
        });
      }
      throw saveErr;
    }

    const booking = await Booking.findOne({
      $or: [
        { bookingCode: bookingId },
        { pnr: bookingId }
      ]
    });

    if (booking) {
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Confirmed";
      booking.conductorNote = `UPI UTR: ${cleanUTR}`;
      await booking.save();
    }

    res.json({
      success: true,
      message: "Payment verified! Booking confirmed.",
      payment,
      booking: booking || null,
      bookingId,
    });

  } catch (err) {
    // ✅ Global duplicate key error catch
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "हा UTR already use झाला आहे.",
        errorCode: "DUPLICATE_UTR"
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});
// server.js मध्ये एकदा add करा, run करा, मग काढा
app.get("/api/fix-upi-payments", async (req, res) => {
  try {
    // Empty UTR असलेले records delete करा
    const result = await UPIPayment.deleteMany({ 
      $or: [
        { utr: "" },
        { utr: null },
        { utr: { $exists: false } }
      ]
    });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// ── GET /api/upi/payment-status/:bookingId ───────────────────────────────────
// Poll this to check if admin manually confirmed payment
app.get("/api/upi/payment-status/:bookingId", async (req, res) => {
  try {
    const payment = await UPIPayment.findOne({ bookingId: req.params.bookingId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    res.json({ success: true, status: payment.status, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ── POST /api/upi/admin-confirm/:bookingId ───────────────────────────────────
// Admin manually confirms a UTR-based payment from admin panel
app.post("/api/upi/admin-confirm/:bookingId", async (req, res) => {
  try {
    const { utr } = req.body;
    const payment = await UPIPayment.findOne({ bookingId: req.params.bookingId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
 
    payment.status     = "success";
    payment.utr        = utr ? utr.trim().toUpperCase() : payment.utr || "ADMIN_CONFIRMED";
    payment.verifiedAt = new Date();
    await payment.save();
 
    // Confirm booking
    await Booking.updateOne(
      { $or: [{ bookingCode: req.params.bookingId }, { pnr: req.params.bookingId }] },
      { paymentStatus: "Paid", bookingStatus: "Confirmed" }
    );
 
    res.json({ success: true, message: "Payment confirmed by admin", payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ── GET /api/upi/pending-verifications ──────────────────────────────────────
// Admin: list all pending UPI payments awaiting verification
app.get("/api/upi/pending-verifications", async (req, res) => {
  try {
    const pending = await UPIPayment.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, payments: pending, count: pending.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// GET all backups list (count only, not full data)
app.get("/api/admin/backups-list", async (req, res) => {
  try {
    const list = await Backup.find({}, {
      _id: 1, savedAt: 1, label: 1,
      busCount:      { $literal: 0 },
      bookingCount:  { $literal: 0 },
      customerCount: { $literal: 0 },
    }).sort({ savedAt: -1 }).lean();

    // counts add karo
    const result = await Promise.all(
      list.map(async (b) => {
        const full = await Backup.findById(b._id).lean();
        return {
          _id:           b._id,
          savedAt:       b.savedAt,
          label:         b.label || "",
          busCount:      full.buses?.length      || 0,
          bookingCount:  full.bookings?.length   || 0,
          customerCount: full.customers?.length  || 0,
        };
      })
    );

    res.json({ success: true, backups: result });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Restore from specific backup ID
app.post("/api/admin/restore-by-id/:id", async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) 
      return res.status(404).json({ success: false, message: "Backup not found" });

    let restoredBuses = 0, restoredBookings = 0, restoredCustomers = 0;

    for (const bus of (backup.buses || [])) {
      try {
        const exists = await mongoose.connection.db.collection("buses")
          .findOne({ _id: new mongoose.Types.ObjectId(String(bus._id)) });
        if (!exists) {
          await mongoose.connection.db.collection("buses").insertOne({
            ...bus,
            _id: new mongoose.Types.ObjectId(String(bus._id))
          });
          restoredBuses++;
        }
      } catch(e) {}
    }

    for (const booking of (backup.bookings || [])) {
      try {
        const exists = await Booking.findById(booking._id);
        if (!exists) {
          await Booking.create({ ...booking, _id: booking._id });
          restoredBookings++;
        }
      } catch(e) {}
    }

    for (const customer of (backup.customers || [])) {
      try {
        const exists = await Customer.findById(customer._id);
        if (!exists) {
          await Customer.create({ ...customer, _id: customer._id });
          restoredCustomers++;
        }
      } catch(e) {}
    }

    res.json({
      success: true,
      message: `✅ Restored: ${restoredBuses} buses, ${restoredBookings} bookings, ${restoredCustomers} customers`,
      restoredBuses, restoredBookings, restoredCustomers,
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get('/razorpay-checkout', (req, res) => {
  const { key, order_id, amount, name, email, phone, desc } = req.query;
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>Payment - Shahaji Travels</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
    .box{background:#fff;padding:32px 24px;border-radius:20px;max-width:380px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.10)}
    .title{font-size:22px;font-weight:800;color:#C0392B;margin-bottom:4px}
    .sub{color:#888;font-size:13px;margin-bottom:20px}
    .amt{font-size:42px;font-weight:800;color:#1C1C1E;margin-bottom:6px}
    .route{color:#555;font-size:13px;margin-bottom:28px;line-height:1.5}
    .btn{background:#C0392B;color:#fff;border:none;border-radius:14px;padding:18px;font-size:16px;font-weight:700;width:100%;cursor:pointer;margin-top:8px}
    .btn:active{background:#96281B}
    .spinner{width:36px;height:36px;border:4px solid #f0f0f0;border-top:4px solid #C0392B;border-radius:50%;animation:spin .8s linear infinite;margin:20px auto}
    .msg{font-size:13px;color:#666;margin-top:8px;line-height:1.6}
    .success{color:#27AE60;font-weight:700;font-size:16px;margin-top:16px;line-height:1.6}
    .fail{color:#C0392B;font-size:13px;margin-top:12px}
    .note{font-size:12px;color:#aaa;margin-top:20px;line-height:1.5;padding:10px;background:#f9f9f9;border-radius:8px}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
<div class="box">
  <div class="title">🚌 Shahaji Travels</div>
  <div class="sub">Secure Payment · Razorpay</div>
  <div class="amt">₹${Math.round(parseInt(amount || 0) / 100)}</div>
  <div class="route">${decodeURIComponent(desc || '')}</div>
  <button class="btn" id="payBtn" onclick="startPay()">Pay Now →</button>
  <div id="status"></div>
  <div class="note" id="note">Payment complete झाल्यावर automatically app मध्ये redirect होईल</div>
</div>
<script>
var paid = false;
var paymentId = null;
var orderId = null;
var signature = null;

function startPay() {
  document.getElementById('payBtn').style.display = 'none';
  document.getElementById('status').innerHTML = 
    '<div class="spinner"></div><div class="msg">Razorpay उघडत आहे...</div>';
  
  var options = {
    key: '${key}',
    amount: '${amount}',
    currency: 'INR',
    name: 'Shahaji Travels',
    description: '${decodeURIComponent(desc || '')}',
    order_id: '${order_id}',
    prefill: {
      name: '${decodeURIComponent(name || '')}',
      email: '${decodeURIComponent(email || '')}',
      contact: '${phone || ''}'
    },
    theme: { color: '#C0392B' },
    handler: function(response) {
      paid = true;
      paymentId = response.razorpay_payment_id;
      orderId   = response.razorpay_order_id;
      signature = response.razorpay_signature;
      
      document.getElementById('status').innerHTML =
        '<div class="spinner"></div><div class="msg">Payment verify करत आहे...</div>';
      document.getElementById('note').style.display = 'none';
      
      // Backend ला verify करायला पाठवा
      fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id:   orderId,
          razorpay_signature:  signature,
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          // ✅ Verified - App ला payment ID पाठवा
          document.getElementById('status').innerHTML =
            '<div class="success">✅ Payment Verified!<br><br>Booking confirm होत आहे...<br>App मध्ये परत जा.</div>';
          
          // Deep link वापरून app ला payment details पाठवा
          var params = 'razorpay_payment_id=' + paymentId + 
                       '&razorpay_order_id=' + orderId + 
                       '&razorpay_signature=' + encodeURIComponent(signature) +
                       '&status=success';
          
          // App deep link try करा
          setTimeout(function() {
            window.location.href = 'shahajiravels://payment?' + params;
          }, 1000);
          
          // Fallback - 3 seconds नंतर
          setTimeout(function() {
            window.location.href = 'shahajitravels://payment?' + params;
          }, 3000);
          
        } else {
          document.getElementById('status').innerHTML =
            '<div class="fail">❌ Payment verify नाही झाले.<br>Support: 9021694503</div>';
          document.getElementById('payBtn').style.display = 'block';
          document.getElementById('payBtn').textContent = 'Retry →';
          paid = false;
        }
      })
      .catch(function(err) {
        // Network error - तरी payment ID save झाला
        document.getElementById('status').innerHTML =
          '<div class="success">✅ Payment Done!<br><br>App मध्ये परत जा.<br>Payment ID: ' + paymentId.slice(0,15) + '...</div>';
        
        setTimeout(function() {
          var params = 'razorpay_payment_id=' + paymentId + 
                       '&razorpay_order_id=' + orderId + 
                       '&status=success';
          window.location.href = 'shahajiravels://payment?' + params;
        }, 1500);
      });
    },
    modal: {
      ondismiss: function() {
        if (!paid) {
          document.getElementById('status').innerHTML = '';
          document.getElementById('payBtn').style.display = 'block';
          document.getElementById('note').style.display = 'block';
        }
      }
    }
  };
  
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    document.getElementById('status').innerHTML =
      '<div class="fail">❌ Payment Failed!<br>' + 
      response.error.description + '<br><br>पुन्हा try करा.</div>';
    document.getElementById('payBtn').style.display = 'block';
    document.getElementById('payBtn').textContent = 'Retry →';
    paid = false;
  });
  rzp.open();
}

window.onload = function() { 
  setTimeout(startPay, 800); 
};
</script>
</body>
</html>`);
});
// ── Refund Pending List ──────────────────────────────────────────
app.get("/api/refunds/pending", async (req, res) => {
  try {
    const refunds = await Booking.find({
      bookingStatus: "Cancelled",
      refundStatus:  "Processing",
      refundAmount:  { $gt: 0 },
    }).sort({ cancelledAt: -1 });

    res.json({ success: true, refunds });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/refunds/completed", async (req, res) => {
  try {
    const refunds = await Booking.find({
      bookingStatus: "Cancelled",
      refundStatus:  "Refunded",
      refundAmount:  { $gt: 0 },
    }).sort({ updatedAt: -1 }).limit(50);

    res.json({ success: true, refunds });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Refund Mark as Done ──────────────────────────────────────────
app.patch("/api/refunds/:id/done", async (req, res) => {
  try {
    const { note } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        refundStatus:  "Refunded",
        conductorNote: note || "Refund completed",
      },
      { new: true }
    );
    if (!booking) 
      return res.status(404).json({ message: "Booking not found" });

    try {
      await Notification.create({
        title:   "✅ Refund Completed",
       message: `₹${booking.refundAmount} refund paid to ${booking.passengerName}.`,
        type:    "info",
      });
    } catch(_) {}

    res.json({ success: true, booking });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/admin/create-subadmin", async (req, res) => {
  try {
    const { email, password, permissions } = req.body;
    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Admin already exists" });
    
    const newAdmin = await Admin.create({
      email: email.toLowerCase(),
      password,
      role: "subadmin",
      permissions: permissions || []
    });
    res.json({ success: true, admin: newAdmin });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/admin/list", async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 });
    res.json({ success: true, admins });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/admin/:id", async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ message: err.message }); }
});
// ─── 404 & ERROR ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message:`Route ${req.method} ${req.path} not found` });
});
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message:err.message||"Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚌 Shahaji Travels Server → http://localhost:${PORT}`);
  console.log(`   Create admin : http://localhost:${PORT}/create-admin`);
  console.log(`   Fix bus times: http://localhost:${PORT}/fix-bus-times  ← Run ONCE then done`);
});