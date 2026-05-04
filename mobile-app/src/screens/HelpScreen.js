import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HelpScreen({ navigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Need help?</Text>
        <Text style={styles.line}>📞 Support: +91 98765 43210</Text>
        <Text style={styles.line}>📧 Email: support@shahajitravels.com</Text>
        <Text style={styles.line}>🕒 Timing: 8:00 AM - 10:00 PM</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Common Help</Text>
        <Text style={styles.line}>• Ticket booking support</Text>
        <Text style={styles.line}>• Seat selection help</Text>
        <Text style={styles.line}>• Boarding / dropping details</Text>
        <Text style={styles.line}>• Refund and cancellation help</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 16, paddingTop: 44 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backText: { color: 'white', fontSize: 22, fontWeight: '800' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: '#111827', borderRadius: 22, padding: 18, marginBottom: 12 },
  title: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  line: { color: '#CBD5E1', marginBottom: 8, lineHeight: 22 }
});
