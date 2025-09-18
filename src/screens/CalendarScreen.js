import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CalendarDropdown from '../components/Calendar/CalendarDropdown';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almanaque</Text>
      <CalendarDropdown value={selectedDate} onChange={setSelectedDate} />
      {selectedDate && <Text style={styles.helper}>Fecha: {String(selectedDate)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFCF8', padding: 16 },
  title: { fontSize: 20, color: '#4D3527', marginBottom: 12 },
  helper: { marginTop: 12, color: '#444' },
});
