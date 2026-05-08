// ============================================================
// DrawerScreens.js — Shahaji Travels
// ✅ Profile, Wallet, MyBookings, Offers, GetTicket,
//    CancelTicket, CustomerCare, Language, Logout
// ✅ Full proper UI screens (not modal alerts)
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Animated, Dimensions, FlatList, KeyboardAvoidingView,
  Linking, Modal, Platform, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── COLORS ──────────────────────────────────────────────────
const C = {
  bg: "#F7F7F7", surface: "#FFFFFF",
  red: "#D32F2F", redDark: "#B71C1C", redLight: "#FFEBEE", redBorder: "#FFCDD2",
  green: "#2E7D32", greenLight: "#E8F5E9", greenBorder: "#A5D6A7",
  blue: "#1565C0", blueLight: "#E3F2FD", blueBorder: "#90CAF9",
  orange: "#E65100", orangeLight: "#FFF3E0", orangeBorder: "#FFCC80",
  purple: "#6A1B9A", purpleLight: "#F3E5F5", purpleBorder: "#CE93D8",
  text: "#1A1A1A", textMid: "#444", textSub: "#888",
  border: "#E0E0E0", chip: "#F5F5F5",
  warning: "#F57C00", white: "#FFFFFF", black: "#000000",
  gold: "#F9A825", goldLight: "#FFFDE7",
};
const F = { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28 };

// ─── HELPERS ─────────────────────────────────────────────────
const PrimaryBtn = ({ title, onPress, color, textColor, style, disabled, loading }) => (
  <TouchableOpacity
    style={[ds.primaryBtn, { backgroundColor: color || C.red }, disabled && { opacity: 0.5 }, style]}
    onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
  >
    {loading
      ? <ActivityIndicator color={textColor || C.white} size="small" />
      : <Text style={[ds.primaryBtnText, { color: textColor || C.white }]}>{title}</Text>}
  </TouchableOpacity>
);

const ScreenHeader = ({ title, subtitle, icon, onBack, color }) => (
  <View style={[ds.header, { backgroundColor: color || C.red }]}>
    <TouchableOpacity onPress={onBack} style={ds.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Text style={ds.headerBackText}>‹</Text>
    </TouchableOpacity>
    <View style={{ flex: 1 }}>
      <Text style={ds.headerTitle}>{icon} {title}</Text>
      {subtitle ? <Text style={ds.headerSub}>{subtitle}</Text> : null}
    </View>
  </View>
);

const InfoRow = ({ label, value, icon, bold }) => (
  <View style={ds.infoRow}>
    {icon ? <Text style={ds.infoRowIcon}>{icon}</Text> : null}
    <View style={{ flex: 1 }}>
      <Text style={ds.infoRowLabel}>{label}</Text>
      <Text style={[ds.infoRowValue, bold && { fontWeight: "900", fontSize: F.md }]}>{value || "—"}</Text>
    </View>
  </View>
);

const EmptyState = ({ icon, title, sub }) => (
  <View style={ds.emptyWrap}>
    <Text style={ds.emptyIcon}>{icon}</Text>
    <Text style={ds.emptyTitle}>{title}</Text>
    <Text style={ds.emptySub}>{sub}</Text>
  </View>
);

// ============================================================
// 1. PROFILE SCREEN
// ============================================================
export const ProfileScreen = ({ visible, onClose, user, wallet, api, showAlert }) => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [imageUri, setImageUri] = useState(null);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      loadData();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.getUserProfile(user?._id || user?.id);
      setProfile(r?.user || r);

      // Load bookings
      const phone = user?.phone || user?.mobile;
      const res = await fetch(
        `https://shahaji-travels-backend.onrender.com/api/bookings?phone=${phone}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.bookings || []);
      setBookings(list);
    } catch {
      setProfile(user);
    }
    setLoading(false);
  };

  const pickImage = async () => {
  try {
    // Web वर ImagePicker काम करत नाही — simple file input वापरा
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setImageUri(url);
        }
      };
      input.click();
      return;
    }

    // Mobile साठी — expo-image-picker
    const ImagePicker = require("expo-image-picker");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      showAlert("Permission needed", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  } catch (e) {
    showAlert("Error", e.message || "Could not open gallery.");
  }
};

  if (!visible) return null;

  const p = profile || user || {};
  const initials = (p.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  // Total paid amount
const totalPaid = bookings
  .filter(b => b.paymentStatus === "Paid" || b.bookingStatus === "Confirmed")
  .reduce((s, b) => s + Number(b.amount || 0), 0);

// Cancelled bookings चे refund amount वजा करा
const totalRefunded = bookings
  .filter(b => 
    b.bookingStatus === "Cancelled" && 
    (b.refundStatus === "Refunded" || b.refundStatus === "Processing") &&
    Number(b.refundAmount || 0) > 0
  )
  .reduce((s, b) => s + Number(b.refundAmount || 0), 0);

// Final actual spent = paid - refunded
const totalSpent = Math.max(0, totalPaid - totalRefunded);
  const confirmedBookings = bookings.filter(b =>
    b.bookingStatus === "Confirmed" || b.paymentStatus === "Paid"
  ).length;
  const cancelledBookings = bookings.filter(b =>
    b.bookingStatus === "Cancelled"
  ).length;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <StatusBar barStyle="light-content" backgroundColor="#C0392B" />

          {/* Header */}
          <View style={{
            backgroundColor: "#C0392B",
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 14,
            paddingTop: Platform.OS === "android" ? 38 : 14,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center", marginRight: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>👤 My Profile</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Avatar Section */}
            <View style={{
              backgroundColor: "#C0392B",
              paddingTop: 20, paddingBottom: 36,
              alignItems: "center",
            }}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
                <View style={{
                  width: 90, height: 90, borderRadius: 45,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  justifyContent: "center", alignItems: "center",
                  borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
                  marginBottom: 12, overflow: "hidden",
                }}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: 90, height: 90, borderRadius: 45 }}
                    />
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900" }}>
                      {initials}
                    </Text>
                  )}
                </View>
                {/* Camera icon */}
                <View style={{
                  position: "absolute", bottom: 12, right: 0,
                  backgroundColor: "#fff", borderRadius: 12,
                  width: 24, height: 24,
                  justifyContent: "center", alignItems: "center",
                  elevation: 3,
                }}>
                  <Text style={{ fontSize: 13 }}>📷</Text>
                </View>
              </TouchableOpacity>

              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {p.name || p.fullName || "—"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
                {p.email || "—"}
              </Text>
              <View style={{
                marginTop: 10, backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
              }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                  ✓ Verified Account
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={{
              flexDirection: "row", gap: 10,
              paddingHorizontal: 16, marginTop: -18,
            }}>
              {[
                { icon: "🎫", label: "Bookings",  value: confirmedBookings, color: "#0A84FF" },
                { icon: "💸", label: "Spent",     value: `₹${totalSpent.toLocaleString()}`, color: "#C0392B" },
                { icon: "❌", label: "Cancelled", value: cancelledBookings, color: "#FF3B30" },
              ].map((stat, i) => (
                <View key={i} style={{
                  flex: 1, backgroundColor: "#fff",
                  borderRadius: 14, padding: 14,
                  alignItems: "center", elevation: 3,
                  borderWidth: 1, borderColor: "#E5E5EA",
                }}>
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: stat.color }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tabs */}
            <View style={{
              flexDirection: "row", gap: 8,
              paddingHorizontal: 16, marginTop: 16, marginBottom: 4,
            }}>
              {[
                { key: "info",     label: "👤 Info" },
                { key: "bookings", label: "🎫 Bookings" },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: activeTab === tab.key ? "#C0392B" : "#fff",
                    borderWidth: 1,
                    borderColor: activeTab === tab.key ? "#C0392B" : "#E5E5EA",
                    alignItems: "center",
                  }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: "700",
                    color: activeTab === tab.key ? "#fff" : "#555",
                  }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* INFO TAB */}
            {activeTab === "info" && (
              <View style={{
                backgroundColor: "#fff", margin: 16, marginTop: 10,
                borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: "#E5E5EA",
              }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1C1E", marginBottom: 14 }}>
                  Personal Information
                </Text>
                {loading ? (
                  <Text style={{ color: "#888", textAlign: "center", paddingVertical: 20 }}>
                    Loading...
                  </Text>
                ) : (
                  [
                    { icon: "👤", label: "Full Name",    value: p.name || p.fullName },
                    { icon: "📱", label: "Mobile Number",value: p.phone || p.mobile },
                    { icon: "📧", label: "Email Address",value: p.email },
                    { icon: "📅", label: "Member Since", value: p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
                        : "—" },
                  ].map((row, i) => (
                    <View key={i} style={{
                      flexDirection: "row", alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: i < 3 ? 1 : 0,
                      borderBottomColor: "#F2F2F7",
                    }}>
                      <Text style={{ fontSize: 20, marginRight: 14 }}>{row.icon}</Text>
                      <View>
                        <Text style={{ fontSize: 11, color: "#8E8E93", fontWeight: "600" }}>
                          {row.label}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E", marginTop: 2 }}>
                          {row.value || "—"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                {loading ? (
                  <Text style={{ color: "#888", textAlign: "center", paddingVertical: 20 }}>
                    Loading bookings...
                  </Text>
                ) : bookings.length === 0 ? (
                  <View style={{
                    backgroundColor: "#fff", borderRadius: 16, padding: 40,
                    alignItems: "center", borderWidth: 1, borderColor: "#E5E5EA",
                  }}>
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>🎫</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#555" }}>
                      No bookings yet
                    </Text>
                    <Text style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                      Your travel history will appear here
                    </Text>
                  </View>
                ) : (
                  bookings.slice(0, 10).map((b, i) => {
                    const isPaid = b.paymentStatus === "Paid" || b.bookingStatus === "Confirmed";
                    const isCancelled = b.bookingStatus === "Cancelled";
                    return (
                      <View key={b._id || i} style={{
                        backgroundColor: "#fff", borderRadius: 14,
                        padding: 14, marginBottom: 10,
                        borderWidth: 1, borderColor: "#E5E5EA",
                        borderLeftWidth: 3,
                        borderLeftColor: isCancelled ? "#FF3B30" : isPaid ? "#27AE60" : "#FF9500",
                        elevation: 1,
                      }}>
                        {/* Route */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", flex: 1 }}>
                            {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
                          </Text>
                          <View style={{
                            backgroundColor: isCancelled ? "#FFEBEE" : isPaid ? "#EAFAF1" : "#FFF8E1",
                            borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
                          }}>
                            <Text style={{
                              fontSize: 10, fontWeight: "700",
                              color: isCancelled ? "#C62828" : isPaid ? "#2E7D32" : "#F57F17",
                            }}>
                              {isCancelled ? "Cancelled" : isPaid ? "Confirmed" : "Pending"}
                            </Text>
                          </View>
                        </View>

                        {/* Details */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                          <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                            📅 {b.journeyDate || b.date || "—"}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                            💺 {b.seatNumbers?.join(", ") || b.seatNo || "—"}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                            🚌 {b.busName || b.busNo || "—"}
                          </Text>
                        </View>

                        {/* Amount */}
                        <View style={{
                          flexDirection: "row", justifyContent: "space-between",
                          alignItems: "center", marginTop: 8,
                          paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F2F2F7",
                        }}>
                          <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                            #{b.bookingCode || "—"}
                          </Text>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#C0392B" }}>
                            ₹{Number(b.amount || 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const ps = StyleSheet.create({
  avatarCard: { backgroundColor: C.red, paddingTop: 24, paddingBottom: 32, alignItems: "center" },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)", marginBottom: 12 },
  avatarText: { color: C.white, fontSize: 32, fontWeight: "900" },
  userName: { color: C.white, fontSize: F.xxl, fontWeight: "900" },
  userEmail: { color: "rgba(255,255,255,0.8)", fontSize: F.sm, marginTop: 4 },
  verifiedBadge: { marginTop: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  verifiedText: { color: C.white, fontWeight: "700", fontSize: F.xs },
  statsRow: { flexDirection: "row", gap: 10, padding: 16, marginTop: -16 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1.5, elevation: 3 },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: F.lg, fontWeight: "900" },
  statLabel: { fontSize: F.xs, color: C.textSub, marginTop: 2 },
  membershipCard: { margin: 16, backgroundColor: C.gold + "22", borderRadius: 16, padding: 18, borderWidth: 2, borderColor: C.gold + "66", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  membershipTitle: { fontSize: F.md, fontWeight: "900", color: C.orange },
  membershipSub: { fontSize: F.xs, color: C.textMid, marginTop: 3 },
  membershipBadge: { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  membershipBadgeText: { color: C.white, fontWeight: "900", fontSize: F.xs, letterSpacing: 2 },
});

// ============================================================
// 2. WALLET SCREEN
// ============================================================




// ============================================================
// 3. MY BOOKINGS SCREEN
// ============================================================
export const MyBookingsScreen = ({ visible, onClose, user, api }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      loadBookings();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

const loadBookings = async () => {
  setLoading(true);
  try {
    const userId = user?._id || user?.id;
    const phone = user?.phone || user?.mobile;

    let url = "https://shahaji-travels-backend.onrender.com/api/bookings";
    
    // Phone ने search कर — most reliable
    if (phone) {
      url += `?phone=${phone}`;
    } else if (userId) {
      url += `?userId=${userId}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.bookings || []);
    setBookings(list);
  } catch (err) {
    setBookings([]);
  } finally {
    setLoading(false);
  }
};

  if (!visible) return null;

  const statusColor = (s) => {
    if (!s) return C.textSub;
    const sl = s.toLowerCase();
    if (sl === "confirmed") return C.green;
    if (sl === "cancelled") return C.red;
    return C.warning;
  };
  const statusBg = (s) => {
    if (!s) return C.chip;
    const sl = s.toLowerCase();
    if (sl === "confirmed") return C.greenLight;
    if (sl === "cancelled") return C.redLight;
    return C.orangeLight;
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.blue} />
          <ScreenHeader title="My Bookings" icon="🎫" onBack={onClose} color={C.blue} subtitle={`${bookings.length} total bookings`} />

          {/* Tabs */}
          <View style={mbs.tabs}>
            {["MY Bookings"].map(tab => (
              <TouchableOpacity key={tab} style={[mbs.tab, activeTab === tab && mbs.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[mbs.tabText, activeTab === tab && mbs.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading
            ? <ActivityIndicator color={C.blue} size="large" style={{ marginTop: 60 }} />
            : bookings.length === 0
              ? <EmptyState icon="🎫" title="No bookings found" sub="Your travel history will appear here" />
              : <FlatList
                data={bookings}
                keyExtractor={(item, i) => item.bookingCode || item._id || String(i)}
                contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
                renderItem={({ item: b }) => (
                  <View style={mbs.bookingCard}>
                    {/* Header */}
                    <View style={mbs.bookingCardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={mbs.bookingId}>#{b.bookingCode || b._id?.slice(-8) || "—"}</Text>
                        <Text style={mbs.bookingBus}>{b.busName || "Shahaji Travels"}</Text>
                      </View>
                      <View style={[mbs.statusBadge, { backgroundColor: statusBg(b.status || b.bookingStatus) }]}>
                        <Text style={[mbs.statusText, { color: statusColor(b.status || b.bookingStatus) }]}>
                          {b.status || b.bookingStatus || "Confirmed"}
                        </Text>
                      </View>
                    </View>

                    {/* Route */}
                    <View style={mbs.routeRow}>
                      <View style={{ alignItems: "center" }}>
                        <Text style={mbs.routeCity}>{b.boardingPoint?.split(" ")[0] || "—"}</Text>
                        <Text style={mbs.routeTime}>{b.departureTime || "—"}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={mbs.routeArrow}>✈ ————————</Text>
                        <Text style={mbs.routeDuration}>{b.duration || ""}</Text>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Text style={mbs.routeCity}>{b.droppingPoint?.split(" ")[0] || "—"}</Text>
                        <Text style={mbs.routeTime}>{b.arrivalTime || "—"}</Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={mbs.bookingCardFoot}>
                      <View style={mbs.footItem}>
                        <Text style={mbs.footLabel}>📅 Date</Text>
                        <Text style={mbs.footValue}>{b.journeyDate || b.date || "—"}</Text>
                      </View>
                      <View style={mbs.footItem}>
                        <Text style={mbs.footLabel}>💺 Seat</Text>
                        <Text style={mbs.footValue}>{b.seatNo || b.seatNumbers?.join(", ") || "—"}</Text>
                      </View>
                      <View style={[mbs.footItem, { alignItems: "flex-end" }]}>
                        <Text style={mbs.footLabel}>Amount</Text>
                        <Text style={mbs.footAmount}>₹{b.amount || b.totalAmount || 0}</Text>
                      </View>
                    </View>
                  </View>
                )}
              />
          }
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const mbs = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: C.blue },
  tabText: { fontSize: F.sm, fontWeight: "700", color: C.textSub },
  tabTextActive: { color: C.blue },
  bookingCard: { backgroundColor: C.white, borderRadius: 16, marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: C.border, elevation: 2 },
  bookingCardHead: { flexDirection: "row", alignItems: "flex-start", padding: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.chip },
  bookingId: { fontSize: F.xs, fontWeight: "900", color: C.blue, letterSpacing: 1 },
  bookingBus: { fontSize: F.md, fontWeight: "900", color: C.text, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: F.xs, fontWeight: "900" },
  routeRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.blueLight + "55" },
  routeCity: { fontSize: F.md, fontWeight: "900", color: C.text },
  routeTime: { fontSize: F.xs, color: C.textSub, marginTop: 2 },
  routeArrow: { fontSize: F.xs, color: C.blue },
  routeDuration: { fontSize: F.xs, color: C.textSub, marginTop: 2 },
  bookingCardFoot: { flexDirection: "row", padding: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.chip },
  footItem: { flex: 1 },
  footLabel: { fontSize: F.xs, color: C.textSub },
  footValue: { fontSize: F.sm, fontWeight: "700", color: C.text, marginTop: 2 },
  footAmount: { fontSize: F.lg, fontWeight: "900", color: C.red },
});

// ============================================================
// 4. OFFERS SCREEN
// ============================================================
export const OffersScreen = ({ visible, onClose, api }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      loadOffers();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const r = await api.getOffers();
      setOffers(r?.offers || []);
    } catch { setOffers([]); }
    finally { setLoading(false); }
  };

  const mockOffers = offers.length > 0 ? offers : [
    { code: "FIRST50", discount: 50, description: "50% off on your first booking!", minAmount: 200, expiry: "31 Dec 2025" },
    { code: "KOHINOOR20", discount: 20, description: "20% off for Kohinoor members", minAmount: 300, expiry: "15 Jan 2026" },
    { code: "MONSOON100", discount: 100, description: "Flat ₹100 off this monsoon season", minAmount: 500, expiry: "30 Sep 2025" },
    { code: "REFER50", discount: 50, description: "Referral bonus — share & earn", minAmount: 0, expiry: "No expiry" },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <StatusBar barStyle="light-content" backgroundColor="#C0392B" />

          {/* Header */}
          <View style={{
            backgroundColor: "#C0392B",
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 14,
            paddingTop: Platform.OS === "android" ? 38 : 14,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center", marginRight: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>🏷️ Offers & Deals</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 }}>
                Exclusive savings for you
              </Text>
            </View>
          </View>

          {/* Banner */}
          <View style={{
            backgroundColor: "#FDECEA",
            padding: 16,
            borderBottomWidth: 1, borderBottomColor: "#F5C6C2",
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#C0392B" }}>
              Save More, Travel More 🚌
            </Text>
            <Text style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
              Apply codes at checkout for instant discounts
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
            {loading ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Text style={{ color: "#888" }}>Loading offers...</Text>
              </View>
            ) : (
              mockOffers.map((offer, i) => (
                <View key={i} style={{
                  flexDirection: "row",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16, marginBottom: 14,
                  borderWidth: 1.5, borderColor: "#F5C6C2",
                  overflow: "hidden", elevation: 2,
                }}>
                  {/* Left Red Strip */}
                  <View style={{
                    width: 80, backgroundColor: "#C0392B",
                    alignItems: "center", justifyContent: "center",
                    paddingVertical: 16,
                  }}>
                    <Text style={{ fontSize: 24 }}>🏷️</Text>
                    <Text style={{
                      color: "#fff", fontSize: 20,
                      fontWeight: "900", marginTop: 4,
                    }}>
                      ₹{offer.discount}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700" }}>
                      OFF
                    </Text>
                  </View>

                  {/* Right Content */}
                  <View style={{ flex: 1, padding: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", marginBottom: 4 }}>
                      {offer.description || offer.title || "Special Offer"}
                    </Text>
                    {offer.minAmount > 0 && (
                      <Text style={{ fontSize: 11, color: "#8E8E93", marginBottom: 3 }}>
                        Min booking ₹{offer.minAmount}
                      </Text>
                    )}
                    <Text style={{ fontSize: 11, color: "#8E8E93", marginBottom: 10 }}>
                      📅 Valid till: {offer.expiry || "—"}
                    </Text>

                    {/* Code Row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{
                        flex: 1, borderWidth: 1.5,
                        borderColor: "#C0392B", borderRadius: 8,
                        borderStyle: "dashed",
                        paddingHorizontal: 10, paddingVertical: 7,
                      }}>
                        <Text style={{
                          fontWeight: "800", fontSize: 13,
                          color: "#C0392B", letterSpacing: 1,
                        }}>
                          {offer.code || offer.couponCode || "—"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: copied === offer.code ? "#27AE60" : "#C0392B",
                          borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
                        }}
                        onPress={() => {
                          setCopied(offer.code);
                          setTimeout(() => setCopied(null), 2000);
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                          {copied === offer.code ? "✓ Copied!" : "Copy"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Refer Card */}
            <View style={{
              backgroundColor: "#FDECEA",
              borderRadius: 16, padding: 18,
              borderWidth: 1.5, borderColor: "#F5C6C2",
            }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#C0392B" }}>
                🎁 Refer & Earn
              </Text>
              <Text style={{ fontSize: 13, color: "#555", marginTop: 6, lineHeight: 20 }}>
                Invite friends to Shahaji Travels and earn ₹50 wallet credits for each successful booking!
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#C0392B",
                  borderRadius: 12, paddingVertical: 14,
                  alignItems: "center", marginTop: 14,
                }}
                onPress={() => {}}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  Share Referral Link
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};
const os = StyleSheet.create({
  banner: { backgroundColor: C.orangeLight, padding: 16, borderBottomWidth: 1, borderBottomColor: C.orangeBorder },
  bannerTitle: { fontSize: F.md, fontWeight: "900", color: C.orange },
  bannerSub: { fontSize: F.xs, color: C.textMid, marginTop: 3 },
  offerCard: { flexDirection: "row", backgroundColor: C.white, borderRadius: 16, marginBottom: 14, borderWidth: 1.5, overflow: "hidden", elevation: 2 },
  offerLeft: { width: 80, alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  offerDiscount: { color: C.white, fontSize: F.xxl, fontWeight: "900", marginTop: 4 },
  offerDiscountSub: { color: "rgba(255,255,255,0.8)", fontSize: F.xs, fontWeight: "800" },
  offerDesc: { fontSize: F.sm, fontWeight: "800", color: C.text },
  offerMin: { fontSize: F.xs, color: C.textSub, marginTop: 3 },
  offerExpiry: { fontSize: F.xs, color: C.textSub, marginTop: 3 },
  codeRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  codeBox: { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderStyle: "dashed" },
  codeText: { fontWeight: "900", fontSize: F.sm, letterSpacing: 1 },
  copyBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  copyBtnText: { color: C.white, fontWeight: "900", fontSize: F.xs },
  referCard: { backgroundColor: C.orangeLight, borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: C.orangeBorder },
  referTitle: { fontSize: F.lg, fontWeight: "900", color: C.orange },
  referSub: { fontSize: F.sm, color: C.textMid, marginTop: 6, lineHeight: 20 },
});

// ============================================================
// 5. GET TICKET SCREEN
// ============================================================
export const GetTicketScreen = ({ visible, onClose, api, showAlert }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
      setBooking(null); setInput("");
    }
  }, [visible]);

  const handleFetch = async () => {
    if (!input.trim()) return;
    setLoading(true); setBooking(null);
    try {
      const r = await api.getBookingById(input.trim());
      const b = r.booking || r;
      if (!b || (!b._id && !b.bookingCode)) throw new Error("Booking not found");
      setBooking(b);
    } catch (err) { showAlert("Not Found", err?.message || "No booking found with this ID"); }
    finally { setLoading(false); }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.blue} />
          <ScreenHeader title="Get Ticket" icon="🔍" onBack={onClose} color={C.blue} subtitle="Retrieve booking details" />

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {/* Search Box */}
              <View style={gts.searchCard}>
                <Text style={gts.searchIcon}>🎫</Text>
                <Text style={gts.searchTitle}>Enter Booking ID</Text>
                <Text style={gts.searchSub}>Find your ticket using the booking ID </Text>
                <TextInput
                  style={gts.searchInput}
                  placeholder="e.g. ST2024XXXXX"
                  value={input}
                  onChangeText={setInput}
                  autoCapitalize="characters"
                  placeholderTextColor={C.textSub}
                />
                <PrimaryBtn title={loading ? "Searching..." : "🔍 Find My Ticket"} onPress={handleFetch} loading={loading} color={C.blue} style={{ marginTop: 10}} />
              </View>

              {/* Booking Result */}
              {booking && (
                <View style={gts.resultCard}>
                  <View style={gts.resultHead}>
                    <Text style={gts.resultIcon}>✅</Text>
                    <Text style={gts.resultTitle}>Booking Found!</Text>
                  </View>
                  <View style={gts.resultBody}>
                    {[
                      ["🎫 Booking ID", booking.bookingCode || booking._id],
                      ["👤 Passenger", booking.customerName || booking.passengerName],
                      ["📱 Phone", booking.mobile || booking.phone],
                      ["🚌 Route", `${booking.boardingPoint || "—"} → ${booking.droppingPoint || "—"}`],
                      ["📅 Date", booking.journeyDate || booking.date],
                      ["💺 Seat", booking.seatNo || (booking.seatNumbers || []).join(", ")],
                      ["💰 Amount", `₹${booking.totalAmount || booking.amount || 0}`],
                      ["💳 Payment", booking.paymentMethod || "Online"],
                      ["📊 Status", booking.bookingStatus || booking.status || "Confirmed"],
                    ].map(([label, val], i) => (
                      <View key={i} style={gts.detailRow}>
                        <Text style={gts.detailLabel}>{label}</Text>
                        <Text style={gts.detailValue}>{val || "—"}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tips */}
              <View style={ds.card}>
                <Text style={ds.cardTitle}>💡 Tips</Text>
                {[
                  
                  "Contact support if ID is lost",
                ].map((tip, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 6 }}>
                    <Text style={{ color: C.blue }}>•</Text>
                    <Text style={{ fontSize: F.sm, color: C.textMid, flex: 1 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const gts = StyleSheet.create({
  searchCard: { backgroundColor: C.white, borderRadius: 18, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.blueBorder, marginBottom: 16, elevation: 2 },
  searchIcon: { fontSize: 48, marginBottom: 12 },
  searchTitle: { fontSize: F.xl, fontWeight: "900", color: C.text },
  searchSub: { fontSize: F.sm, color: C.textSub, textAlign: "center", marginTop: 6, marginBottom: 16, lineHeight: 20 },
  searchInput: { width: "100%", borderWidth: 2, borderColor: C.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: F.lg, color: C.text, textAlign: "center", letterSpacing: 2, fontWeight: "900" },
  resultCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 2, borderColor: C.greenBorder, marginBottom: 16, overflow: "hidden" },
  resultHead: { backgroundColor: C.greenLight, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  resultIcon: { fontSize: 28 },
  resultTitle: { fontSize: F.lg, fontWeight: "900", color: C.green },
  resultBody: { padding: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.chip },
  detailLabel: { fontSize: F.sm, color: C.textSub, flex: 1 },
  detailValue: { fontSize: F.sm, fontWeight: "700", color: C.text, flex: 1, textAlign: "right" },
});

// ============================================================
// 6. CANCEL TICKET SCREEN
// ============================================================
export const CancelTicketScreen = ({ visible, onClose, api, showAlert }) => {
  const [input, setCancelInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [refundData, setRefundData] = useState(null); // ✅ ADD THIS
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
      setCancelInput(""); setStep(1);
    }
  }, [visible]);

 const handleCancel = async () => {
  if (!input.trim()) return;
  setLoading(true);
  try {
    const res = await fetch(
      "https://shahaji-travels-backend.onrender.com/api/bookings/" + input.trim() + "/cancel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passengerName: "Customer" }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Cancel failed");
    setRefundData({
      refundAmount:  data.refundAmount  || 0,
      refundPercent: data.refundPercent || 0,
    });
    setStep(3);
  } catch (err) {
    showAlert("Cancellation Failed", err?.message || "Could not cancel.");
  } finally {
    setLoading(false);
  }
};
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.red} />
          <ScreenHeader title="Cancel Ticket" icon="❌" onBack={onClose} color={C.red} subtitle="Cancellation & refund" />

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {step === 3 ? (
              /* Success */
              <View style={cts.successCard}>
                <Text style={cts.successIcon}>✅</Text>
                <Text style={cts.successTitle}>Ticket Cancelled</Text>
               {refundData?.refundAmount > 0 ? (
  <>
    <View style={{
      backgroundColor: "#E8F5E9", borderRadius: 12,
      padding: 14, marginTop: 12, width: "100%",
      borderWidth: 1, borderColor: "#A5D6A7",
      alignItems: "center",
    }}>
      <Text style={{ fontSize: 13, color: "#2E7D32", fontWeight: "700" }}>
        💰 Refund Amount
      </Text>
      <Text style={{ fontSize: 28, fontWeight: "900", color: "#1B5E20", marginTop: 4 }}>
        ₹{refundData.refundAmount}
      </Text>
      <Text style={{ fontSize: 12, color: "#555", marginTop: 6, textAlign: "center" }}>
        {refundData.refundPercent}% refund मिळेल
      </Text>
    </View>
    <View style={{
      backgroundColor: "#FFF8E1", borderRadius: 10,
      padding: 12, marginTop: 10, width: "100%",
      borderWidth: 1, borderColor: "#FFE082",
    }}>
      <Text style={{ fontSize: 12, color: "#E65100", textAlign: "center", lineHeight: 18 }}>
        ⚠️ Refund cash/UPI ने दिला जाईल.{"\n"}
        Admin तुम्हाला 24 तासात contact करेल.{"\n"}
        Phone: 9766775660
      </Text>
    </View>
  </>
) : (
  <View style={{
    backgroundColor: "#FFEBEE", borderRadius: 10,
    padding: 12, marginTop: 10, width: "100%",
    borderWidth: 1, borderColor: "#FFCDD2",
  }}>
    <Text style={{ fontSize: 12, color: "#C62828", textAlign: "center", lineHeight: 18 }}>
      ❌ No Refund{"\n"}
      Departure च्या 6 तासांच्या आत cancel केले.
    </Text>
  </View>
)}
                <PrimaryBtn title="Back to Home" color={C.green} style={{ marginTop: 20 }} onPress={onClose} />
              </View>
            ) : (
              <>
                {/* Warning Banner */}
                <View style={cts.warningBanner}>
                  <Text style={{ fontSize: 28 }}>⚠️</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={cts.warningTitle}>Cancellation Charges Apply</Text>
                    <Text style={cts.warningSub}>Cancellations within 2 hours of departure are non-refundable</Text>
                  </View>
                </View>

                {/* Policy */}
                <View style={ds.card}>
                  <Text style={ds.cardTitle}>📋 Cancellation Policy</Text>
                  {[
                    { time: "More than 24 hrs before", refund: "90% refund", color: C.green },
                    { time: "12–24 hrs before", refund: "75% refund", color: C.green },
                    { time: "4–12 hrs before", refund: "50% refund", color: C.warning },
                    { time: "2–4 hrs before", refund: "25% refund", color: C.warning },
                    { time: "Less than 2 hrs", refund: "No refund", color: C.red },
                  ].map((p, i) => (
                    <View key={i} style={cts.policyRow}>
                      <Text style={cts.policyTime}>{p.time}</Text>
                      <View style={[cts.policyBadge, { backgroundColor: p.color + "22" }]}>
                        <Text style={[cts.policyRefund, { color: p.color }]}>{p.refund}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Input */}
                {step === 1 && (
                  <View style={ds.card}>
                    <Text style={ds.cardTitle}>Enter Booking ID to Cancel</Text>
                    <TextInput
                      style={cts.cancelInput}
                      placeholder="e.g. ST2024XXXXX"
                      value={input}
                      onChangeText={setCancelInput}
                      autoCapitalize="characters"
                      placeholderTextColor={C.textSub}
                    />
                    <PrimaryBtn title="Continue" color={C.red} onPress={() => { if (input.trim()) setStep(2); }}
                      disabled={!input.trim()} style={{ marginTop: 12 }} />
                  </View>
                )}

                {/* Confirm Step */}
                {step === 2 && (
                  <View style={cts.confirmCard}>
                    <Text style={cts.confirmTitle}>Confirm Cancellation</Text>
                    <Text style={cts.confirmSub}>Booking ID: <Text style={{ fontWeight: "900", color: C.red }}>{input}</Text></Text>
                    <Text style={cts.confirmSub}>This action cannot be undone.</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                      <TouchableOpacity style={cts.backBtn} onPress={() => setStep(1)}>
                        <Text style={{ color: C.textMid, fontWeight: "700" }}>Go Back</Text>
                      </TouchableOpacity>
                      <PrimaryBtn title={loading ? "Cancelling..." : "Yes, Cancel Ticket"} loading={loading}
                        color={C.red} style={{ flex: 1 }} onPress={handleCancel} />
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const cts = StyleSheet.create({
  warningBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8E1", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: C.orangeBorder },
  warningTitle: { fontSize: F.sm, fontWeight: "900", color: C.warning },
  warningSub: { fontSize: F.xs, color: C.textMid, marginTop: 3, lineHeight: 18 },
  policyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.chip },
  policyTime: { fontSize: F.sm, color: C.textMid, flex: 1 },
  policyBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  policyRefund: { fontSize: F.xs, fontWeight: "900" },
  cancelInput: { borderWidth: 2, borderColor: C.red, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: F.lg, color: C.text, textAlign: "center", letterSpacing: 2, fontWeight: "900" },
  confirmCard: { backgroundColor: C.redLight, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: C.redBorder },
  confirmTitle: { fontSize: F.xl, fontWeight: "900", color: C.red, textAlign: "center" },
  confirmSub: { fontSize: F.sm, color: C.textMid, textAlign: "center", marginTop: 8 },
  backBtn: { borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 15, alignItems: "center", paddingHorizontal: 20 },
  successCard: { backgroundColor: C.white, borderRadius: 20, padding: 36, alignItems: "center", borderWidth: 2, borderColor: C.greenBorder, marginTop: 20 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: F.xxl, fontWeight: "900", color: C.green },
  successSub: { fontSize: F.sm, color: C.textMid, textAlign: "center", marginTop: 8, lineHeight: 20 },
});

// ============================================================
// 7. CUSTOMER CARE SCREEN
// ============================================================
export const CustomerCareScreen = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const [openFaq, setOpenFaq] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    fetch("https://shahaji-travels-backend.onrender.com/api/settings")
      .then(res => res.json())
      .then(data => { if (data) setSettings(data); })
      .catch(err => console.log(err));
  }, []);

  if (!visible) return null;

  const contacts = [
    {
      icon: "📞", label: "Support",
      value: settings?.contactPhone1 || "9766775660",
      action: () => Linking.openURL(`tel:${settings?.contactPhone1 || "9766775660"}`),
      btnText: "Call Now", btnColor: "#C0392B",
    },
    {
      icon: "📱", label: "Contact 1",
      value: settings?.contactPhone1 || "9766775660",
      action: () => Linking.openURL(`tel:${settings?.contactPhone1 || "9766775660"}`),
      btnText: "Call", btnColor: "#27AE60",
    },
    {
      icon: "📱", label: "Contact 2",
      value: settings?.contactPhone2 || "7350725223",
      action: () => Linking.openURL(`tel:${settings?.contactPhone2 || "7350725223"}`),
      btnText: "Call", btnColor: "#27AE60",
    },
    {
      icon: "📧", label: "Email",
      value: settings?.supportEmail || "support@shahajitravels.com",
      action: () => Linking.openURL(`mailto:${settings?.supportEmail || "support@shahajitravels.com"}`),
      btnText: "Email", btnColor: "#0A84FF",
    },
  ];

  const faqs = [
    { q: "How do I cancel my booking?", a: "Go to Cancel Ticket in the menu and enter your booking ID." },
    { q: "When will I get my refund?", a: "Refunds are processed within 24 hours by admin via cash/UPI." },
    { q: "Can I change my seat?", a: "Seat changes are not allowed after booking confirmation." },
    { q: "What if the bus is late?", a: "Contact our helpline for real-time bus tracking." },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <StatusBar barStyle="light-content" backgroundColor="#C0392B" />

          {/* Header */}
          <View style={{
            backgroundColor: "#C0392B",
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 14,
            paddingTop: Platform.OS === "android" ? 38 : 14,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center", marginRight: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>📞 Customer Care</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 }}>
                We're here to help, 24/7
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Hero Card */}
            <View style={{
              backgroundColor: "#FDECEA",
              margin: 16, borderRadius: 16, padding: 24,
              alignItems: "center",
              borderWidth: 1, borderColor: "#F5C6C2",
            }}>
              <Text style={{ fontSize: 48, marginBottom: 10 }}>🙏</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#C0392B" }}>
                How can we help you?
              </Text>
              <Text style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
                Our support team is available round the clock
              </Text>
            </View>

            {/* Contact Us */}
            <Text style={{
              fontSize: 15, fontWeight: "700", color: "#1C1C1E",
              marginHorizontal: 16, marginBottom: 10,
            }}>
              📲 Contact Us
            </Text>

            {contacts.map((c, i) => (
              <View key={i} style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "#FFFFFF",
                marginHorizontal: 16, marginBottom: 10,
                borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: "#E5E5EA",
                elevation: 1,
              }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: "#FDECEA",
                  justifyContent: "center", alignItems: "center", marginRight: 14,
                }}>
                  <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#8E8E93", fontWeight: "600" }}>
                    {c.label}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1C1E", marginTop: 2 }}>
                    {c.value}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={c.action}
                  style={{
                    backgroundColor: c.btnColor,
                    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                    {c.btnText}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Office Hours */}
            <View style={{
              backgroundColor: "#FFFFFF",
              margin: 16, marginTop: 6,
              borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: "#E5E5EA",
            }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1C1E", marginBottom: 12 }}>
                🕐 Office Hours
              </Text>
              {[
                ["Mon–Fri",  "6:00 AM – 11:00 PM"],
                ["Saturday", "7:00 AM – 10:00 PM"],
                ["Sunday",   "8:00 AM – 8:00 PM"],
                ["Helpline", "24/7 Available"],
              ].map(([day, time]) => (
                <View key={day} style={{
                  flexDirection: "row", justifyContent: "space-between",
                  paddingVertical: 9,
                  borderBottomWidth: 1, borderBottomColor: "#F2F2F7",
                }}>
                  <Text style={{ fontSize: 13, color: "#555" }}>{day}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E" }}>{time}</Text>
                </View>
              ))}
            </View>

            {/* FAQs */}
            <Text style={{
              fontSize: 15, fontWeight: "700", color: "#1C1C1E",
              marginHorizontal: 16, marginBottom: 10, marginTop: 4,
            }}>
              ❓ Frequently Asked Questions
            </Text>

            {faqs.map((faq, i) => (
              <TouchableOpacity
                key={i}
                style={{
                  backgroundColor: "#FFFFFF",
                  marginHorizontal: 16, marginBottom: 10,
                  borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: "#E5E5EA",
                }}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", flex: 1, marginRight: 8 }}>
                    {faq.q}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#C0392B", fontWeight: "700" }}>
                    {openFaq === i ? "▲" : "▼"}
                  </Text>
                </View>
                {openFaq === i && (
                  <Text style={{
                    fontSize: 13, color: "#555", marginTop: 10,
                    lineHeight: 20, paddingTop: 10,
                    borderTopWidth: 1, borderTopColor: "#F2F2F7",
                  }}>
                    {faq.a}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const ccs = StyleSheet.create({
  heroCard: { backgroundColor: C.greenLight, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: C.greenBorder },
  heroEmoji: { fontSize: 48, marginBottom: 10 },
  heroTitle: { fontSize: F.xl, fontWeight: "900", color: C.green },
  heroSub: { fontSize: F.sm, color: C.textMid, marginTop: 6 },
  contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, elevation: 1 },
  contactIcon: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center" },
  contactLabel: { fontSize: F.xs, color: C.textSub, fontWeight: "700" },
  contactValue: { fontSize: F.sm, fontWeight: "900", color: C.text, marginTop: 2 },
  contactSub: { fontSize: F.xs, color: C.textSub, marginTop: 1 },
  contactBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  contactBtnText: { color: C.white, fontWeight: "900", fontSize: F.xs },
  hoursCard: { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  hoursTitle: { fontSize: F.md, fontWeight: "900", color: C.text, marginBottom: 12 },
  hoursGrid: {},
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.chip },
  hoursDay: { fontSize: F.sm, color: C.textMid, fontWeight: "600" },
  hoursTime: { fontSize: F.sm, fontWeight: "700", color: C.text },
  faqCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  faqHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQ: { fontSize: F.sm, fontWeight: "800", color: C.text, flex: 1, marginRight: 8 },
  faqArrow: { fontSize: F.xs, color: C.textSub },
  faqA: { fontSize: F.sm, color: C.textMid, marginTop: 10, lineHeight: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.chip },
});

// ============================================================
// 8. LANGUAGE SCREEN

export const LanguageScreen = ({ visible, onClose, currentLanguage, onChangeLanguage, SUPPORTED_LANGUAGES }) => {
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const langs = [
    { key: "English", flag: "🇬🇧", native: "English", sub: "English", desc: "All text in English" },
    { key: "मराठी",   flag: "🟠",   native: "मराठी",   sub: "Marathi", desc: "सर्व मजकूर मराठीत" },
    { key: "हिंदी",   flag: "🇮🇳",   native: "हिंदी",   sub: "Hindi",   desc: "सभी पाठ हिंदी में" },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <StatusBar barStyle="light-content" backgroundColor="#C0392B" />

          {/* Header */}
          <View style={{
            backgroundColor: "#C0392B",
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 14,
            paddingTop: Platform.OS === "android" ? 38 : 14,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center", marginRight: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", lineHeight: 30 }}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>🌐 Language / भाषा</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 }}>
                Choose your preferred language
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

            {/* Info Card */}
            <View style={{
              backgroundColor: "#FDECEA",
              borderRadius: 14, padding: 18, marginBottom: 20,
              borderWidth: 1, borderColor: "#F5C6C2",
            }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#C0392B" }}>
                🌍 Select App Language
              </Text>
              <Text style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                The app will display all content in your chosen language
              </Text>
            </View>

            {/* Language Options */}
            {langs.map(lang => {
              const isSelected = currentLanguage === lang.key;
              return (
                <TouchableOpacity
                  key={lang.key}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: isSelected ? "#FDECEA" : "#FFFFFF",
                    borderRadius: 16, padding: 18, marginBottom: 14,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? "#C0392B" : "#E5E5EA",
                    elevation: isSelected ? 3 : 1,
                  }}
                  onPress={() => onChangeLanguage(lang.key)}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 36, marginRight: 16 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18, fontWeight: "700",
                      color: isSelected ? "#C0392B" : "#1C1C1E",
                    }}>
                      {lang.native}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 3 }}>
                      {lang.sub} · {lang.desc}
                    </Text>
                  </View>

                  {/* Radio */}
                  <View style={{
                    width: 26, height: 26, borderRadius: 13,
                    borderWidth: 2,
                    borderColor: isSelected ? "#C0392B" : "#D0D0D0",
                    justifyContent: "center", alignItems: "center",
                    backgroundColor: "#fff",
                  }}>
                    {isSelected && (
                      <View style={{
                        width: 13, height: 13, borderRadius: 6.5,
                        backgroundColor: "#C0392B",
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Save Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#C0392B",
                borderRadius: 16, paddingVertical: 17,
                alignItems: "center", marginTop: 8,
                elevation: 3,
              }}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 }}>
                Save &amp; Continue
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const ls = StyleSheet.create({
  infoCard: { backgroundColor: C.purpleLight, borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.purpleBorder },
  infoTitle: { fontSize: F.md, fontWeight: "900", color: C.purple },
  infoSub: { fontSize: F.sm, color: C.textMid, marginTop: 6 },
  langCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 2, borderColor: C.border, elevation: 1 },
  langCardSelected: { borderColor: C.purple, backgroundColor: C.purpleLight },
  langFlag: { fontSize: 36 },
  langNative: { fontSize: F.xl, fontWeight: "900", color: C.text },
  langSub: { fontSize: F.xs, color: C.textSub, marginTop: 3 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.purple },
});

export const TermsModal = ({ visible, onAccept, onClose }) => {
  const TERMS = [
    {
      icon: "🎫",
      bg: "#FDECEA",
      title: "Non-transferable tickets",
      sub: "Tickets are valid only for the booked passenger",
    },
    {
      icon: "⏰",
      bg: "#E8F5E9",
      title: "Arrive 15 minutes early",
      sub: "Be at the boarding point before departure time",
    },
    {
      icon: "🪪",
      bg: "#E3F2FD",
      title: "Carry valid govt. ID",
      sub: "Aadhaar, PAN, Passport, or Voter ID required",
    },
    {
      icon: "💰",
      bg: "#FFF3E0",
      title: "No refund within 2 hours",
      sub: "Cancellations near departure are non-refundable",
    },
    {
      icon: "🔄",
      bg: "#F3E5F5",
      title: "Schedule may change",
      sub: "Due to traffic, weather, or operational reasons",
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tm.overlay}>
        <View style={tm.container}>

          {/* ── Header ── */}
          <View style={tm.header}>
            <View style={tm.headerIconCircle}>
              <Text style={{ fontSize: 26 }}>📄</Text>
            </View>
            <Text style={tm.title}>Terms & Conditions</Text>
            <Text style={tm.subtitle}>Please read before booking</Text>
          </View>

          {/* ── Terms list ── */}
          <ScrollView
            style={{ maxHeight: 280 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {TERMS.map((item, i) => (
              <View key={i} style={tm.termRow}>
                <View style={[tm.termIconWrap, { backgroundColor: item.bg }]}>
                  <Text style={{ fontSize: 15 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tm.termTitle}>{item.title}</Text>
                  <Text style={tm.termSub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ── Warning note ── */}
          <View style={tm.warningBox}>
            <Text style={tm.warningText}>
              ⚠️  By proceeding you agree to Shahaji Travels' terms, refund policy, and privacy policy.
            </Text>
          </View>

          {/* ── Buttons ── */}
          <View style={tm.footer}>
            <TouchableOpacity style={tm.cancelBtn} onPress={onClose}>
              <Text style={tm.cancelText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tm.acceptBtn} onPress={onAccept}>
              <Text style={tm.acceptText}>Accept & Continue ✓</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const tm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,          // 🔥 ADD THIS
  elevation: 9999, 
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
  },
  header: {
    backgroundColor: "#C0392B",
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  termRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 12,
    marginBottom: 8,
  },
  termIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  termTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 3,
  },
  termSub: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: "#FDECEA",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F5C6C2",
  },
  warningText: {
    fontSize: 12,
    color: "#C0392B",
    lineHeight: 18,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelText: {
    color: "#666666",
    fontWeight: "600",
    fontSize: 14,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#C0392B",
    alignItems: "center",
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
// ============================================================
// 9. LOGOUT SCREEN
// ============================================================
export const LogoutScreen = ({ visible, onClose, onConfirmLogout, user }) => {
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const initials = (user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

          <View style={lgs.content}>
            {/* Close */}
            <TouchableOpacity style={lgs.closeBtn} onPress={onClose}>
              <Text style={lgs.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Card */}
            <View style={lgs.card}>
              <View style={lgs.avatar}>
                <Text style={lgs.avatarText}>{initials}</Text>
              </View>
              <Text style={lgs.userName}>{user?.name || "Traveller"}</Text>
              <Text style={lgs.userEmail}>{user?.email || ""}</Text>

              <View style={lgs.divider} />

              <Text style={lgs.confirmTitle}>Logout from Shahaji Travels?</Text>
              <Text style={lgs.confirmSub}>You will need to login again to access your bookings and wallet</Text>

              <View style={lgs.btnRow}>
                <TouchableOpacity style={lgs.cancelBtn} onPress={onClose}>
                  <Text style={lgs.cancelBtnText}>Stay Logged In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={lgs.logoutBtn} onPress={onConfirmLogout}>
                  <Text style={lgs.logoutBtnText}>🚪 Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={lgs.footNote}>Your data is safely stored and will be available on next login</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const lgs = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", padding: 24 },
  closeBtn: { position: "absolute", top: 16, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: C.chip, justifyContent: "center", alignItems: "center", zIndex: 10 },
  closeBtnText: { fontSize: F.md, color: C.textMid, fontWeight: "700" },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 28, alignItems: "center", elevation: 8, borderWidth: 1, borderColor: C.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.red, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  avatarText: { color: C.white, fontSize: 28, fontWeight: "900" },
  userName: { fontSize: F.xl, fontWeight: "900", color: C.text },
  userEmail: { fontSize: F.sm, color: C.textSub, marginTop: 4 },
  divider: { width: "100%", height: 1, backgroundColor: C.chip, marginVertical: 20 },
  confirmTitle: { fontSize: F.lg, fontWeight: "900", color: C.text, textAlign: "center" },
  confirmSub: { fontSize: F.sm, color: C.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 24, width: "100%" },
  cancelBtn: { flex: 1, borderWidth: 2, borderColor: C.border, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  cancelBtnText: { fontWeight: "800", color: C.textMid, fontSize: F.sm },
  logoutBtn: { flex: 1, backgroundColor: C.red, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  logoutBtnText: { color: C.white, fontWeight: "900", fontSize: F.sm },
  footNote: { textAlign: "center", color: C.textSub, fontSize: F.xs, marginTop: 20, lineHeight: 18 },
});

// ============================================================
// SHARED STYLES
// ============================================================
const ds = StyleSheet.create({
  fullScreen: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 1000 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  headerBack: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginRight: 10 },
  headerBackText: { color: C.white, fontSize: 28, fontWeight: "900", lineHeight: 32 },
  headerTitle: { color: C.white, fontWeight: "900", fontSize: F.lg },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: F.xs, marginTop: 1 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, margin: 16, marginTop: 0, marginBottom: 14, borderWidth: 1, borderColor: C.border, elevation: 1 },
  cardTitle: { fontSize: F.md, fontWeight: "900", color: C.text, marginBottom: 14 },
  sectionTitle: { fontSize: F.md, fontWeight: "900", color: C.text, marginBottom: 10, marginHorizontal: 2 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.chip },
  infoRowIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  infoRowLabel: { fontSize: F.xs, color: C.textSub, fontWeight: "700" },
  infoRowValue: { fontSize: F.sm, color: C.text, marginTop: 2 },
  primaryBtn: { borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center", elevation: 2 },
  primaryBtnText: { fontWeight: "900", fontSize: F.md, letterSpacing: 0.5 },
  emptyWrap: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: F.lg, fontWeight: "900", color: C.textMid, textAlign: "center" },
  emptySub: { fontSize: F.sm, color: C.textSub, textAlign: "center", marginTop: 8 },
});