import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

const OFFERS = [
  { code: 'SAVE100', title: 'Flat ₹100 OFF', desc: 'Premium routes sathi valid.' },
  { code: 'TRAVEL50', title: 'Instant ₹50 OFF', desc: 'Selected buses var apply hoil.' },
  { code: 'NEWUSER', title: 'New User Special', desc: 'First booking la extra discount.' },
];

export default function OffersScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Offers" subtitle="Best coupons for your next ride" onBack={onBack} />

        {OFFERS.map((offer) => (
          <View key={offer.code} style={styles.card}>
            <Text style={styles.code}>{offer.code}</Text>
            <Text style={styles.title}>{offer.title}</Text>
            <Text style={styles.desc}>{offer.desc}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => Alert.alert('Coupon', `${offer.code} copy kar ani seat page var use kar`)}>
              <Text style={styles.btnText}>Use Offer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  code: { color: '#FCD34D', fontSize: 20, fontWeight: '900' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
  desc: { color: COLORS.sub, marginTop: 6, lineHeight: 20 },
  btn: { backgroundColor: COLORS.primary, marginTop: 14, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '800' },
});
