// SleeperLayout.jsx — AC Sleeper 2×2 layout
// Left side: Lower(E,G,5,7,13,15,21,23,31,29,33,35) | Upper(F,H,6,8,14,16,22,24,32,30,34,36)
// Right side: Lower(A,C,1,3,9,11,17,19,25,27,37,39) | Upper(B,D,2,4,10,12,18,20,26,28,38,40)

import React from "react";

export const AC_SLEEPER_ROWS = [
  { left: { lower: "E", upper: "F" }, right: { lower: "A", upper: "B" } },
  { left: { lower: "G", upper: "H" }, right: { lower: "C", upper: "D" } },
  { left: { lower: "5", upper: "6" }, right: { lower: "1", upper: "2" } },
  { left: { lower: "7", upper: "8" }, right: { lower: "3", upper: "4" } },
  { left: { lower: "13", upper: "14" }, right: { lower: "9",  upper: "10" } },
  { left: { lower: "15", upper: "16" }, right: { lower: "11", upper: "12" } },
  { left: { lower: "21", upper: "22" }, right: { lower: "17", upper: "18" } },
  { left: { lower: "23", upper: "24" }, right: { lower: "19", upper: "20" } },
  { left: { lower: "31", upper: "32" }, right: { lower: "25", upper: "26" } },
  { left: { lower: "29", upper: "30" }, right: { lower: "27", upper: "28" } },
  { left: { lower: "33", upper: "34" }, right: { lower: "37", upper: "38" } },
  { left: { lower: "35", upper: "36" }, right: { lower: "39", upper: "40" } },
];

export default function SleeperLayout({
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

  function renderSeat(seat) {
    const status = getSeatStatus(seat);
    const statusClass = `sl-seat sl-seat--${status}`;
    return (
      <div key={seat} className="sl-seat-wrap">
        <button
          type="button"
          className={statusClass}
          title={status === "booked" ? "Click to view booking" : `Seat ${seat}`}
          onClick={() => handleClick(seat)}
        >
          <span className="sl-bed-icon">🛏</span>
          <span className="sl-seat-num">{seat}</span>
        </button>
        {tripId && (
          <div className="sl-mini-actions">
            <button
              type="button"
              className={`sl-tag${ladiesSeats.includes(String(seat)) ? " sl-tag--active" : ""}`}
              title="Toggle ladies seat"
              onClick={() => toggleTripSeatFlag && toggleTripSeatFlag(
                selectedTrip?._id || selectedTrip?.id, seat, "ladiesSeats"
              )}
            >F</button>
            <button
              type="button"
              className={`sl-tag${blockedSeats.includes(String(seat)) ? " sl-tag--active" : ""}`}
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

  const totalSeats = AC_SLEEPER_ROWS.length * 4;
  const availableCount = totalSeats - bookedSeats.length - blockedSeats.length;

  return (
    <div className="sl-root">
      <style>{sleeperStyles}</style>

      {/* Header */}
      <div className="sl-header">
        <div className="sl-header-title">
          <span className="sl-header-icon">🛏️</span>
          AC Sleeper — 2×2 Layout
        </div>
        <div className="sl-avail-badge">{availableCount} available</div>
      </div>

      {/* Driver bar */}
      <div className="sl-driver-bar">
        <span>DRIVER →</span>
      </div>

      {/* Price strip (optional — pass price as prop if needed) */}

      {/* Column headers */}
      <div className="sl-col-headers">
        <div className="sl-side-group">
          <div className="sl-side-label">LEFT SIDE</div>
          <div className="sl-deck-labels">
            <span>Lower</span>
            <span>Upper</span>
          </div>
        </div>
        <div className="sl-aisle" />
        <div className="sl-side-group">
          <div className="sl-side-label">RIGHT SIDE</div>
          <div className="sl-deck-labels">
            <span>Lower</span>
            <span>Upper</span>
          </div>
        </div>
      </div>

      {/* Seat grid */}
      <div className="sl-grid">
        {AC_SLEEPER_ROWS.map((row, i) => (
          <div key={i} className="sl-row">
            {/* Left pair */}
            <div className="sl-pair">
              {renderSeat(row.left.lower)}
              {renderSeat(row.left.upper)}
            </div>
            {/* Aisle */}
            <div className="sl-aisle-divider">
              <span className="sl-row-num">{i + 1}</span>
            </div>
            {/* Right pair */}
            <div className="sl-pair">
              {renderSeat(row.right.lower)}
              {renderSeat(row.right.upper)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="sl-legend">
        {[
          ["available", "Available"],
          ["selected",  "Selected"],
          ["booked",    "Booked"],
          ["ladies",    "Ladies"],
          ["blocked",   "Blocked"],
        ].map(([cls, label]) => (
          <span key={cls} className="sl-legend-item">
            <span className={`sl-legend-box sl-legend-box--${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const sleeperStyles = `
.sl-root {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E5E5EA;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
}
.sl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F2F2F7;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
}
.sl-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #2C3E50;
}
.sl-header-icon { font-size: 18px; }
.sl-avail-badge {
  background: #EAFAF1;
  border: 1px solid #A9DFBF;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #27AE60;
}
.sl-driver-bar {
  background: #2C3E50;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  padding: 5px 14px;
}
.sl-col-headers {
  display: flex;
  align-items: flex-end;
  padding: 10px 12px 4px;
  gap: 0;
}
.sl-side-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sl-side-label {
  font-size: 10px;
  font-weight: 700;
  color: #555;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.sl-deck-labels {
  display: flex;
  gap: 4px;
  width: 100%;
  justify-content: center;
}
.sl-deck-labels span {
  font-size: 9px;
  color: #999;
  font-weight: 600;
  width: 52px;
  text-align: center;
}
.sl-aisle { width: 28px; flex-shrink: 0; }

.sl-grid {
  padding: 6px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-x: auto;
}
.sl-row {
  display: flex;
  align-items: center;
}
.sl-pair {
  flex: 1;
  display: flex;
  gap: 4px;
  justify-content: center;
}
.sl-aisle-divider {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sl-row-num {
  font-size: 10px;
  color: #bbb;
  font-weight: 700;
}
.sl-seat-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.sl-seat {
  width: 52px;
  height: 44px;
  border-radius: 8px;
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
}
.sl-seat:hover { transform: scale(1.04); }
.sl-bed-icon { font-size: 13px; line-height: 1; }
.sl-seat-num { font-size: 10px; font-weight: 700; color: #1A1A1A; line-height: 1; }

.sl-seat--available { background: #fff; border-color: #D5D5D5; }
.sl-seat--available:hover { background: #FDECEA; border-color: #e63946; }
.sl-seat--available:hover .sl-seat-num { color: #e63946; }
.sl-seat--selected { background: #e63946; border-color: #e63946; }
.sl-seat--selected .sl-seat-num { color: #fff; }
.sl-seat--booked { background: rgba(243,156,18,0.2); border-color: #F39C12; cursor: pointer; }
.sl-seat--booked .sl-seat-num { color: #E67E22; }
.sl-seat--ladies { background: rgba(155,89,182,0.15); border-color: #9B59B6; }
.sl-seat--ladies .sl-seat-num { color: #8E44AD; }
.sl-seat--blocked { background: rgba(100,116,139,0.15); border-color: #94A3B8; cursor: not-allowed; }
.sl-seat--blocked .sl-seat-num { color: #94A3B8; }

.sl-mini-actions { display: flex; gap: 2px; }
.sl-tag {
  background: none; border: none; font-size: 9px;
  cursor: pointer; color: #bbb; padding: 1px 3px; border-radius: 3px;
}
.sl-tag:hover, .sl-tag--active { color: #e63946; }

.sl-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid #F0F0F0;
  background: #FAFAFA;
}
.sl-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #555;
  font-weight: 500;
}
.sl-legend-box {
  width: 12px; height: 12px;
  border-radius: 3px;
  display: inline-block;
}
.sl-legend-box--available { background: #fff; border: 1px solid #ccc; }
.sl-legend-box--selected  { background: #e63946; }
.sl-legend-box--booked    { background: #F39C12; }
.sl-legend-box--ladies    { background: #9B59B6; }
.sl-legend-box--blocked   { background: #94A3B8; }

@media (max-width: 480px) {
  .sl-seat { width: 40px; height: 38px; }
  .sl-bed-icon { font-size: 11px; }
  .sl-seat-num { font-size: 9px; }
  .sl-aisle-divider { width: 18px; }
  .sl-deck-labels span { width: 40px; }
}
`;