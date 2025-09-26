import React, { useMemo, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMovimientos } from '../state/MovimientosContext';
import { getDateString } from '../utils/date';
import { getEstadoColor } from '../utils/estadoColor';
import { exportarPDFSeleccion } from '../utils/pdfExport';
import ActionSheet from '../components/ActionSheet';

export default function PantallaHistorial() {
  const { movimientos, updateMovimiento, removeMovimiento } = useMovimientos();
  const route = useRoute();
  const navigation = useNavigation();
  const filter = route.params?.filter ?? null;
  
  // Estados para el modo de selección
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'Historial',
      headerBackTitle: 'Volver',
    });
  }, [navigation]);

  // Global list ordered DESC by fechaISO, independent of calendar
  const filtered = useMemo(() => {
    let base = [...movimientos];
    if (filter?.day) {
      base = base.filter(m => getDateString(m.fechaISO) === filter.day);
    }
    if (filter?.estado) {
      if (filter.estado === 'no-pagado') {
        base = base.filter(m => m.estado !== 'pagado');
      } else {
        base = base.filter(m => m.estado === filter.estado);
      }
    }
    return base;
  }, [movimientos, filter]);

  const sortedMovimientos = useMemo(() => {
    return filtered.sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  }, [filtered]);

  const formatDate = (fechaISO) => {
    try {
      return new Date(fechaISO).toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handleEditar = (item) => {
    navigation.navigate('MovementDetail', { mode: 'edit', id: item.id });
  };

  const handleMarcarPagado = (item) => {
    if (item.estado === 'pagado') return;
    const result = updateMovimiento(item.id, { estado: 'pagado' });
    if (!result?.success) {
      console.warn('Error al marcar pagado:', result?.error);
    }
  };

  const handleBorrar = (item) => {
    Alert.alert(
      'Borrar movimiento',
      '¿Seguro que querés borrar este movimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => {
            const result = removeMovimiento(item.id);
            if (!result?.success) {
              console.warn('Error al borrar:', result?.error);
            }
          } 
        },
      ]
    );
  };

  // Manejar cambio de modo selección
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set()); // Limpiar selección al cambiar modo
  };

  // Manejar selección de items
  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Manejar cierre del ActionSheet
  const handleActionSheetClose = () => {
    setActionSheetVisible(false);
    setExportResult(null);
  };

  // Exportar items seleccionados
  const handleExportarSeleccionados = async () => {
    if (selectedItems.size === 0) {
      Alert.alert(
        'Sin selección',
        'Debe seleccionar al menos un movimiento para exportar.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsExporting(true);

      // Filtrar movimientos seleccionados
      const movimientosSeleccionados = sortedMovimientos.filter(mov => 
        selectedItems.has(mov.id)
      );

      const result = await exportarPDFSeleccion(movimientosSeleccionados, {
        titulo: 'Movimientos Seleccionados',
        contexto: 'seleccion'
      });

      if (result.success) {
        setExportResult(result);
        setActionSheetVisible(true);
        
        // Limpiar selección después de mostrar ActionSheet
        setSelectedItems(new Set());
      } else {
        Alert.alert('Error', 'No se pudo exportar el archivo PDF.');
      }

      // No limpiar aquí, se hace después del ActionSheet
      setSelectedItems(new Set());

    } catch (error) {
      console.error('Error al exportar seleccionados:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al generar el PDF. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderMovementItem = ({ item }) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.movementItem,
          selectionMode && styles.movementItemSelectable,
          isSelected && styles.movementItemSelected
        ]}
        onPress={selectionMode ? () => toggleItemSelection(item.id) : undefined}
        activeOpacity={selectionMode ? 0.7 : 1}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={isSelected ? '#3E7D75' : '#ccc'} 
            />
          </View>
        )}
        
        <View style={[styles.movementContent, selectionMode && styles.movementContentWithCheckbox]}>
          <View style={styles.movementHeader}>
            <View style={styles.movementLeft}>
              <Text style={styles.movementTipo}>
                {item.tipo === 'pago' ? 'Pago' : 'Cobro'}
              </Text>
              <Text style={styles.movementDate}>
                {formatDate(item.fechaISO)}
              </Text>
            </View>
            <View style={styles.movementRight}>
              <Text style={[
                styles.movementMonto,
                { color: item.tipo === 'pago' ? '#c62828' : '#2e7d32' }
              ]}>
                {item.tipo === 'pago' ? '-' : '+'}${item.monto}
              </Text>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                <Text style={styles.estadoText}>{item.estado}</Text>
              </View>
            </View>
          </View>
          {item.nota && (
            <Text style={styles.movementNota}>{item.nota}</Text>
          )}
          {!selectionMode && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => handleEditar(item)}>
                <Text style={styles.actionLink}>Editar</Text>
              </TouchableOpacity>
              {item.estado !== 'pagado' && (
                <TouchableOpacity onPress={() => handleMarcarPagado(item)}>
                  <Text style={styles.actionLink}>Marcar pagado</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleBorrar(item)}>
                <Text style={[styles.actionLink, { color: '#c62828' }]}>Borrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Historial</Text>
        
        {sortedMovimientos.length > 0 && (
          <View style={styles.selectionToggleContainer}>
            <Text style={styles.selectionToggleLabel}>Seleccionar para exportar</Text>
            <Switch
              value={selectionMode}
              onValueChange={toggleSelectionMode}
              trackColor={{ false: '#e0e0e0', true: '#3E7D75' }}
              thumbColor={selectionMode ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        )}
      </View>
      
      {sortedMovimientos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay movimientos registrados</Text>
          <Text style={styles.emptySubtext}>
            Los movimientos aparecerán aquí ordenados por fecha más reciente
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.subtitle}>
            {sortedMovimientos.length} movimiento{sortedMovimientos.length !== 1 ? 's' : ''} 
            {filter ? ' (filtrados)' : ''}
            {selectionMode && selectedItems.size > 0 && (
              <Text style={styles.selectionCount}> • {selectedItems.size} seleccionado{selectedItems.size !== 1 ? 's' : ''}</Text>
            )}
          </Text>
          <FlatList
            data={sortedMovimientos}
            keyExtractor={item => String(item.id ?? item._id ?? `${item.tipo}-${item.fechaISO}`)}
            renderItem={renderMovementItem}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[
              styles.listContent,
              selectionMode && selectedItems.size > 0 && { paddingBottom: 100 }
            ]}
          />
        </View>
      )}

      {/* Botón flotante para exportar seleccionados */}
      {selectionMode && selectedItems.size > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={[styles.fab, isExporting && styles.fabDisabled]}
            onPress={handleExportarSeleccionados}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="download" size={24} color="white" />
            )}
            <Text style={styles.fabText}>
              {isExporting ? 'Exportando...' : `Exportar ${selectedItems.size}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ActionSheet para compartir */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={handleActionSheetClose}
        fileUri={exportResult?.fileUri}
        fileName={exportResult?.fileName}
        mimeType={exportResult?.mimeType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4D3527',
  },
  selectionToggleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  selectionToggleLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  selectionCount: {
    color: '#3E7D75',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  movementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  movementItemSelectable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  movementItemSelected: {
    borderColor: '#3E7D75',
    backgroundColor: '#f0f7f6',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  movementContent: {
    flex: 1,
  },
  movementContentWithCheckbox: {
    flex: 1,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  movementLeft: {
    flex: 1,
  },
  movementRight: {
    alignItems: 'flex-end',
  },
  movementTipo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    color: '#666',
  },
  movementMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  movementNota: {
    fontSize: 14,
    color: '#444',
    lineHeight: 18,
  },
  separator: {
    height: 12,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 16,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E7D75',
  },
  // Estilos para FAB (Floating Action Button)
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E7D75',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  fabDisabled: {
    backgroundColor: '#bdc3c7',
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 