import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export default function LoginScreen({ onLogin, onGuest }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.heroCard}>
          <Text style={styles.badge}>PREMIUM TRAVEL APP</Text>
          <Text style={styles.title}>Book faster. Travel smarter.</Text>
          <Text style={styles.desc}>Professional login/register UI for Shahaji Travels.</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, mode === 'login' && styles.activeTab]} onPress={() => setMode('login')}>
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, mode === 'register' && styles.activeTab]} onPress={() => setMode('register')}>
            <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {mode === 'register' && (
            <Input label="Full Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          )}
          <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          {mode === 'register' && (
            <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
          )}
          <Input label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

          <TouchableOpacity style={styles.primaryBtn} onPress={() => onLogin(form)}>
            <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Continue Login' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onGuest}>
            <Text style={styles.secondaryBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={COLORS.sub} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { padding: 18, paddingBottom: 40 },
  heroCard: { backgroundColor: COLORS.card2, borderRadius: 24, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border },
  badge: { color: '#93C5FD', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  desc: { color: COLORS.sub, lineHeight: 21 },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.sub, fontWeight: '700' },
  activeTabText: { color: COLORS.white },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  inputLabel: { color: COLORS.sub, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: COLORS.card2, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: COLORS.text },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  secondaryBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: COLORS.border },
  secondaryBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
});
