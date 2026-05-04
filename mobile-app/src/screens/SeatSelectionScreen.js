import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { LOWER_DECK, UPPER_DECK } from '../data/buses';
import CustomHeader from '../components/CustomHeader';
import SeatGrid from '../components/SeatGrid';

export default function SeatSelectionScreen({
  selectedBus,
  selectedSeats,
  toggleSeat,
  boardingPoint,
  setBoardingPoint,
  droppingPoint,
  setDroppingPoint,
  passenger,
  setPassenger,
  coupon,
  setCoupon,
  applyCoupon,
  couponApplied,
  subtotal,
  convenienceFee,
  offerAmount,
  total,
  onBack,
  onConfirm,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Select Seats" subtitle={`${selectedBus?.name || ''}`} onBack={onBack} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedBus?.name}</Text>
          <Text style={styles.cardSub}>{selectedBus?.type} • {selectedBus?.departure} - {selectedBus?.arrival}</Text>
        </View>

        <SeatGrid title="Lower Deck" seats={LOWER_DECK} selectedSeats={selectedSeats} onToggle={toggleSeat} />
        <SeatGrid title="Upper Deck" seats={UPPER_DECK} selectedSeats={selectedSeats} onToggle={toggleSeat} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Boarding & Dropping</Text>
          <Input label="Boarding Point" value={boardingPoint} onChangeText={setBoardingPoint} />
          <Input label="Dropping Point" value={droppingPoint} onChangeText={setDroppingPoint} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Passenger Details</Text>
          <Input label="Passenger Name" value={passenger.name} onChangeText={(v) => setPassenger({ ...passenger, name: v })} />
          <Input label="Age" value={passenger.age} onChangeText={(v) => setPassenger({ ...passenger, age: v })} />
          <Input label="Gender" value={passenger.gender} onChangeText={(v) => setPassenger({ ...passenger, gender: v })} />
          <Input label="Phone" value={passenger.phone} onChangeText={(v) => setPassenger({ ...passenger, phone: v })} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={coupon}
              onChangeText={setCoupon}
              placeholder="SAVE100 / TRAVEL50"
              placeholderTextColor={COLORS.sub}
            />
            <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {!!couponApplied && <Text style={styles.successText}>Applied: {couponApplied}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fare Summary</Text>
          <FareRow label="Selected Seats" value={selectedSeats.join(', ') || '-'} />
          <FareRow label="Subtotal" value={`₹${subtotal}`} />
          <FareRow label="Convenience Fee" value={`₹${convenienceFee}`} />
          <FareRow label="Discount" value={`- ₹${offerAmount}`} />
          <View style={styles.divider} />
          <FareRow label="Total Amount" value={`₹${total}`} highlight />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onConfirm}>
          <Text style={styles.primaryBtnText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={COLORS.sub} {...props} />
    </View>
  );
}

function FareRow({ label, value, highlight }) {
  return (
    <View style={styles.fareRow}>
      <Text style={[styles.fareLabel, highlight && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.fareValue, highlight && styles.totalValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  cardSub: { color: COLORS.sub, marginTop: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  inputLabel: { color: COLORS.sub, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  applyBtn: { backgroundColor: COLORS.warning, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, marginLeft: 10 },
  applyBtnText: { color: COLORS.white, fontWeight: '800' },
  successText: { color: '#86EFAC', marginTop: 10, fontWeight: '700' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fareLabel: { color: COLORS.sub },
  fareValue: { color: COLORS.text, fontWeight: '700' },
  totalLabel: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  totalValue: { color: '#93C5FD', fontWeight: '900', fontSize: 18 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});