import React, { useState } from "react";

export default function SeatLayout({ seats }) {
  const [selected, setSelected] = useState([]);

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;

    if (selected.includes(seat.seatNumber)) {
      setSelected(selected.filter((s) => s !== seat.seatNumber));
    } else {
      setSelected([...selected, seat.seatNumber]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Select Seats</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 60px)", gap: "12px" }}>
        {seats.map((seat) => {
          const isSelected = selected.includes(seat.seatNumber);

          return (
            <div
              key={seat.seatNumber}
              onClick={() => toggleSeat(seat)}
              style={{
                height: "60px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: seat.isBooked ? "not-allowed" : "pointer",
                background: seat.isBooked
                  ? "#ef4444"
                  : isSelected
                  ? "#22c55e"
                  : "#1e293b",
                color: "white",
              }}
            >
              {seat.seatNumber}
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: "20px" }}>
        Selected: {selected.join(", ") || "None"}
      </h3>
    </div>
  );
}