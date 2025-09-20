// src/screens/AgregarMovimientoScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MovimientosContext } from '../state/MovimientosContext';
import ManualDateInput from '../components/Calendar/ManualDateInput';

export default function AgregarMovimientoScreen({ navigation, route }) {
  const { addMovimiento } = useContext(MovimientosContext);
  const initialTipo = route?.params?.tipo === 'cobro' ? 'cobro' : 'pago';

  const [tipo, setTipo] = useState(initialTipo);       // 'pago' | 'cobro'
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(null);            // ISO o null

  const onGuardar = () => {
    const nMonto = Number(monto);
    if (!Number.isFinite(nMonto) || nMonto <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto numérico mayor a 0.');
      return;
    }
    addMovimiento({ tipo, monto: nMonto, fecha, nota });
    navigation.goBack(); // vuelve a Home
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Agregar movimiento</Text>

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.segment}>
          <TouchableOpacity onPress={() => setTipo('pago')} style={[styles.segBtn, tipo==='pago' && styles.segBtnActive]}>
            <Text style={[styles.segText, tipo==='pago' && styles.segTextActive]}>Pago</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTipo('cobro')} style={[styles.segBtn, tipo==='cobro' && styles.segBtnActive]}>
            <Text style={[styles.segText, tipo==='cobro' && styles.segTextActive]}>Cobro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Monto</Text>
        <TextInput
          value={monto}
          onChangeText={setMonto}
          keyboardType="numeric"
          placeholder="$ 0"
          style={styles.input}
        />

        <Text style={styles.label}>Fecha</Text>
        <ManualDateInput value={fecha} onChange={setFecha} placeholder="dd/mm/aaaa" />

        <Text style={styles.label}>Detalle / Persona</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          placeholder="Ej: Juan / Luz / Cliente A"
          style={[styles.input, { height: 44 }]}
        />

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, styles.btnGhost]}>
            <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onGuardar} style={[styles.btn, styles.btnPrimary]}>
            <Text style={[styles.btnText, styles.btnPrimaryText]}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FCFCF8', flexGrow: 1 },
  title: { fontSize: 20, color: '#4D3527', marginBottom: 12, fontWeight: '700' },
  label: { color: '#4D3527', marginTop: 12, marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#4D3527',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEE9E2',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#3E7D75' },
  segText: { color: '#4D3527', fontWeight: '600' },
  segTextActive: { color: '#F5F1E8' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: '#EDE6DD' },
  btnGhostText: { color: '#4D3527' },
  btnPrimary: { backgroundColor: '#3E7D75' },
  btnPrimaryText: { color: '#F5F1E8' },
  btnText: { fontSize: 16, fontWeight: '600' },
});
