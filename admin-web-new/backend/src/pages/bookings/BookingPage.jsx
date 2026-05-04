import React, { useEffect, useState } from "react";
import SeatLayout from "../components/SeatLayout";
import { fetchTrips } from "../services/tripService";
import { createBooking } from "../services/bookingService";
import "../components/SeatLayout.css";

export default function BookingPage() {
  const [trips, setTrips] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    email: "",
    tripId: "",
    boardingPoint: "",
    droppingPoint: "",
    paymentMethod: "Cash",
  });

  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "", seatNumber: "" },
  ]);

  useEffect(() => {
    const loadTrips = async () => {
      const data = await fetchTrips();
      if (data.success) {
        setTrips(data.trips);
      }
    };
    loadTrips();
  }, []);

  useEffect(() => {
    setPassengers((prev) =>
      selectedSeats.map((seat, index) => ({
        name: prev[index]?.name || "",
        age: prev[index]?.age || "",
        gender: prev[index]?.gender || "",
        seatNumber: seat,
      }))
    );
  }, [selectedSeats]);

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await createBooking({
      ...form,
      passengers,
    });

    if (response.success) {
      alert(`Booking confirmed. PNR: ${response.booking.pnr}`);
      setSelectedSeats([]);
      setPassengers([{ name: "", age: "", gender: "", seatNumber: "" }]);
      setForm({
        customerName: "",
        mobile: "",
        email: "",
        tripId: "",
        boardingPoint: "",
        droppingPoint: "",
        paymentMethod: "Cash",
      });
    } else {
      alert(response.message || "Booking failed");
    }
  };

  return (
    <div>
      <h2>New Booking</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Customer Name"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />

        <input
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <select
          value={form.tripId}
          onChange={(e) => {
            setForm({ ...form, tripId: e.target.value });
            setSelectedSeats([]);
            setPassengers([{ name: "", age: "", gender: "", seatNumber: "" }]);
          }}
        >
          <option value="">Select Trip</option>
          {trips.map((trip) => (
            <option key={trip._id} value={trip._id}>
              {trip.route?.fromCity || "From"} - {trip.route?.toCity || "To"} | {trip.tripDate} | ₹{trip.price}
            </option>
          ))}
        </select>

        <input
          placeholder="Boarding Point"
          value={form.boardingPoint}
          onChange={(e) => setForm({ ...form, boardingPoint: e.target.value })}
        />

        <input
          placeholder="Dropping Point"
          value={form.droppingPoint}
          onChange={(e) => setForm({ ...form, droppingPoint: e.target.value })}
        />

        <SeatLayout
          tripId={form.tripId}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
        />

        <h3>Passenger Details</h3>

        {passengers.map((p, index) => (
          <div key={p.seatNumber || index} style={{ marginBottom: "12px" }}>
            <p><strong>Seat:</strong> {p.seatNumber}</p>

            <input
              placeholder="Passenger Name"
              value={p.name}
              onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
            />

            <input
              placeholder="Age"
              value={p.age}
              onChange={(e) => handlePassengerChange(index, "age", e.target.value)}
            />

            <input
              placeholder="Gender"
              value={p.gender}
              onChange={(e) => handlePassengerChange(index, "gender", e.target.value)}
            />
          </div>
        ))}

        <button type="submit">Confirm Booking</button>
      </form>
    </div>
  );
}