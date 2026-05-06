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
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      loadProfile();
    } else {
      Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const r = await api.getUserProfile(user?._id || user?.id);
      setProfile(r?.user || r);
    } catch { setProfile(user); }
    finally { setLoading(false); }
  };

  if (!visible) return null;
  const p = profile || user || {};
  const initials = (p.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.red} />
          <ScreenHeader title="My Profile" icon="👤" onBack={onClose} />

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar Card */}
            <View style={ps.avatarCard}>
              <View style={ps.avatarCircle}>
                <Text style={ps.avatarText}>{initials}</Text>
              </View>
              <Text style={ps.userName}>{p.name || "—"}</Text>
              <Text style={ps.userEmail}>{p.email || "—"}</Text>
              <View style={ps.verifiedBadge}>
                <Text style={ps.verifiedText}>✓ Verified Account</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={ps.statsRow}>
              {[
                { label: "Wallet", value: `₹${p.wallet || wallet || 0}`, icon: "💰", color: C.green },
                { label: "Bookings", value: p.totalBookings || "0", icon: "🎫", color: C.blue },
                { label: "Points", value: p.rewardPoints || "0", icon: "⭐", color: C.gold },
              ].map((stat, i) => (
                <View key={i} style={[ps.statCard, { borderColor: stat.color + "33" }]}>
                  <Text style={ps.statIcon}>{stat.icon}</Text>
                  <Text style={[ps.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={ps.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Details Card */}
            <View style={ds.card}>
              <Text style={ds.cardTitle}>Personal Information</Text>
              {loading
                ? <ActivityIndicator color={C.red} style={{ marginVertical: 20 }} />
                : <>
                  <InfoRow icon="👤" label="Full Name" value={p.name || p.fullName} bold />
                  <InfoRow icon="📱" label="Mobile Number" value={p.phone || p.mobile} />
                  <InfoRow icon="📧" label="Email Address" value={p.email} />
                  <InfoRow icon="🎂" label="Member Since" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—"} />
                  
                </>
              }
            </View>

            {/* Membership Card */}
            <View style={ps.membershipCard}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 32 }}>🏆</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={ps.membershipTitle}>Kohinoor Member</Text>
                  <Text style={ps.membershipSub}>Enjoy exclusive benefits & early access</Text>
                </View>
              </View>
              <View style={ps.membershipBadge}>
                <Text style={ps.membershipBadgeText}>GOLD</Text>
              </View>
            </View>
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

    console.log("🔍 User object:", JSON.stringify(user)); // debug
    console.log("🔍 userId:", userId, "phone:", phone);

    let url = "https://shahaji-travels-backend.onrender.com/api/bookings";
    
   // userId आणि phone दोन्ही पाठव
if (userId && userId !== "undefined") {
  url += `?userId=${userId}&phone=${phone || ""}`;
} else if (phone) {
  url += `?phone=${phone}`;
}
    else {
      console.log("❌ No userId or phone found!");
      setBookings([]);
      return;
    }

    console.log("📡 Fetching:", url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log("📦 Response:", JSON.stringify(data).slice(0, 200));
    
    const list = Array.isArray(data) ? data : (data.bookings || []);
    setBookings(list);
  } catch (err) {
    console.log("❌ ERROR:", err);
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
    { code: "FIRST50", discount: 50, description: "50% off on your first booking!", minAmount: 200, expiry: "31 Dec 2025", color: C.red, icon: "🎉" },
    { code: "KOHINOOR20", discount: 20, description: "20% off for Kohinoor members", minAmount: 300, expiry: "15 Jan 2026", color: C.blue, icon: "👑" },
    { code: "MONSOON100", discount: 100, description: "Flat ₹100 off this monsoon season", minAmount: 500, expiry: "30 Sep 2025", color: C.green, icon: "🌧️" },
    { code: "REFER50", discount: 50, description: "Referral bonus — share & earn", minAmount: 0, expiry: "No expiry", color: C.purple, icon: "👥" },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.orange} />
          <ScreenHeader title="Offers & Deals" icon="🏷️" onBack={onClose} color={C.orange} subtitle="Exclusive savings for you" />

          {/* Banner */}
          <View style={os.banner}>
            <Text style={os.bannerTitle}>Save More, Travel More 🚌</Text>
            <Text style={os.bannerSub}>Apply codes at checkout for instant discounts</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
            {loading
              ? <ActivityIndicator color={C.orange} size="large" style={{ marginTop: 40 }} />
              : mockOffers.map((offer, i) => (
                <View key={i} style={[os.offerCard, { borderColor: offer.color + "44" }]}>
                  <View style={[os.offerLeft, { backgroundColor: offer.color }]}>
                    <Text style={{ fontSize: 28 }}>{offer.icon}</Text>
                    <Text style={os.offerDiscount}>₹{offer.discount}</Text>
                    <Text style={os.offerDiscountSub}>OFF</Text>
                  </View>
                  <View style={{ flex: 1, padding: 14 }}>
                    <Text style={os.offerDesc}>{offer.description}</Text>
                    {offer.minAmount > 0 && (
                      <Text style={os.offerMin}>Min booking ₹{offer.minAmount}</Text>
                    )}
                    <Text style={os.offerExpiry}>📅 Valid till: {offer.expiry}</Text>
                    <View style={os.codeRow}>
                      <View style={[os.codeBox, { borderColor: offer.color }]}>
                        <Text style={[os.codeText, { color: offer.color }]}>{offer.code}</Text>
                      </View>
                      <TouchableOpacity
                        style={[os.copyBtn, { backgroundColor: offer.color }]}
                        onPress={() => { setCopied(offer.code); setTimeout(() => setCopied(null), 2000); }}
                      >
                        <Text style={os.copyBtnText}>{copied === offer.code ? "✓ Copied!" : "Copy"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            }

            {/* Refer Banner */}
            <View style={os.referCard}>
              <Text style={os.referTitle}>🎁 Refer & Earn</Text>
              <Text style={os.referSub}>Invite friends to Shahaji Travels and earn ₹50 wallet credits for each successful booking!</Text>
              <PrimaryBtn title="Share Referral Link" color={C.orange} style={{ marginTop: 14 }} onPress={() => { }} />
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
  const [step, setStep] = useState(1); // 1=enter ID, 2=confirm, 3=success
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
      await api.cancelBooking(input.trim());
      setStep(3);
    } catch (err) { showAlert("Cancellation Failed", err?.message || "Could not cancel. Try again."); }
    finally { setLoading(false); }
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
                <Text style={cts.successSub}>Your refund will be processed to your wallet within 24 hours</Text>
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

  // ✅ Animation
 useEffect(() => {
  if (visible) {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  } else {
    Animated.timing(slideAnim, { toValue: SH, duration: 260, useNativeDriver: true }).start();
  }
}, [visible]);

  // ✅ Settings fetch (MOVE HERE)
 useEffect(() => {
  fetch("https://shahaji-travels-backend.onrender.com/api/settings")
    .then(res => res.json())
    .then(data => setSettings(data))
    .catch(err => console.log(err));
}, []);

  // ✅ AFTER hooks
  if (!visible) return null;
 const contacts = [
  {
    icon: "📞",
    label: "Support",
    value: settings?.phone || "Loading...",
    action: () => Linking.openURL(`tel:${settings?.phone}`),
    color: C.green,
    btnText: "Call Now",
  },
  {
    icon: "📱",
    label: "Contact 1",
    value: settings?.contactPhone1 || "Loading...",
    action: () => Linking.openURL(`tel:${settings?.contactPhone1}`),
    color: "#25D366",
    btnText: "Call",
  },
  {
    icon: "📱",
    label: "Contact 2",
    value: settings?.contactPhone2 || "Loading...",
    action: () => Linking.openURL(`tel:${settings?.contactPhone2}`),
    color: "#25D366",
    btnText: "Call",
  },
  {
    icon: "📧",
    label: "Email",
    value: settings?.email || "Loading...",
    action: () => Linking.openURL(`mailto:${settings?.email}`),
    color: C.blue,
    btnText: "Email",
  },
];

  const faqs = [
    { q: "How do I cancel my booking?", a: "Go to Cancel Ticket in the menu and enter your booking ID." },
    { q: "When will I get my refund?", a: "Refunds are processed within 24–48 hours to your wallet." },
    { q: "Can I change my seat?", a: "Seat changes are not allowed after booking confirmation." },
    { q: "What if the bus is late?", a: "Contact our 24/7 helpline for real-time bus tracking." },
  ];

 

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.green} />
          <ScreenHeader title="Customer Care" icon="📞" onBack={onClose} color={C.green} subtitle="We're here to help, 24/7" />

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Hero */}
            <View style={ccs.heroCard}>
              <Text style={ccs.heroEmoji}>🙏</Text>
              <Text style={ccs.heroTitle}>How can we help you?</Text>
              <Text style={ccs.heroSub}>Our support team is available round the clock</Text>
            </View>

            {/* Contact Options */}
            <Text style={ds.sectionTitle}>📲 Contact Us</Text>
            {contacts.map((c, i) => (
              <View key={i} style={ccs.contactCard}>
                <View style={[ccs.contactIcon, { backgroundColor: c.color + "22" }]}>
                  <Text style={{ fontSize: 28 }}>{c.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={ccs.contactLabel}>{c.label}</Text>
                  <Text style={ccs.contactValue}>{c.value}</Text>
                  <Text style={ccs.contactSub}>{c.sub}</Text>
                </View>
                <TouchableOpacity style={[ccs.contactBtn, { backgroundColor: c.color }]} onPress={c.action}>
                  <Text style={ccs.contactBtnText}>{c.btnText}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Office Hours */}
            <View style={ccs.hoursCard}>
              <Text style={ccs.hoursTitle}>🕐 Office Hours</Text>
              <View style={ccs.hoursGrid}>
                {[["Mon–Fri", "6:00 AM – 11:00 PM"], ["Saturday", "7:00 AM – 10:00 PM"], ["Sunday", "8:00 AM – 8:00 PM"], ["Helpline", "24/7 Available"]].map(([day, time], i) => (
                  <View key={i} style={ccs.hoursRow}>
                    <Text style={ccs.hoursDay}>{day}</Text>
                    <Text style={ccs.hoursTime}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* FAQs */}
            <Text style={ds.sectionTitle}>❓ Frequently Asked Questions</Text>
            {faqs.map((faq, i) => (
              <TouchableOpacity key={i} style={ccs.faqCard} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
                <View style={ccs.faqHead}>
                  <Text style={ccs.faqQ}>{faq.q}</Text>
                  <Text style={ccs.faqArrow}>{openFaq === i ? "▲" : "▼"}</Text>
                </View>
                {openFaq === i && <Text style={ccs.faqA}>{faq.a}</Text>}
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
// ============================================================
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
    { key: "मराठी", flag: "🟠", native: "मराठी", sub: "Marathi", desc: "सर्व मजकूर मराठीत" },
    { key: "हिंदी", flag: "🇮🇳", native: "हिंदी", sub: "Hindi", desc: "सभी पाठ हिंदी में" },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[ds.fullScreen, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar barStyle="light-content" backgroundColor={C.purple} />
          <ScreenHeader title="Language / भाषा" icon="🌐" onBack={onClose} color={C.purple} subtitle="Choose your preferred language" />

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={ls.infoCard}>
              <Text style={ls.infoTitle}>🌍 Select App Language</Text>
              <Text style={ls.infoSub}>The app will display all content in your chosen language</Text>
            </View>

            {langs.map(lang => {
              const isSelected = currentLanguage === lang.key;
              return (
                <TouchableOpacity
                  key={lang.key}
                  style={[ls.langCard, isSelected && ls.langCardSelected]}
                  onPress={() => { onChangeLanguage(lang.key); }}
                  activeOpacity={0.85}
                >
                  <Text style={ls.langFlag}>{lang.flag}</Text>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[ls.langNative, isSelected && { color: C.purple }]}>{lang.native}</Text>
                    <Text style={ls.langSub}>{lang.sub} · {lang.desc}</Text>
                  </View>
                  <View style={[ls.radioOuter, isSelected && { borderColor: C.purple }]}>
                    {isSelected && <View style={ls.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <PrimaryBtn title="Save & Continue" color={C.purple} style={{ marginTop: 24 }} onPress={onClose} />
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