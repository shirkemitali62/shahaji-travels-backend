import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

export default function ProfileScreen({ user, favorites, notificationsEnabled, setNotificationsEnabled, darkMode, setDarkMode, onBack, onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Profile" onBack={onBack} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U').slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.sub}>{user?.email}</Text>
          <Text style={styles.sub}>{user?.phone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Row label="Notifications" value={notificationsEnabled ? 'ON' : 'OFF'} onPress={() => setNotificationsEnabled(!notificationsEnabled)} />
          <Row label="Dark Mode" value={darkMode ? 'ON' : 'OFF'} onPress={() => setDarkMode(!darkMode)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Favorite Routes</Text>
          {favorites.length ? favorites.map((item) => <Text key={item} style={styles.favorite}>• {item}</Text>) : <Text style={styles.sub}>No favorites yet</Text>}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: COLORS.card2, borderRadius: 24, padding: 18, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: COLORS.white, fontSize: 30, fontWeight: '900' },
  name: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  sub: { color: COLORS.sub, marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { color: COLORS.text, fontWeight: '700' },
  rowValue: { color: '#93C5FD', fontWeight: '800' },
  favorite: { color: COLORS.text, marginTop: 8 },
  logoutBtn: { backgroundColor: COLORS.danger, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});