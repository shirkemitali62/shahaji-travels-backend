
import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { BUS_DATA } from '../data/buses';
import BusCard from '../components/BusCard';

export default function HomeScreen({ user, search, setSearch, favorites, toggleFavorite, onSearch, onQuickOpenBusList, onOpenProfile, onOpenHelp, onOpenHistory }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.headerTitle}>Hi, {user?.name || 'Traveller'} 👋</Text>
        <Text style={styles.headerSub}>Find your next comfortable bus ride</Text>

        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>Summer Travel Offers</Text>
          <Text style={styles.bannerDesc}>Use SAVE100 and get instant discount on premium routes.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Search Buses</Text>
          <Input label="From" value={search.from} onChangeText={(v) => setSearch({ ...search, from: v })} />
          <Input label="To" value={search.to} onChangeText={(v) => setSearch({ ...search, to: v })} />
          <Input label="Date" value={search.date} onChangeText={(v) => setSearch({ ...search, date: v })} />

          <TouchableOpacity style={styles.primaryBtn} onPress={onSearch}>
            <Text style={styles.primaryBtnText}>Search Available Buses</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Popular Routes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {['Pune → Kolhapur', 'Pune → Mumbai', 'Pune → Satara', 'Pune → Sangli'].map((route) => (
            <TouchableOpacity key={route} style={styles.routeChip} onPress={() => toggleFavorite(route)}>
              <Text style={styles.routeText}>{route}</Text>
              <Text style={styles.routeHeart}>{favorites.includes(route) ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.quickGrid}>
          <QuickCard title="Buses" icon="🚌" onPress={onQuickOpenBusList} />
          <QuickCard title="Bookings" icon="🎫" onPress={onOpenHistory} />
          <QuickCard title="Profile" icon="👤" onPress={onOpenProfile} />
          <QuickCard title="Help" icon="🆘" onPress={onOpenHelp} />
        </View>

        <Text style={styles.sectionTitle}>Recommended Buses</Text>
        {BUS_DATA.slice(0, 3).map((bus) => (
          <BusCard key={bus.id} bus={bus} onPress={onQuickOpenBusList} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={COLORS.sub} {...props} />
    </View>
  );
}

function QuickCard({ title, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  headerSub: { color: COLORS.sub, marginTop: 6, marginBottom: 16 },
  bannerCard: { backgroundColor: COLORS.primaryDark, borderRadius: 24, padding: 18, marginBottom: 16 },
  bannerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  bannerDesc: { color: '#DBEAFE' },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  inputLabel: { color: COLORS.sub, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  routeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.chip, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  routeText: { color: COLORS.text, fontWeight: '700', marginRight: 8 },
  routeHeart: { color: '#FB7185', fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4, marginBottom: 14 },
  quickCard: { width: '48%', backgroundColor: COLORS.card, borderRadius: 20, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickText: { color: COLORS.text, fontWeight: '700' },
});
