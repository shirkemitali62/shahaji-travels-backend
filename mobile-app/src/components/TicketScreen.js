import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function TicketScreen({ bookingData, onBackHome }) {
  if (!bookingData) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Shahaji Travels</Text>
        <Text style={styles.subBrand}>E-Ticket Confirmation</Text>
      </View>

      <View style={styles.ticketCard}>
        <Text style={styles.success}>Booking Confirmed ??</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Passenger</Text>
          <Text style={styles.value}>{bookingData.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{bookingData.age}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{bookingData.phone}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Route</Text>
          <Text style={styles.value}>Pune ? Mumbai</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bus</Text>
          <Text style={styles.value}>Shahaji Night Express</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Seats</Text>
          <Text style={styles.value}>{bookingData.selectedSeats.join(", ")}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Fare</Text>
          <Text style={styles.value}>?{bookingData.totalPrice}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.pnrLabel}>PNR Number</Text>
        <Text style={styles.pnr}>{bookingData.pnr}</Text>

        <View style={styles.qrBox}>
          <Text style={styles.qrText}>QR / Ticket Scan Area</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onBackHome}>
        <Text style={styles.buttonText}>Book Another Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f7fb",
  },
  header: {
    marginBottom: 18,
  },
  brand: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subBrand: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  success: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  pnrLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  pnr: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  qrBox: {
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  qrText: {
    color: "#64748b",
    fontWeight: "600",
  },
  button: {
    marginTop: 22,
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
