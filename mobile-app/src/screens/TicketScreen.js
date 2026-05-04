import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

export default function HelpScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Help & Support" onBack={onBack} />

        <View style={styles.card}>
          <Text style={styles.title}>Need help?</Text>
          <Text style={styles.sub}>Support Number: +91 98765 43210</Text>
          <Text style={styles.sub}>Email: support@shahajitravels.com</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>FAQs</Text>
          <Faq q="Ticket cancel hou shakto ka?" a="Ho, company policy nusar cancellation possible ahe." />
          <Faq q="Seat select karta yete ka?" a="Ho, lower ani upper deck madhun direct seat select karta yete." />
          <Faq q="Coupon kasa apply karaycha?" a="Seat screen var coupon section madhe code enter kar." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Faq({ q, a }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.q}>{q}</Text>
      <Text style={styles.a}>{a}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  sub: { color: COLORS.sub, lineHeight: 20 },
  q: { color: COLORS.text, fontWeight: '800', marginBottom: 4 },
  a: { color: COLORS.sub, lineHeight: 20 },
});
