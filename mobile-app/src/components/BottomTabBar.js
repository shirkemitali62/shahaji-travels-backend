import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

const tabs = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'offers', label: 'Offers', icon: '🎁' },
  { key: 'history', label: 'Bookings', icon: '🎫' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

export default function BottomTabBar({ activeTab, onChange }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Text style={[styles.icon, active && styles.activeText]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.activeText]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: COLORS.sub,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.sub,
    fontWeight: '700',
  },
  activeText: {
    color: COLORS.primary,
  },
});

