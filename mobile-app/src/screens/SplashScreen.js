import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ navigate }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('Login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoEmoji}>🚌</Text>
      </View>
      <Text style={styles.title}>Shahaji Travels</Text>
      <Text style={styles.sub}>Your Journey, Our Pride</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  logoEmoji: { fontSize: 50 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  sub: { color: '#94A3B8', fontSize: 14, marginTop: 8 }
});
