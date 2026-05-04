import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function PassengerForm({ selectedSeats, totalPrice, onBookingSuccess }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const generatePNR = () => {
    return "STT" + Math.floor(100000 + Math.random() * 900000);
  };

  const handleBooking = () => {
    if (!name || !age || !phone) {
      alert("????? ???? ?????? ???");
      return;
    }

    const bookingData = {
      name,
      age,
      phone,
      selectedSeats,
      totalPrice,
      pnr: generatePNR(),
    };

    onBookingSuccess(bookingData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passenger Details</Text>

      <TextInput
        placeholder="Passenger Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Age"
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Phone Number"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
      />

      <Text style={styles.info}>Seats: {selectedSeats.join(", ")}</Text>
      <Text style={styles.info}>Total: ?{totalPrice}</Text>

      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  info: {
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
