import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ReminderSheet({
  visible,
  title = 'Configurar aviso',
  initialDate,
  onClose,
  onSave,
}) {
  const start = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const [datePart, setDatePart] = useState(start);
  const [timePart, setTimePart] = useState(start);

  const buildFinalDate = () => {
    const d = new Date(datePart);
    d.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
    return d;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>{title}</Text>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <Text style={s.label}>Fecha</Text>
          <DateTimePicker
            value={datePart}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            locale="es-ES"
            onChange={(_, d) => d && setDatePart(d)}
            style={{ alignSelf: 'stretch' }}
          />
          <Text style={[s.label, { marginTop: 14 }]}>Hora</Text>
          <DateTimePicker
            value={timePart}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            onChange={(_, d) => d && setTimePart(d)}
            style={{ alignSelf: 'stretch' }}
          />
        </ScrollView>

        <View style={s.actions}>
          <Pressable onPress={onClose} style={[s.btn, s.btnGhost]}>
            <Text style={[s.btnTxt, { color: '#c00' }]}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={() => onSave(buildFinalDate())} style={[s.btn, s.btnPrimary]}>
            <Text style={[s.btnTxt, { color: '#0a7f42' }]}>Guardar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 12, maxHeight: '88%' },
  handle: { width: 52, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: '#ddd', marginTop: 8, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', paddingHorizontal: 16, marginBottom: 6 },
  body: { paddingHorizontal: 16, paddingBottom: 12 },
  label: { fontWeight: '700', color: '#222', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnGhost: { backgroundColor: '#ffe9e9' },
  btnPrimary: { backgroundColor: '#e5ffe9' },
  btnTxt: { fontWeight: '700' },
});
