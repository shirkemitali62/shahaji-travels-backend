import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

export default function BookingHistoryScreen({ bookingHistory, onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Booking History" onBack={onBack} />

        {bookingHistory.length ? (
          bookingHistory.map((item) => (
            <View key={item.bookingId} style={styles.card}>
              <Text style={styles.title}>{item.route}</Text>
              <Text style={styles.sub}>{item.busName}</Text>
              <Row label="Booking ID" value={item.bookingId} />
              <Row label="Seats" value={item.seats} />
              <Row label="Date" value={item.date} />
              <Row label="Amount" value={`₹${item.amount}`} />
              <Text style={styles.status}>Confirmed</Text>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>No bookings yet</Text>
            <Text style={styles.sub}>Ek booking kar ani history ithe disel.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  sub: { color: COLORS.sub, marginTop: 6, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { color: COLORS.sub },
  rowValue: { color: COLORS.text, fontWeight: '700' },
  status: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#DCFCE7', color: '#166534', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '800' },
});
