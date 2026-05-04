
// App.js — Shahaji Travels Bus Booking App
// ✅ LOGO FIXED — No errors
// ✅ Registration WITHOUT OTP
// ✅ Ticket: only PDF download
// ✅ Payment: Cash / UPI / Card options
// ✅ Full Language: English / मराठी / हिंदी
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator, Animated, BackHandler,
  Dimensions, FlatList, Image, KeyboardAvoidingView, Linking,
  Modal, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, View,
} from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as IntentLauncher from "expo-intent-launcher";
import { sendOtp, verifyOtp, resetOtpState } from "./src/firebase/phoneAuth";
import { api }                                               from "./src/api/api";
import { translations, SUPPORTED_LANGUAGES, POINT_NAMES }   from "./src/i18n/translations";
import {
  ProfileScreen, MyBookingsScreen, OffersScreen,
  GetTicketScreen, CancelTicketScreen, CustomerCareScreen,
  LanguageScreen, LogoutScreen, TermsModal,   // ← हे add करा
} from "./DrawerScreens";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
const API_BASE = "https://shahaji-travels-backend.onrender.com";
const { width: SW, height: SH } = Dimensions.get('window');
const IS_WEB = Platform.OS === "web";

// ─── LOGO ────────────────────────────────────────────────────────
const SHAHAJI_LOGO = require('./assets/images/shahaji_logo.png');

const LogoImage = ({ width = 80, height = 80, borderRadius = 10, style = {} }) => {
  if (IS_WEB) {
    return (
      <img
        src={SHAHAJI_LOGO}
        style={{ width, height, borderRadius, objectFit: "contain", display: "block" }}
        alt="Shahaji Travels"
      />
    );
  }
  return (
    <Image
      source={SHAHAJI_LOGO}
      style={[{ width, height, borderRadius }, style]}
      resizeMode="contain"
    />
  );
};
async function registerForPush(userId = "", phone = "") {
  try {
    if (!Device.isDevice) {
      console.log("⚠️ Push: physical device required");
      return null;
    }
 
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("shahaji_channel", {
        name: "Shahaji Travels",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#C0392B",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }
 
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
 
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
 
    if (finalStatus !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }
 
    let token = null;
 
    try {
      // Method 1: Native FCM token (firebase-admin साठी)
      const result = await Notifications.getDevicePushTokenAsync();
      token = result.data;
      console.log("📱 Native token:", token.slice(0, 25) + "...");
    } catch (err1) {
      console.log("⚠️ Native token failed:", err1.message);
      try {
        // Method 2: Expo push token (fallback)
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
 
        const result = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();
 
        token = result.data;
        console.log("📱 Expo token:", token.slice(0, 25) + "...");
      } catch (err2) {
        console.error("❌ Both token methods failed:", err2.message);
        return null;
      }
    }
 
    if (!token) return null;
 
    // Backend ला save करा
    try {
      const res = await fetch(`${API_BASE}/api/save-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: userId || "",
          phone: phone || "",
          platform: Platform.OS,
        }),
      });
      const data = await res.json();
      if (data.success) console.log("✅ Token saved to backend");
      else console.warn("⚠️ Token save failed:", data.message);
    } catch (saveErr) {
      console.warn("⚠️ Backend save error:", saveErr.message);
    }
 
    return token;
  } catch (err) {
    console.error("❌ registerForPush error:", err.message);
    return null;
  }
}


// ─── COLORS ───────────────────────────────────────────────────────
const C = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  red: "#C0392B",
  redDark: "#96281B",
  redLight: "#FDECEA",
  redBorder: "#F5C6C2",
  green: "#27AE60",
  greenLight: "#EAFAF1",
  greenBorder: "#A9DFBF",
  text: "#1C1C1E",
  textMid: "#3D3D3D",
  textSub: "#8E8E93",
  border: "#E5E5EA",
  borderDark: "#C7C7CC",
  chip: "#F2F2F7",
  warning: "#FF9500",
  white: "#FFFFFF",
  black: "#1C1C1E",
  blue: "#0A84FF",
  blueLight: "#E8F4FE",
  blueBorder: "#A8D4FA",
  shadow: "#00000014",
};

const F = { xs: 11, sm: 13, md: 15, lg: 17, xl: 19, xxl: 24, xxxl: 30 };

// ─── SEAT LAYOUT ──────────────────────────────────────────────────
const LOWER_SEATS = [
  ["V1",  "", "1",  "2"],
  ["V2",  "", "3",  "4"],
  ["V3",  "", "5",  "6"],
  ["V4",  "", "7",  "8"],
  ["V5",  "", "9",  "10"],
  ["V6",  "", "11", "12"],
  ["V7",  "", "13", "14"],
  ["V8",  "", "15", "16"],
  ["V9",  "", "17", "18"],
  ["V10", "", "19", "20"],
  ["V11", "", "21", "22"],
  ["V12", "", "23", "24"],
];

const UPPER_SEATS = [
  ["A1", "", "A", "B"],
  ["A2", "", "C", "D"],
  ["A3", "", "E", "F"],
  ["A4", "", "G", "H"],
  ["A5", "", "I", "J"],
  ["A6", "", "K", "L"],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
   ["", "", "", ""],
    ["", "", "", ""],
     ["", "", "", ""],
      ["", "", "", ""],
       ["", "", "", ""],
        ["", "", "", ""],
];

const SLEEPER_LEFT = [
  ["E", "F"],["5", "6"],["13","14"],["21","22"],["31","32"],["33","34"],
];
const SLEEPER_RIGHT = [
  ["A", "B"],["1", "2"],["9", "10"],["17","18"],["25","26"],["37","38"],
];
const SLEEPER_LEFT_UPPER = [
  ["G", "H"],["7", "8"],["15","16"],["23","24"],["29","30"],["35","36"],
];
const SLEEPER_RIGHT_UPPER = [
  ["C", "D"],["3", "4"],["11","12"],["19","20"],["27","28"],["39","40"],
];

const CITIES = [
  "Karad","Mumbai","Pune","Kolhapur","Satara","Sangli","Solapur",
  "Ratnagiri","Nagpur","Nashik","Aurangabad","Swargate","Shivajinagar",
  "Panjim","Mapusa","Margao",
];

const PAYMENT_METHODS = [
  { key: "Cash",  label: "Cash",  icon: "💵" },
  { key: "UPI",   label: "UPI",   icon: "📱" },
  { key: "Card",  label: "Card",  icon: "💳" },
];

// ─── DATE HELPERS ─────────────────────────────────────────────────
const padTwo      = (n) => String(n).padStart(2, "0");
const getTodayStr = () => { const d = new Date(); return `${padTwo(d.getDate())}/${padTwo(d.getMonth()+1)}/${d.getFullYear()}`; };
const getDateOffset = (o) => { const d = new Date(); d.setDate(d.getDate()+o); return `${padTwo(d.getDate())}/${padTwo(d.getMonth()+1)}/${d.getFullYear()}`; };
const getDayName    = (o) => { const n=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]; const d=new Date(); d.setDate(d.getDate()+o); return n[d.getDay()]; };

const getPointName = (marathiName, language) => {
  if (!marathiName) return marathiName;
  const entry = POINT_NAMES[marathiName];
  if (!entry) return marathiName;
  if (language === "English") return entry.en || marathiName;
  if (language === "हिंदी")   return entry.hi || marathiName;
  return marathiName;
};

// ─── PDF ──────────────────────────────────────────────────────────
const buildTicketHTML = ({ ticket, user, selectedBus }) => {
  const from     = (ticket?.route || "").split("→")[0]?.trim() || "Origin";
  const to       = (ticket?.route || "").split("→")[1]?.trim() || "Destination";
  const busName  = ticket?.busName || ticket?.bus?.name || "Shahaji Travels";
  const busType  = ticket?.busType || ticket?.bus?.type || "AC Sleeper";
  const busNumber =
  ticket?.busNumber ||
  ticket?.busNo ||
  selectedBus?.number ||
  selectedBus?.busNumber ||
  selectedBus?.numberPlate ||
  "";
  const paxName  = ticket?.passengers?.[0]?.name || user?.name || "";
  const paxPhone = ticket?.passengers?.[0]?.phone || user?.phone || "";
  const seats    = Array.isArray(ticket?.selectedSeats)
    ? ticket.selectedSeats.join(", ")
    : (ticket?.seatNumbers?.join?.(", ") || ticket?.seatNo || "");
  const bookingId= ticket?.bookingId || "";
  const dep      = ticket?.departure || "--:--";
  const arr      = ticket?.arrival   || "--:--";
  const dur      = ticket?.duration  || "";
  const date     = ticket?.date      || "";
  const boarding = ticket?.boardingPoint || "";
  const dropping = ticket?.droppingPoint || "";
  const payment  = ticket?.paymentMode   || "Cash";
  const amount   = ticket?.amount        || 0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#f5f5f5; padding:20px; font-family:Helvetica,Arial,sans-serif; }
.wrap { max-width:480px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #ddd; }
.head { background:#C0392B; padding:20px; text-align:center; color:#fff; }
.head-title { font-size:20px; font-weight:bold; letter-spacing:2px; }
.head-sub { font-size:11px; opacity:0.85; margin-top:4px; }
.badge { display:inline-block; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.5); border-radius:20px; padding:4px 14px; font-size:11px; font-weight:bold; margin-top:8px; }
.route { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:#FDECEA; border-bottom:1px solid #F5C6C2; }
.city { font-size:20px; font-weight:bold; color:#1C1C1E; }
.city-sub { font-size:10px; color:#888; margin-top:3px; }
.arrow { font-size:20px; color:#C0392B; font-weight:bold; }
.timebar { display:flex; justify-content:space-between; align-items:center; padding:10px 18px; background:#FFF8E1; border-bottom:1px solid #FFE082; }
.timecell { text-align:center; }
.timelabel { font-size:9px; color:#FF9500; font-weight:bold; letter-spacing:1px; }
.timeval { font-size:18px; font-weight:bold; color:#E65100; }
.timesub { font-size:9px; color:#888; }
.dur { text-align:center; font-size:10px; color:#888; }
.sep { border:none; border-top:2px dashed #E0E0E0; margin:0 12px; }
.body { padding:14px 18px; }
.bid { background:#E8F4FE; border:1.5px dashed #0A84FF; border-radius:8px; padding:10px; text-align:center; margin-bottom:12px; }
.bid-label { font-size:9px; font-weight:bold; color:#0A84FF; letter-spacing:2px; }
.bid-value { font-size:18px; font-weight:bold; color:#0070D0; letter-spacing:2px; margin-top:2px; }
table { width:100%; border-collapse:collapse; }
td { padding:7px 0; border-bottom:1px solid #F5F5F5; font-size:12px; }
td:first-child { color:#666; width:42%; }
td:last-child { color:#111; font-weight:bold; text-align:right; }
.amt { background:#EAFAF1; border-radius:8px; padding:12px; text-align:center; margin-top:12px; border:1px solid #A9DFBF; }
.amt-lbl { font-size:10px; font-weight:bold; color:#1B5E20; letter-spacing:1px; }
.amt-val { font-size:26px; font-weight:bold; color:#1B5E20; margin-top:2px; }
.foot { background:#1C1C1E; padding:12px 18px; text-align:center; }
.foot p { color:#999; font-size:10px; line-height:1.8; }
.foot strong { color:#F5C6C2; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="head-title">SHAHAJI TRAVELS</div>
    <div class="head-sub">Your Journey Begins Here</div>
    <div class="badge">BOOKING CONFIRMED</div>
  </div>
  <div class="route">
    <div><div class="city">${from}</div><div class="city-sub">Boarding Point</div></div>
    <div class="arrow">--&gt;</div>
    <div style="text-align:right"><div class="city">${to}</div><div class="city-sub">Dropping Point</div></div>
  </div>
  <div class="timebar">
    <div class="timecell">
      <div class="timelabel">DEPARTURE</div>
      <div class="timeval">${dep}</div>
      <div class="timesub">From Origin</div>
    </div>
    <div class="dur">${dur}</div>
    <div class="timecell">
      <div class="timelabel">ARRIVAL</div>
      <div class="timeval">${arr}</div>
      <div class="timesub">At Destination</div>
    </div>
  </div>
  <hr class="sep"/>
  <div class="body">
    <div class="bid">
      <div class="bid-label">BOOKING ID</div>
      <div class="bid-value">${bookingId}</div>
    </div>
    <table>
      <tr><td>Passenger</td><td>${paxName}</td></tr>
      <tr><td>Phone</td><td>${paxPhone}</td></tr>
      <tr><td>Bus</td><td>${busName}</td></tr>
      <tr><td>Bus No</td><td>${busNumber || "—"}</td></tr>
      <tr><td>Bus Type</td><td>${busType}</td></tr>
      <tr><td>Date</td><td>${date}</td></tr>
      <tr><td>Seat(s)</td><td>${seats}</td></tr>
      <tr><td>Boarding</td><td>${boarding}</td></tr>
      <tr><td>Dropping</td><td>${dropping}</td></tr>
      <tr><td>Payment</td><td>${payment}</td></tr>
    </table>
    <div class="amt">
      <div class="amt-lbl">TOTAL AMOUNT PAID</div>
      <div class="amt-val">Rs. ${amount}</div>
    </div>
  </div>
  <div class="foot">
  <p>Arrive at boarding point <strong>15 minutes early</strong>.<br/>
  Carry valid photo ID. No refund within 2 hours of departure.<br/>
  Thank you for choosing <strong>Shahaji Travels</strong>.</p>
  
  <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.2);">
    <p style="color:#fff; font-size:11px; font-weight:bold;">
      Developed by Mr. Digambar Barge
    </p>
    <p style="color:#fff; font-size:10px; margin-top:3px;">
      📞 9021694503 &nbsp;|&nbsp; ✉️ digubarge123@gmail.com
    </p>
  </div>
</div>
</body>
</html>`;
};
const isCashAllowed = (cashSettings, phone) => {
  if (cashSettings.cashPaymentEnabled === true) return true;
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const overrides = (cashSettings.cashOverridePhones || []).map(p => String(p).replace(/\D/g, ""));
  return overrides.includes(cleanPhone);
};

// ─── SHARE TICKET PDF ─────────────────────────────────────────────
const shareTicketPDF = async (ticket, user, selectedBus, showAlert, setLoading, setLoadMsg) => {
  try {
  const html = buildTicketHTML({ ticket, user, selectedBus });
    if (Platform.OS === "web") {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Ticket_${ticket?.bookingId || Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    setLoading(true);
    setLoadMsg("Generating PDF...");

    let pdfUri = null;
    try {
      const result = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
      pdfUri = result?.uri;
    } catch (e) {
      const result2 = await Print.printToFileAsync({ html: buildSimpleHTML(ticket, user), base64: false });
      pdfUri = result2?.uri;
    }

    if (!pdfUri) throw new Error("PDF could not be generated.");

    const fileName = `ShahajTravels_${ticket?.bookingId || Date.now()}.pdf`;

    if (Platform.OS === "android") {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        showAlert("Permission Denied", "Storage permission is required to save PDF.");
        return;
      }
      setLoadMsg("Saving to Downloads...");
      const cacheUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: pdfUri, to: cacheUri });
      const asset = await MediaLibrary.createAssetAsync(cacheUri);
      try {
        const album = await MediaLibrary.getAlbumAsync("Download");
        if (album) { await MediaLibrary.addAssetsToAlbumAsync([asset], album, false); }
        else { await MediaLibrary.createAlbumAsync("Download", asset, false); }
      } catch (albumErr) { console.warn("Album error:", albumErr.message); }
      setLoading(false);
      const contentUri = await FileSystem.getContentUriAsync(cacheUri);
      showAlert("✅ PDF Downloaded!", `"${fileName}"\n\nFiles > Downloads मध्ये save झाली!\n\nOpen करायची?`, [
        { text: "Cancel", style: "cancel" },
        { text: "📂 Open PDF", onPress: async () => {
          try {
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", { data: contentUri, flags: 1, type: "application/pdf" });
          } catch { showAlert("No PDF App", "PDF viewer app install kara (Adobe Acrobat etc.)"); }
        }},
      ]);
      return;
    }

    if (Platform.OS === "ios") {
      const destUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: pdfUri, to: destUri });
      setLoading(false);
      await Sharing.shareAsync(destUri, { mimeType: "application/pdf", dialogTitle: "Save Ticket PDF", UTI: "com.adobe.pdf" });
    }
  } catch (err) {
    setLoading(false);
    showAlert("PDF Error", err?.message || "Could not generate PDF.");
  } finally {
    setLoading(false);
  }
};

const buildSimpleHTML = (ticket, user) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
body{font-family:Arial,sans-serif;padding:30px;color:#333;}
h1{color:#C0392B;font-size:22px;border-bottom:2px solid #C0392B;padding-bottom:8px;}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}
.label{color:#888;font-size:13px;}.val{font-weight:bold;font-size:13px;text-align:right;}
.total{background:#EAFAF1;padding:14px;border-radius:8px;text-align:center;margin-top:16px;}
.total-amt{font-size:24px;font-weight:bold;color:#27AE60;}
</style></head><body>
<h1>SHAHAJI TRAVELS - TICKET</h1>
<div class="row"><span class="label">Booking ID</span><span class="val">${ticket?.bookingId || ""}</span></div>
<div class="row"><span class="label">Passenger</span><span class="val">${ticket?.passengers?.[0]?.name || user?.name || ""}</span></div>
<div class="row"><span class="label">Phone</span><span class="val">${ticket?.passengers?.[0]?.phone || user?.phone || ""}</span></div>
<div class="row"><span class="label">From</span><span class="val">${(ticket?.route || "").split("→")[0] || ""}</span></div>
<div class="row"><span class="label">To</span><span class="val">${(ticket?.route || "").split("→")[1] || ""}</span></div>
<div class="row"><span class="label">Date</span><span class="val">${ticket?.date || ""}</span></div>
<div class="row"><span class="label">Bus</span><span class="val">${ticket?.busName || "Shahaji Travels"}</span></div>
<div class="row"><span class="label">Bus No</span><span class="val">${ticket?.busNumber || "—"}</span></div>
<div class="row"><span class="label">Seats</span><span class="val">${Array.isArray(ticket?.selectedSeats) ? ticket.selectedSeats.join(", ") : ""}</span></div>
<div class="row"><span class="label">Boarding</span><span class="val">${ticket?.boardingPoint || ""}</span></div>
<div class="row"><span class="label">Dropping</span><span class="val">${ticket?.droppingPoint || ""}</span></div>
<div class="row"><span class="label">Payment</span><span class="val">${ticket?.paymentMode || "Cash"}</span></div>
<div class="total"><div class="label">TOTAL PAID</div><div class="total-amt">Rs. ${ticket?.amount || 0}</div></div>
</body></html>`;
// ============================================================
// HomeScreen Component — Real bookings + offers, white/red only

// ============================================================

const OTP_LENGTH = 6;

const OtpVerifyModal = ({
  visible, phone, otpValue, setOtpValue,
  otpVerifying, otpSending, otpResendTimer,
  onVerify, onResend, onCancel,
}) => {
  const inputRefs = useRef([]);
  const [boxes, setBoxes] = useState(Array(OTP_LENGTH).fill(""));

  useEffect(() => { setOtpValue(boxes.join("")); }, [boxes]);

  useEffect(() => {
    if (visible) {
      setBoxes(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 350);
    }
  }, [visible]);

  const handleChange = (text, idx) => {
    const char = text.replace(/\D/g, "").slice(-1);
    const next = [...boxes]; next[idx] = char; setBoxes(next);
    if (char && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKey = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !boxes[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      const next = [...boxes]; next[idx - 1] = ""; setBoxes(next);
    }
  };

  const masked = phone
    ? "+91 " + String(phone).slice(0,2) + "****" + String(phone).slice(-4)
    : "";
  const allFilled = boxes.every(b => b !== "");

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={otpSt.overlay}>
        <View style={otpSt.sheet}>
          <View style={otpSt.handle} />
          <View style={otpSt.iconWrap}><Text style={{fontSize:36}}>🔐</Text></View>
          <Text style={otpSt.title}>OTP Verification</Text>
          <Text style={otpSt.sub}>
            {`${masked} वर OTP पाठवला आहे.\nBooking confirm करण्यासाठी OTP enter करा.`}
          </Text>
          <View style={otpSt.boxRow}>
            {boxes.map((val, idx) => (
              <TextInput
                key={idx}
                ref={r => (inputRefs.current[idx] = r)}
                style={[otpSt.box, val ? otpSt.boxFilled : null]}
                value={val}
                onChangeText={t => handleChange(t, idx)}
                onKeyPress={e => handleKey(e, idx)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                textContentType="oneTimeCode"
                autoComplete={idx === 0 ? "sms-otp" : "off"}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[otpSt.verifyBtn, (!allFilled || otpVerifying) && otpSt.verifyBtnOff]}
            onPress={onVerify}
            disabled={!allFilled || otpVerifying}
            activeOpacity={0.85}
          >
            {otpVerifying
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={otpSt.verifyBtnTxt}>✓ OTP Verify करा</Text>}
          </TouchableOpacity>
          <View style={otpSt.resendRow}>
            {otpSending ? <ActivityIndicator size="small" color="#C0392B" /> :
             otpResendTimer > 0
              ? <Text style={otpSt.timerTxt}>Resend OTP {otpResendTimer}s मध्ये</Text>
              : <TouchableOpacity onPress={onResend}>
                  <Text style={otpSt.resendTxt}>OTP मिळाला नाही? Resend करा</Text>
                </TouchableOpacity>}
          </View>
          <TouchableOpacity style={otpSt.cancelBtn} onPress={onCancel}>
            <Text style={otpSt.cancelTxt}>रद्द करा</Text>
          </TouchableOpacity>
          <Text style={otpSt.note}>🔒 Firebase द्वारे सुरक्षित OTP</Text>
        </View>
      </View>
    </Modal>
  );
};

const otpSt = StyleSheet.create({
  overlay:      { flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" },
  sheet:        { backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28,
                  paddingHorizontal:28, paddingBottom:44, paddingTop:14, alignItems:"center" },
  handle:       { width:44, height:5, backgroundColor:"#E0E0E0", borderRadius:3, marginBottom:22 },
  iconWrap:     { width:76, height:76, borderRadius:38, backgroundColor:"#FDECEA",
                  justifyContent:"center", alignItems:"center", marginBottom:14,
                  borderWidth:1.5, borderColor:"#F5C6C2" },
  title:        { fontSize:22, fontWeight:"800", color:"#1C1C1E", marginBottom:8 },
  sub:          { fontSize:13, color:"#666", textAlign:"center", lineHeight:21, marginBottom:28 },
  boxRow:       { flexDirection:"row", gap:10, marginBottom:28 },
  box:          { width:46, height:58, borderWidth:1.5, borderColor:"#D0D0D0",
                  borderRadius:12, textAlign:"center", fontSize:24, fontWeight:"700",
                  color:"#1C1C1E", backgroundColor:"#FAFAFA" },
  boxFilled:    { borderColor:"#C0392B", backgroundColor:"#FFF5F5" },
  verifyBtn:    { backgroundColor:"#C0392B", borderRadius:14, paddingVertical:16,
                  width:"100%", alignItems:"center", marginBottom:16 },
  verifyBtnOff: { opacity:0.42 },
  verifyBtnTxt: { color:"#fff", fontSize:16, fontWeight:"700" },
  resendRow:    { height:38, justifyContent:"center", alignItems:"center", marginBottom:10 },
  timerTxt:     { fontSize:13, color:"#888", fontWeight:"500" },
  resendTxt:    { fontSize:13, color:"#C0392B", fontWeight:"700", textDecorationLine:"underline" },
  cancelBtn:    { paddingVertical:10, paddingHorizontal:28, marginBottom:8 },
  cancelTxt:    { fontSize:14, color:"#999", fontWeight:"600" },
  note:         { fontSize:11, color:"#BBB", textAlign:"center" },
});
// ─── FIXED HomeScreen — Replace entire HomeScreen function in App.js ──────────
// Changes:
// 1. Popular routes fetched from API (/api/popular-routes?active=true)
// 2. Offers fetched from API (/api/offers)
// 3. Last booking properly displayed with all passenger info
// 4. Fallback to defaults if API fails

function HomeScreen({
  user, wallet, search, setSearch,
  fromInput, setFromInput, toInput, setToInput,
  showFromSug, setShowFromSug, showToSug, setShowToSug,
  showCalendar, setShowCalendar, calYear, setCalYear, calMonth, setCalMonth,
  language, t, loading, loadMsg, alertState, hideAlert,
  showProfile, setShowProfile,
  showMyBookings, setShowMyBookings, showOffers, setShowOffers,
  showGetTicket, setShowGetTicket, showCancelTicket, setShowCancelTicket,
  showCustomerCare, setShowCustomerCare, showLanguage, setShowLanguage,
  showLogout, setShowLogout,
  drawerOpen, openDrawer, closeDrawer, drawerAnim, drawerItems,
  changeLanguage, SUPPORTED_LANGUAGES, handleLogoutConfirm,
  handleSearch, handleCalDate, getDaysInMonth, getFirstDay,
  getTodayStr, getDateOffset, getDayName, padTwo,
  showAlert, api, setScreen, CITIES,
}) {
  const filtFrom = CITIES.filter(c => c.toLowerCase().includes(fromInput.toLowerCase()));
  const filtTo   = CITIES.filter(c => c.toLowerCase().includes(toInput.toLowerCase()));

  // ── State ────────────────────────────────────────────────────────
  const [lastBooking,    setLastBooking]    = React.useState(null);
  const [offersData,     setOffersData]     = React.useState([]);
  const [popularRoutes,  setPopularRoutes]  = React.useState([]);
  const [dataLoading,    setDataLoading]    = React.useState(false);
  const [showTerms, setShowTerms] = useState(false);
// Notification state
const [appNotifications, setAppNotifications] = React.useState([]);
const [showNotifModal, setShowNotifModal] = React.useState(false);
const [unreadCount, setUnreadCount] = React.useState(0);
const lastNotifIdRef = React.useRef(null);
  // ── DEFAULT FALLBACKS ─────────────────────────────────────────────
  const DEFAULT_POPULAR_ROUTES = [
    { from: "Dhabewadi", to: "Borivali" },
    { from: "Karad",     to: "Mumbai"   },
    { from: "Satara",    to: "Pune"     },
    { from: "Karad",     to: "Kolhapur" },
    { from: "Sangli",    to: "Mumbai"   },
    { from: "Islampur",  to: "Pune"     },
  ];

  // ── Fetch all home data ───────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    const fetchHomeData = async () => {
      setDataLoading(true);
      try {
        // 1. Last booking — by user ID or phone
        if (user?._id || user?.phone) {
          try {
            const userId = user._id || user.id || user.phone;
            const res = await api.getUserBookings(userId);
            const list = Array.isArray(res) ? res : (res.bookings || res.data || []);
            if (list.length > 0 && !cancelled) {
              const sorted = [...list].sort((a, b) => {
                const da = new Date(a.createdAt || a.journeyDate || 0);
                const db = new Date(b.createdAt || b.journeyDate || 0);
                return db - da;
              });
              setLastBooking(sorted[0]);
            }
          } catch (e) {
            // silent
          }
        }

        // 2. Offers from API
        try {
          const offRes = await api.getOffers();
          const offList = Array.isArray(offRes) ? offRes : (offRes.offers || offRes.data || []);
          if (!cancelled) {
            setOffersData(offList.filter(o => o.isActive !== false).slice(0, 5));
          }
        } catch (e) {
          // silent
        }

        // 3. Popular routes from API
        try {
          const API_BASE = "https://shahaji-travels-backend.onrender.com";
          const routeRes = await fetch(`${API_BASE}/api/popular-routes?active=true`);
          const routeData = await routeRes.json();
          const routeList = Array.isArray(routeData) ? routeData : (routeData.routes || routeData.data || []);
          if (!cancelled && routeList.length > 0) {
            setPopularRoutes(
              routeList
                .filter(r => r.isActive !== false)
                .slice(0, 6)
                .map(r => ({ from: r.from, to: r.to }))
            );
          } else if (!cancelled) {
            setPopularRoutes(DEFAULT_POPULAR_ROUTES);
          }
        } catch (e) {
          if (!cancelled) setPopularRoutes(DEFAULT_POPULAR_ROUTES);
        }

      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    fetchHomeData();
    return () => { cancelled = true; };
  }, [user?._id, user?.phone]);
// Notification polling — दर 30 seconds
React.useEffect(() => {
    let cancelled = false;
 
    const fetchNotifications = async () => {
  try {
    // ✅ after= parameter काढ, सगळ्या notifications fetch कर
    const res = await fetch(`${API_BASE}/api/notifications`);
    if (!res.ok) return;
    
    const data = await res.json();
    
    // ✅ array किंवा object दोन्ही handle कर
    const list = Array.isArray(data) 
      ? data 
      : (data.notifications || data.data || []);

    if (!cancelled && list.length > 0) {
      setAppNotifications(list);
      setUnreadCount(list.length);
    }
  } catch (err) {
    console.log("Notification fetch error:", err.message);
  }
};
 
    // Fetch immediately, then every 30 seconds
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
 
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  // ── Booking display helpers ───────────────────────────────────────
  const getBookingRoute = (b) => {
    if (b?.route) return b.route;
    const from = b?.boardingPoint || b?.from || "—";
    const to   = b?.droppingPoint || b?.to   || "—";
    return `${from} → ${to}`;
  };

  const getBookingDate = (b) => {
    if (!b) return "—";
    return b?.journeyDate || b?.date || b?.createdAt?.slice(0, 10) || "—";
  };

  const getBookingStatus = (b) => {
    if (!b) return { label: "—", bg: "#F2F2F7", color: "#888" };
    const s = (b?.bookingStatus || b?.paymentStatus || b?.status || "confirmed").toLowerCase();
    if (s.includes("cancel")) return { label: "Cancelled", bg: "#FFEBEE", color: "#C62828" };
    if (s.includes("complet")) return { label: "Completed", bg: "#E8F5E9", color: "#2E7D32" };
    if (s.includes("pending")) return { label: "Pending", bg: "#FFF8E1", color: "#F57F17" };
    return { label: "Confirmed", bg: "#E8F5E9", color: "#2E7D32" };
  };

  const getBookingAmount = (b) => {
    const amt = b?.totalAmount ?? b?.amount ?? b?.fare;
    return amt != null && amt > 0 ? `₹${amt}` : null;
  };

  const getBookingSeats = (b) => {
    const seats = b?.seatNumbers || b?.selectedSeats || b?.seats;
    if (Array.isArray(seats) && seats.length) return seats.join(", ");
    return b?.seatNo || b?.seatNumber || null;
  };

  const getPassengerName = (b) => {
    return b?.passengerName
      || b?.customerName
      || b?.passengers?.[0]?.name
      || user?.name
      || "—";
  };

  const getBusName = (b) => {
    return b?.busName || b?.busNo || b?.bus || null;
  };

  // ── Offer helpers ─────────────────────────────────────────────────
  const getOfferTitle = (o) => o.title || o.name || o.offerName || "Special Offer";
  const getOfferDesc  = (o) => o.description || o.desc || "";
  const getOfferCode  = (o) => o.code || o.couponCode || o.offerCode || null;
  const getOfferValue = (o) => {
    if (o.discountType === "percentage" || o.type === "percentage") {
      return `${o.discount || o.discountValue || o.percent || 0}% OFF`;
    }
    return `₹${o.discount || o.discountValue || o.amount || 0} OFF`;
  };

  // ── Inline styles ─────────────────────────────────────────────────
  const C = {
    bg: "#F8F9FA", surface: "#FFFFFF", red: "#C0392B",
    redDark: "#96281B", redLight: "#FDECEA", redBorder: "#F5C6C2",
    green: "#27AE60", greenLight: "#EAFAF1", greenBorder: "#A9DFBF",
    text: "#1C1C1E", textMid: "#3D3D3D", textSub: "#8E8E93",
    border: "#E5E5EA", borderDark: "#C7C7CC", chip: "#F2F2F7",
    warning: "#FF9500", white: "#FFFFFF",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
      <LoadingOverlay visible={loading} message={loadMsg} />
      <CustomAlert {...alertState} onClose={hideAlert} />
{/* Notification Modal */}
<Modal visible={showNotifModal} transparent animationType="slide">
  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
    <View style={{
      backgroundColor: "#fff",
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: "75%", paddingBottom: 40,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        padding: 20, borderBottomWidth: 0.5, borderBottomColor: "#F0F0F0",
      }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1C1C1E" }}>
          🔔 Notifications
        </Text>
        <TouchableOpacity
          onPress={() => setShowNotifModal(false)}
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#F2F2F7", justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#555" }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {appNotifications.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontSize: 14, color: "#888", fontWeight: "600" }}>No notifications yet</Text>
            <Text style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
              We'll notify you about offers and updates
            </Text>
          </View>
        ) : (
          appNotifications.map((notif, i) => {
            const typeConfig = {
              info:   { bg: "#E8F4FE", border: "#A8D4FA", color: "#185FA5", icon: "ℹ️" },
              offer:  { bg: "#EAFAF1", border: "#A9DFBF", color: "#1B5E20", icon: "🏷️" },
              alert:  { bg: "#FFEBEE", border: "#FFCDD2", color: "#C62828", icon: "⚠️" },
              update: { bg: "#F3E5F5", border: "#CE93D8", color: "#6A1B9A", icon: "🔄" },
            };
            const tc = typeConfig[notif.type] || typeConfig.info;
            const sentDate = notif.createdAt
              ? new Date(notif.createdAt).toLocaleString("en-IN", {
                  day: "2-digit", month: "short",
                  hour: "2-digit", minute: "2-digit",
                })
              : "";
            return (
              <View key={notif._id || notif.id || i} style={{
                backgroundColor: tc.bg,
                borderLeftWidth: 3, borderLeftColor: tc.color,
                borderRadius: 12, padding: 14,
                flexDirection: "row", alignItems: "flex-start", gap: 10,
                marginBottom: 8,
              }}>
                <Text style={{ fontSize: 20 }}>{tc.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E", marginBottom: 3 }}>
                    {notif.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#555", lineHeight: 18 }}>
                    {notif.message}
                  </Text>
                  {sentDate ? (
                    <Text style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                      📅 {sentDate}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  </View>
</Modal>
      {/* Drawer screens */}
      <ProfileScreen      visible={showProfile}      onClose={() => setShowProfile(false)}      user={user} wallet={wallet} api={api} showAlert={showAlert} />
     
      <MyBookingsScreen   visible={showMyBookings}   onClose={() => setShowMyBookings(false)}   user={user} api={api} />
      <OffersScreen       visible={showOffers}       onClose={() => setShowOffers(false)}       api={api} />
      <GetTicketScreen    visible={showGetTicket}    onClose={() => setShowGetTicket(false)}    api={api} showAlert={showAlert} />
      <CancelTicketScreen visible={showCancelTicket} onClose={() => setShowCancelTicket(false)} api={api} showAlert={showAlert} />
      <CustomerCareScreen visible={showCustomerCare} onClose={() => setShowCustomerCare(false)} />
      <LanguageScreen     visible={showLanguage}     onClose={() => setShowLanguage(false)}
        currentLanguage={language} onChangeLanguage={changeLanguage} SUPPORTED_LANGUAGES={SUPPORTED_LANGUAGES} />
      <LogoutScreen       visible={showLogout}       onClose={() => setShowLogout(false)}
        onConfirmLogout={handleLogoutConfirm} user={user} />

      {/* Drawer overlay */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={s.drawerOverlay} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View style={[s.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={s.drawerHeader}>
          <View style={s.drawerAvatar}>
            <Text style={s.drawerAvatarText}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
          </View>
          <Text style={s.drawerName}>{user?.name || user?.fullName || "Guest"}</Text>
          <Text style={s.drawerPhone}>{user?.phone || user?.email || ""}</Text>
          <View style={s.drawerWalletBadge}>
           
          </View>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {drawerItems.map((item, i) => (
            <TouchableOpacity key={i} style={s.drawerItem} onPress={item.action}>
              <View style={s.drawerItemIconWrap}><Text style={s.drawerItemIcon}>{item.icon}</Text></View>
              <Text style={s.drawerItemLabel}>{item.label}</Text>
              <Text style={{ color: C.border, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.drawerItem} onPress={() => { closeDrawer(); setTimeout(() => setShowLanguage(true), 300); }}>
            <View style={s.drawerItemIconWrap}><Text style={s.drawerItemIcon}>🌐</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.drawerItemLabel}>{t.language || "Language"}</Text>
              <Text style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>{language}</Text>
            </View>
            <Text style={{ color: C.border, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.drawerItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: C.chip }]}
            onPress={() => { closeDrawer(); setTimeout(() => setShowLogout(true), 300); }}>
            <View style={[s.drawerItemIconWrap, { backgroundColor: "#FDECEA" }]}>
              <Text style={s.drawerItemIcon}>🚪</Text>
            </View>
            <Text style={[s.drawerItemLabel, { color: C.red }]}>{t.logout || "Logout"}</Text>
            <Text style={{ color: C.red, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* ── NAVBAR ── */}
   <View style={s.navbar}>
  <TouchableOpacity onPress={openDrawer} style={s.navMenuBtn}>
    <Text style={s.navMenuIcon}>☰</Text>
  </TouchableOpacity>
  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
    <LogoImage width={28} height={28} borderRadius={5} />
    <Text style={[s.navTitle, { fontSize: 14 }]}>Shahaji Travels</Text>
  </View>
  {/* 🔔 NOTIFICATION BELL */}
  <TouchableOpacity
    style={{ marginRight: 10, position: "relative" }}
    onPress={() => { setShowNotifModal(true); setUnreadCount(0); }}
  >
    <Text style={{ color: "#fff", fontSize: 22 }}>🔔</Text>
    {unreadCount > 0 && (
      <View style={{
        position: "absolute", top: -4, right: -4,
        backgroundColor: "#FF3B30", borderRadius: 10,
        width: 18, height: 18,
        justifyContent: "center", alignItems: "center",
      }}>
        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
  <TouchableOpacity style={s.navWallet}>
   
  </TouchableOpacity>
</View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={hs.hero}>
          <Text style={hs.heroGreet}>
            {t.hello || "Hello"}, {user?.name?.split(" ")[0] || "Traveller"} 👋
          </Text>
          <Text style={hs.heroTitle}>{t.bookBusTickets || "Where to today?"}</Text>
          <Text style={hs.heroSub}>{t.safeComfortable || "Safe · Comfortable · On Time"}</Text>
        </View>

        {/* ── SEARCH CARD ── */}
        <View style={hs.searchCard}>
          <Text style={hs.fieldLabel}>{t.from || "FROM"}</Text>
          <View style={{ position: "relative", zIndex: 10 }}>
            <View style={hs.inputRow}>
              <Text style={hs.inputIcon}>📍</Text>
              <TextInput
                style={hs.inputField}
                value={fromInput}
                onChangeText={v => { setFromInput(v); setShowFromSug(true); }}
                onFocus={() => setShowFromSug(true)}
                placeholder={t.departurePlaceholder || "Departure city"}
                placeholderTextColor={C.textSub}
              />
            </View>
            {showFromSug && fromInput.length > 0 && filtFrom.length > 0 && (
              <View style={s.sugBox}>
                {filtFrom.slice(0, 6).map(c => (
                  <TouchableOpacity key={c} style={s.sugItem}
                    onPress={() => { setFromInput(c); setSearch(p => ({ ...p, from: c })); setShowFromSug(false); }}>
                    <Text style={s.sugText}>📍 {c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Swap */}
          <TouchableOpacity style={hs.swapBtn}
            onPress={() => {
              const tmp = fromInput;
              setFromInput(toInput); setToInput(tmp);
              setSearch(p => ({ ...p, from: p.to, to: p.from }));
            }}>
            <Text style={hs.swapText}>⇅</Text>
          </TouchableOpacity>

          <Text style={[hs.fieldLabel, { marginTop: 10 }]}>{t.to || "TO"}</Text>
          <View style={{ position: "relative", zIndex: 9 }}>
            <View style={hs.inputRow}>
              <Text style={hs.inputIcon}>🏁</Text>
              <TextInput
                style={hs.inputField}
                value={toInput}
                onChangeText={v => { setToInput(v); setShowToSug(true); }}
                onFocus={() => setShowToSug(true)}
                placeholder={t.destinationPlaceholder || "Destination city"}
                placeholderTextColor={C.textSub}
              />
            </View>
            {showToSug && toInput.length > 0 && filtTo.length > 0 && (
              <View style={s.sugBox}>
                {filtTo.slice(0, 6).map(c => (
                  <TouchableOpacity key={c} style={s.sugItem}
                    onPress={() => { setToInput(c); setSearch(p => ({ ...p, to: c })); setShowToSug(false); }}>
                    <Text style={s.sugText}>📍 {c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date chips */}
          <Text style={[hs.fieldLabel, { marginTop: 16 }]}>{t.dateOfJourney || "DATE OF JOURNEY"}</Text>
          <View style={s.dateBtnRow}>
            {[0, 1, 2].map(offset => (
              <TouchableOpacity key={offset}
                style={[s.dateBtn, search.date === getDateOffset(offset) && s.dateBtnActive]}
                onPress={() => setSearch(p => ({ ...p, date: getDateOffset(offset) }))}>
                <Text style={[s.dateBtnTop, search.date === getDateOffset(offset) && s.dateBtnTextActive]}>
                  {offset === 0 ? (t.today || "Today") : offset === 1 ? (t.tomorrow || "Tmrw") : getDayName(2)}
                </Text>
                <Text style={[s.dateBtnBot, search.date === getDateOffset(offset) && s.dateBtnTextActive]}>
                  {getDayName(offset)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.dateBtn, s.dateBtnCalendar]} onPress={() => setShowCalendar(true)}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={s.dateBtnBot}>More</Text>
            </TouchableOpacity>
          </View>
          {search.date && (
            <Text style={s.selectedDateText}>📅 {search.date}</Text>
          )}

          <PrimaryButton
            title={t.searchBuses || "Search Buses"}
            onPress={() => { setShowFromSug(false); setShowToSug(false); handleSearch(); }}
            style={{ marginTop: 18 }}
          />
        </View>

        {/* ── LAST BOOKING — Fixed with all passenger details ── */}
        {lastBooking && (
          <View style={hs.section}>
            <View style={hs.sectionHeader}>
              <Text style={hs.sectionTitle}>🎫 {t.lastBooking || "Last booking"}</Text>
              <TouchableOpacity onPress={() => setShowMyBookings(true)}>
                <Text style={hs.sectionMore}>{t.allBookings || "All bookings"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={hs.bookingCard}
              onPress={() => setShowMyBookings(true)}
              activeOpacity={0.85}
            >
              {/* Icon */}
              <View style={hs.bookingIconWrap}>
                <Text style={{ fontSize: 22 }}>🎟️</Text>
              </View>

              {/* Details */}
              <View style={{ flex: 1, minWidth: 0 }}>
                {/* Route */}
                <Text style={hs.bookingRoute} numberOfLines={1}>
                  {getBookingRoute(lastBooking)}
                </Text>

                {/* Passenger name */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 10 }}>👤</Text>
                  <Text style={hs.bookingMeta} numberOfLines={1}>
                    {getPassengerName(lastBooking)}
                  </Text>
                </View>

                {/* Date + Seat */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                  <Text style={hs.bookingMeta}>
                    📅 {getBookingDate(lastBooking)}
                  </Text>
                  {getBookingSeats(lastBooking) && (
                    <Text style={hs.bookingMeta}>
                      · 💺 {getBookingSeats(lastBooking)}
                    </Text>
                  )}
                </View>

                {/* Bus name */}
                {getBusName(lastBooking) && (
                  <Text style={[hs.bookingMeta, { marginTop: 2 }]} numberOfLines={1}>
                    🚌 {getBusName(lastBooking)}
                  </Text>
                )}

                {/* Amount + Status row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  {getBookingAmount(lastBooking) && (
                    <Text style={hs.bookingAmount}>{getBookingAmount(lastBooking)}</Text>
                  )}
                  <View style={[hs.statusBadge, { backgroundColor: getBookingStatus(lastBooking).bg }]}>
                    <Text style={[hs.statusText, { color: getBookingStatus(lastBooking).color }]}>
                      {getBookingStatus(lastBooking).label}
                    </Text>
                  </View>
                  {/* Payment mode */}
                  {lastBooking?.paymentMode && (
                    <View style={{ backgroundColor: "#F0F0F0", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, color: "#555", fontWeight: "600" }}>
                        {lastBooking.paymentMode}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* View ticket button */}
              <View style={hs.viewTicketBtn}>
                <Text style={hs.viewTicketText}>View{"\n"}ticket</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── OFFERS — from API ── */}
        {offersData.length > 0 && (
          <View style={hs.section}>
            <View style={hs.sectionHeader}>
              <Text style={hs.sectionTitle}>🏷️ {t.offersForYou || "Offers for you"}</Text>
              <TouchableOpacity onPress={() => setShowOffers(true)}>
                <Text style={hs.sectionMore}>{t.viewAll || "View all"}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
              {offersData.map((offer, i) => (
                <View key={offer._id || offer.id || offer.code || i} style={hs.offerCard}>
                  <View style={[hs.offerBadge, { backgroundColor: i % 2 === 0 ? "#FFEBEE" : "#E8F5E9" }]}>
                    <Text style={[hs.offerBadgeText, { color: i % 2 === 0 ? "#C0392B" : "#2E7D32" }]}>
                      {i % 2 === 0 ? "Limited" : "Active"}
                    </Text>
                  </View>
                  <Text style={hs.offerValue}>{getOfferValue(offer)}</Text>
                  <Text style={hs.offerTitle} numberOfLines={1}>{getOfferTitle(offer)}</Text>
                  <Text style={hs.offerDesc} numberOfLines={2}>{getOfferDesc(offer)}</Text>
                  {getOfferCode(offer) && (
                    <View style={hs.offerCodeRow}>
                      <Text style={hs.offerCodeLabel}>Code: </Text>
                      <Text style={hs.offerCodeValue}>{getOfferCode(offer)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── POPULAR ROUTES — from API ── */}
        {(popularRoutes.length > 0 || !dataLoading) && (
          <View style={hs.section}>
            <View style={hs.sectionHeader}>
              <Text style={hs.sectionTitle}>🚌 {t.popularRoutes || "Popular routes"}</Text>
            </View>
            <View style={hs.routeGrid}>
              {(popularRoutes.length > 0 ? popularRoutes : DEFAULT_POPULAR_ROUTES).map((r, i) => (
                <TouchableOpacity key={i} style={hs.routeChip}
                  onPress={() => {
                    setFromInput(r.from); setToInput(r.to);
                    setSearch(p => ({ ...p, from: r.from, to: r.to }));
                    setShowFromSug(false); setShowToSug(false);
                    handleSearch();
                  }}
                  activeOpacity={0.75}>
                  <Text style={hs.routeChipText} numberOfLines={1}>{r.from} → {r.to}</Text>
                  <Text style={hs.routeChipArr}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── WHY SHAHAJI TRAVELS ── */}
        <View style={hs.section}>
          <View style={hs.sectionHeader}>
            <Text style={hs.sectionTitle}>{t.whyShahaji || "Why Shahaji Travels?"}</Text>
          </View>
          <View style={hs.whyGrid}>
            {[
              { icon: "⏱️", title: t.alwaysOnTime || "Always on time",  sub: t.onTimeDesc || "98% buses on schedule" },
              { icon: "✨", title: t.cleanBuses || "Clean buses",        sub: t.cleanDesc  || "Sanitised before every trip" },
              { icon: "🛡️", title: t.safeTravel || "Safe travel",        sub: t.safeDesc   || "GPS tracked, trained drivers" },
              { icon: "💸", title: t.easyRefunds || "Easy refunds",      sub: t.refundDesc || "Refund within 24 hours" },
            ].map((item, i) => (
              <View key={i} style={hs.whyCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
                <Text style={hs.whyTitle}>{item.title}</Text>
                <Text style={hs.whySub}>{item.sub}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── CALENDAR MODAL ── */}
      {/* ── CALENDAR MODAL ── */}
<Modal visible={showCalendar} transparent animationType="slide">
  <View style={s.modalOverlay}>
    <View style={[s.modalBox, { padding: 0, overflow: "hidden", maxWidth: 340 }]}>
      <View style={s.calHeader}>
        <TouchableOpacity onPress={() => {
          if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
          else setCalMonth(m => m - 1);
        }}>
          <Text style={s.calArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.calTitle}>
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={() => {
          if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
          else setCalMonth(m => m + 1);
        }}>
          <Text style={s.calArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: "row", backgroundColor: "#FDECEA", paddingVertical: 8 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#C0392B" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Date grid — fixed pixel sizes, web compatible */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, paddingVertical: 6 }}>
        {Array(getFirstDay(calYear, calMonth)).fill(null).map((_, i) => (
          <View key={"e" + i} style={{ width: 44, height: 44, margin: 1 }} />
        ))}
        {Array(getDaysInMonth(calYear, calMonth)).fill(null).map((_, i) => {
          const day = i + 1;
          const dStr = `${padTwo(day)}/${padTwo(calMonth + 1)}/${calYear}`;
          const isSel = search.date === dStr;
          const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
          const isPast = new Date(calYear, calMonth, day) < todayD;
          const isToday = new Date(calYear, calMonth, day).getTime() === todayD.getTime();
          return (
            <TouchableOpacity
              key={day}
              onPress={() => !isPast && handleCalDate(day)}
              disabled={isPast}
              style={{
                width: 44, height: 44, margin: 1,
                borderRadius: 22,
                justifyContent: "center", alignItems: "center",
                backgroundColor: isSel ? "#C0392B" : "transparent",
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: isSel || isToday ? "700" : "400",
                color: isPast ? "#C7C7CC"
                     : isSel  ? "#FFFFFF"
                     : isToday ? "#C0392B"
                     : "#1C1C1E",
              }}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, { margin: 16 }]}
        onPress={() => setShowCalendar(false)}
      >
        <Text style={s.primaryBtnText}>{t.close || "Done"}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

// ── HomeScreen styles (replace existing hs = StyleSheet.create) ───
const hs = StyleSheet.create({
  hero: {
    backgroundColor: "#C0392B",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 50,
  },
  heroGreet: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "400" },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginTop: 4 },
  heroSub:   { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 6, letterSpacing: 0.4 },

  searchCard: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    margin: 14, marginTop: -32,
    padding: 18, paddingBottom: 16,
    borderWidth: 1, borderColor: "#E5E5EA",
    elevation: 4, zIndex: 5,
  },
  fieldLabel: {
    fontSize: 11, fontWeight: "700", color: "#8E8E93",
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E5E5EA", borderRadius: 12,
    backgroundColor: "#FAFAFA", paddingRight: 4,
  },
  inputIcon: { fontSize: 16, paddingLeft: 12, paddingRight: 4 },
  inputField: {
    flex: 1, paddingHorizontal: 6, paddingVertical: 13,
    fontSize: 13, color: "#1C1C1E",
  },
  swapBtn: {
    alignSelf: "center", backgroundColor: "#FDECEA",
    borderRadius: 20, width: 38, height: 38,
    justifyContent: "center", alignItems: "center",
    marginVertical: 8, borderWidth: 1, borderColor: "#F5C6C2",
  },
  swapText: { fontSize: 17, color: "#C0392B", fontWeight: "700" },

  section: { paddingHorizontal: 14, marginTop: 20 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1C1C1E" },
  sectionMore:  { fontSize: 11, color: "#C0392B", fontWeight: "600" },

  // ── LAST BOOKING card ──
  bookingCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#E5E5EA",
    padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12,
    elevation: 2,
  },
  bookingIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#FDECEA",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  bookingRoute:  { fontSize: 13, fontWeight: "700", color: "#1C1C1E", marginBottom: 1 },
  bookingMeta:   { fontSize: 11, color: "#8E8E93" },
  bookingAmount: { fontSize: 13, fontWeight: "700", color: "#C0392B" },
  statusBadge:   { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:    { fontSize: 10, fontWeight: "700" },
  viewTicketBtn: {
    backgroundColor: "#FDECEA", borderRadius: 10,
    borderWidth: 1, borderColor: "#F5C6C2",
    paddingHorizontal: 10, paddingVertical: 8, alignItems: "center",
    flexShrink: 0,
  },
  viewTicketText: { fontSize: 11, fontWeight: "700", color: "#C0392B", textAlign: "center", lineHeight: 16 },

  // ── OFFERS ──
  offerCard: {
    width: 190, backgroundColor: "#FFFFFF",
    borderRadius: 14, borderWidth: 1, borderColor: "#E5E5EA",
    padding: 14,
  },
  offerBadge: {
    alignSelf: "flex-start", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8,
  },
  offerBadgeText: { fontSize: 10, fontWeight: "700" },
  offerValue:     { fontSize: 19, fontWeight: "700", color: "#C0392B", marginBottom: 2 },
  offerTitle:     { fontSize: 13, fontWeight: "600", color: "#1C1C1E", marginBottom: 3 },
  offerDesc:      { fontSize: 11, color: "#8E8E93", lineHeight: 17 },
  offerCodeRow:   { flexDirection: "row", alignItems: "center", marginTop: 8, backgroundColor: "#FFF3F3", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  offerCodeLabel: { fontSize: 10, color: "#8E8E93" },
  offerCodeValue: { fontSize: 11, fontWeight: "700", color: "#C0392B", letterSpacing: 0.5 },

  // ── POPULAR ROUTES ──
  routeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  routeChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E5EA",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    width: "47%",
  },
  routeChipText: { flex: 1, fontSize: 11, fontWeight: "600", color: "#1C1C1E" },
  routeChipArr:  { fontSize: 14, color: "#C0392B", fontWeight: "700" },

  // ── WHY ──
  whyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  whyCard: {
    width: "47%", backgroundColor: "#FFFFFF",
    borderRadius: 12, borderWidth: 1, borderColor: "#E5E5EA", padding: 14,
  },
  whyTitle: { fontSize: 13, fontWeight: "700", color: "#1C1C1E", marginBottom: 3 },
  whySub:   { fontSize: 11, color: "#8E8E93", lineHeight: 17 },
});

// Default popular routes constant (used as fallback)
const DEFAULT_POPULAR_ROUTES = [
  { from: "Dhabewadi", to: "Borivali" },
  { from: "Karad",     to: "Mumbai"   },
  { from: "Satara",    to: "Pune"     },
  { from: "Karad",     to: "Kolhapur" },
  { from: "Sangli",    to: "Mumbai"   },
  { from: "Islampur",  to: "Pune"     },
];

// ── HomeScreen styles ─────────────────────────────────────────────

// ─── CUSTOM ALERT ─────────────────────────────────────────────────
const CustomAlert = ({ visible, title, message, buttons, onClose }) => {
  if (!visible) return null;
  return (
   <Modal
  visible={visible}
  transparent
  animationType="fade"
  statusBarTranslucent
  presentationStyle="overFullScreen"
>
      <View style={sa.overlay}>
        <View style={sa.box}>
          {title   ? <Text style={sa.title}>{title}</Text>    : null}
          {message ? <Text style={sa.message}>{message}</Text> : null}
          <View style={sa.btnRow}>
            {(buttons||[{text:"OK",onPress:onClose}]).map((btn,i)=>(
              <TouchableOpacity key={i}
                style={[sa.btn,btn.style==="destructive"&&sa.btnDestructive,btn.style==="cancel"&&sa.btnCancel]}
                onPress={()=>{onClose?.();btn.onPress?.();}}>
                <Text style={[sa.btnText,btn.style==="destructive"&&sa.btnTextDestructive,btn.style==="cancel"&&sa.btnTextCancel]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const sa = StyleSheet.create({
  overlay:  {flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"center",alignItems:"center",padding:24,zIndex:99999},
  box:      {backgroundColor:C.white,borderRadius:20,padding:24,width:"100%",maxWidth:340,elevation:16},
  title:    {fontSize:F.lg,fontWeight:"700",color:C.text,marginBottom:6,textAlign:"center"},
  message:  {fontSize:F.sm,color:C.textMid,marginBottom:20,textAlign:"center",lineHeight:22},
  btnRow:   {flexDirection:"row",flexWrap:"wrap",gap:8,justifyContent:"center"},
  btn:      {flex:1,minWidth:80,backgroundColor:C.black,borderRadius:12,paddingVertical:13,alignItems:"center"},
  btnCancel:{backgroundColor:C.chip,borderWidth:1,borderColor:C.border},
  btnDestructive:{backgroundColor:C.red},
  btnText:  {color:C.white,fontWeight:"600",fontSize:F.sm},
  btnTextCancel:{color:C.textMid},
  btnTextDestructive:{color:C.white},
});

// ─── GENDER PICKER ────────────────────────────────────────────────
const GenderPickerModal = ({ visible, seatId, onSelect, onCancel, t }) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={sa.overlay}>
        <View style={sa.box}>
          <Text style={sa.title}>{t?.selectGender||"Select Gender"}</Text>
          <Text style={[sa.message,{marginBottom:20}]}>
            {t?.seatLabel||"Seat"} {seatId}
          </Text>

          <View style={gp.row}>
            
            {/* Female */}
            <TouchableOpacity
              style={[gp.btn,{borderColor:"#9C27B0",backgroundColor:"#F8E4FF"}]}
              onPress={()=>onSelect("Female")}
            >
              <Text style={{fontSize:28}}>👩</Text>
              <Text style={[gp.lbl,{color:"#9C27B0"}]}>
                {t?.female||"Female"}
              </Text>
            </TouchableOpacity>

            {/* Male → ORANGE */}
            <TouchableOpacity
              style={[gp.btn,{borderColor:C.orange,backgroundColor:C.orangeLight}]}
              onPress={()=>onSelect("Male")}
            >
              <Text style={{fontSize:28}}>👨</Text>
              <Text style={[gp.lbl,{color:C.orange}]}>
                {t?.male||"Male"}
              </Text>
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={[sa.btn,sa.btnCancel,{marginTop:12,flex:0,width:"100%"}]}
            onPress={onCancel}
          >
            <Text style={sa.btnTextCancel}>
              {t?.cancel||"Cancel"}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

// ── ConfirmBookingModal — replace the whole component function ──
const ConfirmBookingModal = ({ visible, onCancel, onConfirm, selectedSeats, getFinalAmount, paymentMethod, selectedBus, passengerInfo, selectedBoarding, selectedDropping, search, seatGenderMap }) => {
  if (!visible) return null;
  const payIcon = paymentMethod === "Cash" ? "💵" : paymentMethod === "UPI" ? "📱" : "💳";
  const totalAmt = getFinalAmount();

  const InfoTile = ({ icon, label, value }) => (
    <View style={{
      flex: 1, backgroundColor: "#FAFAFA",
      borderRadius: 12, borderWidth: 1, borderColor: "#F0F0F0",
      padding: 14, minWidth: "45%",
    }}>
      <Text style={{ fontSize: 18, marginBottom: 6 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E" }} numberOfLines={2}>{value || "—"}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, overflow: "hidden", maxHeight: "92%" }}>

          {/* ── Header ── */}
          <View style={{ backgroundColor: C.red, paddingTop: 28, paddingBottom: 24, paddingHorizontal: 24, alignItems: "center" }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 26 }}>🎫</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", letterSpacing: 0.3 }}>Confirm Booking</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>Review your details before confirming</Text>
          </View>

          {/* ── Route strip ── */}
          <View style={{ backgroundColor: "#FFF5F5", paddingHorizontal: 24, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#FFE8E8" }}>
            <View>
              <Text style={{ fontSize: 10, color: C.red, fontWeight: "700", letterSpacing: 1, marginBottom: 3 }}>FROM</Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#1C1C1E" }}>{search?.from}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22 }}>🚌</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 3 }}>
                <View style={{ width: 20, height: 1.5, backgroundColor: "#DDD" }} />
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.red }} />
                <View style={{ width: 20, height: 1.5, backgroundColor: "#DDD" }} />
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: C.red, fontWeight: "700", letterSpacing: 1, marginBottom: 3 }}>TO</Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#1C1C1E" }}>{search?.to}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>

            {/* ── Info tiles grid ── */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <InfoTile icon="📅" label="Date"       value={search?.date} />
              <InfoTile icon="💺" label="Seats"      value={selectedSeats?.join(", ")} />
              <InfoTile icon="👤" label="Passenger"  value={passengerInfo?.name} />
              <InfoTile icon="📞" label="Phone"      value={passengerInfo?.phone} />
              <InfoTile icon="🟢" label="Boarding"   value={selectedBoarding?.name} />
              <InfoTile icon="🔴" label="Dropping"   value={selectedDropping?.name} />
              <InfoTile icon="🚌" label="Bus"        value={selectedBus?.name} />
              <InfoTile icon="🕐" label="Departure"  value={selectedBus?.departure || "--:--"} />
            </View>

            {/* ── Payment method pill ── */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8F8F8", borderRadius: 12, borderWidth: 1, borderColor: "#EFEFEF", padding: 14, marginTop: 4, gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{payIcon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Payment</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", marginTop: 2 }}>{paymentMethod}</Text>
              </View>
              <View style={{ backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#2E7D32" }}>● Confirmed</Text>
              </View>
            </View>

            {/* ── Amount box ── */}
            <View style={{ marginTop: 12, backgroundColor: "#FFF5F5", borderRadius: 14, borderWidth: 1.5, borderColor: "#FFD0D0", padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontSize: 11, color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Amount</Text>
                <Text style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{selectedSeats?.length} seat{selectedSeats?.length > 1 ? "s" : ""} · {paymentMethod}</Text>
              </View>
              <Text style={{ fontSize: 32, fontWeight: "700", color: C.red }}>₹{totalAmt}</Text>
            </View>

          </ScrollView>

          {/* ── Buttons ── */}
          <View style={{ flexDirection: "row", gap: 10, padding: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5F5F5" }}>
            <TouchableOpacity
              style={{ flex: 1, borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 14, paddingVertical: 15, alignItems: "center", backgroundColor: "#fff" }}
              onPress={onCancel} activeOpacity={0.8}>
              <Text style={{ color: "#555", fontWeight: "600", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 2, backgroundColor: C.red, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
              onPress={onConfirm} activeOpacity={0.85}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 }}>Confirm Booking ✓</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};



const gp = StyleSheet.create({
  row:{flexDirection:"row",gap:12,justifyContent:"center",marginBottom:4},
  btn:{flex:1,borderWidth:1.5,borderRadius:16,paddingVertical:18,alignItems:"center",justifyContent:"center"},
  lbl:{fontWeight:"700",fontSize:F.sm,marginTop:6},
});

const LoadingOverlay = ({ visible, message = "Please wait..." }) =>
  !visible ? null : (
    <View style={s.loadOverlay}>
      <View style={s.loadBox}>
        <ActivityIndicator size="large" color={C.red} />
        <Text style={s.loadText}>{message}</Text>
      </View>
    </View>
  );

const PrimaryButton = ({ title, onPress, disabled, style, textStyle, loading }) => (
  <TouchableOpacity style={[s.primaryBtn, disabled && s.primaryBtnDisabled, style]}
    onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
    {loading ? <ActivityIndicator color={C.white} size="small" />
             : <Text style={[s.primaryBtnText, textStyle]}>{title}</Text>}
  </TouchableOpacity>
);

const SectionHeader = ({ title, subtitle, onBack }) => (
  <View style={s.secHeader}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
        <Text style={s.backBtnText}>‹</Text>
      </TouchableOpacity>
    )}
    <View style={{ flex:1 }}>
      <Text style={s.secHeaderTitle} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={s.secHeaderSub} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
  </View>
);

const StarRating = ({ rating = 0 }) => {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return (
    <View style={{ flexDirection:"row", alignItems:"center" }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ color: i<=full ? C.warning : (i===full+1&&half ? C.warning : C.border), fontSize: F.sm }}>
          {i<=full ? "★" : (i===full+1&&half ? "½" : "☆")}
        </Text>
      ))}
      <Text style={{ color:C.textSub, fontSize:F.xs, marginLeft:3 }}>{r.toFixed(1)}</Text>
    </View>
  );
};

const BusTimeRow = ({ departure, arrival, duration, from, to, style }) => (
  <View style={[s.busTimeRow, style]}>
    <View style={{ alignItems:"center", minWidth:70 }}>
      <Text style={s.busTimeValue}>{departure||"--:--"}</Text>
      <Text style={s.busTimeCity} numberOfLines={1}>{from}</Text>
      <Text style={s.busTimeLabel}>Dep</Text>
    </View>
    <View style={{ flex:1, alignItems:"center", paddingHorizontal:6 }}>
      {duration ? <Text style={s.busDuration}>{duration}</Text> : null}
      <View style={s.busTimeLine}/>
      <Text style={s.busTimeArrow}>🚌</Text>
    </View>
    <View style={{ alignItems:"center", minWidth:70 }}>
      <Text style={s.busTimeValue}>{arrival||"--:--"}</Text>
      <Text style={s.busTimeCity} numberOfLines={1}>{to}</Text>
      <Text style={s.busTimeLabel}>Arr</Text>
    </View>
  </View>
);

// ─── SEAT COMPONENT ───────────────────────────────────────────────
const Seat = ({ id, booked, selected, blocked, female, onPress, price, isSleeper }) => {
  if (!id || id === "") return <View style={{ width: isSleeper ? 48 : 40 }} />;

  // BLOCKED → grey, cannot select
  if (blocked) {
    return (
      <View style={{
        width: isSleeper ? 48 : 40, height: isSleeper ? 56 : 44,
        borderRadius: 8, borderWidth: 1.5, borderColor: "#9E9E9E",
        backgroundColor: "#E0E0E0", marginHorizontal: 2, marginVertical: 3,
        justifyContent: "center", alignItems: "center", opacity: 0.6,
      }}>
        <Text style={{ fontSize: isSleeper ? 14 : 12 }}>🚫</Text>
        <Text style={{ fontSize: 8, fontWeight: "700", color: "#757575", textAlign: "center" }}>
          {String(id)}
        </Text>
      </View>
    );
  }

  const bg = selected
  ? "#27AE60"
  : blocked
  ? "#9E9E9E"
  : booked && female === "Female"
  ? "#9B59B6"
  : booked
  ? "#F39C12"
  : "#FFFFFF";
  const textC   = booked || selected ? "#FFFFFF" : "#1C1C1E";
  const borderC = booked || selected ? "transparent" : "#D0D0D0";
  const W = isSleeper ? 48 : 40;
  const H = isSleeper ? 56 : 44;

  return (
    <TouchableOpacity
      onPress={() => { if (!booked && onPress) onPress(id); }}
      disabled={!!booked}
      activeOpacity={0.75}
      style={{
        width: W, height: H, borderRadius: 8,
        borderWidth: 1, borderColor: borderC,
        backgroundColor: bg, marginHorizontal: 2, marginVertical: 3,
        justifyContent: "center", alignItems: "center", paddingVertical: 3,
      }}
    >
      {!booked && (
        <Text style={{ fontSize: isSleeper ? 18 : 14, lineHeight: isSleeper ? 20 : 16 }}>
          {isSleeper ? "🛏️" : "💺"}
        </Text>
      )}
      <Text style={{
        fontSize: isSleeper ? 9 : 10, fontWeight: "700", color: textC,
        textAlign: "center", lineHeight: isSleeper ? 11 : 12, marginTop: 1,
      }}>
        {String(id)}
      </Text>
      {!booked && price > 0 && (
        <Text style={{ fontSize: 7, color: textC === "#1C1C1E" ? "#8E8E93" : "rgba(255,255,255,0.7)" }}>
          ₹{price}
        </Text>
      )}
    </TouchableOpacity>
  );
};
const { height } = Dimensions.get("window");
const DESIGN_HEIGHT = 820; // thoda adjust karu shakto
const scale = 1;
const DeckSection = ({ title, availCount, seats, bookedSeats, selectedSeats, onToggle, seatPrice, sleeperPrice, isSleeper, seatGenderMap, blockedSeats = [] }) => (
  <View style={{ flex: 1, overflow: "visible" }}>
    <View style={{ transform: [{ scale: 1 }], alignSelf: "center" }}>
      <View style={deckSt.wrap}>
        <View style={deckSt.header}>
          <Text style={deckSt.title} numberOfLines={2}>
            {isSleeper ? "🛏 " : "💺 "}{title}
          </Text>
          <View style={deckSt.availBadge}>
            <Text style={deckSt.availText}>{availCount} available</Text>
          </View>
        </View>
        <View style={{ backgroundColor: "#2C3E50", paddingHorizontal: 10, paddingVertical: 4, alignItems: "flex-end" }}>
          <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>DRIVER →</Text>
        </View>
        <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 }}>
          <View style={{ width: 44, alignItems: "center" }}>
            <Text style={{ fontSize: 9, color: "#aaa", fontWeight: "600" }}>
              {isSleeper ? "Upper" : "Single"}
            </Text>
          </View>
          <View style={{ width: 16 }} />
          <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-start", gap: 4 }}>
            <Text style={{ fontSize: 9, color: "#aaa", fontWeight: "600", width: 44, textAlign: "center" }}>
              {isSleeper ? "Upper" : "Aside"}
            </Text>
            <Text style={{ fontSize: 9, color: "#aaa", fontWeight: "600", width: 44, textAlign: "center" }}>
              {isSleeper ? "Upper" : "Window"}
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 10 }}>
          {seats.map((row, ri) => {
            const leftId = row[0];
            const right1 = row[2];
            const right2 = row[3];
            const isEmptyRow = !leftId && !right1 && !right2;
            if (isEmptyRow) return <View key={`empty_${ri}`} style={{ height: 12 }} />;
            const price = isSleeper ? (Number(sleeperPrice) || 0) : (Number(seatPrice) || 0);

            return (
              <View key={ri} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                <View style={{ width: 44 }}>
                  <Seat
                    id={leftId}
                    isSleeper={isSleeper}
                   blocked={leftId && leftId !== "" && blockedSeats.includes(String(leftId))}
                    booked={bookedSeats.includes(leftId)}
                    selected={selectedSeats.includes(leftId)}
                    female={String(seatGenderMap?.[leftId]) === "Female" ? "Female" : "Male"}
                    onPress={onToggle}
                    price={price}
                  />
                </View>
                <View style={{ width: 16, alignItems: "center" }}>
                  <View style={{ width: 1, height: 28, backgroundColor: "#E8E8E8" }} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Seat
                    id={right1}
                    isSleeper={isSleeper}
                  blocked={right1 && right1 !== "" && blockedSeats.includes(String(right1))}
                    booked={bookedSeats.includes(right1)}
                    selected={selectedSeats.includes(right1)}
                    female={String(seatGenderMap?.[right1]) === "Female" ? "Female" : "Male"}
                    onPress={onToggle}
                    price={price}
                  />
                  <Seat
                    id={right2}
                    isSleeper={isSleeper}
                   blocked={right2 && right2 !== "" && blockedSeats.includes(String(right2))}
                    booked={bookedSeats.includes(right2)}
                    selected={selectedSeats.includes(right2)}
                    female={String(seatGenderMap?.[right2]) === "Female" ? "Female" : "Male"}
                    onPress={onToggle}
                    price={price}
                  />
                </View>
              </View>
            );
          })}
        </View>
        {/* Legend */}
        <View style={{
          flexDirection: "row", flexWrap: "wrap", gap: 8,
          paddingHorizontal: 10, paddingVertical: 8,
          borderTopWidth: 0.5, borderTopColor: "#F0F0F0", backgroundColor: "#FAFAFA",
        }}>
          {[
            { bg: "#FFFFFF", border: "#CCC", label: "Available" },
            { bg: "#27AE60", border: "transparent", label: "Selected" },
            { bg: "#F39C12", border: "transparent", label: "Booked (M)" },
            { bg: "#9B59B6", border: "transparent", label: "Booked (F)" },
            { bg: "#E0E0E0", border: "#9E9E9E", label: "Blocked" },
          ].map(item => (
            <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{
                width: 11, height: 11, borderRadius: 3,
                backgroundColor: item.bg, borderWidth: 1, borderColor: item.border,
              }} />
              <Text style={{ fontSize: 9, color: "#555", fontWeight: "500" }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  </View>
);
const SleeperDeckSection = ({
  leftLower, leftUpper, rightLower, rightUpper,
  bookedSeats, selectedSeats, onToggle,
  seatPrice, seatGenderMap, blockedSeats = [],
}) => {

  // ── Dynamic sizing ──────────────────────────────────────────
  // Total available width for 8 seat columns:
  // SW - container margin(20) - inner padding(16) - aisle(14) - seat gaps(2px × 2 × 8)
  const CONTAINER_MARGIN = 20;  // marginHorizontal: 10 × 2
  const INNER_PAD        = 16;  // paddingHorizontal: 8 × 2
  const AISLE_W          = 14;  // aisle divider width
  const SEAT_GAP         = 2;   // margin on each side of seat
  const NUM_COLS         = 8;   // 4 left + 4 right

  const SEAT_W = Math.floor(
    (SW - CONTAINER_MARGIN - INNER_PAD - AISLE_W - SEAT_GAP * 2 * NUM_COLS) / NUM_COLS
  );
  // Compact height — just enough for emoji + number (no price inside cell)
  const SEAT_H = Math.floor(SEAT_W * 1.45);

  // Font sizes — proportional to seat width
  const EMOJI_F = Math.max(12, Math.floor(SEAT_W * 0.42));
  const NUM_F   = Math.max(9,  Math.floor(SEAT_W * 0.30));

  // Available count
  const allSeats = [
    ...leftLower.flat(), ...leftUpper.flat(),
    ...rightLower.flat(), ...rightUpper.flat(),
  ].filter(Boolean);
  const availCount = allSeats.filter(
    id => !bookedSeats.includes(id) && !selectedSeats.includes(id)
  ).length;

  // ── Single cell ─────────────────────────────────────────────
  const renderCell = (id) => {
    if (!id) return (
      <View key={`b_${Math.random()}`}
        style={{ width: SEAT_W, height: SEAT_H, margin: SEAT_GAP }} />
    );

    const isBooked   = bookedSeats.includes(id);
    const isSelected = selectedSeats.includes(id);
    const isFemale   = String(seatGenderMap?.[id]) === "Female";
    const isBlocked  = id && String(id).trim() !== "" && blockedSeats.includes(String(id));

    const bg = isBlocked            ? "#E0E0E0"
             : isSelected           ? "#27AE60"
             : isBooked && isFemale ? "#9B59B6"
             : isBooked             ? "#F39C12"
             : "#FFFFFF";

    const borderC = isBlocked ? "#9E9E9E" : isBooked || isSelected ? "transparent" : "#D5D5D5";
    const numC    = isBlocked ? "#757575" : isBooked || isSelected ? "#FFFFFF" : "#1A1A1A";
    const dimmed  = (isBooked && !isSelected) || isBlocked;
    return (
      <TouchableOpacity
        key={id}
       onPress={() => { if (!isBooked && !isBlocked && onToggle) onToggle(id); }}
        disabled={!!isBooked || !!isBlocked}
        activeOpacity={0.72}
        style={{
          width:           SEAT_W,
          height:          SEAT_H,
          margin:          SEAT_GAP,
          borderRadius:    6,
          borderWidth:     1,
          borderColor:     borderC,
          backgroundColor: bg,
          alignItems:      "center",
          justifyContent:  "center",
          // ✅ No paddingVertical — content is centered, no overflow
        }}
      >
        {/* Bed emoji */}
        {/* Bed emoji */}
        <Text style={{
          fontSize:   EMOJI_F,
          lineHeight: EMOJI_F + 2,
          opacity:    dimmed ? 0.55 : 1,
          includeFontPadding: false,
        }}>
          {isBlocked ? "🚫" : "🛏️"}
        </Text>

        {/* Seat number — below emoji, no price inside */}
        <Text style={{
          fontSize:           NUM_F,
          fontWeight:         "700",
          color:              numC,
          lineHeight:         NUM_F + 2,
          textAlign:          "center",
          includeFontPadding: false,
          marginTop:          2,
        }}>
          {String(id)}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Column sub-label (Lower / Upper) ────────────────────────
  // Width = 2 seats + their gaps
  const pairW = (SEAT_W + SEAT_GAP * 2) * 2;
  const SubLabel = ({ label }) => (
    <View style={{ width: pairW, alignItems: "center" }}>
      <Text style={{ fontSize: 9, color: "#999", fontWeight: "600" }}>{label}</Text>
    </View>
  );

  return (
    <View style={{
      backgroundColor:  "#FFFFFF",
      borderRadius:     14,
      borderWidth:      0.5,
      borderColor:      "#E5E5EA",
      overflow:         "hidden",
      marginHorizontal: 10,
      marginVertical:   8,
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={{
        flexDirection:     "row",
        justifyContent:    "space-between",
        alignItems:        "center",
        backgroundColor:   "#F2F2F7",
        paddingHorizontal: 14,
        paddingVertical:   10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E0E0E0",
      }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#2C3E50" }}>
          🛏 AC Sleeper
        </Text>
        <View style={{
          backgroundColor:   "#EAFAF1",
          borderRadius:      20,
          paddingHorizontal: 10,
          paddingVertical:   4,
          borderWidth:       1,
          borderColor:       "#A9DFBF",
        }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#27AE60" }}>
            {availCount} available
          </Text>
        </View>
      </View>

      {/* ── Driver bar ─────────────────────────────────────── */}
      <View style={{
        backgroundColor:   "#2C3E50",
        paddingHorizontal: 14,
        paddingVertical:   5,
        alignItems:        "flex-end",
      }}>
        <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
          DRIVER →
        </Text>
      </View>

      {/* ── Price strip (single row, outside cells) ─────────── */}
      {seatPrice > 0 && (
        <View style={{
          backgroundColor:   "#FFF8E1",
          paddingVertical:   4,
          alignItems:        "center",
          borderBottomWidth: 0.5,
          borderBottomColor: "#FFE082",
        }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#E65100" }}>
            ₹{seatPrice} / seat
          </Text>
        </View>
      )}

      {/* ── Side + Lower/Upper labels ───────────────────────── */}
      <View style={{
        flexDirection:     "row",
        paddingHorizontal: 8,
        paddingTop:        8,
        paddingBottom:     2,
        alignItems:        "flex-end",
      }}>
        {/* LEFT label group */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{
            fontSize: 10, fontWeight: "700", color: "#555",
            letterSpacing: 0.4, marginBottom: 3,
          }}>
            LEFT SIDE
          </Text>
          <View style={{ flexDirection: "row" }}>
            <SubLabel label="Lower" />
            <SubLabel label="Upper" />
          </View>
        </View>

        {/* Aisle gap */}
        <View style={{ width: AISLE_W }} />

        {/* RIGHT label group */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{
            fontSize: 10, fontWeight: "700", color: "#555",
            letterSpacing: 0.4, marginBottom: 3,
          }}>
            RIGHT SIDE
          </Text>
          <View style={{ flexDirection: "row" }}>
            <SubLabel label="Lower" />
            <SubLabel label="Upper" />
          </View>
        </View>
      </View>

      {/* ── Seat rows ───────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 12 }}>
        {leftLower.map((_, ri) => {
          const ll0 = leftLower[ri]?.[0],  ll1 = leftLower[ri]?.[1];
          const lu0 = leftUpper[ri]?.[0],  lu1 = leftUpper[ri]?.[1];
          const rl0 = rightLower[ri]?.[0], rl1 = rightLower[ri]?.[1];
          const ru0 = rightUpper[ri]?.[0], ru1 = rightUpper[ri]?.[1];

          // All empty → thin spacer
          if (!ll0 && !ll1 && !lu0 && !lu1 && !rl0 && !rl1 && !ru0 && !ru1) {
            return <View key={`sp_${ri}`} style={{ height: 4 }} />;
          }

          return (
            <View key={ri} style={{
              flexDirection:  "row",
              alignItems:     "center",
              marginVertical: 1,
            }}>
              {/* LEFT side: lower pair + upper pair */}
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
                {renderCell(ll0)}
                {renderCell(ll1)}
                {renderCell(lu0)}
                {renderCell(lu1)}
              </View>

              {/* Aisle divider */}
              <View style={{ width: AISLE_W, alignItems: "center" }}>
                <View style={{
                  width: 1, height: SEAT_H - 4, backgroundColor: "#EBEBEB",
                }} />
              </View>

              {/* RIGHT side: lower pair + upper pair */}
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
                {renderCell(rl0)}
                {renderCell(rl1)}
                {renderCell(ru0)}
                {renderCell(ru1)}
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Legend ──────────────────────────────────────────── */}
      <View style={{
        flexDirection:     "row",
        flexWrap:          "wrap",
        gap:               10,
        paddingHorizontal: 12,
        paddingVertical:   10,
        borderTopWidth:    0.5,
        borderTopColor:    "#F0F0F0",
        backgroundColor:   "#FAFAFA",
      }}>
        {[
          { bg: "#FFFFFF", border: "#CCC", label: "Available" },
          { bg: "#27AE60", border: "transparent", label: "Selected" },
          { bg: "#F39C12", border: "transparent", label: "Booked (M)" },
          { bg: "#9B59B6", border: "transparent", label: "Booked (F)" },
        ].map(item => (
          <View key={item.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{
              width: 13, height: 13, borderRadius: 3,
              backgroundColor: item.bg,
              borderWidth: 1, borderColor: item.border,
            }} />
            <Text style={{ fontSize: 10, color: "#555", fontWeight: "500" }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

    </View>
  );
};
const deckSt = StyleSheet.create({
  wrap: { backgroundColor:C.white, borderRadius:12, borderWidth:0.5, borderColor:C.border, overflow:"hidden", flex:1 },
  header: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", backgroundColor:"#F4F4F4", paddingHorizontal:12, paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:"#E0E0E0" },
  title: { fontSize:12, fontWeight:"700", color:"#2C3E50", flexShrink:1, maxWidth:"60%" },
  availBadge: { backgroundColor:C.greenLight, borderRadius:20, paddingHorizontal:9, paddingVertical:3, borderWidth:1, borderColor:C.greenBorder },
  availText: { fontSize:9, fontWeight:"700", color:C.green },
});
const pax = StyleSheet.create({
  sectionCard:{backgroundColor:C.white,borderRadius:18,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border,elevation:2},
  sectionHead:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12,paddingBottom:10,borderBottomWidth:1,borderBottomColor:C.chip},
  sectionIcon:{fontSize:18},
  sectionTitle:{fontSize:F.md,fontWeight:"700",color:C.text},
  genderChip:{flex:1,borderWidth:1.5,borderColor:C.border,borderRadius:8,paddingVertical:10,alignItems:"center",backgroundColor:C.white},
  genderChipActive:{backgroundColor:C.red,borderColor:C.red},
  genderChipText:{fontWeight:"700",color:C.textMid,fontSize:F.sm},
  payChip:{flex:1,borderWidth:1.5,borderColor:C.border,borderRadius:14,paddingVertical:14,alignItems:"center",backgroundColor:C.white,position:"relative"},
  payChipText:{fontSize:F.xs,fontWeight:"600",color:C.textMid,marginTop:2},
  payCheckDot:{position:"absolute",top:6,right:6,width:16,height:16,borderRadius:8,justifyContent:"center",alignItems:"center"},
  payDetailBox:{backgroundColor:C.chip,borderRadius:14,padding:14,marginTop:12,borderWidth:1,borderColor:C.border},
  payDetailHead:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:10},
  payDetailTitle:{fontSize:F.sm,fontWeight:"700",color:C.text},
  upiAppsRow:{flexDirection:"row",gap:8,marginTop:10,flexWrap:"wrap"},
  upiAppChip:{flexDirection:"row",alignItems:"center",gap:4,borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:10,paddingVertical:6,backgroundColor:C.white},
  upiAppChipActive:{borderColor:"#6C3FC5",backgroundColor:"#F3EEFF"},
  upiAppText:{fontSize:F.xs,fontWeight:"600",color:C.textMid},
  payStatusRow:{flexDirection:"row",alignItems:"center",gap:6,marginTop:10},
  payStatusDot:{width:8,height:8,borderRadius:4,backgroundColor:C.green},
  payStatusText:{fontSize:F.xs,color:C.textMid,fontWeight:"500"},
});
// ─── NOTIFICATION HANDLER SETUP ──────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});
// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [settings, setSettings] = useState({});
  const [screen, setScreen] = useState("splash");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name:"", phone:"", email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [user, setUser]   = useState(null);
  const [wallet, setWallet] = useState(0);
  const [language, setLanguage] = useState("English");
  const t = translations[language] || translations["English"];
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [bookedSeatMap, setBookedSeatMap] = useState({});
  const [alertState, setAlertState] = useState({ visible:false, title:"", message:"", buttons:[] });
  const showAlert = useCallback((title, message, buttons) => {
    setAlertState({ visible:true, title:title||"", message:message||"", buttons:buttons||[{text:"OK"}] });
  }, []);
  const hideAlert = useCallback(() => { setAlertState(p => ({ ...p, visible:false })); }, []);
  const [genderPicker, setGenderPicker] = useState({ visible:false, seatId:null });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-SW * 0.82)).current;
  const [showProfile, setShowProfile] = useState(false);
  
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showGetTicket, setShowGetTicket] = useState(false);
  const [showCancelTicket, setShowCancelTicket] = useState(false);
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [search, setSearch] = useState({ from:"Karad", to:"Mumbai", date:getTodayStr() });
  const [showFromSug, setShowFromSug] = useState(false);
  const [showToSug, setShowToSug] = useState(false);
  const [fromInput, setFromInput] = useState("Karad");
  const [toInput, setToInput] = useState("Mumbai");
  const [buses, setBuses] = useState([]);
  const [busFilter, setBusFilter] = useState("All");
  const [detailBus, setDetailBus] = useState(null);
  const [showBusDetail, setShowBusDetail] = useState(false);
  const [seatGenderMap, setSeatGenderMap] = useState({});
  const [showSeatInfo, setShowSeatInfo] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showCouponBox, setShowCouponBox] = useState(false);
 const [selectedSeats, setSelectedSeats] = useState([]);
const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
const [editContactVisible, setEditContactVisible] = useState(false);
const [addPassengerVisible, setAddPassengerVisible] = useState(false);
const [passengers, setPassengers] = useState([]);
const [newPassForm, setNewPassForm] = useState({ name:"", age:"", gender:"Male" });
const [cashSettings, setCashSettings] = useState({
  cashPaymentEnabled: true,
  cashOverridePhones: [],
});
  const [bookingTab, setBookingTab] = useState(0);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedDropping, setSelectedDropping] = useState(null);
  const [passengerInfo, setPassengerInfo] = useState({ name:"", age:"", gender:"Male", phone:"", email:"" });
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const phone = settings?.contactPhone1 || "9021694503";

// clean digits (remove +91, spaces, etc.)
const cleanPhone = String(phone).replace(/\D/g, "");

// WhatsApp needs country code without +
const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

const message = encodeURIComponent(
  "Hello, I want to book a ticket and pay by cash. Please enable cash payment for my booking."
);
 const cashAllowed = isCashAllowed(cashSettings, passengerInfo?.phone);
const currentPhone = String(passengerInfo?.phone || "").replace(/\D/g, "");
const overridePhones = (cashSettings.cashOverridePhones || []).map(p => String(p).replace(/\D/g, ""));
const showCashOption = cashSettings.cashPaymentEnabled === true || 
  (currentPhone.length >= 10 && overridePhones.includes(currentPhone));

  const [offerCode, setOfferCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [baseAmount, setBaseAmount] = useState(0);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Please wait...");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
const [showOtpModal,   setShowOtpModal]   = useState(false);
// ── QR Payment State ──────────────────────────────────────────────
const [qrSettings,       setQrSettings]       = useState(null);
// Derive which payment methods are allowed from admin settings
const paymentMethodsAllowed = {
  qr:       qrSettings?.qrEnabled       !== false,
  razorpay: qrSettings?.razorpayEnabled !== false,
  cash:     cashSettings?.cashPaymentEnabled === true,
};
const [showQRModal,      setShowQRModal]       = useState(false);
const [qrUtrNumber,      setQrUtrNumber]       = useState("");
const [qrPaymentDone,    setQrPaymentDone]     = useState(false);
const [qrBookingPending, setQrBookingPending]  = useState(false);
const [otpValue,       setOtpValue]       = useState("");
const [otpSending,     setOtpSending]     = useState(false);
const [otpVerifying,   setOtpVerifying]   = useState(false);
const [otpResendTimer, setOtpResendTimer] = useState(0);
const otpTimerRef = useRef(null);


// ← इथे add करा
const startOtpTimer = () => {
  setOtpResendTimer(30);
  if (otpTimerRef.current) clearInterval(otpTimerRef.current);
  otpTimerRef.current = setInterval(() => {
    setOtpResendTimer(prev => {
      if (prev <= 1) { clearInterval(otpTimerRef.current); return 0; }
      return prev - 1;
    });
  }, 1000);
};
useEffect(() => {
  registerForPush();
}, []);
const notificationListener = useRef();
const responseListener = useRef();

useEffect(() => {
  if (Platform.OS === "web") return;

  notificationListener.current =
    Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      console.log("🔔 Foreground:", title, "-", body);
    });

  responseListener.current =
    Notifications.addNotificationResponseReceivedListener(response => {
      const { title } = response.notification.request.content;
      console.log("👆 Clicked:", title);
    });

  return () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
  };
}, []);
  useEffect(() => {
    const init = async () => {
      try {
        const saved = await AsyncStorage.getItem("@shahaji_language");
        if (saved && SUPPORTED_LANGUAGES.includes(saved)) setLanguage(saved);
      } catch {}
      setTimeout(() => setScreen("langSelect"), 2200);
    };
    init();
  }, []);
 
    // HomeScreen च्या notification list मध्ये add करा
    
  useEffect(() => {
  // Auto-switch if current payment method gets disabled by admin
  const allowed = {
    QR_UPI:   qrSettings?.qrEnabled    !== false,
    GPay:     qrSettings?.razorpayEnabled !== false,
    PhonePe:  qrSettings?.razorpayEnabled !== false,
    UPI:      qrSettings?.razorpayEnabled !== false,
    Card:     qrSettings?.razorpayEnabled !== false,
    NetBanking: qrSettings?.razorpayEnabled !== false,
    Cash:     (qrSettings?.cashEnabled !== false) && cashAllowed,
  };

  if (paymentMethod && allowed[paymentMethod] === false) {
    // Pick first available
    if (allowed.QR_UPI)   setPaymentMethod("QR_UPI");
    else if (allowed.Cash) setPaymentMethod("Cash");
    else if (allowed.GPay) setPaymentMethod("GPay");
  }
}, [qrSettings, cashAllowed]);
// ── Fetch QR settings ──────────────────────────────────────────────
useEffect(() => {
  fetch(`${API_BASE}/api/qr-settings`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.settings) {
        setQrSettings(data.settings);
        // Debug: QR image load झाली का ते check करा
        if (data.settings.qrImageBase64) {
          console.log("✅ QR image loaded, length:", data.settings.qrImageBase64.length);
        } else {
          console.log("⚠️ No QR image in settings");
        }
      }
    })
    .catch((err) => console.log("QR settings fetch error:", err));
}, []);
// 🔥 ADD THIS BELOW YOUR EXISTING useEffect
useEffect(() => {
  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();

      setCashSettings({
        cashPaymentEnabled: data.cashPaymentEnabled,
        cashOverridePhones: data.cashOverridePhones || []
      });

    } catch (err) {
      console.log("Settings fetch error", err);
    }
  };

  loadSettings();
}, []);

useEffect(() => {
  if (!cashAllowed && paymentMethod === "Cash") {
    setPaymentMethod("UPI"); // fallback
  }
}, [cashAllowed]);
const API_BASE_URL = "https://shahaji-travels-backend.onrender.com";

// FCM Token Register करा
async function registerForPushNotifications(userId = "", phone = "") {
  try {
    if (!Device.isDevice) {
      console.log("FCM: Physical device नाही, skip.");
      return null;
    }

    // Android Channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("shahaji_channel", {
        name:            "Shahaji Travels",
        importance:       Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       "#C0392B",
        sound:            "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("FCM: Permission denied");
      return null;
    }

    // Expo push token (production मध्ये FCM token directly वापरा)
    

    const tokenResult = await Notifications.getDevicePushTokenAsync();
const fcmToken = tokenResult.data;
    console.log("FCM Token:", fcmToken);

    // Backend ला register करा
    await fetch(`${API_BASE_URL}/api/fcm/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        token:    fcmToken,
        userId:   userId,
        phone:    phone,
        platform: Platform.OS,
      }),
    });

    return fcmToken;
  } catch (err) {
    console.error("FCM register error:", err.message);
    return null;
  }
}
useEffect(() => {
  const tot = getTotalAmount();
  const afterOffer = appliedOffer ? Math.max(0, tot - (appliedOffer.discount || 0)) : tot;
  setBaseAmount(afterOffer);
}, [selectedSeats, appliedOffer, selectedBus]);
  useEffect(() => {
    if (IS_WEB) return;
    const handler = () => {
      if (alertState.visible)   { hideAlert(); return true; }
      if (genderPicker.visible) { setGenderPicker({visible:false,seatId:null}); return true; }
      if (showProfile)          { setShowProfile(false); return true; }
    
      if (showMyBookings)       { setShowMyBookings(false); return true; }
      if (showOffers)           { setShowOffers(false); return true; }
      if (showGetTicket)        { setShowGetTicket(false); return true; }
      if (showCancelTicket)     { setShowCancelTicket(false); return true; }
      if (showCustomerCare)     { setShowCustomerCare(false); return true; }
      if (showLanguage)         { setShowLanguage(false); return true; }
      if (showLogout)           { setShowLogout(false); return true; }
      if (drawerOpen)           { closeDrawer(); return true; }
      if (showBusDetail)        { setShowBusDetail(false); return true; }
      if (screen==="buslist")   { setScreen("home"); return true; }
      if (screen==="booking")   { setScreen("buslist"); return true; }
      if (screen==="ticket")    { setScreen("home"); return true; }
      return false;
    };
   
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [screen, drawerOpen, showBusDetail, alertState.visible, genderPicker.visible,
      showProfile, showMyBookings, showOffers, showGetTicket,
      showCancelTicket, showCustomerCare, showLanguage, showLogout]);

  const changeLanguage = useCallback(async (lang) => {
    setLanguage(lang);
    try { await AsyncStorage.setItem("@shahaji_language", lang); } catch {}
  }, []);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, { toValue:0, duration:280, useNativeDriver:true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue:-SW*0.82, duration:260, useNativeDriver:true }).start(() => setDrawerOpen(false));
  };

  const handleRegister = async () => {
    const { name, phone, email, password } = authForm;
    if (!name.trim())                          return showAlert(t.errorTitle, t.enterFullName||"Enter full name");
    if (!phone.trim() || phone.length < 10)    return showAlert(t.errorTitle, t.enterValidPhone||"Enter valid 10-digit phone");
    if (!email.trim() || !email.includes("@")) return showAlert(t.errorTitle, t.enterValidEmail||"Enter valid email");
    if (!password || password.length < 6)      return showAlert(t.errorTitle, t.passwordTooShort||"Password min 6 chars");
    setLoading(true); setLoadMsg(t.registering||"Registering...");
    try {
      await api.register({ name, phone, email, password });
      const res = await api.login({ email, password });
      const u = res.user || res.data?.user || res;
      if (!u || !u._id) throw new Error(res.message||"Login after register failed");
      setUser(u); setWallet(u.wallet||0);
      setPassengerInfo(p=>({...p, name:u.name||u.fullName||"", phone:u.phone||"", email:u.email||""}));
    
      showAlert("✅ Registered!", "Account created successfully. Welcome!", [{ text:"OK", onPress:()=>setScreen("home") }]);
    } catch (err) { showAlert(t.registrationFailed||"Registration Failed", err?.message||"Try again."); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    const { email, password } = authForm;
    if (!email.trim())               return showAlert(t.errorTitle, t.enterEmailError||"Enter email");
    if (!password || password.length < 4) return showAlert(t.errorTitle, t.enterPasswordError||"Enter password");
    setLoading(true); setLoadMsg(t.loggingIn||"Logging in...");
    try {
      const res = await api.login({ email, password });
      const u = res.user || res.data?.user || res;
      if (!u || !u._id) throw new Error(res.message||"Login failed");
      setUser(u); setWallet(u.wallet||0);
      setPassengerInfo(p=>({...p, name:u.name||u.fullName||"", phone:u.phone||"", email:u.email||""}));
      
      registerForPush(u._id || "", u.phone || "").catch(() => {});
      setScreen("home");
    } catch (err) { showAlert(t.loginFailed||"Login Failed", err?.message||"Invalid credentials."); }
    finally { setLoading(false); }
  };

  const handleLogoutConfirm = () => {
  setUser(null);
  setWallet(0);
  setTicket(null);
  setBuses([]);
  setSelectedBus(null);

  setAuthForm({
    name: "",
    phone: "",
    email: "",
    password: ""
  });

  setShowLogout(false);
  closeDrawer();

  setScreen("auth");
  setAuthMode("login");
};

  // REPLACE the entire handleSearch function
const handleSearch = async () => {
  if (!search.from?.trim() || !search.to?.trim())
    return showAlert(t.errorTitle, t.enterFrom || "Please enter From and To cities.");
  if (search.from.trim().toLowerCase() === search.to.trim().toLowerCase())
    return showAlert(t.errorTitle, t.sameCity || "From and To cannot be same.");
  if (!search.date?.trim())
    return showAlert(t.errorTitle, "Please select a travel date.");

  setLoading(true);
  setLoadMsg(t.searchingBuses || "Searching...");
  setBuses([]);

  try {
    const res = await api.searchBuses({
      from: search.from.trim(),
      to:   search.to.trim(),
      date: search.date.trim(),
    });

    const list = Array.isArray(res.buses) ? res.buses : [];
    setBuses(list);
    setBusFilter("All");
    setScreen("buslist");

    if (!list.length) {
      showAlert(
        "Bus Not Found",
        `No buses available from ${search.from} to ${search.to} on ${search.date}.`
      );
    }
  } catch (err) {
    setBuses([]);
    showAlert(t.searchFailed || "Search Failed", err?.message || "Could not fetch buses.");
  } finally {
    setLoading(false);
  }
};

 const handleSelectBus = async (bus) => {
  let busBlockedSeats = [];

  setSelectedSeats([]); 
  setSeatGenderMap({});
  setSelectedBoarding(null); 
  setSelectedDropping(null); 
  setBookingTab(0);
  setAppliedOffer(null); 
  setOfferCode(""); 
  setPaymentMethod("Cash");
  setBoardingPoints([]); 
  setDroppingPoints([]); 
  setShowBusDetail(false);
  setLoading(true); 
  setLoadMsg(t.loadingSeats || "Loading...");

  // Cash Settings Fetch
  try {
    const settingsRes = await fetch(`${API_BASE}/api/settings`);
    const settingsData = await settingsRes.json();
    setCashSettings({
      cashPaymentEnabled: settingsData.cashPaymentEnabled !== false,
      cashOverridePhones: settingsData.cashOverridePhones || [],
    });
  } catch {
    // default → cash enabled
  }

  // QR Settings Fetch
  try {
    const qrRes = await fetch(`${API_BASE}/api/qr-settings`);
    const qrData = await qrRes.json();
    if (qrData.success && qrData.settings) {
      setQrSettings(qrData.settings);
    }
  } catch {}

  try {
    let bSeats = []; 
    let bGenderMap = {};

    // Blocked seats fetch from bus API
   // Blocked seats fetch from bus API
    try {
      const busRes = await fetch(`${API_BASE}/api/buses/${bus._id || bus.id}`);
      const busData = await busRes.json();
      const fetchedBus = busData.bus || busData;
      
      console.log("🚌 fetchedBus.blockedSeats:", fetchedBus.blockedSeats);
      console.log("🚌 fetchedBus.seats:", JSON.stringify(fetchedBus.seats?.slice(0,3)));

      const fromBlockedArr = Array.isArray(fetchedBus.blockedSeats) 
        ? fetchedBus.blockedSeats.map(String) 
        : [];
     const fromSeatsArr = Array.isArray(fetchedBus.seats)
  ? fetchedBus.seats
      .filter(s => s && s.isBlocked === true && s.seatNo && String(s.seatNo).trim() !== "")
      .map(s => String(s.seatNo).trim())
  : [];
console.log("🔴 fromSeatsArr (isBlocked=true):", fromSeatsArr);
      busBlockedSeats = [...new Set([...fromBlockedArr, ...fromSeatsArr])];
      console.log("✅ busBlockedSeats final:", busBlockedSeats);
      bus = { ...bus, blockedSeats: busBlockedSeats, seats: fetchedBus.seats || [] };
    } catch (e) {
      busBlockedSeats = Array.isArray(bus.blockedSeats) ? bus.blockedSeats.map(String) : [];
      console.log("❌ Bus fetch error:", e.message);
    }

    // selectedBus set करा
    const finalBlocked = [...new Set([
  ...(Array.isArray(bus.blockedSeats) ? bus.blockedSeats.map(String) : []),
  ...busBlockedSeats,
])].filter(s => s && s.trim() !== "" && s !== "undefined" && s !== "null");
console.log("✅ finalBlocked seats:", JSON.stringify(finalBlocked));

setSelectedBus({
  ...bus,
  blockedSeats: finalBlocked,
  seats: Array.isArray(bus.seats) ? bus.seats : [],
});
    // Booked seats fetch
    try {
      const r = await api.getBookedSeats(bus.id || bus._id, search.date);
      const rawSeats = r?.bookedSeats || [];
      if (rawSeats.length > 0 && typeof rawSeats[0] === "object") {
        bSeats = rawSeats.map(s => s.id || s.seatNumber);
        rawSeats.forEach(s => { 
          bGenderMap[s.id || s.seatNumber] = s.gender || "Male"; 
        });
      } else {
        bSeats = rawSeats;
        rawSeats.forEach(id => { 
          bGenderMap[id] = "Male"; 
        });
      }
    } catch {
      bSeats = bus.bookedSeats || [];
      bSeats.forEach(id => { 
        bGenderMap[id] = "Male"; 
      });
    }

    // Boarding points fetch
    let bPts = [];
    try {
      const r = await api.getBoardingPoints(bus.id || bus._id, search.from, search.to);
      bPts = (r?.points || []).map((p, i) => ({
        id: p.id || p._id || `bp_${i}`,
        name: getPointName(p.name || p.pointName || `Point ${i + 1}`, language),
        address: p.address || "", 
        time: p.time || p.departureTime || "",
      }));
    } catch { 
      bPts = makeFallbackPts(bus, search.from, "boarding"); 
    }

    // Dropping points fetch
    let dPts = [];
    try {
      const r = await api.getDroppingPoints(bus.id || bus._id, search.from, search.to);
      dPts = (r?.points || []).map((p, i) => ({
        id: p.id || p._id || `dp_${i}`,
        name: getPointName(p.name || p.pointName || `Point ${i + 1}`, language),
        address: p.address || "", 
        time: p.time || p.arrivalTime || "",
      }));
    } catch { 
      dPts = makeFallbackPts(bus, search.to, "dropping"); 
    }

    setBookedSeats(bSeats); 
    setBookedSeatMap(bGenderMap);
    setBoardingPoints(bPts); 
    setDroppingPoints(dPts);
    setScreen("booking");

  } catch (err) { 
    showAlert(t.errorTitle, err?.message || "Could not load bus."); 
  } finally { 
    setLoading(false); 
  }
};

  const SeatInfoModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" }}>
        <View style={{ backgroundColor:"white", borderRadius:16, padding:20, margin:12 }}>
          <Text style={{ fontSize:18, fontWeight:"700", marginBottom:16 }}>Seat Guide</Text>
          {[
            { icon:"💺", color:"#FFFFFF", border:"#ddd",    label:"Available (Seater)" },
            { icon:"🛏️", color:"#FFFFFF", border:"#ddd",    label:"Available (Sleeper)" },
            { icon:"💺", color:"#4CAF50", border:"#388E3C", label:"Selected (Seater)" },
            { icon:"🛏️", color:"#4CAF50", border:"#388E3C", label:"Selected (Sleeper)" },
            { icon:"💺", color:"#F39C12", border:"#F39C12", label:"Male Booked" },
            { icon:"🛏️", color:"#7B1FA2", border:"#4A148C", label:"Female Booked" },
            { icon:"💺", color:"#9E9E9E", border:"#616161", label:"Blocked" },
          ].map(item => (
            <View key={item.label} style={{ flexDirection:"row", alignItems:"center", marginBottom:12 }}>
              <View style={{ width:44, height:44, borderRadius:8, backgroundColor:item.color, borderWidth:1.5, borderColor:item.border, alignItems:"center", justifyContent:"center", marginRight:14 }}>
                <Text style={{ fontSize:22 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize:14, color:"#333", fontWeight:"500" }}>{item.label}</Text>
            </View>
          ))}
          <TouchableOpacity style={{ backgroundColor:"#C0392B", borderRadius:10, padding:14, alignItems:"center", marginTop:8 }} onPress={onClose}>
            <Text style={{ color:"white", fontWeight:"700", fontSize:15 }}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


const callOperator = () => {
  const url = `tel:${cleanPhone}`;
  if (Platform.OS === "web") {
    window.open(url, "_self");
  } else {
    Linking.openURL(url);
  }
};

const openWhatsApp = () => {
  const url = `https://wa.me/${waPhone}?text=${message}`;
  if (Platform.OS === "web") {
    window.open(url, "_blank");
  } else {
    Linking.openURL(url);
  }
};
  const makeFallbackPts = (bus, city, type) => {
    const src = type==="boarding" ? bus.boardingPoints : bus.droppingPoints;
    if (src?.length) return src.map((p,i)=>({id:p.id||`f_${i}`,name:getPointName(p.name||city,language),address:p.address||"",time:p.time||""}));
    return [
      {id:`${type}_1`,name:`${city} Bus Stand`,address:`Main ${city} Bus Stand`,time:type==="boarding"?(bus.departure||""):(bus.arrival||"")},
      {id:`${type}_2`,name:`${city} ST Stand`,address:city,time:""},
    ];
  };

  const toggleSeat = useCallback((id) => {
  const _seatsArr = Array.isArray(selectedBus?.seats) ? selectedBus.seats : [];
const _blockedFromSeats = _seatsArr
  .filter(s => s && s.isBlocked === true)
  .map(s => String(s.seatNo));
const _blockedFromArr = Array.isArray(selectedBus?.blockedSeats)
  ? selectedBus.blockedSeats.map(String)
  : [];
const allBlocked = [...new Set([..._blockedFromArr, ..._blockedFromSeats])];
console.log("🔴 allBlocked:", allBlocked, "seat clicked:", String(id));
if (allBlocked.includes(String(id))) {
  showAlert("Seat Unavailable", "This seat has been blocked by the operator.");
  return;
}
  if (selectedSeats.includes(id)) {
    setSelectedSeats(p => p.filter(s => s !== id));
    setSeatGenderMap(p => { const n = { ...p }; delete n[id]; return n; });
    return;
  }
  if (selectedSeats.length >= 6) { showAlert(t.errorTitle, t.maxSeats); return; }
  setGenderPicker({ visible: true, seatId: id });
}, [selectedSeats, selectedBus, t, showAlert]);
  const handleGenderSelect = useCallback((gender) => {
    const id = genderPicker.seatId;
    setGenderPicker({visible:false,seatId:null});
    if (!id) return;
    setSelectedSeats(p=>[...p,id]);
    setSeatGenderMap(p=>({...p,[id]:gender}));
  }, [genderPicker.seatId]);

  const getTotalAmount = () => {
    if (!selectedBus || !selectedSeats.length) return 0;
    const busType = (selectedBus.type || "").toLowerCase();
    const isPureSleeper = busType.includes("ac sleeper") && !busType.includes("seater");
    if (isPureSleeper) {
      const sleeperP = Number(selectedBus.sleeperPrice) || Number(selectedBus.price) || 0;
      return selectedSeats.length * sleeperP;
    }
    const seaterP  = Number(selectedBus.seaterPrice)  || Number(selectedBus.price) || 0;
    const sleeperP = Number(selectedBus.sleeperPrice) || Number(selectedBus.price) || 0;
    return selectedSeats.reduce((total, id) => {
      const isUpper = /^A[1-6]$/.test(String(id)) || /^[A-L]$/.test(String(id));
      return total + (isUpper ? sleeperP : seaterP);
    }, 0);
  };

 const getFinalAmount = () => {
  const tot = getTotalAmount();
  const afterOffer = appliedOffer ? Math.max(0, tot - (appliedOffer.discount || 0)) : tot;
  if (paymentMethod === "Razorpay") {
    return Math.round(afterOffer + (afterOffer * 0.02));
  }
  return afterOffer;
};

  const applyOffer = async () => {
    if (!offerCode.trim()) return;
    setLoading(true); setLoadMsg(t.validatingOffer||"Validating...");
    try {
      const res = await api.validateOffer(offerCode.trim(), getTotalAmount());
      setAppliedOffer(res);
      showAlert(t.offerApplied||"Offer Applied ✅", res.description||`₹${res.discount} off`);
    } catch (err) { showAlert(t.invalidOfferTitle||"Invalid Offer", err?.message||"Invalid code"); }
    finally { setLoading(false); }
  };
  // ── QR Payment: Submit UTR and create pending booking ─────────────
const handleQRBooking = async () => {
  if (!qrUtrNumber.trim() || qrUtrNumber.trim().length < 6) {
    return showAlert("UTR Error", "Valid UTR number enter करा (minimum 6 digits).");
  }
  setLoading(true);
  setLoadMsg("Booking submit करत आहे...");
  try {
    const data = {
      userId:        user?._id || user?.id || "",
      customerName:  passengerInfo.name,
      phone:         passengerInfo.phone,
      email:         passengerInfo.email || user?.email || "",
      bus:           String(selectedBus._id || selectedBus.id || ""),
      busName:       selectedBus.name || "",
      date:          search.date,
      journeyDate:   search.date,
      boardingPoint: selectedBoarding?.name || "",
      droppingPoint: selectedDropping?.name || "",
      passengers:    [{ name: passengerInfo.name, age: Number(passengerInfo.age), gender: passengerInfo.gender, phone: passengerInfo.phone }],
      seatNumbers:   selectedSeats,
      amount:        getFinalAmount(),
      utrNumber:     qrUtrNumber.trim(),
    };

    const res = await fetch(`${API_BASE}/api/bookings/qr-pending`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Booking failed");

    setShowQRModal(false);
    setQrBookingPending(true);

    // Show pending screen as ticket
    setTicket({
      ...data,
      bookingId:     json.bookingId,
      busName:       selectedBus.name || "Shahaji Travels",
      busType:       selectedBus.type || "AC Sleeper",
      selectedSeats,
      departure:     selectedBus.departure,
      arrival:       selectedBus.arrival,
      duration:      selectedBus.duration,
      route:         `${search.from} → ${search.to}`,
      date:          search.date,
      amount:        getFinalAmount(),
      paymentMode:   "QR_UPI",
      bookingStatus: "Pending",
    });

    setBookedSeats(prev => [...prev, ...selectedSeats]);
    setScreen("ticket");
  } catch (err) {
    showAlert("Booking Error", err?.message || "Could not submit booking.");
  } finally {
    setLoading(false);
  }
};
const handleConfirmBooking = async () => {
  // ── Validations ──────────────────────────────────────────
  if (!selectedSeats.length)
    return showAlert(t.errorTitle, "Please select a seat.");
  if (!passengerInfo.name.trim())
    return showAlert(t.errorTitle, "Enter passenger name.");
  if (!passengerInfo.phone.trim() || passengerInfo.phone.length < 10)
    return showAlert(t.errorTitle, "Enter valid 10-digit phone.");
  if (!passengerInfo.age.trim())
    return showAlert(t.errorTitle, "Enter passenger age.");
  if (!selectedBoarding?.id)
    return showAlert(t.errorTitle, "Please select boarding point.");
  if (!selectedDropping?.id)
    return showAlert(t.errorTitle, "Please select dropping point.");

  // ── QR Payment → show QR modal directly (no OTP before scan) ──
  if (paymentMethod === "QR_UPI") {
    setQrUtrNumber("");
    setQrPaymentDone(false);
    setShowQRModal(true);
    return;
  }

  // ── Cash → confirm modal directly ────────────────────────
 // ── Cash → OTP verify करा मग confirm ────────────────────
  if (paymentMethod === "Cash") {
    setOtpValue("");
    setOtpSending(true);
    try {
      await sendOtp(passengerInfo.phone);
      setOtpSending(false);
      setShowOtpModal(true);
      startOtpTimer();
    } catch (err) {
      setOtpSending(false);
      showAlert("OTP Error", err?.message || "OTP पाठवता आला नाही.");
    }
    return;
  }

  // ── UPI Validation ────────────────────────────────────────
  if (["GPay", "PhonePe", "UPI"].includes(paymentMethod)) {
    if (!passengerInfo.upiId?.trim())
      return showAlert("UPI Error", "UPI ID enter करा.");
    if (!passengerInfo.upiId.includes("@"))
      return showAlert("UPI Error", "Valid UPI ID enter करा (example@upi).");
  }

  // ── Card Validation ───────────────────────────────────────
  if (paymentMethod === "Card") {
    if (!passengerInfo.cardNumber || passengerInfo.cardNumber.replace(/\s/g, "").length < 16)
      return showAlert("Card Error", "16 digit card number enter करा.");
    if (!passengerInfo.cardExpiry || passengerInfo.cardExpiry.length < 5)
      return showAlert("Card Error", "Expiry date enter करा.");
    if (!passengerInfo.cardCvv || passengerInfo.cardCvv.length < 3)
      return showAlert("Card Error", "CVV enter करा.");
    if (!passengerInfo.cardName?.trim())
      return showAlert("Card Error", "Card holder name enter करा.");
  }

  // ── OTP for all remaining payment types ───────────────────
  setOtpValue("");
  setOtpSending(true);
  try {
    await sendOtp(passengerInfo.phone);
    setOtpSending(false);
    setShowOtpModal(true);
    startOtpTimer();
  } catch (err) {
    setOtpSending(false);
    showAlert("OTP Error", err?.message || "OTP पाठवता आला नाही.");
  }
};
const handleRazorpayPayment = async () => {
  // Cash → direct confirm modal
 

  // Validations
  if (["GPay","PhonePe","UPI"].includes(paymentMethod)) {
    if (!passengerInfo.upiId?.trim())
      return showAlert(t.upiError, t.enterUpi);

    if (!passengerInfo.upiId.includes("@"))
      return showAlert(t.upiError, t.validUpi);
  }

  if (paymentMethod === "Card") {
    if (!passengerInfo.cardNumber || passengerInfo.cardNumber.replace(/\s/g,"").length < 16)
      return showAlert(t.cardError, t.enterCardNumber);

    if (!passengerInfo.cardExpiry || passengerInfo.cardExpiry.length < 5)
      return showAlert(t.cardError, t.enterExpiry);

    if (!passengerInfo.cardCvv || passengerInfo.cardCvv.length < 3)
      return showAlert(t.cardError, t.enterCvv);

    if (!passengerInfo.cardName?.trim())
      return showAlert(t.cardError, t.enterCardName);
  }

  if (paymentMethod === "NetBanking") {
    if (!passengerInfo.selectedBank)
      return showAlert(t.netBankingError, t.selectBank);
  }

  setLoading(true);
  setLoadMsg(t.paymentInitiating);

  try {
    // ── Step 1: Order create ──────────────────────────────
    const orderRes = await fetch(`${API_BASE}/api/payment/create-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount: getFinalAmount() }),
    });

    if (!orderRes.ok) {
      const errData = await orderRes.json();
      throw new Error(errData.error || 'Order create failed');
    }

    const order = await orderRes.json();
    console.log('✅ Razorpay order:', order.id);

    // ── Step 2: Web - Razorpay Checkout ─────────────────
    if (IS_WEB) {

      if (!window.Razorpay) {
        setLoading(false);
        return showAlert(t.setupError, t.razorpayLoadError);
      }

      setLoading(false);

      const options = {
        key:         'rzp_test_SiAe7LkcA4ax88',
        amount:      order.amount,
        currency:    'INR',
        name:        'Shahaji Travels',
        description: `${search.from} → ${search.to} · ${search.date}`,
        order_id:    order.id,

        prefill: {
          name:    passengerInfo.name    || user?.name  || '',
          email:   passengerInfo.email   || user?.email || '',
          contact: passengerInfo.phone   || user?.phone || '',
        },

        theme: { color: '#C0392B' },

        // ✅ Payment Success
        handler: async (response) => {
          setLoading(true);
          setLoadMsg(t.paymentVerify);

          try {
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify(response),
            });

            const verify = await verifyRes.json();

            if (verify.success) {
              doBooking(response.razorpay_payment_id);
            } else {
              setLoading(false);
              showAlert(t.paymentFailed, t.paymentNotVerified);
            }

          } catch (err) {
            setLoading(false);
            showAlert(t.paymentError, err.message);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            showAlert(t.paymentCancelled, t.paymentCancelledMsg);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        setLoading(false);
        showAlert(
          t.paymentFailed,
          `${response.error.description}\nReason: ${response.error.reason}`
        );
      });

      rzp.open();
      return;
    }

    // ── Mobile ────────────────────────────
    setLoading(false);
    showAlert(t.payment, t.mobilePaymentInfo);

  } catch (err) {
    setLoading(false);
    showAlert(t.paymentError, err?.message || t.paymentStartFail);
  }
};
const API_BASE = Platform.OS === "web"
  ? "https://shahaji-travels-backend.onrender.com"  // ✅ web la pan same
  : "https://shahaji-travels-backend.onrender.com"; // ✅ mobile la same
 const doBooking = async (razorpayPaymentId = null) => {
  setLoading(true); setLoadMsg(t.bookingSeats || "Booking...");
  
  // ✅ FIX: Validate passenger name FIRST before user check
  const passengerName = passengerInfo.name?.trim();
  if (!passengerName) {
    setLoading(false);
    showAlert("Error", "Please enter passenger name.");
    return;
  }
  
  if (!user?._id) {
    setLoading(false);
    showAlert("Error", "Please login first");
    return;
  }
  
  try {
    const data = {
      userId: user?._id || user?.id || "",
      customerName: passengerName,
      passengerName: passengerName,
      mobile: passengerInfo.phone,
      phone: passengerInfo.phone,
      email: passengerInfo.email || user?.email || "",
      bus: String(selectedBus._id || selectedBus.id || ""),
      busName: selectedBus.name || "",
      route: selectedBus.routeId || "",
      trip: selectedBus.tripId || "",
      journeyDate: search.date,
      date: search.date,
      boardingPoint: selectedBoarding?.name || "",
      droppingPoint: selectedDropping?.name || "",
      passengers: [{
        name: passengerName,
        age: Number(passengerInfo.age),
        gender: passengerInfo.gender,
        seatNumber: selectedSeats[0] || "",
        phone: passengerInfo.phone
      }],
      seatNumbers: selectedSeats,
      selectedSeats,
      baseAmount:  baseAmount,
amount:      getFinalAmount(),
totalAmount: getFinalAmount(),
      
      paymentMethod,
      paymentMode: paymentMethod,
      upiId: paymentMethod === "UPI" ? (passengerInfo.upiId || "") : undefined,
      upiApp: paymentMethod === "UPI" ? (passengerInfo.upiApp || "") : undefined,
      cardLast4: paymentMethod === "Card"
        ? (passengerInfo.cardNumber?.replace(/\s/g,"").slice(-4) || "")
        : undefined,
      cardName: paymentMethod === "Card" ? (passengerInfo.cardName || "") : undefined,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      razorpayPaymentId: razorpayPaymentId || null,
    };
    
    const res = await api.createBooking(data);
    const bookingId = res.bookingId || res.ticket?.bookingId || res.booking?.bookingCode;
    
    setTicket({
      ...data, ...(res.ticket || {}), bookingId,
      busName: selectedBus.name || selectedBus.busName || "Shahaji Travels",
      busType: selectedBus.type || selectedBus.busType || "AC Sleeper",
      selectedSeats,
      departure: selectedBus.departure,
      arrival: selectedBus.arrival,
      duration: selectedBus.duration,
      route: `${search.from} → ${search.to}`,
      date: search.date,
      amount: getFinalAmount(),
      paymentMode: paymentMethod,
    });
    
    setBookedSeats(prev => [...prev, ...selectedSeats]);
    setBookedSeatMap(prev => {
      const updated = { ...prev };
      selectedSeats.forEach(id => { updated[id] = seatGenderMap[id] || 'Male'; });
      return updated;
    });
    
    resetOtpState();
    setShowOtpModal(false);
    setShowConfirmModal(false);
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎫 Booking Confirmed!",
          body: `Seats: ${selectedSeats.join(", ")} | ₹${getFinalAmount()} | ${search.date}`,
          data: { screen: "ticket" },
        },
        trigger: null,
      });
    } catch (e) {}
    
    setScreen("ticket");
  } catch (err) {
    showAlert(t.bookingFailed || "Booking Failed", err?.message || "Could not complete.");
  } finally {
    setLoading(false);
  }
};

  const getDaysInMonth = (y,m) => new Date(y,m+1,0).getDate();
  const getFirstDay    = (y,m) => new Date(y,m,1).getDay();
  const handleCalDate  = (day) => { setSearch(p=>({...p,date:`${padTwo(day)}/${padTwo(calMonth+1)}/${calYear}`})); setShowCalendar(false); };
  const getFilteredBuses = () => busFilter==="All" ? buses : buses.filter(b=>(b.type||"").toLowerCase().includes(busFilter.toLowerCase()));

  const drawerItems = [
    { icon:"👤", label:t.myProfile||"My Profile",      action:()=>{ closeDrawer(); setTimeout(()=>setShowProfile(true),300); }},
   
    { icon:"🎫", label:t.myBookings||"My Bookings",     action:()=>{ closeDrawer(); setTimeout(()=>setShowMyBookings(true),300); }},
    { icon:"🏷️", label:t.offers||"Offers",              action:()=>{ closeDrawer(); setTimeout(()=>setShowOffers(true),300); }},
    { icon:"🔍", label:t.getTicket||"Get Ticket",       action:()=>{ closeDrawer(); setTimeout(()=>setShowGetTicket(true),300); }},
    { icon:"❌", label:t.cancelTicket||"Cancel Ticket", action:()=>{ closeDrawer(); setTimeout(()=>setShowCancelTicket(true),300); }},
    { icon:"📞", label:t.customerCare||"Customer Care", action:()=>{ closeDrawer(); setTimeout(()=>setShowCustomerCare(true),300); }},
   { icon:"📋", label:t.termsConditions||"Terms", action:()=>{ closeDrawer(); setTimeout(()=>setShowTerms(true), 300); }},
  ];

  // ============================================================
  // SPLASH
  // ============================================================
  if (screen==="splash") return (
    <View style={s.splashWrap}>
      <StatusBar barStyle="light-content" backgroundColor={C.red}/>
      <View style={s.splashLogo}>
        <View style={s.splashIconWrap}>
          <LogoImage width={88} height={88} borderRadius={14} />
        </View>
        <Text style={s.splashTitle}>SHAHAJI</Text>
        <Text style={s.splashTitleSub}>TRAVELS</Text>
        <Text style={s.splashSub}>Your Journey Begins Here</Text>
      </View>
      <View style={s.splashDots}>
        <ActivityIndicator color="rgba(255,255,255,0.8)" size="small"/>
      </View>
      <View style={{ position:"absolute", bottom:25, width:"100%", alignItems:"center", paddingHorizontal:20 }}>
        <Text style={{ color:"#fff", fontSize:15, fontWeight:"bold", textAlign:"center" }}>Developed by Digambar Barge</Text>
        <Text style={{ color:"#fff", fontSize:13, fontWeight:"bold", opacity:0.9, marginTop:2 }}>digubarge123@gmail.com</Text>
        <Text style={{ color:"#fff", fontSize:13, fontWeight:"bold", opacity:0.9 }}>9021694503</Text>
      </View>
    </View>
  );

  // ============================================================
  // LANGUAGE SELECT
  // ============================================================
  if (screen === "langSelect") return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <StatusBar barStyle="light-content" backgroundColor={C.red} />
    <CustomAlert {...alertState} onClose={hideAlert} />

    {/* ── Top red hero ── */}
    <View style={{
      backgroundColor: C.red,
      paddingTop: Platform.OS === "android" ? 36 : 50,
      paddingBottom: 40,
      alignItems: "center",
      paddingHorizontal: 24,
    }}>
      {/* Subtle circle decoration */}
      <View style={{
        position: "absolute", top: -30, right: -30,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.07)",
      }} />
      <View style={{
        position: "absolute", bottom: -20, left: -20,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.05)",
      }} />

      <View style={{
        width: 90, height: 90, borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center", alignItems: "center",
        marginBottom: 16, borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
      }}>
        <LogoImage width={72} height={72} borderRadius={16} />
      </View>

      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", letterSpacing: 0.3 }}>
        Shahaji Travels
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}>
        Premium Bus Booking
      </Text>
    </View>

    {/* ── White card section ── */}
   {/* ── White card section ── */}
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff", marginTop: -20 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Rounded top corners on ScrollView background */}
      <View style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 40,
        backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
      }} />

      <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 6 }}>
        Choose Language
      </Text>
      <Text style={{ fontSize: 13, color: C.textSub, marginBottom: 28 }}>
        भाषा निवडा · भाषा चुनें
      </Text>

      {[
        { key: "English", native: "English", sub: "English", abbr: "EN", color: "#E3F2FD", textColor: "#1565C0" },
        { key: "मराठी",   native: "मराठी",   sub: "Marathi", abbr: "MR", color: "#FFF3E0", textColor: "#E65100" },
        { key: "हिंदी",   native: "हिंदी",   sub: "Hindi",   abbr: "HI", color: "#F3E5F5", textColor: "#6A1B9A" },
      ].map(lang => {
        const isSelected = language === lang.key;
        return (
          <TouchableOpacity
            key={lang.key}
            onPress={() => setLanguage(lang.key)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row", alignItems: "center",
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? C.red : "#EFEFEF",
              borderRadius: 16, padding: 16, marginBottom: 12,
              backgroundColor: isSelected ? "#FFF5F5" : "#FAFAFA",
            }}
          >
            <View style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: isSelected ? C.redLight : lang.color,
              justifyContent: "center", alignItems: "center", marginRight: 14,
            }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: isSelected ? C.red : lang.textColor }}>
                {lang.abbr}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: isSelected ? C.red : C.text }}>
                {lang.native}
              </Text>
              <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{lang.sub}</Text>
            </View>
            {isSelected ? (
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.red, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>✓</Text>
              </View>
            ) : (
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#DDD", backgroundColor: "#fff" }} />
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={{ backgroundColor: C.red, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 12 }}
        activeOpacity={0.85}
        onPress={async () => {
          try { await AsyncStorage.setItem("@shahaji_language", language); } catch {}
          setScreen("auth");
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 }}>
          {translations[language]?.continueBtn || "Continue"} →
        </Text>
      </TouchableOpacity>

      <Text style={{ textAlign: "center", color: C.textSub, fontSize: 11, marginTop: 20 }}>
        You can change language anytime from settings
      </Text>

    </ScrollView>
  </SafeAreaView>
);

  // ============================================================
  // AUTH
  // ============================================================
  if (screen==="auth") return (
    <SafeAreaView style={{flex:1,backgroundColor:C.white}}>
      <StatusBar barStyle="light-content" backgroundColor={C.red}/>
      <LoadingOverlay visible={loading} message={loadMsg}/>
      <CustomAlert {...alertState} onClose={hideAlert}/>
      <View style={s.authHeader}>
  <View style={s.authHeaderIconWrap}>
    <LogoImage width={58} height={58} borderRadius={8} />
  </View>
  <Text style={s.authHeaderTitle}>Shahaji Travels</Text>
  <Text style={s.authHeaderSub}>Premium Bus Booking</Text>
  
  {/* ✅ ADD THIS */}
  <View style={s.devBadge}>
    <Text style={s.devBadgeText}>Developed by Mr. Digambar Barge</Text>
    <Text style={s.devBadgeContact}>📞 9021694503  ✉️ digubarge123@gmail.com</Text>
  </View>
</View>

      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
        <ScrollView contentContainerStyle={s.authScroll} keyboardShouldPersistTaps="handled">
          <View style={s.authTabs}>
            {["login","register"].map(m=>(
              <TouchableOpacity key={m} style={[s.authTab,authMode===m&&s.authTabActive]} onPress={()=>setAuthMode(m)}>
                <Text style={[s.authTabText,authMode===m&&s.authTabTextActive]}>{m==="login"?t.login:t.register}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {authMode==="login" && (
            <View style={s.authForm}>
              <Text style={s.authFormTitle}>{t.welcomeBack||"Welcome back 👋"}</Text>
              <Text style={s.authFormSub}>{t.loginSub||"Login to your account"}</Text>
              <Text style={s.authLabel}>{t.emailAddress||"Email"}</Text>
              <TextInput style={s.authInput} placeholder={t.emailPlaceholder||"you@email.com"} value={authForm.email}
                onChangeText={v=>setAuthForm(p=>({...p,email:v}))} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.textSub}/>
              <Text style={s.authLabel}>{t.password||"Password"}</Text>
              <View style={s.passRow}>
                <TextInput style={[s.authInput,{flex:1,marginBottom:0,borderRightWidth:0,borderTopRightRadius:0,borderBottomRightRadius:0}]}
                  placeholder={t.passwordPlaceholder||"••••••"} value={authForm.password}
                  onChangeText={v=>setAuthForm(p=>({...p,password:v}))} secureTextEntry={!showPass} placeholderTextColor={C.textSub}/>
                <TouchableOpacity style={s.eyeBtn} onPress={()=>setShowPass(p=>!p)}>
                  <Text style={{color:C.textMid,fontSize:F.lg}}>{showPass?"🙈":"👁"}</Text>
                </TouchableOpacity>
              </View>
              <PrimaryButton title={t.login||"Login"} onPress={handleLogin} style={{marginTop:20}}/>
              <TouchableOpacity onPress={()=>setAuthMode("register")} style={{marginTop:16,alignItems:"center"}}>
                <Text style={{color:C.textSub,fontSize:F.sm}}>{t.noAccount||"Don't have an account?"} <Text style={{color:C.red,fontWeight:"700"}}>{t.registerNow||"Register"}</Text></Text>
              </TouchableOpacity>
            </View>
          )}
          {authMode==="register" && (
            <View style={s.authForm}>
              <Text style={s.authFormTitle}>{t.createAccount||"Create Account"}</Text>
              {[
                {label:t.fullName||"Full Name",key:"name",placeholder:t.fullNamePlaceholder||"Your name",kbType:"default"},
                {label:t.mobileNumber||"Mobile",key:"phone",placeholder:t.mobilePlaceholder||"10-digit number",kbType:"phone-pad",maxLen:10},
                {label:t.emailAddress||"Email",key:"email",placeholder:t.emailPlaceholder||"you@email.com",kbType:"email-address",caps:"none"},
              ].map(f=>(
                <View key={f.key}>
                  <Text style={s.authLabel}>{f.label}</Text>
                  <TextInput style={s.authInput} placeholder={f.placeholder} value={authForm[f.key]}
                    onChangeText={v=>setAuthForm(p=>({...p,[f.key]:f.key==="phone"?v.replace(/\D/g,"").slice(0,10):v}))}
                    keyboardType={f.kbType} autoCapitalize={f.caps||"words"} maxLength={f.maxLen||100} placeholderTextColor={C.textSub}/>
                </View>
              ))}
              <Text style={s.authLabel}>{t.passwordMin||"Password (min 6 chars)"}</Text>
              <View style={s.passRow}>
                <TextInput style={[s.authInput,{flex:1,marginBottom:0,borderRightWidth:0,borderTopRightRadius:0,borderBottomRightRadius:0}]}
                  placeholder={t.passwordMinPlaceholder||"Min 6 characters"} value={authForm.password}
                  onChangeText={v=>setAuthForm(p=>({...p,password:v}))} secureTextEntry={!showPass} placeholderTextColor={C.textSub}/>
                <TouchableOpacity style={s.eyeBtn} onPress={()=>setShowPass(p=>!p)}>
                  <Text style={{color:C.textMid,fontSize:F.lg}}>{showPass?"🙈":"👁"}</Text>
                </TouchableOpacity>
              </View>
              <PrimaryButton title={t.register||"Create Account"} onPress={handleRegister} style={{marginTop:20}}/>
              <TouchableOpacity onPress={()=>setAuthMode("login")} style={{marginTop:16,alignItems:"center"}}>
                <Text style={{color:C.textSub,fontSize:F.sm}}>{t.alreadyAccount||"Already have an account?"} <Text style={{color:C.red,fontWeight:"700"}}>{t.loginNow||"Login"}</Text></Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ============================================================
  // HOME
  // ============================================================
 // ============================================================
// HOME SCREEN — Real API data (bookings + offers), white/red theme
// Replace the entire  if (screen==="home") { ... }  block
// ============================================================

if (screen === "home") {
  return (
    <>
      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => setShowTerms(false)}
      />
      <HomeScreen
        user={user}
        wallet={wallet}
        search={search}
        setSearch={setSearch}
        fromInput={fromInput}
        setFromInput={setFromInput}
        toInput={toInput}
        setToInput={setToInput}
        showFromSug={showFromSug}
        setShowFromSug={setShowFromSug}
        showToSug={showToSug}
        setShowToSug={setShowToSug}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        calYear={calYear}
        setCalYear={setCalYear}
        calMonth={calMonth}
        setCalMonth={setCalMonth}
        language={language}
        t={t}
        loading={loading}
        loadMsg={loadMsg}
        alertState={alertState}
        hideAlert={hideAlert}
        showProfile={showProfile} setShowProfile={setShowProfile}
       
        showMyBookings={showMyBookings} setShowMyBookings={setShowMyBookings}
        showOffers={showOffers} setShowOffers={setShowOffers}
        showGetTicket={showGetTicket} setShowGetTicket={setShowGetTicket}
        showCancelTicket={showCancelTicket} setShowCancelTicket={setShowCancelTicket}
        showCustomerCare={showCustomerCare} setShowCustomerCare={setShowCustomerCare}
        showLanguage={showLanguage} setShowLanguage={setShowLanguage}
        showLogout={showLogout} setShowLogout={setShowLogout}
        drawerOpen={drawerOpen}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        drawerAnim={drawerAnim}
        drawerItems={drawerItems}
        changeLanguage={changeLanguage}
        SUPPORTED_LANGUAGES={SUPPORTED_LANGUAGES}
        handleLogoutConfirm={handleLogoutConfirm}
        handleSearch={handleSearch}
        handleCalDate={handleCalDate}
        getDaysInMonth={getDaysInMonth}
        getFirstDay={getFirstDay}
        getTodayStr={getTodayStr}
        getDateOffset={getDateOffset}
        getDayName={getDayName}
        padTwo={padTwo}
        showAlert={showAlert}
        api={api}
        setScreen={setScreen}
        CITIES={CITIES}
      />
    </>
  );
}

  // ============================================================
  // BUS LIST
  // ============================================================
  if (screen==="buslist") {
   const filterOpts=["All","AC Sleeper","AC Seater-Sleeper"];
    const filtered=getFilteredBuses();
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <StatusBar barStyle="light-content" backgroundColor={C.red}/>
        <LoadingOverlay visible={loading} message={loadMsg}/>
        <CustomAlert {...alertState} onClose={hideAlert}/>
        <SectionHeader title={`${search.from} → ${search.to}`}
          subtitle={`${search.date} · ${filtered.length} ${t.busesFound||"buses found"}`}
          onBack={()=>setScreen("home")}/>
       <View style={busCard.filterRow}>
  {filterOpts.map(f => (
    <TouchableOpacity
      key={f}
      style={[
        busCard.filterBtn,
        busFilter === f && busCard.filterBtnActive
      ]}
      onPress={() => setBusFilter(f)}
    >
      <Text
        style={[
          busCard.filterText,
          busFilter === f && busCard.filterTextActive
        ]}
        numberOfLines={2}
      >
        {f}
      </Text>
    </TouchableOpacity>
  ))}
</View>
        <FlatList data={filtered} keyExtractor={(b,i)=>b.id||b._id||String(i)}
          contentContainerStyle={{padding:14,paddingBottom:30}}
          // REPLACE ListEmptyComponent inside buslist FlatList
ListEmptyComponent={
  <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 24 }}>
    <Text style={{ fontSize: 56, marginBottom: 12 }}>🚌</Text>
    <Text style={{
      fontSize: 18, fontWeight: "700", color: "#1C1C1E",
      textAlign: "center", marginBottom: 8,
    }}>
      Bus Not Found
    </Text>
    <Text style={{
      fontSize: 13, color: "#8E8E93", textAlign: "center", lineHeight: 20,
    }}>
      {`No buses available from\n${search.from} → ${search.to}\non ${search.date}`}
    </Text>
    <TouchableOpacity
      style={{
        marginTop: 20, backgroundColor: "#C0392B", borderRadius: 12,
        paddingHorizontal: 24, paddingVertical: 12,
      }}
      onPress={() => setScreen("home")}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
        ← Change Date / Route
      </Text>
    </TouchableOpacity>
  </View>
}
         renderItem={({item:bus})=>(
  <View style={busCard.wrap}>
    {/* ── Header ── */}
    <View style={busCard.header}>
      <View style={busCard.iconWrap}>
        <Text style={{fontSize:22}}>🚌</Text>
      </View>
      <View style={{flex:1,minWidth:0}}>
        <Text style={busCard.name} numberOfLines={2}>{bus.name}</Text>
        <View style={{flexDirection:"row",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap"}}>
          <View style={busCard.typeBadge}>
            <Text style={busCard.typeBadgeText}>{bus.type||"Bus"}</Text>
          </View>
         
        </View>
      </View>
      <View style={{alignItems:"flex-end",flexShrink:0}}>
        <Text style={busCard.price}>₹{bus.price||0}</Text>
        <Text style={{fontSize:11,color:"#aaa",marginTop:1}}>onwards</Text>
        {bus.availableSeats!=null&&(
          <View style={busCard.seatsBadge}>
            <Text style={busCard.seatsBadgeText}>{bus.availableSeats} left</Text>
          </View>
        )}
      </View>
    </View>

    {/* ── Time Strip ── */}
    <View style={busCard.timeStrip}>
      <View>
        <Text style={busCard.timeVal}>{bus.departure||"--:--"}</Text>
        <Text style={busCard.timeCity}>{bus.from||search.from}</Text>
        <Text style={busCard.timeLabel}>Departure</Text>
      </View>
      <View style={{flex:1,alignItems:"center",paddingHorizontal:8}}>
        {bus.duration&&<Text style={{fontSize:11,color:"#999",fontWeight:"600",marginBottom:3}}>{bus.duration}</Text>}
        <View style={{flexDirection:"row",alignItems:"center",width:"100%"}}>
          <View style={{width:5,height:5,borderRadius:3,backgroundColor:C.red}}/>
          <View style={{flex:1,height:1.5,backgroundColor:"#E0E0E0"}}/>
          <Text style={{fontSize:14}}>🚌</Text>
          <View style={{flex:1,height:1.5,backgroundColor:"#E0E0E0"}}/>
          <View style={{width:5,height:5,borderRadius:3,backgroundColor:C.red}}/>
        </View>
      </View>
      <View style={{alignItems:"flex-end"}}>
        <Text style={busCard.timeVal}>{bus.arrival||"--:--"}</Text>
        <Text style={busCard.timeCity}>{bus.to||search.to}</Text>
        <Text style={busCard.timeLabel}>Arrival</Text>
      </View>
    </View>

    {/* ── Amenities ── */}
    {(bus.amenities||[]).length>0&&(
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:6,paddingHorizontal:14,paddingTop:10}}>
        {(bus.amenities||[]).slice(0,4).map(a=>(
          <View key={a} style={{backgroundColor:"#F2F2F7",borderRadius:6,paddingHorizontal:8,paddingVertical:3}}>
            <Text style={{fontSize:11,color:"#555",fontWeight:"500"}}>{a}</Text>
          </View>
        ))}
      </View>
    )}

    {/* ── Buttons ── */}
    <View style={busCard.footer}>
      <TouchableOpacity style={busCard.detailBtn}
        onPress={()=>{setDetailBus(bus);setShowBusDetail(true);}}>
        <Text style={busCard.detailBtnText}>Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={busCard.bookBtn}
        onPress={()=>handleSelectBus(bus)}>
        <Text style={busCard.bookBtnText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
        />
        <Modal visible={showBusDetail} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalBox,{maxHeight:"90%",padding:0,overflow:"hidden"}]}>
              <View style={[s.ticketCardHead,{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:16,paddingVertical:16}]}>
                <View>
                  <Text style={[s.ticketCardTitle,{fontSize:F.lg}]}>{detailBus?.name}</Text>
                  <Text style={s.ticketCardSub}>{detailBus?.type}</Text>
                </View>
                <TouchableOpacity onPress={()=>setShowBusDetail(false)} style={s.modalCloseBtn}>
                  <Text style={{color:C.white,fontSize:18,fontWeight:"700"}}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{padding:16}}>
                <View style={s.detailTimeCard}>
                  <Text style={s.detailTimeCardTitle}>Journey Timing</Text>
                  <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:12}}>
                    <View style={s.detailTimeCell}>
                      <Text style={s.detailTimeCellLabel}>🟢 Departure</Text>
                      <Text style={s.detailTimeCellTime}>{detailBus?.departure||"--:--"}</Text>
                      <Text style={s.detailTimeCellCity}>{search.from}</Text>
                    </View>
                    <View style={{alignItems:"center",justifyContent:"center"}}>
                      {detailBus?.duration&&<Text style={s.detailDuration}>{detailBus.duration}</Text>}
                      <Text style={{fontSize:20,color:C.red}}>→</Text>
                    </View>
                    <View style={[s.detailTimeCell,{alignItems:"flex-end"}]}>
                      <Text style={s.detailTimeCellLabel}>🔴 Arrival</Text>
                      <Text style={s.detailTimeCellTime}>{detailBus?.arrival||"--:--"}</Text>
                      <Text style={s.detailTimeCellCity}>{search.to}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.detailPriceCard}>
                  <Text style={s.detailPriceLabel}>Fare</Text>
                  <Text style={s.detailPriceValue}>₹{detailBus?.price||0}</Text>
                  <Text style={s.detailPriceSub}>per seat onwards</Text>
                </View>
                <PrimaryButton title={`Book Now · ₹${detailBus?.price||0}`}
                  onPress={()=>handleSelectBus(detailBus)} style={{marginTop:20}}/>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ============================================================
  // BOOKING
  // ============================================================
  if (screen==="booking") {
    const tabLabels=[t.selectSeats||"Seats",t.boarding||"Boarding",t.dropping||"Dropping",t.passenger||"Passenger"];
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <StatusBar barStyle="light-content" backgroundColor={C.red}/>
        <LoadingOverlay visible={loading} message={loadMsg}/>
        <CustomAlert {...alertState} onClose={hideAlert}/>
        <GenderPickerModal visible={genderPicker.visible} seatId={genderPicker.seatId}
          onSelect={handleGenderSelect} onCancel={()=>setGenderPicker({visible:false,seatId:null})} t={t}/>
        <OtpVerifyModal
  visible={showOtpModal}
  phone={passengerInfo.phone}
  otpValue={otpValue}
  setOtpValue={setOtpValue}
  otpVerifying={otpVerifying}
  otpSending={otpSending}
  otpResendTimer={otpResendTimer}
 onVerify={async () => {
  if (!otpValue || otpValue.length < 6)
    return showAlert("OTP Error", "6 अंकी OTP enter करा.");
  setOtpVerifying(true);
  try {
    await verifyOtp(otpValue, passengerInfo.phone);
    setOtpVerifying(false);
    setShowOtpModal(false);

    // ✅ Cash → Confirm Modal, Online → Razorpay
    if (paymentMethod === "Cash") {
      setShowConfirmModal(true);
    } else {
      handleRazorpayPayment();
    }
  } catch (err) {
    setOtpVerifying(false);
    showAlert("❌ OTP चुकीचा", err?.message || "Invalid OTP.");
  }
}}
  onResend={async () => {
    if (otpResendTimer > 0) return;
    setOtpSending(true);
    try {
      await sendOtp(passengerInfo.phone);
      setOtpSending(false);
      startOtpTimer();
    } catch (err) {
      setOtpSending(false);
      showAlert("Error", err?.message || "Resend failed.");
    }
  }}
  onCancel={() => { setShowOtpModal(false); resetOtpState(); }}
/>
{/* ─── QR PAYMENT MODAL ─────────────────────────────────── */}
{/* ─── QR PAYMENT MODAL ─────────────────────────────────── */}
{/* ─── QR PAYMENT MODAL — Modern 2025 ── */}
<Modal visible={showQRModal} transparent animationType="slide">
  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
    <View style={{
      backgroundColor: "#F5F6FA",
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      maxHeight: "96%",
      overflow: "hidden",
    }}>

      {/* ── TOP HANDLE ── */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#DDD" }} />
      </View>

      {/* ── HEADER ── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: "#F5F6FA",
        borderBottomWidth: 1, borderBottomColor: "#EBEBEB",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.4 }}>
            UPI Payment
          </Text>
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Scan · Pay · Confirm
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowQRModal(false)}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#EBEBEB",
            justifyContent: "center", alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: "#555", fontWeight: "700" }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── AMOUNT HERO CARD ── */}
        <View style={{
          backgroundColor: "#1A1A2E",
          borderRadius: 20, padding: 20,
          marginBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Background decoration */}
          <View style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.04)",
          }} />
          <View style={{
            position: "absolute", bottom: -20, left: 60,
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.03)",
          }} />

          <View>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Total to Pay
            </Text>
            <Text style={{ fontSize: 38, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 }}>
              ₹{getFinalAmount()}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} · {search.date}
            </Text>
          </View>

          {/* Route pill */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 14, padding: 14,
            alignItems: "center",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
          }}>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "700", letterSpacing: 1 }}>ROUTE</Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff", marginTop: 4 }}>{search.from}</Text>
            <Text style={{ fontSize: 16, color: "#C0392B", marginVertical: 1 }}>↓</Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{search.to}</Text>
          </View>
        </View>

        {/* ── QR CODE CARD ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 20,
          marginBottom: 14,
          alignItems: "center",
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 2,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1A1A2E", marginBottom: 16, letterSpacing: -0.2 }}>
            Scan with any UPI app
          </Text>

          {qrSettings?.qrImageBase64 ? (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: "#FFFFFF",
              borderWidth: 3,
              borderColor: "#1A1A2E",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${qrSettings.qrImageBase64}` }}
                style={{ width: 190, height: 190, borderRadius: 8 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={{
              width: 190, height: 190,
              backgroundColor: "#F8F9FA",
              borderRadius: 16,
              justifyContent: "center", alignItems: "center",
              borderWidth: 2, borderColor: "#E5E5E5", borderStyle: "dashed",
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📱</Text>
              <Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>QR not available</Text>
            </View>
          )}

          {/* Amount below QR */}
          <View style={{
            marginTop: 14, backgroundColor: "#F5F6FA",
            borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#C0392B", textAlign: "center" }}>
              ₹{getFinalAmount()}
            </Text>
          </View>

          {/* UPI ID row */}
          <View style={{
            marginTop: 14, width: "100%",
            backgroundColor: "#F5F6FA",
            borderRadius: 12, padding: 14,
            flexDirection: "row", alignItems: "center", gap: 12,
            borderWidth: 1, borderColor: "#EBEBEB",
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "#1A1A2E",
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>@</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: "#999", fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>UPI ID</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#1A1A2E", marginTop: 1 }}>
                {qrSettings?.upiId || "kavirajbarge@ybl"}
              </Text>
              <Text style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                {qrSettings?.upiName || "KAVIRAJ KRISHNAT BARGE"}
              </Text>
            </View>
          </View>
        </View>

        
{/* ── OPEN DIRECTLY IN APP ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 16,
          marginBottom: 14,
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 4, letterSpacing: -0.2 }}>
            Open Directly in App
          </Text>
          <Text style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>
            ₹{getFinalAmount()} auto-filled · Pay करा · UTR enter करा
          </Text>
          <View style={{ gap: 8 }}>
            {[
              {
                name: "Google Pay",
                bg: "#FFFFFF", border: "#E8E8E8", btnBg: "#4285F4",
                icon: () => (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#E8E8E8", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#4285F4" }}>G</Text>
                  </View>
                ),
                getUrl: (base) => {
                  if (IS_WEB) return `tez://upi/pay?${base}`;
                  if (Platform.OS === "ios") return `gpay://upi/pay?${base}`;
                  return `intent://upi/pay?${base}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
                },
              },
              {
                name: "PhonePe",
                bg: "#F8F0FF", border: "#E8D5FF", btnBg: "#5F259F",
                icon: () => (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#5F259F", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: "#fff", justifyContent: "center", alignItems: "center" }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" }} />
                    </View>
                  </View>
                ),
                getUrl: (base) => {
                  if (IS_WEB) return `phonepe://pay?${base}`;
                  if (Platform.OS === "ios") return `phonepe://pay?${base}`;
                  return `intent://upi/pay?${base}#Intent;scheme=upi;package=com.phonepe.app;end`;
                },
              },
              {
                name: "Paytm",
                bg: "#F0FBFF", border: "#BAE6FD", btnBg: "#00BAF2",
                icon: () => (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#00BAF2", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontWeight: "900", color: "#fff" }}>Pay</Text>
                    <Text style={{ fontSize: 8, fontWeight: "800", color: "#002970", marginTop: -2 }}>tm</Text>
                  </View>
                ),
                getUrl: (base) => {
                  if (IS_WEB) return `paytmmp://pay?${base}`;
                  if (Platform.OS === "ios") return `paytmmp://pay?${base}`;
                  return `intent://upi/pay?${base}#Intent;scheme=upi;package=net.one97.paytm;end`;
                },
              },
              {
                name: "Any UPI App",
                bg: "#FFF5F5", border: "#FFD0D0", btnBg: "#C0392B",
                icon: () => (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#C0392B", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 20 }}>📲</Text>
                  </View>
                ),
                getUrl: (base) => `upi://pay?${base}`,
              },
            ].map((app, i) => {
              const upiBase = `pa=${qrSettings?.upiId || "kavirajbarge@ybl"}&pn=${encodeURIComponent(qrSettings?.upiName || "Shahaji Travels")}&am=${getFinalAmount()}&cu=INR&tn=${encodeURIComponent("Shahaji Travels Booking")}`;
              const url = app.getUrl(upiBase);
              return (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: app.bg, borderRadius: 14,
                    padding: 12, borderWidth: 1.5, borderColor: app.border,
                    gap: 12, marginBottom: 4,
                  }}
                  activeOpacity={0.75}
                 onPress={async () => {
  const amt = getFinalAmount();
  const upiStr = `upi://pay?pa=${qrSettings?.upiId || "kavirajbarge@ybl"}&pn=${encodeURIComponent(qrSettings?.upiName || "Shahaji Travels")}&am=${amt}&cu=INR&tn=${encodeURIComponent("Shahaji Travels Booking")}`;
  try {
    await Linking.openURL(upiStr);
  } catch {
    showAlert("Cannot Open", `UPI app manually open करा\n₹${amt} pay करा\nUPI ID: ${qrSettings?.upiId || "kavirajbarge@ybl"}`);
  }
}}
                >
                  {app.icon()}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>{app.name}</Text>
                    <Text style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                      ₹{getFinalAmount()} · auto-filled
                    </Text>
                  </View>
                  <View style={{ backgroundColor: app.btnBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>Open →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ marginTop: 8, backgroundColor: "#F5F6FA", borderRadius: 10, padding: 10, flexDirection: "row", gap: 6 }}>
            <Text style={{ fontSize: 12 }}>💡</Text>
            <Text style={{ fontSize: 12, color: "#666", flex: 1, lineHeight: 18 }}>
              Pay केल्यावर UTR / Transaction ID खाली enter करा — booking confirm होईल.
            </Text>
          </View>
        </View>

        {/* ── HOW TO PAY — Steps ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 16,
          marginBottom: 14,
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 14, letterSpacing: -0.2 }}>
            How to Pay
          </Text>
        

        
          {[
            { n: "1", text: "Open GPay / PhonePe / Paytm" },
            { n: "2", text: "Scan QR code or enter UPI ID" },
            { n: "3", text: `Enter amount ₹${getFinalAmount()}` },
            { n: "4", text: "Complete payment & note UTR number" },
            { n: "5", text: "Enter UTR below to confirm booking" },
          ].map((step, i) => (
            <View key={i} style={{
              flexDirection: "row", gap: 12,
              marginBottom: i < 4 ? 12 : 0,
              alignItems: "flex-start",
            }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: "#1A1A2E",
                justifyContent: "center", alignItems: "center", flexShrink: 0,
              }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{step.n}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#444", lineHeight: 22, flex: 1, marginTop: 3 }}>
                {step.text}
              </Text>
            </View>
          ))}
        </View>

        {/* ── UTR INPUT ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 16,
          marginBottom: 14,
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 2, letterSpacing: -0.2 }}>
            Enter UTR / Transaction ID
          </Text>
          <Text style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>
            Found in your UPI app's payment history
          </Text>

          <View style={{
            flexDirection: "row",
            borderWidth: 2,
            borderColor: qrUtrNumber.length >= 6 ? "#1A1A2E" : "#EBEBEB",
            borderRadius: 14, overflow: "hidden",
            backgroundColor: "#F5F6FA",
            transition: "border-color 0.2s",
          }}>
            <View style={{
              paddingHorizontal: 14, justifyContent: "center",
              backgroundColor: qrUtrNumber.length >= 6 ? "#1A1A2E" : "#EBEBEB",
            }}>
              <Text style={{ fontSize: 14, color: qrUtrNumber.length >= 6 ? "#fff" : "#999" }}>🔢</Text>
            </View>
            <TextInput
              style={{
                flex: 1, paddingHorizontal: 14, paddingVertical: 15,
                fontSize: 16, color: "#1A1A2E",
                fontWeight: "700", letterSpacing: 1.5,
                backgroundColor: "#FFFFFF",
              }}
              placeholder="e.g. 407311234567"
              placeholderTextColor="#C7C7CC"
              value={qrUtrNumber}
              onChangeText={setQrUtrNumber}
              keyboardType="default"
              maxLength={30}
              autoCapitalize="characters"
            />
            {qrUtrNumber.length >= 6 && (
              <View style={{
                paddingHorizontal: 14, justifyContent: "center",
                backgroundColor: "#EAFAF1",
              }}>
                <Text style={{ color: "#27AE60", fontWeight: "800", fontSize: 16 }}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── CONFIRM BUTTON ── */}
        <TouchableOpacity
          style={{
            backgroundColor: qrUtrNumber.trim().length >= 6 ? "#1A1A2E" : "#EBEBEB",
            borderRadius: 16, paddingVertical: 18,
            alignItems: "center", marginBottom: 10,
            elevation: qrUtrNumber.trim().length >= 6 ? 3 : 0,
          }}
          onPress={handleQRBooking}
          disabled={qrUtrNumber.trim().length < 6}
          activeOpacity={0.85}
        >
          <Text style={{
            color: qrUtrNumber.trim().length >= 6 ? "#fff" : "#aaa",
            fontSize: 15, fontWeight: "800", letterSpacing: 0.3,
          }}>
            {qrUtrNumber.trim().length >= 6 ? "✓  Confirm & Submit Booking" : "Enter UTR to Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: "center", paddingVertical: 12 }}
          onPress={() => setShowQRModal(false)}
        >
          <Text style={{ color: "#999", fontWeight: "600", fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>

        {/* ── WARNING ── */}
        <View style={{
          backgroundColor: "#FFF8E1",
          borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: "#FFE082",
          flexDirection: "row", gap: 10, alignItems: "flex-start",
        }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: "#795548", lineHeight: 19, flex: 1 }}>
            Admin will verify your payment within 15–30 minutes. Incorrect UTR will result in cancellation.
          </Text>
        </View>

      </ScrollView>
    </View>
  </View>
</Modal>
        <ConfirmBookingModal
          visible={showConfirmModal}
          onCancel={()=>setShowConfirmModal(false)}
          onConfirm={()=>{ setShowConfirmModal(false); doBooking(); }}
          selectedSeats={selectedSeats} getFinalAmount={getFinalAmount}
          paymentMethod={paymentMethod} selectedBus={selectedBus}
          passengerInfo={passengerInfo} selectedBoarding={selectedBoarding}
          selectedDropping={selectedDropping} search={search} seatGenderMap={seatGenderMap}
        />
        <SectionHeader title={selectedBus?.name||"Book Ticket"}
          subtitle={`${search.from} → ${search.to} · ${search.date}`} onBack={()=>setScreen("buslist")}/>
        <View style={s.bookingTimeStrip}>
          <Text style={s.bookingTimeItem}>🟢 {selectedBus?.departure||"--:--"}</Text>
          <Text style={s.bookingTimeSep}>——→</Text>
          <Text style={s.bookingTimeItem}>🔴 {selectedBus?.arrival||"--:--"}</Text>
          {selectedBus?.duration&&<Text style={s.bookingTimeDur}>· {selectedBus.duration}</Text>}
        </View>
        <View style={s.bookingTabs}>
          {tabLabels.map((label,i)=>(
            <TouchableOpacity key={i} style={[s.bookingTab,bookingTab===i&&s.bookingTabActive]} onPress={()=>setBookingTab(i)}>
              <View style={[s.bookingTabNum,bookingTab===i&&s.bookingTabNumActive]}>
                <Text style={[s.bookingTabNumText,bookingTab===i&&{color:C.white}]}>{i+1}</Text>
              </View>
              <Text style={[s.bookingTabText,bookingTab===i&&s.bookingTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {bookingTab===0&&(
          <ScrollView contentContainerStyle={{paddingBottom:30}}>
            <View style={s.seatScreenHeader}>
              <Text style={s.seatScreenTitle}>{t.selectSeats||"Select Seats"}</Text>
              <TouchableOpacity style={s.seatInfoBtn} onPress={()=>setShowSeatInfo(true)}>
                <Text style={{fontSize:14,color:C.blue}}>Guide</Text>
              </TouchableOpacity>
            </View>
            {(selectedBus?.type||"").toLowerCase().includes("ac sleeper") && !(selectedBus?.type||"").toLowerCase().includes("seater") ? (
              <SleeperDeckSection
  leftLower={SLEEPER_LEFT} leftUpper={SLEEPER_LEFT_UPPER}
  rightLower={SLEEPER_RIGHT} rightUpper={SLEEPER_RIGHT_UPPER}
  bookedSeats={bookedSeats} selectedSeats={selectedSeats} onToggle={toggleSeat}
  seatPrice={Number(selectedBus?.sleeperPrice)||Number(selectedBus?.price)||0}
  seatGenderMap={{...bookedSeatMap,...seatGenderMap}}
  blockedSeats={(selectedBus?.blockedSeats || []).map(String)}
/>
            ) : (
               <View style={{ flexDirection:"row", paddingHorizontal:10, paddingVertical:8, gap:10, alignItems:"flex-start" }}>
                <View style={{flex:1,minWidth:0}}>
                
<DeckSection
  title="Lower Deck"
  isSleeper={false}
  seatPrice={Number(selectedBus?.seaterPrice) || Number(selectedBus?.price) || 0}
  sleeperPrice={Number(selectedBus?.sleeperPrice) || Number(selectedBus?.price) || 0}
  availCount={LOWER_SEATS.flat().filter(id =>
    id && id !== "" &&
    !bookedSeats.includes(id) &&
    !selectedSeats.includes(id) &&
    !(selectedBus?.blockedSeats || []).includes(String(id))
  ).length}
  seats={LOWER_SEATS}
  bookedSeats={bookedSeats}
  selectedSeats={selectedSeats}
  blockedSeats={selectedBus?.blockedSeats || []}
  onToggle={toggleSeat}
  seatGenderMap={{ ...bookedSeatMap, ...seatGenderMap }}
/>


                </View>
                <View style={{flex:1,minWidth:0}}>
                  <DeckSection title="Upper Deck (Sleeper)" isSleeper={true}
                    seatPrice={Number(selectedBus?.seaterPrice)||Number(selectedBus?.price)||0}
                    sleeperPrice={Number(selectedBus?.sleeperPrice)||Number(selectedBus?.price)||0}
                    availCount={UPPER_SEATS.flat().filter(id=>id&&id!==""&&!bookedSeats.includes(id)&&!selectedSeats.includes(id)).length}
                    seats={UPPER_SEATS} bookedSeats={bookedSeats} selectedSeats={selectedSeats}
                    blockedSeats={selectedBus?.blockedSeats || []}
  onToggle={toggleSeat}
  seatGenderMap={{ ...bookedSeatMap, ...seatGenderMap }}
                    />
                </View>
              </View>
            )}
            {selectedSeats.length>0&&(
              <View style={s.selectedSummary}>
                <Text style={s.selectedSummaryTitle}>{selectedBus?.name}</Text>
                <Text style={s.selectedSummarySeats}>
                  {t.selected||"Selected"}: {selectedSeats.map(id=>`${id}(${seatGenderMap[id]?.[0]||"?"})`).join(", ")}
                </Text>
                <Text style={s.selectedSummaryAmount}>₹{getTotalAmount()}</Text>
                <PrimaryButton title={`Continue with ${selectedSeats.length} seat${selectedSeats.length>1?"s":""} →`}
                  onPress={()=>setBookingTab(1)} style={{marginTop:12}}/>
              </View>
            )}
          </ScrollView>
        )}

        {bookingTab===1&&(
          <ScrollView contentContainerStyle={{padding:14,paddingBottom:30}}>
            <Text style={s.pointsTitle}>{t.selectBoardingPoint||"Select Boarding Point"}</Text>
            <Text style={s.pointsSubTitle}>{search.from}</Text>
            {boardingPoints.length===0
              ? <View style={s.noPointsBox}><Text style={s.noPointsIcon}>📍</Text><Text style={s.noPointsText}>{t.noBoarding||"No boarding points available."}</Text></View>
              : boardingPoints.map((pt,i)=>(
                <TouchableOpacity key={pt.id||i} style={[s.pointCard,selectedBoarding?.id===pt.id&&s.pointCardSelected]} onPress={()=>setSelectedBoarding(pt)}>
                  <View style={{flexDirection:"row",alignItems:"center"}}>
                    <View style={[s.pointRadio,selectedBoarding?.id===pt.id&&s.pointRadioSelected]}/>
                    <View style={{flex:1,marginLeft:12}}>
                      <Text style={s.pointName}>{pt.name}</Text>
                      {pt.address?<Text style={s.pointAddress}>{pt.address}</Text>:null}
                    </View>
                    {pt.time?<Text style={s.pointTime}>{pt.time}</Text>:null}

                  </View>
                </TouchableOpacity>
              ))}
            <PrimaryButton title="Continue →" disabled={!selectedBoarding}
              onPress={()=>{if(!selectedBoarding)return;setBookingTab(2);}} style={{marginTop:16}}/>
          </ScrollView>
        )}

        {bookingTab===2&&(
          <ScrollView contentContainerStyle={{padding:14,paddingBottom:30}}>
            <Text style={s.pointsTitle}>{t.selectDroppingPoint||"Select Dropping Point"}</Text>
            <Text style={s.pointsSubTitle}>{search.to}</Text>
            {droppingPoints.length===0
              ? <View style={s.noPointsBox}><Text style={s.noPointsIcon}>📍</Text><Text style={s.noPointsText}>{t.noDropping||"No dropping points available."}</Text></View>
              : droppingPoints.map((pt,i)=>(
                <TouchableOpacity key={pt.id||i} style={[s.pointCard,selectedDropping?.id===pt.id&&s.pointCardSelected]} onPress={()=>setSelectedDropping(pt)}>
                  <View style={{flexDirection:"row",alignItems:"center"}}>
                    <View style={[s.pointRadio,selectedDropping?.id===pt.id&&s.pointRadioSelected]}/>
                    <View style={{flex:1,marginLeft:12}}>
                      <Text style={s.pointName}>{pt.name}</Text>
                      {pt.address?<Text style={s.pointAddress}>{pt.address}</Text>:null}
                    </View>
                    {pt.time?<Text style={s.pointTime}>{pt.time}</Text>:null}
                  </View>
                </TouchableOpacity>
              ))}
            <PrimaryButton title="Continue →" disabled={!selectedDropping}
              onPress={()=>{ if(!selectedDropping){showAlert("Error","Please select a dropping point.");return;} setBookingTab(3); }}
              style={{marginTop:16}}/>
          </ScrollView>
        )}

    
{bookingTab===3&&(
  <>
    {/* ── Trip Details Modal ── */}
    <Modal visible={tripDetailsVisible} transparent animationType="slide">
      <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.55)",justifyContent:"flex-end"}}>
        <View style={{backgroundColor:"#fff",borderTopLeftRadius:24,borderTopRightRadius:24,paddingBottom:36}}>
          <View style={{backgroundColor:C.red,borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <Text style={{color:"#fff",fontSize:16,fontWeight:"700"}}>{"🚌 Trip Details"}</Text>
            <TouchableOpacity onPress={()=>setTripDetailsVisible(false)} style={{width:30,height:30,borderRadius:15,backgroundColor:"rgba(255,255,255,0.2)",justifyContent:"center",alignItems:"center"}}>
              <Text style={{color:"#fff",fontWeight:"700",fontSize:16}}>{"✕"}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding:18}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:"#FFF5F5",borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:"#FFE0E0"}}>
              <View>
                <Text style={{fontSize:10,color:C.red,fontWeight:"700",letterSpacing:1}}>{"FROM"}</Text>
                <Text style={{fontSize:22,fontWeight:"800",color:"#1C1C1E",marginTop:2}}>{search?.from}</Text>
                <Text style={{fontSize:11,color:"#888",marginTop:2}}>{selectedBoarding?.name||"—"}</Text>
              </View>
              <Text style={{fontSize:24}}>{"→"}</Text>
              <View style={{alignItems:"flex-end"}}>
                <Text style={{fontSize:10,color:C.red,fontWeight:"700",letterSpacing:1}}>{"TO"}</Text>
                <Text style={{fontSize:22,fontWeight:"800",color:"#1C1C1E",marginTop:2}}>{search?.to}</Text>
                <Text style={{fontSize:11,color:"#888",marginTop:2}}>{selectedDropping?.name||"—"}</Text>
              </View>
            </View>
            <View style={{flexDirection:"row",gap:10,marginBottom:12}}>
              <View style={{flex:1,backgroundColor:"#F2F2F7",borderRadius:12,padding:14}}>
                <Text style={{fontSize:10,color:"#888",fontWeight:"600"}}>{"DEPARTURE"}</Text>
                <Text style={{fontSize:22,fontWeight:"800",color:"#1C1C1E",marginTop:4}}>{selectedBus?.departure||"--:--"}</Text>
                <Text style={{fontSize:11,color:"#888",marginTop:2}}>{search?.date}</Text>
              </View>
              <View style={{flex:1,backgroundColor:"#F2F2F7",borderRadius:12,padding:14,alignItems:"flex-end"}}>
                <Text style={{fontSize:10,color:"#888",fontWeight:"600"}}>{"ARRIVAL"}</Text>
                <Text style={{fontSize:22,fontWeight:"800",color:"#1C1C1E",marginTop:4}}>{selectedBus?.arrival||"--:--"}</Text>
                <Text style={{fontSize:11,color:"#888",marginTop:2}}>{search?.date}</Text>
              </View>
            </View>
            {[
              ["🚌 Bus Name",   selectedBus?.name||"—"],
              ["🏷 Bus Type",   selectedBus?.type||"—"],
              ["🔢 Bus Number", selectedBus?.number||selectedBus?.busNumber||selectedBus?.numberPlate||"—"],
             
              ["💺 Seats",      selectedSeats?.join(", ")||"—"],
              ["💰 Total Fare", "₹"+getFinalAmount()],
              ["💳 Payment",    paymentMethod||"—"],
            ].map(([label,value])=>(
              <View key={label} style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:11,borderBottomWidth:0.5,borderBottomColor:"#F0F0F0"}}>
                <Text style={{fontSize:13,color:"#666"}}>{label}</Text>
                <Text style={{fontSize:13,fontWeight:"700",color:"#1C1C1E",maxWidth:"55%",textAlign:"right"}}>{value}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={{backgroundColor:C.red,borderRadius:14,margin:16,paddingVertical:15,alignItems:"center"}} onPress={()=>setTripDetailsVisible(false)}>
            <Text style={{color:"#fff",fontWeight:"700",fontSize:15}}>{"Close"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* ── Edit Contact Modal ── */}
    <Modal visible={editContactVisible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.55)",justifyContent:"flex-end"}}>
          <View style={{backgroundColor:"#fff",borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:40}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <Text style={{fontSize:18,fontWeight:"700",color:"#1C1C1E"}}>{"✏️ Edit Contact"}</Text>
              <TouchableOpacity onPress={()=>setEditContactVisible(false)}>
                <Text style={{color:"#888",fontSize:16}}>{"✕"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{fontSize:12,fontWeight:"600",color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{"Mobile Number"}</Text>
            <View style={{flexDirection:"row",borderWidth:1.5,borderColor:"#E0E0E0",borderRadius:12,marginBottom:16,overflow:"hidden"}}>
              <View style={{backgroundColor:"#F5F5F5",paddingHorizontal:12,justifyContent:"center"}}>
                <Text style={{fontSize:14,color:"#555",fontWeight:"600"}}>{"+"+"91"}</Text>
              </View>
              <TextInput
                style={{flex:1,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:"#1C1C1E"}}
                value={passengerInfo.phone||""}
                onChangeText={v=>setPassengerInfo(p=>({...p,phone:v.replace(/\D/g,"").slice(0,10)}))}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit number"
                placeholderTextColor="#aaa"
              />
            </View>
            <Text style={{fontSize:12,fontWeight:"600",color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{"Email Address"}</Text>
            <TextInput
              style={{borderWidth:1.5,borderColor:"#E0E0E0",borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:"#1C1C1E",marginBottom:24}}
              value={passengerInfo.email||""}
              onChangeText={v=>setPassengerInfo(p=>({...p,email:v}))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={{backgroundColor:C.red,borderRadius:14,paddingVertical:16,alignItems:"center"}}
              onPress={()=>setEditContactVisible(false)}
            >
              <Text style={{color:"#fff",fontWeight:"700",fontSize:15}}>{"Save Changes ✓"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── Add Passenger Modal ── */}
    <Modal visible={addPassengerVisible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.55)",justifyContent:"flex-end"}}>
          <View style={{backgroundColor:"#fff",borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:40}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <Text style={{fontSize:18,fontWeight:"700",color:"#1C1C1E"}}>{"👤 Add Passenger"}</Text>
              <TouchableOpacity onPress={()=>setAddPassengerVisible(false)}>
                <Text style={{color:"#888",fontSize:16}}>{"✕"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{fontSize:12,color:"#888",marginBottom:20}}>
              {"Seat: "}
              <Text style={{color:C.red,fontWeight:"700"}}>{selectedSeats?.[passengers.length]||"—"}</Text>
            </Text>
            <Text style={{fontSize:12,fontWeight:"600",color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{"Full Name *"}</Text>
            <TextInput
              style={{borderWidth:1.5,borderColor:"#E0E0E0",borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:"#1C1C1E",marginBottom:16}}
              value={newPassForm.name}
              onChangeText={v=>setNewPassForm(p=>({...p,name:v}))}
              placeholder="Passenger full name"
              placeholderTextColor="#aaa"
            />
            <View style={{flexDirection:"row",gap:12,marginBottom:20}}>
              <View style={{flex:1}}>
                <Text style={{fontSize:12,fontWeight:"600",color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{"Age *"}</Text>
                <TextInput
                  style={{borderWidth:1.5,borderColor:"#E0E0E0",borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:"#1C1C1E",textAlign:"center"}}
                  value={newPassForm.age}
                  onChangeText={v=>setNewPassForm(p=>({...p,age:v.replace(/\D/g,"")}))}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="Age"
                  placeholderTextColor="#aaa"
                />
              </View>
              {/* Phone input in passenger section */}
                <View style={{marginTop:8,borderWidth:0.5,borderColor:
                  overridePhones.includes(currentPhone) ? "#22c55e" : "#eee",
                  borderRadius:6,overflow:"hidden"}}>
                  <TextInput
                    style={{fontSize:12,color:"#1C1C1E",padding:6,backgroundColor:
                      overridePhones.includes(currentPhone) ? "#EAFAF1" : "#fff"}}
                    placeholder="Phone number *"
                    value={passengerInfo.phone||""}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={v=>{
                      const cleaned = v.replace(/\D/g,"").slice(0,10);
                      setPassengerInfo(p=>({...p,phone:cleaned}));
                      if (cleaned.length === 10) {
                        const overrides = (cashSettings.cashOverridePhones||[])
                          .map(p=>String(p).replace(/\D/g,""));
                        const isOverride = overrides.includes(cleaned);
                        const globalCash = cashSettings.cashPaymentEnabled === true;
                        if (isOverride || globalCash) setPaymentMethod("Cash");
                        else if (paymentMethod === "Cash") setPaymentMethod("QR_UPI");
                      }
                    }}
                    placeholderTextColor={C.textSub}
                  />
                </View>
                {overridePhones.includes(currentPhone) && (
                  <Text style={{fontSize:10,color:"#22c55e",marginTop:3,fontWeight:"600"}}>
                    ✅ Cash payment available for this number
                  </Text>
                )}
              <View style={{flex:2}}>
                <Text style={{fontSize:12,fontWeight:"600",color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{"Gender *"}</Text>
                <View style={{flexDirection:"row",gap:6}}>
                  {["Male","Female","Other"].map(g=>(
                    <TouchableOpacity key={g}
                      style={{flex:1,borderWidth:1.5,borderColor:newPassForm.gender===g?C.red:"#E0E0E0",borderRadius:10,paddingVertical:11,alignItems:"center",backgroundColor:newPassForm.gender===g?"#FFF5F5":"#fff"}}
                      onPress={()=>setNewPassForm(p=>({...p,gender:g}))}>
                      <Text style={{fontSize:11,fontWeight:"700",color:newPassForm.gender===g?C.red:"#888"}}>{g[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={{backgroundColor:"#F2F2F7",borderRadius:10,padding:12,flexDirection:"row",alignItems:"center",gap:8,marginBottom:20}}>
              <Text style={{fontSize:16}}>{"💺"}</Text>
              <Text style={{fontSize:13,color:"#555"}}>
                {"Seat "}
                <Text style={{fontWeight:"700",color:C.red}}>{selectedSeats?.[passengers.length]||"Auto"}</Text>
                {" assign होईल"}
              </Text>
            </View>
            <TouchableOpacity
              style={{backgroundColor:C.red,borderRadius:14,paddingVertical:16,alignItems:"center"}}
              onPress={()=>{
                if(!newPassForm.name.trim()) return showAlert("Error","Passenger name enter kara.");
                if(!newPassForm.age.trim()) return showAlert("Error","Age enter kara.");
                setPassengers(prev=>[...prev,{...newPassForm,id:Date.now()}]);
                if(passengers.length===0) setPassengerInfo(p=>({...p,name:newPassForm.name,age:newPassForm.age,gender:newPassForm.gender}));
                setNewPassForm({name:"",age:"",gender:"Male"});
                setAddPassengerVisible(false);
                showAlert("✅ Added!",newPassForm.name+" added successfully.");
              }}
            >
              <Text style={{color:"#fff",fontWeight:"700",fontSize:15}}>{"Add Passenger ✓"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── Main Content ── */}
    <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
      <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>

        {/* ── Trip Banner ── */}
        <View style={{backgroundColor:C.white,marginBottom:6,paddingHorizontal:16,paddingVertical:14}}>
          <Text style={{textAlign:"center",fontSize:11,color:"#888",marginBottom:8}}>{selectedBus?.name}</Text>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <View>
              <Text style={{fontSize:17,fontWeight:"700",color:C.text}}>{selectedBus?.departure||"--:--"}</Text>
              <Text style={{fontSize:11,color:"#555",marginTop:2}}>{search.date}</Text>
              <Text style={{fontSize:11,color:"#888",marginTop:1}}>{selectedBoarding?.name||search.from}</Text>
            </View>
            <Text style={{fontSize:18,color:"#888"}}>{"→"}</Text>
            <View style={{alignItems:"flex-end"}}>
              <Text style={{fontSize:17,fontWeight:"700",color:C.text}}>{selectedBus?.arrival||"--:--"}</Text>
              <Text style={{fontSize:11,color:"#555",marginTop:2}}>{search.date}</Text>
              <Text style={{fontSize:11,color:"#888",marginTop:1}}>{selectedDropping?.name||search.to}</Text>
            </View>
          </View>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
            <View style={{backgroundColor:"#f0f0f0",borderRadius:20,paddingHorizontal:10,paddingVertical:4,flexDirection:"row",alignItems:"center",gap:4}}>
              <Text style={{fontSize:13}}>{"👤"}</Text>
              <Text style={{fontSize:12,color:"#444"}}>{selectedSeats.length}{" "}{t.seats||"seat"}{selectedSeats.length!==1?"s":""}</Text>
            </View>
            <TouchableOpacity onPress={()=>setTripDetailsVisible(true)}>
              <Text style={{fontSize:13,color:C.red,fontWeight:"600"}}>{t.tripBanner||"Trip Details"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trust Strip ── */}
        <View style={{backgroundColor:C.white,flexDirection:"row",justifyContent:"space-around",paddingVertical:12,marginBottom:6}}>
          {[
            {icon:"🔒",label:t.securePayment||"Secure\nPayment",bg:"#e8f5e9"},
            {icon:"💸",label:t.fastRefunds||"Superfast\nRefunds",bg:"#e3f2fd"},
            {icon:"👍",label:t.trustedUsers||"Trusted by\n40Mn+ users",bg:"#fff3e0"},
          ].map(item=>(
            <View key={item.label} style={{alignItems:"center",flexDirection:"row",gap:6}}>
              <View style={{width:30,height:30,borderRadius:6,backgroundColor:item.bg,justifyContent:"center",alignItems:"center"}}>
                <Text style={{fontSize:14}}>{item.icon}</Text>
              </View>
              <Text style={{fontSize:10,color:"#333",fontWeight:"500",lineHeight:14}}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Contact Details ── */}
        <View style={{backgroundColor:C.white,marginBottom:6}}>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",padding:16,paddingBottom:10}}>
            <View>
              <Text style={{fontSize:15,fontWeight:"700",color:C.text}}>{t.contactDetailsTitle||"Contact Details"}</Text>
              <Text style={{fontSize:12,color:"#888",marginTop:2}}>{t.contactDetailsSubtitle||"Ticket details will be sent to"}</Text>
            </View>
            <TouchableOpacity onPress={()=>setEditContactVisible(true)}>
              <Text style={{fontSize:13,fontWeight:"600",color:C.red}}>{t.editLabel||"Edit"}</Text>
            </TouchableOpacity>
          </View>
          {[
            {icon:"📞",val:passengerInfo.phone||user?.phone||""},
            {icon:"✉️",val:passengerInfo.email||user?.email||""},
            {icon:"📍",val:"Maharashtra"},
          ].map((row,i)=>(
            <View key={i} style={{flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16,paddingVertical:4}}>
              <Text style={{fontSize:15,color:"#555"}}>{row.icon}</Text>
              <TextInput
                style={{fontSize:13,color:C.text,flex:1,paddingVertical:2}}
                value={row.val}
                onChangeText={v=>{
                  if(i===0) setPassengerInfo(p=>({...p,phone:v.replace(/\D/g,"").slice(0,10)}));
                  if(i===1) setPassengerInfo(p=>({...p,email:v}));
                }}
                keyboardType={i===0?"phone-pad":i===1?"email-address":"default"}
                placeholderTextColor={C.textSub}
              />
            </View>
          ))}
          <View style={{margin:10,marginHorizontal:16,backgroundColor:"#e8f5e9",borderRadius:6,padding:10,flexDirection:"row",alignItems:"center",gap:6}}>
            <Text style={{fontSize:15}}>{"📱"}</Text>
            <Text style={{fontSize:12,color:"#2e7d32",fontWeight:"500"}}>{t.whatsappEnabled||"WhatsApp communication enabled"}</Text>
          </View>
        </View>

        {/* ── Passenger Details ── */}
        <View style={{backgroundColor:C.white,marginBottom:6}}>
          <View style={{padding:16,paddingBottom:8}}>
            <Text style={{fontSize:15,fontWeight:"700",color:C.text}}>{t.passengerDetailsTitle||"Passenger details"}</Text>
            <Text style={{fontSize:12,color:"#888",marginTop:2}}>{"0/"}{selectedSeats.length}{" "}{t.passengerSelected||"Selected"}</Text>
            <Text style={{fontSize:13,color:C.text,marginTop:3}}>
              {t.selectLabel||"Select"}{" "}
              <Text style={{color:C.red,fontWeight:"600"}}>
                {selectedSeats.length}{" "}{passengerInfo.gender==="Female"?(t.female||"Female"):(t.male||"Male")}
              </Text>{" "}
              {t.passenger||"passenger"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={()=>{
              if(passengers.length>=selectedSeats.length){
                showAlert("Max Passengers",selectedSeats.length+" seat निवडल्या आहेत. जास्त passengers add करता येणार नाहीत.");
                return;
              }
              setAddPassengerVisible(true);
            }}
            style={{marginHorizontal:16,marginBottom:4,backgroundColor:"#ffe5e3",borderRadius:24,padding:12,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:8}}>
            <Text style={{fontSize:16,color:C.red}}>{"👤+"}</Text>
            <Text style={{fontSize:14,fontWeight:"600",color:C.red}}>
              {passengers.length>0?passengers.length+" added · Add more":(t.addNewPassenger||"Add new passenger")}
            </Text>
          </TouchableOpacity>

          {/* Passenger form */}
          <View style={{borderTopWidth:0.5,borderTopColor:"#f0f0f0",padding:16,flexDirection:"row",alignItems:"center",gap:12}}>
            <View style={{width:40,height:40,borderRadius:20,backgroundColor:"#f0f0f0",justifyContent:"center",alignItems:"center"}}>
              <Text style={{fontSize:20}}>{"👤"}</Text>
            </View>
            <View style={{flex:1}}>
             <TextInput
                style={{fontSize:14,fontWeight:"600",color:C.text,borderBottomWidth:0.5,borderBottomColor:"#eee",paddingBottom:4}}
                placeholder={t.namePlaceholder||"Full name"}
                value={passengerInfo.name}
                onChangeText={v=>setPassengerInfo(p=>({...p,name:v}))}
                placeholderTextColor={C.textSub}
              />
              {/* Phone hint for cash override */}
              {!cashSettings.cashPaymentEnabled && (cashSettings.cashOverridePhones||[]).length > 0 && (
                <Text style={{fontSize:10,color:"#f59e0b",marginTop:4}}>
                  ⚠️ Cash available only for specific numbers — enter phone below
                </Text>
              )}
              <View style={{flexDirection:"row",gap:8,marginTop:8}}>
                <TextInput
                  style={{flex:1,fontSize:12,color:"#888",borderWidth:0.5,borderColor:"#eee",borderRadius:6,padding:6}}
                  placeholder={t.agePlaceholderShort||"Age"}
                  value={passengerInfo.age}
                  keyboardType="numeric"
                  maxLength={3}
                  onChangeText={v=>setPassengerInfo(p=>({...p,age:v.replace(/\D/g,"")}))}
                  placeholderTextColor={C.textSub}
                />
                
                <View style={{flex:2,flexDirection:"row",gap:4}}>
                  {[
                    {key:"Male",label:t.male||"Male"},
                    {key:"Female",label:t.female||"Female"},
                    {key:"Other",label:t.other||"Other"},
                  ].map(g=>(
                    <TouchableOpacity key={g.key}
                      style={{flex:1,borderWidth:0.5,borderColor:passengerInfo.gender===g.key?C.red:"#ddd",borderRadius:6,padding:6,alignItems:"center",backgroundColor:passengerInfo.gender===g.key?"#ffe5e3":C.white}}
                      onPress={()=>setPassengerInfo(p=>({...p,gender:g.key}))}>
                      <Text style={{fontSize:10,fontWeight:"600",color:passengerInfo.gender===g.key?C.red:"#888"}}>{g.label[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={{width:20,height:20,borderWidth:1.5,borderColor:"#ccc",borderRadius:4,backgroundColor:C.white}}/>
          </View>
        </View>

        {/* ── COUPON CODE ── */}
        <View style={{backgroundColor:C.white,marginBottom:6}}>
          <TouchableOpacity
            style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16}}
            onPress={()=>setShowCouponBox(p=>!p)}
            activeOpacity={0.8}
          >
            <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
              <Text style={{fontSize:20}}>{"🎫"}</Text>
              <Text style={{fontSize:15,fontWeight:"700",color:C.text}}>{t.couponTitle||"Have a coupon code?"}</Text>
            </View>
            <Text style={{fontSize:18,color:C.textSub}}>{showCouponBox?"∧":"∨"}</Text>
          </TouchableOpacity>
          {showCouponBox&&(
            <View style={{paddingHorizontal:16,paddingBottom:16}}>
              <View style={{flexDirection:"row",borderWidth:1.5,borderColor:C.border,borderRadius:10,overflow:"hidden"}}>
                <TextInput
                  style={{flex:1,paddingHorizontal:14,paddingVertical:12,fontSize:14,color:C.text}}
                  placeholder={t.enterCoupon||"Enter coupon code"}
                  placeholderTextColor={C.textSub}
                  value={offerCode}
                  onChangeText={setOfferCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={applyOffer}
                  style={{backgroundColor:offerCode.trim()?C.red:"#f0f0f0",paddingHorizontal:18,justifyContent:"center"}}
                >
                  <Text style={{fontSize:14,fontWeight:"700",color:offerCode.trim()?C.white:"#aaa"}}>{t.applyBtn||"Apply"}</Text>
                </TouchableOpacity>
              </View>
              {appliedOffer&&(
                <View style={{marginTop:10,backgroundColor:C.greenLight,borderRadius:8,padding:10,borderWidth:1,borderColor:C.greenBorder,flexDirection:"row",alignItems:"center",gap:8}}>
                  <Text style={{fontSize:16}}>{"✅"}</Text>
                  <View style={{flex:1}}>
                    <Text style={{color:C.green,fontWeight:"700",fontSize:13}}>{appliedOffer.description||(t.offerAppliedMsg||"Offer Applied!")}</Text>
                    <Text style={{color:C.green,fontSize:12,marginTop:2}}>{"₹"}{appliedOffer.discount}{" "}{t.discountApplied||"discount applied"}</Text>
                  </View>
                  <TouchableOpacity onPress={()=>{setAppliedOffer(null);setOfferCode("");}}>
                    <Text style={{color:C.red,fontSize:12,fontWeight:"600"}}>{t.removeCoupon||"Remove"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── PAYMENT METHOD ── */}
        {/* ── PAYMENT METHOD ── */}
{/* ── PAYMENT METHOD ── */}
{/* ── PAYMENT METHOD — Modern 2025 Design ── */}
<View style={{ backgroundColor: "#F5F6FA", marginBottom: 6 }}>

  {/* Header */}
  <View style={{
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
  }}>
    <View style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "#1A1A2E",
      justifyContent: "center", alignItems: "center",
    }}>
      <Text style={{ fontSize: 16 }}>🔒</Text>
    </View>
    <View>
      <Text style={{ fontSize: 16, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.3 }}>
        Select Payment
      </Text>
      <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>
        256-bit SSL · PCI DSS Compliant
      </Text>
    </View>
  </View>

  {/* ── QR / UPI SCAN — RECOMMENDED ── */}
  {paymentMethodsAllowed.qr && (
    <TouchableOpacity
      onPress={() => setPaymentMethod("QR_UPI")}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 12, marginBottom: 10,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: paymentMethod === "QR_UPI" ? 2 : 1.5,
        borderColor: paymentMethod === "QR_UPI" ? "#C0392B" : "#E0E0E0",
        backgroundColor: paymentMethod === "QR_UPI" ? "#FFF5F5" : "#FFFFFF",
        elevation: paymentMethod === "QR_UPI" ? 4 : 1,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* QR Icon — colorful gradient style */}
        <View style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: "#1A1A2E",
          justifyContent: "center", alignItems: "center",
          position: "relative",
        }}>
          {/* QR grid dots */}
          <View style={{ width: 28, height: 28, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
            {[1,1,0,1,0,1,1,0,1].map((v, i) => (
              <View key={i} style={{
                width: 7, height: 7, borderRadius: 1.5,
                backgroundColor: v ? "#FFFFFF" : "transparent",
              }} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1A1A2E" }}>
              Scan & Pay
            </Text>
            <View style={{
              backgroundColor: "#C0392B", borderRadius: 20,
              paddingHorizontal: 8, paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 }}>
                ★ RECOMMENDED
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
            No extra charges · Instant confirmation
          </Text>
          {/* UPI App logos row */}
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {/* GPay */}
            <View style={{
              width: 24, height: 24, borderRadius: 6,
              backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8E8E8",
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#4285F4" }}>G</Text>
            </View>
            {/* PhonePe */}
            <View style={{
              width: 24, height: 24, borderRadius: 6,
              backgroundColor: "#5F259F",
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>P</Text>
            </View>
            {/* Paytm */}
            <View style={{
              width: 24, height: 24, borderRadius: 6,
              backgroundColor: "#00BAF2",
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 8, fontWeight: "900", color: "#fff" }}>Pay</Text>
            </View>
            <Text style={{ fontSize: 10, color: "#999" }}>+ any UPI</Text>
          </View>
        </View>

        {/* Radio */}
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          borderWidth: 2,
          borderColor: paymentMethod === "QR_UPI" ? "#C0392B" : "#D0D0D0",
          justifyContent: "center", alignItems: "center",
          backgroundColor: "#fff",
        }}>
          {paymentMethod === "QR_UPI" && (
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#C0392B" }} />
          )}
        </View>
      </View>

      {/* Bottom strip when selected */}
      {paymentMethod === "QR_UPI" && (
        <View style={{
          backgroundColor: "#FFF0EE", paddingHorizontal: 16, paddingVertical: 10,
          borderTopWidth: 1, borderTopColor: "#FFD8D3",
          flexDirection: "row", gap: 8, alignItems: "center",
        }}>
          <Text style={{ fontSize: 13 }}>💡</Text>
          <Text style={{ fontSize: 12, color: "#B03A2E", flex: 1, lineHeight: 17 }}>
            Proceed केल्यावर QR screen येईल. Pay करून UTR टाका.
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )}

  {/* ─── QR PAYMENT MODAL — Modern 2025 ── */}
<Modal visible={showQRModal} transparent animationType="slide">
  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
    <View style={{
      backgroundColor: "#F5F6FA",
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      maxHeight: "96%",
      overflow: "hidden",
    }}>

      {/* ── TOP HANDLE ── */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#DDD" }} />
      </View>

      {/* ── HEADER ── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: "#F5F6FA",
        borderBottomWidth: 1, borderBottomColor: "#EBEBEB",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.4 }}>
            UPI Payment
          </Text>
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Scan · Pay · Confirm
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowQRModal(false)}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#EBEBEB",
            justifyContent: "center", alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: "#555", fontWeight: "700" }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── AMOUNT HERO CARD ── */}
        <View style={{
          backgroundColor: "#1A1A2E",
          borderRadius: 20, padding: 20,
          marginBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Background decoration */}
          <View style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.04)",
          }} />
          <View style={{
            position: "absolute", bottom: -20, left: 60,
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.03)",
          }} />

          <View>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Total to Pay
            </Text>
            <Text style={{ fontSize: 38, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 }}>
              ₹{getFinalAmount()}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} · {search.date}
            </Text>
          </View>

          {/* Route pill */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 14, padding: 14,
            alignItems: "center",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
          }}>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "700", letterSpacing: 1 }}>ROUTE</Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff", marginTop: 4 }}>{search.from}</Text>
            <Text style={{ fontSize: 16, color: "#C0392B", marginVertical: 1 }}>↓</Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{search.to}</Text>
          </View>
        </View>

        {/* ── QR CODE CARD ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 20,
          marginBottom: 14,
          alignItems: "center",
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 2,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1A1A2E", marginBottom: 16, letterSpacing: -0.2 }}>
            Scan with any UPI app
          </Text>

          {qrSettings?.qrImageBase64 ? (
            <View style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: "#FFFFFF",
              borderWidth: 3,
              borderColor: "#1A1A2E",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${qrSettings.qrImageBase64}` }}
                style={{ width: 190, height: 190, borderRadius: 8 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={{
              width: 190, height: 190,
              backgroundColor: "#F8F9FA",
              borderRadius: 16,
              justifyContent: "center", alignItems: "center",
              borderWidth: 2, borderColor: "#E5E5E5", borderStyle: "dashed",
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📱</Text>
              <Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>QR not available</Text>
            </View>
          )}

          {/* Amount below QR */}
          <View style={{
            marginTop: 14, backgroundColor: "#F5F6FA",
            borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#C0392B", textAlign: "center" }}>
              ₹{getFinalAmount()}
            </Text>
          </View>

          {/* UPI ID row */}
          <View style={{
            marginTop: 14, width: "100%",
            backgroundColor: "#F5F6FA",
            borderRadius: 12, padding: 14,
            flexDirection: "row", alignItems: "center", gap: 12,
            borderWidth: 1, borderColor: "#EBEBEB",
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "#1A1A2E",
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>@</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: "#999", fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>UPI ID</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#1A1A2E", marginTop: 1 }}>
                {qrSettings?.upiId || "kavirajbarge@ybl"}
              </Text>
              <Text style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                {qrSettings?.upiName || "KAVIRAJ KRISHNAT BARGE"}
              </Text>
            </View>
          </View>
        </View>

      

       {/* ── OPEN DIRECTLY IN APP ── */}
        <View style={{
          backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16,
          marginBottom: 14, borderWidth: 1, borderColor: "#EBEBEB", elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 }}>
            Open Directly in App
          </Text>
          <Text style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>
            ₹{getFinalAmount()} auto-filled · Pay करा · UTR enter करा
          </Text>
          <View style={{ gap: 8 }}>
            {[
              { name: "Google Pay", bg: "#FFFFFF", border: "#E8E8E8", btnBg: "#4285F4",
                icon: () => <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#E8E8E8", justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 22, fontWeight: "900", color: "#4285F4" }}>G</Text></View>,
                getUrl: (b) => IS_WEB ? `tez://upi/pay?${b}` : Platform.OS === "ios" ? `gpay://upi/pay?${b}` : `intent://upi/pay?${b}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
              },
              { name: "PhonePe", bg: "#F8F0FF", border: "#E8D5FF", btnBg: "#5F259F",
                icon: () => <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#5F259F", justifyContent: "center", alignItems: "center" }}><View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: "#fff", justifyContent: "center", alignItems: "center" }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" }} /></View></View>,
                getUrl: (b) => IS_WEB ? `phonepe://pay?${b}` : Platform.OS === "ios" ? `phonepe://pay?${b}` : `intent://upi/pay?${b}#Intent;scheme=upi;package=com.phonepe.app;end`,
              },
              { name: "Paytm", bg: "#F0FBFF", border: "#BAE6FD", btnBg: "#00BAF2",
                icon: () => <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#00BAF2", justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 12, fontWeight: "900", color: "#fff" }}>Pay</Text><Text style={{ fontSize: 8, fontWeight: "800", color: "#002970", marginTop: -2 }}>tm</Text></View>,
                getUrl: (b) => IS_WEB ? `paytmmp://pay?${b}` : Platform.OS === "ios" ? `paytmmp://pay?${b}` : `intent://upi/pay?${b}#Intent;scheme=upi;package=net.one97.paytm;end`,
              },
              { name: "Any UPI App", bg: "#FFF5F5", border: "#FFD0D0", btnBg: "#C0392B",
                icon: () => <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#C0392B", justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 20 }}>📲</Text></View>,
                getUrl: (b) => `upi://pay?${b}`,
              },
            ].map((app, i) => {
              const amt = getFinalAmount();
              const upiBase = `pa=${qrSettings?.upiId || "kavirajbarge@ybl"}&pn=${encodeURIComponent(qrSettings?.upiName || "Shahaji Travels")}&am=${amt}&cu=INR&tn=${encodeURIComponent("Shahaji Travels Booking")}`;
              const url = app.getUrl(upiBase);
              return (
                <TouchableOpacity key={i}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: app.bg, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: app.border, gap: 12, marginBottom: 4 }}
                  activeOpacity={0.75}
                onPress={async () => {
  const amt = getFinalAmount();
  const upiStr = `upi://pay?pa=${qrSettings?.upiId || "kavirajbarge@ybl"}&pn=${encodeURIComponent(qrSettings?.upiName || "Shahaji Travels")}&am=${amt}&cu=INR&tn=${encodeURIComponent("Shahaji Travels Booking")}`;
  try {
    await Linking.openURL(upiStr);
  } catch {
    showAlert("Cannot Open", `UPI app manually open करा\n₹${amt} pay करा\nUPI ID: ${qrSettings?.upiId || "kavirajbarge@ybl"}`);
  }
}}
                >
                  {app.icon()}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>{app.name}</Text>
                    <Text style={{ fontSize: 11, color: "#888", marginTop: 1 }}>₹{amt} · auto-filled</Text>
                  </View>
                  <View style={{ backgroundColor: app.btnBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>Open →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── HOW TO PAY — Steps ── */}
        <View style={{
          backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16,
          marginBottom: 14, borderWidth: 1, borderColor: "#EBEBEB", elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 }}>
            How to Pay
          </Text>
          {[
            { n: "1", text: "Open GPay / PhonePe / Paytm" },
            { n: "2", text: "Scan QR code or enter UPI ID" },
            { n: "3", text: `Enter amount ₹${getFinalAmount()}` },
            { n: "4", text: "Complete payment & note UTR number" },
            { n: "5", text: "Enter UTR below to confirm booking" },
          ].map((step, i) => (
            <View key={i} style={{
              flexDirection: "row", gap: 12,
              marginBottom: i < 4 ? 12 : 0,
              alignItems: "flex-start",
            }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: "#1A1A2E",
                justifyContent: "center", alignItems: "center", flexShrink: 0,
              }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{step.n}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#444", lineHeight: 22, flex: 1, marginTop: 3 }}>
                {step.text}
              </Text>
            </View>
          ))}
        </View>

        {/* ── UTR INPUT ── */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20, padding: 16,
          marginBottom: 14,
          borderWidth: 1, borderColor: "#EBEBEB",
          elevation: 1,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 2, letterSpacing: -0.2 }}>
            Enter UTR / Transaction ID
          </Text>
          <Text style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>
            Found in your UPI app's payment history
          </Text>

          <View style={{
            flexDirection: "row",
            borderWidth: 2,
            borderColor: qrUtrNumber.length >= 6 ? "#1A1A2E" : "#EBEBEB",
            borderRadius: 14, overflow: "hidden",
            backgroundColor: "#F5F6FA",
            transition: "border-color 0.2s",
          }}>
            <View style={{
              paddingHorizontal: 14, justifyContent: "center",
              backgroundColor: qrUtrNumber.length >= 6 ? "#1A1A2E" : "#EBEBEB",
            }}>
              <Text style={{ fontSize: 14, color: qrUtrNumber.length >= 6 ? "#fff" : "#999" }}>🔢</Text>
            </View>
            <TextInput
              style={{
                flex: 1, paddingHorizontal: 14, paddingVertical: 15,
                fontSize: 16, color: "#1A1A2E",
                fontWeight: "700", letterSpacing: 1.5,
                backgroundColor: "#FFFFFF",
              }}
              placeholder="e.g. 407311234567"
              placeholderTextColor="#C7C7CC"
              value={qrUtrNumber}
              onChangeText={setQrUtrNumber}
              keyboardType="default"
              maxLength={30}
              autoCapitalize="characters"
            />
            {qrUtrNumber.length >= 6 && (
              <View style={{
                paddingHorizontal: 14, justifyContent: "center",
                backgroundColor: "#EAFAF1",
              }}>
                <Text style={{ color: "#27AE60", fontWeight: "800", fontSize: 16 }}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── CONFIRM BUTTON ── */}
        <TouchableOpacity
          style={{
            backgroundColor: qrUtrNumber.trim().length >= 6 ? "#1A1A2E" : "#EBEBEB",
            borderRadius: 16, paddingVertical: 18,
            alignItems: "center", marginBottom: 10,
            elevation: qrUtrNumber.trim().length >= 6 ? 3 : 0,
          }}
          onPress={handleQRBooking}
          disabled={qrUtrNumber.trim().length < 6}
          activeOpacity={0.85}
        >
          <Text style={{
            color: qrUtrNumber.trim().length >= 6 ? "#fff" : "#aaa",
            fontSize: 15, fontWeight: "800", letterSpacing: 0.3,
          }}>
            {qrUtrNumber.trim().length >= 6 ? "✓  Confirm & Submit Booking" : "Enter UTR to Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: "center", paddingVertical: 12 }}
          onPress={() => setShowQRModal(false)}
        >
          <Text style={{ color: "#999", fontWeight: "600", fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>

        {/* ── WARNING ── */}
        <View style={{
          backgroundColor: "#FFF8E1",
          borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: "#FFE082",
          flexDirection: "row", gap: 10, alignItems: "flex-start",
        }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: "#795548", lineHeight: 19, flex: 1 }}>
            Admin will verify your payment within 15–30 minutes. Incorrect UTR will result in cancellation.
          </Text>
        </View>

      </ScrollView>
    </View>
  </View>
</Modal>

  {/* ── DEBIT / CREDIT CARD ── */}
 {paymentMethodsAllowed.razorpay && IS_WEB && (
    <TouchableOpacity
      onPress={() => setPaymentMethod("Card")}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 12, marginBottom: 10,
        borderRadius: 18, overflow: "hidden",
        backgroundColor: paymentMethod === "Card" ? "#F0F4FF" : "#FFFFFF",
        borderWidth: paymentMethod === "Card" ? 2 : 1,
        borderColor: paymentMethod === "Card" ? "#1565C0" : "#E8E8E8",
        elevation: 1,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Card icon with chip */}
        <View style={{
          width: 52, height: 36, borderRadius: 8,
          backgroundColor: "#1565C0",
          justifyContent: "flex-end", paddingBottom: 5, paddingLeft: 5,
          position: "relative", overflow: "hidden",
        }}>
          {/* Chip */}
          <View style={{
            position: "absolute", top: 6, left: 7,
            width: 12, height: 9, borderRadius: 2,
            backgroundColor: "#FFD700",
          }} />
          {/* Stripe lines */}
          <View style={{ flexDirection: "row", gap: 2, paddingLeft: 2 }}>
            {[10,6,8].map((w, i) => (
              <View key={i} style={{ height: 1.5, width: w, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 }}>
            Debit / Credit Card
          </Text>
          {/* Card network logos */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            {[
              { label: "VISA",   bg: "#1A1F71", color: "#fff" },
              { label: "MC",     bg: "#EB001B", color: "#fff" },
              { label: "RuPay",  bg: "#006B3C", color: "#fff" },
              { label: "Amex",   bg: "#007BC1", color: "#fff" },
            ].map(card => (
              <View key={card.label} style={{
                backgroundColor: card.bg, borderRadius: 4,
                paddingHorizontal: 5, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 8, fontWeight: "800", color: card.color, letterSpacing: 0.3 }}>
                  {card.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 2, borderColor: paymentMethod === "Card" ? "#1565C0" : "#D0D0D0",
          justifyContent: "center", alignItems: "center", backgroundColor: "#fff",
        }}>
          {paymentMethod === "Card" && (
            <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: "#1565C0" }} />
          )}
        </View>
      </View>

      {/* Card form */}
      {paymentMethod === "Card" && (
        <View style={{ backgroundColor: "#F0F4FF", padding: 16, borderTopWidth: 1, borderTopColor: "#DDEAFF" }}>
          <TextInput
            style={{
              borderWidth: 1.5, borderColor: "#1565C0", borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
              color: "#1A1A2E", backgroundColor: "#fff",
              letterSpacing: 3, marginBottom: 10, fontWeight: "600",
            }}
            placeholder="1234  5678  9012  3456"
            placeholderTextColor="#CCC"
            value={passengerInfo.cardNumber || ""}
            onChangeText={v => {
              const clean = v.replace(/\D/g, "").slice(0, 16);
              const fmt = clean.match(/.{1,4}/g)?.join("  ") || clean;
              setPassengerInfo(p => ({ ...p, cardNumber: fmt }));
            }}
            keyboardType="numeric" maxLength={22}
          />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TextInput
              style={{
                flex: 1, borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 14, color: "#1A1A2E", backgroundColor: "#fff", textAlign: "center",
              }}
              placeholder="MM/YY" placeholderTextColor="#CCC"
              value={passengerInfo.cardExpiry || ""}
              onChangeText={v => {
                const clean = v.replace(/\D/g, "").slice(0, 4);
                const fmt = clean.length > 2 ? clean.slice(0, 2) + "/" + clean.slice(2) : clean;
                setPassengerInfo(p => ({ ...p, cardExpiry: fmt }));
              }}
              keyboardType="numeric" maxLength={5}
            />
            <TextInput
              style={{
                flex: 1, borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 14, color: "#1A1A2E", backgroundColor: "#fff", textAlign: "center",
              }}
              placeholder="CVV" placeholderTextColor="#CCC"
              value={passengerInfo.cardCvv || ""}
              onChangeText={v => setPassengerInfo(p => ({ ...p, cardCvv: v.replace(/\D/g, "").slice(0, 3) }))}
              keyboardType="numeric" maxLength={3} secureTextEntry
            />
          </View>
          <TextInput
            style={{
              borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 14, color: "#1A1A2E", backgroundColor: "#fff",
            }}
            placeholder="NAME ON CARD"
            placeholderTextColor="#CCC"
            value={passengerInfo.cardName || ""}
            onChangeText={v => setPassengerInfo(p => ({ ...p, cardName: v.toUpperCase() }))}
            autoCapitalize="characters"
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Text style={{ fontSize: 11, color: "#5C7CFA" }}>🔒</Text>
            <Text style={{ fontSize: 11, color: "#888" }}>256-bit SSL encrypted · PCI DSS compliant</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )}

  {/* ── RAZORPAY ── */}
  {paymentMethodsAllowed.razorpay && (
    <TouchableOpacity
      onPress={() => setPaymentMethod("Razorpay")}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 12, marginBottom: 10,
        borderRadius: 18, overflow: "hidden",
        backgroundColor: paymentMethod === "Razorpay" ? "#F0F8FF" : "#FFFFFF",
        borderWidth: paymentMethod === "Razorpay" ? 2 : 1,
        borderColor: paymentMethod === "Razorpay" ? "#072654" : "#E8E8E8",
        elevation: 1,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{
          width: 52, height: 36, borderRadius: 8,
          backgroundColor: "#072654",
          justifyContent: "center", alignItems: "center",
        }}>
          <Text style={{ color: "#3395FF", fontSize: 13, fontWeight: "900", letterSpacing: -0.5 }}>
            Rpay
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>Razorpay</Text>
          <Text style={{ fontSize: 11, color: "#999", marginTop: 1 }}>All methods + 2% gateway fee</Text>
        </View>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 2, borderColor: paymentMethod === "Razorpay" ? "#072654" : "#D0D0D0",
          justifyContent: "center", alignItems: "center", backgroundColor: "#fff",
        }}>
          {paymentMethod === "Razorpay" && (
            <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: "#072654" }} />
          )}
        </View>
      </View>
      {paymentMethod === "Razorpay" && (
        <View style={{
          backgroundColor: "#FFF8E1", padding: 12,
          borderTopWidth: 1, borderTopColor: "#FFE082",
          flexDirection: "row", gap: 8,
        }}>
          <Text style={{ fontSize: 13 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: "#795548", flex: 1, lineHeight: 18 }}>
            2% payment gateway charge applies.{" "}
            Base: ₹{getTotalAmount()} → You Pay: ₹{Math.round(getTotalAmount() * 1.02)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )}
{/* ── DIRECT UPI APP BUTTONS — all platforms ── */}
{/* ── DIRECT UPI APP BUTTONS ── */}



  {/* ── CASH ── */}
  {isCashAllowed(cashSettings, passengerInfo.phone) && (
    <TouchableOpacity
      onPress={() => setPaymentMethod("Cash")}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 12, marginBottom: 10,
        borderRadius: 18, overflow: "hidden",
        backgroundColor: paymentMethod === "Cash" ? "#F0FFF4" : "#FFFFFF",
        borderWidth: paymentMethod === "Cash" ? 2 : 1,
        borderColor: paymentMethod === "Cash" ? "#27AE60" : "#E8E8E8",
        elevation: 1,
      }}
    >
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Cash icon */}
        <View style={{
          width: 52, height: 36, borderRadius: 8,
          backgroundColor: "#1B5E20",
          justifyContent: "center", alignItems: "center",
          position: "relative",
        }}>
          {/* Note lines */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <View style={{ width: 28, height: 2, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 1 }} />
            <View style={{ width: 22, height: 2, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 1 }} />
          </View>
          <View style={{
            position: "absolute", top: 4, right: 6,
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
          }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>Pay at Boarding</Text>
          <Text style={{ fontSize: 11, color: "#999", marginTop: 1 }}>Cash to driver · No charges</Text>
        </View>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 2, borderColor: paymentMethod === "Cash" ? "#27AE60" : "#D0D0D0",
          justifyContent: "center", alignItems: "center", backgroundColor: "#fff",
        }}>
          {paymentMethod === "Cash" && (
            <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: "#27AE60" }} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )}

  {/* Cash disabled warning */}
  {!isCashAllowed(cashSettings, passengerInfo.phone) && !paymentMethodsAllowed.cash && (
    <View style={{
      marginHorizontal: 12, marginBottom: 10,
      borderRadius: 14, padding: 14,
      backgroundColor: "#FFF8E1",
      borderWidth: 1, borderColor: "#FFE082",
      flexDirection: "row", gap: 10,
    }}>
      <Text style={{ fontSize: 16 }}>⚠️</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#E65100", marginBottom: 4 }}>
          Cash Payment Unavailable
        </Text>
        <Text style={{ fontSize: 12, color: "#795548", lineHeight: 18, marginBottom: 10 }}>
          Please use UPI or Card. To enable cash, contact the operator.
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={callOperator} style={{
            backgroundColor: "#E65100", borderRadius: 8,
            paddingVertical: 8, paddingHorizontal: 14,
          }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openWhatsApp} style={{
            backgroundColor: "#25D366", borderRadius: 8,
            paddingVertical: 8, paddingHorizontal: 14,
          }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )}

  {/* Security badges */}
  <View style={{
    marginHorizontal: 12, marginBottom: 16,
    flexDirection: "row", justifyContent: "center", gap: 16,
  }}>
    {[
      { icon: "🔒", text: "SSL Secure" },
      { icon: "✅", text: "PCI DSS" },
      { icon: "🛡️", text: "100% Safe" },
    ].map(badge => (
      <View key={badge.text} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 12 }}>{badge.icon}</Text>
        <Text style={{ fontSize: 11, color: "#999", fontWeight: "600" }}>{badge.text}</Text>
      </View>
    ))}
  </View>

</View>
      </ScrollView>

      {/* ── Bottom Sticky Bar ── */}
      <View style={{backgroundColor:C.white,borderTopWidth:0.5,borderTopColor:"#e0e0e0",paddingHorizontal:16,paddingVertical:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
        <View>
          <Text style={{fontSize:11,color:C.textSub}}>{t.totalFare||"Total fare"}</Text>
          <Text style={{fontSize:20,fontWeight:"800",color:C.text}}>{"₹"}{getFinalAmount()}</Text>
          <TouchableOpacity>
            <Text style={{fontSize:12,color:C.red,fontWeight:"600",marginTop:1}}>{t.fareBreakup||"Fare breakup"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{backgroundColor:C.red,borderRadius:10,paddingHorizontal:32,paddingVertical:14}}
          onPress={handleConfirmBooking}
          activeOpacity={0.85}
        >
          <Text style={{color:C.white,fontSize:16,fontWeight:"700"}}>{t.proceedBtn||"Proceed"}{" →"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </>
)}

 <SeatInfoModal visible={showSeatInfo} onClose={()=>setShowSeatInfo(false)}/>
      </SafeAreaView>
    );
  }

  // ============================================================
  // TICKET
  // ============================================================
  if (screen==="ticket") {
    const seats = Array.isArray(ticket?.selectedSeats) ? ticket.selectedSeats.join(", ")
      : (ticket?.seatNumbers ? (Array.isArray(ticket.seatNumbers)?ticket.seatNumbers.join(", "):ticket.seatNumbers) : "—");
    const busName = ticket?.busName || ticket?.bus?.name || selectedBus?.name || "Shahaji Travels";
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <StatusBar barStyle="light-content" backgroundColor={C.red}/>
        <CustomAlert {...alertState} onClose={hideAlert}/>
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:50}}>
         {ticket?.paymentMode === "QR_UPI" && ticket?.bookingStatus !== "Confirmed" ? (
  /* ── PENDING QR BOOKING ── */
  <View style={{
    backgroundColor:"#FFF8E1", borderRadius:18, padding:24,
    alignItems:"center", borderWidth:1.5, borderColor:"#FFE082", marginBottom:16,
  }}>
    <Text style={{fontSize:52}}>⏳</Text>
    <Text style={{fontSize:20,fontWeight:"800",color:"#E65100",marginTop:10}}>
      Payment Verification Pending
    </Text>
    <Text style={{fontSize:13,color:"#555",textAlign:"center",marginTop:8,lineHeight:20}}>
      Admin तुमचे QR payment verify करत आहे.{"\n"}
      15-30 minutes मध्ये booking confirm होईल.{"\n"}
      Booking ID note करून ठेवा:
    </Text>
    <View style={{
      backgroundColor:"#fff",borderRadius:12,paddingHorizontal:20,paddingVertical:10,
      marginTop:12,borderWidth:1.5,borderColor:"#FFE082",
    }}>
      <Text style={{fontSize:18,fontWeight:"800",color:"#E65100",letterSpacing:2}}>
        {ticket?.bookingId}
      </Text>
    </View>
    <Text style={{fontSize:11,color:"#888",marginTop:8}}>
      Customer care: 9021694503
    </Text>
  </View>
) : (
  /* ── CONFIRMED BOOKING ── */
  <View style={s.confirmedBanner}>
    <Text style={s.confirmedEmoji}>✅</Text>
    <Text style={s.confirmedTitle}>{t.bookingConfirmed||"Booking Confirmed!"}</Text>
    <Text style={s.confirmedId}>Booking ID: {ticket?.bookingId}</Text>
  </View>
)}
          <View style={s.ticketCard}>
            <View style={s.ticketCardHead}>
              <Text style={s.ticketCardTitle}>🚌 {busName}</Text>
              <Text style={s.ticketCardSub}>{ticket?.busType||selectedBus?.type||"AC Sleeper"}</Text>
            </View>
            <View style={s.ticketRouteRow}>
              <View>
                <Text style={s.ticketCity}>{search.from}</Text>
                <Text style={s.ticketTimeSub}>Boarding</Text>
              </View>
              <Text style={s.ticketArrow}>→</Text>
              <View style={{alignItems:"flex-end"}}>
                <Text style={s.ticketCity}>{search.to}</Text>
                <Text style={s.ticketTimeSub}>Dropping</Text>
              </View>
            </View>
            <View style={s.ticketTimeBar}>
              <View style={{alignItems:"center",flex:1}}>
                <Text style={s.ticketTimeBarLabel}>DEPARTURE</Text>
                <Text style={s.ticketTimeBarVal}>{ticket?.departure||selectedBus?.departure||"--:--"}</Text>
              </View>
              <View style={{alignItems:"center"}}>
                <Text style={{fontSize:20,color:C.red}}>→</Text>
              </View>
              <View style={{alignItems:"center",flex:1}}>
                <Text style={s.ticketTimeBarLabel}>ARRIVAL</Text>
                <Text style={s.ticketTimeBarVal}>{ticket?.arrival||selectedBus?.arrival||"--:--"}</Text>
              </View>
            </View>
            <View style={s.ticketDivider}/>
            {[
              ["Date",      ticket?.date||search.date],
              ["Bus",       busName],
              ["Bus No", selectedBus?.number || selectedBus?.busNumber || selectedBus?.numberPlate || "—"],
              ["Passenger", ticket?.passengers?.[0]?.name||ticket?.customerName||user?.name],
              ["Phone",     ticket?.passengers?.[0]?.phone||ticket?.mobile||user?.phone],
              ["Seats",     seats],
              ["Boarding",  ticket?.boardingPoint],
              ["Dropping",  ticket?.droppingPoint],
              ["Payment",   ticket?.paymentMode||paymentMethod||"Cash"],
            ].map(([label,value])=>(
              <View key={label} style={s.ticketRow}>
                <Text style={s.ticketRowLabel}>{label}</Text>
                <Text style={s.ticketRowValue}>{value||"—"}</Text>
              </View>
            ))}
            <View style={s.ticketAmountBox}>
              <Text style={s.ticketAmountLabel}>AMOUNT PAID</Text>
              <Text style={s.ticketAmountValue}>₹{ticket?.amount}</Text>
            </View>
          </View>
          <PrimaryButton title="📄 Download Ticket PDF"
           onPress={()=>shareTicketPDF(ticket, user, selectedBus, showAlert, setLoading, setLoadMsg)}
            style={{marginTop:16}}/>
            
          <TouchableOpacity style={[s.primaryBtn,{marginTop:10,backgroundColor:C.white,borderWidth:1.5,borderColor:C.border}]}
            onPress={()=>{setSelectedSeats([]);setSelectedBus(null);setTicket(null);setScreen("home");}}>
            <Text style={[s.primaryBtnText,{color:C.text}]}>← Back to Home</Text>
            {/* ✅ ADD THIS — ticket screen la, Back to Home button nantarcha */}
<View style={s.devCard}>
  <Text style={s.devCardTitle}>🛠 Developed by</Text>
  <Text style={s.devCardName}>Mr. Digambar Barge</Text>
  <View style={s.devCardRow}>
    <Text style={s.devCardInfo}>📞 9021694503</Text>
    <Text style={s.devCardInfo}>✉️ digubarge123@gmail.com</Text>
  </View>
</View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ============================================================
// STYLESHEET
// ============================================================
const busCard = StyleSheet.create({
  wrap:{backgroundColor:C.white,borderRadius:16,overflow:"hidden",
        borderWidth:0.5,borderColor:"rgba(0,0,0,0.08)",marginBottom:10},
  header:{flexDirection:"row",alignItems:"flex-start",padding:14,paddingBottom:0,gap:10},
  iconWrap:{width:42,height:42,borderRadius:10,backgroundColor:"#FFF0EE",
            justifyContent:"center",alignItems:"center",flexShrink:0},
  name:{fontSize:14,fontWeight:"700",color:C.text,lineHeight:19},
  typeBadge:{backgroundColor:"#FFF0EE",borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  typeBadgeText:{fontSize:11,fontWeight:"700",color:C.red},
  price:{fontSize:20,fontWeight:"800",color:C.red,lineHeight:22},
  filterRow: {
  flexDirection: "row",
  paddingHorizontal: 12,
  gap: 8,
  marginTop: 10,
},

filterBtn: {
  flex: 1,                  // 🔥 equal width
  height: 65,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#E5E5EA",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#fff",
},

filterBtnActive: {
  backgroundColor: "#C0392B",
  borderColor: "#C0392B",
},

filterText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#333",
  textAlign: "center",
},

filterTextActive: {
  color: "#fff",
},
wrap: {
  marginHorizontal: 10,
  marginTop: 10,
  borderRadius: 14,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#E5E5EA",
  overflow: "hidden",
},
  seatsBadge:{backgroundColor:"#EAFAF1",borderRadius:10,paddingHorizontal:7,paddingVertical:2,marginTop:4},
  seatsBadgeText:{fontSize:10,fontWeight:"700",color:"#27AE60"},
  timeStrip:{flexDirection:"row",alignItems:"center",backgroundColor:"#F7F7F8",
             borderRadius:12,margin:12,marginTop:12,padding:12},
  timeVal:{fontSize:18,fontWeight:"800",color:C.text,lineHeight:20},
  timeCity:{fontSize:11,color:"#888",marginTop:3,fontWeight:"500"},
  timeLabel:{fontSize:10,color:"#aaa",marginTop:1},
  footer:{flexDirection:"row",justifyContent:"flex-end",gap:8,padding:12,paddingTop:10},
  detailBtn:{paddingHorizontal:16,paddingVertical:9,borderRadius:10,
             borderWidth:1.5,borderColor:C.red,backgroundColor:C.white},
  detailBtnText:{color:C.red,fontSize:13,fontWeight:"700"},
  bookBtn:{paddingHorizontal:20,paddingVertical:9,borderRadius:10,backgroundColor:C.red},
  bookBtnText:{color:C.white,fontSize:13,fontWeight:"700"},
});
const s = StyleSheet.create({
  loadOverlay:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.45)",zIndex:9999,justifyContent:"center",alignItems:"center"},
  loadBox:{backgroundColor:C.white,borderRadius:20,padding:28,alignItems:"center",minWidth:160,elevation:12},
  loadText:{color:C.text,fontWeight:"600",marginTop:12,fontSize:F.sm},
  primaryBtn:{backgroundColor:C.red,borderRadius:14,paddingVertical:16,alignItems:"center",justifyContent:"center"},
  primaryBtnDisabled:{opacity:0.4},
  primaryBtnText:{color:C.white,fontWeight:"700",fontSize:F.sm,letterSpacing:0.3},
 secHeader:{flexDirection:"row",alignItems:"center",backgroundColor:C.red,paddingHorizontal:14,paddingVertical:8,paddingTop:Platform.OS==="android"?38:12},
  backBtn:{width:36,height:36,borderRadius:18,backgroundColor:"rgba(255,255,255,0.2)",justifyContent:"center",alignItems:"center",marginRight:12},
  backBtnText:{color:C.white,fontSize:26,fontWeight:"700",lineHeight:30},
  secHeaderTitle:{color:C.white,fontWeight:"700",fontSize:F.lg},
  secHeaderSub:{color:"rgba(255,255,255,0.75)",fontSize:F.xs,marginTop:1},
  splashWrap:{flex:1,backgroundColor:C.red,justifyContent:"center",alignItems:"center"},
  splashLogo:{alignItems:"center"},
  splashIconWrap:{width:110,height:110,borderRadius:28,backgroundColor:"rgba(255,255,255,0.15)",justifyContent:"center",alignItems:"center",marginBottom:20},
  splashBus:{fontSize:52},
  splashTitle:{color:C.white,fontSize:36,fontWeight:"800",letterSpacing:6},
  splashTitleSub:{color:"rgba(255,255,255,0.85)",fontSize:F.lg,fontWeight:"600",letterSpacing:8,marginTop:2},
  splashSub:{color:"rgba(255,255,255,0.65)",fontSize:F.sm,marginTop:10},
  splashDots:{marginTop:48},
  splashTag:{color:"rgba(255,255,255,0.5)",fontSize:F.xs,position:"absolute",bottom:44,letterSpacing:2},
  authHeader:{backgroundColor:C.red,paddingTop:Platform.OS==="android"?44:54,paddingBottom:32,alignItems:"center"},
  authHeaderIconWrap:{width:80,height:80,borderRadius:20,backgroundColor:"rgba(255,255,255,0.15)",justifyContent:"center",alignItems:"center",marginBottom:10},
  authHeaderBus:{fontSize:38},
  authHeaderTitle:{color:C.white,fontSize:F.xxl,fontWeight:"800",letterSpacing:1.5},
  authHeaderSub:{color:"rgba(255,255,255,0.75)",fontSize:F.sm,marginTop:4},
  authScroll:{padding:20,paddingBottom:50},
  authTabs:{flexDirection:"row",backgroundColor:C.chip,borderRadius:14,padding:4,marginBottom:20},
  authTab:{flex:1,paddingVertical:11,alignItems:"center",borderRadius:10},
  authTabActive:{backgroundColor:C.white,elevation:3},
  authTabText:{fontWeight:"600",color:C.textSub,fontSize:F.sm},
  authTabTextActive:{color:C.text,fontWeight:"700"},
  authForm:{backgroundColor:C.white,borderRadius:20,padding:20,borderWidth:1,borderColor:C.border},
  authFormTitle:{fontSize:F.xl,fontWeight:"700",color:C.text,marginBottom:4},
  authFormSub:{fontSize:F.sm,color:C.textSub,marginBottom:20},
  authLabel:{fontSize:F.xs,fontWeight:"700",color:C.textMid,marginBottom:6,marginTop:14,textTransform:"uppercase",letterSpacing:0.5},
  authInput:{borderWidth:1.5,borderColor:C.border,borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:F.sm,color:C.text,backgroundColor:C.white,marginBottom:2},
  passRow:{flexDirection:"row",marginBottom:2},
  eyeBtn:{borderWidth:1.5,borderColor:C.border,borderLeftWidth:0,borderTopRightRadius:12,borderBottomRightRadius:12,paddingHorizontal:14,justifyContent:"center",backgroundColor:C.white},
 navbar:{backgroundColor:C.red,flexDirection:"row",alignItems:"center",paddingHorizontal:16,paddingVertical:8,paddingTop:Platform.OS==="android"?40:10},
  navMenuIcon:{color:C.white,fontSize:24,fontWeight:"700"},
  navTitle:{color:C.white,fontSize:F.lg,fontWeight:"800",letterSpacing:0.3},
  navWallet:{backgroundColor:"rgba(255,255,255,0.18)",borderRadius:20,paddingHorizontal:12,paddingVertical:5},
  navWalletText:{color:C.white,fontWeight:"700",fontSize:F.xs},
  drawerOverlay:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.45)",zIndex:100},
  drawer:{position:"absolute",top:0,left:0,bottom:0,width:SW*0.82,backgroundColor:C.white,zIndex:200,elevation:20},
  drawerHeader:{backgroundColor:C.red,padding:20,paddingTop:Platform.OS==="android"?48:56,alignItems:"flex-start"},
  drawerAvatar:{width:58,height:58,borderRadius:29,backgroundColor:"rgba(255,255,255,0.25)",justifyContent:"center",alignItems:"center",marginBottom:12,borderWidth:2,borderColor:"rgba(255,255,255,0.4)"},
  drawerAvatarText:{color:C.white,fontSize:24,fontWeight:"700"},
  drawerName:{color:C.white,fontWeight:"700",fontSize:F.lg},
  drawerPhone:{color:"rgba(255,255,255,0.75)",fontSize:F.xs,marginTop:2},
  drawerWalletBadge:{marginTop:10,backgroundColor:"rgba(255,255,255,0.2)",borderRadius:20,paddingHorizontal:12,paddingVertical:5,alignSelf:"flex-start"},
  drawerWallet:{color:C.white,fontWeight:"700",fontSize:F.xs},
  drawerItem:{flexDirection:"row",alignItems:"center",paddingHorizontal:18,paddingVertical:15,borderBottomWidth:1,borderBottomColor:C.chip},
  drawerItemIconWrap:{width:36,height:36,borderRadius:10,backgroundColor:C.chip,justifyContent:"center",alignItems:"center",marginRight:14},
  drawerItemIcon:{fontSize:18},
  drawerItemLabel:{flex:1,fontSize:F.sm,fontWeight:"600",color:C.text},
  heroBanner:{backgroundColor:C.red,paddingHorizontal:20,paddingTop:22,paddingBottom:36},
  heroGreeting:{color:"rgba(255,255,255,0.8)",fontSize:F.sm,fontWeight:"500"},
  heroTitle:{color:C.white,fontSize:F.xxl,fontWeight:"800",marginTop:4},
  heroSub:{color:"rgba(255,255,255,0.7)",fontSize:F.xs,marginTop:6,letterSpacing:0.5},
  searchCard:{backgroundColor:C.white,borderRadius:24,margin:16,marginTop:-18,padding:20,elevation:6,borderWidth:1,borderColor:C.border},
  searchLabel:{fontSize:F.xs,fontWeight:"700",color:C.textSub,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5},
  inputWithIcon:{flexDirection:"row",alignItems:"center",borderWidth:1.5,borderColor:C.border,borderRadius:12,backgroundColor:C.white,paddingRight:4},
  inputIcon:{fontSize:16,paddingLeft:12,paddingRight:4},
  searchInputInner:{flex:1,paddingHorizontal:8,paddingVertical:13,fontSize:F.sm,color:C.text},
  sugBox:{position:"absolute",top:"100%",left:0,right:0,backgroundColor:C.white,borderWidth:1.5,borderColor:C.border,borderRadius:12,zIndex:999,maxHeight:200,elevation:10,marginTop:4},
  sugItem:{paddingHorizontal:16,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.chip},
  sugText:{fontSize:F.sm,color:C.text},
  swapBtn:{alignSelf:"center",backgroundColor:C.redLight,borderRadius:20,width:40,height:40,justifyContent:"center",alignItems:"center",marginVertical:8,borderWidth:1,borderColor:C.redBorder},
  swapBtnText:{fontSize:F.lg,color:C.red,fontWeight:"700"},
  dateBtnRow:{flexDirection:"row",gap:8,marginTop:6},
  dateBtn:{flex:1,borderWidth:1.5,borderColor:C.border,borderRadius:12,paddingVertical:10,alignItems:"center",backgroundColor:C.white},
  dateBtnActive:{backgroundColor:C.red,borderColor:C.red},
  dateBtnCalendar:{backgroundColor:C.chip,borderColor:C.border},
  dateBtnTop:{fontSize:F.xs,fontWeight:"700",color:C.text},
  dateBtnBot:{fontSize:F.xs,color:C.textSub,marginTop:1},
  dateBtnTextActive:{color:C.white},
  selectedDateText:{color:C.red,fontWeight:"700",fontSize:F.xs,marginTop:10,textAlign:"center"},
  calHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:C.red,paddingHorizontal:20,paddingVertical:16},
  calTitle:{color:C.white,fontWeight:"700",fontSize:F.lg},
  calArrow:{color:C.white,fontSize:22,fontWeight:"700",paddingHorizontal:10},
  calDayRow:{flexDirection:"row",paddingHorizontal:10,paddingVertical:10,backgroundColor:C.redLight},
  calDayLabel:{flex:1,textAlign:"center",fontWeight:"700",fontSize:F.xs,color:C.red},
  calGrid:{flexDirection:"row",flexWrap:"wrap",paddingHorizontal:10,paddingBottom:8,paddingTop:4},
  calCell: {
  width: "14.28%",
  aspectRatio: 1,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,   // ← circle shape
},
calCellText: {
  fontSize: 13,
  fontWeight: "400",
  color: C.text,
  textAlign: "center",
},
  calCellSelected:{backgroundColor:C.red,borderRadius:99},
  calCellText:{fontSize:F.sm,fontWeight:"500",color:C.text},
  modalOverlay:{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"center",alignItems:"center",padding:20},
  modalBox:{backgroundColor:C.white,borderRadius:24,padding:20,width:"100%",elevation:8},
  modalCloseBtn:{width:32,height:32,borderRadius:16,backgroundColor:"rgba(255,255,255,0.2)",justifyContent:"center",alignItems:"center"},
  filterScroll:{backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  filterChip:{borderWidth:1.5,borderColor:C.border,borderRadius:20,paddingHorizontal:16,paddingVertical:7,marginRight:8,backgroundColor:C.white},
  filterChipActive:{backgroundColor:C.red,borderColor:C.red},
  filterChipText:{fontSize:F.xs,fontWeight:"700",color:C.textMid},
  filterChipTextActive:{color:C.white},
  emptyText:{textAlign:"center",color:C.textSub,fontSize:F.md,marginTop:14},
  busCard:{backgroundColor:C.white,borderRadius:18,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border,elevation:2},
  busCardTop:{flexDirection:"row",marginBottom:10,alignItems:"flex-start"},
  busName:{fontSize:F.md,fontWeight:"700",color:C.text},
  busTypeRow:{flexDirection:"row",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"},
  busTypeBadge:{backgroundColor:C.redLight,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  busTypeBadgeText:{fontSize:F.xs,color:C.red,fontWeight:"700"},
  busPrice:{fontSize:F.xl,fontWeight:"800",color:C.red},
  busPriceSub:{fontSize:F.xs,color:C.textSub,textAlign:"right"},
  busSeatsLeft:{fontSize:F.xs,color:C.green,fontWeight:"700",marginTop:4,textAlign:"right"},
  busTimeRow:{flexDirection:"row",alignItems:"center",backgroundColor:C.chip,borderRadius:12,padding:12,marginVertical:8},
  busTimeValue:{fontSize:F.xl,fontWeight:"800",color:C.text},
  busTimeCity:{fontSize:F.xs,color:C.textSub,fontWeight:"600",marginTop:2,maxWidth:80,textAlign:"center"},
  busTimeLabel:{fontSize:9,color:C.textSub,marginTop:1},
  busDuration:{fontSize:F.xs,color:C.textSub,marginBottom:2},
  busTimeLine:{height:1.5,backgroundColor:C.border,width:"70%",marginVertical:3},
  busTimeArrow:{fontSize:14,marginTop:2},
  busCardBottom:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:6},
  busAmenities:{flexDirection:"row",flexWrap:"wrap",gap:4,flex:1},
  amenityChip:{backgroundColor:C.chip,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  amenityText:{fontSize:10,color:C.textMid,fontWeight:"600"},
  viewDetailBtn:{borderWidth:1.5,borderColor:C.red,borderRadius:10,paddingHorizontal:12,paddingVertical:8},
  viewDetailBtnText:{color:C.red,fontWeight:"700",fontSize:F.xs},
  bookNowBtn:{backgroundColor:C.red,borderRadius:10,paddingHorizontal:14,paddingVertical:8},
  bookNowBtnText:{color:C.white,fontWeight:"700",fontSize:F.xs},
  detailTimeCard:{backgroundColor:C.chip,borderRadius:16,padding:16,marginBottom:12},
  detailTimeCardTitle:{fontWeight:"700",fontSize:F.sm,color:C.text},
  detailTimeCell:{alignItems:"flex-start",minWidth:90},
  detailTimeCellLabel:{fontSize:F.xs,fontWeight:"600",color:C.textSub,marginBottom:4},
  detailTimeCellTime:{fontSize:30,fontWeight:"800",color:C.text},
  detailTimeCellCity:{fontSize:F.xs,color:C.textMid,marginTop:2,fontWeight:"600"},
  detailDuration:{fontSize:F.xs,color:C.textSub,marginBottom:4},
  detailPriceCard:{backgroundColor:C.greenLight,borderRadius:16,padding:16,alignItems:"center",borderWidth:1,borderColor:C.greenBorder,marginBottom:12},
  detailPriceLabel:{fontSize:F.xs,fontWeight:"700",color:C.green,textTransform:"uppercase",letterSpacing:0.5},
  detailPriceValue:{fontSize:34,fontWeight:"800",color:C.green},
  detailPriceSub:{fontSize:F.xs,color:C.textSub,marginTop:2},
  bookingTimeStrip:{flexDirection:"row",alignItems:"center",backgroundColor:C.white,paddingHorizontal:16,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border,flexWrap:"wrap",gap:6},
  bookingTimeItem:{fontSize:F.sm,color:C.text,fontWeight:"700"},
  bookingTimeSep:{color:C.textSub,fontSize:F.sm,marginHorizontal:4},
  bookingTimeDur:{fontSize:F.xs,color:C.textSub},
  bookingTabs:{flexDirection:"row",backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border,paddingHorizontal:0},
  bookingTab:{flex:1,paddingVertical:10,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:3},
  bookingTabActive:{borderBottomWidth:2.5,borderBottomColor:C.red},
  bookingTabNum:{width:18,height:18,borderRadius:9,backgroundColor:C.chip,justifyContent:"center",alignItems:"center"},
  bookingTabNumActive:{backgroundColor:C.red},
  bookingTabNumText:{fontSize:9,fontWeight:"700",color:C.textSub},
  bookingTabText:{fontSize:10,fontWeight:"600",color:C.textSub,textAlign:"center"},
  bookingTabTextActive:{color:C.red,fontWeight:"700"},
  seatScreenHeader:{flexDirection:"row",alignItems:"center",paddingHorizontal:16,paddingVertical:12,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  seatScreenTitle:{flex:1,fontSize:F.md,fontWeight:"700",color:C.text},
  seatInfoBtn:{paddingHorizontal:12,paddingVertical:6,borderRadius:8,borderWidth:1.5,borderColor:C.blueBorder},
  seaterSeat:{width:68,height:76,borderRadius:14,borderWidth:1.5,justifyContent:"center",alignItems:"center",margin:3,paddingVertical:5},
  seaterSeatNum:{fontSize:F.md,fontWeight:"800",marginTop:2},
  seaterPrice:{fontSize:10,fontWeight:"600",marginTop:3},
  sleeperSeat:{width:58,height:84,borderRadius:12,borderWidth:1.5,justifyContent:"flex-end",alignItems:"center",margin:3,overflow:"hidden"},
  selectedSummary:{backgroundColor:C.greenLight,borderRadius:16,padding:16,borderWidth:1.5,borderColor:C.greenBorder,marginHorizontal:10,marginVertical:8},
  selectedSummaryTitle:{fontWeight:"700",fontSize:F.sm,color:C.text},
  selectedSummarySeats:{fontSize:F.sm,fontWeight:"600",color:C.green,marginTop:4},
  selectedSummaryAmount:{fontSize:F.xxl,fontWeight:"800",color:C.red,marginTop:4},
  pointsTitle:{fontWeight:"700",fontSize:F.md,color:C.text,marginBottom:4},
  pointsSubTitle:{fontSize:F.sm,color:C.textSub,marginBottom:14},
  pointCard:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:10,borderWidth:1.5,borderColor:C.border},
  pointCardSelected:{borderColor:C.red,backgroundColor:C.redLight},
  pointRadio:{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:C.border,backgroundColor:C.white},
  pointRadioSelected:{borderColor:C.red,backgroundColor:C.red},
  pointName:{fontWeight:"700",fontSize:F.sm,color:C.text},
  pointAddress:{fontSize:F.xs,color:C.textSub,marginTop:2},
  pointTime:{fontWeight:"700",fontSize:F.sm,color:C.red},
  noPointsBox:{alignItems:"center",padding:40,marginTop:10},
  noPointsIcon:{fontSize:44,marginBottom:12},
  noPointsText:{fontSize:F.sm,fontWeight:"600",color:C.textMid,textAlign:"center"},
  tripSummaryCard:{backgroundColor:C.redLight,borderRadius:16,padding:16,borderWidth:1,borderColor:C.redBorder,marginBottom:14},
  tripSummaryTitle:{fontWeight:"700",fontSize:F.md,color:C.text},
  tripSummaryInfo:{fontSize:F.xs,color:C.textMid,marginTop:3},
  tripSummaryTimeRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginVertical:10},
  tripSummaryTimeLabel:{fontSize:F.xs,color:C.textSub,fontWeight:"600"},
  tripSummaryTimeVal:{fontSize:F.xxl,fontWeight:"800",color:C.red,marginTop:2},
  pointsInfoRow:{flexDirection:"row",backgroundColor:C.white,borderRadius:12,overflow:"hidden",borderWidth:1,borderColor:C.border,marginTop:10},
  pointsInfoCell:{flex:1,padding:12},
  pointsInfoLabel:{fontSize:F.xs,fontWeight:"600",color:C.textSub,marginBottom:3},
  pointsInfoValue:{fontWeight:"700",fontSize:F.sm,color:C.text},
  sectionLabel:{fontWeight:"700",fontSize:F.sm,color:C.text,marginTop:20,marginBottom:6},
  genderRow:{flexDirection:"row",gap:8,marginBottom:4},
  genderBtn:{flex:1,borderWidth:1.5,borderColor:C.border,borderRadius:10,paddingVertical:11,alignItems:"center",backgroundColor:C.white},
  genderBtnActive:{backgroundColor:C.red,borderColor:C.red},
  genderBtnText:{fontWeight:"600",color:C.textMid,fontSize:F.sm},
  genderBtnTextActive:{color:C.white},
  paymentRow:{flexDirection:"row",gap:8,marginTop:6,marginBottom:4},
  paymentBtn:{flex:1,borderWidth:1.5,borderColor:C.border,borderRadius:14,paddingVertical:14,alignItems:"center",justifyContent:"center",backgroundColor:C.white},
  paymentBtnActive:{borderColor:C.red,backgroundColor:C.redLight},
  paymentBtnIcon:{fontSize:22,marginBottom:4},
  paymentBtnText:{fontSize:F.xs,fontWeight:"600",color:C.textMid},
  paymentBtnTextActive:{color:C.red,fontWeight:"700"},
  offerRow:{flexDirection:"row",alignItems:"center",marginBottom:4},
  applyBtn:{backgroundColor:C.black,borderRadius:12,paddingHorizontal:16,paddingVertical:14},
  applyBtnText:{color:C.white,fontWeight:"700",fontSize:F.xs},
  appliedOfferBox:{backgroundColor:C.greenLight,borderRadius:10,padding:12,borderWidth:1,borderColor:C.greenBorder,marginTop:4},
  appliedOfferText:{color:C.green,fontWeight:"700",fontSize:F.xs},
  priceSummary:{backgroundColor:C.white,borderRadius:16,padding:16,borderWidth:1,borderColor:C.border,marginTop:16},
  priceRow:{flexDirection:"row",justifyContent:"space-between",paddingVertical:5},
  priceLabel:{fontSize:F.sm,color:C.textMid,fontWeight:"500"},
  priceValue:{fontSize:F.sm,fontWeight:"700",color:C.text},
  confirmedBanner:{backgroundColor:C.greenLight,borderRadius:18,padding:24,alignItems:"center",borderWidth:1.5,borderColor:C.greenBorder,marginBottom:16},
  confirmedEmoji:{fontSize:52},
  confirmedTitle:{fontSize:F.xl,fontWeight:"800",color:C.green,marginTop:10},
  confirmedId:{fontSize:F.xs,color:C.textMid,marginTop:4,fontWeight:"600"},
  ticketCard:{backgroundColor:C.white,borderRadius:20,overflow:"hidden",borderWidth:1,borderColor:C.border,elevation:3},
  ticketCardHead:{backgroundColor:C.red,padding:18,alignItems:"center"},
  ticketCardTitle:{color:C.white,fontWeight:"700",fontSize:F.lg},
  ticketCardSub:{color:"rgba(255,255,255,0.75)",fontSize:F.xs,marginTop:2},
  ticketRouteRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:16,backgroundColor:C.redLight},
  ticketCity:{fontSize:F.xl,fontWeight:"800",color:C.text},
  ticketTimeSub:{fontSize:F.xs,color:C.textSub,marginTop:2},
  ticketArrow:{fontSize:F.xxl,color:C.red},
  ticketTimeBar:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:C.chip,padding:16,borderBottomWidth:1,borderBottomColor:C.border},
  ticketTimeBarLabel:{fontSize:F.xs,fontWeight:"700",color:C.textSub,letterSpacing:1,marginBottom:4},
  ticketTimeBarVal:{fontSize:F.xxl,fontWeight:"800",color:C.text},
  ticketDivider:{height:1,backgroundColor:C.chip},
  ticketRow:{flexDirection:"row",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.chip},
  ticketRowLabel:{fontSize:F.sm,color:C.textSub,fontWeight:"500"},
  ticketRowValue:{fontSize:F.sm,fontWeight:"700",color:C.text,flex:1,textAlign:"right"},
  ticketAmountBox:{backgroundColor:C.greenLight,padding:18,alignItems:"center",margin:14,borderRadius:14,borderWidth:1,borderColor:C.greenBorder},
  ticketAmountLabel:{fontSize:F.xs,fontWeight:"700",color:C.green,textTransform:"uppercase",letterSpacing:1},
  ticketAmountValue:{fontSize:34,fontWeight:"800",color:C.green,marginTop:4},

  // ── Language Select ────────────────────────────────────────
  langScreenTitle:{fontSize:F.xl,fontWeight:"800",color:C.text,marginBottom:4,textAlign:"center"},
  langScreenSub:{fontSize:F.sm,color:C.textSub,textAlign:"center",marginBottom:28},
  langOption:{flexDirection:"row",alignItems:"center",padding:18,borderRadius:16,borderWidth:2,borderColor:C.border,backgroundColor:C.white,marginBottom:12},
  langOptionSelected:{borderColor:C.red,backgroundColor:C.redLight},
  langOptionFlag:{fontSize:30,marginRight:16},
  langOptionNative:{fontSize:F.xl,fontWeight:"700",color:C.text},
  langOptionSub:{fontSize:F.xs,color:C.textSub,marginTop:2},
  langOptionCheck:{width:26,height:26,borderRadius:13,backgroundColor:C.red,justifyContent:"center",alignItems:"center"},
// stylesheet (s = StyleSheet.create({...})) mdhye shेवटी add kar:

  devBadge:{marginTop:14,alignItems:"center",paddingTop:12,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.2)"},
  devBadgeText:{color:"rgba(255,255,255,0.9)",fontSize:F.xs,fontWeight:"700"},
  devBadgeContact:{color:"rgba(255,255,255,0.7)",fontSize:10,marginTop:3},

  devCard:{backgroundColor:C.white,borderRadius:16,padding:16,marginTop:12,borderWidth:1,borderColor:C.border,alignItems:"center"},
  devCardTitle:{fontSize:F.xs,color:C.textSub,fontWeight:"600",textTransform:"uppercase",letterSpacing:0.8},
  devCardName:{fontSize:F.lg,fontWeight:"800",color:C.text,marginTop:4},
  devCardRow:{flexDirection:"row",gap:16,marginTop:8,flexWrap:"wrap",justifyContent:"center"},
  devCardInfo:{fontSize:F.xs,color:C.textMid,fontWeight:"600"},
  authHeader:{
  backgroundColor:C.red,
  paddingTop:Platform.OS==="android"?44:54,
  paddingBottom:28,  // ✅ he vadav — 32 hota te 28+ karach
  alignItems:"center"
},
});