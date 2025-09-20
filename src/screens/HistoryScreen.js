// src/screens/HistoryScreen.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistoryPanel from '../components/History/HistoryPanel';

export default function HistoryScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <Text style={styles.title}>Historial</Text>
      <HistoryPanel navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 16,
    paddingTop: 8,         // margen cómodo bajo el notch
  },
  title: {
    fontSize: 20,
    color: '#4D3527',
    marginBottom: 12,
  },
});
