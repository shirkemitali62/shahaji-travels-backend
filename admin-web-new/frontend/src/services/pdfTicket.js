import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function getSeatDisplayLabel(seatNo) {
  const LOWER = [
    ["V1", ["1", "2"]],
    ["V2", ["3", "4"]],
    ["V3", ["5", "6"]],
    ["V4", ["7", "8"]],
    ["V5", ["9", "10"]],
    ["V6", ["11", "12"]],
    ["V7", ["13", "14"]],
    ["V8", ["15", "16"]],
    ["V9", ["17", "18"]],
    ["V10", ["19", "20"]],
    ["V11", ["21", "22"]],
    ["V12", ["23", "24"]]
  ];

  const UPPER = [
    ["A1", ["A", "B"]],
    ["A2", ["C", "D"]],
    ["A3", ["E", "F"]],
    ["A4", ["G", "H"]],
    ["A5", ["I", "J"]],
    ["A6", ["K", "L"]]
  ];

  for (const [row, seats] of LOWER) {
    if (seats.includes(String(seatNo))) return `${row} - ${seatNo}`;
  }
  for (const [row, seats] of UPPER) {
    if (seats.includes(String(seatNo))) return `${row} - ${seatNo}`;
  }
  return String(seatNo || "-");
}

function safeFileName(text) {
  return String(text || "ticket").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function createTicketPdf(booking) {
  return new Promise((resolve, reject) => {
    try {
      const bookingCode =
        booking?.bookingCode || `BK${String(Date.now()).slice(-6)}`;
      const fileName = `${safeFileName(bookingCode)}.pdf`;
      const filePath = path.join(process.cwd(), "tickets", fileName);

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc
        .rect(0, 0, doc.page.width, 110)
        .fill("#1d4ed8");

      doc
        .fillColor("#ffffff")
        .fontSize(24)
        .text("SHAHAJI TOURS & TRAVELS", 40, 30);

      doc
        .fontSize(12)
        .text("Professional Bus Ticket", 40, 62);

      doc
        .fontSize(12)
        .text(`Booking ID: ${bookingCode}`, 380, 30, { align: "right", width: 170 });

      doc.moveDown(4);

      // Reset color
      doc.fillColor("#111827");

      const fields = [
        ["Passenger", booking?.passengerName || "-"],
        ["Phone", booking?.phone || "-"],
        ["Route", `${booking?.boardingPoint || "-"} → ${booking?.droppingPoint || "-"}`],
        ["Journey Date", booking?.journeyDate || booking?.date || "-"],
        ["Seat", getSeatDisplayLabel(booking?.seatNo)],
        ["Bus No", booking?.busNo || booking?.bus || "-"],
        ["Age / Gender", `${booking?.age || "-"} / ${booking?.gender || "-"}`],
        ["Amount", `₹${booking?.amount || 0}`],
        ["Payment Mode", booking?.paymentMode || "-"],
        ["Payment Status", booking?.paymentStatus || "-"],
        ["Refund Status", booking?.refundStatus || "-"],
        ["Conductor Note", booking?.conductorNote || "-"]
      ];

      let y = 140;
      for (const [label, value] of fields) {
        doc.fontSize(11).fillColor("#64748b").text(label, 40, y);
        doc.fontSize(14).fillColor("#111827").text(String(value), 180, y);
        y += 28;
      }

      doc
        .moveTo(40, y + 10)
        .lineTo(555, y + 10)
        .dash(6, { space: 4 })
        .stroke("#cbd5e1")
        .undash();

      doc
        .fillColor("#9a3412")
        .fontSize(11)
        .text(
          "Please arrive at the boarding point at least 15 minutes before departure.",
          40,
          y + 28
        );

      doc
        .fillColor("#64748b")
        .fontSize(10)
        .text(
          "This is a system-generated ticket. Thank you for choosing Shahaji Tours & Travels.",
          40,
          y + 52
        );

      doc.end();

      stream.on("finish", () => {
        resolve({ fileName, filePath });
      });
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}