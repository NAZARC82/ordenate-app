// src/components/InternalItemPicker.tsx
// FASE6.1-b: Selector de elementos internos para vincular a carpetas

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MovimientosContext } from '../state/MovimientosContext';
import { findFoldersForItem } from '../features/folders/folders.data';

// ============================================================================
// TYPES
// ============================================================================

export type InternalItemType = 'pago' | 'cobro' | 'recordatorio';

export interface InternalItem {
  type: InternalItemType;
  refId: string;
  titulo: string; // Concepto o nota
  monto?: number; // Solo para pagos/cobros
  fecha: string; // ISO 8601
  estado?: 'pendiente' | 'pronto' | 'urgente' | 'pagado';
  prioridad?: 'baja' | 'media' | 'alta';
  completado?: boolean;
}

interface InternalItemPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selected: InternalItem[]) => void;
  currentFolder?: string; // Para marcar "Ya en carpeta"
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InternalItemPicker({
  visible,
  onClose,
  onConfirm,
  currentFolder,
}: InternalItemPickerProps) {
  const [activeTab, setActiveTab] = useState<InternalItemType>('pago');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<InternalItem[]>([]);
  const [linkedItems, setLinkedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const movimientosContext = useContext(MovimientosContext);

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  const loadItems = async () => {
    console.log('[FASE6.1-b] Loading items for picker:', activeTab);
    setLoading(true);

    try {
      let loadedItems: InternalItem[] = [];

      if (activeTab === 'pago' || activeTab === 'cobro') {
        // Cargar pagos/cobros del MovimientosContext
        const allMovements = movimientosContext?.movimientos || [];
        loadedItems = allMovements
          .filter((m: any) => m.tipo === activeTab)
          .map((m: any) => ({
            type: m.tipo as InternalItemType,
            refId: m.id,
            titulo: m.nota || `${m.tipo === 'pago' ? 'Pago' : 'Cobro'} sin concepto`,
            monto: m.monto || 0,
            fecha: m.fechaISO,
            estado: m.estado || 'pendiente',
          }));
      } else if (activeTab === 'recordatorio') {
        // TODO: Integrar con ReminderService cuando esté disponible
        // Por ahora retornar array vacío
        loadedItems = [];
      }

      setItems(loadedItems);

      // Marcar items que ya están en la carpeta actual
      if (currentFolder) {
        const linked = new Set<string>();
        for (const item of loadedItems) {
          const folders = await findFoldersForItem(item.type, item.refId);
          if (folders.includes(currentFolder)) {
            linked.add(item.refId);
          }
        }
        setLinkedItems(linked);
      }

      console.log('[FASE6.1-b] pickerLoaded', {
        tab: activeTab,
        count: loadedItems.length,
        linked: linkedItems.size,
      });
    } catch (error) {
      console.error('[FASE6.1-b] Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadItems();
    } else {
      // Reset al cerrar
      setSelected(new Set());
      setActiveTab('pago');
    }
  }, [visible, activeTab]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleSelection = (refId: string) => {
    // No permitir seleccionar items ya vinculados
    if (linkedItems.has(refId)) return;

    const newSelected = new Set(selected);
    if (newSelected.has(refId)) {
      newSelected.delete(refId);
    } else {
      newSelected.add(refId);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selected.has(item.refId));
    console.log('[FASE6.1-b] pickerConfirm', {
      selected: selectedItems.length,
      types: selectedItems.map((i) => i.type),
    });
    onConfirm(selectedItems);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  const formatMonto = (monto: number): string => {
    return `$${(monto || 0).toFixed(2)}`;
  };

  const getEstadoColor = (estado?: string): string => {
    switch (estado) {
      case 'urgente':
        return '#E74C3C';
      case 'pronto':
        return '#F39C12';
      case 'pendiente':
        return '#999';
      case 'pagado':
        return '#27AE60';
      default:
        return '#999';
    }
  };

  const renderItem = (item: InternalItem) => {
    const isSelected = selected.has(item.refId);
    const isLinked = linkedItems.has(item.refId);

    return (
      <TouchableOpacity
        key={item.refId}
        style={[
          s.itemCard,
          isSelected && s.itemCardSelected,
          isLinked && s.itemCardLinked,
        ]}
        onPress={() => toggleSelection(item.refId)}
        disabled={isLinked}
      >
        {/* Checkbox */}
        <View style={s.checkbox}>
          {isLinked ? (
            <Ionicons name="checkmark-done-circle" size={24} color="#3E7D75" />
          ) : (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? '#3E7D75' : '#ccc'}
            />
          )}
        </View>

        {/* Contenido */}
        <View style={s.itemContent}>
          <Text style={s.itemTitle} numberOfLines={2}>
            {item.titulo}
          </Text>

          <View style={s.itemFooter}>
            {item.monto !== undefined && (
              <Text style={[s.itemMonto, { color: getEstadoColor(item.estado) }]}>
                {formatMonto(item.monto)}
              </Text>
            )}
            <Text style={s.itemDate}>{formatDate(item.fecha)}</Text>
          </View>

          {isLinked && (
            <View style={s.linkedBadge}>
              <Text style={s.linkedText}>✅ Ya en carpeta</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Vincular elementos</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'pago' && s.tabActive]}
            onPress={() => setActiveTab('pago')}
          >
            <Text style={[s.tabText, activeTab === 'pago' && s.tabTextActive]}>
              💵 Pagos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'cobro' && s.tabActive]}
            onPress={() => setActiveTab('cobro')}
          >
            <Text style={[s.tabText, activeTab === 'cobro' && s.tabTextActive]}>
              💰 Cobros
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'recordatorio' && s.tabActive]}
            onPress={() => setActiveTab('recordatorio')}
          >
            <Text style={[s.tabText, activeTab === 'recordatorio' && s.tabTextActive]}>
              ⏰ Recordatorios
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color="#3E7D75" />
          </View>
        ) : items.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={s.emptyText}>No hay {activeTab}s para vincular</Text>
          </View>
        ) : (
          <ScrollView style={s.list} contentContainerStyle={s.listContent}>
            {items.map(renderItem)}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.confirmBtn, selected.size === 0 && s.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={selected.size === 0}
          >
            <Text style={s.confirmBtnText}>
              Vincular {selected.size > 0 ? `${selected.size} seleccionado${selected.size > 1 ? 's' : ''}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3E7D75',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  tabTextActive: {
    color: '#3E7D75',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: '#3E7D75',
    borderWidth: 2,
    backgroundColor: '#F0F7F6',
  },
  itemCardLinked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMonto: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 13,
    color: '#999',
  },
  linkedBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  linkedText: {
    fontSize: 12,
    color: '#3E7D75',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#3E7D75',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#ccc',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
