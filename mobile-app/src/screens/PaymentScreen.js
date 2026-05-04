import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

const METHODS = ['UPI', 'Card', 'Cash'];

export default function PaymentScreen({ total, onBack, onPay }) {
  const [method, setMethod] = useState('UPI');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Payment" subtitle="Choose payment method" onBack={onBack} />

        <View style={styles.card}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{total}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {METHODS.map((item) => {
            const active = method === item;
            return (
              <TouchableOpacity key={item} style={[styles.methodRow, active && styles.activeMethod]} onPress={() => setMethod(item)}>
                <Text style={[styles.methodText, active && styles.activeMethodText]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => {
            Alert.alert('Payment Successful', `${method} payment selected`);
            onPay(method);
          }}
        >
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  amountLabel: { color: COLORS.sub, fontWeight: '700' },
  amount: { color: COLORS.white, fontSize: 28, fontWeight: '900', marginTop: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  methodRow: { paddingVertical: 14, paddingHorizontal: 14, backgroundColor: COLORS.card2, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  activeMethod: { borderColor: COLORS.primary, backgroundColor: '#0F274B' },
  methodText: { color: COLORS.text, fontWeight: '700' },
  activeMethodText: { color: COLORS.primary },
  payBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  payBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
