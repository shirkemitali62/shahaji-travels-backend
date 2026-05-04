import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

const ITEMS = [
  { id: '1', title: 'Booking Confirmed', desc: 'Your Pune → Kolhapur booking is confirmed.' },
  { id: '2', title: 'Offer Available', desc: 'Use SAVE100 for premium route discount.' },
  { id: '3', title: 'Trip Reminder', desc: 'Your trip starts in 2 hours.' },
];

export default function NotificationScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Notifications" subtitle="Latest app updates" onBack={onBack} />

        {ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  desc: { color: COLORS.sub, marginTop: 6, lineHeight: 20 },
});
