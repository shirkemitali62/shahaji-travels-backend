import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { BUS_DATA } from '../data/buses';
import CustomHeader from '../components/CustomHeader';
import BusCard from '../components/BusCard';

export default function BusListScreen({ search, onBack, onSelectBus }) {
  const filteredBuses = BUS_DATA.filter(
    (bus) =>
      bus.from.toLowerCase().includes(search.from.toLowerCase()) &&
      bus.to.toLowerCase().includes(search.to.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader
          title="Available Buses"
          subtitle={`${search.from} → ${search.to} • ${search.date}`}
          onBack={onBack}
        />

        {filteredBuses.map((bus) => (
          <BusCard
            key={bus.id}
            bus={bus}
            onPress={() => onSelectBus(bus)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  wrap: {
    padding: 16,
    paddingBottom: 40,
  },
});