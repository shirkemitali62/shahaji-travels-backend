import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function MyBookingsScreen({ navigate, bookings = [] }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!bookings.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySub}>Book your first ticket from the home screen.</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity key={booking.id} style={styles.card} onPress={() => navigate('Ticket', { booking })}>
              <Text style={styles.cardTitle}>{booking.route?.from} → {booking.route?.to}</Text>
              <Text style={styles.cardSub}>{booking.travelDate}</Text>
              <Text style={styles.cardSub}>Seats: {booking.seats?.join(', ')}</Text>
              <Text style={styles.price}>₹{booking.totalAmount}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backText: { color: 'white', fontSize: 22, fontWeight: '800' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  content: { padding: 16 },
  emptyCard: { backgroundColor: '#111827', borderRadius: 22, padding: 24, alignItems: 'center' },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  emptySub: { color: '#94A3B8', fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 22, padding: 16, marginBottom: 12 },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  cardSub: { color: '#94A3B8', marginTop: 6 },
  price: { color: '#F97316', fontSize: 22, fontWeight: '900', marginTop: 12 }
});
