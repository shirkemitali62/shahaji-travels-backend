// SeaterSleeperLayout.jsx — AC Seater-Sleeper mixed layout
// Lower deck (seater): L1–L24, 6 rows × 4 seats
// Upper deck (sleeper): U1–U18, 6 rows × 3 seats

import React from "react";

const LOWER_SEAT_PAIRS = [
  { row: "R1", seats: ["L1",  "L2",  "L3",  "L4"]  },
  { row: "R2", seats: ["L5",  "L6",  "L7",  "L8"]  },
  { row: "R3", seats: ["L9",  "L10", "L11", "L12"] },
  { row: "R4", seats: ["L13", "L14", "L15", "L16"] },
  { row: "R5", seats: ["L17", "L18", "L19", "L20"] },
  { row: "R6", seats: ["L21", "L22", "L23", "L24"] },
];

const UPPER_SEAT_PAIRS = [
  { row: "R1", seats: ["U1",  "U2",  "U3"]  },
  { row: "R2", seats: ["U4",  "U5",  "U6"]  },
  { row: "R3", seats: ["U7",  "U8",  "U9"]  },
  { row: "R4", seats: ["U10", "U11", "U12"] },
  { row: "R5", seats: ["U13", "U14", "U15"] },
  { row: "R6", seats: ["U16", "U17", "U18"] },
];

export default function SeaterSleeperLayout({
  bookedSeats = [],
  selectedSeat = "",
  ladiesSeats = [],
  blockedSeats = [],
  onSeatClick,
  onSeatPopup,
  tripId,
  toggleTripSeatFlag,
  selectedTrip,
}) {
  function getSeatStatus(seat) {
    const s = String(seat);
    if (blockedSeats.includes(s)) return "blocked";
    if (bookedSeats.includes(s)) return "booked";
    if (ladiesSeats.includes(s)) return "ladies";
    if (String(selectedSeat) === s) return "selected";
    return "available";
  }

  function handleClick(seat) {
    const status = getSeatStatus(seat);
    if (status === "booked") { onSeatPopup && onSeatPopup(seat); return; }
    if (status === "blocked") return;
    onSeatClick && onSeatClick(seat);
  }

  function renderSeat(seat, isUpper = false) {
    const status = getSeatStatus(seat);
    const isLadies = ladiesSeats.includes(String(seat));
    const isBlocked = blockedSeats.includes(String(seat));
    return (
      <div key={seat} className="ss-seat-wrap">
        <button
          type="button"
          className={`ss-seat ss-seat--${status}${isUpper ? " ss-seat--upper" : ""}`}
          title={status === "booked" ? "Click to view booking" : `Seat ${seat}`}
          onClick={() => handleClick(seat)}
        >
          {isUpper && <span className="ss-bed-icon">🛏</span>}
          {!isUpper && <span className="ss-chair-icon">💺</span>}
          <span className="ss-seat-num">{seat.replace("L", "").replace("U", "")}</span>
        </button>
        {tripId && (
          <div className="ss-mini-actions">
            <button
              type="button"
              className={`ss-tag${isLadies ? " ss-tag--active" : ""}`}
              title="Toggle ladies seat"
              onClick={() => toggleTripSeatFlag && toggleTripSeatFlag(
                selectedTrip?._id || selectedTrip?.id, seat, "ladiesSeats"
              )}
            >F</button>
            <button
              type="button"
              className={`ss-tag${isBlocked ? " ss-tag--active" : ""}`}
              title="Toggle blocked seat"
              onClick={() => toggleTripSeatFlag && toggleTripSeatFlag(
                selectedTrip?._id || selectedTrip?.id, seat, "blockedSeats"
              )}
            >X</button>
          </div>
        )}
      </div>
    );
  }

  function renderDeck(pairs, deckTitle, isUpper) {
    const icon = isUpper ? "🛏️" : "💺";
    const allSeats = pairs.flatMap(p => p.seats);
    const available = allSeats.filter(s =>
      !bookedSeats.includes(s) && !blockedSeats.includes(s)
    ).length;

    return (
      <div className="ss-deck">
        <div className="ss-deck-header">
          <div className="ss-deck-title">{icon} {deckTitle}</div>
          <div className="ss-avail-badge">{available} available</div>
        </div>
        <div className="ss-driver-bar">DRIVER →</div>

        <div className="ss-col-headers">
          <div className="ss-row-label-spacer" />
          {isUpper ? (
            <div className="ss-col-group">
              <span className="ss-col-lbl">Left</span>
              <span className="ss-col-gap" />
              <span className="ss-col-lbl">Mid</span>
              <span className="ss-col-lbl">Right</span>
            </div>
          ) : (
            <div className="ss-col-group">
              <span className="ss-col-lbl">W</span>
              <span className="ss-col-lbl">A</span>
              <span className="ss-col-gap" />
              <span className="ss-col-lbl">A</span>
              <span className="ss-col-lbl">W</span>
            </div>
          )}
        </div>

        <div className="ss-seat-rows">
          {pairs.map((pair) => (
            <div key={pair.row} className="ss-seat-row">
              <div className="ss-row-label">{pair.row}</div>
              {isUpper ? (
                <div className="ss-pair-upper">
                  {renderSeat(pair.seats[0], true)}
                  <div className="ss-aisle" />
                  {renderSeat(pair.seats[1], true)}
                  {renderSeat(pair.seats[2], true)}
                </div>
              ) : (
                <div className="ss-pair-lower">
                  {renderSeat(pair.seats[0], false)}
                  {renderSeat(pair.seats[1], false)}
                  <div className="ss-aisle" />
                  {renderSeat(pair.seats[2], false)}
                  {renderSeat(pair.seats[3], false)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ss-root">
      <style>{seaterSleeperStyles}</style>
      <div className="ss-grid">
        {renderDeck(LOWER_SEAT_PAIRS, "Lower Deck (Seater)", false)}
        {renderDeck(UPPER_SEAT_PAIRS, "Upper Deck (Sleeper)", true)}
      </div>

      {/* Legend */}
      <div className="ss-legend">
        {[
          ["available", "Available"],
          ["selected",  "Selected"],
          ["booked",    "Booked"],
          ["ladies",    "Ladies"],
          ["blocked",   "Blocked"],
        ].map(([cls, label]) => (
          <span key={cls} className="ss-legend-item">
            <span className={`ss-legend-box ss-legend-box--${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const seaterSleeperStyles = `
.ss-root {
  font-family: 'DM Sans', sans-serif;
}
.ss-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 700px) {
  .ss-grid { grid-template-columns: 1fr; }
}
.ss-deck {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E5E5EA;
  overflow: hidden;
}
.ss-deck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F2F2F7;
  padding: 10px 14px;
  border-bottom: 1px solid #E0E0E0;
}
.ss-deck-title {
  font-size: 13px;
  font-weight: 700;
  color: #2C3E50;
}
.ss-avail-badge {
  background: #EAFAF1;
  border: 1px solid #A9DFBF;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #27AE60;
}
.ss-driver-bar {
  background: #2C3E50;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
  padding: 4px 12px;
}
.ss-col-headers {
  display: flex;
  align-items: center;
  padding: 6px 10px 2px;
  gap: 4px;
}
.ss-row-label-spacer { width: 28px; flex-shrink: 0; }
.ss-col-group {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: 1;
}
.ss-col-lbl {
  font-size: 9px;
  font-weight: 600;
  color: #999;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}
.ss-col-gap { width: 14px; flex-shrink: 0; }
.ss-seat-rows {
  padding: 4px 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ss-seat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ss-row-label {
  width: 28px;
  font-size: 10px;
  font-weight: 700;
  color: #bbb;
  flex-shrink: 0;
  text-align: right;
}
.ss-pair-lower, .ss-pair-upper {
  display: flex;
  gap: 4px;
  align-items: center;
}
.ss-aisle {
  width: 14px;
  height: 28px;
  border-left: 1px dashed #E0E0E0;
  flex-shrink: 0;
}
.ss-seat-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.ss-seat {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  border: 1px solid #D5D5D5;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'DM Sans', sans-serif;
  gap: 1px;
  flex-shrink: 0;
}
.ss-seat--upper {
  width: 36px;
  height: 42px;
}
.ss-seat:hover { transform: scale(1.06); }
.ss-chair-icon { font-size: 12px; line-height: 1; }
.ss-bed-icon { font-size: 12px; line-height: 1; }
.ss-seat-num { font-size: 9px; font-weight: 700; color: #1A1A1A; line-height: 1; }

.ss-seat--available { background: #fff; border-color: #D5D5D5; }
.ss-seat--available:hover { background: #FDECEA; border-color: #e63946; }
.ss-seat--available:hover .ss-seat-num { color: #e63946; }
.ss-seat--selected { background: #e63946; border-color: #e63946; }
.ss-seat--selected .ss-seat-num,
.ss-seat--selected .ss-chair-icon,
.ss-seat--selected .ss-bed-icon { color: #fff; filter: brightness(10); }
.ss-seat--booked { background: rgba(243,156,18,0.18); border-color: #F39C12; cursor: pointer; }
.ss-seat--booked .ss-seat-num { color: #E67E22; }
.ss-seat--ladies { background: rgba(155,89,182,0.15); border-color: #9B59B6; }
.ss-seat--ladies .ss-seat-num { color: #8E44AD; }
.ss-seat--blocked { background: rgba(100,116,139,0.12); border-color: #94A3B8; cursor: not-allowed; }
.ss-seat--blocked .ss-seat-num { color: #94A3B8; }

.ss-mini-actions { display: flex; gap: 2px; }
.ss-tag {
  background: none; border: none; font-size: 9px;
  cursor: pointer; color: #ccc; padding: 1px 3px; border-radius: 3px;
}
.ss-tag:hover, .ss-tag--active { color: #e63946; }

.ss-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 0 4px;
}
.ss-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #555;
  font-weight: 500;
}
.ss-legend-box {
  width: 12px; height: 12px;
  border-radius: 3px;
  display: inline-block;
}
.ss-legend-box--available { background: #fff; border: 1px solid #ccc; }
.ss-legend-box--selected  { background: #e63946; }
.ss-legend-box--booked    { background: #F39C12; }
.ss-legend-box--ladies    { background: #9B59B6; }
.ss-legend-box--blocked   { background: #94A3B8; }

@media (max-width: 480px) {
  .ss-seat { width: 30px; height: 30px; }
  .ss-seat--upper { height: 36px; }
  .ss-chair-icon, .ss-bed-icon { font-size: 10px; }
  .ss-seat-num { font-size: 8px; }
}
`;