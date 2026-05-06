// ════════════════════════════════════════════════════════════════════════════════
// FILE: src/hooks/useUPIPayment.js
// PRODUCTION-READY — Zero crash, full fallback, AppState aware
// FIXES: UPI link validation, canOpenURL check, safe encoding, error recovery
// ════════════════════════════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Linking,
  AppState,
  Platform,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";

const API_BASE = "https://shahaji-travels-backend.onrender.com";

// ─── SAFE ENCODING HELPER ────────────────────────────────────────────────────
// Never throws — always returns a string
function safeEncode(str) {
  try {
    return encodeURIComponent(String(str || ""));
  } catch {
    return "";
  }
}

// ─── UPI LINK BUILDER ────────────────────────────────────────────────────────
// Returns null if upiId is missing/invalid (caller must handle null)
export function buildUPILink({ upiId, payeeName, amount, note }) {
  // Validate required fields
  if (!upiId || typeof upiId !== "string" || !upiId.includes("@")) {
    return null;
  }
  const safeAmount = parseFloat(amount);
  if (!safeAmount || safeAmount <= 0 || isNaN(safeAmount)) {
    return null;
  }

  const pa = safeEncode(upiId.trim());
  const pn = safeEncode((payeeName || "Shahaji Travels").trim());
  const am = safeAmount.toFixed(2);
  const cu = "INR";
  const tn = safeEncode((note || "Shahaji Travels Booking").trim());

 return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}&tr=${Date.now()}`;
}

// ─── SAFE URL OPENER ─────────────────────────────────────────────────────────
// Returns { opened: boolean, error: string|null }
async function safeOpenURL(url) {
  if (!url) {
    return { opened: false, error: "UPI link could not be generated. UPI ID missing." };
  }

  try {
    // canOpenURL can itself throw on some Android versions
    let canOpen = false;
    try {
      canOpen = await Linking.canOpenURL(url);
    } catch {
      // On Android, canOpenURL often throws for custom schemes without manifest entry
      // We attempt to open anyway and catch the error
      canOpen = true;
    }

    if (!canOpen) {
      return {
        opened: false,
        error: "No UPI app found on this device. Please install Google Pay, PhonePe, or Paytm.",
      };
    }

    await Linking.openURL(url);
    return { opened: true, error: null };
  } catch (err) {
    return {
      opened: false,
      error: "Could not open UPI app. Please pay using the UPI ID shown on screen.",
    };
  }
}

// ─── UTR VALIDATOR ───────────────────────────────────────────────────────────
export function isValidUTRFormat(utr) {
  if (!utr || typeof utr !== "string") return false;
  const clean = utr.trim().toUpperCase().replace(/\s+/g, "");
  if (clean.length < 8 || clean.length > 35) return false;
  if (!/^[A-Z0-9]+$/.test(clean)) return false;
  return true;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ════════════════════════════════════════════════════════════════════════════════
export function useUPIPayment({ showAlert, setLoading, setLoadMsg }) {
  const [upiModalVisible, setUPIModalVisible] = useState(false);
  const [utrModalVisible, setUTRModalVisible] = useState(false);
  const [utrValue, setUTRValue] = useState("");
  const [paymentState, setPaymentState] = useState("idle");
  // idle | opening_app | waiting_return | verifying | success | failed
  const [currentPayment, setCurrentPayment] = useState(null);
  const [qrSettings, setQrSettings] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [qrSettingsLoading, setQrSettingsLoading] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const pollTimerRef = useRef(null);
  const returnTimerRef = useRef(null);
  const hasReturnedRef = useRef(false); // prevent double-trigger

  // ── Load QR settings safely ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      setQrSettingsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/qr-settings`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data?.settings) {
          setQrSettings(data.settings);
        }
      } catch (err) {
        // Silent — fallback UI will handle missing settings
        console.log("[UPI] QR settings load failed:", err?.message);
      } finally {
        if (!cancelled) setQrSettingsLoading(false);
      }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, []);

  // ── AppState: detect return from UPI app ──────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        paymentState === "opening_app" &&
        prev === "background" &&
        nextState === "active" &&
        !hasReturnedRef.current
      ) {
        hasReturnedRef.current = true;
        clearTimeout(returnTimerRef.current);

        // Small delay to let the app fully foreground
        setTimeout(() => {
          setUPIModalVisible(false);
          setUTRModalVisible(true);
          setPaymentState("waiting_return");
        }, 500);
      }
    });

    return () => sub.remove();
  }, [paymentState]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(returnTimerRef.current);
      clearInterval(pollTimerRef.current);
    };
  }, []);

  // ── Step 1: Initialize payment record on backend ──────────────────────────
  const initPayment = useCallback(
    async ({ bookingId, amount, userId, phone, busId, journeyDate }) => {
      if (!bookingId || !amount || amount <= 0) {
        throw new Error("Invalid booking ID or amount.");
      }
      try {
        const res = await fetch(`${API_BASE}/api/upi/init-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            amount: Number(amount),
            userId: userId || "",
            phone: phone || "",
            busId: busId || "",
            journeyDate: journeyDate || "",
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Server error ${res.status}`);
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Could not initialize payment.");
        setCurrentPayment(data.payment);
        return data.payment;
      } catch (err) {
        throw new Error(err?.message || "Payment initialization failed.");
      }
    },
    []
  );

  // ── Step 2: Open a UPI app safely ─────────────────────────────────────────
  const openUPIApp = useCallback(
    async (urlOrNull) => {
      // Get UPI settings
      const upiId = qrSettings?.upiId || "";
      const upiName = qrSettings?.upiName || "Shahaji Travels";
      const amount = currentPayment?.amount;

      // Build a safe URL if the passed one is null/bad
      let finalUrl = urlOrNull;
      if (!finalUrl || typeof finalUrl !== "string") {
        finalUrl = buildUPILink({ upiId, payeeName: upiName, amount, note: "Shahaji Travels Booking" });
      }

      // If still null — UPI ID is missing
      if (!finalUrl) {
        showAlert(
          "UPI Not Configured",
          `UPI payment is not available right now. Please contact support or pay by cash.\n\nUPI ID: ${upiId || "Not available"}`
        );
        return false;
      }

      hasReturnedRef.current = false;
      setPaymentState("opening_app");

      const { opened, error } = await safeOpenURL(finalUrl);

      if (!opened) {
        setPaymentState("idle");
        // Show manual payment option instead of just an error
        showAlert(
          "Cannot Open UPI App",
          `${error}\n\nYou can pay manually:\nUPI ID: ${upiId || "Contact support"}\nAmount: ₹${amount || 0}`,
          [
            { text: "I Paid Manually", onPress: () => { setUTRModalVisible(true); setPaymentState("waiting_return"); } },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return false;
      }

      // Safety fallback — if AppState doesn't fire within 90s, show UTR modal
      returnTimerRef.current = setTimeout(() => {
        if (paymentState === "opening_app" && !hasReturnedRef.current) {
          hasReturnedRef.current = true;
          setUPIModalVisible(false);
          setUTRModalVisible(true);
          setPaymentState("waiting_return");
        }
      }, 90_000);

      return true;
    },
    [qrSettings, currentPayment, paymentState, showAlert]
  );

  // ── Step 3: Verify UTR with backend ───────────────────────────────────────
  const verifyUTR = useCallback(
    async (utr) => {
      if (!currentPayment) {
        showAlert("Session Expired", "Payment session has expired. Please start a new booking.");
        return false;
      }

      const cleanUTR = String(utr || "").trim().toUpperCase().replace(/\s+/g, "");

      if (!isValidUTRFormat(cleanUTR)) {
        showAlert(
          "Invalid UTR",
          "Please enter a valid UTR/Transaction ID from your UPI app.\n\nWhere to find it:\nUPI App → Transaction History → tap payment → Copy/Share"
        );
        return false;
      }

      setPaymentState("verifying");
      if (setLoading) setLoading(true);
      if (setLoadMsg) setLoadMsg("Verifying payment...");

      try {
        const res = await fetch(`${API_BASE}/api/upi/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: currentPayment.bookingId,
            utr: cleanUTR,
            amount: currentPayment.amount,
          }),
        });

        if (setLoading) setLoading(false);

        // Handle non-JSON or network errors
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          setPaymentState("waiting_return");
          showAlert("Verification Failed", errText || `Server error (${res.status}). Please try again.`);
          return false;
        }

        const data = await res.json();

        if (data.success) {
          setPaymentState("success");
          setUTRModalVisible(false);
          clearInterval(pollTimerRef.current);
          return { success: true, booking: data.booking, payment: data.payment };
        } else {
          setPaymentState("waiting_return");
          const errorMap = {
            DUPLICATE_UTR: "This UTR has already been used for another booking. Please check and enter the correct transaction ID.",
            PAYMENT_EXPIRED: "Payment session has expired (30 min limit). Please start a new booking.",
            AMOUNT_MISMATCH: data.message || "Amount does not match. Please contact support.",
            INVALID_UTR_FORMAT: "UTR format is incorrect. Check your UPI app's transaction history.",
          };
          const msg = errorMap[data.errorCode] || data.message || "Could not verify payment. Please try again.";
          showAlert("Verification Failed", msg);
          return false;
        }
      } catch (err) {
        if (setLoading) setLoading(false);
        setPaymentState("waiting_return");
        showAlert(
          "Network Error",
          "Could not verify payment. Please check your internet connection and try again.\n\nIf money was deducted, note your UTR and contact support."
        );
        return false;
      }
    },
    [currentPayment, showAlert, setLoading, setLoadMsg]
  );

  // ── Poll for admin confirmation ───────────────────────────────────────────
  const startPolling = useCallback(
    (bookingId, onConfirmed) => {
      clearInterval(pollTimerRef.current);
      setPollCount(0);
      let count = 0;

      pollTimerRef.current = setInterval(async () => {
        count += 1;
        setPollCount(count);

        if (count >= 36) {
          // 3 minutes max
          clearInterval(pollTimerRef.current);
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/api/upi/payment-status/${bookingId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === "success") {
            clearInterval(pollTimerRef.current);
            onConfirmed(data.payment);
          }
        } catch {
          // Network blip — keep polling
        }
      }, 5000);
    },
    []
  );

  const stopPolling = useCallback(() => {
    clearInterval(pollTimerRef.current);
  }, []);

  // ── Reset everything ──────────────────────────────────────────────────────
  const resetPayment = useCallback(() => {
    setUPIModalVisible(false);
    setUTRModalVisible(false);
    setUTRValue("");
    setPaymentState("idle");
    setCurrentPayment(null);
    setPollCount(0);
    hasReturnedRef.current = false;
    clearTimeout(returnTimerRef.current);
    clearInterval(pollTimerRef.current);
  }, []);

  return {
    upiModalVisible, setUPIModalVisible,
    utrModalVisible, setUTRModalVisible,
    utrValue, setUTRValue,
    paymentState, currentPayment,
    qrSettings, qrSettingsLoading,
    pollCount,
    initPayment,
    openUPIApp,
    verifyUTR,
    startPolling,
    stopPolling,
    resetPayment,
  };
}


// ════════════════════════════════════════════════════════════════════════════════
// COMPONENT: UPIPaymentModal
// Full-screen UPI selection + QR display — crash-proof
// ════════════════════════════════════════════════════════════════════════════════
export function UPIPaymentModal({
  visible,
  onClose,
  amount,
  bookingId,
  qrSettings,
  onAppOpened,
}) {
  if (!visible) return null;

  const upiId = qrSettings?.upiId || "";
  const upiName = qrSettings?.upiName || "Shahaji Travels";
  const hasValidUPI = upiId && upiId.includes("@");

  // Build per-app URLs — returns null if UPI invalid
  const makeURL = (scheme) => {
    const base = buildUPILink({ upiId, payeeName: upiName, amount, note: "Shahaji Travels Booking" });
    if (!base) return null;
    if (scheme === "generic") return base;
    // For specific apps, use intent on Android
    if (Platform.OS === "android") {
      const pkgMap = {
        gpay: "com.google.android.apps.nbu.paisa.user",
        phonepe: "com.phonepe.app",
        paytm: "net.one97.paytm",
      };
      const params = base.replace("upi://pay?", "");
      return pkgMap[scheme]
        ? `intent://pay?${params}#Intent;scheme=upi;package=${pkgMap[scheme]};end`
        : base;
    }
    return base; // iOS: generic upi:// works for all apps
  };

  const handleAppPress = async (url) => {
    if (!url) {
      Alert.alert(
        "UPI Not Available",
        `Please set up UPI in admin settings first.\n\nContact: 9021694503`
      );
      return;
    }
    if (onAppOpened) await onAppOpened(url);
  };

  const APP_LIST = [
    {
      name: "Google Pay",
      url: makeURL("gpay"),
      bg: "#FFFFFF",
      border: "#E8E8E8",
      btnBg: "#4285F4",
      icon: "G",
      iconColor: "#4285F4",
      iconBg: "#FFFFFF",
    },
    {
      name: "PhonePe",
      url: makeURL("phonepe"),
      bg: "#F8F0FF",
      border: "#E8D5FF",
      btnBg: "#5F259F",
      icon: "P",
      iconColor: "#FFFFFF",
      iconBg: "#5F259F",
    },
    {
      name: "Paytm",
      url: makeURL("paytm"),
      bg: "#F0FBFF",
      border: "#BAE6FD",
      btnBg: "#00BAF2",
      icon: "Pay",
      iconColor: "#FFFFFF",
      iconBg: "#00BAF2",
    },
    {
      name: "Any UPI App",
      url: makeURL("generic"),
      bg: "#FFF5F5",
      border: "#FFD0D0",
      btnBg: "#C0392B",
      icon: "📲",
      iconColor: "#FFFFFF",
      iconBg: "#C0392B",
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={uSt.overlay}>
        <View style={uSt.sheet}>
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

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount hero */}
            <View style={uSt.amountCard}>
              <Text style={uSt.amountLabel}>TOTAL TO PAY</Text>
              <Text style={uSt.amountValue}>₹{amount}</Text>
              <Text style={uSt.amountBookingId}>Booking: {bookingId}</Text>
            </View>

            {/* UPI ID missing warning */}
            {!hasValidUPI && (
              <View style={uSt.warningBox}>
                <Text style={uSt.warningText}>
                  ⚠️ UPI payment is not configured yet. Please contact the operator to pay.
                </Text>
              </View>
            )}

            {/* QR Code */}
            {qrSettings?.qrImageBase64 ? (
              <View style={uSt.qrCard}>
                <Text style={uSt.qrCardTitle}>Scan with any UPI app</Text>
                <View style={uSt.qrBorder}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${qrSettings.qrImageBase64}` }}
                    style={uSt.qrImage}
                    resizeMode="contain"
                    onError={() => {}} // suppress image errors
                  />
                </View>
                <Text style={uSt.qrAmount}>₹{amount}</Text>
                {hasValidUPI && (
                  <View style={uSt.upiRow}>
                    <View style={uSt.upiAtBadge}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>@</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={uSt.upiIdText}>{upiId}</Text>
                      <Text style={uSt.upiNameText}>{upiName}</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              hasValidUPI && (
                <View style={uSt.qrCard}>
                  <Text style={uSt.qrCardTitle}>UPI ID</Text>
                  <View style={uSt.upiRow}>
                    <View style={uSt.upiAtBadge}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>@</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={uSt.upiIdText}>{upiId}</Text>
                      <Text style={uSt.upiNameText}>{upiName}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: "#999", marginTop: 8, textAlign: "center" }}>
                    Open UPI app manually and enter this ID
                  </Text>
                </View>
              )
            )}

            {/* App buttons */}
            <View style={uSt.appsCard}>
              <Text style={uSt.appsTitle}>Open directly in app</Text>
              <Text style={uSt.appsSub}>₹{amount} auto-filled · Pay · Enter UTR</Text>
              {APP_LIST.map((app, i) => (
                <TouchableOpacity
                  key={i}
                  style={[uSt.appRow, { backgroundColor: app.bg, borderColor: app.border }]}
                  activeOpacity={0.78}
                  onPress={() => handleAppPress(app.url)}
                  disabled={!hasValidUPI}
                >
                  <View style={[uSt.appIconBox, { backgroundColor: app.iconBg }]}>
                    <Text style={{ color: app.iconColor, fontWeight: "900", fontSize: app.icon.length > 2 ? 11 : 18 }}>
                      {app.icon}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={uSt.appName}>{app.name}</Text>
                    <Text style={uSt.appSub}>₹{amount} · auto-filled</Text>
                  </View>
                  <View style={[uSt.openBtn, { backgroundColor: hasValidUPI ? app.btnBg : "#CCC" }]}>
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

            {/* Note */}
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
// Shown after user returns from UPI app — crash-proof
// ════════════════════════════════════════════════════════════════════════════════
export function UTRVerificationModal({
  visible,
  onClose,
  utrValue,
  setUTRValue,
  onVerify,
  onPaidAlready,
  verifying,
  amount,
  bookingId,
  pollCount,
}) {
  const isValid = isValidUTRFormat(utrValue);
  const disabled = !isValid || verifying;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={uSt.overlay}>
        <View style={[uSt.sheet, { maxHeight: "90%" }]}>
          <View style={uSt.handle} />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 44 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 18 }}>
              <View style={uSt.verifyIconWrap}>
                <Text style={{ fontSize: 34 }}>🔐</Text>
              </View>
              <Text style={uSt.verifyTitle}>Enter UTR Number</Text>
              <Text style={uSt.verifySub}>
                {"Payment of "}
                <Text style={{ color: "#C0392B", fontWeight: "700" }}>₹{amount}</Text>
                {" complete झाल्यावर\nUTR / Transaction ID enter करा"}
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
                  style={uSt.utrInput}
                  value={utrValue}
                  onChangeText={(v) =>
                    setUTRValue(
                      v
                        .replace(/[^A-Za-z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, 35)
                    )
                  }
                  placeholder="e.g. 407312345678901"
                  placeholderTextColor="#C7C7CC"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
                  maxLength={35}
                  returnKeyType="done"
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

            {/* Poll indicator */}
            {pollCount > 0 && pollCount < 36 && (
              <View style={uSt.pollBox}>
                <ActivityIndicator size="small" color="#f59e0b" />
                <Text style={uSt.pollText}>
                  {"Admin verification check: "}
                  {pollCount}/36... ({Math.round(((36 - pollCount) * 5) / 60)} min left)
                </Text>
              </View>
            )}

            {/* Verify button */}
            <TouchableOpacity
              style={[uSt.verifyBtn, disabled && uSt.verifyBtnDisabled]}
              onPress={() => onVerify && onVerify(utrValue)}
              disabled={disabled}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={uSt.verifyBtnText}>✓ Verify Payment</Text>
              )}
            </TouchableOpacity>

            {/* Already paid */}
            <TouchableOpacity
              style={uSt.alreadyPaidBtn}
              onPress={onPaidAlready}
              activeOpacity={0.75}
            >
              <Text style={uSt.alreadyPaidText}>Payment deducted but no UTR?</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity style={uSt.cancelBtn} onPress={onClose}>
              <Text style={uSt.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>

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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    maxHeight: "96%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A2E", letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: "#888", marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EBEBEB",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { fontSize: 16, color: "#555", fontWeight: "700" },

  // Warning
  warningBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
    marginBottom: 12,
  },
  warningText: { fontSize: 13, color: "#795548", lineHeight: 20 },

  // Amount card
  amountCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  amountValue: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  amountBookingId: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 6 },

  // QR card
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  qrCardTitle: { fontSize: 13, fontWeight: "700", color: "#1A1A2E", marginBottom: 14 },
  qrBorder: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#1A1A2E",
  },
  qrImage: { width: 180, height: 180, borderRadius: 8 },
  qrAmount: { fontSize: 15, fontWeight: "800", color: "#C0392B", marginTop: 12 },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    backgroundColor: "#F5F6FA",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    width: "100%",
  },
  upiAtBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  upiIdText: { fontSize: 15, fontWeight: "800", color: "#1A1A2E" },
  upiNameText: { fontSize: 11, color: "#888", marginTop: 1 },

  // Apps
  appsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  appsTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  appsSub: { fontSize: 11, color: "#999", marginBottom: 14 },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 8,
  },
  appIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  appName: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  appSub: { fontSize: 11, color: "#888", marginTop: 1 },
  openBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  openBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Steps
  stepsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  stepsTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText: { fontSize: 13, color: "#444", lineHeight: 22, flex: 1, marginTop: 3 },

  // Note
  noteBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 4,
  },
  noteText: { fontSize: 12, color: "#795548", lineHeight: 18, flex: 1 },

  // UTR modal
  verifyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FDECEA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#F5C6C2",
  },
  verifyTitle: { fontSize: 22, fontWeight: "800", color: "#1C1C1E", marginBottom: 8 },
  verifySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 10,
  },
  bookingChip: {
    backgroundColor: "#E8F4FE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#0A84FF",
    marginBottom: 20,
  },
  bookingChipLabel: { fontSize: 9, fontWeight: "700", color: "#0A84FF", letterSpacing: 2 },
  bookingChipValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0070D0",
    letterSpacing: 2,
    marginTop: 2,
  },
  utrLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  utrInputBox: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#EBEBEB",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F5F6FA",
  },
  utrInputBoxValid: { borderColor: "#1A1A2E" },
  utrInputPrefix: {
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#EBEBEB",
  },
  utrInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 16,
    color: "#1A1A2E",
    fontWeight: "700",
    letterSpacing: 1.5,
    backgroundColor: "#fff",
  },
  utrCheckBox: {
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#EAFAF1",
  },
  utrHint: { fontSize: 11, color: "#999", marginTop: 8, lineHeight: 16 },
  pollBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  pollText: { fontSize: 12, color: "#795548", flex: 1 },
  verifyBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  verifyBtnDisabled: { backgroundColor: "#EBEBEB" },
  verifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  alreadyPaidBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 4 },
  alreadyPaidText: {
    fontSize: 13,
    color: "#C0392B",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  cancelBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 8 },
  cancelText: { fontSize: 13, color: "#999", fontWeight: "600" },
  infoNote: { fontSize: 11, color: "#BBB", textAlign: "center" },
});