import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarDropdown from '../components/Calendar/CalendarDropdown';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <Text style={styles.title}>Almanaque</Text>
      <CalendarDropdown value={selectedDate} onChange={setSelectedDate} />
      {selectedDate && <Text style={styles.helper}>Fecha: {String(selectedDate)}</Text>}
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
  title: { fontSize: 20, color: '#4D3527', marginBottom: 12 },
  helper: { marginTop: 12, color: '#444' },
});
