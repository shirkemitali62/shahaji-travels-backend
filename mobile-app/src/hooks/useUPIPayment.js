// ════════════════════════════════════════════════════════════════════════════════
// FILE: src/hooks/useUPIPayment.js
// DROP-IN replacement for all UPI payment logic in App.js
// ════════════════════════════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Linking, AppState, Platform,
  Modal, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator,
  ScrollView, Image, StyleSheet, Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";

const API_BASE = "https://shahaji-travels-backend.onrender.com";

// ─── UTR format validator (mirrors backend) ──────────────────────────────────
function isValidUTRFormat(utr) {
  if (!utr || typeof utr !== "string") return false;
  const clean = utr.trim().toUpperCase().replace(/\s+/g, "");
  if (clean.length < 8 || clean.length > 35)  return false;
  if (!/^[A-Z0-9]+$/.test(clean)) return false;
  return true;
}

// ─── Generate UPI deep link ───────────────────────────────────────────────────
export function generateUPILink({ upiId, payeeName, amount, note = "Shahaji Travels Booking" }) {
  const params = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${Number(amount).toFixed(2)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(note)}`,
  ].join("&");
  return `upi://pay?${params}`;
}

// ─── Per-app intent URLs ──────────────────────────────────────────────────────
export function getAppUPILinks(upiId, payeeName, amount) {
  const base = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Shahaji Travels Booking")}`;

  return {
    gpay: `upi://pay?${base}`,      // 🔥 CHANGE
    phonepe: `upi://pay?${base}`,   // 🔥 CHANGE
    paytm: `upi://pay?${base}`,     // 🔥 CHANGE
    generic: `upi://pay?${base}`,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// HOOK — useUPIPayment
// ════════════════════════════════════════════════════════════════════════════════
export function useUPIPayment({ showAlert, setLoading, setLoadMsg }) {
  const [upiModalVisible,  setUPIModalVisible]  = useState(false);
  const [utrModalVisible,  setUTRModalVisible]  = useState(false);
  const [utrValue,         setUTRValue]         = useState("");
  const [paymentState,     setPaymentState]     = useState("idle");
  // idle | opening_app | waiting_return | verifying | success | failed
  const [currentPayment,   setCurrentPayment]   = useState(null);
  const [qrSettings,       setQrSettings]       = useState(null);
  const [pollCount,        setPollCount]        = useState(0);

  const appStateRef    = useRef(AppState.currentState);
  const pollTimerRef   = useRef(null);
  const returnTimerRef = useRef(null);

  // ── Load QR settings once ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/qr-settings`)
      .then(r => r.json())
      .then(d => { if (d.settings) setQrSettings(d.settings); })
      .catch(() => {});
  }, []);

  // ── AppState listener — detect when user returns from UPI app ──────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // User came back to app from background (returned from UPI app)
      if (
        paymentState === "opening_app" &&
        prev === "background" &&
        nextState === "active"
      ) {
        clearTimeout(returnTimerRef.current);
        setPaymentState("waiting_return");
        // Give 500ms buffer then show UTR modal
        setTimeout(() => {
          setUPIModalVisible(false);
          setUTRModalVisible(true);
          setPaymentState("waiting_return");
        }, 600);
      }
    });
    return () => sub.remove();
  }, [paymentState]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(returnTimerRef.current);
      clearInterval(pollTimerRef.current);
    };
  }, []);

  // ── Step 1: Initialize payment record on backend ───────────────────────────
  const initPayment = useCallback(async ({ bookingId, amount, userId, phone, busId, journeyDate }) => {
    try {
      const res = await fetch(`${API_BASE}/api/upi/init-payment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, amount, userId, phone, busId, journeyDate }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not initialize payment");
      setCurrentPayment(data.payment);
      return data.payment;
    } catch (err) {
      throw err;
    }
  }, []);

  // ── Step 2: Open a specific UPI app ───────────────────────────────────────
  const openUPIApp = useCallback(async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        // Try generic upi:// fallback
        const genericUrl = currentPayment
          ? generateUPILink({
              upiId:     qrSettings?.upiId    || "kavirajbarge@ybl",
              payeeName: qrSettings?.upiName  || "SHAHAJI TRAVELS",
              amount:    currentPayment.amount,
            })
          : null;
        if (genericUrl) {
          const canGeneric = await Linking.canOpenURL(genericUrl);
          if (canGeneric) {
            setPaymentState("opening_app");
            await Linking.openURL(genericUrl);

            // Fallback: if AppState doesn't fire in 60s, auto-show UTR modal
            returnTimerRef.current = setTimeout(() => {
              setUPIModalVisible(false);
              setUTRModalVisible(true);
              setPaymentState("waiting_return");
            }, 60000);
            return true;
          }
        }
        showAlert(
          "UPI App Not Found",
          "Please install Google Pay, PhonePe, or Paytm, or copy the UPI ID and pay manually."
        );
        return false;
      }

      setPaymentState("opening_app");
      await Linking.openURL(url);

      // Safety timer — if user doesn't return in 60s, still show UTR modal
      returnTimerRef.current = setTimeout(() => {
        if (appStateRef.current !== "active") return;
        setUPIModalVisible(false);
        setUTRModalVisible(true);
        setPaymentState("waiting_return");
      }, 60000);

      return true;
    } catch (err) {
      showAlert("Error", "Could not open UPI app. Please pay manually using the UPI ID.");
      return false;
    }
  }, [currentPayment, qrSettings, showAlert]);

  // ── Step 3: Verify UTR with backend ───────────────────────────────────────
  const verifyUTR = useCallback(async (utr) => {
    if (!currentPayment) {
      showAlert("Error", "Payment session expired. Please start again.");
      return false;
    }
    if (!isValidUTRFormat(utr)) {
      showAlert(
        "Invalid UTR",
        "Please enter a valid UTR / Transaction ID from your UPI app.\n\nFind it in: UPI App → Transaction History → Share/Copy."
      );
      return false;
    }

    setPaymentState("verifying");
    setLoading(true);
    setLoadMsg("Verifying payment...");

    try {
      const res = await fetch(`${API_BASE}/api/upi/verify-payment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          bookingId: currentPayment.bookingId,
          utr:       utr.trim().toUpperCase(),
          amount:    currentPayment.amount,
        }),
      });
      const data = await res.json();

      setLoading(false);

      if (data.success) {
        setPaymentState("success");
        setUTRModalVisible(false);
        clearInterval(pollTimerRef.current);
        return { success: true, booking: data.booking, payment: data.payment };
      } else {
        setPaymentState("waiting_return");
        const errMessages = {
          DUPLICATE_UTR:      "This UTR has already been used. Please check and enter the correct transaction ID.",
          PAYMENT_EXPIRED:    "Payment session expired (30 min). Please start a new booking.",
          AMOUNT_MISMATCH:    data.message,
          INVALID_UTR_FORMAT: "UTR format is incorrect. Check your UPI app's transaction history.",
        };
        showAlert("Verification Failed", errMessages[data.errorCode] || data.message || "Could not verify payment.");
        return false;
      }
    } catch (err) {
      setLoading(false);
      setPaymentState("waiting_return");
      showAlert("Network Error", "Could not verify payment. Please check your internet and try again.");
      return false;
    }
  }, [currentPayment, showAlert, setLoading, setLoadMsg]);

  // ── Poll for admin confirmation (Option B) ────────────────────────────────
  const startPolling = useCallback((bookingId, onConfirmed) => {
    clearInterval(pollTimerRef.current);
    setPollCount(0);
    pollTimerRef.current = setInterval(async () => {
      setPollCount(c => {
        if (c >= 36) {  // max 3 minutes (36 × 5s)
          clearInterval(pollTimerRef.current);
          return c;
        }
        return c + 1;
      });
      try {
        const res  = await fetch(`${API_BASE}/api/upi/payment-status/${bookingId}`);
        const data = await res.json();
        if (data.status === "success") {
          clearInterval(pollTimerRef.current);
          onConfirmed(data.payment);
        }
      } catch (_) {}
    }, 5000);
  }, []);

  const stopPolling = useCallback(() => {
    clearInterval(pollTimerRef.current);
  }, []);

  // ── Reset all state ────────────────────────────────────────────────────────
  const resetPayment = useCallback(() => {
    setUPIModalVisible(false);
    setUTRModalVisible(false);
    setUTRValue("");
    setPaymentState("idle");
    setCurrentPayment(null);
    setPollCount(0);
    clearTimeout(returnTimerRef.current);
    clearInterval(pollTimerRef.current);
  }, []);

  return {
    // State
    upiModalVisible, setUPIModalVisible,
    utrModalVisible, setUTRModalVisible,
    utrValue,        setUTRValue,
    paymentState,    currentPayment,
    qrSettings,      pollCount,
    // Actions
    initPayment, openUPIApp, verifyUTR,
    startPolling, stopPolling, resetPayment,
  };
}


// ════════════════════════════════════════════════════════════════════════════════
// COMPONENT: UPIPaymentModal
// Full-screen UPI selection + QR display
// ════════════════════════════════════════════════════════════════════════════════
export function UPIPaymentModal({
  visible, onClose,
  amount, bookingId,
  qrSettings,
  onAppOpened,  // called after user taps an app button
}) {
  const upiId    = qrSettings?.upiId    || "kavirajbarge@ybl";
  const upiName  = qrSettings?.upiName  || "SHAHAJI TRAVELS";
  const appLinks = getAppUPILinks(upiId, upiName, amount);

  const handleCopyUPI = async () => {
    await Clipboard.setStringAsync(upiId);
  };

  const appList = [
    {
      name: "Google Pay",
      url:  appLinks.gpay,
      bg:   "#fff",
      border: "#E8E8E8",
      btnBg: "#4285F4",
      icon: () => (
        <View style={[uSt.appIconBox, { borderWidth: 1.5, borderColor: "#E8E8E8" }]}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#4285F4" }}>G</Text>
        </View>
      ),
    },
    {
      name: "PhonePe",
      url:  appLinks.phonepe,
      bg:   "#F8F0FF",
      border: "#E8D5FF",
      btnBg: "#5F259F",
      icon: () => (
        <View style={[uSt.appIconBox, { backgroundColor: "#5F259F" }]}>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: "#fff", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
          </View>
        </View>
      ),
    },
    {
      name: "Paytm",
      url:  appLinks.paytm,
      bg:   "#F0FBFF",
      border: "#BAE6FD",
      btnBg: "#00BAF2",
      icon: () => (
        <View style={[uSt.appIconBox, { backgroundColor: "#00BAF2" }]}>
          <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff" }}>Pay</Text>
        </View>
      ),
    },
    {
      name: "Any UPI App",
      url:  appLinks.generic,
      bg:   "#FFF5F5",
      border: "#FFD0D0",
      btnBg: "#C0392B",
      icon: () => (
        <View style={[uSt.appIconBox, { backgroundColor: "#C0392B" }]}>
          <Text style={{ fontSize: 18 }}>📲</Text>
        </View>
      ),
    },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={uSt.overlay}>
        <View style={uSt.sheet}>
          {/* Handle */}
          <View style={uSt.handle} />

          {/* Header */}
          <View style={uSt.header}>
            <View>
              <Text style={uSt.headerTitle}>Pay with UPI</Text>
              <Text style={uSt.headerSub}>Scan · Pay · Enter UTR</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={uSt.closeBtn}>
              <Text style={uSt.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

            {/* Amount hero */}
            <View style={uSt.amountCard}>
              <Text style={uSt.amountLabel}>TOTAL TO PAY</Text>
              <Text style={uSt.amountValue}>₹{amount}</Text>
              <Text style={uSt.amountBookingId}>Booking: {bookingId}</Text>
            </View>

            {/* QR Code */}
            {qrSettings?.qrImageBase64 ? (
              <View style={uSt.qrCard}>
                <Text style={uSt.qrCardTitle}>Scan with any UPI app</Text>
                <View style={uSt.qrBorder}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${qrSettings.qrImageBase64}` }}
                    style={uSt.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={uSt.qrAmount}>₹{amount}</Text>
                {/* UPI ID row with copy */}
                <TouchableOpacity style={uSt.upiRow} onPress={handleCopyUPI} activeOpacity={0.7}>
                  <View style={uSt.upiAtBadge}><Text style={{ color: "#fff", fontWeight: "800" }}>@</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={uSt.upiIdText}>{upiId}</Text>
                    <Text style={uSt.upiNameText}>{upiName}</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>📋</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* App buttons */}
            <View style={uSt.appsCard}>
              <Text style={uSt.appsTitle}>Open directly in app</Text>
              <Text style={uSt.appsSub}>₹{amount} auto-filled · Pay · Enter UTR</Text>
              {appList.map((app, i) => (
                <TouchableOpacity
                  key={i}
                  style={[uSt.appRow, { backgroundColor: app.bg, borderColor: app.border }]}
                  activeOpacity={0.78}
                  onPress={() => {
                    onAppOpened(app.url);
                  }}
                >
                  {app.icon()}
                  <View style={{ flex: 1 }}>
                    <Text style={uSt.appName}>{app.name}</Text>
                    <Text style={uSt.appSub}>₹{amount} · auto-filled</Text>
                  </View>
                  <View style={[uSt.openBtn, { backgroundColor: app.btnBg }]}>
                    <Text style={uSt.openBtnText}>Open →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Steps */}
            <View style={uSt.stepsCard}>
              <Text style={uSt.stepsTitle}>How to pay</Text>
              {[
                "Open GPay / PhonePe / Paytm",
                "Scan QR or tap an app button above",
                `Enter amount ₹${amount} if needed`,
                "Complete payment & note UTR number",
                "Come back here and enter UTR",
              ].map((step, i) => (
                <View key={i} style={uSt.stepRow}>
                  <View style={uSt.stepNumBadge}>
                    <Text style={uSt.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={uSt.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Manual UTR entry shortcut */}
            <View style={uSt.noteBox}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={uSt.noteText}>
                After paying, tap any app button above — you'll be returned here to enter your UTR and confirm booking.
              </Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════════════════════════════
// COMPONENT: UTRVerificationModal
// Shown after user returns from UPI app
// ════════════════════════════════════════════════════════════════════════════════
export function UTRVerificationModal({
  visible, onClose,
  utrValue, setUTRValue,
  onVerify, onPaidAlready,
  verifying,
  amount, bookingId,
  pollCount,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [utrBoxes, setUtrBoxes] = useState(Array(12).fill(""));
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 350);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  const isValid  = isValidUTRFormat(utrValue);
  const disabled = !isValid || verifying;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={uSt.overlay}>
        <View style={[uSt.sheet, { maxHeight: "90%" }]}>
          <View style={uSt.handle} />

          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 44 }} keyboardShouldPersistTaps="handled">

            {/* Icon */}
            <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 18 }}>
              <Animated.View style={[uSt.verifyIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={{ fontSize: 34 }}>🔐</Text>
              </Animated.View>
              <Text style={uSt.verifyTitle}>Enter UTR Number</Text>
              <Text style={uSt.verifySub}>
                Payment of <Text style={{ color: "#C0392B", fontWeight: "700" }}>₹{amount}</Text> complete झाल्यावर{"\n"}UTR / Transaction ID enter करा
              </Text>
            </View>

            {/* Booking ID chip */}
            <View style={uSt.bookingChip}>
              <Text style={uSt.bookingChipLabel}>BOOKING ID</Text>
              <Text style={uSt.bookingChipValue}>{bookingId}</Text>
            </View>

            {/* UTR Input */}
            <View style={{ marginBottom: 18 }}>
              <Text style={uSt.utrLabel}>UTR / Transaction ID *</Text>
              <View style={[uSt.utrInputBox, isValid && uSt.utrInputBoxValid]}>
                <View style={[uSt.utrInputPrefix, isValid && { backgroundColor: "#1A1A2E" }]}>
                  <Text style={{ fontSize: 16, color: isValid ? "#fff" : "#999" }}>🔢</Text>
                </View>
                <TextInput
                  ref={inputRef}
                  style={uSt.utrInput}
                  value={utrValue}
                  onChangeText={v => setUTRValue(v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 35))}
                  placeholder="e.g. 407312345678901"
                  placeholderTextColor="#C7C7CC"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
                  maxLength={35}
                />
                {isValid && (
                  <View style={uSt.utrCheckBox}>
                    <Text style={{ color: "#27AE60", fontWeight: "800", fontSize: 18 }}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={uSt.utrHint}>
                Where to find UTR: UPI App → Transaction History → tap payment → Share/Copy
              </Text>
            </View>

            {/* Admin poll indicator */}
            {pollCount > 0 && pollCount < 36 && (
              <View style={uSt.pollBox}>
                <ActivityIndicator size="small" color="#f59e0b" />
                <Text style={uSt.pollText}>
                  Admin verification check: {pollCount}/36... ({Math.round((36 - pollCount) * 5 / 60)} min left)
                </Text>
              </View>
            )}

            {/* Verify button */}
            <TouchableOpacity
              style={[uSt.verifyBtn, disabled && uSt.verifyBtnDisabled]}
              onPress={() => onVerify(utrValue)}
              disabled={disabled}
              activeOpacity={0.85}
            >
              {verifying
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={uSt.verifyBtnText}>✓ Verify Payment</Text>}
            </TouchableOpacity>

            {/* Already paid */}
            <TouchableOpacity style={uSt.alreadyPaidBtn} onPress={onPaidAlready} activeOpacity={0.75}>
              <Text style={uSt.alreadyPaidText}>Payment deducted but no UTR?</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity style={uSt.cancelBtn} onPress={onClose}>
              <Text style={uSt.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>

            {/* Info */}
            <Text style={uSt.infoNote}>🔒 UTR verified securely. Duplicate UTRs are rejected.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════════════════════════════
// STYLESHEET
// ════════════════════════════════════════════════════════════════════════════════
const uSt = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:           { backgroundColor: "#F5F6FA", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", maxHeight: "96%" },
  handle:          { width: 40, height: 4, borderRadius: 2, backgroundColor: "#DDD", alignSelf: "center", marginTop: 10, marginBottom: 2 },

  // Header
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EBEBEB" },
  headerTitle:     { fontSize: 18, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.4 },
  headerSub:       { fontSize: 12, color: "#888", marginTop: 2 },
  closeBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EBEBEB", justifyContent: "center", alignItems: "center" },
  closeBtnText:    { fontSize: 16, color: "#555", fontWeight: "700" },

  // Amount card
  amountCard:      { backgroundColor: "#1A1A2E", borderRadius: 18, padding: 20, marginBottom: 12, alignItems: "center" },
  amountLabel:     { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  amountValue:     { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  amountBookingId: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 6 },

  // QR card
  qrCard:          { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#EBEBEB" },
  qrCardTitle:     { fontSize: 13, fontWeight: "700", color: "#1A1A2E", marginBottom: 14 },
  qrBorder:        { padding: 10, borderRadius: 14, backgroundColor: "#fff", borderWidth: 3, borderColor: "#1A1A2E" },
  qrImage:         { width: 180, height: 180, borderRadius: 8 },
  qrAmount:        { fontSize: 15, fontWeight: "800", color: "#C0392B", marginTop: 12 },
  upiRow:          { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, backgroundColor: "#F5F6FA", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#EBEBEB", width: "100%" },
  upiAtBadge:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1A1A2E", justifyContent: "center", alignItems: "center" },
  upiIdText:       { fontSize: 15, fontWeight: "800", color: "#1A1A2E" },
  upiNameText:     { fontSize: 11, color: "#888", marginTop: 1 },

  // Apps
  appsCard:        { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#EBEBEB" },
  appsTitle:       { fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  appsSub:         { fontSize: 11, color: "#999", marginBottom: 14 },
  appRow:          { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 12, borderWidth: 1.5, gap: 12, marginBottom: 8 },
  appIconBox:      { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  appName:         { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  appSub:          { fontSize: 11, color: "#888", marginTop: 1 },
  openBtn:         { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  openBtnText:     { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Steps
  stepsCard:       { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#EBEBEB" },
  stepsTitle:      { fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 },
  stepRow:         { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepNumBadge:    { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1A1A2E", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  stepNum:         { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText:        { fontSize: 13, color: "#444", lineHeight: 22, flex: 1, marginTop: 3 },

  // Note
  noteBox:         { backgroundColor: "#FFF8E1", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FFE082", flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 4 },
  noteText:        { fontSize: 12, color: "#795548", lineHeight: 18, flex: 1 },

  // UTR modal
  verifyIconWrap:  { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FDECEA", justifyContent: "center", alignItems: "center", marginBottom: 14, borderWidth: 1.5, borderColor: "#F5C6C2" },
  verifyTitle:     { fontSize: 22, fontWeight: "800", color: "#1C1C1E", marginBottom: 8 },
  verifySub:       { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 21, marginBottom: 10 },

  bookingChip:     { backgroundColor: "#E8F4FE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: "#0A84FF", marginBottom: 20 },
  bookingChipLabel:{ fontSize: 9, fontWeight: "700", color: "#0A84FF", letterSpacing: 2 },
  bookingChipValue:{ fontSize: 18, fontWeight: "700", color: "#0070D0", letterSpacing: 2, marginTop: 2 },

  utrLabel:        { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  utrInputBox:     { flexDirection: "row", borderWidth: 2, borderColor: "#EBEBEB", borderRadius: 14, overflow: "hidden", backgroundColor: "#F5F6FA" },
  utrInputBoxValid:{ borderColor: "#1A1A2E" },
  utrInputPrefix:  { paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#EBEBEB" },
  utrInput:        { flex: 1, paddingHorizontal: 14, paddingVertical: 15, fontSize: 16, color: "#1A1A2E", fontWeight: "700", letterSpacing: 1.5, backgroundColor: "#fff" },
  utrCheckBox:     { paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#EAFAF1" },
  utrHint:         { fontSize: 11, color: "#999", marginTop: 8, lineHeight: 16 },

  pollBox:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF8E1", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#FFE082" },
  pollText:        { fontSize: 12, color: "#795548", flex: 1 },

  verifyBtn:       { backgroundColor: "#1A1A2E", borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 12 },
  verifyBtnDisabled:{ backgroundColor: "#EBEBEB" },
  verifyBtnText:   { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },

  alreadyPaidBtn:  { alignItems: "center", paddingVertical: 10, marginBottom: 4 },
  alreadyPaidText: { fontSize: 13, color: "#C0392B", fontWeight: "600", textDecorationLine: "underline" },
  cancelBtn:       { alignItems: "center", paddingVertical: 10, marginBottom: 8 },
  cancelText:      { fontSize: 13, color: "#999", fontWeight: "600" },
  infoNote:        { fontSize: 11, color: "#BBB", textAlign: "center" },
});