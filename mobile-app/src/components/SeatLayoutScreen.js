import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import PassengerForm from "./PassengerForm";
import TicketScreen from "./TicketScreen";

const PRICE_PER_SEAT = 950;

const lowerDeck = [
  { row: "V1", seats: [{ seatNumber: "1", isBooked: true }, { seatNumber: "2", isBooked: false }] },
  { row: "V2", seats: [{ seatNumber: "3", isBooked: false }, { seatNumber: "4", isBooked: false }] },
  { row: "V3", seats: [{ seatNumber: "5", isBooked: false }, { seatNumber: "6", isBooked: false }] },
  { row: "V4", seats: [{ seatNumber: "7", isBooked: false }, { seatNumber: "8", isBooked: false }] },
  { row: "V5", seats: [{ seatNumber: "9", isBooked: false }, { seatNumber: "10", isBooked: false }] },
  { row: "V6", seats: [{ seatNumber: "11", isBooked: false }, { seatNumber: "12", isBooked: false }] },
  { row: "V7", seats: [{ seatNumber: "13", isBooked: false }, { seatNumber: "14", isBooked: false }] },
  { row: "V8", seats: [{ seatNumber: "15", isBooked: false }, { seatNumber: "16", isBooked: false }] },
  { row: "V9", seats: [{ seatNumber: "17", isBooked: false }, { seatNumber: "18", isBooked: false }] },
  { row: "V10", seats: [{ seatNumber: "19", isBooked: false }, { seatNumber: "20", isBooked: false }] },
  { row: "V11", seats: [{ seatNumber: "21", isBooked: false }, { seatNumber: "22", isBooked: false }] },
  { row: "V12", seats: [{ seatNumber: "23", isBooked: false }, { seatNumber: "24", isBooked: false }] },
];

const upperDeck = [
  { row: "A1", seats: [{ seatNumber: "A", isBooked: false }, { seatNumber: "B", isBooked: true }] },
  { row: "A2", seats: [{ seatNumber: "C", isBooked: false }, { seatNumber: "D", isBooked: false }] },
  { row: "A3", seats: [{ seatNumber: "E", isBooked: false }, { seatNumber: "F", isBooked: false }] },
  { row: "A4", seats: [{ seatNumber: "G", isBooked: false }, { seatNumber: "H", isBooked: false }] },
  { row: "A5", seats: [{ seatNumber: "I", isBooked: false }, { seatNumber: "J", isBooked: false }] },
  { row: "A6", seats: [{ seatNumber: "K", isBooked: false }, { seatNumber: "L", isBooked: false }] },
];

export default function SeatLayoutScreen() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const totalPrice = useMemo(() => selectedSeats.length * PRICE_PER_SEAT, [selectedSeats]);

  const handleSeatPress = (seat) => {
    if (seat.isBooked) return;

    const exists = selectedSeats.includes(seat.seatNumber);

    if (exists) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat.seatNumber));
    } else {
      setSelectedSeats((prev) => [...prev, seat.seatNumber]);
    }
  };

  const handleBookingSuccess = (data) => {
    setBookingData(data);
  };

  const resetToHome = () => {
    setBookingData(null);
    setShowPassengerForm(false);
    setSelectedSeats([]);
  };

  const renderSeat = (seat) => {
    const isSelected = selectedSeats.includes(seat.seatNumber);

    return (
      <TouchableOpacity
        key={seat.seatNumber}
        onPress={() => handleSeatPress(seat)}
        style={[
          styles.seat,
          seat.isBooked ? styles.booked : isSelected ? styles.selected : styles.available,
        ]}
      >
        <Text style={[styles.seatText, seat.isBooked ? styles.bookedText : null]}>
          {seat.seatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDeck = (title, rows) => (
    <View style={styles.deckCard}>
      <Text style={styles.deckTitle}>{title}</Text>

      {rows.map((rowItem) => (
        <View key={rowItem.row} style={styles.rowWrap}>
          <Text style={styles.rowLabel}>{rowItem.row}</Text>
          <View style={styles.seatPair}>
            {rowItem.seats.map((seat) => renderSeat(seat))}
          </View>
        </View>
      ))}
    </View>
  );

  if (bookingData) {
    return <TicketScreen bookingData={bookingData} onBackHome={resetToHome} />;
  }

  if (showPassengerForm) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowPassengerForm(false)}>
          <Text style={styles.backButtonText}>? Back to Seats</Text>
        </TouchableOpacity>

        <PassengerForm
          selectedSeats={selectedSeats}
          totalPrice={totalPrice}
          onBookingSuccess={handleBookingSuccess}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.brand}>Shahaji Travels</Text>
        <Text style={styles.routeText}>Pune ? Mumbai</Text>
        <Text style={styles.helperText}>Choose your preferred seat</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.available]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.booked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      {renderDeck("Lower Deck", lowerDeck)}
      {renderDeck("Upper Deck", upperDeck)}

      <View style={styles.bottomCard}>
        <Text style={styles.infoTitle}>Booking Summary</Text>
        <Text style={styles.infoText}>
          Selected Seats: {selectedSeats.length ? selectedSeats.join(", ") : "None"}
        </Text>
        <Text style={styles.infoPrice}>Total Price: ?{totalPrice}</Text>

        <TouchableOpacity
          style={[styles.bookButton, selectedSeats.length === 0 && styles.bookButtonDisabled]}
          onPress={() => {
            if (selectedSeats.length === 0) {
              alert("????? seat select ???");
              return;
            }
            setShowPassengerForm(true);
          }}
        >
          <Text style={styles.bookButtonText}>Proceed to Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f4f7fb",
    minHeight: "100%",
  },
  headerCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  brand: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  routeText: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "600",
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 18,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  legendText: {
    color: "#111827",
    fontWeight: "600",
  },
  deckCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#111827",
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rowLabel: {
    width: 50,
    fontSize: 15,
    fontWeight: "bold",
    color: "#334155",
  },
  seatPair: {
    flexDirection: "row",
    gap: 12,
  },
  seat: {
    width: 70,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  available: {
    backgroundColor: "#e2e8f0",
    borderColor: "#cbd5e1",
  },
  selected: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
  },
  booked: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  seatText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 18,
  },
  bookedText: {
    color: "#b91c1c",
  },
  bottomCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#334155",
    fontWeight: "600",
  },
  infoPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 14,
  },
  bookButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginBottom: 10,
    backgroundColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontWeight: "bold",
    color: "#0f172a",
  },
});
