import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HistoryPanel() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.placeholder}>
          Panel de historial - Lista de movimientos aparecer\u00e1 aqu\u00ed
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});