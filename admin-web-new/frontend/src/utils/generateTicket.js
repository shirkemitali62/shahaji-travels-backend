function getSeatDisplayLabel(seatNo) {
  const LOWER_SEAT_PAIRS = [
    { row: "V1", seats: ["1", "2"] },
    { row: "V2", seats: ["3", "4"] },
    { row: "V3", seats: ["5", "6"] },
    { row: "V4", seats: ["7", "8"] },
    { row: "V5", seats: ["9", "10"] },
    { row: "V6", seats: ["11", "12"] },
    { row: "V7", seats: ["13", "14"] },
    { row: "V8", seats: ["15", "16"] },
    { row: "V9", seats: ["17", "18"] },
    { row: "V10", seats: ["19", "20"] },
    { row: "V11", seats: ["21", "22"] },
    { row: "V12", seats: ["23", "24"] },
  ];

  const UPPER_SEAT_PAIRS = [
    { row: "A1", seats: ["A", "B"] },
    { row: "A2", seats: ["C", "D"] },
    { row: "A3", seats: ["E", "F"] },
    { row: "A4", seats: ["G", "H"] },
    { row: "A5", seats: ["I", "J"] },
    { row: "A6", seats: ["K", "L"] },
  ];

  const lower = LOWER_SEAT_PAIRS.find((row) =>
    row.seats.includes(String(seatNo))
  );
  if (lower) return `${lower.row} - ${seatNo}`;

  const upper = UPPER_SEAT_PAIRS.find((row) =>
    row.seats.includes(String(seatNo))
  );
  if (upper) return `${upper.row} - ${seatNo}`;

  return seatNo || "-";
}

function getPaymentPillClass(paymentStatus) {
  if (paymentStatus === "Paid") return "green";
  if (paymentStatus === "Pending") return "yellow";
  return "red";
}

function getRefundPillClass(refundStatus) {
  if (refundStatus === "Refunded") return "red";
  if (refundStatus === "Requested" || refundStatus === "Processing") return "yellow";
  return "blue";
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

function getLogoUrl() {
  return "/logo.png";
}

export function getWhatsAppTicketMessage(booking) {
  const bookingId =
    booking?.bookingCode || `BK${String(booking?.id || "").slice(-6)}`;
  const passenger = booking?.passengerName || "-";
  const phone = booking?.phone || "-";
  const boarding = booking?.boardingPoint || "-";
  const dropping = booking?.droppingPoint || "-";
  const seatText = getSeatDisplayLabel(booking?.seatNo);
  const age = booking?.age || "-";
  const gender = booking?.gender || "-";
  const journeyDate = booking?.journeyDate || booking?.date || "-";
  const busNo = booking?.busNo || booking?.bus || "-";
  const amount = booking?.amount || 0;
  const paymentMode = booking?.paymentMode || "-";
  const paymentStatus = booking?.paymentStatus || "-";
  const refundStatus = booking?.refundStatus || "-";

  return `*SHAHAJI TOURS & TRAVELS*
Your booking is confirmed ✅

*Booking ID:* ${bookingId}
*Passenger:* ${passenger}
*Mobile:* ${phone}
*Route:* ${boarding} → ${dropping}
*Journey Date:* ${journeyDate}
*Seat:* ${seatText}
*Bus No:* ${busNo}
*Age/Gender:* ${age} / ${gender}
*Amount:* ₹${amount}
*Payment Mode:* ${paymentMode}
*Payment Status:* ${paymentStatus}
*Refund Status:* ${refundStatus}

Please arrive 15 minutes before departure.
Thank you for choosing Shahaji Tours & Travels.`;
}

export function sendTicketOnWhatsApp(booking) {
  const phone = normalizePhone(booking?.phone);
  const message = getWhatsAppTicketMessage(booking);
  const encodedMessage = encodeURIComponent(message);

  const url = phone
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  window.open(url, "_blank");
}

export function generateTicket(booking) {
  const seatText = getSeatDisplayLabel(booking?.seatNo);
  const bookingId =
    booking?.bookingCode || `BK${String(booking?.id || "").slice(-6)}`;
  const passenger = booking?.passengerName || "-";
  const phone = booking?.phone || "-";
  const boarding = booking?.boardingPoint || "-";
  const dropping = booking?.droppingPoint || "-";
  const age = booking?.age || "-";
  const gender = booking?.gender || "-";
  const journeyDate = booking?.journeyDate || booking?.date || "-";
  const busNo = booking?.busNo || booking?.bus || "-";
  const amount = booking?.amount || 0;
  const paymentMode = booking?.paymentMode || "-";
  const paymentStatus = booking?.paymentStatus || "-";
  const refundStatus = booking?.refundStatus || "-";
  const conductorNote = booking?.conductorNote || "-";
  const logoUrl = getLogoUrl();

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Shahaji Travels Ticket</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f7fb;
          color: #111827;
        }

        .ticket-wrap {
          max-width: 920px;
          margin: 0 auto;
        }

        .ticket {
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #dbe3ef;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.08);
        }

        .ticket-header {
          background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
          color: white;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .brand-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand-logo {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #fff;
        }

        .brand h1 {
          margin: 0;
          font-size: 32px;
          letter-spacing: 1px;
        }

        .brand p {
          margin: 6px 0 0;
          font-size: 14px;
          opacity: 0.92;
        }

        .ticket-id-box {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 14px 18px;
          border-radius: 16px;
          min-width: 220px;
          text-align: right;
        }

        .ticket-id-box .label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .ticket-id-box .value {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .route-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 24px 28px 10px;
        }

        .point {
          flex: 1;
        }

        .point .city {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .point .sub {
          margin-top: 6px;
          color: #64748b;
          font-size: 13px;
        }

        .point.right {
          text-align: right;
        }

        .route-line {
          width: 140px;
          min-width: 140px;
          text-align: center;
          color: #1d4ed8;
          font-weight: 800;
          font-size: 20px;
        }

        .route-line .tiny {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          font-weight: 600;
        }

        .divider {
          border-top: 2px dashed #d6dfeb;
          margin: 16px 28px;
        }

        .section {
          padding: 0 28px 24px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 14px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .info-card {
          background: #f8fbff;
          border: 1px solid #dbe7f4;
          border-radius: 16px;
          padding: 14px;
        }

        .info-card .k {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .info-card .v {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }

        .fare-box {
          margin-top: 18px;
          background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
          border: 1px solid #cdd9f7;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .fare-left .title {
          font-size: 13px;
          color: #64748b;
        }

        .fare-left .amount {
          font-size: 34px;
          font-weight: 800;
          color: #1d4ed8;
          margin-top: 4px;
        }

        .status-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .pill {
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .pill.blue {
          background: #dbeafe;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .pill.green {
          background: #dcfce7;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .pill.yellow {
          background: #fef3c7;
          color: #b45309;
          border-color: #fde68a;
        }

        .pill.red {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .note-box {
          margin-top: 18px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.6;
        }

        .footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 18px 28px 24px;
          font-size: 12px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .footer strong {
          color: #0f172a;
        }

        @media print {
          body {
            padding: 0;
            background: white;
          }

          .ticket {
            border: none;
            box-shadow: none;
            border-radius: 0;
          }
        }

        @media (max-width: 768px) {
          .ticket-header,
          .route-strip,
          .fare-box,
          .footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .ticket-id-box,
          .point.right {
            text-align: left;
          }

          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .route-line {
            width: 100%;
            min-width: auto;
          }

          .status-wrap {
            justify-content: flex-start;
          }

          .brand-wrap {
            align-items: flex-start;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket-wrap">
        <div class="ticket">
          <div class="ticket-header">
            <div class="brand-wrap">
              <div class="brand-logo">
                <img src="${logoUrl}" alt="Shahaji Travels Logo" />
              </div>
              <div class="brand">
                <h1>SHAHAJI</h1>
                <p>Tours & Travels • Professional Bus Ticket</p>
              </div>
            </div>

            <div class="ticket-id-box">
              <div class="label">BOOKING ID</div>
              <div class="value">${bookingId}</div>
            </div>
          </div>

          <div class="route-strip">
            <div class="point">
              <div class="city">${boarding}</div>
              <div class="sub">Boarding Point</div>
            </div>

            <div class="route-line">
              →→→
              <span class="tiny">Safe Journey</span>
            </div>

            <div class="point right">
              <div class="city">${dropping}</div>
              <div class="sub">Dropping Point</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">Passenger & Journey Details</div>

            <div class="info-grid">
              <div class="info-card">
                <div class="k">Passenger Name</div>
                <div class="v">${passenger}</div>
              </div>

              <div class="info-card">
                <div class="k">Mobile Number</div>
                <div class="v">${phone}</div>
              </div>

              <div class="info-card">
                <div class="k">Age / Gender</div>
                <div class="v">${age} / ${gender}</div>
              </div>

              <div class="info-card">
                <div class="k">Journey Date</div>
                <div class="v">${journeyDate}</div>
              </div>

              <div class="info-card">
                <div class="k">Seat Number</div>
                <div class="v">${seatText}</div>
              </div>

              <div class="info-card">
                <div class="k">Bus Number</div>
                <div class="v">${busNo}</div>
              </div>

              <div class="info-card">
                <div class="k">Payment Mode</div>
                <div class="v">${paymentMode}</div>
              </div>

              <div class="info-card">
                <div class="k">Conductor Note</div>
                <div class="v">${conductorNote}</div>
              </div>
            </div>

            <div class="fare-box">
              <div class="fare-left">
                <div class="title">Total Fare</div>
                <div class="amount">₹${amount}</div>
              </div>

              <div class="status-wrap">
                <div class="pill ${getPaymentPillClass(paymentStatus)}">
                  Payment: ${paymentStatus}
                </div>
                <div class="pill ${getRefundPillClass(refundStatus)}">
                  Refund: ${refundStatus}
                </div>
              </div>
            </div>

            <div class="note-box">
              Please arrive at the boarding point at least 15 minutes before departure.
              Keep this ticket ready during travel verification.
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Shahaji Tours & Travels</strong><br/>
              Comfortable and trusted travel service
            </div>
            <div>
              This is a system-generated ticket.<br/>
              Thank you for travelling with us.
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function () {
          window.print();
        };
      </script>
    </body>
  </html>
  `;

  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}