// src/screens/DocumentManagerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listSignatures, saveSignature, deleteSignature, Signature } from '../features/documents/signatures';
import { usePdfPrefs } from '../features/pdf/usePdfPrefs';
import { purgeOlderThan } from '../features/documents/retention';
import { showToast, showErrorToast } from '../utils/toast';

type Tab = 'signatures' | 'design';

// Paleta de colores disponibles
const COLOR_PALETTE = [
  { hex: '#50616D', name: 'Gris Azulado' },
  { hex: '#6A5ACD', name: 'Violeta' },
  { hex: '#3E7D75', name: 'Verde Esmeralda' },
  { hex: '#C0392B', name: 'Rojo' },
  { hex: '#27AE60', name: 'Verde' },
  { hex: '#2980B9', name: 'Azul' },
  { hex: '#8E44AD', name: 'Púrpura' },
  { hex: '#D35400', name: 'Naranja' },
];

export default function DocumentManagerScreen({ route }: any) {
  // Soportar initialTab desde parámetros de navegación
  const initialTab = route?.params?.initialTab || 'signatures';
  const [tab, setTab] = useState<Tab>(initialTab as Tab);
  const [sigs, setSigs] = useState<Signature[]>([]);
  const { prefs, updatePrefs, reset, loading } = usePdfPrefs();

  // Sincronizar tab si cambia el parámetro de navegación
  useEffect(() => {
    if (route?.params?.initialTab) {
      setTab(route.params.initialTab as Tab);
    }
  }, [route?.params?.initialTab]);

  // 🚨 GUARD-RAIL: Este componente NO debe exportar
  // Solo gestiona firmas y preferencias de diseño PDF
  // Las exportaciones se disparan desde Historial, no desde Ajustes
  useEffect(() => {
    console.log('[DocumentManager] 📂 Gestor de Documentos (Firmas + Diseño)');
    console.log('[DocumentManager] Sin tab Recientes - exports solo desde Historial');
  }, []);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    const list = await listSignatures();
    setSigs(list);
  };

  const handleAddDemoSignature = async () => {
    // Firma demo: imagen base64 transparente PNG pequeña
    const demoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    try {
      await saveSignature({
        id: `sig_${Date.now()}`,
        name: `Firma ${sigs.length + 1}`,
        dataUri: demoBase64,
      });
      await loadSignatures();
      Alert.alert('✓', 'Firma de ejemplo agregada');
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la firma');
    }
  };

  const handleDeleteSignature = async (id: string) => {
    Alert.alert(
      'Eliminar firma',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteSignature(id);
            await loadSignatures();
          },
        },
      ]
    );
  };

  const handleColorChange = async (hex: string) => {
    await updatePrefs({ accentColor: hex });
  };

  const handleIntensityChange = async (value: number) => {
    await updatePrefs({ colorIntensity: value });
  };

  const handleNegativeRedChange = async (value: 'strong' | 'medium' | 'soft') => {
    await updatePrefs({ negativeRed: value });
  };

  const handleCleanupOldExports = async () => {
    Alert.alert(
      '🧹 Limpiar Exportaciones Antiguas',
      'Se eliminarán todos los archivos exportados con más de 30 días de antigüedad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[DocumentManager] Iniciando limpieza de exports >30d');
              const result = await purgeOlderThan(30);
              console.log('[DocumentManager] Archivos eliminados:', result.removed);
              
              if (result.removed > 0) {
                showToast(`✅ ${result.removed} archivo${result.removed > 1 ? 's' : ''} eliminado${result.removed > 1 ? 's' : ''}`);
              } else {
                showToast('ℹ️ No hay archivos antiguos para eliminar');
              }
            } catch (error) {
              console.error('[DocumentManager] Error al limpiar:', error);
              showErrorToast('No se pudo completar la limpieza');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={s.container} testID="docmgr-root">
      {/* Tabs: Firmas y Diseño */}
      <View style={s.tabs}>
        <TabBtn 
          label="Firmas" 
          icon="create-outline"
          active={tab === 'signatures'} 
          onPress={() => setTab('signatures')} 
          testID="tab-firmas" 
        />
        <TabBtn 
          label="Diseño" 
          icon="color-palette-outline"
          active={tab === 'design'} 
          onPress={() => setTab('design')} 
          testID="tab-diseno" 
        />
      </View>

      {/* Contenido: Firmas */}
      {tab === 'signatures' && (
        <ScrollView style={s.body} testID="signatures-list" contentContainerStyle={s.bodyContent}>
          <Text style={s.sectionTitle}>✍️ Firmas Digitales</Text>
          
          <TouchableOpacity
            style={s.primaryBtn}
            testID="btn-add-signature"
            onPress={handleAddDemoSignature}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={s.primaryText}>Nueva Firma</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cleanupBtn}
            testID="btn-cleanup-exports"
            onPress={handleCleanupOldExports}
          >
            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
            <Text style={s.cleanupText}>🧹 Limpiar exportaciones &gt;30d</Text>
          </TouchableOpacity>

          {sigs.length === 0 && (
            <View style={s.emptyState}>
              <Ionicons name="create-outline" size={48} color="#ccc" />
              <Text style={s.muted}>No hay firmas guardadas</Text>
              <Text style={s.mutedSmall}>Agrega una firma para usarla en tus PDFs</Text>
            </View>
          )}

          {sigs.map((sg) => (
            <View key={sg.id} style={s.sigRow} testID={`sig-${sg.id}`}>
              <Image
                source={{ uri: sg.dataUri }}
                style={s.sigImage}
                resizeMode="contain"
              />
              <View style={s.sigContent}>
                <Text style={s.name}>{sg.name}</Text>
                <Text style={s.date}>
                  {new Date(sg.createdAt).toLocaleDateString('es-UY')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteSignature(sg.id)}
                style={s.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Contenido: Diseño */}
      {tab === 'design' && (
        <ScrollView style={s.body} testID="design-panel" contentContainerStyle={s.bodyContent}>
          <Text style={s.sectionTitle}>🎨 Diseño de PDF</Text>

          {/* Color corporativo */}
          <View style={s.designSection}>
            <Text style={s.label}>Color Corporativo</Text>
            <Text style={s.sublabel}>Color principal para encabezados y resúmenes</Text>
            <View style={s.palette}>
              {COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    s.swatch,
                    { backgroundColor: c.hex },
                    prefs.accentColor === c.hex && s.swatchActive,
                  ]}
                  testID={`swatch-${c.hex}`}
                  onPress={() => handleColorChange(c.hex)}
                >
                  {prefs.accentColor === c.hex && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Intensidad */}
          <View style={s.designSection}>
            <Text style={s.label}>Intensidad de Color</Text>
            <Text style={s.sublabel}>
              Nivel de saturación: {Math.round(prefs.colorIntensity * 100)}%
            </Text>
            <View style={s.intensityRow}>
              {[0.4, 0.6, 0.8, 1.0].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    s.intensityDot,
                    prefs.colorIntensity === val && s.intensityDotActive,
                  ]}
                  testID={`int-${val}`}
                  onPress={() => handleIntensityChange(val)}
                >
                  <Text style={s.intensityLabel}>{Math.round(val * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tonalidad negativos */}
          <View style={s.designSection}>
            <Text style={s.label}>Tonalidad de Números Negativos</Text>
            <Text style={s.sublabel}>Intensidad del rojo en egresos</Text>
            <View style={s.negativeRow}>
              {[
                { key: 'soft', label: 'Suave' },
                { key: 'medium', label: 'Medio' },
                { key: 'strong', label: 'Fuerte' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.negativeBtn,
                    prefs.negativeRed === opt.key && s.negativeBtnActive,
                  ]}
                  testID={`negative-${opt.key}`}
                  onPress={() => handleNegativeRedChange(opt.key as any)}
                >
                  <Text
                    style={[
                      s.negativeBtnText,
                      prefs.negativeRed === opt.key && s.negativeBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Abrir con... automático */}
          <View style={s.designSection}>
            <View style={s.switchRow}>
              <View style={s.switchLabelContainer}>
                <Text style={s.label}>Abrir con... automático</Text>
                <Text style={s.sublabel}>
                  Mostrar selector de apps tras exportar PDF/CSV
                </Text>
              </View>
              <Switch
                value={prefs.showOpenWithAfterExport}
                onValueChange={async (val) => {
                  await updatePrefs({ showOpenWithAfterExport: val });
                }}
                testID="switch-open-with"
                trackColor={{ false: '#ddd', true: '#3E7D75' }}
                thumbColor={prefs.showOpenWithAfterExport ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Restablecer */}
          <TouchableOpacity
            style={s.ghostBtn}
            onPress={() => {
              Alert.alert(
                'Restablecer diseño',
                '¿Volver a los valores por defecto?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Restablecer', onPress: reset },
                ]
              );
            }}
            testID="btn-reset-prefs"
          >
            <Ionicons name="refresh-outline" size={18} color="#0A84FF" />
            <Text style={s.link}>Restablecer valores por defecto</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function TabBtn({
  label,
  icon,
  active,
  onPress,
  testID,
}: {
  label: string;
  icon: any;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[s.tab, active && s.tabActive]}
    >
      <Ionicons name={icon} size={20} color={active ? '#3E7D75' : '#999'} />
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFCF8' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#F0F7F6',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3E7D75',
    fontWeight: '700',
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4D3527',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  muted: { color: '#888', fontSize: 16, marginTop: 12, fontWeight: '600' },
  mutedSmall: { color: '#aaa', fontSize: 13, marginTop: 4 },
  primaryBtn: {
    backgroundColor: '#3E7D75',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cleanupBtn: {
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#FFD4D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cleanupText: { color: '#E74C3C', fontWeight: '600', fontSize: 14 },
  sigRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sigImage: { width: 80, height: 40, backgroundColor: '#f9f9f9', borderRadius: 6 },
  sigContent: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#4D3527' },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
  },
  designSection: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '700', color: '#4D3527', marginBottom: 4 },
  sublabel: { fontSize: 13, color: '#999', marginBottom: 12 },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  swatchActive: {
    borderColor: '#333',
    shadowOpacity: 0.2,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  intensityDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  intensityDotActive: {
    borderColor: '#3E7D75',
    backgroundColor: '#F0F7F6',
    borderWidth: 3,
  },
  intensityLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  negativeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  negativeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  negativeBtnActive: {
    borderColor: '#3E7D75',
    backgroundColor: '#F0F7F6',
  },
  negativeBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  negativeBtnTextActive: { color: '#3E7D75' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabelContainer: {
    flex: 1,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  link: { color: '#0A84FF', fontSize: 15, fontWeight: '600' },
});
