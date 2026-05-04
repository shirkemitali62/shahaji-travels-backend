import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import CustomHeader from '../components/CustomHeader';

export default function EditProfileScreen({ user, onBack, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <CustomHeader title="Edit Profile" subtitle="Update your details" onBack={onBack} />

        <View style={styles.card}>
          <Input label="Full Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />

          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(form)}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
  wrap: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  inputLabel: { color: COLORS.sub, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: COLORS.card2, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
