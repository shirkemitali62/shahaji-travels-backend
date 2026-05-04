import React, { useEffect, useState } from "react";
import { getTripSeats, bookTripSeats } from "../services/api";

export default function SeatLayout({ tripId }) {
  const [tripData, setTripData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    if (tripId) {
      loadSeats();
    }
  }, [tripId]);

  const loadSeats = async () => {
    try {
      const data = await getTripSeats(tripId);
      setTripData(data);
    } catch (error) {
      console.log("Seat load error:", error);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;

    if (selectedSeats.includes(seat.seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat.seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seat.seatNumber]);
    }
  };

  const handleBookSeats = async () => {
    if (!selectedSeats.length) return;

    const result = await bookTripSeats(tripId, selectedSeats);

    if (result.success) {
      alert("Seats booked successfully");
      setSelectedSeats([]);
      loadSeats();
    } else {
      alert(result.message || "Booking failed");
    }
  };

  if (!tripId) {
    return <div className="section-card">Select trip first</div>;
  }

  if (!tripData) {
    return <div className="section-card">Loading seats...</div>;
  }

  const lowerSeats = tripData.seats.filter((s) => s.deck === "Lower");
  const upperSeats = tripData.seats.filter((s) => s.deck === "Upper");
  const singleSeats = tripData.seats.filter((s) => s.deck === "Single");

  const renderSeat = (seat) => {
    const isSelected = selectedSeats.includes(seat.seatNumber);

    return (
      <div
        key={seat.seatNumber}
        className={`seat ${seat.isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => toggleSeat(seat)}
      >
        <div>{seat.seatNumber}</div>
        <small>₹{seat.price}</small>
      </div>
    );
  };

  return (
    <div className="seat-layout-container">
      <h2>{tripData.tripName} Seat Layout</h2>
      <p>
        {tripData.routeName} | {tripData.travelDate}
      </p>

      {lowerSeats.length > 0 && (
        <div className="seat-section">
          <h3>Lower Deck</h3>
          <div className="seat-grid">{lowerSeats.map(renderSeat)}</div>
        </div>
      )}

      {upperSeats.length > 0 && (
        <div className="seat-section">
          <h3>Upper Deck</h3>
          <div className="seat-grid">{upperSeats.map(renderSeat)}</div>
        </div>
      )}

      {singleSeats.length > 0 && (
        <div className="seat-section">
          <h3>Seats</h3>
          <div className="seat-grid">{singleSeats.map(renderSeat)}</div>
        </div>
      )}

      <div className="seat-info">
        <p>Selected Seats: {selectedSeats.join(", ") || "None"}</p>
        <button className="btn-primary" onClick={handleBookSeats}>
          Book Selected Seats
        </button>
      </div>
    </div>
  );
}