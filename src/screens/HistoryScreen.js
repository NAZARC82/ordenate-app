// src/screens/HistoryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HistoryPanel from '../components/History/HistoryPanel';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>
      <HistoryPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
    padding: 16,
  },
  title: {
    fontSize: 20,
    color: '#4D3527',
    marginBottom: 12,
  },
});
