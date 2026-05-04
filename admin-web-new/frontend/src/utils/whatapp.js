export const sendWhatsAppTicket = (booking) => {
  const phone = booking.phone;

  if (!phone) {
    alert("Phone number missing");
    return;
  }

  const message = `
🚌 *Shahaji Travels Ticket*

Passenger: ${booking.passengerName}
Route: ${booking.boardingPoint} → ${booking.droppingPoint}
Seat: ${booking.seatNo}
Date: ${booking.date}
Amount: ₹${booking.amount}

🎫 Your ticket is ready!
`;

  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
};