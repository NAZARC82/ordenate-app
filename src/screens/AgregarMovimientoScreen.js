// src/screens/AgregarMovimientoScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard, InputAccessoryView } from 'react-native';
import { MovimientosContext } from '../state/MovimientosContext';
import ManualDateInput from '../components/Calendar/ManualDateInput';
import { getEstadoColor } from '../utils/estadoColor';

export default function AgregarMovimientoScreen({ navigation, route }) {
  const { addMovimiento } = useContext(MovimientosContext);
  const initialTipo = route?.params?.tipo === 'cobro' ? 'cobro' : 'pago';

  const [tipo, setTipo] = useState(initialTipo);       // 'pago' | 'cobro'
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(() => {
    // Fecha por defecto: hoy al mediodía UTC
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0).toISOString();
  });
  const [estado, setEstado] = useState('pendiente');   // 'pendiente' | 'pronto' | 'urgente' | 'pagado'

  // Leer params opcionales para preselección
  useEffect(() => {
    if (route?.params?.estado) {
      setEstado(route.params.estado);
    }
    if (route?.params?.fechaISO) {
      setFecha(route.params.fechaISO);
    }
  }, [route?.params]);

  const onGuardar = () => {
    const nMonto = Number(monto);
    if (!Number.isFinite(nMonto) || nMonto <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto numérico mayor a 0.');
      return;
    }
    
    // Validar estado
    if (!['pendiente', 'pronto', 'urgente', 'pagado'].includes(estado)) {
      Alert.alert('Error', 'Estado inválido seleccionado.');
      return;
    }
    
    const result = addMovimiento({ tipo, monto: nMonto, fecha, nota, estado });
    if (result.success) {
      navigation.goBack(); // vuelve a Home
    } else {
      Alert.alert('Error', result.error || 'No se pudo guardar el movimiento');
    }
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="notaAccessoryAgregarMovimiento">
          <View style={styles.accessoryContainer}>
            <TouchableOpacity 
              style={styles.accessoryButton} 
              onPress={Keyboard.dismiss}
            >
              <Text style={styles.accessoryButtonText}>Hecho</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          onStartShouldSetResponder={() => {
            Keyboard.dismiss();
            return false;
          }}
        >
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

        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          placeholder="Ej: Juan / Luz / Cliente A"
          style={[styles.input, { height: 44 }]}
          returnKeyType="done"
          enablesReturnKeyAutomatically={true}
          onSubmitEditing={Keyboard.dismiss}
          inputAccessoryViewID={Platform.OS === 'ios' ? 'notaAccessoryAgregarMovimiento' : undefined}
        />

        <Text style={styles.label}>Estado</Text>
        <View style={styles.estadoContainer}>
          {['pendiente', 'pronto', 'urgente', 'pagado'].map(est => (
            <TouchableOpacity
              key={est}
              style={[
                styles.estadoChip,
                estado === est && styles.estadoChipActive,
                { backgroundColor: getEstadoColor(est) }
              ]}
              onPress={() => {
                setEstado(est);
                Keyboard.dismiss();
              }}
            >
              <Text style={[
                styles.estadoText,
                estado === est && styles.estadoTextActive
              ]}>
                {est}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { 
    flex: 1 
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FCFCF8'
  },
  container: { 
    padding: 16, 
    backgroundColor: '#FCFCF8', 
    flexGrow: 1,
    paddingBottom: 40 // Espacio extra para asegurar scroll completo
  },
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
  estadoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  estadoChipActive: {
    // Color se maneja dinámicamente por getEstadoColor
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  estadoTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: '#EDE6DD' },
  btnGhostText: { color: '#4D3527' },
  btnPrimary: { backgroundColor: '#3E7D75' },
  btnPrimaryText: { color: '#F5F1E8' },
  btnText: { fontSize: 16, fontWeight: '600' },
  accessoryContainer: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accessoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3E7D75',
    borderRadius: 8,
  },
  accessoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
