import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { COLORS, SHADOW } from '../../theme';

export default function BookingScreen({
  navigate,
  bus,
  route,
  seats = [],
  totalAmount = 0,
  boardingPoint,
  droppingPoint,
  travelDate,
  addBooking,
  user
}) {
  const [name, setName] = useState(
    user?.name && user.name !== 'Guest User' ? user.name : ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const confirmBooking = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Passenger name आणि phone number टाका');
      return;
    }

    const booking = {
      id: `ST${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      paymentMethod,
      seats,
      totalAmount,
      boardingPoint,
      droppingPoint,
      travelDate,
      route,
      bus
    };

    addBooking(booking);
    navigate('Ticket', { booking });
  };

  const paymentOptions = ['UPI', 'Card', 'Cash'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topGlow} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigate('SeatSelection', { bus, route, travelDate })}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Complete Booking</Text>
          <Text style={styles.headerSub}>Enter passenger and payment details</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Journey Summary</Text>

        <InfoRow label="Bus" value={bus?.name || '-'} />
        <InfoRow label="Trip" value={`${route?.from || '-'} → ${route?.to || '-'}`} />
        <InfoRow label="Date" value={travelDate || '-'} />
        <InfoRow label="Seats" value={seats.join(', ')} />
        <InfoRow label="Boarding" value={boardingPoint || '-'} />
        <InfoRow label="Dropping" value={droppingPoint || '-'} />

        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Total Fare</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Passenger Details</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Passenger Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter passenger name"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor={COLORS.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email (optional)"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>Choose Payment</Text>

        <View style={styles.paymentRow}>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.paymentChip,
                paymentMethod === option && styles.paymentChipActive
              ]}
              onPress={() => setPaymentMethod(option)}
            >
              <Text
                style={[
                  styles.paymentChipText,
                  paymentMethod === option && styles.paymentChipTextActive
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking}>
        <Text style={styles.confirmBtnText}>Confirm Premium Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  content: {
    padding: 16,
    paddingTop: 44,
    paddingBottom: 24
  },
  topGlow: {
    position: 'absolute',
    top: -90,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#2F1200',
    opacity: 0.45
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  backText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900'
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900'
  },
  headerSub: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 4
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    ...SHADOW
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14
  },
  paymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 11
  },
  infoLabel: {
    color: COLORS.subtext,
    fontSize: 13
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    maxWidth: '58%',
    textAlign: 'right'
  },
  totalBar: {
    marginTop: 10,
    backgroundColor: '#2B1607',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800'
  },
  totalValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900'
  },
  inputWrap: {
    marginBottom: 14
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  paymentChip: {
    width: '31%',
    backgroundColor: COLORS.card2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  paymentChipActive: {
    backgroundColor: COLORS.primary
  },
  paymentChipText: {
    color: COLORS.subtext,
    fontWeight: '900'
  },
  paymentChipTextActive: {
    color: COLORS.white
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900'
  }
});