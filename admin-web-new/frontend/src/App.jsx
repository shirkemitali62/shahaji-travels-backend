import React, { useEffect, useMemo, useState, useCallback } from "react";

// ===================== CONSTANTS =====================
const BASE_URL = import.meta.env.VITE_API_URL ||"https://shahaji-travels-backend.onrender.com";

const defaultSettings = {
  companyName: "Shahaji Travels",
  supportNumber: "+91 9876543210",
  supportEmail: "support@shahajitravels.com",
  contactName1: "Kaviraj Barge",
  contactPhone1: "9766775660",
  contactPhone2: "7350725223",
  refundPolicy: "Tickets once booked are subject to operator refund/cancellation policy.",
  darkMode: true,
  notifications: true,
  seatHoldMinutes: 10,
   cashPaymentEnabled: true,        // global cash on/off
  cashOverridePhones: [],
};

const menu = [
  { key: "dashboard",     icon: "📊", label: "Dashboard" },
  { key: "bookings",      icon: "🎫", label: "Bookings"  },
  { key: "trips",         icon: "🗺️", label: "Trips"     },
  { key: "buses",         icon: "🚍", label: "Buses"     },
  { key: "routes",        icon: "📍", label: "Routes"    },
  { key: "customers",     icon: "👥", label: "Customers" },
  { key: "reports",       icon: "📈", label: "Reports"   },
  { key: "busreport",     icon: "🚌", label: "Bus Report" },
  { key: "settings",      icon: "⚙️", label: "Settings"  },
  { key: "offers",        icon: "🏷️", label: "Offers"    },
  { key: "popular",       icon: "🛣️", label: "Popular Routes" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "qr",            icon: "📱", label: "QR Payment" },
  { key: "backup",        icon: "🗄️", label: "Backup" },
];

// ── SEATER-SLEEPER BUS: Lower deck (seater) + Upper deck (sleeper) ──
// ── AC SEATER-SLEEPER BUS (2+1): Exact layout per reference image ──
// LEFT: U1-U12 single column
// MIDDLE: seats 1-24 (2 per row: window+aisle)
// BACK SLEEPER: Left col A1-A6, Right 2 cols A-L (lower+upper)

const SS_LEFT_SINGLE = ["V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12"];
const SS_RIGHT_PAIRS = [
  { window: "1",  aisle: "2"  },
  { window: "3",  aisle: "4"  },
  { window: "5",  aisle: "6"  },
  { window: "7",  aisle: "8"  },
  { window: "9",  aisle: "10" },
  { window: "11", aisle: "12" },
  { window: "13", aisle: "14" },
  { window: "15", aisle: "16" },
  { window: "17", aisle: "18" },
  { window: "19", aisle: "20" },
  { window: "21", aisle: "22" },
  { window: "23", aisle: "24" },
];

const SS_BACK_SLEEPER = [
  { single: "A1", lower: "A", upper: "B"  },
  { single: "A2", lower: "C", upper: "D"  },
  { single: "A3", lower: "E", upper: "F"  },
  { single: "A4", lower: "G", upper: "H"  },
  { single: "A5", lower: "I", upper: "J"  },
  { single: "A6", lower: "K", upper: "L"  },
];

// Keep old names as aliases so getSeatDisplayLabel still works
const LOWER_SEAT_PAIRS = SS_RIGHT_PAIRS.map((p, i) => ({
  row: `Row ${i+1}`, seats: [p.window, p.aisle]
}));
const UPPER_SEAT_PAIRS = SS_LEFT_SINGLE.map((s, i) => ({
  row: `Row ${i+1}`, seats: [s]
}));

// ── AC SLEEPER BUS: 2x2 layout — image प्रमाणे ──
// Left side: E F | G H  (Lower | Upper)
// Right side: A B | C D (Lower | Upper)
// Row numbers: 1=A/E, 5=1, etc.
// ── AC SLEEPER BUS: 2x2 layout — EXACT match to reference image ──
// LEFT SIDE:  col1=Lower(E,G,5,7,13,15,21,23,31,29,33,35) col2=Upper(F,H,6,8,14,16,22,24,32,30,34,36)
// RIGHT SIDE: col1=Lower(A,C,1,3,9,11,17,19,25,27,37,39)  col2=Upper(B,D,2,4,10,12,18,20,26,28,38,40)
const AC_SLEEPER_ROWS = [
  { row:"R1",  leftLower:"E",  leftUpper:"F",  rightLower:"A",  rightUpper:"B"  },
  { row:"R2",  leftLower:"G",  leftUpper:"H",  rightLower:"C",  rightUpper:"D"  },
  { row:"R3",  leftLower:"5",  leftUpper:"6",  rightLower:"1",  rightUpper:"2"  },
  { row:"R4",  leftLower:"7",  leftUpper:"8",  rightLower:"3",  rightUpper:"4"  },
  { row:"R5",  leftLower:"13", leftUpper:"14", rightLower:"9",  rightUpper:"10" },
  { row:"R6",  leftLower:"15", leftUpper:"16", rightLower:"11", rightUpper:"12" },
  { row:"R7",  leftLower:"21", leftUpper:"22", rightLower:"17", rightUpper:"18" },
  { row:"R8",  leftLower:"23", leftUpper:"24", rightLower:"19", rightUpper:"20" },
  { row:"R9",  leftLower:"31", leftUpper:"32", rightLower:"25", rightUpper:"26" },
  { row:"R10", leftLower:"29", leftUpper:"30", rightLower:"27", rightUpper:"28" },
  { row:"R11", leftLower:"33", leftUpper:"34", rightLower:"37", rightUpper:"38" },
  { row:"R12", leftLower:"35", leftUpper:"36", rightLower:"39", rightUpper:"40" },
];

const AC_SLEEPER_ALL_SEATS = AC_SLEEPER_ROWS.flatMap(r =>
  [r.leftLower, r.leftUpper, r.rightLower, r.rightUpper]
);

const MASTER_POINTS = [
  { mr: "भावेकर वाडी", en: "Bhavekar Wadi" },
  { mr: "बनपुरी", en: "Banpuri" },
  { mr: "मालवण", en: "Malvan" },
  { mr: "कराड (आगाशिवनगर)", en: "Karad (Agashiv Nagar)" },
  { mr: "कृष्णा हॉस्पिटल कराड", en: "Krishna Hospital Karad" },
  { mr: "कराड कोल्हापूर नाका", en: "Karad Kolhapur Naka" },
  { mr: "कोरेगाव", en: "Koregaon" },
  { mr: "उंब्रज", en: "Umbraj" },
  { mr: "सातारा हायवे", en: "Satara Highway" },
  { mr: "शिरवळ", en: "Shirwal" },
  { mr: "नागोठणे", en: "Nagothane" },
  { mr: "नेरुळ", en: "Nerul" },
  { mr: "धायरी", en: "Dhayari" },
  { mr: "शिवाजीनगर", en: "Shivajinagar" },
  { mr: "पर्वती IIT", en: "Parvati IIT" },
  { mr: "रामवाडी", en: "Ramwadi" },
  { mr: "गोरेगाव चेकनाका", en: "Goregaon Check Naka" },
  { mr: "बोरिवली स्टेशन", en: "Borivali Station" },
  { mr: "चारकोप", en: "Charkop" },
  { mr: "महावीर नगर", en: "Mahavir Nagar" },
];
function AdminQRSettings({ showToast }) {
  const [settings, setSettings] = React.useState({
    upiId: "", upiName: "",
    qrEnabled: true, razorpayEnabled: true, cashEnabled: true,
    qrImageBase64: "",
  });
  const [qrFile, setQrFile] = React.useState(null);   // base64 string
  const [saving, setSaving] = React.useState(false);
  const [pendingBookings, setPendingBookings] = React.useState([]);
  const [loadingPending, setLoadingPending] = React.useState(false);

  // ── Load settings + pending bookings on mount ──
  React.useEffect(() => {
    fetch(`${BASE_URL}/api/qr-settings`)
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings(d.settings); })
      .catch(() => {});

    setLoadingPending(true);
    fetch(`${BASE_URL}/api/bookings`)
      .then(r => r.json())
      .then(list => {
        const arr = Array.isArray(list) ? list : (list.bookings || []);
        setPendingBookings(
          arr.filter(b =>
            (b.paymentMode === "QR_UPI" || b.paymentMode === "UPI_QR") &&
            b.paymentStatus === "Pending"
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  }, []);

  // ── QR Image Upload → base64 ──
  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Validate size (<2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("QR image 2MB पेक्षा कमी असावी!", "error"); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setQrFile(base64);
    };
    reader.readAsDataURL(file);
  };

  // ── Save Settings ── (BUG FIX: was API_BASE, now BASE_URL)
  const saveSettings = async () => {
    setSaving(true);
    try {
      const body = {
        upiId:          settings.upiId,
        upiName:        settings.upiName,
        qrEnabled:      settings.qrEnabled,
        razorpayEnabled: settings.razorpayEnabled,
        cashEnabled:    settings.cashEnabled,
      };
      if (qrFile) body.qrImageBase64 = qrFile;  // only send if new image selected

      const res = await fetch(`${BASE_URL}/api/qr-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
     if (data.success) {
        if (data.settings) setSettings(data.settings);
        setQrFile(null);
       showToast("✅ Settings saved successfully!");
        // Auto backup
       // Auto backup
        try {
          await fetch(`${BASE_URL}/api/admin/backup-silent`, { method: "POST" });
        } catch(e) { console.log("backup skip:", e.message); }
      } else {
        showToast("Save failed: " + (data.message || "Unknown error"), "error");
      }
    } catch (e) {
      showToast("Network error: " + e.message, "error");
    }
    setSaving(false);
  };

  // ── Approve / Reject ──
  const approveBooking = async (id) => {
    try {
      await fetch(`${BASE_URL}/api/bookings/${id}/qr-approve`, { method: "POST" });
      setPendingBookings(prev => prev.filter(b => b._id !== id));
      showToast("✅ Booking Approved & Confirmed!");
    } catch (e) {
      showToast("Approve failed: " + e.message, "error");
    }
  };

  const rejectBooking = async (id) => {
    if (!window.confirm("Reject this booking? Seats will be released.")) return;
    try {
      await fetch(`${BASE_URL}/api/bookings/${id}/qr-reject`, { method: "POST" });
      setPendingBookings(prev => prev.filter(b => b._id !== id));
      showToast("Booking Rejected. Seats released.", "error");
    } catch (e) {
      showToast("Reject failed: " + e.message, "error");
    }
  };

  // ── Toggle Switch Component ──
  const Toggle = ({ checked, onChange, label }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "13px 16px", background: "var(--bg3)", borderRadius: 10,
      border: `1px solid ${checked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
      cursor: "pointer", transition: "border-color 0.2s",
    }} onClick={onChange}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</span>
      <div style={{
        width: 48, height: 26, borderRadius: 13, border: "none",
        background: checked ? "#22c55e" : "#475569",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 3,
          left: checked ? 24 : 3,
          width: 20, height: 20, borderRadius: 10,
          background: "white", transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );

  const currentQR = qrFile || settings.qrImageBase64;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1>📱 QR Payment Settings</h1>
        <p>Payment methods control kara · UPI set kara · QR upload kara</p>
      </div>

      {/* ── ROW 1: Payment Methods + UPI Details ── */}
      <div className="two-col-grid">

        {/* Payment Methods */}
        <div className="section-card">
          <div className="section-title">💳 Payment Methods Toggle</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
             {[
              { key: "qrEnabled",       label: "📱 QR / UPI Payment (Recommended)" },
              { key: "razorpayEnabled", label: "💳 Razorpay (Online Gateway)" },
            ].map(({ key, label }) => (
              <Toggle
                key={key}
                checked={settings[key]}
                label={label}
                onChange={() => setSettings(p => ({ ...p, [key]: !p[key] }))}
              />
            ))}
          </div>

          {/* Status summary */}
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
            fontSize: 12, color: "#60a5fa",
          }}>
            ℹ️ Changes will reflect in mobile app after Save
          </div>
        </div>

        {/* UPI Details */}
        <div className="section-card">
          <div className="section-title">📲 UPI Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input className="form-input"
                value={settings.upiId || ""}
                onChange={e => setSettings(p => ({ ...p, upiId: e.target.value }))}
                placeholder="yourname@ybl"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Name (mobile app मध्ये दिसेल)</label>
              <input className="form-input"
                value={settings.upiName || ""}
                onChange={e => setSettings(p => ({ ...p, upiName: e.target.value }))}
                placeholder="KAVIRAJ KRISHNAT BARGE"
              />
            </div>

            {/* UPI Preview chip */}
            {settings.upiId && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)",
              }}>
                <span style={{ fontSize: 18 }}>💜</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#c084fc" }}>{settings.upiId}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{settings.upiName || "Account Name"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Code Image Section ── */}
      <div className="section-card">
        <div className="section-title">🖼️ QR Code Image Upload</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
          {/* Left: instructions + upload */}
          <div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
              PhonePe / GPay QR image upload करा. Mobile app मध्ये हेच QR दिसेल.<br/>
              <strong style={{ color: "var(--text)" }}>Image size: 2MB पेक्षा कमी असावी.</strong>
            </p>

            <label style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg,#e63946,#c1121f)",
              color: "white", padding: "11px 22px", borderRadius: 9,
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 12px rgba(230,57,70,0.3)",
            }}>
              📁 QR Image निवडा
              <input type="file" accept="image/*" onChange={handleQRUpload} style={{ display: "none" }} />
            </label>

            {qrFile && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>✅</span>
                <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                  New QR image ready — Save केल्यावर update होईल
                </span>
              </div>
            )}

            {!settings.qrImageBase64 && !qrFile && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠️</span>
                <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
                  QR upload नाही — Mobile app मध्ये फक्त UPI ID दिसेल
                </span>
              </div>
            )}
          </div>

          {/* Right: QR Preview */}
          <div style={{ display: "flex", gap: 16 }}>
            {/* Current / new preview */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "var(--text2)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}>
                {qrFile ? "New (unsaved)" : "Current QR"}
              </div>
              {currentQR ? (
                <img
                  src={`data:image/jpeg;base64,${currentQR}`}
                  alt="QR Code"
                  style={{
                    width: 130, height: 130, objectFit: "contain",
                    borderRadius: 12,
                    border: qrFile
                      ? "2px solid rgba(34,197,94,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: "#fff", padding: 4,
                  }}
                />
              ) : (
                <div style={{
                  width: 130, height: 130, background: "var(--bg3)",
                  borderRadius: 12, border: "1px dashed rgba(255,255,255,0.15)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 32 }}>📱</span>
                  <span style={{ fontSize: 10, color: "var(--text2)", textAlign: "center" }}>
                    No QR<br/>uploaded
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          className="btn-primary"
          onClick={saveSettings}
          disabled={saving}
          style={{ padding: "13px 32px", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
        >
          {saving ? "⟳ Saving..." : "💾 Save Settings"}
        </button>
        {saving && (
          <span style={{ fontSize: 12, color: "var(--text2)" }}>
            Uploading QR image... please wait
          </span>
        )}
      </div>

      {/* ── Pending QR Payments ── */}
      <div className="section-card">
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <div className="section-title" style={{ margin: 0 }}>⏳ Pending QR Payments</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              UTR verify करा आणि Approve / Reject करा
            </div>
          </div>
          <span style={{
            background: pendingBookings.length > 0
              ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.12)",
            color: pendingBookings.length > 0 ? "#f59e0b" : "#22c55e",
            border: `1px solid ${pendingBookings.length > 0 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.25)"}`,
            padding: "4px 14px", borderRadius: 20,
            fontSize: 12, fontWeight: 700,
          }}>
            {pendingBookings.length} pending
          </span>
        </div>

        {loadingPending ? (
          <div className="empty-state"><div className="empty-text">Loading...</div></div>
        ) : pendingBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">No pending QR payments — सब clear!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingBookings.map(b => (
              <div key={b._id} style={{
                background: "var(--bg3)", borderRadius: 12, padding: "14px 16px",
                borderLeft: "3px solid #f59e0b",
                border: "1px solid rgba(245,158,11,0.2)",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + Amount */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: 10, marginBottom: 6, flexWrap: "wrap",
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {b.passengerName || b.customerName || "—"}
                      </span>
                      <span style={{
                        background: "rgba(34,197,94,0.15)",
                        color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)",
                        padding: "2px 10px", borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        ₹{b.amount || b.totalAmount || 0}
                      </span>
                      <span style={{
                        background: "rgba(245,158,11,0.12)",
                        color: "#f59e0b", padding: "2px 8px",
                        borderRadius: 20, fontSize: 10, fontWeight: 700,
                      }}>
                        QR PENDING
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 3 }}>
                      📅 {b.journeyDate || b.date || "—"} &nbsp;|&nbsp;
                      🪑 Seats: <strong style={{ color: "var(--text)" }}>
                        {b.seatNumbers?.join(", ") || b.seatNo || "—"}
                      </strong>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 3 }}>
                      📞 {b.phone || b.mobile || "—"} &nbsp;|&nbsp;
                      🛣️ {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
                    </div>

                    {/* UTR highlighted */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      marginTop: 6, padding: "6px 12px",
                      background: b.conductorNote
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(239,68,68,0.1)",
                      border: `1px solid ${b.conductorNote ? "rgba(99,102,241,0.3)" : "rgba(239,68,68,0.2)"}`,
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 11, color: "var(--text2)" }}>UTR:</span>
                      <span style={{
                        fontFamily: "monospace", fontWeight: 800, fontSize: 13,
                        color: b.conductorNote ? "#818cf8" : "#f87171",
                      }}>
                        {b.conductorNote || "NOT PROVIDED ⚠️"}
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: "#8892a4", marginTop: 6 }}>
                      Booking ID: {b.bookingCode || b._id}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => approveBooking(b._id)}
                      style={{
                        background: "linear-gradient(135deg,#16a34a,#15803d)",
                        color: "white", border: "none", borderRadius: 9,
                        padding: "10px 20px", cursor: "pointer",
                        fontWeight: 700, fontSize: 13,
                        boxShadow: "0 3px 10px rgba(22,163,74,0.3)",
                      }}
                    >✅ Approve</button>
                    <button
                      onClick={() => rejectBooking(b._id)}
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 9, padding: "10px 20px",
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}
                    >❌ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== HELPERS =====================
function pointLabel(point) {
  if (!point) return "";
  if (typeof point === "string") return point;
  return point.mr + " / " + point.en;
}

function statusBadge(status) {
  const s = status || "";
  const cls =
    ["Active", "Confirmed", "Paid"].includes(s) ? "badge badge-green" :
    ["Pending", "Processing", "Requested"].includes(s) ? "badge badge-yellow" :
    ["Cancelled", "Inactive", "Failed", "Refunded"].includes(s) ? "badge badge-red" :
    "badge badge-blue";
  return React.createElement("span", { className: cls }, s || "—");
}

// Bus type check helpers
function isSleeperOnly(busType) {
  const t = (busType || "").toLowerCase();
  return t.includes("ac sleeper") && !t.includes("seater");
}
function isSeaterSleeper(busType) {
  const t = (busType || "").toLowerCase();
  return t.includes("seater") && t.includes("sleeper");
}
// ===================== OFFERS PAGE (Admin) =====================
// Add this to the menu array in App():
// { key: "offers",  icon: "🏷️", label: "Offers"  },
// { key: "popular", icon: "🛣️", label: "Popular Routes" },

// ─── OFFERS CRUD PAGE ────────────────────────────────────────────
function OffersAdminPage({ showToast }) {
  const emptyForm = {
    title: "", description: "", code: "", discountType: "flat",
    discount: "", minAmount: "", isActive: true, expiry: "",
  };
  const [offers, setOffers] = React.useState([]);
  const [form, setForm] = React.useState(emptyForm);
  const [editing, setEditing] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/offers/all");
      const list = Array.isArray(res) ? res : (res.offers || res.data || []);
      setOffers(list);
    } catch (e) {
      showToast("Could not load offers: " + e.message, "error");
    }
    setLoading(false);
  }

  // REPLACE the submit function inside BusesPage
async function submit() {
  if (!form.title.trim() || !form.code.trim()) {
    showToast("Title and Code are required!", "error"); return;
  }
  if (!form.discount) {
    showToast("Discount value is required!", "error"); return;
  }
  setLoading(true);
  try {
    if (editing) {
      await apiFetch("/api/offers/" + (editing._id || editing.id), {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setOffers(prev => prev.map(o =>
        String(o._id || o.id) === String(editing._id || editing.id)
          ? { ...o, ...form }
          : o
      ));
      showToast("Offer updated!");
    } else {
      const res = await apiFetch("/api/offers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setOffers(prev => [res.offer || res || { ...form, _id: Date.now() }, ...prev]);
      showToast("Offer added!");
    }
    setForm(emptyForm);
    setEditing(null);
  } catch (e) {
    showToast("Save failed: " + e.message, "error");
  }
  setLoading(false);
}
  async function toggleActive(id, current) {
    try {
      await apiFetch("/api/offers/" + id, {
        method: "PUT", body: JSON.stringify({ isActive: !current }),
      });
      setOffers(prev => prev.map(o =>
        String(o._id || o.id) === String(id) ? { ...o, isActive: !current } : o
      ));
      showToast(current ? "Offer disabled" : "Offer enabled");
    } catch (e) {
      showToast("Update failed", "error");
    }
  }

  async function deleteOffer(id) {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await apiFetch("/api/offers/" + id, { method: "DELETE" });
      setOffers(prev => prev.filter(o => String(o._id || o.id) !== String(id)));
      showToast("Offer deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏷️ Offers Management</h1>
        <p>Create and manage discount offers for passengers</p>
      </div>

      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Offer" : "➕ Add New Offer"}</div>
        <div className="form-grid">
          <Input label="Offer Title *" value={form.title}
            onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Festival Special" />
          <Input label="Coupon Code *" value={form.code}
            onChange={v => setForm(f => ({ ...f, code: v.toUpperCase() }))} placeholder="FESTIVE100" />
          <Select label="Discount Type" value={form.discountType}
            onChange={v => setForm(f => ({ ...f, discountType: v }))}
            options={["flat", "percentage"]} />
          <Input label="Discount Value *" value={form.discount}
            onChange={v => setForm(f => ({ ...f, discount: v }))} type="number"
            placeholder={form.discountType === "percentage" ? "10 (means 10%)" : "100 (means ₹100)"} />
          <Input label="Min Booking Amount (₹)" value={form.minAmount}
            onChange={v => setForm(f => ({ ...f, minAmount: v }))} type="number" placeholder="0" />
          <Input label="Expiry Date" value={form.expiry}
            onChange={v => setForm(f => ({ ...f, expiry: v }))} type="date" />
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Get ₹100 off on your first booking"
              style={{ resize: "vertical" }} />
          </div>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <label className="form-label">Status</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: "none",
                  background: form.isActive ? "#22c55e" : "#64748b",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3,
                  left: form.isActive ? 26 : 3,
                  width: 22, height: 22, borderRadius: 11,
                  background: "white", transition: "left 0.2s",
                }} />
              </button>
              <span style={{ fontSize: 13, color: form.isActive ? "#22c55e" : "#64748b", fontWeight: 600 }}>
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>{editing ? "Update Offer" : "Add Offer"}</button>
          {editing && (
            <button className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">All Offers ({offers.length})</div>
        {loading ? (
          <div className="empty-state"><div className="empty-text">Loading...</div></div>
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <div className="empty-text">No offers yet. Add your first offer above!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {offers.map(offer => {
              const oid = offer._id || offer.id;
              return (
                <div key={oid} style={{
                  background: "var(--bg3)", borderRadius: 12,
                  border: `1px solid ${offer.isActive ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                  padding: 16, position: "relative", overflow: "hidden",
                }}>
                  {/* Active indicator strip */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: offer.isActive ? "#22c55e" : "#64748b",
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>
                        {offer.title || offer.name || offer.offerName || "Offer"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        {offer.description || ""}
                      </div>
                    </div>
                    <span style={{
                      background: offer.isActive ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.2)",
                      color: offer.isActive ? "#22c55e" : "#64748b",
                      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {offer.isActive ? "Active" : "Off"}
                    </span>
                  </div>

                  {/* Coupon code */}
                  <div style={{
                    background: "rgba(230,57,70,0.1)", border: "1px dashed rgba(230,57,70,0.4)",
                    borderRadius: 8, padding: "8px 12px", display: "flex",
                    justifyContent: "space-between", alignItems: "center", marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>CODE</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "#fb7185", letterSpacing: 2 }}>
                      {offer.code || offer.couponCode || "—"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                    <span>
                      💰 {offer.discountType === "percentage" || offer.type === "percentage"
                        ? (offer.discount || offer.discountValue || offer.percent || 0) + "% OFF"
                        : "₹" + (offer.discount || offer.discountValue || offer.amount || 0) + " OFF"}
                    </span>
                    {(offer.minAmount || offer.minBookingAmount) > 0 && (
                      <span>Min: ₹{offer.minAmount || offer.minBookingAmount}</span>
                    )}
                    {offer.expiry && <span>📅 {offer.expiry}</span>}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-edit" style={{ flex: 1 }}
                      onClick={() => {
                        setEditing(offer);
                        setForm({
                          title: offer.title || offer.name || "",
                          description: offer.description || "",
                          code: offer.code || offer.couponCode || "",
                          discountType: offer.discountType || offer.type || "flat",
                          discount: String(offer.discount || offer.discountValue || offer.amount || ""),
                          minAmount: String(offer.minAmount || offer.minBookingAmount || ""),
                          isActive: offer.isActive !== false,
                          expiry: offer.expiry || "",
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>✏️ Edit</button>
                    <button
                      className="btn-sm"
                      style={{
                        flex: 1,
                        background: offer.isActive ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                        color: offer.isActive ? "#f59e0b" : "#22c55e",
                        border: `1px solid ${offer.isActive ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
                      }}
                      onClick={() => toggleActive(oid, offer.isActive)}
                    >
                      {offer.isActive ? "⏸ Disable" : "▶ Enable"}
                    </button>
                    <button className="btn-sm btn-del" onClick={() => deleteOffer(oid)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POPULAR ROUTES PAGE ──────────────────────────────────────────
function PopularRoutesPage({ showToast }) {
  const emptyForm = { 
    from: "", 
    to: "", 
    boardingPoints: [],   // ✅ NEW
    droppingPoints: [],   // ✅ NEW
    isActive: true, 
    order: 0 
  };

  const [routes, setRoutes] = React.useState([]);
  const [form, setForm] = React.useState(emptyForm);
  const [editing, setEditing] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const CITY_OPTIONS = [
    "Aagashiv Nagar", "Aanewadi Toll Plaza", "Atith", "Bandar Pakhadi", "Banpuri", "Bhuinj", "Borivali Station", "Borivali Tata Power", "Borgaon", "Chachegaon", "Chandani Chowk", "Charkop Sahyadri Nagar", "Chembur (Maitri Park)", "Chikuwadi", "Dhebewadi", "Dhebewadi Fata", "Durga Nagar", "Ganesh Chowk", "Ghatkopar Depo", "Ghatkopar R City Mall", "Ghatkopar Shreyas", "Ghatla", "Goregaon Check Naka", "Goregaon Virwani", "Gote", "Gudhe", "Indoli", "Janugadewadi", "Jaycoach", "Jui Nagar", "Kadhne", "Kalamboli", "Kamotha", "Kamraj Nagar", "Kandivali Samta Nagar", "Karad", "Karpewadi", "Kashil", "Khandala", "Kharghar", "Khed Shivapur", "Khodshi", "Kole", "Kolewadi", "Kusur", "Mahaveer Nagar", "Mahindra Gate", "Mahananda", "Malad Pushpa Park", "Malad Shantaram Talav", "Maldan", "Manegav", "Mankhurd", "Mankhurd Station", "Matoshri", "Milind Nagar", "Mumbai", "Nagthane", "Nalanda Bus Stop", "Navle Bridge (Katraj)", "Nerul", "Nisrale Fata", "Pachwad", "Pathanwadi", "Powai IIT", "Powai IIT Main Gate", "Powai Talav", "Pune", "Ramabai", "Ramwadi", "Ravet", "Sai Dham", "Sanpada", "Sariput Nagar", "Satara", "Seepaz", "Shendre", "Shindewadi", "Shirval", "Shivaji Nagar", "Shyam Nagar", "Surur", "Talbeed", "Talmavle", "Tarukh", "Tasawade Toll Plaza", "Umbraj", "Vahagaon", "Varje", "Varunji Fata", "Vashi", "Vele", "Vikhroli Depo", "Vikhroli Gandhinagar", "Vikhroli Station", "Vikhroli Surya Nagar", "Ving", "Vakad"
  ];

  React.useEffect(() => { loadRoutes(); }, []);

  async function loadRoutes() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/popular-routes");
      const list = Array.isArray(res) ? res : (res.routes || res.data || []);
      setRoutes(list);
    } catch (e) {
      setRoutes([]);
    }
    setLoading(false);
  }

  async function submit() {
    if (!form.from.trim() || !form.to.trim()) {
      showToast("From and To cities are required!", "error"); return;
    }
    if (form.from === form.to) {
      showToast("From and To cannot be same!", "error"); return;
    }

    try {
      if (editing) {
        await apiFetch("/api/popular-routes/" + (editing._id || editing.id), {
          method: "PUT",
          body: JSON.stringify(form),
        });

        setRoutes(prev => prev.map(r =>
          String(r._id || r.id) === String(editing._id || editing.id)
            ? { ...r, ...form }
            : r
        ));

        showToast("Route updated!");
      } else {
        const res = await apiFetch("/api/popular-routes", {
          method: "POST",
          body: JSON.stringify(form),
        });

        setRoutes(prev => [...prev, res.route || res || { ...form, _id: Date.now() }]);
        showToast("Route added!");
      }

      setForm(emptyForm);
      setEditing(null);

    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
  }

  async function toggleActive(id, current) {
    try {
      await apiFetch("/api/popular-routes/" + id, {
        method: "PUT",
        body: JSON.stringify({ isActive: !current }),
      });

      setRoutes(prev => prev.map(r =>
        String(r._id || r.id) === String(id)
          ? { ...r, isActive: !current }
          : r
      ));

      showToast(current ? "Route hidden" : "Route shown");
    } catch (e) {
      showToast("Update failed", "error");
    }
  }

  async function deleteRoute(id) {
    if (!window.confirm("Delete this popular route?")) return;

    try {
      await apiFetch("/api/popular-routes/" + id, { method: "DELETE" });

      setRoutes(prev => prev.filter(r =>
        String(r._id || r.id) !== String(id)
      ));

      showToast("Route deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  async function moveRoute(id, direction) {
    const idx = routes.findIndex(r => String(r._id || r.id) === String(id));
    if (idx < 0) return;

    const newRoutes = [...routes];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= newRoutes.length) return;

    [newRoutes[idx], newRoutes[swapIdx]] = [newRoutes[swapIdx], newRoutes[idx]];

    const updated = newRoutes.map((r, i) => ({ ...r, order: i }));
    setRoutes(updated);

    try {
      await apiFetch("/api/popular-routes/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: updated.map(r => r._id || r.id) }),
      });
    } catch {}
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🛣️ Popular Routes</h1>
        <p>Manage routes shown on the home screen of mobile app</p>
      </div>

      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Route" : "➕ Add Popular Route"}</div>

        <div className="form-grid">

          <div className="form-group">
            <label className="form-label">From City *</label>
            <select className="form-select" value={form.from}
              onChange={e => setForm(f => ({ ...f, from: e.target.value }))}>
              <option value="">— Select departure city —</option>
              {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">To City *</label>
            <select className="form-select" value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}>
              <option value="">— Select destination city —</option>
              {CITY_OPTIONS.filter(c => c !== form.from).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ✅ Boarding */}
          <Input
            label="Boarding Points (comma separated)"
            value={form.boardingPoints?.join(", ") || ""}
            onChange={v => setForm(f => ({
              ...f,
              boardingPoints: v.split(",").map(x => x.trim()).filter(Boolean)
            }))}
          />

          {/* ✅ Dropping */}
          <Input
            label="Dropping Points (comma separated)"
            value={form.droppingPoints?.join(", ") || ""}
            onChange={v => setForm(f => ({
              ...f,
              droppingPoints: v.split(",").map(x => x.trim()).filter(Boolean)
            }))}
          />

          <Input
            label="Display Order"
            value={String(form.order)}
            onChange={v => setForm(f => ({ ...f, order: Number(v) }))}
            type="number"
          />

        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>
            {editing ? "Update Route" : "Add Route"}
          </button>

          {editing && (
            <button className="btn-secondary" onClick={() => {
              setEditing(null);
              setForm(emptyForm);
            }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* LIST SAME AS BEFORE — untouched */}
      <div className="section-card">
        <div className="section-title">
          Popular Routes ({routes.length})
        </div>

        {routes.map((route, idx) => {
  const rid = route._id || route.id;

  return (
    <div key={rid} style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottom: "1px solid #333"
    }}>

      {/* ROUTE INFO */}
      <div>
        <b>{route.from} → {route.to}</b>

        {route.boardingPoints?.length > 0 && (
          <div style={{ fontSize: 12 }}>
            🟢 {route.boardingPoints.join(", ")}
          </div>
        )}

        {route.droppingPoints?.length > 0 && (
          <div style={{ fontSize: 12 }}>
            🔴 {route.droppingPoints.join(", ")}
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: 8 }}>

        {/* ✏️ EDIT */}
        <button className="btn-sm btn-edit"
          onClick={() => {
            setEditing(route);
            setForm({
              from: route.from,
              to: route.to,
              boardingPoints: route.boardingPoints || [],
              droppingPoints: route.droppingPoints || [],
              isActive: route.isActive !== false,
              order: route.order || idx
            });
          }}>
          ✏️
        </button>

        {/* ⏸ TOGGLE */}
        <button className="btn-sm"
          onClick={() => toggleActive(rid, route.isActive !== false)}>
          {route.isActive !== false ? "⏸" : "▶"}
        </button>

        {/* 🗑 DELETE */}
        <button className="btn-sm btn-del"
          onClick={() => deleteRoute(rid)}>
          🗑️
        </button>

      </div>
    </div>
  );
})}
      </div>
    </div>
  );
}
// ===================== TICKET HELPERS =====================
function generateTicket(booking) {
  const code = booking.bookingCode || booking.pnr || "BK000000";
  
  // Seat — फक्त seat number, R1·E नको
  const allSeats = booking.seatNumbers?.length 
  ? booking.seatNumbers 
  : booking.seatNo ? [booking.seatNo] : [];
const seatDisplay = allSeats.join(", ") || "—";
const seatCount = allSeats.length;
  
const payStatus = 
  booking.paymentStatus === "Paid"      ? "✅ Paid" :
  booking.paymentStatus === "Pending"   ? "⏳ Pending" :
  booking.paymentStatus === "Failed"    ? "❌ Failed" :
  booking.paymentStatus === "Refunded"  ? "↩️ Refunded" :
  booking.paymentStatus === "Cancelled" ? "🚫 Cancelled" :
  (booking.paymentStatus || "—");
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = [
    ["Booking ID", code],
    ["Passenger", booking.passengerName || "-"],
    ["Phone", booking.phone || "-"],
    ["Age / Gender", (booking.age || "-") + " / " + (booking.gender || "-")],
    ["Seat", seatDisplay],
    ["Route", (booking.boardingPoint || "-") + " to " + (booking.droppingPoint || "-")],
    ["Journey Date", booking.journeyDate || booking.date || "-"],
    ["Bus No", booking.busNo || booking.bus || "-"],
    ["Amount", "Rs. " + (booking.amount || booking.totalAmount || 0)],
    ["Payment Mode", booking.paymentMode || booking.paymentMethod || "-"],
    ["Payment Status", payStatus],
    ["Conductor Note", booking.conductorNote || "-"],
  ];
  w.document.write(
    "<html><head><title>Ticket - " + code + "</title><style>" +
    "body{font-family:Arial;padding:40px;max-width:600px;margin:auto}" +
    ".logo{text-align:center;margin-bottom:10px}" +
    ".logo img{width:80px;height:80px;border-radius:12px}" +
    "h1{text-align:center;color:#991b1b;margin:4px 0}" +
    "h3{text-align:center;color:#555;margin:4px 0 20px}" +
    ".row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0}" +
    ".label{color:#666;font-size:13px}.value{font-weight:bold;text-align:right;max-width:60%}" +
    ".footer{text-align:center;margin-top:30px;color:#666;font-size:12px}" +
    ".pay-ok{color:#16a34a;font-weight:bold}" +
    ".pay-due{color:#dc2626;font-weight:bold}" +
    "@media print{button{display:none}}" +
    "</style></head><body>" +
    "<div class='logo'>" +
    "<img src='https://shahaji-travels-backend.onrender.com/tickets/logo.png' onerror=\"this.style.display='none'\" />" +
    "</div>" +
    "<h1>SHAHAJI TRAVELS</h1><h3>Bus Ticket</h3>" +
    rows.map(function(r) {
      let valClass = "";
      if (r[1] && String(r[1]).includes("जमा")) valClass = " class='pay-ok'";
      if (r[1] && String(r[1]).includes("बाकी")) valClass = " class='pay-due'";
      return "<div class='row'><span class='label'>" + r[0] + "</span><span class='value'" + valClass + ">" + r[1] + "</span></div>";
    }).join("") +
    "<div class='footer'>Thank you for choosing Shahaji Travels!<br>Please arrive 15 minutes before departure.</div>" +
    "<br><button onclick='window.print()' style='display:block;margin:0 auto;padding:10px 30px;background:#991b1b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px'>Print</button>" +
    "</body></html>"
  );
  w.document.close();
}
function sendTicketOnWhatsApp(booking) {
  const code = booking.bookingCode || booking.pnr || "BK000000";
  
  const allSeats = booking.seatNumbers?.length 
    ? booking.seatNumbers 
    : booking.seatNo ? [booking.seatNo] : [];
  const seatDisplay = allSeats.join(", ") || "—";
  const seatCount = allSeats.length;

  const payStatus = 
    booking.paymentStatus === "Paid"      ? "✅ Paid" :
    booking.paymentStatus === "Pending"   ? "⏳ Pending" :
    booking.paymentStatus === "Failed"    ? "❌ Failed" :
    booking.paymentStatus === "Refunded"  ? "↩️ Refunded" :
    booking.paymentStatus === "Cancelled" ? "🚫 Cancelled" :
    (booking.paymentStatus || "—");

  const conductorNote = booking.conductorNote?.trim() 
    ? "\n*Conductor Note:* " + booking.conductorNote.trim()
    : "";

  const msg = encodeURIComponent(
    "🚌 *SHAHAJI TRAVELS*\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "🎫 *Booking Confirmed!*\n\n" +
    "*Booking ID:* " + code + "\n" +
    "*Bus No:* " + (booking.busNo || booking.bus || "-") + "\n" +
    "*Passenger:* " + (booking.passengerName || "-") + "\n" +
    "*Seat" + (seatCount > 1 ? "s (" + seatCount + ")*: " : ":* ") + seatDisplay + "\n" +
    "*Route:* " + (booking.boardingPoint || "-") + " → " + (booking.droppingPoint || "-") + "\n" +
    "*Date:* " + (booking.journeyDate || booking.date || "-") + "\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "*Amount:* ₹" + (booking.amount || booking.totalAmount || 0) + "\n" +
    "*Payment Mode:* " + (booking.paymentMode || booking.paymentMethod || "-") + "\n" +
    "*Payment Status:* " + payStatus +
    conductorNote + "\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "📞 *Manager:* 9766775660\n" +
    "Thank you for choosing Shahaji Travels! 🙏"
  );
  
  const phone = String(booking.phone || "").replace(/\D/g, "");
  const full = phone.length === 10 ? "91" + phone : phone;
  window.open("https://wa.me/" + full + "?text=" + msg, "_blank");
}

// ===================== API LAYER =====================

// ✅ FIX:
async function apiFetch(url, options = {}) {
  const res = await fetch(BASE_URL + url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body
      ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body))
      : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  return res.json();
}

// ===================== EMPTY FORMS =====================
const emptyBookingForm = {
  passengerName: "", phone: "", boardingPoint: "", droppingPoint: "",
  amount: "", seatNo: "", paymentMode: "Cash", paymentStatus: "Pending",
  age: "", gender: "Male", journeyDate: "", busNo: "", busId: "", busName: "",
  conductorNote: "", refundStatus: "Not Applicable", tripId: "",
  seatNumbers: [], // ✅ ADD THIS
};

// ===================== NORMALIZE HELPERS =====================
function normalizeBooking(b) {
  const allSeats = Array.isArray(b.seatNumbers) && b.seatNumbers.length
    ? b.seatNumbers.map(String)
    : b.seatNo ? [String(b.seatNo)] : [];
  return {
    ...b,
    _id: b._id || b.id,
    passengerName: b.passengerName || (b.passengers && b.passengers[0]?.name) || b.customerName || "-",
    phone: b.phone || b.mobile || "-",
    seatNo: allSeats[0] || "-",
    seatNumbers: allSeats,
    amount: b.amount || b.totalAmount || 0,
    busNo: b.busNo || b.busNumber || b.numberPlate || "",
    paymentMode: b.paymentMode || b.paymentMethod || "Cash",
    bookingCode: b.bookingCode || b.pnr || ("BK" + String(b._id || "").slice(-6)),
    age: b.age || (b.passengers && b.passengers[0]?.age) || "-",
    gender: b.gender || (b.passengers && b.passengers[0]?.gender) || "-",
  };
}


function normalizeRoute(r) {
  return {
    ...r,
    _id: r._id || r.id,
    routes: undefined,
  };
}

// ===================== MAIN APP =====================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("shahaji_admin_logged_in") === "true"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [page,    setPage]    = useState("dashboard");
  const [toast,   setToast]   = useState({ show: false, text: "", type: "success" });
  const [loading, setLoading] = useState(false);

  const [buses,     setBuses]     = useState([]);
  const [routes,    setRoutes]    = useState([]);
  const [trips,     setTrips]     = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [customers, setCustomers] = useState([]);

  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem("shahaji_settings");
      return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
    } catch { return defaultSettings; }
  });

 const [manualBooking,  setManualBooking]  = useState({ ...emptyBookingForm });
const [selectedTripId, setSelectedTripId] = useState("");
const [selectedSeat,   setSelectedSeat]   = useState("");
const [seatGenderMap,  setSeatGenderMap]  = useState({});
  const [selectedBookingForTicket, setSelectedBookingForTicket] = useState(null);
  const [seatPopup, setSeatPopup] = useState(null);

  const showToast = useCallback((text, type = "success") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 2800);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [busRes, routeRes, tripRes, bookingRes, customerRes] = await Promise.allSettled([
        apiFetch("/api/buses"),
        apiFetch("/api/routes"),
        apiFetch("/api/trips"),
        apiFetch("/api/bookings"),
        apiFetch("/api/customers"),
      ]);

      if (busRes.status === "fulfilled") {
        const d = busRes.value;
        setBuses(Array.isArray(d) ? d : Array.isArray(d.buses) ? d.buses : []);
      }
      if (routeRes.status === "fulfilled") {
        const d = routeRes.value;
        setRoutes(Array.isArray(d) ? d : Array.isArray(d.routes) ? d.routes : []);
      }
      if (tripRes.status === "fulfilled") {
        const d = tripRes.value;
        setTrips(Array.isArray(d) ? d : Array.isArray(d.trips) ? d.trips : []);
      }
      if (bookingRes.status === "fulfilled") {
        const d = bookingRes.value;
        const raw = Array.isArray(d) ? d : Array.isArray(d.bookings) ? d.bookings : [];
        setBookings(raw.map(normalizeBooking));
      }
      if (customerRes.status === "fulfilled") {
        const d = customerRes.value;
        setCustomers(Array.isArray(d) ? d : Array.isArray(d.customers) ? d.customers : []);
      }
    } catch (err) {
      showToast("Backend connection failed. Check server.", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { if (isLoggedIn) loadAll(); }, [isLoggedIn, loadAll]);

  function navigateTo(key) {
    setPage(key);
    setSidebarOpen(false);
  }

  const selectedTrip  = trips.find(t => String(t._id || t.id) === String(selectedTripId));
  const selectedRoute = routes.find(r => String(r._id || r.id) === String(selectedTrip?.routeId || ""));
  const selectedBus = buses.find(
  b => String(b._id || b.id) === String(selectedTrip?.busId || selectedTrip?.bus)
);
const bookedSeatsForTrip = bookings
    .filter(b => {
      if (selectedTripId) return String(b.tripId) === String(selectedTripId);
      if (manualBooking.busId) {
        return (
          (String(b.bus) === String(manualBooking.busId) ||
           String(b.busNo) === String(manualBooking.busNo)) &&
          (!manualBooking.journeyDate ||
           b.journeyDate === manualBooking.journeyDate ||
           b.date === manualBooking.journeyDate)
        );
      }
      return false;
    })
    .flatMap(b => {
      // ✅ seatNumbers array पण include करा
      const seats = Array.isArray(b.seatNumbers) && b.seatNumbers.length
        ? b.seatNumbers
        : b.seatNo ? [b.seatNo] : [];
      return seats.map(String);
    });
  function bookingBySeat(seatNo) {
    return bookings.find(b =>
      String(b.tripId) === String(selectedTripId) &&
      String(b.seatNo) === String(seatNo)
    );
  }

  // ===================== AUTH =====================
  async function handleLogin(email, password) {
    try {
      // Device fingerprint generate कर
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Shahaji Travels', 2, 15);
      const canvasData = canvas.toDataURL().slice(-30);

      const stableData = [
        navigator.language,
        navigator.platform,
        navigator.hardwareConcurrency || 0,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        canvasData,
      ].join("|");

      let hash = 0;
      for (let i = 0; i < stableData.length; i++) {
        hash = ((hash << 5) - hash) + stableData.charCodeAt(i);
        hash = hash & hash;
      }
      const fingerprint = Math.abs(hash).toString(36);
      const deviceInfo = `${navigator.platform} / ${navigator.language}`;

      const data = await apiFetch("/api/login", {
  method: "POST",
  body: { email, password, fingerprint, deviceInfo },
});
      if (data.success) {
        localStorage.setItem("shahaji_admin_logged_in", "true");
        setIsLoggedIn(true);
        showToast("Login successful!");
        return { success: true };
      }
      return { success: false, message: data.message || "Invalid credentials", pending: data.pending };
    } catch (e) {
      return { success: false, message: "Backend not connected: " + e.message };
    }
  }

  function handleLogout() {
    localStorage.removeItem("shahaji_admin_logged_in");
    setIsLoggedIn(false);
    setPage("dashboard");
  }

  // ===================== BOOKINGS CRUD =====================
 async function addManualBooking() {
    if (!manualBooking.passengerName?.trim()) {
      showToast("Passenger name is required!", "error"); return;
    }

    const finalSeats = Array.isArray(manualBooking.seatNumbers) && manualBooking.seatNumbers.length
      ? manualBooking.seatNumbers.map(String)
      : manualBooking.seatNo ? [String(manualBooking.seatNo)] : [];

    if (!finalSeats.length) {
      showToast("Please select at least one seat!", "error"); return;
    }

    const payload = {
      passengerName:  manualBooking.passengerName.trim(),
      customerName:   manualBooking.passengerName.trim(),
      phone:          manualBooking.phone || "",
      mobile:         manualBooking.phone || "",
      age:            Number(manualBooking.age) || 0,
      gender:         manualBooking.gender || "Male",
      bus:            manualBooking.busId || null,
      trip:           selectedTripId || manualBooking.tripId || null,
      tripId:         selectedTripId || manualBooking.tripId || "",
      busNo:          manualBooking.busNo || "",
      busName:        manualBooking.busName || "",
      journeyDate:    manualBooking.journeyDate || "",
      date:           manualBooking.journeyDate || "",
      boardingPoint:  manualBooking.boardingPoint || "",
      droppingPoint:  manualBooking.droppingPoint || "",
      seatNo:         finalSeats[0],
      seatNumbers:    finalSeats,
      selectedSeats:  finalSeats,
      amount:         Number(manualBooking.amount) || 0,
      totalAmount:    Number(manualBooking.amount) || 0,
      paymentMode:    manualBooking.paymentMode || "Cash",
      paymentMethod:  manualBooking.paymentMode || "Cash",
      paymentStatus:  manualBooking.paymentStatus || "Pending",
      refundStatus:   manualBooking.refundStatus || "Not Applicable",
      bookingStatus:  "Confirmed",
      conductorNote:  manualBooking.conductorNote || "",
passengers:     finalSeats.map((seat) => ({
        name:        manualBooking.passengerName.trim(),
        age:         Number(manualBooking.age) || 0,
        gender:      manualBooking.gender || "Male",
        seatNumber:  seat,
        phone:       manualBooking.phone || "",
      })),
    };

    try {
      const data = await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const saved = normalizeBooking(data.booking || data);
      setBookings(prev => [saved, ...prev]);
      setManualBooking({ ...emptyBookingForm, seatNumbers: [] });
      setSelectedSeat("");
      
      showToast("✅ Booking added successfully!");
      triggerAutoBackup();
      sendTicketOnWhatsApp(saved);
      setTimeout(() => generateTicket(saved), 800);
    } catch (e) {
      showToast("Booking failed: " + e.message, "error");
    }
  }

  // हे दोन्ही ठिकाणी fix करा
async function updateBookingStatus(id, paymentStatus) {
    try {
      await apiFetch("/api/bookings/" + id, {
        method: "PATCH",  // ← space काढला
        body: JSON.stringify({ paymentStatus }),
      });
      setBookings(prev => prev.map(b =>
        String(b._id) === String(id) ? { ...b, paymentStatus } : b
      ));
      showToast("Status updated to " + paymentStatus);
    } catch (e) {
      showToast("Update failed: " + e.message, "error");
    }
  }

 // हे करा:
async function saveBooking(payload, editId) {
    const cleanPayload = {
      ...payload,
      age: payload.age && payload.age !== "-" ? Number(payload.age) : 0,
    };
    try {
      if (editId) {
        await apiFetch("/api/bookings/" + editId, {
          method: "PATCH",
          body: JSON.stringify(cleanPayload),
        });
        setBookings(prev => prev.map(b =>
          String(b._id) === String(editId) ? { ...b, ...payload } : b
        ));
        showToast("Booking updated!");
        triggerAutoBackup();
      } else {
        const data = await apiFetch("/api/bookings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const saved = normalizeBooking(data.booking || data);
        setBookings(prev => [saved, ...prev]);
        showToast("Booking added!");
        triggerAutoBackup();
      }
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
  }

  async function deleteBooking(id) {
    try {
      triggerAutoBackup();
      await apiFetch("/api/bookings/" + id, { method: "DELETE" });
      setBookings(prev => prev.filter(b => String(b._id) !== String(id)));
      if (String(selectedBookingForTicket?._id) === String(id))
        setSelectedBookingForTicket(null);
      showToast("Booking deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  // ===================== TRIPS CRUD =====================
  async function saveTrip(trip, editId) {
    try {
      if (editId) {
        await apiFetch("/api/trips/" + editId, {
          method: "PUT",
          body: JSON.stringify(trip),
        });
        setTrips(prev => prev.map(t =>
          String(t._id || t.id) === String(editId) ? { ...t, ...trip } : t
        ));
        showToast("Trip updated!");
      } else {
        const data = await apiFetch("/api/trips", {
          method: "POST",
          body: JSON.stringify(trip),
        });
        const saved = data.trip || data || { ...trip, _id: String(Date.now()) };
        setTrips(prev => [saved, ...prev]);
        showToast("Trip added!");
      }
    } catch (e) {
      showToast("Trip save failed: " + e.message, "error");
    }
  }

  async function deleteTrip(id) {
    try {
      await apiFetch("/api/trips/" + id, { method: "DELETE" });
      setTrips(prev => prev.filter(t => String(t._id || t.id) !== String(id)));
      showToast("Trip deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  async function toggleTripSeatFlag(tripId, seatNo, flagType) {
    try {
      const data = await apiFetch("/api/trips/" + tripId + "/seat-flag", {
        method: "PATCH",
        body: JSON.stringify({ seatNo, flagType }),
      });
      setTrips(prev => prev.map(t =>
        String(t._id || t.id) === String(tripId) ? { ...t, ...data.trip } : t
      ));
    } catch (e) {
      showToast("Flag update failed: " + e.message, "error");
    }
  }
  async function toggleBusSeatBlock(busId, seatNo, currentlyBlocked) {   // ← ADD FROM HERE
  try {
    const res = await apiFetch(`/api/buses/${busId}/seats`, {
      method: "PATCH",
      body: JSON.stringify({ seatNo: String(seatNo), isBlocked: !currentlyBlocked }),
    });
    setBuses(prev =>
      prev.map(b =>
        String(b._id || b.id) === String(busId)
          ? { ...b, blockedSeats: res.blockedSeats || b.blockedSeats }
          : b
      )
    );
    showToast(!currentlyBlocked ? `Seat ${seatNo} blocked` : `Seat ${seatNo} unblocked`);
  } catch (e) {
    showToast("Seat block failed: " + e.message, "error");
  }
}                                                                         // ← TO HERE


// In App() component — replace toggleBusSeatFlag
async function toggleBusSeatBlock(busId, seatNo, currentlyBlocked) {
  try {
    const res = await apiFetch(`/api/buses/${busId}/seats`, {
      method: "PATCH",
      body: JSON.stringify({ seatNo: String(seatNo), isBlocked: !currentlyBlocked }),
    });
    setBuses(prev =>
      prev.map(b =>
        String(b._id || b.id) === String(busId)
          ? { ...b, blockedSeats: res.blockedSeats || b.blockedSeats }
          : b
      )
    );
    showToast(!currentlyBlocked ? `Seat ${seatNo} blocked` : `Seat ${seatNo} unblocked`);
  } catch (e) {
    showToast("Seat block failed: " + e.message, "error");
  }
}


// Admin seat info popup state — add to BookingsPage local state
// const [seatBlockPopup, setSeatBlockPopup] = useState(null);

// Updated renderSeatBtnNew — full replacement
function renderSeatBtnNew(seat, isSleeper) {
  const seatStr = String(seat || "");
  const seatBooking = bookingBySeat(seat);
  const isBooked = bookedSeatsForTrip.includes(seatStr);
  const isSelected = String(selectedSeat) === seatStr;

  // Check blocked from bus OR trip
  const isBlocked =
    selectedTrip?.blockedSeats?.includes(seatStr) ||
    selectedBus?.blockedSeats?.includes(seatStr);

  const isLadies =
    selectedTrip?.ladiesSeats?.includes(seatStr) ||
    selectedBus?.ladiesSeats?.includes(seatStr);

  const bookedGender =
    seatBooking?.gender ||
    seatBooking?.passengers?.[0]?.gender ||
    seatGenderMap[seatStr] ||
    "Male";
  const isFemaleBooked = isBooked && bookedGender === "Female";
  const selectedGender = seatGenderMap[seatStr];

  // COLOR LOGIC
  let bg = "var(--bg3)", border = "var(--border)", color = "var(--text2)";
  if (isBlocked)           { bg = "rgba(239,68,68,0.22)"; border = "#ef4444"; color = "#ef4444"; }  // RED for admin
  else if (isFemaleBooked) { bg = "rgba(168,85,247,0.28)"; border = "#a855f7"; color = "#c4b5fd"; }
  else if (isBooked)       { bg = "rgba(245,158,11,0.28)"; border = "#f59e0b"; color = "#fcd34d"; }
  else if (isLadies)       { bg = "rgba(236,72,153,0.18)"; border = "#ec4899"; color = "#f9a8d4"; }
  else if (isSelected && selectedGender === "Female") { bg = "rgba(168,85,247,0.5)"; border = "#a855f7"; color = "white"; }
  else if (isSelected)     { bg = "var(--accent)"; border = "var(--accent)"; color = "white"; }

  const busIdForOp = manualBooking.busId || (selectedBus?._id || selectedBus?.id);

  return (
    <button
      key={seat}
      type="button"
      title={
        isBlocked
          ? `Seat ${seat} — BLOCKED (Right-click to unblock)`
          : isBooked
          ? `${seatBooking?.passengerName || "Booked"} (${bookedGender}) — Click for details`
          : `Seat ${seat} — Click to select`
      }
      onClick={() => {
      if (isBlocked) {
          const seatData = (buses.find(b => String(b._id || b.id) === String(busIdForOp))?.seats || [])
            .find(s => String(s.seatNo) === String(seat)) || {};
          setSeatBlockPopup({ seat, busId: busIdForOp, isBlocked: true, seatData });
          return;
        }
        if (isBooked) { setSeatPopup(seatBooking); return; }
// Already selected असेल तर remove करा
if (manualBooking.seatNumbers?.includes(seatStr)) {
  const newSeats = (manualBooking.seatNumbers || []).filter(s => s !== seatStr);
  const pricePerSeat = Number(selectedBus?.seaterPrice || selectedBus?.price || 0);
  setManualBooking(p => ({
    ...p,
    seatNumbers: newSeats,
    seatNo: newSeats[0] || "",
    amount: String(pricePerSeat * newSeats.length),
  }));
  setSeatGenderMap(prev => { const n = {...prev}; delete n[seatStr]; return n; });
  setSelectedSeat(newSeats[0] || "");
  return;
}
setAdminGenderPicker({ visible: true, seat: seatStr });      }}
      onContextMenu={e => {
        e.preventDefault();
        if (!busIdForOp && !selectedTripId) return;
        const action = isBlocked ? "Unblock" : "Block";
        if (window.confirm(`${action} seat ${seat}?`)) {
          if (busIdForOp) {
            toggleBusSeatBlock(busIdForOp, seat, isBlocked);
          } else if (selectedTripId) {
            toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "blockedSeats");
          }
        }
      }}
      style={{
        width: isSleeper ? 44 : 38,
        height: isSleeper ? 38 : 36,
        borderRadius: 7,
        border: `1.5px solid ${border}`,
        background: bg,
        color,
        cursor: isBlocked ? "pointer" : "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 1, transition: "all 0.12s",
        fontFamily: "'DM Sans',sans-serif",
        position: "relative", flexShrink: 0,
        opacity: isBlocked ? 0.85 : 1,
      }}
    >
      <span style={{ fontSize: isSleeper ? 12 : 10, lineHeight: 1 }}>
        {isBlocked ? "🚫" : isSleeper ? "🛏" : "🪑"}
      </span>
      <span style={{ fontSize: 8, fontWeight: 700 }}>{seat}</span>
      {isSelected && selectedGender && (
        <span style={{
          position: "absolute", top: 1, right: 1,
          width: 5, height: 5, borderRadius: "50%",
          background: selectedGender === "Female" ? "#a855f7" : "#3b82f6"
        }} />
      )}
    </button>
  );
}
// ── Auto Backup Helper ──
async function triggerAutoBackup() {
  try {
    // Silent backup — फक्त server ला ping कर, file download नाही
    await fetch(`${BASE_URL}/api/admin/backup-silent`, { method: "POST" });
    console.log("✅ Auto backup done");
  } catch (e) {
    console.log("Auto backup skip:", e.message);
  }
}
  // ===================== BUSES CRUD =====================
  async function saveBus(bus, editId) {
    try {
      if (editId) {
        await apiFetch("/api/buses/" + editId, {
          method: "PUT",
          body: JSON.stringify(bus),
        });
        setBuses(prev => prev.map(b =>
          String(b._id || b.id) === String(editId) ? { ...b, ...bus } : b
        ));
        showToast("Bus updated!");
        triggerAutoBackup(); // ✅ auto backup
        return bus;
      } else {
        const data = await apiFetch("/api/buses", {
          method: "POST",
          body: JSON.stringify(bus),
        });
        const saved = data.bus || data || { ...bus, _id: String(Date.now()) };
        setBuses(prev => [saved, ...prev]);
        showToast("Bus added!");
        triggerAutoBackup(); // ✅ auto backup
        return saved;
      }
    } catch (e) {
      showToast(e.message || "Bus save failed", "error");
      throw e;
    }
  }

  async function deleteBus(id) {
    try {
      triggerAutoBackup(); // ✅ delete आधी backup
      await apiFetch("/api/buses/" + id, { method: "DELETE" });
      setBuses(prev => prev.filter(b => String(b._id || b.id) !== String(id)));
      showToast("Bus deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  // ===================== ROUTES CRUD =====================
  async function saveRoute(route, editId) {
    try {
      if (editId) {
        await apiFetch("/api/routes/" + editId, {
          method: "PUT",
          body: JSON.stringify(route),
        });
        setRoutes(prev => prev.map(r =>
          String(r._id || r.id) === String(editId) ? { ...r, ...route } : r
        ));
        showToast("Route updated!");
      } else {
        const data = await apiFetch("/api/routes", {
          method: "POST",
          body: JSON.stringify(route),
        });
        const saved = data.route || data || { ...route, _id: String(Date.now()) };
        setRoutes(prev => [saved, ...prev]);
        showToast("Route added!");
      }
    } catch (e) {
      showToast("Route save failed: " + e.message, "error");
    }
  }

  async function deleteRoute(id) {
    try {
      await apiFetch("/api/routes/" + id, { method: "DELETE" });
      setRoutes(prev => prev.filter(r => String(r._id || r.id) !== String(id)));
      showToast("Route deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  // ===================== CUSTOMERS CRUD =====================
  async function saveCustomer(customer, editId) {
    try {
      if (editId) {
        await apiFetch("/api/customers/" + editId, {
          method: "PUT",
          body: JSON.stringify(customer),
        });
        setCustomers(prev => prev.map(c =>
          String(c._id || c.id) === String(editId) ? { ...c, ...customer } : c
        ));
       showToast("Customer updated!");
        triggerAutoBackup();
      } else {
        const data = await apiFetch("/api/customers", {
          method: "POST",
          body: JSON.stringify(customer),
        });
        const saved = data.customer || data || { ...customer, _id: String(Date.now()) };
        setCustomers(prev => [saved, ...prev]);
        showToast("Customer added!");
        triggerAutoBackup();
      }
    } catch (e) {
      showToast("Customer save failed: " + e.message, "error");
    }
  }

  async function deleteCustomer(id) {
    try {
      triggerAutoBackup();
      await apiFetch("/api/customers/" + id, { method: "DELETE" });
      setCustomers(prev => prev.filter(c => String(c._id || c.id) !== String(id)));
      showToast("Customer deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }
  


  // ===================== DASHBOARD STATS =====================
  const dashboard = useMemo(() => {
    const today    = new Date().toISOString().slice(0, 10);
    const paid     = bookings.filter(b => b.paymentStatus === "Paid");
    const totalRev = paid.reduce((s, b) => s + Number(b.amount || 0), 0);
    const todayBk  = bookings.filter(b => (b.journeyDate || b.date || "").slice(0, 10) === today);
    const todayRev = todayBk.filter(b => b.paymentStatus === "Paid").reduce((s, b) => s + Number(b.amount || 0), 0);
    const activeBuses  = buses.filter(b => b.status === "Active").length;
    const cancelled    = bookings.filter(b => ["Failed", "Refunded"].includes(b.paymentStatus) || b.refundStatus === "Refunded").length;
    const totalSeats   = trips.length * 36;
    const occupancy    = totalSeats ? Math.round(bookings.length / totalSeats * 100) : 0;
    const routeCounts  = {};
    bookings.forEach(b => {
      const k = (b.boardingPoint || "-") + " to " + (b.droppingPoint || "-");
      routeCounts[k] = (routeCounts[k] || 0) + 1;
    });
    const topEntries = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
    return {
      totalBookings: bookings.length, totalBuses: buses.length,
      customers: customers.length, trips: trips.length,
      revenue: totalRev, todayBookings: todayBk.length,
      todayRevenue: todayRev, activeBuses,
      cancelledBookings: cancelled, occupancy,
      topRoute: topEntries.length ? topEntries[0][0] : "—",
      recentBookings: bookings.slice(0, 5),
    };
  }, [bookings, buses, trips, customers]);

const reportStats = useMemo(() => {
  const paid      = bookings.filter(b => b.paymentStatus === "Paid");
  const pending   = bookings.filter(b => b.paymentStatus === "Pending");
  const cancelled = bookings.filter(b =>
    ["Failed", "Refunded"].includes(b.paymentStatus) || b.refundStatus === "Refunded"
  );
  const totalRev = paid.reduce((s, b) => s + Number(b.amount || 0), 0);
  const routeMap = {}, busMap = {}, payMap = {}, monthMap = {}, dailyMap = {};

  bookings.forEach(b => {
    
    const route = (b.boardingPoint || "-") + " to " + (b.droppingPoint || "-");
    routeMap[route] = (routeMap[route] || 0) + 1;
     const bus = b.numberPlate || b.busNumber || b.busNo || b.bus || "-";
busMap[bus] = (busMap[bus] || 0) + 1;
    const pm = b.paymentMode || "-";
    payMap[pm] = (payMap[pm] || 0) + 1;
    const d = b.journeyDate || b.date || b.createdAt;
  

  
  // ✅ FIXED: all possible date fields + safe ISO conversion
 // ✅ DD/MM/YYYY format handle karto
const rawDate = b.journeyDate || b.date || b.createdAt || "";
let dateKey = "";
if (rawDate) {
  let parsed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    // DD/MM/YYYY → YYYY-MM-DD convert
    const [dd, mm, yyyy] = rawDate.split("/");
    parsed = new Date(`${yyyy}-${mm}-${dd}`);
  } else {
    parsed = new Date(rawDate);
  }
  if (!isNaN(parsed.getTime())) {
    dateKey = parsed.toISOString().slice(0, 10);
  }
}
  const month = dateKey
    ? new Date(dateKey).toLocaleString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  if (b.paymentStatus === "Paid")
    monthMap[month] = (monthMap[month] || 0) + Number(b.amount || 0);

  if (dateKey) {
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey, bookings: [], revenue: 0,
        paid: 0, pending: 0, cancelled: 0, buses: {}
      };
    }
    dailyMap[dateKey].bookings.push(b);
    dailyMap[dateKey].revenue +=
      b.paymentStatus === "Paid" ? Number(b.amount || 0) : 0;
    if (b.paymentStatus === "Paid")         dailyMap[dateKey].paid++;
    else if (b.paymentStatus === "Pending") dailyMap[dateKey].pending++;
    else                                    dailyMap[dateKey].cancelled++;
    const busKey = b.numberPlate || b.busNumber || b.busNo || b.bus || "Unknown";
    dailyMap[dateKey].buses[busKey] =
      (dailyMap[dateKey].buses[busKey] || 0) + 1;
  }
});

  const dailyData = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalRevenue: totalRev,
    paidCount: paid.length, pendingCount: pending.length, cancelledCount: cancelled.length,
    totalCustomers: customers.length, totalTrips: trips.length,
    topRoutes:      Object.entries(routeMap).map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count),
    busPerformance: Object.entries(busMap).map(([bus, count]) => ({ bus, count })).sort((a, b) => b.count - a.count),
    paymentSummary: Object.entries(payMap).map(([mode, count]) => ({ mode, count })),
    monthlyRevenue: Object.entries(monthMap).map(([month, amount]) => ({ month, amount })),
    dailyData,
     _buses: buses,
  };
}, [bookings, customers, trips]);

  function persistSettings(next) {
    setSettings(next);
    localStorage.setItem("shahaji_settings", JSON.stringify(next));
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      <style>{globalStyles}</style>
      <div className="admin-body">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
          <div className="sidebar-inner">
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
            <div className="sidebar-logo">
              <div className="logo-icon">🚌</div>
              <div className="logo-title">{settings.companyName}</div>
              <div className="logo-sub">Admin Panel</div>
            </div>
            <nav className="sidebar-nav">
              <div className="nav-section">MAIN MENU</div>
              {menu.map(item => (
                <button
                  key={item.key}
                  className={"nav-item" + (page === item.key ? " active" : "")}
                  onClick={() => navigateTo(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.key === "bookings" && bookings.length > 0 && (
                    <span className="nav-badge">{bookings.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-footer">
              <div className="admin-info">
                <div className="admin-avatar">A</div>
                <div>
                  <div className="admin-name">Admin</div>
                  <div className="admin-role">Super Admin</div>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="main">
         <header className="topbar">
  <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
    <span /><span /><span />
  </button>
  <div className="topbar-titles">
    <div className="topbar-title">{settings.companyName} </div>
    <div className="topbar-sub">Professional Bus Booking Management</div>
  </div>
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    {loading && <span className="loading-pill">⟳ Syncing...</span>}
    <button
      className="topbar-logout-btn"
      onClick={handleLogout}
    >
      🚪 Logout
    </button>
  </div>
</header>

          <div className="content">
            {page === "dashboard" && <DashboardPage dashboard={dashboard} />}
            {page === "bookings" && (
              <BookingsPage
                buses={buses} trips={trips} bookings={bookings}
                manualBooking={manualBooking} setManualBooking={setManualBooking}
                selectedTripId={selectedTripId} setSelectedTripId={setSelectedTripId}
                selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat}
                bookedSeatsForTrip={bookedSeatsForTrip}
                addManualBooking={addManualBooking}
                updateBookingStatus={updateBookingStatus}
                deleteBooking={deleteBooking} saveBooking={saveBooking}
                selectedBookingForTicket={selectedBookingForTicket}
                setSelectedBookingForTicket={setSelectedBookingForTicket}
                selectedRoute={selectedRoute} selectedTrip={selectedTrip}
                bookingBySeat={bookingBySeat}
                toggleTripSeatFlag={toggleTripSeatFlag}
                setSeatPopup={setSeatPopup}
                showToast={showToast}
                setBuses={setBuses}
              />
            )}
            
            {page === "trips"     && <TripsPage buses={buses} trips={trips} routes={routes} saveTrip={saveTrip} deleteTrip={deleteTrip} />}
            {page === "buses"     && <BusesPage buses={buses} saveBus={saveBus} deleteBus={deleteBus} />}
            {page === "routes"    && <RoutesPage routes={routes} saveRoute={saveRoute} deleteRoute={deleteRoute} />}
            {page === "customers" && <CustomersPage customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} bookings={bookings} />}
            {page === "reports"   && <ReportsPage reportStats={reportStats} />}
            {page === "settings"  && <SettingsPage settings={settings} setSettings={persistSettings} showToast={showToast} />}
            {page === "offers"  && <OffersAdminPage showToast={showToast} />}
{page === "popular" && <PopularRoutesPage showToast={showToast} />}
{page === "notifications" && <NotificationsAdminPage showToast={showToast} />}
{page === "qr" && <AdminQRSettings showToast={showToast} />}
{page === "busreport" && <BusReportPage buses={buses} showToast={showToast} />}
{page === "backup" && <BackupPage showToast={showToast} />}

          </div>
        </main>
      </div>

      {seatPopup && (
        <SeatDetailsModal item={seatPopup} onClose={() => setSeatPopup(null)} />
      )}

      <div className={"toast toast-" + toast.type + (toast.show ? " show" : "")}>
        <span>{toast.type === "error" ? "✕" : "✓"}</span>
        <span>{toast.text}</span>
      </div>
    </>
  );
}

// ===================== LOGIN =====================
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("admin@shahajitravels.com");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Email and password required."); return; }
    setBusy(true); setError("");
    const result = await onLogin(email, password);
    if (!result.success && result.pending) {
      setError("⏳ Request पाठवली! Mitali approve केल्यावर login होईल.");
    } else if (!result.success) {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🚌</div>
        <h1>Shahaji Travels</h1>
        <p>Admin Panel — Please sign in</p>
        <form onSubmit={submit} className="login-form">
          <input className="form-input" type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          <input className="form-input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-primary login-btn" disabled={busy}>
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 12, color: "#888", textAlign: "center" }}>
          First run? Visit <code>/create-admin</code> on the server.
        </div>
      </div>
    </div>
  );
}

// ===================== DASHBOARD =====================
function DashboardPage({ dashboard }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Live business overview</p>
      </div>
      <div className="stats-grid">
        <StatCard icon="🎫" label="Total Bookings"  value={dashboard.totalBookings} color="blue" />
        <StatCard icon="🚍" label="Total Buses"     value={dashboard.totalBuses}    color="indigo" />
        <StatCard icon="👥" label="Customers"       value={dashboard.customers}     color="purple" />
        <StatCard icon="🗺️" label="Trips"           value={dashboard.trips}         color="teal" />
        <StatCard icon="💰" label="Total Revenue"   value={"₹" + dashboard.revenue.toLocaleString()} color="green" />
        <StatCard icon="📅" label="Today Bookings"  value={dashboard.todayBookings} color="orange" />
        <StatCard icon="💸" label="Today Revenue"   value={"₹" + dashboard.todayRevenue.toLocaleString()} color="yellow" />
        <StatCard icon="✅" label="Active Buses"    value={dashboard.activeBuses}   color="emerald" />
        <StatCard icon="❌" label="Cancelled"       value={dashboard.cancelledBookings} color="red" />
        <StatCard icon="🪑" label="Occupancy"       value={dashboard.occupancy + "%"} color="cyan" />
      </div>
      <div className="two-col-grid">
        <div className="section-card">
          <div className="section-title">🏆 Top Route</div>
          <div className="big-highlight">{dashboard.topRoute}</div>
        </div>
        <div className="section-card">
          <div className="section-title">🕐 Recent Bookings</div>
          {dashboard.recentBookings.length ? (
            <div className="recent-list">
              {dashboard.recentBookings.map((b, i) => (
                <div key={b._id || i} className="recent-item">
                  <div>
                    <div className="recent-title">{b.passengerName || "—"}</div>
                    <div className="recent-sub">{b.boardingPoint || "—"} → {b.droppingPoint || "—"}</div>
                  </div>
                  <div>{statusBadge(b.paymentStatus)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <div className="empty-text">No bookings yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== getSeatDisplayLabel =====================
function getSeatDisplayLabel(seatNo) {
  if (!seatNo) return "—";
  const s = String(seatNo);
  // AC Sleeper 2x2
  const sleeperRow = AC_SLEEPER_ROWS.find(r =>
    [r.leftLower, r.leftUpper, r.rightLower, r.rightUpper].includes(s)
  );
  if (sleeperRow) return sleeperRow.row + " · " + s;
  // Seater-Sleeper: Left single U1-U12
  if (SS_LEFT_SINGLE.includes(s)) return "Single · " + s;
  // Seater-Sleeper: Right double 1-24
  const rightPair = SS_RIGHT_PAIRS.find(p => p.window === s || p.aisle === s);
  if (rightPair) return (rightPair.window === s ? "Window" : "Aisle") + " · " + s;
  // Seater-Sleeper: Back sleeper A1-A6, A-L
  const backRow = SS_BACK_SLEEPER.find(r => r.single === s || r.lower === s || r.upper === s);
  if (backRow) return "Sleeper · " + s;
  return s;
}

// ===================== BOOKINGS PAGE =====================
function BookingsPage(props) {
const {
    buses, trips, bookings, manualBooking, setManualBooking,
    selectedTripId, setSelectedTripId, selectedSeat, setSelectedSeat,
    bookedSeatsForTrip, addManualBooking, updateBookingStatus,
    deleteBooking, saveBooking, selectedBookingForTicket,
    setSelectedBookingForTicket, selectedRoute, selectedTrip,
    bookingBySeat, toggleTripSeatFlag, setSeatPopup,
    toggleBusSeatFlag, toggleBusSeatBlock,
    showToast, setBuses,
  } = props;
 const [boardingSearch, setBoardingSearch] = React.useState("");
const [droppingSearch, setDroppingSearch] = React.useState("");
  const [search,       setSearch]       = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [sortOrder,    setSortOrder]    = React.useState("latest");
  const [editing,      setEditing]      = React.useState(null);
 const [adminGenderPicker, setAdminGenderPicker] = React.useState({ visible: false, seat: null });
 const [seatBlockPopup, setSeatBlockPopup] = React.useState(null);
 const [seatUnbookPopup, setSeatUnbookPopup] = React.useState(null);   
 const [activeSeat,     setActiveSeat]     = React.useState(null);
const [seatGenderPick, setSeatGenderPick] = React.useState({});
const [blockForm,      setBlockForm]      = React.useState({ name: "", mobile: "" });
const [blockingLoading,setBlockingLoading]= React.useState(false);
const [busSeats,       setBusSeats]       = React.useState([]);
const [seatGenderMap, setSeatGenderMap] = React.useState({});
  // ── FIX: selectedBus — match by _id OR by number/name ──────────
 const selectedBus = useMemo(() => {
  // Priority 1: bus selected directly (manualBooking.busId)
  if (manualBooking.busId) {
    return buses.find(b => String(b._id || b.id) === String(manualBooking.busId)) || null;
  }
  // Priority 2: from selected trip — match by _id OR by number/name
  if (!selectedTrip) return null;
  return buses.find(b =>
    String(b._id || b.id) === String(selectedTrip.bus) ||
    String(b.number || b.busNumber || b.numberPlate || "") === String(selectedTrip.bus) ||
    String(b.name || "") === String(selectedTrip.bus)
  ) || null;
}, [selectedTrip, buses, manualBooking.busId]);
function handleAdminGenderSelect(gender) {
  const seat = adminGenderPicker.seat;
  setAdminGenderPicker({ visible: false, seat: null });
  if (!seat) return;

  setSeatGenderMap(prev => ({ ...prev, [String(seat)]: gender }));

  setManualBooking(prev => {
    const existing = Array.isArray(prev.seatNumbers) ? prev.seatNumbers : [];
    // Already आहे तर add करू नको
    if (existing.includes(String(seat))) return prev;
    const newSeats = [...existing, String(seat)];
    const pricePerSeat = Number(
      selectedBus?.seaterPrice || selectedBus?.price || 0
    );
    return {
      ...prev,
      seatNo: newSeats[0],
      seatNumbers: newSeats,
      gender,
      amount: String(pricePerSeat * newSeats.length),
    };
  });

  setSelectedSeat(seat);
}

  // ── Bus type detection ──────────────────────────────────────────
 const selectedBusType = selectedBus?.type || selectedTrip?.busType || "";
const isACSleeperBus   = isSleeperOnly(selectedBusType);
const isSeaterSleeperBus = isSeaterSleeper(selectedBusType);
  // Whether layout should be shown
  const hasLayoutTrigger = selectedTripId || manualBooking.busId;
 // ── Complete boarding/dropping points (server.js मधून) ──
const ALL_BOARDING_POINTS = [
  "Sanbur","Banpuri","Janugadewadi","Dhebewadi","Maldan","Gudhe","Talmavle",
  "Karpewadi","Manegav","Kadhne","Tarukh","Kusur","Kolewadi","Kole","Gharewadi",
  "Shindewadi","Ving","Chachegaon","Aagashiv Nagar","Dhebewadi Fata","Karad",
  "Varunji Fata","Gote","Khodshi","Vahagaon","Talbeed","Tasawade Toll Plaza",
  "Umbraj","Indoli","Kashil","Atith","Nisrale Fata","Nagthane","Borgaon","Shendre",
  "Satara","Aanewadi Toll Plaza","Pachwad","Bhuinj","Surur","Vele","Khandala",
  "Shirval","Khed Shivapur","Navle Bridge (Katraj)","Varje","Chandani Chowk",
  "Vakad","Ravet"
].sort();

const ALL_DROPPING_POINTS = [
  "Kalamboli","Kamotha","Kharghar","Nerul","Jui Nagar","Sanpada","Vashi",
  "Mankhurd","Mankhurd Station","Chembur (Maitri Park)","Ghatla","Shivaji Nagar",
  "Kamraj Nagar","Nalanda Bus Stop","Ramabai","Ghatkopar Depo","Ghatkopar Shreyas",
  "Ghatkopar R City Mall","Vikhroli Depo","Vikhroli Station","Vikhroli Surya Nagar",
  "Vikhroli Gandhinagar","Powai IIT","Powai IIT Main Gate","Powai Talav",
  "Milind Nagar","Seepaz","Sariput Nagar","Matoshri","Durga Nagar","Shyam Nagar",
  "Ramwadi","Jaycoach","Mahananda","Goregaon Check Naka","Goregaon Virwani",
  "Pathanwadi","Malad Shantaram Talav","Malad Pushpa Park","Kandivali Samta Nagar",
  "Mahindra Gate","Sai Dham","Borivali Tata Power","Borivali Station","Chikuwadi",
  "Mahaveer Nagar","Ganesh Chowk","Bandar Pakhadi","Charkop Sahyadri Nagar"
].sort();
  const boardingOptions = (selectedTrip?.boardingPoints?.length)
    ? selectedTrip.boardingPoints
    : (selectedRoute?.boardingPoints?.length)
    ? selectedRoute.boardingPoints
    : MASTER_POINTS;
 
  const droppingOptions = (selectedTrip?.droppingPoints?.length)
    ? selectedTrip.droppingPoints
    : (selectedRoute?.droppingPoints?.length)
    ? selectedRoute.droppingPoints
    : MASTER_POINTS;
 
  const filtered = React.useMemo(() => {
    let list = [...bookings];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.passengerName || "").toLowerCase().includes(q) ||
        (b.phone || "").toLowerCase().includes(q) ||
        (b.seatNo || "").toLowerCase().includes(q) ||
        (b.bookingCode || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(b => b.paymentStatus === statusFilter);
    list.sort((a, b) => sortOrder === "latest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    return list;
  }, [bookings, search, statusFilter, sortOrder]);
  async function fetchBusSeats(busId) {
  if (!busId) return;
  try {
    let oid;
    try { oid = busId; } catch {}
    const res = await apiFetch(`/api/buses/${busId}/seat-status`);
    if (res.success) {
      setBusSeats(res.seatDetails || []);
    }
  } catch {}
}

async function handleBlockSeat(seatNo) {
  const busId = manualBooking.busId || (selectedBus?._id || selectedBus?.id);
  if (!busId) { alert("Bus select करा"); return; }
  const gender = seatGenderPick[String(seatNo)];
  if (!gender) { alert("Gender select करा"); return; }
  if (!blockForm.name.trim())   { alert("Passenger name required"); return; }
  if (!blockForm.mobile.trim()) { alert("Mobile number required"); return; }

  setBlockingLoading(true);
  try {
    await apiFetch(`/api/buses/${busId}/block-seat`, {
      method: "PATCH",
      body: JSON.stringify({
        seatNo:        String(seatNo),
        gender,
        passengerName: blockForm.name.trim(),
        mobile:        blockForm.mobile.trim(),
        isBlocked:     true,
      }),
    });
    // Update local bus state
   setBuses(prev => prev.map(b => {
          if (String(b._id || b.id) !== String(busId)) return b;
          const newBlocked = [...new Set([...(Array.isArray(b.blockedSeats) ? b.blockedSeats : []), String(seatNo)])];
          const existingSeats = Array.isArray(b.seats) ? b.seats : [];
          const idx = existingSeats.findIndex(s => String(s.seatNo) === String(seatNo));
          const newSeat = {
            seatNo: String(seatNo), isBlocked: true, isBooked: false,
            gender: "Blocked", passengerName: blockForm.name.trim(),
            mobile: blockForm.mobile.trim(), boardingPoint: "", droppingPoint: "",
          };
          const newSeats = idx >= 0
            ? existingSeats.map((s, i) => i === idx ? newSeat : s)
            : [...existingSeats, newSeat];
          return { ...b, seats: newSeats, blockedSeats: newBlocked };
        }));
    setActiveSeat(null);
    setSeatGenderPick({});
    setBlockForm({ name: "", mobile: "" });
    showToast(`✅ Seat ${seatNo} blocked!`);
  } catch (e) {
    showToast("Block failed: " + e.message, "error");
  }
  setBlockingLoading(false);
}

async function handleUnblockSeat(seatNo) {
  const busId = manualBooking.busId || (selectedBus?._id || selectedBus?.id);
  if (!busId) return;
  setBlockingLoading(true);
  try {
    await apiFetch(`/api/buses/${busId}/block-seat`, {
      method: "PATCH",
      body: JSON.stringify({ seatNo: String(seatNo), isBlocked: false }),
    });
    setBuses(prev => prev.map(b => {
      if (String(b._id || b.id) !== String(busId)) return b;
      const newSeats = (b.seats || []).map(s =>
        String(s.seatNo) === String(seatNo)
          ? { ...s, isBlocked: false, gender: "", passengerName: "", mobile: "" }
          : s
      );
      const newBlocked = (b.blockedSeats || []).filter(s => s !== String(seatNo));
      return { ...b, seats: newSeats, blockedSeats: newBlocked };
    }));
    setActiveSeat(null);
    showToast(`✅ Seat ${seatNo} unblocked`);
  } catch (e) {
    showToast("Unblock failed: " + e.message, "error");
  }
  setBlockingLoading(false);
}

function getSeatData(seatNo) {
  const seatsArr = Array.isArray(selectedBus?.seats) ? selectedBus.seats : [];
  if (seatsArr.length) {
    const found = seatsArr.find(s => String(s.seatNo) === String(seatNo));
    if (found) return found;
  }
  const busId = manualBooking.busId || (selectedBus?._id || selectedBus?.id);
  const bus = buses.find(b => String(b._id || b.id) === String(busId));
  const busSeatsArr = Array.isArray(bus?.seats) ? bus.seats : [];
  return busSeatsArr.find(s => String(s.seatNo) === String(seatNo)) || null;
}
 function isSeatSelectable(seat, gender) {
  // adjacent seats logic (customize if needed)
  const adjacentMap = {
    "1": ["2"], "2": ["1"],
    "3": ["4"], "4": ["3"],
    "5": ["6"], "6": ["5"],
    // tu apne layout ke hisaab se expand kar sakta hai
  };

  const adjacentSeats = adjacentMap[seat] || [];

  for (let adj of adjacentSeats) {
    const booking = bookingBySeat(adj);
    if (!booking) continue;

    const adjGender =
      booking.gender ||
      booking.passengers?.[0]?.gender ||
      seatGenderMap[adj];

    // ❌ Female next to Male (strict rule)
    if (gender === "Female" && adjGender === "Male") return false;

    // ❌ Male next to Female (optional strict)
    if (gender === "Male" && adjGender === "Female") return false;
  }

  return true;
}
  // ── Standard Seater-Sleeper seat grid ──
// ── New 2+1 Seater-Sleeper layout renderer ──
function renderSeaterSleeperLayout() {
  const allSS = [...SS_LEFT_SINGLE, ...SS_RIGHT_PAIRS.flatMap(p => [p.window, p.aisle]), ...SS_BACK_SLEEPER.flatMap(r => [r.single, r.lower, r.upper])];
  const availCount = allSS.filter(s => !bookedSeatsForTrip.includes(String(s))).length;

  return (
    <div className="section-card" style={{ overflowX:"auto" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>
          🪑 AC Seater-Sleeper — 2×1 Layout
          {selectedBus && <span style={{ fontSize:12, color:"var(--text2)", fontWeight:500, marginLeft:10 }}>({selectedBus.name})</span>}
        </div>
        <span style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#22c55e" }}>
          {availCount} available
        </span>
      </div>

      {/* SEATER SECTION */}
      <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 8px", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#60a5fa", textAlign:"center", marginBottom:8, letterSpacing:1 }}>🪑 SEATER SECTION</div>

        {/* Column headers */}
        <div style={{ display:"flex", gap:6, marginBottom:6, paddingLeft:4 }}>
          <div style={{ width:38, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--text2)" }}>Single</div>
          <div style={{ width:20 }}/>
          <div style={{ flex:1, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--text2)" }}>Window</div>
          <div style={{ flex:1, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--text2)" }}>Aisle</div>
        </div>

        {/* Rows: each row has 1 left single + 2 right seats */}
        {SS_RIGHT_PAIRS.map((pair, idx) => (
          <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
            {/* Single seat (left) */}
            {renderSeatBtnNew(SS_LEFT_SINGLE[idx])}
            {/* Aisle gap */}
            <div style={{ width:20, textAlign:"center", fontSize:9, color:"#475569" }}>│</div>
            {/* Double seats (right) */}
            {renderSeatBtnNew(pair.window)}
            {renderSeatBtnNew(pair.aisle)}
          </div>
        ))}
      </div>

      {/* SLEEPER SECTION */}
      <div style={{ background:"rgba(168,85,247,0.06)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:10, padding:"10px 8px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#c084fc", textAlign:"center", marginBottom:8, letterSpacing:1 }}>🛏 SLEEPER SECTION (BACK)</div>

        {/* Column headers */}
        <div style={{ display:"flex", gap:6, marginBottom:6, paddingLeft:4 }}>
          <div style={{ width:38, textAlign:"center", fontSize:9, fontWeight:700, color:"#94a3b8" }}>Single</div>
          <div style={{ width:20 }}/>
          <div style={{ flex:1, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--text2)" }}>Lower</div>
          <div style={{ flex:1, textAlign:"center", fontSize:9, fontWeight:700, color:"var(--accent2)" }}>Upper</div>
        </div>

        {SS_BACK_SLEEPER.map((row, idx) => (
          <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
            {renderSeatBtnNew(row.single, true)}
            <div style={{ width:20, textAlign:"center", fontSize:9, color:"#475569" }}>│</div>
            {renderSeatBtnNew(row.lower, true)}
            {renderSeatBtnNew(row.upper, true)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginTop:12, paddingTop:10, borderTop:"1px solid var(--border)" }}>
        {[
          { bg:"var(--bg3)", border:"var(--border)", label:"Available" },
          { bg:"var(--accent)", border:"var(--accent)", label:"Selected (M)" },
          { bg:"rgba(168,85,247,0.5)", border:"#a855f7", label:"Selected (F)" },
          { bg:"rgba(245,158,11,0.28)", border:"#f59e0b", label:"Booked (M)" },
          { bg:"rgba(168,85,247,0.28)", border:"#a855f7", label:"Booked (F)" },
          { bg:"rgba(236,72,153,0.18)", border:"#ec4899", label:"Ladies" },
          { bg:"rgba(100,116,139,0.18)", border:"#64748b", label:"Blocked" },
        ].map(item => (
          <span key={item.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text2)" }}>
            <span style={{ width:13, height:13, borderRadius:3, display:"inline-block", background:item.bg, border:`1px solid ${item.border}` }}/>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Shared seat button renderer for new layouts ──
function renderSeatBtnNew(seat, isSleeper) {
  if (!seat) return <div key={"empty_" + Math.random()} style={{ width: isSleeper ? 44 : 38, height: isSleeper ? 38 : 36, margin: 2 }} />;

  const seatStr    = String(seat);
  const seatData   = getSeatData(seatStr);
  const seatBooking = bookingBySeat(seat);
  const isBooked   = bookedSeatsForTrip.includes(seatStr);
  const isSelected = String(selectedSeat) === seatStr;
 const busIdForCheck = manualBooking.busId || selectedBus?._id || selectedBus?.id;
  const currentBusObj = buses.find(b => String(b._id || b.id) === String(busIdForCheck));
  const isBlocked =
    seatData?.isBlocked === true ||
    (Array.isArray(selectedTrip?.blockedSeats) && selectedTrip.blockedSeats.includes(seatStr)) ||
    (Array.isArray(selectedBus?.blockedSeats) && selectedBus.blockedSeats.includes(seatStr)) ||
    (Array.isArray(currentBusObj?.blockedSeats) && currentBusObj.blockedSeats.includes(seatStr)) ||
    (Array.isArray(currentBusObj?.seats) && currentBusObj.seats.some(s => String(s.seatNo) === seatStr && s.isBlocked === true));
  const isLadies   = selectedTrip?.ladiesSeats?.includes(seatStr) || selectedBus?.ladiesSeats?.includes(seatStr);
  const bookedGender = seatBooking?.gender || seatBooking?.passengers?.[0]?.gender || seatGenderMap[seatStr] || "Male";
  const isFemaleBooked = isBooked && bookedGender === "Female";
  const selectedGender = seatGenderMap[seatStr];
  const isActive   = activeSeat === seatStr;

  let bg = "var(--bg3)", border = "var(--border)", color = "var(--text2)";
  if (isBlocked)         { bg = "rgba(239,68,68,0.22)"; border = "#ef4444"; color = "#ef4444"; }
  else if (isFemaleBooked){ bg = "rgba(168,85,247,0.28)"; border = "#a855f7"; color = "#c4b5fd"; }
  else if (isBooked)     { bg = "rgba(245,158,11,0.28)"; border = "#f59e0b"; color = "#fcd34d"; }
  else if (isLadies)     { bg = "rgba(236,72,153,0.18)"; border = "#ec4899"; color = "#f9a8d4"; }
  else if (isSelected && selectedGender === "Female") { bg = "rgba(168,85,247,0.5)"; border = "#a855f7"; color = "white"; }
  else if (isSelected)   { bg = "var(--accent)"; border = "var(--accent)"; color = "white"; }
  else if (isActive)     { bg = "rgba(34,197,94,0.2)"; border = "#22c55e"; color = "#22c55e"; }

  return (
    <div key={seatStr} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* SEAT BUTTON */}
      <button
        type="button"
        title={
          isBlocked
            ? `🚫 BLOCKED\nName: ${seatData?.passengerName || "—"}\nMobile: ${seatData?.mobile || "—"}\nGender: ${seatData?.gender || "—"}`
            : isBooked
            ? `${seatBooking?.passengerName || "Booked"} (${bookedGender})`
            : `Seat ${seatStr}`
        }
        onClick={() => {
         if (isBooked) { setSeatUnbookPopup({ ...seatBooking, seatNo: seatStr }); return; }
         if (isBlocked) {
            const busId = manualBooking.busId || (selectedBus?._id || selectedBus?.id);
            const seatInfo = (buses.find(b => String(b._id || b.id) === String(busId))?.seats || [])
              .find(s => String(s.seatNo) === seatStr) || seatData || {};
            setSeatBlockPopup({
              seat: seatStr,
              busId,
              isBlocked: true,
              seatData: seatInfo,
              passengerName: seatInfo.passengerName || "",
              mobile:        seatInfo.mobile        || "",
              gender:        seatInfo.gender        || "",
              boardingPoint: seatInfo.boardingPoint || "",
              droppingPoint: seatInfo.droppingPoint || "",
            });
            return;
          }
          // Available seat — toggle active
        // Available seat — फक्त gender picker दाखव, block popup नको
setAdminGenderPicker({ visible: true, seat: seatStr });
        }}
        style={{
          width:           isSleeper ? 44 : 38,
          height:          isSleeper ? 38 : 36,
          borderRadius:    7,
          border:          `1.5px solid ${border}`,
          background:      bg,
          color,
          cursor:          "pointer",
          display:         "flex", flexDirection: "column",
          alignItems:      "center", justifyContent: "center",
          gap:             1, transition: "all 0.12s",
          fontFamily:      "'DM Sans',sans-serif",
          position:        "relative", flexShrink: 0,
        }}
      >
        <span style={{ fontSize: isSleeper ? 12 : 10, lineHeight: 1 }}>
          {isBlocked ? "🚫" : isSleeper ? "🛏" : "🪑"}
        </span>
        <span style={{ fontSize: 8, fontWeight: 700 }}>{seatStr}</span>
        {isSelected && selectedGender && (
          <span style={{
            position: "absolute", top: 1, right: 1,
            width: 5, height: 5, borderRadius: "50%",
            background: selectedGender === "Female" ? "#a855f7" : "#3b82f6"
          }} />
        )}
      </button>

      {/* INLINE BLOCK UI — only for active non-booked non-blocked seat */}
      {isActive && !isBooked && !isBlocked && (
        <div style={{
          position:    "absolute",
          zIndex:      200,
          marginTop:   2,
          background:  "var(--bg2)",
          border:      "1px solid #22c55e",
          borderRadius: 10,
          padding:     10,
          width:       200,
          boxShadow:   "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>
            🪑 Seat {seatStr} — Block
          </div>
          {!seatGenderPick[seatStr] ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={e => { e.stopPropagation(); setSeatGenderPick(p => ({ ...p, [seatStr]: "Male" })); }}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 7, border: "1.5px solid #3b82f6", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >👨 Male</button>
              <button
                onClick={e => { e.stopPropagation(); setSeatGenderPick(p => ({ ...p, [seatStr]: "Female" })); }}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 7, border: "1.5px solid #a855f7", background: "rgba(168,85,247,0.1)", color: "#c084fc", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >👩 Female</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>
                Gender: <b style={{ color: seatGenderPick[seatStr] === "Female" ? "#c084fc" : "#60a5fa" }}>{seatGenderPick[seatStr]}</b>
              </div>
              <input
                type="text"
                placeholder="Passenger Name *"
                value={blockForm.name}
                onClick={e => e.stopPropagation()}
                onChange={e => setBlockForm(p => ({ ...p, name: e.target.value }))}
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 12, outline: "none" }}
              />
              <input
                type="text"
                placeholder="Mobile Number *"
                maxLength={10}
                value={blockForm.mobile}
                onClick={e => e.stopPropagation()}
                onChange={e => setBlockForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 12, outline: "none" }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <button
                  onClick={e => { e.stopPropagation(); handleBlockSeat(seatStr); }}
                  disabled={blockingLoading}
                  style={{ flex: 2, padding: "7px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#e63946,#c1121f)", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  {blockingLoading ? "..." : "🚫 Block"}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setActiveSeat(null); setSeatGenderPick({}); setBlockForm({ name: "", mobile: "" }); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontSize: 12, cursor: "pointer" }}
                >✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INLINE INFO — for already-blocked seat */}
      {isActive && isBlocked && (
        <div style={{
          position:    "absolute",
          zIndex:      200,
          marginTop:   2,
          background:  "var(--bg2)",
          border:      "1px solid rgba(239,68,68,0.5)",
          borderRadius: 10,
          padding:     12,
          width:       200,
          boxShadow:   "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
            🚫 Seat {seatStr} — Blocked
          </div>
          {[
            ["👤 Name",   seatData?.passengerName || "—"],
            ["📱 Mobile", seatData?.mobile        || "—"],
            ["⚧ Gender",  seatData?.gender        || "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "var(--text2)" }}>{label}</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{val}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); handleUnblockSeat(seatStr); }}
              disabled={blockingLoading}
              style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >
              {blockingLoading ? "..." : "✅ Unblock"}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setActiveSeat(null); }}
              style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontSize: 12, cursor: "pointer" }}
            >✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep old renderSeatGrid for fallback (not used for SS or AC Sleeper)
function renderSeatGrid(pairs, deckTitle) {
  return (
    <div className="section-card">
      <div className="section-title">{deckTitle}</div>
      <div className="seat-grid-bus">
        {pairs.map(pair => (
          <div key={pair.row} className="seat-row-bus" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:10 }}>
            <div style={{ display:"flex", gap:6 }}>
              {pair.seats.slice(0,2).map(seat => renderSeatBtn(seat))}
            </div>
            <div style={{ width:30, textAlign:"center", fontWeight:700, fontSize:12, color:"#94a3b8" }}>
              {pair.row.replace("Row ","")}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {pair.seats.slice(2,4).map(seat => renderSeatBtn(seat))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function renderSeatBtn(seat) {
  const seatBooking = bookingBySeat(seat);
  const isBooked = bookedSeatsForTrip.includes(String(seat));
  const isSelected = String(selectedSeat) === String(seat);

  const isBlocked =
    selectedTrip?.blockedSeats?.includes(String(seat)) ||
    selectedBus?.blockedSeats?.includes(String(seat));

  const isLadies =
    selectedTrip?.ladiesSeats?.includes(seat) ||
    selectedBus?.ladiesSeats?.includes(seat);

  const bookedGender =
    seatBooking?.gender ||
    seatBooking?.passengers?.[0]?.gender ||
    seatGenderMap[String(seat)] ||
    "Male";

  const isFemaleBooked = isBooked && bookedGender === "Female";
  const selectedGender = seatGenderMap[String(seat)];

  let seatClass = "seat-btn available";

  if (isBlocked) seatClass = "seat-btn blocked";
  else if (isFemaleBooked) seatClass = "seat-btn ladies";
  else if (isBooked) seatClass = "seat-btn booked";
  else if (isLadies) seatClass = "seat-btn ladies";
  else if (isSelected && selectedGender === "Female") seatClass = "seat-btn ladies";
  else if (isSelected) seatClass = "seat-btn selected";

  return (
    <div key={seat} className="seat-wrap" style={{ position: "relative" }}>
      <button
        type="button"
        className={seatClass}

        // ✅ CLICK FIX
        onClick={() => {
          if (isBooked) { setSeatUnbookPopup({ ...seatBooking, seatNo: String(seat) }); return; }
          if (isBlocked) return;

          setAdminGenderPicker({ visible: true, seat });
        }}

        // ✅ RIGHT CLICK BLOCK FIX (🔥 MAIN FIX)
       onContextMenu={(e) => {
          e.preventDefault();
          if (!selectedTripId && !manualBooking.busId) return;
          if (window.confirm(`Block/Unblock seat ${seat}?`)) {
            if (selectedTripId) {
              toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "blockedSeats");
            } else if (manualBooking.busId) {
              toggleBusSeatBlock(manualBooking.busId, seat, false);
            }
          }
        }}
      >
        {seat}

        {/* gender dot */}
        {isSelected && selectedGender && (
          <span style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: selectedGender === "Female" ? "#a855f7" : "#3b82f6"
          }} />
        )}
      </button>
    </div>
  );
}
 
 
 
 
  // ── AC Sleeper 2x2 layout ──
function renderACSleeperLayout() {
  const allSeatIds = AC_SLEEPER_ALL_SEATS;
  const availCount = allSeatIds.filter(s => !bookedSeatsForTrip.includes(String(s))).length;

 function SleeperBtn({ seat }) {
  
    const seatStr = String(seat || "");
    const seatBooking = seat ? bookingBySeat(seat) : null;
    const isBooked = seat ? bookedSeatsForTrip.includes(seatStr) : false;
    const isSelected = seat ? String(selectedSeat) === seatStr : false;
    const isLadies = seat ? (selectedTrip?.ladiesSeats?.includes(seatStr) || selectedBus?.ladiesSeats?.includes(seatStr)) : false;
    const busIdForCheck = manualBooking.busId || selectedBus?._id || selectedBus?.id;
    const freshBus = buses.find(b => String(b._id || b.id) === String(busIdForCheck));
    const isBlocked = seat ? (
      selectedTrip?.blockedSeats?.includes(seatStr) ||
      (Array.isArray(freshBus?.blockedSeats) && freshBus.blockedSeats.includes(seatStr)) ||
      (Array.isArray(freshBus?.seats) && freshBus.seats.some(s => String(s.seatNo) === seatStr && s.isBlocked === true))
    ) : false;
    const blockedSeatData = isBlocked ? (
      (Array.isArray(freshBus?.seats) ? freshBus.seats : [])
        .find(s => String(s.seatNo) === seatStr) || {}
    ) : {};
    const bookedGender = seatBooking?.gender || seatBooking?.passengers?.[0]?.gender || seatGenderMap[seatStr] || "Male";
    const isFemaleBooked = isBooked && bookedGender === "Female";
    const selectedGender = seatGenderMap[seatStr];
    if (!seat) return <div style={{ width:46, height:40 }} />;

   let bg = "var(--bg3)", border = "var(--border)", color = "var(--text2)";
    if (isBlocked)          { bg="rgba(239,68,68,0.22)"; border="#ef4444"; color="#ef4444"; }
    else if (isFemaleBooked){ bg="rgba(168,85,247,0.28)";  border="#a855f7"; color="#c4b5fd"; }
    else if (isBooked)      { bg="rgba(245,158,11,0.28)";  border="#f59e0b"; color="#fcd34d"; }
    else if (isLadies)      { bg="rgba(236,72,153,0.18)";  border="#ec4899"; color="#f9a8d4"; }
    else if (isSelected && selectedGender === "Female") { bg="rgba(168,85,247,0.5)"; border="#a855f7"; color="white"; }
    else if (isSelected)    { bg="var(--accent)"; border="var(--accent)"; color="white"; }

    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
        <button
          type="button"
          title={isBlocked ? `Seat ${seat} — Blocked` : isBooked ? `${seatBooking?.passengerName||"Booked"} (${bookedGender})` : `Select Seat ${seat}`}
          onClick={() => {
            if (isBooked) { setSeatUnbookPopup({ ...seatBooking, seatNo: String(seat) }); return; }
            if (isBlocked) {
              setSeatBlockPopup({
                seat: seatStr,
                busId: busIdForCheck,
                isBlocked: true,
                seatData: blockedSeatData,
                passengerName: blockedSeatData.passengerName || "",
                mobile:        blockedSeatData.mobile        || "",
                gender:        blockedSeatData.gender        || "",
                boardingPoint: blockedSeatData.boardingPoint || "",
                droppingPoint: blockedSeatData.droppingPoint || "",
              });
              return;
            }
            setAdminGenderPicker({ visible: true, seat });
          }}
         onContextMenu={e => {
            e.preventDefault();
            if (!selectedTripId && !manualBooking.busId) return;
            if (window.confirm(`Block/Unblock seat ${seat}?`)) {
              if (selectedTripId) toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "blockedSeats");
              else toggleBusSeatBlock(manualBooking.busId, seat, false);
            }
          }}
          style={{
            width:46, height:40, borderRadius:8,
            border:`1.5px solid ${border}`, background:bg, color,
            cursor: isBlocked ? "not-allowed" : "pointer",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:1, transition:"all 0.12s", fontFamily:"'DM Sans',sans-serif", position:"relative",
          }}
        >
         <span style={{ fontSize:13, lineHeight:1 }}>{isBlocked ? "🚫" : "🛏"}</span>
          <span style={{ fontSize:9, fontWeight:700 }}>{seat}</span>
          {isSelected && selectedGender && (
            <span style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background: selectedGender==="Female"?"#a855f7":"#3b82f6" }}/>
          )}
        </button>
        {selectedTripId && (
          <div style={{ display:"flex", gap:2 }}>
            <button type="button"
              onClick={() => toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "ladiesSeats")}
              style={{ fontSize:8, padding:"1px 4px", borderRadius:3, cursor:"pointer", border:"none", background: isLadies ? "#ec4899" : "rgba(255,255,255,0.07)", color: isLadies ? "white" : "var(--text2)" }}>F</button>
            <button type="button"
              onClick={() => toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "blockedSeats")}
              style={{ fontSize:8, padding:"1px 4px", borderRadius:3, cursor:"pointer", border:"none", background: isBlocked ? "#ef4444" : "rgba(255,255,255,0.07)", color: isBlocked ? "white" : "var(--text2)" }}>X</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="section-card" style={{ overflowX:"auto" }}>
      {/* Title */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>
          🛏️ AC Sleeper — 2×2 Layout
          {selectedBus && <span style={{ fontSize:12, color:"var(--text2)", fontWeight:500, marginLeft:10 }}>({selectedBus.name})</span>}
        </div>
        <span style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#22c55e" }}>
          {availCount} available
        </span>
      </div>

      {/* Driver bar */}
      <div style={{ background:"#1e2535", borderRadius:8, padding:"6px 14px", display:"flex", justifyContent:"flex-end", marginBottom:10, border:"1px solid var(--border)" }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:1 }}>🚗 DRIVER →</span>
      </div>

      {/* Price hint */}
      <div style={{ textAlign:"center", fontSize:12, color:"#f59e0b", fontWeight:600, marginBottom:10 }}>
        ₹{selectedBus?.sleeperPrice || selectedBus?.price || 0} / seat
      </div>

      {/* Main grid: LEFT | AISLE | RIGHT */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", minWidth:340 }}>

        {/* LEFT SIDE */}
        {/* LEFT SIDE — 4 columns: Lower Lower Upper Upper */}
        <div style={{ flex:"0 0 auto" }}>
          <div style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"var(--text2)", marginBottom:6, letterSpacing:1 }}>LEFT SIDE</div>
          {/* Sub-headers */}
          <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:8 }}>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--text2)" }}>Lower</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--text2)" }}>Lower</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--accent2)" }}>Upper</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--accent2)" }}>Upper</div>
          </div>
          {(() => {
            // Group rows in pairs: row 0+1, row 2+3, row 4+5...
            const grouped = [];
            for (let i = 0; i < AC_SLEEPER_ROWS.length; i += 2) {
              grouped.push([AC_SLEEPER_ROWS[i], AC_SLEEPER_ROWS[i+1]]);
            }
            return grouped.map((pair, gi) => (
              <div key={"LG"+gi} style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:6 }}>
                <SleeperBtn seat={pair[0].leftLower} />
                <SleeperBtn seat={pair[1] ? pair[1].leftLower : null} />
                <SleeperBtn seat={pair[0].leftUpper} />
                <SleeperBtn seat={pair[1] ? pair[1].leftUpper : null} />
                
              </div>
            ));
          })()}
        </div>

       
        {/* RIGHT SIDE — 4 columns: Lower Lower Upper Upper */}
        <div style={{ flex:"0 0 auto" }}>
          <div style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"var(--text2)", marginBottom:6, letterSpacing:1 }}>RIGHT SIDE</div>
          {/* Sub-headers */}
          <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:8 }}>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--text2)" }}>Lower</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--text2)" }}>Lower</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--accent2)" }}>Upper</div>
            <div style={{ width:46, textAlign:"center", fontSize:8, fontWeight:700, color:"var(--accent2)" }}>Upper</div>
          </div>
          {(() => {
            const grouped = [];
            for (let i = 0; i < AC_SLEEPER_ROWS.length; i += 2) {
              grouped.push([AC_SLEEPER_ROWS[i], AC_SLEEPER_ROWS[i+1]]);
            }
            return grouped.map((pair, gi) => (
              <div key={"RG"+gi} style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:6 }}>
                <SleeperBtn seat={pair[0].rightLower} />
                <SleeperBtn seat={pair[1] ? pair[1].rightLower : null} />
                <SleeperBtn seat={pair[0].rightUpper} />
                <SleeperBtn seat={pair[1] ? pair[1].rightUpper : null} />
              </div>
            ));
          })()}
        </div>

       

         
          
        
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)" }}>
        {[
          { bg:"var(--bg3)",             border:"var(--border)", label:"Available"   },
          { bg:"var(--accent)",          border:"var(--accent)", label:"Selected (M)"},
          { bg:"rgba(168,85,247,0.5)",   border:"#a855f7",       label:"Selected (F)"},
          { bg:"rgba(245,158,11,0.28)",  border:"#f59e0b",       label:"Booked (M)"  },
          { bg:"rgba(168,85,247,0.28)",  border:"#a855f7",       label:"Booked (F)"  },
          { bg:"rgba(236,72,153,0.18)",  border:"#ec4899",       label:"Ladies"      },
          { bg:"rgba(100,116,139,0.18)", border:"#64748b",       label:"Blocked"     },
        ].map(item => (
          <span key={item.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text2)" }}>
            <span style={{ width:13, height:13, borderRadius:3, display:"inline-block", background:item.bg, border:`1px solid ${item.border}` }}/>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
 
 
 
  function renderSleeperSeat(seat) {
    const seatBooking = bookingBySeat(seat);
    const isBooked    = bookedSeatsForTrip.includes(String(seat));
    const isSelected  = selectedSeat === seat;
    const isLadies    = selectedTrip?.ladiesSeats?.includes(seat);
    const isBlocked =
  selectedTrip?.blockedSeats?.includes(String(seat)) ||
  selectedBus?.blockedSeats?.includes(String(seat));
    let seatClass = "sleeper-seat available";
    if (isBlocked)       seatClass = "sleeper-seat blocked";
    else if (isBooked)   seatClass = "sleeper-seat booked";
    else if (isLadies)   seatClass = "sleeper-seat ladies";
    else if (isSelected) seatClass = "sleeper-seat selected";
    return (
      <div key={seat} className="sleeper-seat-wrap">
        <button type="button" className={seatClass}
          title={isBooked ? "Click to view booking" : "Seat " + seat}
          onClick={() => {
            if (isBooked)  { setSeatPopup(seatBooking); return; }
            if (isBlocked) return;
            setSelectedSeat(seat);
            setManualBooking(prev => ({ ...prev, seatNo: seat }));
          }}
        >
          <span className="sleeper-icon">🛏</span>
          <span className="sleeper-num">{seat}</span>
        </button>
        {selectedTripId && (
          <div className="seat-mini-actions">
            <button type="button"
              className={"mini-seat-tag" + (isLadies ? " active" : "")}
              title="Toggle ladies seat"
              onClick={() => toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "ladiesSeats")}
            >F</button>
            <button type="button"
              className={"mini-seat-tag" + (isBlocked ? " active" : "")}
              title="Toggle blocked seat"
              onClick={() => {
  if (selectedTripId) {
    toggleTripSeatFlag(selectedTrip._id || selectedTrip.id, seat, "blockedSeats");
  } else if (manualBooking.busId) {
    toggleBusSeatFlag(manualBooking.busId, seat, "blockedSeats");
  }
}}
            >X</button>
          </div>
        )}
      </div>
    );
  }
 
  return (
    <div className="page">
      <div className="page-header">
        <h1>Bookings</h1>
        <p>Total: {bookings.length} bookings</p>
      </div>
 
      <div className="form-card">
        <div className="form-title">➕ Manual Booking + Seat Layout</div>
 
        {/* ── Bus type indicator badge ── */}
        {selectedBus && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: isACSleeperBus
              ? "rgba(99,102,241,0.12)"
              : isSeaterSleeperBus
              ? "rgba(20,184,166,0.12)"
              : "rgba(59,130,246,0.1)",
            border: `1px solid ${isACSleeperBus ? "rgba(99,102,241,0.3)" : isSeaterSleeperBus ? "rgba(20,184,166,0.3)" : "rgba(59,130,246,0.2)"}`,
            borderRadius: 10, marginBottom: 16, fontSize: 13,
          }}>
            <span style={{ fontSize: 18 }}>
              {isACSleeperBus ? "🛏️" : isSeaterSleeperBus ? "🪑🛏️" : "🚍"}
            </span>
            <div>
              <b style={{ color: "var(--text)" }}>{selectedBus.name}</b>
              <span style={{ color: "var(--text2)", marginLeft: 8 }}>({selectedBus.type || "Bus"})</span>
              {isACSleeperBus && <span style={{ color: "#818cf8", marginLeft: 8, fontSize: 12 }}>→ AC Sleeper 2×2 Layout</span>}
              {isSeaterSleeperBus && <span style={{ color: "#14b8a6", marginLeft: 8, fontSize: 12 }}>→ Lower (Seater) + Upper (Sleeper)</span>}
            </div>
          </div>
        )}
 
        <div className="form-grid">
          {/* Trip select */}
          <div className="form-group">
            <label className="form-label">Select Trip (optional)</label>
            <select className="form-select" value={selectedTripId}
              onChange={e => {
                setSelectedTripId(e.target.value);
                setSelectedSeat("");
                setManualBooking(p => ({
                  ...p,
                  seatNo: "", boardingPoint: "", droppingPoint: "",
                  tripId: e.target.value,
                  // reset busId only if trip changed
                  busId: "", busNo: "", busName: "",
                }));
              }}
            >
              <option value="">— Select a trip (optional) —</option>
              {trips.map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name || t.tripName} — {t.route || t.routeName} — {t.date || t.travelDate}
                </option>
              ))}
            </select>
          </div>
 
          <Input label="Passenger Name *" value={manualBooking.passengerName}
            onChange={v => setManualBooking(p => ({ ...p, passengerName: v }))} placeholder="Full name" />
          <Input label="Mobile Number" value={manualBooking.phone}
            onChange={v => setManualBooking(p => ({ ...p, phone: v }))} placeholder="10-digit mobile" />
          <Input label="Age" value={manualBooking.age}
            onChange={v => setManualBooking(p => ({ ...p, age: v }))} type="number" placeholder="Age" />
          <Select label="Gender" value={manualBooking.gender}
            onChange={v => setManualBooking(p => ({ ...p, gender: v }))} options={["Male","Female","Other"]} />
          <Input label="Journey Date" value={manualBooking.journeyDate}
            onChange={v => setManualBooking(p => ({ ...p, journeyDate: v }))} type="date" />
 
          {/* ── FIX: Bus dropdown uses _id as value ── */}
          <div className="form-group">
            <label className="form-label">Select Bus *</label>
            <select className="form-select"
              value={manualBooking.busId || ""}
             onChange={e => {
  const busId = e.target.value;
  const bus = buses.find(b => String(b._id || b.id) === busId);
  setManualBooking(p => ({
    ...p,
    busId:  busId,
    busNo:  bus?.number || bus?.busNumber || bus?.numberPlate || "",
    busName: bus?.name || "",
  }));
  setSelectedSeat("");
}}>
              <option value="">— Select bus —</option>
             // ✅ FIX — selected journey date नुसार filter
{buses
  .filter(b => {
    if (!manualBooking.journeyDate) return true; // date नाही तर सर्व दाखव
    
    const busDate = b.date || "";
    const selectedDate = manualBooking.journeyDate; // YYYY-MM-DD format
    
    if (!busDate) return true; // bus ला date नाही तर दाखव
    
    // Multiple formats handle करा
    // Bus date: DD/MM/YYYY किंवा YYYY-MM-DD
    // Selected date: YYYY-MM-DD (input type="date")
    
    let busISO = busDate;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(busDate)) {
      const [dd, mm, yyyy] = busDate.split("/");
      busISO = `${yyyy}-${mm}-${dd}`;
    }
    
    return busISO === selectedDate;
  })
  .map(b => (
    <option key={b._id || b.id} value={b._id || b.id}>
      {b.name} ({b.number || b.busNumber || b.numberPlate}) — {b.type || "Bus"} — {b.date || "No Date"}
    </option>
  ))
}
            </select>
          </div>
 
         <div className="form-group">
  <label className="form-label">Boarding Point</label>
  
  {/* Search box */}
  <input
    className="form-input"
    placeholder="🔍 Search boarding point..."
    value={boardingSearch}
    onChange={e => setBoardingSearch(e.target.value)}
    style={{ marginBottom: 6 }}
  />
  
  <select
    className="form-select"
    value={manualBooking.boardingPoint}
    onChange={e => setManualBooking(p => ({ ...p, boardingPoint: e.target.value }))}
    size={5}
    style={{ height: "auto", minHeight: 120 }}
  >
    <option value="">— Select boarding —</option>
    {/* Trip/Route points पहिले */}
    {boardingOptions.length > 0 && boardingOptions
      .filter(item => {
        const name = typeof item === "string" ? item : (item.mr + " " + item.en);
        return name.toLowerCase().includes(boardingSearch.toLowerCase());
      })
      .map((item, i) => (
        <option key={"bp_" + i} value={typeof item === "string" ? item : item.mr}>
          ⭐ {pointLabel(item)}
        </option>
      ))
    }
    {/* Separator */}
    {boardingOptions.length > 0 && (
      <option disabled>──── All Points ────</option>
    )}
    {/* All points alphabetically */}
    {ALL_BOARDING_POINTS
      .filter(pt =>
        pt.toLowerCase().includes(boardingSearch.toLowerCase()) &&
        !boardingOptions.some(bo => (typeof bo === "string" ? bo : bo.en) === pt || (typeof bo === "string" ? bo : bo.mr) === pt)
      )
      .map(pt => (
        <option key={pt} value={pt}>{pt}</option>
      ))
    }
  </select>
  
  {/* Selected display */}
  {manualBooking.boardingPoint && (
    <div style={{
      marginTop: 6, padding: "6px 10px", background: "rgba(34,197,94,0.1)",
      border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6,
      fontSize: 12, color: "#22c55e", display: "flex", justifyContent: "space-between"
    }}>
      <span>✅ {manualBooking.boardingPoint}</span>
      <button
        type="button"
        onClick={() => setManualBooking(p => ({ ...p, boardingPoint: "" }))}
        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}
      >×</button>
    </div>
  )}
</div>
 
         <div className="form-group">
  <label className="form-label">Dropping Point</label>
  
  <input
    className="form-input"
    placeholder="🔍 Search dropping point..."
    value={droppingSearch}
    onChange={e => setDroppingSearch(e.target.value)}
    style={{ marginBottom: 6 }}
  />
  
  <select
    className="form-select"
    value={manualBooking.droppingPoint}
    onChange={e => setManualBooking(p => ({ ...p, droppingPoint: e.target.value }))}
    size={5}
    style={{ height: "auto", minHeight: 120 }}
  >
    <option value="">— Select dropping —</option>
    {droppingOptions.length > 0 && droppingOptions
      .filter(item => {
        const name = typeof item === "string" ? item : (item.mr + " " + item.en);
        return name.toLowerCase().includes(droppingSearch.toLowerCase());
      })
      .map((item, i) => (
        <option key={"dp_" + i} value={typeof item === "string" ? item : item.mr}>
          ⭐ {pointLabel(item)}
        </option>
      ))
    }
    {droppingOptions.length > 0 && (
      <option disabled>──── All Points ────</option>
    )}
    {ALL_DROPPING_POINTS
      .filter(pt =>
        pt.toLowerCase().includes(droppingSearch.toLowerCase()) &&
        !droppingOptions.some(dr => (typeof dr === "string" ? dr : dr.en) === pt || (typeof dr === "string" ? dr : dr.mr) === pt)
      )
      .map(pt => (
        <option key={pt} value={pt}>{pt}</option>
      ))
    }
  </select>
  
  {manualBooking.droppingPoint && (
    <div style={{
      marginTop: 6, padding: "6px 10px", background: "rgba(59,130,246,0.1)",
      border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6,
      fontSize: 12, color: "#60a5fa", display: "flex", justifyContent: "space-between"
    }}>
      <span>✅ {manualBooking.droppingPoint}</span>
      <button
        type="button"
        onClick={() => setManualBooking(p => ({ ...p, droppingPoint: "" }))}
        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}
      >×</button>
    </div>
  )}
</div>
          <Input label="Amount (₹)" value={manualBooking.amount}
            onChange={v => setManualBooking(p => ({ ...p, amount: v }))} type="number" placeholder="0" />
          <Input label="Seat No" value={manualBooking.seatNo}
            onChange={v => setManualBooking(p => ({ ...p, seatNo: v }))} placeholder="Or click seat below" />
          <Select label="Payment Mode" value={manualBooking.paymentMode}
            onChange={v => setManualBooking(p => ({ ...p, paymentMode: v }))} options={["Cash","UPI","Card"]} />
          <Select label="Payment Status" value={manualBooking.paymentStatus}
            onChange={v => setManualBooking(p => ({ ...p, paymentStatus: v }))} options={["Paid","Pending","Failed","Refunded"]} />
          <Select label="Refund Status" value={manualBooking.refundStatus}
            onChange={v => setManualBooking(p => ({ ...p, refundStatus: v }))} options={["Not Applicable","Requested","Processing","Refunded"]} />
          <Input label="Conductor Note" value={manualBooking.conductorNote}
            onChange={v => setManualBooking(p => ({ ...p, conductorNote: v }))} placeholder="Optional" />
        </div>
 
        {/* Legend */}
        <div className="seat-legend">
          {[["available","Available"],["selected","Selected"],["booked","Booked"],["ladies","Ladies"],["blocked","Blocked"]].map(([cls, label]) => (
            <span key={cls} className="legend-item">
              <span className={"legend-box " + cls}></span>{label}
            </span>
          ))}
        </div>
 
       {(!selectedTripId && !manualBooking.busId) ? (
  <div className="empty-state">
    <div className="empty-icon">🪑</div>
    <div className="empty-text">Select a trip or bus to view seat layout</div>
  </div>
) : !selectedBus ? (
  <div className="empty-state">
    <div className="empty-icon">🚍</div>
    <div className="empty-text">
      {selectedTripId
        ? "Bus not found for this trip. Please check bus assignment."
        : "Please select a bus to view seat layout."}
    </div>
  </div>
) : isACSleeperBus ? (
          /* AC Sleeper → 2x2 layout matching Image 2 */
          renderACSleeperLayout()
        ) : isSeaterSleeperBus ? (
          /* AC Seater-Sleeper → 2+1 layout matching Image 1 */
          renderSeaterSleeperLayout()
        ) : (
          /* Any other bus type → fallback two-deck grid */
          <div className="two-col-grid">
            {renderSeatGrid(LOWER_SEAT_PAIRS, "🪑 Seats")}
            {renderSeatGrid(UPPER_SEAT_PAIRS, "🛏️ Upper Deck")}
          </div>
        )}
 {/* ── Selected Seats Summary ── */}
{manualBooking.seatNumbers?.length > 0 && (
  <div style={{
    padding: "12px 16px", borderRadius: 10, marginTop: 8,
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
  }}>
    <div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
        ✅ Selected Seats ({manualBooking.seatNumbers.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {manualBooking.seatNumbers.map(seat => (
          <span key={seat} style={{
            background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 6, padding: "3px 10px", fontSize: 13, fontWeight: 700, color: "#22c55e",
          }}>
            {seat}
            <button
              onClick={() => setManualBooking(p => ({
                ...p,
                seatNumbers: p.seatNumbers.filter(s => s !== seat),
                seatNo: p.seatNumbers.filter(s => s !== seat)[0] || "",
                amount: String(
                  (Number(selectedBus?.seaterPrice || selectedBus?.price || 0)) *
                  p.seatNumbers.filter(s => s !== seat).length
                ),
              }))}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#ef4444", fontSize: 14, marginLeft: 4, padding: 0,
              }}
            >×</button>
          </span>
        ))}
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: "var(--text2)" }}>Total Amount</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>
        ₹{manualBooking.amount || 0}
      </div>
    </div>
  </div>
)}
        <div className="form-actions">
          <button className="btn-primary" onClick={addManualBooking}>➕ Add Booking</button>
          <button className="btn-secondary" onClick={() => {
  setManualBooking({ ...emptyBookingForm, seatNumbers: [] });
setSelectedSeat("");
setSelectedTripId("");
setSeatGenderMap({}); // 🔥 YE ADD KAR
}}>Clear Form</button>
        </div>
      </div>
 
      {/* ── Toolbar + Table (unchanged) ── */}
      <Toolbar
        search={search} setSearch={setSearch}
        searchPlaceholder="Search name / phone / seat / booking ID"
        filterValue={statusFilter} setFilterValue={setStatusFilter}
        filterOptions={["All","Paid","Pending","Failed","Refunded"]}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
      />
 
      <div className="section-card">
        <div className="section-title">Booking List ({filtered.length})</div>
 
        {/* Desktop table */}
        <div style={{ overflowX: "auto" }} className="desktop-only">
          <table className="data-table" style={{ minWidth: 500 }}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(b => {
                const bid = b._id || b.id;
                return (
                  <tr key={bid}>
                    <td>
                      <b style={{ fontFamily: "monospace", fontSize: 11 }}>{b.bookingCode}</b>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        {b.journeyDate || b.date || "—"}
                      </div>
                    </td>
                    <td>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: 14, padding: 0, textAlign: "left" }}
                        onClick={() => setSelectedBookingForTicket(b)}
                      >
                        {b.passengerName || "—"}
                      </button>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {b.phone} &nbsp;·&nbsp; {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "#888" }}>
                       Seat: {(b.seatNumbers?.length > 1 
  ? b.seatNumbers.join(", ") 
  : b.seatNo 
  ? getSeatDisplayLabel(b.seatNo) 
  : "—")}&nbsp;·&nbsp; {b.busNo || b.bus || "—"}
                      </div>
                    </td>
                    <td>
                      {statusBadge(b.paymentStatus || "Pending")}
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                        ₹{Number(b.amount || 0).toLocaleString()} · {b.paymentMode || "—"}
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-sm btn-edit" onClick={() => { setSelectedBookingForTicket(b); generateTicket(b); }}>🖨️</button>
                        <button className="btn-sm btn-edit" onClick={() => sendTicketOnWhatsApp(b)}>💬</button>
                        <button className="btn-sm btn-success" onClick={() => updateBookingStatus(bid, "Paid")}>✓ Paid</button>
                        <button className="btn-sm btn-edit" onClick={() => setEditing(b)}>Edit</button>
                        <button className="btn-sm btn-del" onClick={() => { if (window.confirm("Delete this booking?")) deleteBooking(bid); }}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="empty-icon">🎫</div>
                      <div className="empty-text">No bookings found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* Mobile cards */}
      <div className="mobile-cards">
        {filtered.length ? filtered.map(b => {
          const bid = b._id || b.id;
          return (
            <div key={bid} className="customer-card">
              <div className="card-top">
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: 15, padding: 0, textAlign: "left" }}
                  onClick={() => setSelectedBookingForTicket(b)}
                >
                  {b.passengerName || "—"}
                </button>
                {statusBadge(b.paymentStatus || "Pending")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", margin: "4px 0 6px" }}>
                {b.phone || ""} &nbsp;·&nbsp; ₹{Number(b.amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
                {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
               Seat: <b>{b.seatNumbers?.length > 1 
  ? b.seatNumbers.join(", ") 
  : b.seatNo 
  ? getSeatDisplayLabel(b.seatNo) 
  : "—"}</b> &nbsp;·&nbsp;
                {b.journeyDate || b.date || "—"} &nbsp;·&nbsp; {b.busNo || b.bus || "—"}
              </div>
              <div className="card-meta">
                <div className="card-actions">
                  <button className="btn-sm btn-edit" onClick={() => { setSelectedBookingForTicket(b); generateTicket(b); }}>🖨️</button>
                  <button className="btn-sm btn-edit" onClick={() => sendTicketOnWhatsApp(b)}>💬</button>
                  <button className="btn-sm btn-success" onClick={() => updateBookingStatus(bid, "Paid")}>✓ Paid</button>
                  <button className="btn-sm btn-edit" onClick={() => setEditing(b)}>Edit</button>
                  <button className="btn-sm btn-del" onClick={() => { if (window.confirm("Delete?")) deleteBooking(bid); }}>Del</button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="empty-state"><div className="empty-icon">🎫</div><div className="empty-text">No bookings found</div></div>
        )}
      </div>
 
      {selectedBookingForTicket && (
        <BookingDetailModal
          item={selectedBookingForTicket}
          onClose={() => setSelectedBookingForTicket(null)}
          onPrint={() => generateTicket(selectedBookingForTicket)}
          onWhatsApp={() => sendTicketOnWhatsApp(selectedBookingForTicket)}
        />
      )}
      {editing && (
        <EditBookingModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={payload => { saveBooking(payload, editing._id || editing.id); setEditing(null); }}
        />
      )}
     <AdminGenderPickerModal
    visible={adminGenderPicker.visible}
    seat={adminGenderPicker.seat}
    onSelect={handleAdminGenderSelect}
    onCancel={() => setAdminGenderPicker({ visible: false, seat: null })}
    boardingOptions={boardingOptions}
    droppingOptions={droppingOptions}
  onBlock={async ({ seat, name, mobile, boardingPoint, droppingPoint }) => {
      const busId = manualBooking.busId || (selectedBus?._id || selectedBus?.id);
      if (!busId) { alert("Bus select करा"); return; }
      try {
        await apiFetch(`/api/buses/${busId}/block-seat`, {
          method: "PATCH",
          body: JSON.stringify({
            seatNo:        String(seat),
            isBlocked:     true,
            gender:        "Blocked",
            passengerName: name.trim(),
            mobile:        mobile.trim(),
            boardingPoint: boardingPoint || "",
            droppingPoint: droppingPoint || "",
          }),
        });
        setBuses(prev => prev.map(b => {
          if (String(b._id || b.id) !== String(busId)) return b;
          const newBlocked = [...new Set([
            ...(Array.isArray(b.blockedSeats) ? b.blockedSeats : []),
            String(seat)
          ])];
          const existingSeats = Array.isArray(b.seats)
            ? b.seats
            : Array.isArray(b.seatDetails)
            ? b.seatDetails
            : [];
          const idx = existingSeats.findIndex(s =>
            s && String(s.seatNo) === String(seat)
          );
          const newSeat = {
            seatNo:        String(seat),
            isBlocked:     true,
            isBooked:      false,
            gender:        "Blocked",
            passengerName: name.trim(),
            mobile:        mobile.trim(),
            boardingPoint: boardingPoint || "",
            droppingPoint: droppingPoint || "",
          };
          const newSeats = idx >= 0
            ? existingSeats.map((s, i) => i === idx ? newSeat : s)
            : [...existingSeats, newSeat];
          return { ...b, seats: newSeats, blockedSeats: newBlocked };
        }));
        showToast(`✅ Seat ${seat} blocked for ${name}`);
      } catch (e) {
        showToast("Block failed: " + e.message, "error");
      }
    }}
  />

 <SeatBlockInfoPopup
    popup={seatBlockPopup}
    onClose={() => setSeatBlockPopup(null)}
    onUnblock={async (busId, seatNo) => {
      try {
        const res = await apiFetch(`/api/buses/${busId}/seats`, {
          method: "PATCH",
          body: JSON.stringify({ seatNo: String(seatNo), isBlocked: false }),
        });
        setBuses(prev =>
          prev.map(b =>
            String(b._id || b.id) === String(busId)
              ? {
                  ...b,
                  blockedSeats: (b.blockedSeats || []).filter(s => String(s) !== String(seatNo)),
                  seats: (Array.isArray(b.seats) ? b.seats : []).map(s =>
                    String(s.seatNo) === String(seatNo)
                      ? { ...s, isBlocked: false, gender: "", passengerName: "", mobile: "" }
                      : s
                  ),
                }
              : b
          )
        );
        setSeatBlockPopup(null);
        showToast(`✅ Seat ${seatNo} unblocked`);
      } catch (e) {
        showToast("Unblock failed: " + e.message, "error");
      }
    }}
  />    
  {seatUnbookPopup && (
  <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSeatUnbookPopup(null); }}>
    <div style={{
      background: "var(--bg2)", border: "1px solid rgba(245,158,11,0.4)",
      borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
      boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>🪑</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
        Seat {seatUnbookPopup.seatNo} — Booked
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 16 }}>
        {[
          ["👤 Passenger", seatUnbookPopup.passengerName || "—"],
          ["📱 Mobile",    seatUnbookPopup.phone         || "—"],
          ["⚧ Gender",    seatUnbookPopup.gender         || "—"],
          ["🟢 Boarding",  seatUnbookPopup.boardingPoint  || "—"],
          ["🔴 Dropping",  seatUnbookPopup.droppingPoint  || "—"],
          ["📅 Date",      seatUnbookPopup.journeyDate    || "—"],
          ["💰 Amount",    "₹" + (seatUnbookPopup.amount || 0)],
          ["💳 Payment",   seatUnbookPopup.paymentStatus  || "—"],
        ].map(([label, val]) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 13, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ color: "var(--text2)" }}>{label}</span>
            <span style={{ fontWeight: 700, color: "var(--text)", maxWidth: "60%", textAlign: "right" }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={async () => {
            try {
              await apiFetch("/api/bookings/" + seatUnbookPopup._id, {
                method: "PATCH",
                body: JSON.stringify({ paymentStatus: "Refunded", bookingStatus: "Cancelled" }),
              });
              setBookings(prev => prev.map(b =>
                String(b._id) === String(seatUnbookPopup._id)
                  ? { ...b, paymentStatus: "Refunded", bookingStatus: "Cancelled" }
                  : b
              ));
              setSeatUnbookPopup(null);
              showToast("✅ Seat unbooked!");
            } catch (e) {
              showToast("Unbook failed: " + e.message, "error");
            }
          }}
          style={{
            flex: 1, background: "linear-gradient(135deg,#d97706,#b45309)",
            color: "white", border: "none", borderRadius: 9,
            padding: "11px 0", cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}
        >🔓 Unbook Seat</button>
        <button
          onClick={() => setSeatUnbookPopup(null)}
          style={{
            flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
            color: "var(--text2)", borderRadius: 9, padding: "11px 0",
            cursor: "pointer", fontWeight: 600, fontSize: 14,
          }}
        >Close</button>
      </div>
    </div>
  </div>
)}
                                            
    </div>
  );
}
 
// ===================== TRIPS PAGE =====================
function TripsPage({ buses, trips, routes, saveTrip, deleteTrip }) {
  const emptyForm = { name: "", routeId: "", route: "", date: "", time: "", bus: "", price: "", status: "Active", boardingPoints: [], droppingPoints: [] };
  const [form,         setForm]         = useState(emptyForm);
  const [editing,      setEditing]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder,    setSortOrder]    = useState("latest");

  const selectedRouteObj = routes.find(r => String(r._id || r.id) === String(form.routeId));
  const boardingOptions  = selectedRouteObj?.boardingPoints?.length ? selectedRouteObj.boardingPoints : MASTER_POINTS;
  const droppingOptions  = selectedRouteObj?.droppingPoints?.length ? selectedRouteObj.droppingPoints : MASTER_POINTS;

  const filtered = useMemo(() => {
    let list = [...trips];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.name || t.tripName || "").toLowerCase().includes(q) ||
        (t.route || t.routeName || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(t => (t.status || "Active") === statusFilter);
    list.sort((a, b) => sortOrder === "latest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    return list;
  }, [trips, search, statusFilter, sortOrder]);

  function submit() {
    if (!form.name || !form.routeId || !form.date || !form.bus) {
      alert("Trip name, route, date and bus are required!"); return;
    }
    saveTrip(
      { ...form, route: selectedRouteObj ? selectedRouteObj.name : form.route },
      editing ? (editing._id || editing.id) : null
    );
    setForm(emptyForm); setEditing(null);
  }

  function addPoint(field, val) {
    if (!val) return;
    const pt = MASTER_POINTS.find(p => p.mr === val) || { mr: val, en: val };
    if (!form[field].some(p => (p.mr || p) === pt.mr))
      setForm(f => ({ ...f, [field]: [...f[field], pt] }));
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Trips</h1><p>Manage all trips</p></div>
      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Trip" : "➕ Add Trip"}</div>
        <div className="form-grid">
          <Input label="Trip Name *" value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Pune Night Express" />
          <div className="form-group">
            <label className="form-label">Select Route *</label>
            <select className="form-select" value={form.routeId}
              onChange={e => {
                const r = routes.find(r => String(r._id || r.id) === e.target.value);
                setForm(f => ({
                  ...f, routeId: e.target.value, route: r ? r.name : "",
                  boardingPoints: r?.boardingPoints || [],
                  droppingPoints: r?.droppingPoints || [],
                }));
              }}>
              <option value="">— Select route —</option>
              {routes.map(r => (
                <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <Input label="Date *" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
          <Input label="Time"  value={form.time}  onChange={v => setForm(f => ({ ...f, time: v }))} type="time" />
          <div className="form-group">
            <label className="form-label">Select Bus *</label>
            <select className="form-select" value={form.bus}
              onChange={e => setForm(f => ({ ...f, bus: e.target.value }))}>
              <option value="">— Select bus —</option>
              {buses.map(b => (
                <option key={b._id || b.id} value={b.number || b.busNumber || b.numberPlate}>
                  {b.name} ({b.number || b.busNumber || b.numberPlate})
                </option>
              ))}
            </select>
          </div>
          <Input label="Price (₹)" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" />
          <Select label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["Active","Inactive"]} />
          {["boardingPoints","droppingPoints"].map(field => (
            <div key={field} className="form-group">
              <label className="form-label">
                {field === "boardingPoints" ? "Boarding Points" : "Dropping Points"}
              </label>
              <select className="form-select" value=""
                onChange={e => addPoint(field, e.target.value)}>
                <option value="">+ Add point</option>
                {(field === "boardingPoints" ? boardingOptions : droppingOptions).map((item, i) => (
                  <option key={i} value={typeof item === "string" ? item : item.mr}>
                    {pointLabel(item)}
                  </option>
                ))}
              </select>
              <div className="chip-wrap">
                {form[field].map((item, i) => (
                  <span key={i} className="chip">
                    {pointLabel(item)}
                    <button type="button" onClick={() =>
                      setForm(f => ({ ...f, [field]: f[field].filter((_, j) => j !== i) }))
                    }>×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>{editing ? "Update Trip" : "Add Trip"}</button>
          {editing && (
            <button className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch} searchPlaceholder="Search trip / route"
        filterValue={statusFilter} setFilterValue={setStatusFilter} filterOptions={["All","Active","Inactive"]}
        sortOrder={sortOrder} setSortOrder={setSortOrder} />

      <div className="section-card">
        <div className="section-title">Trip List ({filtered.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Trip Name</th><th>Route</th><th>Date</th><th>Time</th><th>Bus</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(t => (
                <tr key={t._id || t.id}>
                  <td><b>{t.name || t.tripName}</b></td>
                  <td>{t.route || t.routeName || "—"}</td>
                  <td>{t.date || t.travelDate || "—"}</td>
                  <td>{t.time || t.departureTime || "—"}</td>
                  <td><code>{t.bus || t.busName || "—"}</code></td>
                  <td><b>₹{t.price || t.fare || 0}</b></td>
                  <td>{statusBadge(t.status || "Active")}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-edit" onClick={() => {
                        setEditing(t);
                        setForm({
                          name: t.name || t.tripName || "",
                          routeId: t.routeId || "",
                          route: t.route || t.routeName || "",
                          date: t.date || t.travelDate || "",
                          time: t.time || t.departureTime || "",
                          bus: t.bus || t.busName || "",
                          price: t.price || t.fare || "",
                          status: t.status || "Active",
                          boardingPoints: t.boardingPoints || [],
                          droppingPoints: t.droppingPoints || [],
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>Edit</button>
                      <button className="btn-sm btn-del"
                        onClick={() => { if (window.confirm("Delete this trip?")) deleteTrip(t._id || t.id); }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8">
                  <div className="empty-state"><div className="empty-icon">🗺️</div><div className="empty-text">No trips yet</div></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===================== BUSES PAGE =====================
function BusesPage({ buses, saveBus, deleteBus }) {
  const emptyForm = {
  name: "", number: "", type: "AC Sleeper", seats: "40",
  sleeperPrice: "", seaterPrice: "", upperPrice: "", price: "",
  status: "Active",
  fromCity: "",        // ✅ use fromCity
  toCity: "",          // ✅ use toCity
  departureTime: "",
  arrivalTime: "",
  date: "",
};
  const [form,         setForm]         = useState(emptyForm);
  const [editing,      setEditing]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder,    setSortOrder]    = useState("latest");
  const [loading,      setLoading]      = useState(false);

  const busIsSleeperOnly   = isSleeperOnly(form.type);
  const busIsSeaterSleeper = isSeaterSleeper(form.type);

  const filtered = useMemo(() => {
    let list = Array.isArray(buses) ? [...buses] : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.name || "").toLowerCase().includes(q) ||
        (b.number || b.busNumber || b.numberPlate || "").toLowerCase().includes(q) ||
        (b.type || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(b => (b.status || "Active") === statusFilter);
    list.sort((a, b) => sortOrder === "latest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    return list;
  }, [buses, search, statusFilter, sortOrder]);

async function submit() {
    if (!form.name.trim() || !form.number.trim()) {
      alert("Bus Name and Number Plate are required!"); return;
    }
    if (!form.fromCity?.trim() || !form.toCity?.trim()) {
      alert("From City and To City are required!"); return;
    }
    if (form.fromCity.trim().toLowerCase() === form.toCity.trim().toLowerCase()) {
      alert("From and To cities cannot be same!"); return;
    }
    if (!form.date) {
      alert("Date is required!"); return;
    }
    setLoading(true);
    try {
      const sleeperPr = Number(form.sleeperPrice) || 0;
      const seaterPr  = Number(form.seaterPrice)  || 0;
      const upperPr   = Number(form.upperPrice)   || 0;

      await saveBus({
        name:          form.name.trim(),
        number:        form.number.trim(),
        busNumber:     form.number.trim(),
        numberPlate:   form.number.trim(),
        type:          form.type,
        seats:         Number(form.seats) || 40,
        totalSeats:    Number(form.seats) || 40,
        sleeperPrice:  busIsSleeperOnly ? sleeperPr : upperPr,
        seaterPrice:   busIsSleeperOnly ? sleeperPr : seaterPr,
        price:         busIsSleeperOnly ? sleeperPr : seaterPr,
        status:        form.status,
        from:          form.fromCity.trim(),
        to:            form.toCity.trim(),
        departureTime: form.departureTime || "",
        departure:     form.departureTime || "",
        arrivalTime:   form.arrivalTime   || "",
        arrival:       form.arrivalTime   || "",
        date:          form.date,
        time:          form.departureTime || "",
      }, editing ? (editing._id || editing.id) : null);
      setForm(emptyForm);
      setEditing(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="page">
      <div className="page-header"><h1>Buses</h1><p>Total: {buses.length}</p></div>
      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Bus" : "➕ Add Bus"}</div>
       
  <div className="form-grid">
          <Input label="Bus Name *" value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}   placeholder="Shahaji Express" />
          <Input label="Number Plate *" value={form.number} onChange={v => setForm(f => ({ ...f, number: v }))} placeholder="MH14XX1234" />

          {/* Bus Type dropdown */}
          <div className="form-group">
            <label className="form-label">Bus Type</label>
            <select className="form-select" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value, sleeperPrice: "", seaterPrice: "", upperPrice: "" }))}>
              <option value="">— Select type —</option>
              <option value="AC Sleeper">AC Sleeper</option>
              <option value="AC Seater-Sleeper">AC Seater-Sleeper</option>
              
            </select>
          </div>

          <Input label="Total Seats" value={form.seats}
            onChange={v => setForm(f => ({ ...f, seats: v }))} type="number"
            placeholder={busIsSleeperOnly ? "40" : "36"} />

          {/* ── PRICE FIELDS — bus type नुसार ── */}
          {busIsSleeperOnly ? (
            /* AC Sleeper → 1 price only */
            <Input
              label="Sleeper Price (₹)"
              value={form.sleeperPrice}
              onChange={v => setForm(f => ({ ...f, sleeperPrice: v, price: v }))}
              type="number" placeholder="900"
            />
          ) : busIsSeaterSleeper ? (
            /* Seater-Sleeper → 2 prices */
            <>
              <Input
                label="Seater Price (₹) — Lower Deck"
                value={form.seaterPrice}
                onChange={v => setForm(f => ({ ...f, seaterPrice: v, price: v }))}
                type="number" placeholder="540"
              />
              <Input
                label="Sleeper Price (₹) — Upper Deck"
                value={form.upperPrice}
                onChange={v => setForm(f => ({ ...f, upperPrice: v }))}
                type="number" placeholder="630"
              />
            </>
          ) : (
            /* Other types → single price */
            <Input
              label="Price (₹)"
              value={form.seaterPrice}
              onChange={v => setForm(f => ({ ...f, seaterPrice: v, price: v }))}
              type="number" placeholder="500"
            />
          )}

          <Select label="Status" value={form.status}
            onChange={v => setForm(f => ({ ...f, status: v }))} options={["Active","Inactive"]} />
          <Input label="Departure Time" value={form.departureTime || ""}
            onChange={v => setForm(f => ({ ...f, departureTime: v }))} placeholder="08:00 AM" />
          <Input label="Arrival Time"   value={form.arrivalTime || ""}
  onChange={v => setForm(f => ({ ...f, arrivalTime: v }))} placeholder="02:00 PM" />

{/* ✅ ADD THIS HERE */}
<div className="form-group">
  <label className="form-label">From City (Departure) *</label>
  <input
    className="form-input"
    type="text"
    placeholder="e.g. Karad"
    value={form.fromCity || ""}
    onChange={e => setForm(f => ({ ...f, fromCity: e.target.value }))}
  />
</div>

<div className="form-group">
  <label className="form-label">To City (Arrival) *</label>
  <input
    className="form-input"
    type="text"
    placeholder="e.g. Mumbai"
    value={form.toCity || ""}
    onChange={e => setForm(f => ({ ...f, toCity: e.target.value }))}
  />
</div>

<Input label="Date *" type="date" value={form.date || ""}
            onChange={v => setForm(f => ({ ...f, date: v }))} />
        </div>
        {/* Price info note */}
        {/* Price info note */}
        {busIsSleeperOnly && (
          <div className="price-note">
            🛏️ <b>AC Sleeper Bus</b> — Single price for all sleeper seats. Seat layout: 2x2 (image प्रमाणे)
          </div>
        )}
        {busIsSeaterSleeper && (
          <div className="price-note">
            🪑🛏️ <b>Seater-Sleeper Bus</b> — Lower deck: Seater price | Upper deck: Sleeper price
          </div>
        )}

        <div className="form-actions">
          <button className="btn-primary" onClick={submit}
            disabled={loading || !form.name.trim() || !form.number.trim()}>
            {loading ? "Saving…" : editing ? "Update Bus" : "Add Bus"}
          </button>
          {editing && (
            <button className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch} searchPlaceholder="Search name / number / type"
        filterValue={statusFilter} setFilterValue={setStatusFilter} filterOptions={["All","Active","Inactive"]}
        sortOrder={sortOrder} setSortOrder={setSortOrder} />

      <div className="section-card">
        <div className="section-title">Bus List ({filtered.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
             <tr>
  <th>#</th><th>Name</th><th>Number</th><th>Type</th>
  <th>Date</th><th>Seats</th><th>Price</th><th>Status</th><th>Actions</th>
</tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((b, i) => {
                const bType = b.type || "";
                const sleepOnly = isSleeperOnly(bType);
                const seaterSlp = isSeaterSleeper(bType);
                let priceDisplay = "₹" + (b.price || 0);
                if (sleepOnly) {
                  priceDisplay = "₹" + (b.sleeperPrice || b.price || 0) + " (Sleeper)";
                } else if (seaterSlp) {
                  priceDisplay = "₹" + (b.seaterPrice || b.price || 0) + " / ₹" + (b.sleeperPrice || b.price || 0);
                }
                return (
                 // REPLACE the entire bus table row (tr) inside BusesPage filtered.map
<tr key={b._id || b.id || i}>
  <td>{i + 1}</td>
  <td><b>{b.name || "—"}</b></td>
  <td><code>{b.number || b.busNumber || b.numberPlate || "—"}</code></td>
  <td>{b.type || "—"}</td>
  <td>
    <span style={{
      background: b.date ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
      color: b.date ? "#22c55e" : "#ef4444",
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>
      {b.date || "⚠️ No Date"}
    </span>
  </td>
 <td>{b.totalSeats || (typeof b.seats === 'number' ? b.seats : (Array.isArray(b.seats) ? b.seats.length : "—"))}</td>
  <td><b>{priceDisplay}</b></td>
  <td>{statusBadge(b.status || "Active")}</td>
  <td>
    <div className="action-btns">
      <button className="btn-sm btn-edit" onClick={() => {
        setEditing(b);
        const bSleepOnly = isSleeperOnly(b.type || "");
        const bSeaterSlp = isSeaterSleeper(b.type || "");
    setEditing(b);
setForm({
  name:          b.name || "",
  number:        b.number || b.busNumber || b.numberPlate || "",
  type:          b.type || "AC Sleeper",
  seats:         String(b.totalSeats || b.seats || 40),
  seaterPrice:   String(b.seaterPrice || ""),
  sleeperPrice:  String(b.sleeperPrice || b.price || ""),
  upperPrice:    String(b.sleeperPrice || ""),
  price:         String(b.price || ""),
  departureTime: b.departureTime || b.departure || "",
  arrivalTime:   b.arrivalTime   || b.arrival   || "",
  fromCity:      b.from || "",    // ✅ reads from DB field "from"
  toCity:        b.to   || "",    // ✅ reads from DB field "to"
  date:          b.date || "",
  status:        b.status || "Active",
});
window.scrollTo({ top: 0, behavior: "smooth" });
      }}>Edit</button>
      <button className="btn-sm btn-del"
        onClick={() => { if (window.confirm("Delete this bus?")) deleteBus(b._id || b.id); }}>
        Delete
      </button>
    </div>
  </td>
</tr>
                );
              }) : (
                <tr><td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-icon">🚍</div>
                    <div className="empty-text">No buses yet</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



// ===================== ROUTES PAGE =====================
function RoutesPage({ routes, saveRoute, deleteRoute }) {
  const emptyForm = { 
  from: "", to: "", 
  boardingPoints: [], 
  droppingPoints: [], 
  distance: "", 
  status: "Active" 
};
  const [form,         setForm]         = useState(emptyForm);
  const [editing,      setEditing]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder,    setSortOrder]    = useState("latest");

  const filtered = useMemo(() => {
    let list = [...routes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.from || "").toLowerCase().includes(q) ||
        (r.to || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(r => (r.status || "Active") === statusFilter);
    list.sort((a, b) => sortOrder === "latest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    return list;
  }, [routes, search, statusFilter, sortOrder]);

  function submit() {
    if (!form.from || !form.to) { alert("From and To are required!"); return; }
    saveRoute(
      { ...form, name: form.from + " to " + form.to },
      editing ? (editing._id || editing.id) : null
    );
    setForm(emptyForm); setEditing(null);
  }

  function addPoint(field, val) {
    if (!val) return;
    const pt = MASTER_POINTS.find(p => p.mr === val) || { mr: val, en: val };
    if (!form[field].some(p => (p.mr || p) === pt.mr))
      setForm(f => ({ ...f, [field]: [...f[field], pt] }));
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Routes</h1><p>Manage all routes</p></div>
      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Route" : "➕ Add Route"}</div>
        <div className="form-grid">
          <Input label="From *" value={form.from} onChange={v => setForm(f => ({ ...f, from: v }))} placeholder="Pune" />
          <Input label="To *"   value={form.to}   onChange={v => setForm(f => ({ ...f, to: v }))}   placeholder="Kolhapur" />
          {["boardingPoints","droppingPoints"].map(field => (
            <div key={field} className="form-group">
              <label className="form-label">
                {field === "boardingPoints" ? "Boarding Points" : "Dropping Points"}
              </label>
              <select className="form-select" value=""
                onChange={e => addPoint(field, e.target.value)}>
                <option value="">+ Add point</option>
                {MASTER_POINTS.map((item, i) => (
                  <option key={i} value={item.mr}>{pointLabel(item)}</option>
                ))}
              </select>
              <div className="chip-wrap">
                {form[field].map((item, i) => (
                  <span key={i} className="chip">
                    {pointLabel(item)}
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, [field]: f[field].filter((_, j) => j !== i) }))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <Input label="Distance (km)" value={form.distance}
            onChange={v => setForm(f => ({ ...f, distance: v }))} type="number" />
          <Select label="Status" value={form.status}
            onChange={v => setForm(f => ({ ...f, status: v }))} options={["Active","Inactive"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>{editing ? "Update Route" : "Add Route"}</button>
          {editing && (
            <button className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch} searchPlaceholder="Search route"
        filterValue={statusFilter} setFilterValue={setStatusFilter} filterOptions={["All","Active","Inactive"]}
        sortOrder={sortOrder} setSortOrder={setSortOrder} />

      <div className="section-card">
        <div className="section-title">Route List ({filtered.length})</div>
        <table className="data-table">
          <thead>
            <tr><th>Route Name</th><th>From</th><th>To</th><th>Distance</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(r => (
              <tr key={r._id || r.id}>
                <td><b>{r.name || `${r.from} to ${r.to}`}</b></td>
                <td>{r.from || "—"}</td>
                <td>{r.to || "—"}</td>
                <td>{r.distance ? r.distance + " km" : "—"}</td>
                <td>{statusBadge(r.status || "Active")}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-sm btn-edit" onClick={() => {
                      setEditing(r);
                      setForm({
                        from: r.from || "", to: r.to || "",
                        boardingPoints: r.boardingPoints || [],
                        droppingPoints: r.droppingPoints || [],
                        distance: r.distance || "", status: r.status || "Active",
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>Edit</button>
                    <button className="btn-sm btn-del"
                      onClick={() => { if (window.confirm("Delete this route?")) deleteRoute(r._id || r.id); }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6">
                <div className="empty-state"><div className="empty-icon">📍</div><div className="empty-text">No routes yet</div></div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== CUSTOMERS PAGE =====================
function CustomersPage({ customers, saveCustomer, deleteCustomer, bookings }) {
  const emptyForm = { name: "", phone: "",  status: "Active" };
  const [form,         setForm]         = useState(emptyForm);
  const [editing,      setEditing]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder,    setSortOrder]    = useState("latest");
  const [viewCustomer, setViewCustomer] = useState(null); // ← NEW

  const filtered = useMemo(() => {
    let list = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || c.fullName || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(c => (c.status || "Active") === statusFilter);
    list.sort((a, b) => sortOrder === "latest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    return list;
  }, [customers, search, statusFilter, sortOrder]);

 function getBookingCount(customer) {
  return getCustomerBookings(customer).length || customer.totalBookings || 0;
}

 function getCustomerBookings(customer) {
  const ph = String(customer.phone || "").trim();
  const name = String(customer.name || customer.fullName || "").trim().toLowerCase();
  return bookings.filter(b => {
    const bPhone = String(b.phone || b.mobile || "").trim();
    const bName = String(b.passengerName || b.customerName || "").trim().toLowerCase();
    return (ph && bPhone === ph) || (name && bName === name);
  });
}

  function submit() {
    if (!form.name || !form.phone) { alert("Name and phone are required!"); return; }
    saveCustomer(
      { name: form.name, phone: form.phone, city: form.city, status: form.status },
      editing ? (editing._id || editing.id) : null
    );
    setForm(emptyForm); setEditing(null);
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Customers</h1><p>Total: {customers.length}</p></div>
      <div className="form-card">
        <div className="form-title">{editing ? "✏️ Edit Customer" : "➕ Add Customer"}</div>
        <div className="form-grid">
          <Input label="Name *"  value={form.name}  onChange={v => setForm(f => ({ ...f, name: v }))}  placeholder="Full name" />
          <Input label="Phone *" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Mobile number" />
          <Input label="City"    value={form.city}  onChange={v => setForm(f => ({ ...f, city: v }))}  placeholder="City" />
          <Select label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["Active","Inactive"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>{editing ? "Update Customer" : "Add Customer"}</button>
          {editing && (
            <button className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch} searchPlaceholder="Search name / phone / email"
        filterValue={statusFilter} setFilterValue={setStatusFilter} filterOptions={["All","Active","Inactive"]}
        sortOrder={sortOrder} setSortOrder={setSortOrder} />

      <div className="section-card">
        <div className="section-title">Customer List ({filtered.length})</div>

        {/* ── DESKTOP TABLE ── */}
        <div style={{ overflowX: "auto" }} className="desktop-only">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Status</th><th>Bookings</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(c => (
                <tr key={c._id || c.id}>
                  <td>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: 14, padding: 0, textAlign: "left" }}
                      onClick={() => setViewCustomer(c)}
                    >
                      {c.name || c.fullName || "—"}
                    </button>
                  </td>
                  <td>{statusBadge(c.status || "Active")}</td>
                  <td><span className="badge badge-blue">{getBookingCount(c)}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-edit" onClick={() => {
                        setEditing(c);
                        setForm({ name: c.name || c.fullName || "", phone: c.phone || "", city: c.city || "", status: c.status || "Active" });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>Edit</button>
                      <button className="btn-sm btn-del"
                        onClick={() => { if (window.confirm("Delete this customer?")) deleteCustomer(c._id || c.id); }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4">
                  <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-text">No customers yet</div></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── MOBILE CARDS ── */}
        <div className="mobile-cards">
          {filtered.length ? filtered.map(c => (
            <div key={c._id || c.id} className="customer-card">
              <div className="card-top">
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: 15, padding: 0, textAlign: "left" }}
                  onClick={() => setViewCustomer(c)}
                >
                  {c.name || c.fullName || "—"}
                </button>
                {statusBadge(c.status || "Active")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", margin: "4px 0 6px" }}>
  {c.phone || ""}
</div>
              <div className="card-meta">
                <span className="badge badge-blue">{getBookingCount(c)} Bookings</span>
                <div className="card-actions">
                  <button className="btn-sm btn-edit" onClick={() => {
                    setEditing(c);
                    setForm({ name: c.name || c.fullName || "", phone: c.phone || "", city: c.city || "", status: c.status || "Active" });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>Edit</button>
                  <button className="btn-sm btn-del"
                    onClick={() => { if (window.confirm("Delete this customer?")) deleteCustomer(c._id || c.id); }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-text">No customers yet</div></div>
          )}
        </div>
      </div>

      {/* ── CUSTOMER DETAIL MODAL ── */}
      {viewCustomer && (
        <CustomerDetailModal
          customer={viewCustomer}
          bookings={getCustomerBookings(viewCustomer)}
          onClose={() => setViewCustomer(null)}
          onEdit={() => {
            setEditing(viewCustomer);
            setForm({ name: viewCustomer.name || viewCustomer.fullName || "", phone: viewCustomer.phone || "", city: viewCustomer.city || "", status: viewCustomer.status || "Active" });
            setViewCustomer(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={() => {
            if (window.confirm("Delete this customer?")) {
              deleteCustomer(viewCustomer._id || viewCustomer.id);
              setViewCustomer(null);
            }
          }}
        />
      )}
    </div>
  );
}
function CustomerDetailModal({ customer, bookings, onClose, onEdit, onDelete }) {
  const paidBookings = bookings.filter(b => b.paymentStatus === "Paid");
  const totalSpent = paidBookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const lastBooking = bookings[0];

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 600 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif" }}>👤 Customer Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 16px", background: "var(--bg3)", borderRadius: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "white", fontSize: 20, fontFamily: "'Syne', sans-serif"
          }}>
            {(customer.name || customer.fullName || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, fontFamily: "'Syne', sans-serif" }}>
              {customer.name || customer.fullName || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
             
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>{statusBadge(customer.status || "Active")}</div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "🎫", label: "Total Trips", val: bookings.length },
            { icon: "✅", label: "Paid", val: paidBookings.length },
            { icon: "💰", label: "Total Spent", val: "₹" + totalSpent.toLocaleString() },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Info Rows */}
        <div className="seat-popup-grid" style={{ marginBottom: 16 }}>
          {[
            ["📱 Phone",   customer.phone || "—"],
            ["📧 Email",   customer.email || "—"],
           
            ["📅 Joined",  customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"],
            ["🕐 Last Booking", lastBooking ? (lastBooking.journeyDate || lastBooking.date || "—") : "No bookings yet"],
            ["🛣️ Last Route", lastBooking ? `${lastBooking.boardingPoint || "—"} → ${lastBooking.droppingPoint || "—"}` : "—"],
          ].map(([label, val]) => (
            <div key={label} className="popup-row">
              <span className="popup-label">{label}</span>
              <span className="popup-val" style={{ fontSize: 13, maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        {bookings.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Recent Bookings ({bookings.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {bookings.slice(0, 10).map((b, i) => (
                <div key={b._id || i} style={{
                  background: "var(--bg3)", borderRadius: 8, padding: "10px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap"
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 3 }}>
                      Seat: <b>{b.seatNo || "—"}</b> &nbsp;|&nbsp; {b.journeyDate || b.date || "—"} &nbsp;|&nbsp; {b.busNo || b.bus || "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>₹{Number(b.amount || 0).toLocaleString()}</span>
                    {statusBadge(b.paymentStatus || "Pending")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>
            🎫 No bookings found for this customer
          </div>
        )}

        <div className="form-actions">
          <button className="btn-primary" onClick={onEdit}>✏️ Edit</button>
          <button className="btn-sm btn-del" style={{ padding: "9px 16px", fontSize: 13 }} onClick={onDelete}>🗑️ Delete</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ===================== REPORTS PAGE =====================



// ─── PDF GENERATOR (paste OUTSIDE ReportsPage, at module level) ───────────

 
// ── Helper: extract number plate from bus name ──
// e.g. "MH12AB1234 SHAHAJI 2*1 AC BUS" → "MH12AB1234"
// Falls back to full name if no plate pattern found
function extractBusPlate(busStr) {
  if (!busStr) return "—";

  // STRICT Indian plate match
  const match = busStr.match(/[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}/i);

  return match ? match[0].toUpperCase() : "—"; // ❌ fallback name काढलं
}

// ─── SHARED HELPER ───────────────────────────────────────────────────────────
function getBusDisplay(busName, busList) {
  if (!busName || busName === "—") return "—";
  const found = (busList || []).find(b => {
    const bName = (b.name || "").toLowerCase().trim();
    const bNum  = (b.number || b.busNumber || b.numberPlate || "").toLowerCase().trim();
    const search = (busName || "").toLowerCase().trim();
    return bName === search || bNum === search ||
           bName.includes(search) || search.includes(bName);
  });
  if (found) {
    const plate = found.number || found.busNumber || found.numberPlate || "";
    const name  = found.name || "";
    return plate ? (plate + (name ? " / " + name : "")) : (name || busName);
  }
  return busName;
}

// ─── SHARED PDF HELPERS ───────────────────────────────────────────────────────
function pdfTh(txt) {
  return `<th style="padding:9px 12px;background:#f1f5f9;color:#374151;font-size:11px;
    text-transform:uppercase;letter-spacing:.06em;font-weight:700;text-align:left;
    border-bottom:2px solid #e63946;">${txt}</th>`;
}
function pdfTd(txt, bold) {
  return `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;
    color:${bold ? "#111827" : "#374151"};font-weight:${bold ? "700" : "400"};">${txt ?? "—"}</td>`;
}
function pdfBadge(status) {
  const map = {
    Paid:      ["#d1fae5","#065f46"],
    Confirmed: ["#d1fae5","#065f46"],
    Pending:   ["#fef3c7","#92400e"],
    Failed:    ["#fee2e2","#991b1b"],
    Refunded:  ["#fee2e2","#991b1b"],
    Cancelled: ["#ede9fe","#4c1d95"],
  };
  const [bg, color] = map[status] || ["#f1f5f9","#374151"];
  return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${status || "—"}</span>`;
}
function pdfSectionTitle(icon, txt) {
  return `<div style="font-family:'Segoe UI',sans-serif;font-size:16px;font-weight:800;
    color:#111827;margin:28px 0 12px;padding-bottom:8px;
    border-bottom:2px solid #e63946;">${icon} ${txt}</div>`;
}
function pdfStatBox(icon, label, val, color) {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
    padding:16px 14px;text-align:center;min-width:110px;flex:1;">
    <div style="font-size:22px;margin-bottom:6px;">${icon}</div>
    <div style="font-size:20px;font-weight:800;color:${color};font-family:'Segoe UI',sans-serif;">${val}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:.05em;">${label}</div>
  </div>`;
}
function pdfCommonStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; color: #111827; padding: 70px 36px 40px; max-width: 1100px; margin: auto; }
    table { border-collapse: collapse; width: 100%; }
    .no-print { display: flex; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      body { padding: 10px 20px; }
    }
    @media (max-width: 768px) {
      body { padding: 70px 12px 20px; }
      table { font-size: 11px; }
    }
  `;
}
function pdfTopBar(title) {
  return `
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:999;
    background:white;padding:10px 16px;border-bottom:2px solid #e63946;
    display:flex;gap:10px;align-items:center;justify-content:space-between;
    box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <span style="font-weight:800;color:#111827;font-size:15px;">🚌 ${title}</span>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()"
        style="background:linear-gradient(135deg,#e63946,#c1121f);color:white;border:none;
          padding:10px 20px;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;">
        🖨️ Print / PDF
      </button>
      <button onclick="window.close()"
        style="background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;
          padding:10px 16px;border-radius:8px;font-size:14px;cursor:pointer;">
        ✕
      </button>
    </div>
  </div>`;
}
function pdfOpenWindow(html) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}

// ─── BUILD DAILY SECTION (shared by Full + DateRange PDF) ────────────────────
function buildDailySection(days, busList) {
  let out = "";
  days.forEach((day) => {
    const dateLabel = new Date(day.date).toLocaleDateString("en-IN", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
    const busesStr = Object.entries(day.buses || {})
      .map(([b, c]) => `${getBusDisplay(b, busList)} (${c})`)
      .join(", ") || "—";

    const bookingRows = day.bookings.length
      ? day.bookings.map((b) => `<tr>
          ${pdfTd(b.bookingCode || "—", true)}
          ${pdfTd(b.passengerName || "—", true)}
          ${pdfTd(b.phone || "—")}
          ${pdfTd(b.seatNo || "—")}
          ${pdfTd(b.boardingPoint || "—")}
          ${pdfTd(b.droppingPoint || "—")}
          ${pdfTd(getBusDisplay(b.busNo || b.bus, busList), true)}
          ${pdfTd("₹" + Number(b.amount || 0).toLocaleString(), true)}
          ${pdfTd(b.paymentMode || "—")}
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${pdfBadge(b.paymentStatus)}</td>
        </tr>`).join("")
      : `<tr><td colspan="10" style="padding:20px;text-align:center;color:#6b7280;">No bookings</td></tr>`;

    out += `
    <div style="margin-bottom:24px;">
      <div style="background:linear-gradient(135deg,#b91c1c,#dc2626);
        border-radius:10px;padding:14px 18px;margin-bottom:10px;
        display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="color:rgba(255,255,255,.8);font-size:11px;">Journey Date</div>
          <div style="color:white;font-weight:800;font-size:16px;font-family:'Segoe UI',sans-serif;">${dateLabel}</div>
        </div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;">
          <div style="text-align:center;">
            <div style="color:white;font-weight:800;font-size:18px;">${day.bookings.length}</div>
            <div style="color:rgba(255,255,255,.75);font-size:10px;">Bookings</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#bbf7d0;font-weight:800;font-size:18px;">₹${day.revenue.toLocaleString()}</div>
            <div style="color:rgba(255,255,255,.75);font-size:10px;">Revenue</div>
          </div>
          <div style="text-align:center;">
            <div style="color:white;font-weight:800;font-size:13px;">${day.paid} Paid / ${day.pending} Pending / ${day.cancelled} Cancel</div>
            <div style="color:rgba(255,255,255,.75);font-size:10px;">Status</div>
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:#374151;margin-bottom:8px;">🚌 Buses: ${busesStr}</div>
      <div style="overflow-x:auto;">
        <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;min-width:700px;">
          <thead>
            <tr>
              ${pdfTh("Booking ID")}${pdfTh("Passenger")}${pdfTh("Phone")}${pdfTh("Seat")}
              ${pdfTh("Boarding")}${pdfTh("Dropping")}${pdfTh("Bus No")}${pdfTh("Amount")}
              ${pdfTh("Pay Mode")}${pdfTh("Status")}
            </tr>
          </thead>
          <tbody>${bookingRows}</tbody>
        </table>
      </div>
    </div>`;
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. FULL REPORT PDF
// ═══════════════════════════════════════════════════════════════════════════════
function generateReportPDF(reportStats, activeTab, selectedDate) {
  const busList = reportStats._buses || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const totalBookings = (reportStats.paidCount || 0) + (reportStats.pendingCount || 0) + (reportStats.cancelledCount || 0);
  const avgTicket = reportStats.paidCount ? Math.round(reportStats.totalRevenue / reportStats.paidCount) : 0;
  const paidPct = totalBookings ? Math.round((reportStats.paidCount / totalBookings) * 100) : 0;

  const days = [...(reportStats.dailyData || [])].sort((a, b) => b.date.localeCompare(a.date));
  const dailySection = buildDailySection(days, busList);

  const monthRows = (reportStats.monthlyRevenue || []).map((r) => {
    const maxAmt = Math.max(...(reportStats.monthlyRevenue || []).map(x => x.amount), 1);
    return `<tr>
      ${pdfTd(r.month, true)}
      ${pdfTd("₹" + Number(r.amount).toLocaleString(), true)}
      ${pdfTd(`<div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
        <div style="height:8px;background:#16a34a;border-radius:4px;width:${Math.round((r.amount/maxAmt)*100)}%;"></div>
      </div>`)}
    </tr>`;
  }).join("") || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#6b7280;">No data</td></tr>`;

  const routeRows = (reportStats.topRoutes || []).slice(0, 20).map((r, i) => `<tr>
    ${pdfTd(`#${i+1}`, true)}
    ${pdfTd(r.route, true)}
    ${pdfTd(r.count + " bookings")}
  </tr>`).join("") || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#6b7280;">No data</td></tr>`;

  const total = (reportStats.paymentSummary || []).reduce((s, r) => s + r.count, 0);
  const payRows = (reportStats.paymentSummary || []).map((r) => `<tr>
    ${pdfTd(r.mode, true)}
    ${pdfTd(r.count)}
    ${pdfTd(total ? Math.round((r.count/total)*100)+"%" : "0%")}
  </tr>`).join("") || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#6b7280;">No data</td></tr>`;

  const busRows = (reportStats.busPerformance || []).slice(0, 20).map((r) => `<tr>
    ${pdfTd(getBusDisplay(r.bus, busList), true)}
    ${pdfTd(r.count + " bookings")}
  </tr>`).join("") || `<tr><td colspan="2" style="padding:20px;text-align:center;color:#6b7280;">No data</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Shahaji Travels — Full Report</title>
  <style>${pdfCommonStyles()}</style>
</head>
<body>
  ${pdfTopBar("Shahaji Travels — Full Report")}

  <div style="display:flex;justify-content:space-between;align-items:flex-start;
    margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e63946;">
    <div>
      <div style="font-size:36px;margin-bottom:6px;">🚌</div>
      <div style="font-size:28px;font-weight:900;color:#111827;letter-spacing:-.5px;">Shahaji Travels</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">Complete Business Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#6b7280;">Generated on</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${today}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">Total Bookings</div>
      <div style="font-size:22px;font-weight:900;color:#e63946;">${totalBookings}</div>
    </div>
  </div>

  ${pdfSectionTitle("📊", "Overview Summary")}
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
    ${pdfStatBox("💰","Total Revenue","₹"+(reportStats.totalRevenue||0).toLocaleString(),"#16a34a")}
    ${pdfStatBox("✅","Paid",reportStats.paidCount||0,"#15803d")}
    ${pdfStatBox("⏳","Pending",reportStats.pendingCount||0,"#d97706")}
    ${pdfStatBox("❌","Cancelled",reportStats.cancelledCount||0,"#dc2626")}
    ${pdfStatBox("🎯","Avg Ticket","₹"+avgTicket.toLocaleString(),"#2563eb")}
    ${pdfStatBox("📈","Success Rate",paidPct+"%","#7c3aed")}
    ${pdfStatBox("👥","Customers",reportStats.totalCustomers||0,"#0d9488")}
    ${pdfStatBox("🗺️","Trips",reportStats.totalTrips||0,"#ea580c")}
  </div>

  ${pdfSectionTitle("📅","Monthly Revenue")}
  <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr>${pdfTh("Month")}${pdfTh("Revenue")}${pdfTh("Bar Chart")}</tr></thead>
    <tbody>${monthRows}</tbody>
  </table>

  ${pdfSectionTitle("📆","Date-wise Booking Details (All Dates)")}
  ${dailySection || `<div style="padding:20px;text-align:center;color:#6b7280;">No booking data available</div>`}

  <div class="page-break"></div>
  ${pdfSectionTitle("🛣️","Top Routes by Bookings")}
  <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr>${pdfTh("Rank")}${pdfTh("Route")}${pdfTh("Bookings")}</tr></thead>
    <tbody>${routeRows}</tbody>
  </table>

  ${pdfSectionTitle("💳","Payment Mode Summary")}
  <table style="width:60%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr>${pdfTh("Mode")}${pdfTh("Count")}${pdfTh("Percentage")}</tr></thead>
    <tbody>${payRows}</tbody>
  </table>

  ${pdfSectionTitle("🚌","Bus Performance")}
  <table style="width:60%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr>${pdfTh("Bus No / Name")}${pdfTh("Bookings")}</tr></thead>
    <tbody>${busRows}</tbody>
  </table>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;
    text-align:center;color:#9ca3af;font-size:12px;">
    Shahaji Travels Admin Panel — Report generated ${today} &nbsp;|&nbsp; Confidential
  </div>
</body>
</html>`;

  pdfOpenWindow(html);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DATE RANGE PDF
// ═══════════════════════════════════════════════════════════════════════════════
function generateDateRangePDF(reportStats, fromDate, toDate) {
  const busList = reportStats._buses || [];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const fromLabel = new Date(fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const toLabel   = new Date(toDate).toLocaleDateString("en-IN",   { day: "2-digit", month: "long", year: "numeric" });

  const filtered = [...(reportStats.dailyData || [])]
    .filter((d) => {
      const dDate = new Date(d.date).toISOString().slice(0, 10);
      return dDate >= fromDate && dDate <= toDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  let totalRev = 0, totalPaid = 0, totalPending = 0, totalCancelled = 0;
  filtered.forEach((d) => {
    totalRev       += d.revenue   || 0;
    totalPaid      += d.paid      || 0;
    totalPending   += d.pending   || 0;
    totalCancelled += d.cancelled || 0;
  });
  const totalBookings = totalPaid + totalPending + totalCancelled;
  const avgTicket = totalPaid ? Math.round(totalRev / totalPaid) : 0;
  const paidPct   = totalBookings ? Math.round((totalPaid / totalBookings) * 100) : 0;

  const dailySection = buildDailySection(filtered, busList);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Shahaji Travels — Date Range Report</title>
  <style>${pdfCommonStyles()}</style>
</head>
<body>
  ${pdfTopBar("Shahaji Travels — Date Range Report")}

  <div style="display:flex;justify-content:space-between;align-items:flex-start;
    margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e63946;">
    <div>
      <div style="font-size:36px;margin-bottom:6px;">🚌</div>
      <div style="font-size:28px;font-weight:900;color:#111827;letter-spacing:-.5px;">Shahaji Travels</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">Date Range Report</div>
      <div style="margin-top:8px;background:#fef2f2;border:1px solid #fecaca;
        border-radius:8px;padding:6px 14px;display:inline-block;">
        <span style="color:#e63946;font-weight:700;font-size:13px;">📅 ${fromLabel} → ${toLabel}</span>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#6b7280;">Generated on</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${today}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">Total Bookings</div>
      <div style="font-size:22px;font-weight:900;color:#e63946;">${totalBookings}</div>
    </div>
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">
    ${[
      ["💰","Revenue","₹"+totalRev.toLocaleString(),"#16a34a"],
      ["✅","Paid",totalPaid,"#15803d"],
      ["⏳","Pending",totalPending,"#d97706"],
      ["❌","Cancelled",totalCancelled,"#dc2626"],
      ["🎯","Avg Ticket","₹"+avgTicket.toLocaleString(),"#2563eb"],
      ["📈","Success",paidPct+"%","#7c3aed"],
    ].map(([icon,label,val,color]) =>
      `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
        padding:16px 14px;text-align:center;min-width:110px;flex:1;">
        <div style="font-size:22px;margin-bottom:6px;">${icon}</div>
        <div style="font-size:20px;font-weight:800;color:${color};">${val}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;">${label}</div>
      </div>`
    ).join("")}
  </div>

  <div style="font-size:16px;font-weight:800;color:#111827;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #e63946;">
    📆 Date-wise Booking Details (${filtered.length} date${filtered.length !== 1 ? "s" : ""})
  </div>
  ${dailySection || `<div style="padding:20px;text-align:center;color:#6b7280;">No booking data for this date range</div>`}

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;
    text-align:center;color:#9ca3af;font-size:12px;">
    Shahaji Travels — ${fromLabel} to ${toLabel} &nbsp;|&nbsp; Generated ${today} &nbsp;|&nbsp; Confidential
  </div>
</body>
</html>`;

  pdfOpenWindow(html);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SINGLE DATE PDF
// ═══════════════════════════════════════════════════════════════════════════════
function generateSingleDatePDF(dayData, busList) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const dateLabel = new Date(dayData.date).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const busesStr = Object.entries(dayData.buses || {})
    .map(([b, c]) => `${getBusDisplay(b, busList)} (${c})`)
    .join(", ") || "—";

  const routeMap = {};
  dayData.bookings.forEach((b) => {
    const key = (b.boardingPoint || "?") + " → " + (b.droppingPoint || "?");
    routeMap[key] = (routeMap[key] || 0) + 1;
  });
  const routeRows = Object.entries(routeMap).sort((a,b)=>b[1]-a[1])
    .map(([route, count]) => `<tr>${pdfTd(route, true)}${pdfTd(count+" bookings")}</tr>`)
    .join("") || `<tr><td colspan="2" style="padding:16px;text-align:center;color:#6b7280;">No routes</td></tr>`;

  const pmMap = {};
  dayData.bookings.forEach((b) => { const m = b.paymentMode || "Unknown"; pmMap[m] = (pmMap[m]||0)+1; });
  const pmRows = Object.entries(pmMap)
    .map(([mode, count]) => `<tr>${pdfTd(mode,true)}${pdfTd(count)}</tr>`)
    .join("") || `<tr><td colspan="2" style="padding:16px;text-align:center;color:#6b7280;">No data</td></tr>`;

  const avgTicket = dayData.paid ? Math.round(dayData.revenue / dayData.paid) : 0;

  const bookingRows = dayData.bookings.length
    ? dayData.bookings.map((b) => `<tr>
        ${pdfTd(b.bookingCode || "—", true)}
        ${pdfTd(b.passengerName || "—", true)}
        ${pdfTd(b.phone || "—")}
        ${pdfTd(b.seatNo || "—")}
        ${pdfTd(b.boardingPoint || "—")}
        ${pdfTd(b.droppingPoint || "—")}
        ${pdfTd(getBusDisplay(b.busNo || b.bus, busList), true)}
        ${pdfTd("₹"+Number(b.amount||0).toLocaleString(), true)}
        ${pdfTd(b.paymentMode || "—")}
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${pdfBadge(b.paymentStatus)}</td>
      </tr>`).join("")
    : `<tr><td colspan="10" style="padding:20px;text-align:center;color:#6b7280;">No bookings</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Shahaji Travels — ${dayData.date}</title>
  <style>${pdfCommonStyles()}</style>
</head>
<body>
  ${pdfTopBar("Shahaji Travels — " + dateLabel)}

  <div style="display:flex;justify-content:space-between;align-items:flex-start;
    margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e63946;">
    <div>
      <div style="font-size:36px;margin-bottom:6px;">🚌</div>
      <div style="font-size:28px;font-weight:900;color:#111827;letter-spacing:-.5px;">Shahaji Travels</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">Daily Booking Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#6b7280;">Journey Date</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${dateLabel}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">Generated on</div>
      <div style="font-size:13px;color:#374151;">${today}</div>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#b91c1c,#dc2626);border-radius:14px;
    padding:20px 24px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
    ${[
      ["Bookings", dayData.bookings.length, "white"],
      ["Revenue",  "₹"+dayData.revenue.toLocaleString(), "#bbf7d0"],
      ["Paid",     dayData.paid, "white"],
      ["Pending",  dayData.pending, "#fde68a"],
      ["Cancelled",dayData.cancelled, "#fca5a5"],
      ["Avg Ticket","₹"+avgTicket.toLocaleString(), "#bfdbfe"],
    ].map(([label,val,color]) =>
      `<div style="text-align:center;">
        <div style="font-weight:800;font-size:20px;color:${color};">${val}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.7);margin-top:3px;">${label}</div>
      </div>`
    ).join("")}
  </div>

  <div style="font-size:13px;color:#374151;margin-bottom:20px;">
    🚌 <b style="color:#2563eb;">Buses on this date:</b> ${busesStr}
  </div>

  <div style="font-size:16px;font-weight:800;color:#111827;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e63946;">
    🎫 All Bookings — ${dayData.date}
  </div>
  <div style="overflow-x:auto;margin-bottom:28px;">
    <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;min-width:700px;">
      <thead>
        <tr>
          ${pdfTh("Booking ID")}${pdfTh("Passenger")}${pdfTh("Phone")}${pdfTh("Seat")}
          ${pdfTh("Boarding")}${pdfTh("Dropping")}${pdfTh("Bus No")}${pdfTh("Amount")}
          ${pdfTh("Pay Mode")}${pdfTh("Status")}
        </tr>
      </thead>
      <tbody>${bookingRows}</tbody>
    </table>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">
    <div>
      <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;">🛣️ Routes</div>
      <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead><tr>${pdfTh("Route")}${pdfTh("Count")}</tr></thead>
        <tbody>${routeRows}</tbody>
      </table>
    </div>
    <div>
      <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;">💳 Payment Modes</div>
      <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead><tr>${pdfTh("Mode")}${pdfTh("Count")}</tr></thead>
        <tbody>${pmRows}</tbody>
      </table>
    </div>
  </div>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;
    text-align:center;color:#9ca3af;font-size:12px;">
    Shahaji Travels — ${dateLabel} &nbsp;|&nbsp; Generated ${today} &nbsp;|&nbsp; Confidential
  </div>
</body>
</html>`;

  pdfOpenWindow(html);
}
 
// ─── REPORTS PAGE ──────────────────────────────────────────────────────────
function ReportsPage({ reportStats }) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [yearFilter, setYearFilter] = React.useState("All");
  const [monthFilter, setMonthFilter] = React.useState("All");
 
  // ── NEW: date-range state for PDF ──
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate]     = React.useState("");
 
  const allDates = React.useMemo(
    () => (reportStats.dailyData || []).map((d) => d.date),
    [reportStats.dailyData]
  );
 
  const availableYears = React.useMemo(() => {
    const yrs = [...new Set(allDates.map((d) => d.slice(0, 4)))].sort().reverse();
    return yrs;
  }, [allDates]);
 
  const availableMonths = React.useMemo(() => {
    const filtered =
      yearFilter === "All" ? allDates : allDates.filter((d) => d.startsWith(yearFilter));
    const months = [
      ...new Set(
        filtered.map((d) => {
          const dt = new Date(d);
          return dt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        })
      ),
    ];
    return months;
  }, [allDates, yearFilter]);
 
  const filteredDaily = React.useMemo(() => {
    let list = [...(reportStats.dailyData || [])];
    if (yearFilter !== "All") list = list.filter((d) => d.date.startsWith(yearFilter));
    if (monthFilter !== "All") {
      list = list.filter((d) => {
        const dt = new Date(d.date);
        return (
          dt.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) === monthFilter
        );
      });
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportStats.dailyData, yearFilter, monthFilter]);
 
  const filteredMonthly = React.useMemo(() => {
    let list = [...(reportStats.monthlyRevenue || [])];
    if (yearFilter !== "All")
      list = list.filter((r) => r.month.includes(yearFilter));
    return list;
  }, [reportStats.monthlyRevenue, yearFilter]);
 
  const totalBookings =
    (reportStats.paidCount || 0) +
    (reportStats.pendingCount || 0) +
    (reportStats.cancelledCount || 0);
  const paidPct = totalBookings ? Math.round((reportStats.paidCount / totalBookings) * 100) : 0;
  const avgTicket = reportStats.paidCount
    ? Math.round(reportStats.totalRevenue / reportStats.paidCount)
    : 0;
  const topRoute = reportStats.topRoutes?.[0];
  const topBus = reportStats.busPerformance?.[0];
 
  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "daily",    label: "📅 Daily"    },
    { key: "monthly",  label: "📆 Monthly"  },
    { key: "routes",   label: "🛣️ Routes"   },
    { key: "payments", label: "💳 Payments" },
    { key: "buses",    label: "🚌 Buses"    },
  ];
 
  const tabStyle = (key) => ({
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: activeTab === key ? "none" : "1px solid rgba(255,255,255,0.1)",
    background:
      activeTab === key
        ? "linear-gradient(135deg,#e63946,#c1121f)"
        : "rgba(255,255,255,0.04)",
    color: activeTab === key ? "white" : "#8892a4",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });
 
  const FilterBar = () => (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        padding: "12px 16px",
        background: "var(--bg3)",
        borderRadius: 10,
        border: "1px solid var(--border)",
        marginBottom: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>FILTER:</span>
      <select
        className="form-select"
        style={{ width: "auto", fontSize: 13 }}
        value={yearFilter}
        onChange={(e) => { setYearFilter(e.target.value); setMonthFilter("All"); setSelectedDate(null); }}
      >
        <option value="All">All Years</option>
        {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        className="form-select"
        style={{ width: "auto", fontSize: 13 }}
        value={monthFilter}
        onChange={(e) => { setMonthFilter(e.target.value); setSelectedDate(null); }}
      >
        <option value="All">All Months</option>
        {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      {(yearFilter !== "All" || monthFilter !== "All") && (
        <button
          className="btn-secondary"
          style={{ padding: "6px 12px", fontSize: 12 }}
          onClick={() => { setYearFilter("All"); setMonthFilter("All"); setSelectedDate(null); }}
        >
          ✕ Clear
        </button>
      )}
      <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text2)" }}>
        {filteredDaily.length} date(s) &nbsp;·&nbsp;
        {filteredDaily.reduce((s, d) => s + d.bookings.length, 0)} bookings
      </span>
    </div>
  );
 
  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div className="page-header">
          <h1>Reports & Analytics</h1>
          <p>Complete business performance overview</p>
        </div>
 
        {/* ── PDF BUTTONS AREA ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
 
          {/* Date-range PDF inputs + button */}
          <div style={{
            display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 12px",
          }}>
            <span style={{ fontSize: 11, color: "#8892a4", fontWeight: 700, whiteSpace: "nowrap" }}>DATE RANGE:</span>
            <input
              type="date"
              className="form-select"
              style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span style={{ fontSize: 12, color: "#8892a4" }}>to</span>
            <input
              type="date"
              className="form-select"
              style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              onClick={() => {
                if (!fromDate || !toDate) { alert("Please select both From and To dates."); return; }
                if (fromDate > toDate) { alert("From date must be before To date."); return; }
                generateDateRangePDF(reportStats, fromDate, toDate);
              }}
            >
              📄 Range PDF
            </button>
          </div>
 
          {/* Full report PDF */}
          <button
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
onClick={() => generateReportPDF(reportStats, activeTab, selectedDate, reportStats._buses || [])}
>
            📄 Full PDF Report
          </button>
        </div>
      </div>
 
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSelectedDate(null); }}
            style={tabStyle(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
 
      {/* ═══════════════ OVERVIEW ═══════════════ */}
      {activeTab === "overview" && (
        <>
          <div className="stats-grid">
            <StatCard icon="💰" label="Total Revenue"  value={"₹" + (reportStats.totalRevenue || 0).toLocaleString()} color="green"   />
            <StatCard icon="🎫" label="Total Bookings" value={totalBookings}               color="blue"    />
            <StatCard icon="✅" label="Paid"           value={reportStats.paidCount}       color="emerald" />
            <StatCard icon="⏳" label="Pending"        value={reportStats.pendingCount}    color="yellow"  />
            <StatCard icon="❌" label="Cancelled"      value={reportStats.cancelledCount}  color="red"     />
            <StatCard icon="👥" label="Customers"      value={reportStats.totalCustomers}  color="purple"  />
            <StatCard icon="🗺️" label="Total Trips"   value={reportStats.totalTrips}      color="teal"    />
            <StatCard icon="🎯" label="Avg Ticket"     value={"₹" + avgTicket.toLocaleString()} color="orange" />
          </div>
 
          <div className="two-col-grid">
            <div className="section-card">
              <div className="section-title">📊 Booking Status</div>
              {[
                { label: "Paid",      count: reportStats.paidCount,      pct: paidPct, color: "#22c55e" },
                { label: "Pending",   count: reportStats.pendingCount,    pct: totalBookings ? Math.round(reportStats.pendingCount   / totalBookings * 100) : 0, color: "#f59e0b" },
                { label: "Cancelled", count: reportStats.cancelledCount,  pct: totalBookings ? Math.round(reportStats.cancelledCount / totalBookings * 100) : 0, color: "#ef4444" },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: "#8892a4" }}>{row.count} ({row.pct}%)</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: row.pct + "%", height: "100%", background: row.color, borderRadius: 6, transition: "width .6s" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, color: "#8892a4", marginBottom: 4 }}>Success Rate</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#22c55e", fontFamily: "'Syne',sans-serif" }}>{paidPct}%</div>
              </div>
            </div>
 
            <div className="section-card">
              <div className="section-title">🏆 Highlights</div>
              {[
                { icon: "🛣️", label: "Top Route",    val: topRoute?.route || "—",        sub: topRoute ? topRoute.count + " bookings" : "" },
                { icon: "🚌", label: "Top Bus",      val: topBus?.bus || "—",            sub: topBus   ? topBus.count   + " bookings" : "" },
                { icon: "🎯", label: "Avg Ticket",   val: "₹" + avgTicket.toLocaleString(), sub: "per paid booking" },
                { icon: "💰", label: "Total Revenue",val: "₹" + (reportStats.totalRevenue || 0).toLocaleString(), sub: "all time" },
                { icon: "📅", label: "Active Dates", val: (reportStats.dailyData || []).length, sub: "dates with bookings" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{row.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.val}</div>
                  </div>
                  {row.sub && <span style={{ fontSize: 11, color: "#8892a4", whiteSpace: "nowrap" }}>{row.sub}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
 
      {/* ═══════════════ DAILY ═══════════════ */}
      {activeTab === "daily" && (
        <>
          <FilterBar />
 
          {!selectedDate ? (
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div className="section-title" style={{ margin: 0 }}>📅 All Booking Dates — Click to view</div>
                <span style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: "#22c55e" }}>
                  {filteredDaily.length} dates
                </span>
              </div>
 
              {filteredDaily.length ? (
                filteredDaily.map((day, i) => {
                  const dt = new Date(day.date);
                  const dayName = dt.toLocaleDateString("en-IN", { weekday: "short" });
                  const dateDisplay = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                  const busCount = Object.keys(day.buses).length;
 
                  return (
                    <div
                      key={day.date}
                      onClick={() => setSelectedDate(day)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", borderBottom: i < filteredDaily.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "background 0.15s", borderRadius: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#e63946,#c1121f)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,.75)", textTransform: "uppercase" }}>{dayName}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{dt.getDate()}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,.75)" }}>{dt.toLocaleDateString("en-IN", { month: "short" })}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{dateDisplay}</div>
                        <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#8892a4" }}>🎫 {day.bookings.length} bookings</span>
                          <span style={{ fontSize: 12, color: "#8892a4" }}>🚌 {busCount} bus{busCount > 1 ? "es" : ""}</span>
                          <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>₹{day.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {day.paid > 0 && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ {day.paid}</span>}
                        {day.pending > 0 && <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⏳ {day.pending}</span>}
                        {day.cancelled > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✕ {day.cancelled}</span>}
                      </div>
                      <span style={{ color: "#8892a4", fontSize: 18 }}>›</span>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-text">No booking data for selected filter</div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Back + Individual Date PDF button ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <button className="btn-secondary" onClick={() => setSelectedDate(null)}>← Back to all dates</button>
                {/* NEW: Individual date PDF */}
                <button
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 14px" }}
                  onClick={() => generateSingleDatePDF(selectedDate)}
                >
                  📄 PDF — {selectedDate.date}
                </button>
              </div>
 
              {/* Day header */}
              <div style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)", borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, marginBottom: 4 }}>
                    {new Date(selectedDate.date).toLocaleDateString("en-IN", { weekday: "long" })}
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "white" }}>
                    {new Date(selectedDate.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {[
                    { label: "Bookings", val: selectedDate.bookings.length },
                    { label: "Revenue",  val: "₹" + selectedDate.revenue.toLocaleString() },
                    { label: "Paid",     val: selectedDate.paid },
                    { label: "Pending",  val: selectedDate.pending },
                    { label: "Cancelled",val: selectedDate.cancelled },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "white", fontFamily: "'Syne',sans-serif" }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Buses on this date */}
              <div className="section-card">
                <div className="section-title">🚌 Buses on this date</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Object.entries(selectedDate.buses).map(([bus, count]) => (
                    <div key={bus} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#60a5fa" }}>{bus}</div>
                      <div style={{ fontSize: 11, color: "#8892a4", marginTop: 3 }}>{count} booking{count > 1 ? "s" : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Full bookings table */}
              <div className="section-card">
                <div className="section-title">🎫 All Bookings — {selectedDate.date}</div>
                <div style={{ overflowX: "auto" }} className="desktop-only">
                  <table className="data-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Booking ID</th><th>Passenger</th><th>Phone</th><th>Seat</th>
                        <th>Boarding</th><th>Dropping</th><th>Bus</th>
                        <th>Amount</th><th>Mode</th><th>Status</th><th>Age/Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDate.bookings.map((b, i) => (
                        <tr key={b._id || i}>
                          <td><b style={{ fontFamily: "monospace", fontSize: 11 }}>{b.bookingCode || "—"}</b></td>
                          <td><b>{b.passengerName || "—"}</b></td>
                          <td style={{ fontSize: 12 }}>{b.phone || "—"}</td>
                          <td><code>{b.seatNo || "—"}</code></td>
                          <td style={{ fontSize: 12 }}>{b.boardingPoint || "—"}</td>
                          <td style={{ fontSize: 12 }}>{b.droppingPoint || "—"}</td>
                          <td style={{ fontSize: 12 }}>{b.busNo || b.bus || "—"}</td>
                          <td><b style={{ color: "#22c55e" }}>₹{Number(b.amount || 0).toLocaleString()}</b></td>
                          <td style={{ fontSize: 12 }}>{b.paymentMode || "—"}</td>
                          <td>{statusBadge(b.paymentStatus || "Pending")}</td>
                          <td style={{ fontSize: 12 }}>{b.age || "—"} / {b.gender || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-cards">
                  {selectedDate.bookings.map((b, i) => (
                    <div key={b._id || i} className="customer-card">
                      <div className="card-top">
                        <b style={{ fontSize: 14 }}>{b.passengerName || "—"}</b>
                        {statusBadge(b.paymentStatus || "Pending")}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", margin: "4px 0" }}>
                        {b.phone || ""} · Seat: <b>{b.seatNo || "—"}</b>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                        {b.boardingPoint || "—"} → {b.droppingPoint || "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                        Bus: {b.busNo || b.bus || "—"} · {b.paymentMode || "—"}
                      </div>
                      <div style={{ fontWeight: 700, color: "#22c55e" }}>₹{Number(b.amount || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
 
              <div className="two-col-grid">
                <div className="section-card">
                  <div className="section-title">📊 Day Summary</div>
                  {[
                    { label: "Total Bookings", val: selectedDate.bookings.length, color: "#3b82f6" },
                    { label: "Paid",           val: selectedDate.paid,            color: "#22c55e" },
                    { label: "Pending",        val: selectedDate.pending,         color: "#f59e0b" },
                    { label: "Cancelled",      val: selectedDate.cancelled,       color: "#ef4444" },
                    { label: "Total Revenue",  val: "₹" + selectedDate.revenue.toLocaleString(), color: "#22c55e" },
                    { label: "Avg Ticket",     val: selectedDate.paid ? "₹" + Math.round(selectedDate.revenue / selectedDate.paid).toLocaleString() : "—", color: "#a78bfa" },
                  ].map((row) => (
                    <div key={row.label} className="popup-row">
                      <span className="popup-label">{row.label}</span>
                      <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                    </div>
                  ))}
                </div>
 
                <div className="section-card">
                  <div className="section-title">🛣️ Routes on this date</div>
                  {(() => {
                    const routeMap = {};
                    selectedDate.bookings.forEach((b) => {
                      const key = (b.boardingPoint || "?") + " → " + (b.droppingPoint || "?");
                      routeMap[key] = (routeMap[key] || 0) + 1;
                    });
                    const entries = Object.entries(routeMap).sort((a, b) => b[1] - a[1]);
                    return entries.length ? (
                      entries.map(([route, count]) => (
                        <div key={route} className="popup-row">
                          <span style={{ fontSize: 13 }}>{route}</span>
                          <span className="badge badge-blue">{count}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--text2)", fontSize: 13 }}>No route data</div>
                    );
                  })()}
                </div>
              </div>
 
              <div className="section-card">
                <div className="section-title">💳 Payment Mode — This Date</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(() => {
                    const pm = {};
                    selectedDate.bookings.forEach((b) => { const m = b.paymentMode || "Unknown"; pm[m] = (pm[m] || 0) + 1; });
                    return Object.entries(pm).map(([mode, count]) => (
                      <div key={mode} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#818cf8" }}>{count}</div>
                        <div style={{ fontSize: 12, color: "#8892a4", marginTop: 3 }}>{mode}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          )}
        </>
      )}
 
      {/* ═══════════════ MONTHLY ═══════════════ */}
      {activeTab === "monthly" && (
        <>
          <FilterBar />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
            {filteredDaily.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="empty-icon">📆</div>
                <div className="empty-text">No data for selected filter</div>
              </div>
            ) : (
              (() => {
                const monthMap = {};
                filteredDaily.forEach((day) => {
                  const dt = new Date(day.date);
                  const key = dt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                  if (!monthMap[key]) monthMap[key] = { label: key, bookings: 0, revenue: 0, paid: 0, pending: 0, cancelled: 0, dates: 0 };
                  monthMap[key].bookings  += day.bookings.length;
                  monthMap[key].revenue   += day.revenue;
                  monthMap[key].paid      += day.paid;
                  monthMap[key].pending   += day.pending;
                  monthMap[key].cancelled += day.cancelled;
                  monthMap[key].dates     += 1;
                });
                return Object.entries(monthMap).map(([key, m]) => (
                  <div key={key} className="section-card" style={{ cursor: "default" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 12, color: "#f1f5f9" }}>📆 {m.label}</div>
                    {[
                      { label: "Bookings",     val: m.bookings,  color: "#60a5fa" },
                      { label: "Revenue",      val: "₹" + m.revenue.toLocaleString(), color: "#22c55e" },
                      { label: "Paid",         val: m.paid,      color: "#4ade80" },
                      { label: "Pending",      val: m.pending,   color: "#fbbf24" },
                      { label: "Cancelled",    val: m.cancelled, color: "#f87171" },
                      { label: "Active Dates", val: m.dates,     color: "#a78bfa" },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                        <span style={{ color: "#8892a4" }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
 
          {filteredMonthly.length > 0 && (
            <div className="section-card">
              <div className="section-title">💰 Monthly Revenue Chart</div>
              {(() => {
                const maxAmt = Math.max(...filteredMonthly.map((r) => r.amount), 1);
                return (
                  <table className="data-table">
                    <thead><tr><th>Month</th><th>Revenue</th><th style={{ width: "40%" }}>Bar</th></tr></thead>
                    <tbody>
                      {filteredMonthly.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.month}</td>
                          <td><b style={{ color: "#22c55e" }}>₹{Number(r.amount).toLocaleString()}</b></td>
                          <td>
                            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 10, overflow: "hidden" }}>
                              <div style={{ width: Math.round((r.amount / maxAmt) * 100) + "%", height: "100%", background: "linear-gradient(90deg,#22c55e,#4ade80)", borderRadius: 4, transition: "width .5s" }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </>
      )}
 
      {/* ═══════════════ ROUTES ═══════════════ */}
      {activeTab === "routes" && (
        <div className="section-card">
          <div className="section-title">🛣️ Top Routes by Bookings</div>
          {reportStats.topRoutes?.length ? (
            (() => {
              const maxC = Math.max(...reportStats.topRoutes.map((r) => r.count), 1);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reportStats.topRoutes.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: i === 0 ? "#e63946" : i === 1 ? "#f59e0b" : i === 2 ? "#22c55e" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i < 3 ? "white" : "#8892a4" }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.route}</div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 6, marginTop: 5, overflow: "hidden" }}>
                          <div style={{ width: Math.round((r.count / maxC) * 100) + "%", height: "100%", background: i === 0 ? "#e63946" : i === 1 ? "#f59e0b" : "#3b82f6", borderRadius: 4 }} />
                        </div>
                      </div>
                      <span className="badge badge-blue" style={{ flexShrink: 0 }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="empty-state"><div className="empty-icon">🛣️</div><div className="empty-text">No route data</div></div>
          )}
        </div>
      )}
 
      {/* ═══════════════ PAYMENTS ═══════════════ */}
      {activeTab === "payments" && (
        <div className="two-col-grid">
          <div className="section-card">
            <div className="section-title">💳 Payment Mode</div>
            {reportStats.paymentSummary?.length ? (
              (() => {
                const total = reportStats.paymentSummary.reduce((s, r) => s + r.count, 0);
                const colors = { Cash: "#22c55e", UPI: "#3b82f6", Card: "#a855f7" };
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {reportStats.paymentSummary.map((r, i) => {
                      const pct = total ? Math.round((r.count / total) * 100) : 0;
                      const clr = colors[r.mode] || "#8892a4";
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: clr, display: "inline-block" }} />
                              {r.mode}
                            </span>
                            <span style={{ color: "#8892a4" }}>{r.count} ({pct}%)</span>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                            <div style={{ width: pct + "%", height: "100%", background: clr, borderRadius: 6 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="empty-state"><div className="empty-text">No payment data</div></div>
            )}
          </div>
 
          <div className="section-card">
            <div className="section-title">📋 Transaction Summary</div>
            {[
              { label: "Total Transactions", val: totalBookings,                    color: "#60a5fa" },
              { label: "Paid / Confirmed",   val: reportStats.paidCount,            color: "#22c55e" },
              { label: "Pending",            val: reportStats.pendingCount,          color: "#fbbf24" },
              { label: "Failed / Refunded",  val: reportStats.cancelledCount,        color: "#f87171" },
              { label: "Total Revenue",      val: "₹" + (reportStats.totalRevenue || 0).toLocaleString(), color: "#22c55e" },
              { label: "Avg per Transaction",val: "₹" + avgTicket.toLocaleString(), color: "#a78bfa" },
              { label: "Success Rate",       val: paidPct + "%",                    color: "#4ade80" },
            ].map((row) => (
              <div key={row.label} className="popup-row">
                <span className="popup-label">{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* ═══════════════ BUSES ═══════════════ */}
      {activeTab === "buses" && (
        <div className="section-card">
          <div className="section-title">🚌 Bus Performance — All Buses</div>
          {reportStats.busPerformance?.length ? (
            (() => {
              const maxC = Math.max(...reportStats.busPerformance.map((r) => r.count), 1);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reportStats.busPerformance.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: i === 0 ? "#e63946" : i === 1 ? "#f59e0b" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i < 2 ? "white" : "#8892a4" }}>{i + 1}</div>
                      <code style={{ fontSize: 13, minWidth: 100, flexShrink: 0, color: "#60a5fa" }}>{r.bus}</code>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 10, overflow: "hidden" }}>
                          <div style={{ width: Math.round((r.count / maxC) * 100) + "%", height: "100%", background: "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 4 }} />
                        </div>
                      </div>
                      <span className="badge badge-blue" style={{ flexShrink: 0 }}>{r.count} bookings</span>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="empty-state"><div className="empty-icon">🚌</div><div className="empty-text">No bus data</div></div>
          )}
        </div>
      )}
    </div>
  );
}


// ===================== SETTINGS PAGE =====================
async function save() {
  setSettings(form);

  await fetch("https://shahaji-travels-backend.onrender.com/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cashPaymentEnabled: form.cashPaymentEnabled,
      cashOverridePhones: form.cashOverridePhones || [],
    }),
  });

  showToast("Saved!");
}
function DeviceManager({ showToast }) {
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch("/api/admin/devices")
      .then(d => setDevices(d.devices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function approveDevice(id) {
    try {
      await apiFetch("/api/admin/devices/" + id + "/approve", { method: "PATCH" });
      setDevices(prev => prev.map(d =>
        d._id === id ? { ...d, status: "approved" } : d
      ));
      showToast("✅ Device approved!");
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }

  async function removeDevice(id) {
    if (!window.confirm("हा device remove करायचा?")) return;
    try {
      await apiFetch("/api/admin/devices/" + id, { method: "DELETE" });
      setDevices(prev => prev.filter(d => d._id !== id));
      showToast("Device removed!");
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }

  const pending  = devices.filter(d => d.status === "pending");
  const approved = devices.filter(d => d.status === "approved");

  return (
    <div className="section-card">
      <div className="section-title">📱 Device Management</div>

      {loading ? (
        <div className="empty-state"><div className="empty-text">Loading...</div></div>
      ) : (
        <>
          {/* Pending Requests */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#f59e0b", marginBottom: 10, fontSize: 13 }}>
                ⏳ Pending Requests ({pending.length})
              </div>
              {pending.map(d => (
                <div key={d._id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 10, marginBottom: 8,
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>📱 {d.deviceName || "New Device"}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>
                      {new Date(d.addedAt).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text2)" }}>
                      ID: {d.fingerprint?.slice(0, 12)}...
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-success" onClick={() => approveDevice(d._id)}>✅ Approve</button>
                    <button className="btn-sm btn-del" onClick={() => removeDevice(d._id)}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approved Devices */}
          <div style={{ fontWeight: 700, color: "#22c55e", marginBottom: 10, fontSize: 13 }}>
            ✅ Approved Devices ({approved.length})
          </div>
          {approved.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">No approved devices yet</div>
            </div>
          ) : (
            approved.map(d => (
              <div key={d._id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "var(--bg3)",
                border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>📱 {d.deviceName || "Device"}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    Added: {new Date(d.addedAt).toLocaleDateString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text2)" }}>
                    ID: {d.fingerprint?.slice(0, 12)}...
                  </div>
                </div>
                <button className="btn-sm btn-del" onClick={() => removeDevice(d._id)}>🗑️ Remove</button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
function SettingsPage({ settings, setSettings, showToast }) {
  const [form, setForm] = useState({ ...defaultSettings, ...settings });

  async function save() {
  setSettings(form);
  try {
    await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        companyName:         form.companyName,
        supportNumber:       form.supportNumber,
        supportEmail:        form.supportEmail,
        contactName1:        form.contactName1,
        contactPhone1:       form.contactPhone1,
        contactPhone2:       form.contactPhone2,
        refundPolicy:        form.refundPolicy,
        seatHoldMinutes:     form.seatHoldMinutes,
        cashPaymentEnabled:  form.cashPaymentEnabled,
        cashOverridePhones:  form.cashOverridePhones || [],
      }),
    });
showToast("Settings saved successfully!");
  } catch (e) {
    showToast("Settings saved locally (API error: " + e.message + ")", "error");
  }
}

  return (
    <div className="page">
      <div className="page-header"><h1>Settings</h1><p>Configure your panel</p></div>
      <div className="form-card">
        <div className="form-title">⚙️ General Settings</div>
        <div className="form-grid">
          <Input label="Company Name"   value={form.companyName}   onChange={v => setForm(f => ({ ...f, companyName: v }))} />
          <Input label="Support Number" value={form.supportNumber} onChange={v => setForm(f => ({ ...f, supportNumber: v }))} />
          <Input label="Support Email"  value={form.supportEmail}  onChange={v => setForm(f => ({ ...f, supportEmail: v }))} />
          <Input label="Seat Hold (min)" value={String(form.seatHoldMinutes || 10)}
            onChange={v => setForm(f => ({ ...f, seatHoldMinutes: Number(v) }))} type="number" />
        </div>

        {/* Contact Numbers */}
        <div style={{ marginTop: 20 }}>
          <div className="form-title" style={{ fontSize: 14, marginBottom: 12 }}>📞 Contact Numbers</div>
          <div className="form-grid">
            <Input label="Contact Person Name" value={form.contactName1 || ""}
              onChange={v => setForm(f => ({ ...f, contactName1: v }))} placeholder="Kaviraj Barge" />
            <Input label="Contact Phone 1"     value={form.contactPhone1 || ""}
              onChange={v => setForm(f => ({ ...f, contactPhone1: v }))} placeholder="9766775660" />
            <Input label="Contact Phone 2"     value={form.contactPhone2 || ""}
              onChange={v => setForm(f => ({ ...f, contactPhone2: v }))} placeholder="7350725223" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Refund Policy</label>
          <textarea
            className="form-input"
            rows={3}
            value={form.refundPolicy}
            onChange={e => setForm(f => ({ ...f, refundPolicy: e.target.value }))}
            style={{ resize: "vertical" }}
          />
        </div>
        {/* ── PAYMENT SETTINGS ── */}
<div style={{ marginTop: 24 }}>
  <div className="form-title" style={{ fontSize: 14, marginBottom: 12 }}>💳 Payment Settings</div>
  
  {/* Global Cash Toggle */}
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", background: "var(--bg3)", borderRadius: 10,
    border: "1px solid var(--border)", marginBottom: 12,
  }}>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>💵 Cash Payment (Global)</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
        {form.cashPaymentEnabled
          ? "Cash payment enabled for all passengers"
          : "Cash disabled — UPI/Card only"}
      </div>
    </div>
    <button
      onClick={() => setForm(f => ({ ...f, cashPaymentEnabled: !f.cashPaymentEnabled }))}
      style={{
        width: 52, height: 28, borderRadius: 14, border: "none",
        background: form.cashPaymentEnabled ? "#22c55e" : "#64748b",
        cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: form.cashPaymentEnabled ? 26 : 3,
        width: 22, height: 22, borderRadius: 11,
        background: "white", transition: "left 0.2s",
      }} />
    </button>
  </div>

  {/* Per-Passenger Cash Override */}
  <div style={{
    padding: "14px 16px", background: "var(--bg3)", borderRadius: 10,
    border: "1px solid var(--border)", marginBottom: 12,
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
      📱 Cash Override — Specific Passengers
    </div>
    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
      Cash disabled असताना specific phone numbers साठी cash allow करा
    </div>

    {/* Add phone */}
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <input
        className="form-input"
        placeholder="Phone number (10 digits)"
        maxLength={10}
        id="cashOverrideInput"
        style={{ flex: 1 }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const val = e.target.value.trim();
            if (val.length === 10 && !form.cashOverridePhones.includes(val)) {
              setForm(f => ({ ...f, cashOverridePhones: [...(f.cashOverridePhones || []), val] }));
              e.target.value = "";
            }
          }
        }}
      />
      <button
        className="btn-primary"
        style={{ padding: "9px 16px", fontSize: 13, whiteSpace: "nowrap" }}
        onClick={() => {
          const input = document.getElementById("cashOverrideInput");
          const val = input.value.trim();
          if (val.length === 10 && !(form.cashOverridePhones || []).includes(val)) {
            setForm(f => ({ ...f, cashOverridePhones: [...(f.cashOverridePhones || []), val] }));
            input.value = "";
          }
        }}
      >+ Add</button>
    </div>

    {/* Phone list */}
    {(form.cashOverridePhones || []).length > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {form.cashOverridePhones.map(phone => (
          <div key={phone} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 20, padding: "4px 12px", fontSize: 13,
          }}>
            <span>📱 {phone}</span>
            <button
              onClick={() => setForm(f => ({ ...f, cashOverridePhones: f.cashOverridePhones.filter(p => p !== phone) }))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}
            >×</button>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
        No override phones added yet
      </div>
    )}
  </div>

  {/* Status indicator */}
  <div style={{
    padding: "12px 16px", borderRadius: 10,
    background: form.cashPaymentEnabled ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
    border: `1px solid ${form.cashPaymentEnabled ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
    fontSize: 13,
    color: form.cashPaymentEnabled ? "#22c55e" : "#ef4444",
    fontWeight: 600,
  }}>
    {form.cashPaymentEnabled
      ? "✅ सर्व passengers साठी Cash payment available आहे"
      : `❌ Cash disabled — फक्त ${(form.cashOverridePhones || []).length} override phone(s) साठी cash available`}
  </div>
</div>
        <div className="form-actions">
          <button className="btn-primary" onClick={save}>💾 Save Settings</button>
        </div>
      </div>
<DeviceManager showToast={showToast} />
      {/* Contact display card */}
      <div className="section-card">
        <div className="section-title">📞 Support Contacts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="contact-row">
            <span className="contact-icon">👤</span>
            <span><b>{form.contactName1 || "Kaviraj Barge"}</b></span>
          </div>
          <div className="contact-row">
            <span className="contact-icon">📱</span>
            <a href={"tel:" + (form.contactPhone1 || "9766775660")} className="contact-link">
              {form.contactPhone1 || "9766775660"}
            </a>
          </div>
          <div className="contact-row">
            <span className="contact-icon">📱</span>
            <a href={"tel:" + (form.contactPhone2 || "7350725223")} className="contact-link">
              {form.contactPhone2 || "7350725223"}
            </a>
          </div>
          <div className="contact-row">
            <span className="contact-icon">📧</span>
            <span>{form.supportEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== MODALS =====================
function EditBookingModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    passengerName: item.passengerName || "",
    phone: item.phone || "",
    boardingPoint: item.boardingPoint || "",
    droppingPoint: item.droppingPoint || "",
    seatNo: item.seatNo || "",
    amount: item.amount || "",
    paymentMode: item.paymentMode || item.paymentMethod || "Cash",
    paymentStatus: item.paymentStatus || "Pending",
    refundStatus: item.refundStatus || "Not Applicable",
    age: item.age || "",
    gender: item.gender || "Male",
    journeyDate: item.journeyDate || item.date || "",
    busNo: item.busNo || item.bus || "",
    conductorNote: item.conductorNote || "",
  });

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>✏️ Edit Booking</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div className="form-grid">
          <Input label="Passenger Name" value={form.passengerName} onChange={v => setForm(f => ({ ...f, passengerName: v }))} />
          <Input label="Phone"          value={form.phone}         onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <Input label="Age"            value={form.age}           onChange={v => setForm(f => ({ ...f, age: v }))} type="number" />
          <Select label="Gender" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["Male","Female","Other"]} />
          <Input label="Boarding Point" value={form.boardingPoint} onChange={v => setForm(f => ({ ...f, boardingPoint: v }))} />
          <Input label="Dropping Point" value={form.droppingPoint} onChange={v => setForm(f => ({ ...f, droppingPoint: v }))} />
          <Input label="Seat No"  value={form.seatNo}      onChange={v => setForm(f => ({ ...f, seatNo: v }))} />
          <Input label="Amount"   value={form.amount}      onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" />
          <Input label="Date"     value={form.journeyDate} onChange={v => setForm(f => ({ ...f, journeyDate: v }))} type="date" />
          <Input label="Bus No"   value={form.busNo}       onChange={v => setForm(f => ({ ...f, busNo: v }))} />
          <Select label="Payment Mode"   value={form.paymentMode}   onChange={v => setForm(f => ({ ...f, paymentMode: v }))}   options={["UPI","Cash","Card"]} />
          <Select label="Payment Status" value={form.paymentStatus} onChange={v => setForm(f => ({ ...f, paymentStatus: v }))} options={["Paid","Pending","Failed","Refunded"]} />
          <Select label="Refund Status"  value={form.refundStatus}  onChange={v => setForm(f => ({ ...f, refundStatus: v }))}  options={["Not Applicable","Requested","Processing","Refunded"]} />
          <Input label="Conductor Note"  value={form.conductorNote} onChange={v => setForm(f => ({ ...f, conductorNote: v }))} />
        </div>
        <div className="form-actions">
        
          <button className="btn-primary"   onClick={() => onSave({ ...form, age: form.age && form.age !== "-" ? Number(form.age) : 0 })}>Save Changes</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
function SeatBlockInfoPopup({ popup, onClose, onUnblock }) {
  if (!popup) return null;
  const info = popup.seatData || {};
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:"var(--bg2)", border:"1px solid rgba(239,68,68,0.4)",
        borderRadius:16, padding:24, width:"100%", maxWidth:360,
        boxShadow:"0 8px 40px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize:36, marginBottom:10, textAlign:"center" }}>🚫</div>
        <div style={{
          fontFamily:"'Syne',sans-serif", fontSize:18,
          fontWeight:700, marginBottom:14, textAlign:"center",
        }}>
          Seat {popup.seat} — Blocked
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:16 }}>
          {[
            ["👤 Name",      info.passengerName || popup.passengerName || "—"],
            ["📱 Mobile",    info.mobile        || popup.mobile        || "—"],
            ["⚧ Gender",    info.gender        || popup.gender        || "—"],
            ["🟢 Boarding",  info.boardingPoint || popup.boardingPoint || "—"],
            ["🔴 Dropping",  info.droppingPoint || popup.droppingPoint || "—"],
          ].map(([label, val]) => (
            <div key={label} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              fontSize:13, padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ color:"var(--text2)" }}>{label}</span>
              <span style={{ fontWeight:700, color:"var(--text)", maxWidth:"60%", textAlign:"right" }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => { onUnblock(popup.busId, popup.seat); onClose(); }}
            style={{
              flex:1, background:"linear-gradient(135deg,#16a34a,#15803d)",
              color:"white", border:"none", borderRadius:9,
              padding:"11px 0", cursor:"pointer", fontWeight:700, fontSize:14,
            }}
          >✅ Unblock Seat</button>
          <button
            onClick={onClose}
            style={{
              flex:1, background:"var(--bg3)", border:"1px solid var(--border)",
              color:"var(--text2)", borderRadius:9, padding:"11px 0",
              cursor:"pointer", fontWeight:600, fontSize:14,
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}


function AdminGenderPickerModal({ visible, seat, onSelect, onCancel, onBlock, boardingOptions, droppingOptions }) {
  const [step, setStep] = React.useState("choose"); // "choose" | "blockform"
  const [blockData, setBlockData] = React.useState({ name: "", mobile: "", boardingPoint: "", droppingPoint: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (visible) { setStep("choose"); setBlockData({ name: "", mobile: "", boardingPoint: "", droppingPoint: "" }); }
  }, [visible, seat]);

  if (!visible) return null;

  async function submitBlock() {
    if (!blockData.name.trim())   { alert("Passenger name required"); return; }
    if (!blockData.mobile.trim()) { alert("Mobile number required"); return; }
    setSaving(true);
    await onBlock({ ...blockData, seat });
    setSaving(false);
    onCancel();
  }

  const ALL_BOARDING = [
    "Sanbur","Banpuri","Janugadewadi","Dhebewadi","Maldan","Gudhe","Talmavle",
    "Karpewadi","Manegav","Kadhne","Tarukh","Kusur","Kolewadi","Kole","Gharewadi",
    "Shindewadi","Ving","Chachegaon","Aagashiv Nagar","Dhebewadi Fata","Karad",
    "Varunji Fata","Gote","Khodshi","Vahagaon","Talbeed","Tasawade Toll Plaza",
    "Umbraj","Indoli","Kashil","Atith","Nisrale Fata","Nagthane","Borgaon","Shendre",
    "Satara","Aanewadi Toll Plaza","Pachwad","Bhuinj","Surur","Vele","Khandala",
    "Shirval","Khed Shivapur","Navle Bridge (Katraj)","Varje","Chandani Chowk","Vakad","Ravet",
  ].sort();

  const ALL_DROPPING = [
    "Kalamboli","Kamotha","Kharghar","Nerul","Jui Nagar","Sanpada","Vashi",
    "Mankhurd","Mankhurd Station","Chembur (Maitri Park)","Ghatla","Shivaji Nagar",
    "Kamraj Nagar","Nalanda Bus Stop","Ramabai","Ghatkopar Depo","Ghatkopar Shreyas",
    "Ghatkopar R City Mall","Vikhroli Depo","Vikhroli Station","Vikhroli Surya Nagar",
    "Vikhroli Gandhinagar","Powai IIT","Powai IIT Main Gate","Powai Talav",
    "Milind Nagar","Seepaz","Sariput Nagar","Matoshri","Durga Nagar","Shyam Nagar",
    "Ramwadi","Jaycoach","Mahananda","Goregaon Check Naka","Goregaon Virwani",
    "Pathanwadi","Malad Shantaram Talav","Malad Pushpa Park","Kandivali Samta Nagar",
    "Mahindra Gate","Sai Dham","Borivali Tata Power","Borivali Station","Chikuwadi",
    "Mahaveer Nagar","Ganesh Chowk","Bandar Pakhadi","Charkop Sahyadri Nagar",
  ].sort();

  const bOpts = (boardingOptions && boardingOptions.length) ? boardingOptions : ALL_BOARDING;
  const dOpts = (droppingOptions && droppingOptions.length) ? droppingOptions : ALL_DROPPING;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:20,
        padding:28, width:"100%", maxWidth: step === "blockform" ? 420 : 340,
        boxShadow:"0 8px 40px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize:28, marginBottom:8, textAlign:"center" }}>🪑</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:4, textAlign:"center" }}>
          Seat {seat}
        </div>

        {step === "choose" && (
          <>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:24, textAlign:"center" }}>
              Action select kara
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <button
                onClick={() => onSelect("Male")}
                style={{
                  flex:1, padding:"16px 8px", borderRadius:14, cursor:"pointer",
                  border:"2px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                }}
              >
                <span style={{ fontSize:28 }}>👨</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#60a5fa" }}>Male</span>
              </button>
              <button
                onClick={() => onSelect("Female")}
                style={{
                  flex:1, padding:"16px 8px", borderRadius:14, cursor:"pointer",
                  border:"2px solid rgba(168,85,247,0.4)", background:"rgba(168,85,247,0.1)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                }}
              >
                <span style={{ fontSize:28 }}>👩</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#c084fc" }}>Female</span>
              </button>
              <button
                onClick={() => setStep("blockform")}
                style={{
                  flex:1, padding:"16px 8px", borderRadius:14, cursor:"pointer",
                  border:"2px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                }}
              >
                <span style={{ fontSize:28 }}>🚫</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#f87171" }}>Block</span>
              </button>
            </div>
            <button
              onClick={onCancel}
              style={{
                width:"100%", padding:"11px", borderRadius:10,
                background:"var(--bg3)", border:"1px solid var(--border)",
                color:"var(--text2)", cursor:"pointer", fontSize:13, fontWeight:600,
              }}
            >Cancel</button>
          </>
        )}

        {step === "blockform" && (
          <>
            <div style={{ fontSize:12, color:"#f87171", marginBottom:16, textAlign:"center", fontWeight:600 }}>
              🚫 Seat Block करा — Passenger Information
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>Passenger Name *</div>
                <input
                  className="form-input"
                  placeholder="Passenger full name"
                  value={blockData.name}
                  onChange={e => setBlockData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>Mobile Number *</div>
                <input
                  className="form-input"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={blockData.mobile}
                  onChange={e => setBlockData(p => ({ ...p, mobile: e.target.value.replace(/\D/g,"").slice(0,10) }))}
                />
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>Boarding Point</div>
                <select
                  className="form-select"
                  value={blockData.boardingPoint}
                  onChange={e => setBlockData(p => ({ ...p, boardingPoint: e.target.value }))}
                >
                  <option value="">— Select boarding —</option>
                  {bOpts.map(pt => (
                    <option key={typeof pt === "string" ? pt : pt.en} value={typeof pt === "string" ? pt : pt.mr}>
                      {typeof pt === "string" ? pt : (pt.mr + " / " + pt.en)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>Dropping Point</div>
                <select
                  className="form-select"
                  value={blockData.droppingPoint}
                  onChange={e => setBlockData(p => ({ ...p, droppingPoint: e.target.value }))}
                >
                  <option value="">— Select dropping —</option>
                  {dOpts.map(pt => (
                    <option key={typeof pt === "string" ? pt : pt.en} value={typeof pt === "string" ? pt : pt.mr}>
                      {typeof pt === "string" ? pt : (pt.mr + " / " + pt.en)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={submitBlock}
                disabled={saving}
                style={{
                  flex:2, padding:"12px", borderRadius:10, border:"none",
                  background:"linear-gradient(135deg,#e63946,#c1121f)",
                  color:"white", fontWeight:700, fontSize:14, cursor:"pointer",
                }}
              >
                {saving ? "Blocking..." : "🚫 Block Seat"}
              </button>
              <button
                onClick={() => setStep("choose")}
                style={{
                  flex:1, padding:"12px", borderRadius:10,
                  background:"var(--bg3)", border:"1px solid var(--border)",
                  color:"var(--text2)", cursor:"pointer", fontSize:13,
                }}
              >← Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SeatDetailsModal({ item, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>🪑 Seat Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div className="seat-popup-grid">
          {[
            ["Booking ID",  item?.bookingCode || "—"],
            ["Passenger",   item?.passengerName || "—"],
            ["Phone",       item?.phone || "—"],
            ["Seat",        item?.seatNo ? getSeatDisplayLabel(item.seatNo) : "—"],
            ["Route",       item ? `${item.boardingPoint || "—"} → ${item.droppingPoint || "—"}` : "—"],
            ["Date",        item?.journeyDate || "—"],
            ["Payment",     item?.paymentStatus || "—"],
            ["Amount",      item ? `₹${item.amount || 0}` : "—"],
          ].map(([label, val]) => (
            <div key={label} className="popup-row">
              <span className="popup-label">{label}</span>
              <span className="popup-val">{val}</span>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={() => item && generateTicket(item)}>🖨️ Print Ticket</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
function BookingDetailModal({ item, onClose, onPrint, onWhatsApp }) {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif" }}>🎫 Booking Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 16px", background: "var(--bg3)", borderRadius: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "white", fontSize: 20, fontFamily: "'Syne', sans-serif"
          }}>
            {(item.passengerName || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, fontFamily: "'Syne', sans-serif" }}>
              {item.passengerName || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
              {item.phone || ""}
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>{statusBadge(item.paymentStatus)}</div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
           { icon: "🪑", label: item.seatNumbers?.length > 1 ? `Seats (${item.seatNumbers.length})` : "Seat", 
  val: item.seatNumbers?.length > 1 
    ? item.seatNumbers.join(", ") 
    : item.seatNo ? getSeatDisplayLabel(item.seatNo) : "—" },
            { icon: "💰", label: "Amount", val: "₹" + Number(item.amount || 0).toLocaleString() },
            { icon: "💳", label: "Payment", val: item.paymentMode || "—" },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Info Rows */}
        <div className="seat-popup-grid" style={{ marginBottom: 16 }}>
          {[
            ["🎫 Booking ID",   item.bookingCode || "—"],
            ["📱 Phone",        item.phone || "—"],
            ["👤 Age / Gender", (item.age || "—") + " / " + (item.gender || "—")],
            ["🛣️ From",         item.boardingPoint || "—"],
            ["📍 To",           item.droppingPoint || "—"],
            ["📅 Journey Date", item.journeyDate || item.date || "—"],
            ["🚍 Bus",          item.busNo || item.bus || "—"],
            ["🔄 Refund",       item.refundStatus || "Not Applicable"],
            ["📝 Note",         item.conductorNote || "—"],
          ].map(([label, val]) => (
            <div key={label} className="popup-row">
              <span className="popup-label">{label}</span>
              <span className="popup-val" style={{ fontSize: 13, maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val}</span>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-ticket-print" onClick={onPrint}>🖨️ Print Ticket</button>
          <button className="btn-ticket-wa"    onClick={onWhatsApp}>💬 WhatsApp</button>
          <button className="btn-secondary"    onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
// ===================== SHARED COMPONENTS =====================
function Toolbar({ search, setSearch, searchPlaceholder, filterValue, setFilterValue, filterOptions, sortOrder, setSortOrder }) {
  return (
    <div className="toolbar">
      <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
        placeholder={searchPlaceholder || "Search..."} style={{ flex: 2 }} />
      <select className="form-select" value={filterValue}
        onChange={e => setFilterValue(e.target.value)} style={{ flex: 1 }}>
        {filterOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select className="form-select" value={sortOrder}
        onChange={e => setSortOrder(e.target.value)} style={{ flex: 1 }}>
        <option value="latest">Latest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  );
}

function StatCard({ icon, label, value, color = "blue" }) {
  return (
    <div className={"stat-card stat-card-" + color}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{value}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" value={value != null ? value : ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""} type={type || "text"} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" value={value != null ? value : ""}
        onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
// ─── NOTIFICATIONS ADMIN PAGE ─────────────────────────────────────
function NotificationsAdminPage({ showToast }) {
  const emptyForm = { title: "", message: "", type: "info" };
  const [form, setForm] = React.useState(emptyForm);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [viewBus,  setViewBus]  = useState(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/all");
      const list = Array.isArray(res) ? res : (res.notifications || []);
      setNotifications(list);
    } catch (e) {
      showToast("Could not load notifications: " + e.message, "error");
    }
    setLoading(false);
  }

  async function sendNotification() {
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Title and message are required!", "error");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const saved = res.notification || res;
      setNotifications(prev => [saved, ...prev]);
      setForm(emptyForm);
      showToast("✅ Notification sent to all passengers!");
    } catch (e) {
      showToast("Send failed: " + e.message, "error");
    }
    setSending(false);
  }

  async function deleteNotification(id) {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await apiFetch("/api/notifications/" + id, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => String(n._id || n.id) !== String(id)));
      showToast("Deleted.");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }

  const typeColors = {
    info:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  color: "#60a5fa",  icon: "ℹ️" },
    offer:  { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   color: "#22c55e",  icon: "🏷️" },
    alert:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#ef4444",  icon: "⚠️" },
    update: { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)",  color: "#a855f7",  icon: "🔄" },
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <p>Send notifications to all mobile app passengers</p>
      </div>

      {/* Send Form */}
      <div className="form-card">
        <div className="form-title">📤 Send New Notification</div>
        <div className="form-grid">
          <Input
            label="Title *"
            value={form.title}
            onChange={v => setForm(f => ({ ...f, title: v }))}
            placeholder="New Offer Available!"
          />
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="info">ℹ️ Info</option>
              <option value="offer">🏷️ Offer</option>
              <option value="alert">⚠️ Alert</option>
              <option value="update">🔄 Update</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Message *</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Get ₹100 off on your next booking! Use code SAVE100."
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.message) && (
          <div style={{
            marginTop: 14,
            padding: "12px 16px",
            background: typeColors[form.type]?.bg || "rgba(59,130,246,0.12)",
            border: `1px solid ${typeColors[form.type]?.border || "rgba(59,130,246,0.3)"}`,
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Preview
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>{typeColors[form.type]?.icon || "ℹ️"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{form.title || "Title"}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>{form.message || "Message"}</div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={sendNotification}
            disabled={sending}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {sending ? "⟳ Sending..." : "🔔 Send Notification"}
          </button>
          <button className="btn-secondary" onClick={() => setForm(emptyForm)}>Clear</button>
        </div>
      </div>

      {/* Sent Notifications List */}
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Sent Notifications ({notifications.length})
          </div>
          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={loadNotifications}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-text">Loading...</div></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-text">No notifications sent yet. Send your first one above!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifications.map(notif => {
              const nid = notif._id || notif.id;
              const tc = typeColors[notif.type] || typeColors.info;
              const sentDate = notif.createdAt
                ? new Date(notif.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <div key={nid} style={{
                  background: "var(--bg3)",
                  borderRadius: 10,
                  borderLeft: `3px solid ${tc.color}`,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{tc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{notif.title}</span>
                      <span style={{
                        background: tc.bg, border: `1px solid ${tc.border}`,
                        color: tc.color, padding: "1px 8px", borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {notif.type?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>{notif.message}</div>
                    {sentDate && (
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>📅 {sentDate}</div>
                    )}
                  </div>
                  <button
                    className="btn-sm btn-del"
                    onClick={() => deleteNotification(nid)}
                    style={{ flexShrink: 0 }}
                  >🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
// ===================== BUS REPORT PAGE =====================
// ===================== BUS REPORT PAGE =====================
function BusReportPage({ buses, showToast }) {
  const [selectedBusId, setSelectedBusId] = React.useState("");
  const [selectedDate,  setSelectedDate]  = React.useState("");
  const [bookings,      setBookings]      = React.useState([]);
  const [loading,       setLoading]       = React.useState(false);
  const [fetched,       setFetched]       = React.useState(false);
  const [blockedSeats,  setBlockedSeats]  = React.useState([]);
  const selectedBus = buses.find(
    b => String(b._id || b.id) === String(selectedBusId)
  );

  async function fetchBookings() {
    if (!selectedBusId) { showToast("Please select a bus!", "error"); return; }
    setLoading(true);
    setFetched(false);
    try {
      let url = `/api/bookings/bus/${selectedBusId}`;
      if (selectedDate) url += `?date=${selectedDate}`;
      const res  = await apiFetch(url);
     const list = Array.isArray(res) ? res : (res.bookings || []);
      const blocked = res.blockedSeats || [];
      setBookings(list.map(normalizeBooking));
      setBlockedSeats(blocked);
      setFetched(true);
      if (!list.length && !blocked.length) showToast("No bookings found for this bus.", "error");
    } catch (e) {
      showToast("Failed: " + e.message, "error");
    }
    setLoading(false);
  }

  const summary = React.useMemo(() => {
    const paid      = bookings.filter(b => b.paymentStatus === "Paid");
    const pending   = bookings.filter(b => b.paymentStatus === "Pending");
    const cancelled = bookings.filter(b =>
      ["Failed","Refunded","Cancelled"].includes(b.paymentStatus)
    );
    return {
      total:     bookings.length,
      paid:      paid.length,
      pending:   pending.length,
      cancelled: cancelled.length,
      revenue:   paid.reduce((s, b) => s + Number(b.amount || 0), 0),
    };
  }, [bookings]);

  function downloadPDF() {
    if (!bookings.length) { showToast("No data to export!", "error"); return; }

    const busName   = selectedBus?.name   || "Bus";
    const busNum    = selectedBus?.number || selectedBus?.numberPlate || selectedBusId;
    const dateLabel = selectedDate || "All Dates";
    const today     = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric"
    });

    const thS = "padding:9px 8px;background:#1e293b;color:white;font-size:11px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;";
    const tdS = "padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:middle;";

    const rows = bookings.map((b, i) => {
      const statusColor =
        b.paymentStatus === "Paid"    ? ["#d1fae5","#065f46"] :
        b.paymentStatus === "Pending" ? ["#fef3c7","#92400e"] :
                                        ["#fee2e2","#991b1b"];
      return `<tr style="background:${i%2===0?"#fff":"#f8fafc"}">
        <td style="${tdS}text-align:center;color:#6b7280;">${i+1}</td>
        <td style="${tdS}">
          <div style="font-weight:700;font-size:13px;">${b.passengerName||"—"}</div>
          <div style="font-size:11px;color:#6b7280;">${b.age?"Age:"+b.age:""}${b.gender?" · "+b.gender:""}</div>
        </td>
        <td style="${tdS}font-family:monospace;">${b.phone||"—"}</td>
        <td style="${tdS}text-align:center;">
          <span style="background:#ede9fe;color:#5b21b6;padding:3px 8px;border-radius:6px;font-weight:700;font-size:12px;">${b.seatNo||"—"}</span>
        </td>
        <td style="${tdS}">${b.boardingPoint||"—"}</td>
        <td style="${tdS}">${b.droppingPoint||"—"}</td>
        <td style="${tdS}white-space:nowrap;">${b.journeyDate||b.date||"—"}</td>
        <td style="${tdS}font-weight:700;color:#16a34a;">Rs.${Number(b.amount||0).toLocaleString()}</td>
        <td style="${tdS}">
          <span style="background:${statusColor[0]};color:${statusColor[1]};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${b.paymentStatus||"—"}</span>
        </td>
        <td style="${tdS}">${b.paymentMode||"—"}</td>
      </tr>`;
    }).join("");
const blockedRows = blockedSeats.length
      ? blockedSeats.map((s, i) => `
          <tr style="background:${i%2===0?"#fff5f5":"#fef2f2"}">
            <td style="${tdS}text-align:center;color:#dc2626;font-weight:700;">${i+1}</td>
            <td style="${tdS}">
              <div style="font-weight:700;font-size:13px;color:#dc2626;">${s.passengerName||"—"}</div>
              <div style="font-size:11px;color:#6b7280;">🚫 BLOCKED SEAT</div>
            </td>
            <td style="${tdS}font-family:monospace;">${s.mobile||"—"}</td>
            <td style="${tdS}text-align:center;">
              <span style="background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:6px;font-weight:700;font-size:12px;">${s.seatNo||"—"}</span>
            </td>
            <td style="${tdS}">${s.boardingPoint||"—"}</td>
            <td style="${tdS}">${s.droppingPoint||"—"}</td>
            <td style="${tdS}white-space:nowrap;">—</td>
            <td style="${tdS}color:#dc2626;font-weight:700;">BLOCKED</td>
            <td style="${tdS}">
              <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">Blocked</span>
            </td>
            <td style="${tdS}">—</td>
          </tr>`).join("")
      : "";
    const summaryBoxes = [
      ["Total",     summary.total,     "#2563eb","#eff6ff"],
      ["Blocked",   blockedSeats.length, "#dc2626","#fef2f2"],
      ["Paid",      summary.paid,      "#16a34a","#f0fdf4"],
      ["Pending",   summary.pending,   "#d97706","#fffbeb"],
      ["Cancelled", summary.cancelled, "#dc2626","#fef2f2"],
      ["Revenue",   "Rs."+summary.revenue.toLocaleString(), "#7c3aed","#faf5ff"],
    ].map(([label,val,color,bg]) =>
      `<div style="background:${bg};border:1px solid ${color}33;border-radius:10px;padding:14px 12px;text-align:center;flex:1;min-width:90px;">
        <div style="font-size:22px;font-weight:900;color:${color};">${val}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px;text-transform:uppercase;font-weight:600;">${label}</div>
      </div>`
    ).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bus Report - ${busName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;
         padding:65px 20px 30px;max-width:1050px;margin:0 auto;}
    table{border-collapse:collapse;width:100%;}
    .noprint{display:flex;}
    @page{size:A4 landscape;margin:8mm;}
    @media print{
      .noprint{display:none!important;}
      body{padding:10px 15px;}
      table{font-size:10px;}
    }
    @media(max-width:600px){
      body{padding:60px 8px 20px;}
      table{font-size:10px;}
    }
  </style>
</head>
<body>

<div class="noprint" style="position:fixed;top:0;left:0;right:0;z-index:999;
  background:#fff;padding:10px 14px;border-bottom:2px solid #e63946;
  box-shadow:0 2px 8px rgba(0,0,0,.1);display:flex;align-items:center;
  justify-content:space-between;gap:8px;">
  <div style="font-weight:800;font-size:14px;color:#111;">
    Shahaji Travels - ${busName} (${busNum})
  </div>
  <div style="display:flex;gap:8px;">
    <button onclick="window.print()"
      style="background:linear-gradient(135deg,#e63946,#c1121f);color:#fff;
             border:none;padding:9px 18px;border-radius:8px;font-size:13px;
             font-weight:700;cursor:pointer;">
      Print / Save PDF
    </button>
    <button onclick="window.close()"
      style="background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;
             padding:9px 14px;border-radius:8px;font-size:13px;cursor:pointer;">
      Close
    </button>
  </div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-start;
  margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #e63946;flex-wrap:wrap;gap:10px;">
  <div>
    <div style="font-size:26px;font-weight:900;color:#111;">Shahaji Travels</div>
    <div style="font-size:13px;color:#6b7280;margin-top:3px;">Bus Booking Report</div>
    <div style="margin-top:8px;background:#fef2f2;border:1px solid #fecaca;
      border-radius:7px;padding:5px 12px;display:inline-block;">
      <span style="color:#e63946;font-weight:700;font-size:13px;">
        ${busName} (${busNum}) - ${dateLabel}
      </span>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:11px;color:#6b7280;">Generated</div>
    <div style="font-size:13px;font-weight:700;">${today}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px;">Total</div>
    <div style="font-size:24px;font-weight:900;color:#e63946;">${bookings.length} bookings</div>
  </div>
</div>

<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
  ${summaryBoxes}
</div>

<div style="overflow-x:auto;">
  <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;min-width:600px;">
    <thead>
      <tr>
        <th style="${thS}width:32px;">#</th>
        <th style="${thS}">Passenger</th>
        <th style="${thS}">Mobile</th>
        <th style="${thS}">Seat</th>
        <th style="${thS}">Boarding</th>
        <th style="${thS}">Dropping</th>
        <th style="${thS}">Date</th>
        <th style="${thS}">Amount</th>
        <th style="${thS}">Status</th>
        <th style="${thS}">Pay Mode</th>
      </tr>
    </thead>
<tbody>
      ${rows}
      ${blockedSeats.length ? `
        <tr>
          <td colspan="10" style="padding:10px 8px;background:#fef2f2;border-top:2px solid #dc2626;
            font-size:12px;font-weight:700;color:#dc2626;text-align:center;">
            🚫 BLOCKED SEATS — ${blockedSeats.length} seat(s) blocked
          </td>
        </tr>
        ${blockedRows}
      ` : ""}
    </tbody>  </table>
</div>

<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;
  text-align:center;color:#9ca3af;font-size:11px;">
  Shahaji Travels - ${busName} (${busNum}) - ${dateLabel} | Generated ${today} | Confidential
</div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) {
      showToast("Popup blocked! Browser settings mein popup allow karo.", "error");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🚌 Bus Report</h1>
        <p> SELECT BUS →  CHECK bookingS → DOWNLOAD PDF</p>
      </div>

      {/* Filter Card */}
      <div className="form-card">
        <div className="form-title">🔍 Bus & Date Filter</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Select Bus *</label>
            <select
              className="form-select"
              value={selectedBusId}
              onChange={e => {
                setSelectedBusId(e.target.value);
                setBookings([]);
                setFetched(false);
              }}
            >
              <option value="">— SELECT BUS —</option>
              {[...buses]
                .sort((a,b) => (a.name||"").localeCompare(b.name||""))
                .map(b => (
                  <option key={b._id||b.id} value={b._id||b.id}>
                    {b.name} ({b.number||b.numberPlate||"—"})
                    {b.date ? " — " + b.date : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Journey Date (optional)</label>
            <input
              className="form-input"
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setBookings([]);
                setFetched(false);
              }}
            />
          </div>
        </div>

        {/* Bus info badge */}
        {selectedBus && (
          <div style={{
            marginTop:14, padding:"11px 14px", borderRadius:10,
            background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.22)",
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
          }}>
            <span style={{fontSize:20}}>🚌</span>
            <div>
              <div style={{fontWeight:700, fontSize:14}}>{selectedBus.name}</div>
              <div style={{fontSize:12, color:"var(--text2)", marginTop:2}}>
                {selectedBus.number||selectedBus.numberPlate||"—"} &nbsp;·&nbsp;
                {selectedBus.type||"Bus"} &nbsp;·&nbsp;
                {selectedBus.from||"?"} → {selectedBus.to||"?"} &nbsp;·&nbsp;
                {selectedBus.date||"No Date"}
              </div>
            </div>
          </div>
        )}

        <div className="form-actions" style={{flexWrap:"wrap", gap:10}}>
          <button
            className="btn-primary"
            onClick={fetchBookings}
            disabled={loading || !selectedBusId}
            style={{display:"flex", alignItems:"center", gap:7, minWidth:140}}
          >
            {loading ? "⟳ Loading..." : "🔍 Show Bookings"}
          </button>

          {bookings.length > 0 && (
            <button
              className="btn-primary"
              onClick={downloadPDF}
              style={{
                background:"linear-gradient(135deg,#16a34a,#15803d)",
                display:"flex", alignItems:"center", gap:7,
              }}
            >
              📄 Download / Print PDF
            </button>
          )}

          {(selectedBusId || selectedDate || bookings.length > 0) && (
            <button className="btn-secondary" onClick={() => {
              setSelectedBusId("");
              setSelectedDate("");
              setBookings([]);
              setFetched(false);
            }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {fetched && (bookings.length > 0 || blockedSeats.length > 0) && (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(120px,1fr))",
          gap:10,
        }}>
          {[
           {label:"Total",     val:summary.total,          color:"#3b82f6", bg:"rgba(59,130,246,0.1)"},
          {label:"Paid",      val:summary.paid,            color:"#22c55e", bg:"rgba(34,197,94,0.1)"},
          {label:"Pending",   val:summary.pending,         color:"#f59e0b", bg:"rgba(245,158,11,0.1)"},
          {label:"Cancelled", val:summary.cancelled,       color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
          {label:"Blocked 🚫",val:blockedSeats.length,     color:"#dc2626", bg:"rgba(220,38,38,0.1)"},
          {label:"Revenue",   val:"₹"+summary.revenue.toLocaleString(), color:"#a855f7", bg:"rgba(168,85,247,0.1)"},
          ].map(({label,val,color,bg}) => (
            <div key={label} style={{
              background:"var(--bg2)", border:`1px solid ${color}44`,
              borderRadius:12, padding:"14px 10px", textAlign:"center",
            }}>
              <div style={{
                fontSize:22, fontWeight:800, color,
                fontFamily:"'Syne',sans-serif", lineHeight:1.2,
              }}>{val}</div>
              <div style={{
                fontSize:11, color:"var(--text2)", marginTop:5,
                textTransform:"uppercase", fontWeight:600, letterSpacing:"0.06em",
              }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bookings Table / Cards */}
      {fetched && (
        <div className="section-card">
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:14, flexWrap:"wrap", gap:8,
          }}>
            <div className="section-title" style={{margin:0}}>
              🎫 {selectedBus?.name || "Bus"}{selectedDate ? ` — ${selectedDate}` : " — All Dates"}
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span style={{
                background: bookings.length > 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: bookings.length > 0 ? "#22c55e" : "#ef4444",
                border: `1px solid ${bookings.length > 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700,
              }}>
                {bookings.length} bookings
              </span>
              {bookings.length > 0 && (
                <button
                  className="btn-primary"
                  onClick={downloadPDF}
                  style={{
                    background:"linear-gradient(135deg,#16a34a,#15803d)",
                    padding:"7px 14px", fontSize:12,
                    display:"flex", alignItems:"center", gap:6,
                  }}
                >
                  📄 PDF
                </button>
              )}
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <div className="empty-text">
                {selectedBus?.name || "This bus"} साठी
                {selectedDate ? ` ${selectedDate} ला` : ""} कोणतेही bookings नाहीत.
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div style={{overflowX:"auto"}} className="desktop-only">
                <table className="data-table" style={{minWidth:750}}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Passenger</th>
                      <th>Mobile</th>
                      <th>Seat</th>
                      <th>Boarding</th>
                      <th>Dropping</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Pay Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={b._id||i}>
                        <td style={{color:"var(--text2)", fontSize:12, textAlign:"center"}}>{i+1}</td>
                        <td>
                          <div style={{fontWeight:700}}>{b.passengerName||"—"}</div>
                          {(b.age||b.gender) && (
                            <div style={{fontSize:11, color:"var(--text2)", marginTop:2}}>
                              {b.age ? `Age: ${b.age}` : ""}
                              {b.gender ? ` · ${b.gender}` : ""}
                            </div>
                          )}
                        </td>
                        <td style={{fontSize:13, fontFamily:"monospace"}}>{b.phone||"—"}</td>
                        <td style={{textAlign:"center"}}>
                          <code style={{
                            background:"rgba(99,102,241,0.15)", color:"#818cf8",
                            padding:"3px 8px", borderRadius:6,
                            fontSize:13, fontWeight:700,
                          }}>{b.seatNo||"—"}</code>
                        </td>
                        <td style={{fontSize:12}}>{b.boardingPoint||"—"}</td>
                        <td style={{fontSize:12}}>{b.droppingPoint||"—"}</td>
                        <td style={{fontSize:12, whiteSpace:"nowrap"}}>{b.journeyDate||b.date||"—"}</td>
                        <td>
                          <b style={{color:"#22c55e"}}>
                            ₹{Number(b.amount||0).toLocaleString()}
                          </b>
                        </td>
                        <td>{statusBadge(b.paymentStatus||"Pending")}</td>
                        <td style={{fontSize:12}}>{b.paymentMode||"—"}</td>
                      </tr>
                    ))}
                  {/* Blocked Seats Rows */}
                    {blockedSeats.length > 0 && (
                      <>
                        <tr>
                          <td colSpan="10" style={{
                            padding: "10px 12px",
                            background: "rgba(220,38,38,0.1)",
                            borderTop: "2px solid #dc2626",
                            color: "#ef4444",
                            fontWeight: 700,
                            fontSize: 12,
                            textAlign: "center",
                          }}>
                            🚫 BLOCKED SEATS — {blockedSeats.length} seat(s)
                          </td>
                        </tr>
                        {blockedSeats.map((s, i) => (
                          <tr key={"blocked_" + i} style={{ background: "rgba(220,38,38,0.05)" }}>
                            <td style={{ color: "#dc2626", fontSize: 12, textAlign: "center" }}>B{i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: "#ef4444" }}>{s.passengerName || "—"}</div>
                              <div style={{ fontSize: 11, color: "#8892a4", marginTop: 2 }}>🚫 Blocked Seat</div>
                            </td>
                            <td style={{ fontSize: 13, fontFamily: "monospace" }}>{s.mobile || "—"}</td>
                            <td style={{ textAlign: "center" }}>
                              <code style={{
                                background: "rgba(220,38,38,0.15)", color: "#ef4444",
                                padding: "3px 8px", borderRadius: 6,
                                fontSize: 13, fontWeight: 700,
                              }}>{s.seatNo || "—"}</code>
                            </td>
                            <td style={{ fontSize: 12 }}>{s.boardingPoint || "—"}</td>
                            <td style={{ fontSize: 12 }}>{s.droppingPoint || "—"}</td>
                            <td style={{ fontSize: 12 }}>—</td>
                            <td><b style={{ color: "#ef4444" }}>BLOCKED</b></td>
                            <td>
                              <span className="badge badge-red">Blocked</span>
                            </td>
                            <td style={{ fontSize: 12 }}>—</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              {/* Mobile Cards */}
              <div className="mobile-cards">
                {bookings.map((b, i) => (
                  <div key={b._id||i} className="customer-card">
                    <div className="card-top">
                      <div>
                        <div style={{fontWeight:700, fontSize:15}}>{b.passengerName||"—"}</div>
                        {(b.age||b.gender) && (
                          <div style={{fontSize:11, color:"var(--text2)", marginTop:2}}>
                            {b.age?"Age: "+b.age:""}{b.gender?" · "+b.gender:""}
                          </div>
                        )}
                      </div>
                      {statusBadge(b.paymentStatus||"Pending")}
                    </div>

                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", marginTop:8}}>
                      {[
                        ["📱 Mobile",   b.phone||"—"],
                        ["🪑 Seat",     b.seatNo||"—"],
                        ["🟢 Boarding", b.boardingPoint||"—"],
                        ["🔴 Dropping", b.droppingPoint||"—"],
                        ["📅 Date",     b.journeyDate||b.date||"—"],
                        ["💳 Pay Mode", b.paymentMode||"—"],
                      ].map(([lbl,val]) => (
                        <div key={lbl}>
                          <div style={{fontSize:10, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em"}}>{lbl}</div>
                          <div style={{fontSize:13, fontWeight:600, marginTop:1}}>{val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      marginTop:10, paddingTop:8,
                      borderTop:"1px solid var(--border)",
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                    }}>
                      <b style={{color:"#22c55e", fontSize:16}}>
                        ₹{Number(b.amount||0).toLocaleString()}
                      </b>
                      <span style={{fontSize:12, color:"var(--text2)"}}>
                        #{String(i+1).padStart(2,"0")}
                      </span>
                    </div>
                  </div>
                ))}
{/* Blocked Seats Mobile Cards */}
                {blockedSeats.length > 0 && (
                  <>
                    <div style={{
                      padding: "10px 14px", marginTop: 8,
                      background: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(220,38,38,0.3)",
                      borderRadius: 10, textAlign: "center",
                      color: "#ef4444", fontWeight: 700, fontSize: 13,
                    }}>
                      🚫 Blocked Seats ({blockedSeats.length})
                    </div>
                    {blockedSeats.map((s, i) => (
                      <div key={"bm_" + i} className="customer-card" style={{
                        borderLeft: "3px solid #dc2626",
                        background: "rgba(220,38,38,0.06)",
                      }}>
                        <div className="card-top">
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#ef4444" }}>
                              🚫 {s.passengerName || "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#8892a4", marginTop: 2 }}>
                              Blocked Seat
                            </div>
                          </div>
                          <span className="badge badge-red">Blocked</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 8 }}>
                          {[
                            ["📱 Mobile",   s.mobile        || "—"],
                            ["🪑 Seat",     s.seatNo        || "—"],
                            ["🟢 Boarding", s.boardingPoint || "—"],
                            ["🔴 Dropping", s.droppingPoint || "—"],
                            ["⚧ Gender",   s.gender        || "—"],
                            ["📋 Status",  "BLOCKED"],
                          ].map(([lbl, val]) => (
                            <div key={lbl}>
                              <div style={{ fontSize: 10, color: "#8892a4", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1, color: lbl === "📋 Status" ? "#ef4444" : "var(--text)" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {/* Mobile PDF Button */}
                <button
                  className="btn-primary"
                  onClick={downloadPDF}
                  style={{
                    width:"100%", marginTop:4,
                    background:"linear-gradient(135deg,#16a34a,#15803d)",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", gap:8,
                    padding:"13px", fontSize:15,
                  }}
                >
                  📄 Download / Print PDF
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
// ===================== BACKUP PAGE =====================
function BackupPage({ showToast }) {
  const [restoring, setRestoring] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [downloading, setDownloading] = React.useState(false);

  const downloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/backup`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shahaji_backup_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("✅ Backup downloaded!");
    } catch (err) {
      showToast("Backup failed: " + err.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  const restoreAll = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm("⚠️ Restore करायचं का? Existing data वर affect होणार नाही.")) {
      e.target.value = ""; return;
    }
    setRestoring(true);
    setMsg("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let results = [];

      if (data.buses?.length) {
        const res = await apiFetch("/api/admin/restore/buses", {
          method: "POST", body: JSON.stringify({ buses: data.buses })
        });
        results.push(`🚌 ${res.restored} buses restored`);
      }
      if (data.bookings?.length) {
        const res = await apiFetch("/api/admin/restore/bookings", {
          method: "POST", body: JSON.stringify({ bookings: data.bookings })
        });
        results.push(`🎫 ${res.restored} bookings restored`);
      }
      if (data.customers?.length) {
        const res = await apiFetch("/api/admin/restore/customers", {
          method: "POST", body: JSON.stringify({ customers: data.customers })
        });
        results.push(`👤 ${res.restored} customers restored`);
      }

      setMsg(`✅ Success! ${results.join(" | ")}`);
      showToast("✅ Restore complete!");
    } catch (err) {
      setMsg("❌ Failed: " + err.message);
      showToast("Restore failed: " + err.message, "error");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🗄️ Backup & Restore</h1>
        <p>Data safe ठेव — रोज backup घे!</p>
      </div>

      <div className="section-card">
        <div className="section-title">📥 Download Full Backup</div>
        <p style={{ color: "var(--text2)", marginBottom: 16, fontSize: 13 }}>
          Buses + Bookings + Customers सगळं एका JSON file मध्ये download होईल
        </p>
        <button
          className="btn-primary"
          onClick={downloadBackup}
          disabled={downloading}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {downloading ? "⏳ Downloading..." : "📥 Download Backup"}
        </button>
        <p style={{ color: "var(--text2)", fontSize: 12, marginTop: 10 }}>
          💡 रोज एकदा backup घ्या — safe राहाल!
        </p>
      </div>
<div className="section-card">
        <div className="section-title">⚡ Quick Restore (Auto Backup मधून)</div>
        <p style={{ color: "var(--text2)", marginBottom: 16, fontSize: 13 }}>
          Last auto backup मधून instantly restore कर — कोणतीही file नको!
        </p>
        <button
          className="btn-primary"
          onClick={async () => {
            if (!window.confirm("Last auto backup मधून restore करायचं?")) return;
            try {
             const res = await apiFetch("/api/admin/restore-silent", { method: "POST" });
              setMsg("✅ " + res.message);
              showToast("✅ Restore complete!");
              setTimeout(() => window.location.reload(), 1500);
            } catch(err) {
              setMsg("❌ Failed: " + err.message);
              showToast("Restore failed!", "error");
            }
          }}
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", gap: 8 }}
        >
          ⚡ Quick Restore
        </button>
        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginTop: 12, fontWeight: 700,
            background: msg.includes('✅') ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${msg.includes('✅') ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: msg.includes('✅') ? "#22c55e" : "#f87171",
          }}>
            {msg}
          </div>
        )}
      </div>
      <div className="section-card">
        <div className="section-title">♻️ Restore from Backup</div>
        <p style={{ color: "var(--text2)", marginBottom: 8, fontSize: 13 }}>
          Backup JSON file upload करा — deleted data restore होईल
        </p>
        <div style={{
          padding: "10px 14px", marginBottom: 16, borderRadius: 8,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b", fontSize: 13,
        }}>
          ⚠️ Already existing records वर affect होणार नाही — फक्त missing data restore होईल
        </div>
        <input
          type="file"
          accept=".json"
          onChange={restoreAll}
          disabled={restoring}
          style={{ marginBottom: 12, display: "block", color: "var(--text)" }}
        />
        {restoring && (
          <p style={{ color: "#60a5fa", fontWeight: 600 }}>⏳ Restoring... please wait</p>
        )}
        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginTop: 8, fontWeight: 700,
            background: msg.includes('✅') ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${msg.includes('✅') ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: msg.includes('✅') ? "#22c55e" : "#f87171",
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
// ===================== GLOBAL STYLES =====================
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f1117;
  --bg2: #161b27;
  --bg3: #1e2535;
  --border: rgba(255,255,255,0.07);
  --text: #e8eaf0;
  --text2: #8892a4;
  --accent: #e63946;
  --accent2: #ff6b6b;
  --green: #22c55e;
  --yellow: #f59e0b;
  --blue: #3b82f6;
  --purple: #a855f7;
  --teal: #14b8a6;
  --orange: #f97316;
  --cyan: #06b6d4;
  --red: #ef4444;
  --emerald: #10b981;
  --indigo: #6366f1;
  --sidebar-w: 240px;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
}

body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

.admin-body { display: flex; min-height: 100vh; }

/* SIDEBAR */
.sidebar {
  width: var(--sidebar-w); min-height: 100vh;
  background: var(--bg2); border-right: 1px solid var(--border);
  flex-shrink: 0; display: flex; flex-direction: column;
  position: relative; z-index: 10;
}
/* हे करा */
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  width: 100%;
  overflow-y: auto;
  background: var(--bg2);
  -webkit-overflow-scrolling: touch;
}
  .sidebar-close-btn { display: none; }

.hamburger-btn { display: none; }

.sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.logo-icon { font-size: 32px; margin-bottom: 8px; }
.logo-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--text); }
.logo-sub { font-size: 11px; color: var(--text2); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.08em; }

.sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
.nav-section { font-size: 10px; font-weight: 700; color: var(--text2); letter-spacing: 0.12em; padding: 4px 8px 10px; text-transform: uppercase; }
.nav-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 11px 14px; border-radius: 10px; border: none;
  background: transparent; color: var(--text2); cursor: pointer;
  font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 500;
  transition: all 0.15s; text-align: left; margin-bottom: 3px; position: relative;
}
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active {
  background: linear-gradient(135deg, #e63946, #c1121f);
  color: white; font-weight: 600;
  box-shadow: 0 4px 14px rgba(230,57,70,0.35);
}
.nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }
.nav-badge {
  margin-left: auto; background: var(--accent); color: white;
  border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700;
}

/* mobile @media मध्ये हे ADD करा */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg2);
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: auto;
}
  .admin-info { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.admin-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; color: white; font-size: 14px;
}
.admin-name { font-size: 13px; font-weight: 600; }
.admin-role { font-size: 11px; color: var(--text2); }
.logout-btn {
  width: 100%; padding: 9px; border-radius: 8px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
  color: var(--red); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s;
}
.logout-btn:hover { background: rgba(239,68,68,0.2); }

/* MAIN */
.main { flex: 1; display: flex; flex-direction: column; min-height: 100vh; overflow: auto; min-width: 0; }
.topbar {
  padding: 14px 24px; background: var(--bg2);
  border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  position: sticky; top: 0; z-index: 100;
}
.topbar-titles { flex: 1; min-width: 0; overflow: hidden; }
.topbar-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
.content { padding: 24px 28px; flex: 1; }
.loading-pill { background: rgba(245,158,11,0.15); color: var(--yellow); border: 1px solid rgba(245,158,11,0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }

.sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.58); z-index: 490; backdrop-filter: blur(2px); }

/* MOBILE */
@media (max-width: 768px) {
  .admin-body { display: block; min-height: 100dvh; overflow-x: hidden; }
  .sidebar {
    position: fixed !important; top: 0; left: 0; bottom: 0;
    width: 280px !important; max-width: 82vw; height: 100dvh !important;
    min-height: 100dvh !important; background: var(--bg2) !important;
    border-right: 1px solid var(--border); z-index: 500;
    transform: translateX(-100%); transition: transform 0.28s ease;
    display: flex !important; flex-direction: column !important;
    overflow: hidden; box-shadow: none;
  }
  .sidebar.sidebar-open { transform: translateX(0); box-shadow: 10px 0 30px rgba(0,0,0,0.45); }
 .sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow-y: auto;
  background: var(--bg2);
}

  .sidebar-close-btn {
    display: flex; align-items: center; justify-content: flex-end;
    width: 100%; padding: 14px 16px 8px; background: transparent; border: none;
    color: var(--text2); font-size: 22px; cursor: pointer; flex-shrink: 0;
  }
  .sidebar-logo { padding: 12px 16px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--bg2); }
  .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 12px 10px 16px; overflow-y: auto; background: var(--bg2); }
  .nav-item { width: 100%; display: flex !important; align-items: center; padding: 12px 14px; margin: 0; min-height: 46px; }

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg2);
  position: sticky;
  bottom: 0;
  z-index: 2;
}
.sidebar-overlay { display: block; }
  .hamburger-btn {
    display: flex; flex-direction: column; justify-content: center; gap: 5px;
    width: 38px; height: 38px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; cursor: pointer; padding: 8px 9px; flex-shrink: 0;
  }
  .hamburger-btn span { display: block; width: 100%; height: 2px; background: var(--text); border-radius: 2px; }
  .main { margin-left: 0 !important; width: 100%; }
  .topbar { padding: 12px 16px; }
  .content { padding: 14px 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }
  .form-grid { grid-template-columns: 1fr !important; }
  .toolbar { flex-direction: column; gap: 8px; }
  .two-col-grid { grid-template-columns: 1fr !important; }
  .form-actions { flex-direction: column; }
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal-card { border-radius: 20px 20px 0 0; max-width: 100%; max-height: 88vh; overflow-y: auto; }
  .toast { right: 12px; left: 12px; bottom: 12px; min-width: unset; }
  .ticket-preview-card { flex-direction: column; }
  .seat-btn { width: 32px !important; height: 32px !important; font-size: 10px !important; }
  .sleeper-seat { width: 52px !important; height: 28px !important; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px; }
  .stat-card { padding: 14px; }
  .stat-val { font-size: 18px; }
  .seat-btn { width: 28px !important; height: 28px !important; font-size: 9px !important; }
  .sleeper-seat { width: 44px !important; height: 24px !important; }
}

/* PAGE */
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header h1 { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; }
.page-header p { color: var(--text2); font-size: 13px; margin-top: 4px; }

/* STATS */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; transition: transform 0.15s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-icon { font-size: 24px; margin-bottom: 10px; }
.stat-label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
.stat-card-green .stat-val  { color: var(--green); }
.stat-card-blue .stat-val   { color: var(--blue); }
.stat-card-purple .stat-val { color: var(--purple); }
.stat-card-teal .stat-val   { color: var(--teal); }
.stat-card-orange .stat-val { color: var(--orange); }
.stat-card-yellow .stat-val { color: var(--yellow); }
.stat-card-red .stat-val    { color: var(--red); }
.stat-card-emerald .stat-val{ color: var(--emerald); }
.stat-card-cyan .stat-val   { color: var(--cyan); }
.stat-card-indigo .stat-val { color: var(--indigo); }

.two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .two-col-grid { grid-template-columns: 1fr; } }

.section-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.section-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 14px; }

.form-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
.form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 18px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.05em; }
.form-input, .form-select {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); padding: 9px 12px; font-size: 14px; font-family: 'DM Sans', sans-serif;
  transition: border-color 0.15s; outline: none; width: 100%;
}
.form-input:focus, .form-select:focus { border-color: rgba(230,57,70,0.5); box-shadow: 0 0 0 3px rgba(230,57,70,0.1); }
.form-input::placeholder { color: var(--text2); }
.form-select option { background: var(--bg3); }
.form-actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }

/* PRICE NOTE */
.price-note {
  margin-top: 14px; padding: 10px 14px; border-radius: 8px;
  background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
  color: #93c5fd; font-size: 13px;
}

/* BUTTONS */
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #c1121f);
  color: white; border: none; padding: 10px 22px; border-radius: 8px;
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(230,57,70,0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.15); }
.btn-sm { padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.12s; font-family: 'DM Sans', sans-serif; }
.btn-edit    { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2) !important; }
.btn-edit:hover { background: rgba(59,130,246,0.25); }
.btn-del     { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.2) !important; }
.btn-del:hover { background: rgba(239,68,68,0.25); }
.btn-success { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2) !important; }
.btn-success:hover { background: rgba(34,197,94,0.25); }
.action-btns { display: flex; gap: 5px; flex-wrap: wrap; }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  padding: 10px 12px; background: var(--bg3); border-bottom: 1px solid var(--border);
  color: var(--text2); font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; text-align: left; white-space: nowrap;
}
.data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:hover { background: rgba(255,255,255,0.02); }
.data-table tbody tr:last-child td { border-bottom: none; }

/* BADGES */
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.badge-green  { background: rgba(34,197,94,0.15);  color: var(--green); }
.badge-yellow { background: rgba(245,158,11,0.15); color: var(--yellow); }
.badge-red    { background: rgba(239,68,68,0.15);  color: var(--red); }
.badge-blue   { background: rgba(59,130,246,0.15); color: var(--blue); }

.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(230,57,70,0.12); border: 1px solid rgba(230,57,70,0.25);
  color: var(--accent2); padding: 4px 10px; border-radius: 20px; font-size: 12px;
}
.chip button { background: none; border: none; cursor: pointer; color: var(--accent2); font-size: 14px; line-height: 1; padding: 0; }

/* ── STANDARD SEAT LAYOUT (Seater-Sleeper) ── */
.seat-legend { display: flex; gap: 16px; flex-wrap: wrap; margin: 14px 0; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); }
.legend-box { width: 20px; height: 20px; border-radius: 4px; display: inline-block; }
.legend-box.available { background: var(--bg3); border: 1px solid var(--border); }
.legend-box.selected  { background: var(--accent); }
.legend-box.booked    { background: rgba(239,68,68,0.4); border: 1px solid var(--red); }
.legend-box.ladies    { background: rgba(168,85,247,0.4); border: 1px solid var(--purple); }
.legend-box.blocked   { background: rgba(100,116,139,0.4); border: 1px solid #64748b; }

.seat-grid-bus { display: flex; flex-direction: column; gap: 8px; }
.seat-row-bus { display: flex; align-items: center; gap: 10px; }
.seat-row-title { font-size: 11px; font-weight: 700; color: var(--text2); width: 32px; text-align: right; flex-shrink: 0; }
.seat-pair { display: flex; gap: 6px; }
.seat-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.seat-btn {
  width: 36px; height: 36px; border-radius: 6px; font-size: 11px; font-weight: 700;
  cursor: pointer; border: 1px solid var(--border); transition: all 0.12s; font-family: 'DM Sans', sans-serif;
}
.seat-btn.available { background: var(--bg3); color: var(--text2); }
.seat-btn.available:hover { background: rgba(230,57,70,0.2); border-color: var(--accent); color: var(--accent); }
.seat-btn.selected  { background: var(--accent); color: white; border-color: var(--accent); }
.seat-btn.booked    { background: rgba(239,68,68,0.25); color: var(--red); border-color: var(--red); cursor: pointer; }
.seat-btn.ladies    { background: rgba(168,85,247,0.25); color: var(--purple); border-color: var(--purple); }
.seat-btn.blocked   { background: rgba(100,116,139,0.2); color: #64748b; cursor: not-allowed; }
.seat-mini-actions { display: flex; gap: 2px; }
.mini-seat-tag { background: none; border: none; font-size: 9px; cursor: pointer; color: var(--text2); padding: 1px 2px; border-radius: 3px; }
.mini-seat-tag:hover, .mini-seat-tag.active { color: var(--accent); }

/* ── AC SLEEPER 2x2 LAYOUT ── */
.sleeper-driver-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; padding: 0 4px;
}
.sleeper-side-label { font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.08em; }
.sleeper-driver-box {
  background: rgba(230,57,70,0.15); border: 1px solid rgba(230,57,70,0.3);
  color: var(--accent2); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.sleeper-header-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 8px; padding: 0 4px;
}
.sleeper-deck-labels {
  display: flex; gap: 6px; flex: 1; justify-content: center;
}
.sleeper-deck-labels span {
  font-size: 10px; font-weight: 700; color: var(--text2);
  text-transform: uppercase; letter-spacing: 0.06em; width: 64px; text-align: center;
}
.sleeper-aisle-gap { width: 28px; flex-shrink: 0; text-align: center; }

.sleeper-grid { display: flex; flex-direction: column; gap: 6px; overflow-x: auto; }
.sleeper-row {
  display: flex; align-items: center; gap: 0;
}
.sleeper-pair { display: flex; gap: 4px; }
.left-pair { margin-right: 4px; }
.right-pair { margin-left: 4px; }
.sleeper-aisle-gap {
  width: 28px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.sleeper-row-num { font-size: 10px; color: var(--text2); font-weight: 700; }

.sleeper-seat-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.sleeper-seat {
  width: 64px; height: 32px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  cursor: pointer; border: 1px solid var(--border); transition: all 0.12s;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
}
.sleeper-icon { font-size: 12px; }
.sleeper-num { font-size: 11px; font-weight: 700; }
.sleeper-seat.available { background: var(--bg3); color: var(--text2); }
.sleeper-seat.available:hover { background: rgba(230,57,70,0.2); border-color: var(--accent); color: var(--accent); }
.sleeper-seat.selected  { background: var(--accent); color: white; border-color: var(--accent); }
.sleeper-seat.booked    { background: rgba(239,68,68,0.25); color: var(--red); border-color: var(--red); cursor: pointer; }
.sleeper-seat.ladies    { background: rgba(168,85,247,0.25); color: var(--purple); border-color: var(--purple); }
.sleeper-seat.blocked   { background: rgba(100,116,139,0.2); color: #64748b; cursor: not-allowed; }

/* TICKET PREVIEW */
.ticket-preview-card {
  background: linear-gradient(135deg, #7f1d1d, #dc2626);
  border-radius: 16px; padding: 20px 24px;
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; flex-wrap: wrap;
}
.ticket-preview-info h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: white; margin-bottom: 6px; }
.ticket-preview-info div { color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 4px; }
.ticket-preview-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.btn-ticket-print { background: white; color: #991b1b; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; }
.btn-ticket-wa { background: #25D366; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; }

/* MODAL */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px; backdrop-filter: blur(4px);
}
.modal-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; padding: 24px; width: 100%; max-width: 700px;
  max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow);
}
.seat-popup-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.popup-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.popup-label { color: var(--text2); font-size: 13px; }
.popup-val { font-weight: 600; font-size: 13px; }

/* RECENT */
.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg3); border-radius: 8px; }
.recent-title { font-weight: 600; font-size: 14px; }
.recent-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }

/* BIG HIGHLIGHT */
.big-highlight { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--accent2); padding: 12px 0; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
.empty-text { color: var(--text2); font-size: 14px; }

/* LOGIN */
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
.login-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 420px;
  text-align: center; box-shadow: var(--shadow);
}
.login-logo { font-size: 48px; margin-bottom: 12px; }
.login-card h1 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
.login-card p { color: var(--text2); font-size: 14px; margin-bottom: 28px; }
.login-form { display: flex; flex-direction: column; gap: 12px; text-align: left; }
.login-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--red); padding: 10px 14px; border-radius: 8px; font-size: 13px; }
.login-btn { padding: 12px; font-size: 15px; margin-top: 4px; }

/* TOAST */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 20px; border-radius: 10px;
  display: flex; align-items: center; gap: 10px;
  font-weight: 600; font-size: 14px;
  transform: translateY(80px); opacity: 0; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  min-width: 240px; box-shadow: var(--shadow);
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-success { background: #064e3b; border: 1px solid var(--green); color: #4ade80; }
.toast-error   { background: #450a0a; border: 1px solid var(--red); color: #fca5a5; }

/* SCROLLBAR */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2d3748; }
/* Mobile/Desktop toggle */
.desktop-only { display: table; }
.mobile-cards  { display: none; }

@media (max-width: 640px) {
  .desktop-only { display: none !important; }
  .mobile-cards  { display: block; }
}

/* Customer Card styles */
.customer-card {
  background: #131722; border: 1px solid #2a3040;
  border-radius: 12px; padding: 14px; margin-bottom: 10px;
}
.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.card-name { font-weight: 700; font-size: 15px; }
.card-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
.card-row span { color: #cbd5e1; }
.card-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a3040; }
.card-actions { display: flex; gap: 8px; margin-left: auto; }
code { font-family: 'Courier New', monospace; font-size: 12px; background: var(--bg3); padding: 2px 6px; border-radius: 4px; }
@media (max-width: 640px) {
  .desktop-only { display: none !important; }
  .mobile-cards  { display: block; }
}
  .seat-btn.booked {
    background: rgba(245,158,11,0.25);
    color: var(--yellow);
    border-color: var(--yellow);
    cursor: pointer;
  }
 .seat-btn.blocked {
  background: #1f2937;
  color: #9ca3af;
  border: 1px dashed #6b7280;
  cursor: not-allowed;
}
.topbar-logout-btn {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
  flex-shrink: 0;
}
.topbar-logout-btn:hover {
  background: rgba(239,68,68,0.28);
}

@media (max-width: 768px) {
  .topbar-logout-btn {
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 6px;
  }
}
  .topbar-logout-btn:hover {
  background: rgba(239,68,68,0.28);
}

/* Mobile वर फक्त icon दाखव */
@media (max-width: 768px) {
  .topbar-logout-btn {
    padding: 7px 10px;
    font-size: 16px;
  }
  .topbar-logout-btn::after {
    content: '';
  }
}
`;