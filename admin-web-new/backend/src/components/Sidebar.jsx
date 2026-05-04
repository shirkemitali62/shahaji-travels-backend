import React, { useEffect, useState } from "react";
import { fetchTripById } from "../services/tripService";

const lowerSeats = [
  "V1", "V2", "V3", "V4", "V5", "V6",
  "V7", "V8", "V9", "V10", "V11", "V12",
];

const upperSeats = [
  "A1", "A2", "A3", "A4", "A5", "A6",
];

export default function SeatLayout({ tripId, selectedSeats = [], setSelectedSeats }) {
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tripInfo, setTripInfo] = useState(null);

  useEffect(() => {
    if (!tripId) {
      setBookedSeats([]);
      setTripInfo(null);
      return;
    }

    const loadTrip = async () => {
      try {
        setLoading(true);
        const data = await fetchTripById(tripId);

        if (data.success) {
          setTripInfo(data.trip);
          setBookedSeats(data.trip.bookedSeats || []);
        } else {
          setTripInfo(null);
          setBookedSeats([]);
        }
      } catch (error) {
        console.error("Seat layout fetch error:", error);
        setTripInfo(null);
        setBookedSeats([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return;

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((item) => item !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const renderSeat = (seat) => {
    const isBooked = bookedSeats.includes(seat);
    const isSelected = selectedSeats.includes(seat);

    let className = "seat-btn";
    if (isBooked) className += " booked";
    else if (isSelected) className += " selected";
    else className += " available";

    return (
      <button
        key={seat}
        type="button"
        className={className}
        onClick={() => toggleSeat(seat)}
        disabled={isBooked}
      >
        {seat}
      </button>
    );
  };

  return (
    <div className="seat-layout-wrapper">
      <h3>Seat Layout</h3>

      {!tripId && <p>Please select a trip first.</p>}
      {loading && <p>Loading seats...</p>}

      {tripInfo && (
        <div className="trip-info-box">
          <p><strong>Date:</strong> {tripInfo.tripDate}</p>
          <p><strong>Price:</strong> ₹{tripInfo.price}</p>
          <p><strong>Booked:</strong> {bookedSeats.length}</p>
          <p><strong>Available:</strong> {(tripInfo.totalSeats || 0) - bookedSeats.length}</p>
        </div>
      )}

      {tripId && !loading && (
        <>
          <div className="legend">
            <span><button type="button" className="seat-btn available"> </button> Available</span>
            <span><button type="button" className="seat-btn selected"> </button> Selected</span>
            <span><button type="button" className="seat-btn booked"> </button> Booked</span>
          </div>

          <div className="deck-section">
            <h4>Lower Deck</h4>
            <div className="seat-grid">
              {lowerSeats.map(renderSeat)}
            </div>
          </div>

          <div className="deck-section">
            <h4>Upper Deck</h4>
            <div className="seat-grid">
              {upperSeats.map(renderSeat)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}