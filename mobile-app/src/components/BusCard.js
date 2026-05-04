import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export default function BusCard({ bus, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{bus.name}</Text>
          <Text style={styles.type}>{bus.type}</Text>
        </View>
        <View style={styles.ratingChip}>
          <Text style={styles.ratingText}>⭐ {bus.rating}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{bus.departure}</Text>
        <Text style={styles.duration}>{bus.duration}</Text>
        <Text style={styles.time}>{bus.arrival}</Text>
      </View>

      <Text style={styles.route}>{bus.from} → {bus.to}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.price}>₹{bus.price}</Text>
        <Text style={styles.seats}>{bus.seatsLeft} seats left</Text>
      </View>

      <View style={styles.amenitiesRow}>
        {bus.amenities.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  name: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  type: {
    color: COLORS.sub,
    marginTop: 4,
  },
  ratingChip: {
    backgroundColor: '#123B2B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    color: '#BBF7D0',
    fontWeight: '800',
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  duration: {
    color: COLORS.sub,
    alignSelf: 'center',
  },
  route: {
    color: COLORS.sub,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  price: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  seats: {
    color: '#FCD34D',
    fontWeight: '700',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.chip,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: COLORS.sub,
    fontSize: 12,
    fontWeight: '700',
  },
});
