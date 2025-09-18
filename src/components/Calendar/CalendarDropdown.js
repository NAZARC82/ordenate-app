import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CalendarDropdown({ value, onChange }) {
  const today = new Date();
  
  const handleDateSelect = () => {
    onChange(today);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dropdown} onPress={handleDateSelect}>
        <Text style={styles.dropdownText}>
          {value ? value.toLocaleDateString() : 'Seleccionar fecha'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dropdown: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#4D3527',
  },
});