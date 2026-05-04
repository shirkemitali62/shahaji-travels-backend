import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { PREBOOKED } from '../data/buses';

export default function SeatGrid({ title, seats, selectedSeats, onToggle }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {seats.map((seat) => {
          const isBooked = PREBOOKED.includes(seat);
          const isSelected = selectedSeats.includes(seat);

          return (
            <TouchableOpacity
              key={seat}
              onPress={() => onToggle(seat)}
              disabled={isBooked}
              style={[
                styles.seat,
                {
                  backgroundColor: isBooked
                    ? COLORS.booked
                    : isSelected
                    ? COLORS.selected
                    : COLORS.available,
                },
              ]}
            >
              <Text style={styles.seatText}>{seat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seat: {
    width: '22%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seatText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
