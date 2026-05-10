// ════════════════════════════════════════════════════════════════════
// FILE: DynamicUPIQR.jsx
// Dynamic UPI QR Payment Component — Production Ready
// ✅ Multilingual: English / मराठी / हिंदी
// Compatible with Expo / React Native
//
// Install dependency first:
//   npx expo install react-native-qrcode-svg react-native-svg
// ════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Linking, Alert, TextInput,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";

// ─── DEFAULT CONFIG ───────────────────────────────────────────────
const DEFAULT_UPI_CONFIG = {
  upiId:     "kumarbarge14@okhdfcbank",
  payeeName: "KUMAR BARGE",
  note:      "Shahaji Travels Booking",
};

// ─── UPI LINK BUILDER ─────────────────────────────────────────────
function buildUPILink({ upiId, payeeName, amount, note }) {
  if (!upiId || !upiId.includes("@")) return null;
  const amt = parseFloat(amount);
  if (!amt || amt <= 0 || isNaN(amt)) return null;
  return (
    `upi://pay?pa=${upiId.trim()}` +
    `&pn=${encodeURIComponent((payeeName || "Merchant").trim())}` +
    `&am=${amt.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent((note || "Payment").trim())}`
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function DynamicUPIQR({
  amount        = 0,
  upiId         = DEFAULT_UPI_CONFIG.upiId,
  payeeName     = DEFAULT_UPI_CONFIG.payeeName,
  note          = DEFAULT_UPI_CONFIG.note,
  bookingId     = "",
  route         = "",
  date          = "",
  onUTRSubmit,
  onCancel,
  qrImageBase64 = null,
  t             = {},
}) {
  const [utrValue, setUtrValue] = useState("");
  const [copied,   setCopied]   = useState(false);
  const [qrError,  setQrError]  = useState(false);
  const [step,     setStep]     = useState("scan");

  const upiString = useMemo(
    () => buildUPILink({ upiId, payeeName, amount, note }),
    [upiId, payeeName, amount, note]
  );

  const handleCopyUPI = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Copy Failed", "Could not copy to clipboard.");
    }
  }, [upiId]);

  const handleOpenUPIApp = useCallback(async () => {
    const amt  = String(Math.round(parseFloat(amount)));
    const pa   = upiId.trim();
    const pn   = encodeURIComponent(payeeName || "Merchant");
    const link = `upi://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR`;
    try {
      if (Platform.OS === "web") { window.location.href = link; return; }
      const canOpen = await Linking.canOpenURL(link).catch(() => true);
      if (!canOpen) {
        Alert.alert("UPI App Not Found", `Pay manually:\nUPI ID: ${pa}\nAmount: ₹${amt}`);
        return;
      }
      await Linking.openURL(link);
      setTimeout(() => setStep("utr"), 2000);
    } catch {
      Alert.alert("Payment Error", `Manual Pay:\nUPI ID: ${pa}\nAmount: ₹${amt}`);
    }
  }, [upiId, payeeName, amount]);

  const handleSubmitUTR = useCallback(() => {
    const clean = utrValue.trim().toUpperCase().replace(/\s+/g, "");
    if (clean.length < 8) {
      Alert.alert("Invalid UTR", "Please enter a valid UTR / Transaction ID (minimum 8 characters).");
      return;
    }
    if (onUTRSubmit) onUTRSubmit(clean);
  }, [utrValue, onUTRSubmit]);

  const isUTRValid    = utrValue.trim().replace(/\s+/g, "").length >= 8;
  const displayAmount = parseFloat(amount) || 0;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── AMOUNT HERO ── */}
      <View style={styles.amountHero}>
        <Text style={styles.amountLabel}>{t.totalToPay || "TOTAL TO PAY"}</Text>
        <Text style={styles.amountValue}>₹{displayAmount.toLocaleString("en-IN")}</Text>
        {(route || date) ? (
          <View style={styles.routePill}>
            {route ? <Text style={styles.routeText}>{route}</Text> : null}
            {date  ? <Text style={styles.routeDate}>{date}</Text>  : null}
          </View>
        ) : null}
        {bookingId ? <Text style={styles.bookingIdText}>Booking: {bookingId}</Text> : null}
      </View>

      {/* ── STEP TABS ── */}
      <View style={styles.stepTabs}>
        {["scan", "utr"].map((s, i) => (
          <TouchableOpacity
            key={s}
            style={[styles.stepTab, step === s && styles.stepTabActive]}
            onPress={() => setStep(s)}
            activeOpacity={0.75}
          >
            <View style={[styles.stepNum, step === s && styles.stepNumActive]}>
              <Text style={[styles.stepNumText, step === s && { color: "#fff" }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
              {s === "scan"
                ? (t.scanAndPay || "Scan & Pay")
                : (t.enterUtrTitle || "Enter UTR")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════════ STEP 1: SCAN & PAY ══════════════ */}
      {step === "scan" && (
        <>
          {/* QR CARD */}
          <View style={styles.qrCard}>
            <Text style={styles.qrCardHeading}>
              {t.scanWithAny || "Scan with any UPI app"}
            </Text>

            {upiString && !qrError ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={upiString}
                  size={260}
                  color="#1A1A2E"
                  backgroundColor="#FFFFFF"
                  onError={() => setQrError(true)}
                  ecl="M"
                  getRef={(ref) => {
                    if (ref) ref.toDataURL((data) => { global._qrDataUrl = data; });
                  }}
                />
              </View>
            ) : (
              <View style={styles.qrFallback}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>📱</Text>
                <Text style={styles.qrFallbackText}>
                  {upiString ? "QR rendering failed. Use the UPI ID below." : "UPI ID is not configured."}
                </Text>
              </View>
            )}

            {/* Download QR (web only) */}
            {Platform.OS === "web" && (
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => {
                  if (global._qrDataUrl) {
                    const a = document.createElement("a");
                    a.href = "data:image/png;base64," + global._qrDataUrl;
                    a.download = "shahaji_upi_qr.png";
                    a.click();
                  } else {
                    alert("QR load होत आहे, थोडं थांबा.");
                  }
                }}
              >
                <Text style={{ fontSize: 16 }}>⬇️</Text>
                <Text style={styles.downloadBtnText}>QR Download </Text>
              </TouchableOpacity>
            )}

            {/* Amount chip */}
            <View style={styles.amountChip}>
              <Text style={styles.amountChipText}>₹{displayAmount.toLocaleString("en-IN")}</Text>
            </View>

            {/* UPI ID row */}
            <View style={styles.upiIdRow}>
              <View style={styles.upiAtBadge}>
                <Text style={styles.upiAtText}>@</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiIdLabel}>{t.upiIdLabel2 || "UPI ID"}</Text>
                <Text style={styles.upiIdValue} numberOfLines={1}>{upiId}</Text>
                <Text style={styles.upiNameValue}>{payeeName}</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                onPress={handleCopyUPI}
                activeOpacity={0.8}
              >
                <Text style={[styles.copyBtnText, copied && { color: "#fff" }]}>
                  {copied ? "✓ Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MANUAL PAYMENT INSTRUCTIONS */}
          <View style={styles.manualBox}>
            <Text style={styles.manualTitle}>💡 {t.howToPay || "How to Pay"}</Text>
            <Text style={styles.manualText}>
              {"1️⃣ " + (t.howToPayStep1 || "Open GPay / PhonePe / Paytm") + "\n\n2️⃣ " + (t.howToPayStep2 || "New Payment → Enter UPI ID:") + "\n"}
            </Text>
            <View style={styles.manualUpiRow}>
              <Text style={styles.manualUpiId} numberOfLines={1}>{upiId}</Text>
              <TouchableOpacity
                onPress={handleCopyUPI}
                style={[styles.manualCopyBtn, copied && { backgroundColor: "#27AE60" }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                  {copied ? "✓ Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.manualText}>
              {"3️⃣ " + (t.howToPayStep3 || "Amount: ₹") + displayAmount +
              "\n\n4️⃣ " + (t.howToPayStep4 || "Pay करा → UTR / Transaction ID copy करा") +
              "\n\n5️⃣ " + (t.howToPayStep5 || "खाली UTR paste करा → Booking Confirmed ✅")}
            </Text>
          </View>

         {/* HOW TO PAY STEPS — same as manual box, no duplicate */}

          {/* NEXT BUTTON */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep("utr")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {t.enterUtrToContinue || "I've Paid → Enter UTR"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* ══════════════ STEP 2: ENTER UTR ══════════════ */}
      {step === "utr" && (
        <>
          <View style={styles.utrCard}>
            <View style={styles.utrIcon}>
              <Text style={{ fontSize: 34 }}>🔐</Text>
            </View>

            <Text style={styles.utrTitle}>{t.enterUtrTitle || "Enter UTR Number"}</Text>
         
<Text style={styles.utrSub}>
  {t.paymentOf || "Payment of "}
  <Text style={{ color: "#C0392B", fontWeight: "700" }}>₹{displayAmount}</Text>
  {t.completeEnterUtr || " complete झाल्यावर\nUTR / Transaction ID enter करा"}
</Text>

            {bookingId ? (
              <View style={styles.bookingChip}>
                <Text style={styles.bookingChipLabel}>BOOKING ID</Text>
                <Text style={styles.bookingChipValue}>{bookingId}</Text>
              </View>
            ) : null}

            <View style={styles.utrInputLabel}>
              <Text style={styles.utrInputLabelText}>UTR / Transaction ID *</Text>
            </View>

            <View style={[styles.utrInputBox, isUTRValid && styles.utrInputBoxValid]}>
              <View style={[styles.utrInputPrefix, isUTRValid && { backgroundColor: "#1A1A2E" }]}>
                <Text style={{ fontSize: 16, color: isUTRValid ? "#fff" : "#999" }}>🔢</Text>
              </View>
              <TextInput
                style={styles.utrInput}
                value={utrValue}
                onChangeText={(v) =>
                  setUtrValue(v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 35))
                }
                placeholder={t.utrPlaceholder || "e.g. 407312345678901"}
                placeholderTextColor="#C7C7CC"
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
                maxLength={35}
                returnKeyType="done"
              />
              {isUTRValid && (
                <View style={styles.utrCheck}>
                  <Text style={{ color: "#27AE60", fontWeight: "800", fontSize: 18 }}>✓</Text>
                </View>
              )}
            </View>

            <Text style={styles.utrHint}>
              {t.enterUtrSub || "Where to find UTR: UPI App → Transaction History → tap payment → Share/Copy"}
            </Text>

            <TouchableOpacity
              style={[styles.verifyBtn, !isUTRValid && styles.verifyBtnDisabled]}
              onPress={handleSubmitUTR}
              disabled={!isUTRValid}
              activeOpacity={0.85}
            >
              <Text style={[styles.verifyBtnText, !isUTRValid && { color: "#aaa" }]}>
                {isUTRValid
                  ? (t.confirmSubmit || "✓  Confirm Payment & Booking")
                  : (t.enterUtrToContinue || "Enter UTR to Continue")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep("scan")}>
              <Text style={styles.backLinkText}>{t.back || "← Back to Scan"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={styles.warningText}>
              {t.utrWarning || "Admin will verify your UTR within 15–30 minutes. Incorrect UTR will result in cancellation. Contact 9021694503 for help."}
            </Text>
          </View>
        </>
      )}

      {/* CANCEL */}
      {onCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{t.cancelLabel || "Cancel"}</Text>
        </TouchableOpacity>
      )}

      {/* SECURITY BADGES */}
      <View style={styles.badgeRow}>
        {[
          { icon: "🔒", text: t.sslSecure || "SSL Secure" },
          { icon: "✅", text: t.pciDss    || "PCI DSS"    },
          { icon: "🛡️", text: t.safe100   || "100% Safe"  },
        ].map((b) => (
          <View key={b.text} style={styles.badge}>
            <Text style={{ fontSize: 12 }}>{b.icon}</Text>
            <Text style={styles.badgeText}>{b.text}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8,
    backgroundColor: "#F5F6FA",
  },
  amountHero: {
    backgroundColor: "#1A1A2E", borderRadius: 20, padding: 22,
    marginBottom: 14, alignItems: "center",
  },
  amountLabel: {
    fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "700",
    letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase",
  },
  amountValue: { fontSize: 40, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 },
  routePill: {
    marginTop: 10, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  routeText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  routeDate: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  bookingIdText: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 },
  stepTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  stepTab: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: "#E5E5EA",
  },
  stepTabActive: { backgroundColor: "#FFF5F5", borderColor: "#C0392B" },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#EBEBEB", justifyContent: "center", alignItems: "center",
  },
  stepNumActive: { backgroundColor: "#C0392B" },
  stepNumText: { fontSize: 11, fontWeight: "800", color: "#888" },
  stepLabel: { fontSize: 12, fontWeight: "700", color: "#888" },
  stepLabelActive: { color: "#C0392B" },
  qrCard: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20,
    marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#EBEBEB",
    elevation: 2,
  },
  qrCardHeading: { fontSize: 14, fontWeight: "800", color: "#1A1A2E", marginBottom: 18 },
  qrWrapper: {
    padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF",
    borderWidth: 3, borderColor: "#1A1A2E", elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, marginBottom: 14,
  },
  qrFallback: {
    width: 220, height: 220, backgroundColor: "#F8F9FA", borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#E5E5E5", borderStyle: "dashed", marginBottom: 14,
  },
  qrFallbackText: { fontSize: 12, color: "#999", textAlign: "center", paddingHorizontal: 12 },
  downloadBtn: {
    backgroundColor: "#1A1A2E", borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginBottom: 12,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  downloadBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  amountChip: {
    backgroundColor: "#F5F6FA", borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 14,
  },
  amountChipText: { fontSize: 16, fontWeight: "800", color: "#C0392B" },
  upiIdRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F5F6FA", borderRadius: 12, padding: 14,
    width: "100%", borderWidth: 1, borderColor: "#EBEBEB",
  },
  upiAtBadge: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#1A1A2E",
    justifyContent: "center", alignItems: "center",
  },
  upiAtText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  upiIdLabel: { fontSize: 9, color: "#999", fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  upiIdValue: { fontSize: 14, fontWeight: "800", color: "#1A1A2E", marginTop: 1 },
  upiNameValue: { fontSize: 11, color: "#888", marginTop: 1 },
  copyBtn: {
    borderRadius: 10, borderWidth: 1.5, borderColor: "#1A1A2E",
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#fff",
  },
  copyBtnCopied: { backgroundColor: "#27AE60", borderColor: "#27AE60" },
  copyBtnText: { fontSize: 12, fontWeight: "700", color: "#1A1A2E" },
  manualBox: {
    backgroundColor: "#FFF8E1", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#FFE082",
  },
  manualTitle: { fontSize: 14, fontWeight: "800", color: "#E65100", marginBottom: 10 },
  manualText: { fontSize: 13, color: "#555", lineHeight: 24 },
  manualUpiRow: {
    backgroundColor: "#fff", borderRadius: 10, padding: 10, marginVertical: 6,
    borderWidth: 1, borderColor: "#FFE082",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  manualUpiId: { fontSize: 14, fontWeight: "800", color: "#C0392B", flex: 1 },
  manualCopyBtn: {
    backgroundColor: "#1A1A2E", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  stepsCard: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#EBEBEB", elevation: 1,
  },
  stepsHeading: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: "#1A1A2E",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  stepBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText: { fontSize: 13, color: "#444", lineHeight: 22, flex: 1, marginTop: 3 },
  primaryBtn: {
    backgroundColor: "#1A1A2E", borderRadius: 16, paddingVertical: 18,
    alignItems: "center", marginBottom: 12, elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  utrCard: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20,
    marginBottom: 12, borderWidth: 1, borderColor: "#EBEBEB",
    alignItems: "center", elevation: 2,
  },
  utrIcon: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: "#FDECEA",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
    borderWidth: 1.5, borderColor: "#F5C6C2",
  },
  utrTitle: { fontSize: 20, fontWeight: "800", color: "#1C1C1E", marginBottom: 8 },
  utrSub: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 21, marginBottom: 16 },
  bookingChip: {
    backgroundColor: "#E8F4FE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: "#0A84FF",
    marginBottom: 16, width: "100%",
  },
  bookingChipLabel: { fontSize: 9, fontWeight: "700", color: "#0A84FF", letterSpacing: 2 },
  bookingChipValue: { fontSize: 17, fontWeight: "700", color: "#0070D0", letterSpacing: 2, marginTop: 2 },
  utrInputLabel: { width: "100%", marginBottom: 8 },
  utrInputLabelText: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  utrInputBox: {
    flexDirection: "row", borderWidth: 2, borderColor: "#EBEBEB",
    borderRadius: 14, overflow: "hidden", backgroundColor: "#F5F6FA",
    width: "100%", marginBottom: 8,
  },
  utrInputBoxValid: { borderColor: "#1A1A2E" },
  utrInputPrefix: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#EBEBEB", minHeight: 52 },
  utrInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 15,
    fontSize: 16, color: "#1A1A2E", fontWeight: "700",
    letterSpacing: 1.5, backgroundColor: "#FFFFFF",
  },
  utrCheck: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: "#EAFAF1" },
  utrHint: { fontSize: 11, color: "#999", lineHeight: 16, textAlign: "center", marginBottom: 20, width: "100%" },
  verifyBtn: {
    backgroundColor: "#1A1A2E", borderRadius: 16, paddingVertical: 18,
    alignItems: "center", width: "100%", marginBottom: 12, elevation: 3,
  },
  verifyBtnDisabled: { backgroundColor: "#EBEBEB", elevation: 0 },
  verifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  backLink: { paddingVertical: 10 },
  backLinkText: { fontSize: 13, color: "#888", fontWeight: "600" },
  warningBox: {
    backgroundColor: "#FFF8E1", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#FFE082",
    flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 14,
  },
  warningText: { fontSize: 12, color: "#795548", lineHeight: 19, flex: 1 },
  cancelBtn: { alignItems: "center", paddingVertical: 14, marginBottom: 8 },
  cancelText: { fontSize: 13, color: "#999", fontWeight: "600" },
  badgeRow: { flexDirection: "row", justifyContent: "center", gap: 16, paddingBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, color: "#999", fontWeight: "600" },
});