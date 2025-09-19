import React, { useMemo, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MovimientosContext } from '../../state/MovimientosContext';
import ManualDateInput from '../Calendar/ManualDateInput';
import { Ionicons } from '@expo/vector-icons';

// Guardia defensiva (opcional, útil mientras probás)
export default function HistoryPanel() {
  const ctx = useContext(MovimientosContext);
  if (!ctx) {
    return <Text style={{ color: '#c62828' }}>Error: MovimientosProvider no envuelve la app.</Text>;
  }
  const { getMovimientosBetween } = ctx;
  // filtros globales
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [applied, setApplied] = useState({ desde: null, hasta: null, persona: null });
  // control de apertura de pickers (evita superposición)
  const [openKey, setOpenKey] = useState(null); // 'desde' | 'hasta' | null
  // modal por persona
  const [personModal, setPersonModal] = useState({ visible: false, nombre: null, d: null, h: null });
  // modal para filtro global
  const [globalModal, setGlobalModal] = useState({ visible: false, d: null, h: null });

  const data = useMemo(() => {
    const base = getMovimientosBetween(applied.desde, applied.hasta);
    if (!applied.persona) return base;
    // usamos item.concepto como "persona" (ajusta a tu campo real si difiere)
    return base.filter(m => (m.concepto || '').toLowerCase() === applied.persona.toLowerCase());
  }, [applied, getMovimientosBetween]);

  const apply = () => setApplied({ ...applied, desde, hasta });
  const clear = () => { setDesde(null); setHasta(null); setApplied({ desde: null, hasta: null, persona: null }); };

  // función para abrir modal de filtro global
  const openGlobalModal = () => {
    setGlobalModal({ visible: true, d: applied.desde, h: applied.hasta });
  };

  // aplicar filtro global desde el modal
  const applyGlobalFilter = () => {
    let { d, h } = globalModal;
    // Si desde > hasta, intercambiar
    if (d && h && new Date(d) > new Date(h)) {
      [d, h] = [h, d];
    }
    setApplied({ desde: d, hasta: h, persona: null });
    setGlobalModal({ visible: false, d: null, h: null });
  };

  const cancelGlobalModal = () => {
    setGlobalModal({ visible: false, d: null, h: null });
  };

  // función para abrir modal por persona
  const openPersonModal = (personName) => {
    setPersonModal({ visible: true, nombre: personName, d: null, h: null });
  };

  // aplicar filtro por persona desde el modal
  const applyPersonFilter = () => {
    let { d, h } = personModal;
    // Si desde > hasta, intercambiar
    if (d && h && new Date(d) > new Date(h)) {
      [d, h] = [h, d];
    }
    setApplied({
      desde: d,
      hasta: h,
      persona: personModal.nombre
    });
    setPersonModal({ visible: false, nombre: null, d: null, h: null });
  };

  const cancelPersonModal = () => {
    setPersonModal({ visible: false, nombre: null, d: null, h: null });
  };

  const renderItem = ({ item }) => {
    const conceptoLower = (item.concepto || '').toLowerCase();
    const isHighlighted = applied.persona && conceptoLower === applied.persona.toLowerCase();

    return (
      <TouchableOpacity
        style={[styles.row, isHighlighted && styles.rowHighlighted]}
        onPress={() => openPersonModal(item.concepto)}
      >
        <View style={styles.rowLeft}>
          <Text style={[styles.rowTipo, isHighlighted && styles.textHighlighted]}>
            {item.tipo === 'pago' ? 'Pago' : 'Cobro'}
          </Text>
          <Text style={[styles.rowNota, isHighlighted && styles.textHighlighted]}>
            {item.concepto || '-'}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[
            styles.rowMonto, 
            item.tipo === 'pago' ? styles.montoNeg : styles.montoPos,
            isHighlighted && styles.textHighlighted
          ]}>
            {`${item.tipo === 'pago' ? '-' : '+'}$ ${item.monto}`}
          </Text>
          <Text style={[styles.rowFecha, isHighlighted && styles.textHighlighted]}>
            {new Date(item.fecha).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header con título y botón filtrar todo */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Movimientos</Text>
        <TouchableOpacity style={styles.filterButton} onPress={openGlobalModal}>
          <Ionicons name="filter" size={16} color="#3E7D75" />
          <Text style={styles.filterButtonText}>Filtrar todo</Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <Text style={styles.empty}>No hay movimientos para el rango seleccionado</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      {/* Modal para filtrar por persona */}
      <Modal
        visible={personModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelPersonModal}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView 
                keyboardShouldPersistTaps="handled" 
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Header del modal con botón Volver */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={cancelPersonModal}
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-back" size={20} color="#4D3527" />
                    <Text style={styles.backButtonText}>Volver</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    Filtrar por: {personModal.nombre}
                  </Text>
                </View>
                
                <View style={styles.modalFilters}>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Desde</Text>
                    <ManualDateInput 
                      value={personModal.d} 
                      onChange={(date) => setPersonModal(prev => ({...prev, d: date}))}
                      placeholder="dd/mm/aaaa"
                    />
                  </View>
                  
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Hasta</Text>
                    <ManualDateInput 
                      value={personModal.h} 
                      onChange={(date) => setPersonModal(prev => ({...prev, h: date}))}
                      placeholder="dd/mm/aaaa"
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={cancelPersonModal}>
                    <Ionicons name="close" size={16} color="#4D3527" />
                    <Text style={styles.btnTextGhost}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={applyPersonFilter}>
                    <Ionicons name="checkmark" size={16} color="#F5F1E8" />
                    <Text style={styles.btnTextPrimary}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para filtro global */}
      <Modal
        visible={globalModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelGlobalModal}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView 
                keyboardShouldPersistTaps="handled" 
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>
                  Filtrar movimientos
                </Text>
                
                <View style={styles.modalFilters}>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Desde</Text>
                    <ManualDateInput 
                      value={globalModal.d} 
                      onChange={(date) => setGlobalModal(prev => ({...prev, d: date}))}
                      placeholder="dd/mm/aaaa"
                    />
                  </View>
                  
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Hasta</Text>
                    <ManualDateInput 
                      value={globalModal.h} 
                      onChange={(date) => setGlobalModal(prev => ({...prev, h: date}))}
                      placeholder="dd/mm/aaaa"
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={cancelGlobalModal}>
                    <Ionicons name="close" size={16} color="#4D3527" />
                    <Text style={styles.btnTextGhost}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={applyGlobalFilter}>
                    <Ionicons name="checkmark" size={16} color="#F5F1E8" />
                    <Text style={styles.btnTextPrimary}>Aplicar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => {
                    setApplied({ desde: null, hasta: null, persona: null });
                    cancelGlobalModal();
                  }}>
                    <Ionicons name="refresh" size={16} color="#8B4513" />
                    <Text style={styles.btnSecondaryText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { color: '#4D3527', marginBottom: 8, fontWeight: '600' },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3E7D75',
    backgroundColor: '#F5F5F5',
  },
  filterButtonText: {
    color: '#3E7D75',
    fontWeight: '600',
    fontSize: 14,
  },
  
  filters: { flexDirection: 'row', gap: 12 },
  filterItem: { flex: 1 },
  filterLabel: { color: '#4D3527', marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#3E7D75' },
  btnGhost: { backgroundColor: '#EEE9E2' },
  btnSecondary: { backgroundColor: '#F4E4C1' },
  btnTextPrimary: { color: '#F5F1E8', fontWeight: '600' },
  btnTextGhost: { color: '#4D3527', fontWeight: '600' },
  btnSecondaryText: { color: '#8B4513', fontWeight: '600' },
  empty: { color: '#777', textAlign: 'center', marginVertical: 24, fontSize: 15 },
  sep: { height: 1, backgroundColor: '#EEE9E2', marginVertical: 8 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  rowHighlighted: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  rowLeft: { flexShrink: 1, paddingRight: 8 },
  rowRight: { alignItems: 'flex-end' },
  rowTipo: { color: '#4D3527', fontWeight: '700' },
  rowNota: { color: '#444' },
  rowMonto: { fontWeight: '700' },
  montoPos: { color: '#2e7d32' },
  montoNeg: { color: '#c62828' },
  rowFecha: { color: '#666', fontSize: 12, marginTop: 2 },
  textHighlighted: { color: '#2E7D32', fontWeight: '700' },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FCFCF8',
    borderRadius: 16,
    padding: 24,
    width: '95%',
    minHeight: 200,
    maxHeight: '70%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#4D3527',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4D3527',
    textAlign: 'center',
  },
  modalFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});