import React, { useMemo, useLayoutEffect, useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Switch, ActivityIndicator, Platform, ActionSheetIOS, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { useMovimientos } from '../state/MovimientosContext'
import { getDateString } from '../utils/date'
import { getEstadoColor } from '../utils/estadoColor'
import { exportarPDFSeleccion } from '../utils/pdfExport'
import { exportCSV, exportPDF, exportPDFStyled } from '../utils/exporters'
import { buildExportName, getMovementsDateRange, isSingleDay, formatDateForFilename, buildSubtitle, fmtYMD } from '../utils/exportName'
import ActionSheet from '../components/ActionSheet'

export default function PantallaHistorial() {
  const { movimientos, updateMovimiento, removeMovimiento } = useMovimientos();
  const route = useRoute();
  const navigation = useNavigation();
  
  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState('todos');
  
  // Obtener filtro inicial de route.params
  const initialFilter = route.params?.initialFilter;
  const legacyFilter = route.params?.filter ?? null;
  
  // Estados para el modo de selección
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // Manejar filtro inicial desde route.params
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter === 'pagos') {
        setActiveTab('pagos');
      } else if (initialFilter === 'cobros') {
        setActiveTab('cobros');
      } else if (initialFilter === 'todos') {
        setActiveTab('todos');
      }
      
      // Limpiar el param para evitar que se ejecute de nuevo
      navigation.setParams({ initialFilter: undefined });
    }
  }, [initialFilter, navigation]);

  useLayoutEffect(() => {
    // Título dinámico según el activeTab
    let title = 'Historial';
    if (activeTab === 'pagos') {
      title = 'Historial - Pagos';
    } else if (activeTab === 'cobros') {
      title = 'Historial - Cobros';
    } else if (legacyFilter?.day) {
      title = `Historial - ${legacyFilter.day}`;
    } else if (legacyFilter?.estado) {
      title = `Historial - ${legacyFilter.estado}`;
    }
    
    navigation.setOptions?.({
      title,
      headerBackTitle: 'Volver',
    });
  }, [navigation, activeTab, legacyFilter]);

  // Global list ordered DESC by fechaISO, independent of calendar
  const filtered = useMemo(() => {
    let base = [...movimientos];
    
    // Filtro por día (legacy filter)
    if (legacyFilter?.day) {
      base = base.filter(m => getDateString(m.fechaISO) === legacyFilter.day);
    }
    
    // Filtro por estado (legacy filter)
    if (legacyFilter?.estado) {
      if (legacyFilter.estado === 'no-pagado') {
        base = base.filter(m => m.estado !== 'pagado');
      } else {
        base = base.filter(m => m.estado === legacyFilter.estado);
      }
    }
    
    // Filtro por activeTab
    if (activeTab === 'pagos') {
      base = base.filter(m => m.tipo === 'pago');
    } else if (activeTab === 'cobros') {
      base = base.filter(m => m.tipo === 'cobro');
    }
    // Si activeTab === 'todos', no filtramos por tipo
    
    return base;
  }, [movimientos, activeTab, legacyFilter]);

  const sortedMovimientos = useMemo(() => {
    return filtered.sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  }, [filtered]);

  // Calcular parámetros para subtítulo
  const subtitleParams = useMemo(() => {
    // Detectar si hay filtro de día específico
    const dayFilter = legacyFilter?.day;
    let dateYMD, rangeStartYMD, rangeEndYMD;
    
    if (dayFilter) {
      // Filtro por día específico
      dateYMD = dayFilter;
    } else if (sortedMovimientos.length > 1 && !isSingleDay(sortedMovimientos)) {
      // Múltiples días - usar rango
      const range = getMovementsDateRange(sortedMovimientos);
      rangeStartYMD = range.startYMD;
      rangeEndYMD = range.endYMD;
    } else if (sortedMovimientos.length === 1) {
      // Un solo movimiento - usar su fecha
      dateYMD = formatDateForFilename(sortedMovimientos[0].fechaISO);
    } else if (sortedMovimientos.length > 1 && isSingleDay(sortedMovimientos)) {
      // Todos del mismo día
      dateYMD = formatDateForFilename(sortedMovimientos[0].fechaISO);
    }
    
    return {
      activeTab,
      dateYMD,
      rangeStartYMD,
      rangeEndYMD,
      resultCount: sortedMovimientos.length,
      selectedCount: selectedItems.size > 0 ? selectedItems.size : undefined
    };
  }, [activeTab, sortedMovimientos, legacyFilter, selectedItems]);

  // Generar subtítulo
  const subtitle = buildSubtitle(subtitleParams);

  const formatDate = (fechaISO) => {
    try {
      return new Date(fechaISO).toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error formateando fecha:', fechaISO, error);
      return 'Fecha inválida';
    }
  };

  // Componente EmptyState dinámico
  const EmptyState = ({ activeTab }) => {
    const getEmptyMessage = () => {
      switch (activeTab) {
        case 'pagos':
          return {
            title: 'Sin resultados',
            subtitle: 'No hay pagos en este período.'
          };
        case 'cobros':
          return {
            title: 'Sin resultados',
            subtitle: 'No hay cobros en este período.'
          };
        default:
          return {
            title: 'Sin resultados',
            subtitle: 'No hay movimientos aún.'
          };
      }
    };

    const { title, subtitle } = getEmptyMessage();

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="folder-open-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      </View>
    );
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

  // Crear recordatorio desde movimiento
  const handleCrearRecordatorio = (item) => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('ReminderForm', {
        mode: 'create',
        linkedMovementId: item.id,
        type: item.tipo === 'pago' ? 'pago' : 'cobro',
        movementData: {
          tipo: item.tipo,
          monto: item.monto,
          nota: item.nota,
          fechaISO: item.fechaISO
        }
      });
    } else {
      navigation.navigate('ReminderForm', {
        mode: 'create',
        linkedMovementId: item.id,
        type: item.tipo === 'pago' ? 'pago' : 'cobro',
        movementData: {
          tipo: item.tipo,
          monto: item.monto,
          nota: item.nota,
          fechaISO: item.fechaISO
        }
      });
    }
  };

  // Manejar cierre del ActionSheet
  const handleActionSheetClose = () => {
    setActionSheetVisible(false);
    setExportResult(null);
    // Limpiar selección después de completar el ActionSheet
    setSelectedItems(new Set());
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
      } else {
        Alert.alert('Error', 'No se pudo exportar el archivo PDF.');
      }

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

  // Exportar PDF usando nueva función
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Determinar qué exportar: seleccionados o todos los visibles
      const itemsToExport = selectedItems.size > 0 
        ? sortedMovimientos.filter(mov => selectedItems.has(mov.id))
        : sortedMovimientos;

      if (itemsToExport.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos para exportar.');
        return;
      }

      // Construir nombre de archivo contextual
      const selectedCount = selectedItems.size > 0 ? selectedItems.size : undefined;
      
      // Detectar si hay filtro de día específico
      const dayFilter = legacyFilter?.day;
      let dateYMD, rangeStartYMD, rangeEndYMD;
      
      if (dayFilter) {
        // Filtro por día específico
        dateYMD = dayFilter;
      } else if (itemsToExport.length > 1 && !isSingleDay(itemsToExport)) {
        // Múltiples días - usar rango
        const range = getMovementsDateRange(itemsToExport);
        rangeStartYMD = range.startYMD;
        rangeEndYMD = range.endYMD;
      } else if (itemsToExport.length === 1) {
        // Un solo movimiento - usar su fecha
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
      } else if (isSingleDay(itemsToExport)) {
        // Todos del mismo día
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
      }
      
      const filename = buildExportName({
        activeTab,
        dateYMD,
        rangeStartYMD,
        rangeEndYMD,
        selectedCount,
        ext: 'pdf'
      });
      
      await exportPDF(itemsToExport, filename);
      
      // Limpiar selección si había
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar CSV usando nueva función
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      // Determinar qué exportar: seleccionados o todos los visibles
      const itemsToExport = selectedItems.size > 0 
        ? sortedMovimientos.filter(mov => selectedItems.has(mov.id))
        : sortedMovimientos;

      if (itemsToExport.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos para exportar.');
        return;
      }

      // Construir nombre de archivo contextual
      const selectedCount = selectedItems.size > 0 ? selectedItems.size : undefined;
      
      // Detectar si hay filtro de día específico
      const dayFilter = legacyFilter?.day;
      let dateYMD, rangeStartYMD, rangeEndYMD;
      
      if (dayFilter) {
        // Filtro por día específico
        dateYMD = dayFilter;
      } else if (itemsToExport.length > 1 && !isSingleDay(itemsToExport)) {
        // Múltiples días - usar rango
        const range = getMovementsDateRange(itemsToExport);
        rangeStartYMD = range.startYMD;
        rangeEndYMD = range.endYMD;
      } else if (itemsToExport.length === 1) {
        // Un solo movimiento - usar su fecha
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
      } else if (isSingleDay(itemsToExport)) {
        // Todos del mismo día
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
      }
      
      const filename = buildExportName({
        activeTab,
        dateYMD,
        rangeStartYMD,
        rangeEndYMD,
        selectedCount,
        ext: 'csv'
      });
      
      await exportCSV(itemsToExport, filename);
      
      // Limpiar selección si había
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
      
    } catch (error) {
      console.error('Error exportando CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Función para abrir opciones de exportación
  const openExportOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['PDF', 'CSV', 'Cancelar'],
          cancelButtonIndex: 2,
          title: 'Seleccionar formato de exportación'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onExport('pdf');
          } else if (buttonIndex === 1) {
            onExport('csv');
          }
        }
      );
    } else {
      // Android: usar modal
      setShowExportModal(true);
    }
  };

  // Función unificada de exportación
  const onExport = async (kind) => {
    try {
      setIsExporting(true);
      setShowExportModal(false); // Cerrar modal de Android si está abierto

      // Determinar qué exportar: seleccionados o todos los visibles
      const itemsToExport = selectedItems.size > 0 
        ? sortedMovimientos.filter(mov => selectedItems.has(mov.id))
        : sortedMovimientos;

      if (itemsToExport.length === 0) {
        Alert.alert('Sin datos', 'No hay movimientos para exportar.');
        return;
      }

      // Construir nombre de archivo contextual y metadatos
      const selectedCount = selectedItems.size > 0 ? selectedItems.size : undefined;
      
      // Detectar si hay filtro de día específico
      const dayFilter = legacyFilter?.day;
      let dateYMD, rangeStartYMD, rangeEndYMD;
      let fechaTitulo, rango;
      
      if (dayFilter) {
        // Filtro por día específico
        dateYMD = dayFilter;
        fechaTitulo = fmtYMD(dayFilter);
      } else if (itemsToExport.length > 1 && !isSingleDay(itemsToExport)) {
        // Múltiples días - usar rango
        const range = getMovementsDateRange(itemsToExport);
        rangeStartYMD = range.startYMD;
        rangeEndYMD = range.endYMD;
        rango = `${fmtYMD(range.startYMD)} a ${fmtYMD(range.endYMD)}`;
      } else if (itemsToExport.length === 1) {
        // Un solo movimiento - usar su fecha
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
        fechaTitulo = fmtYMD(dateYMD);
      } else if (isSingleDay(itemsToExport)) {
        // Todos del mismo día
        dateYMD = formatDateForFilename(itemsToExport[0].fechaISO);
        fechaTitulo = fmtYMD(dateYMD);
      }
      
      const filename = buildExportName({
        activeTab,
        dateYMD,
        rangeStartYMD,
        rangeEndYMD,
        selectedCount,
        ext: kind
      });
      
      // Preparar metadatos para PDF estilizado
      const meta = {
        fechaTitulo,
        fechaHora: new Date().toLocaleTimeString('es-UY', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        rango
      };
      
      // Exportar según el tipo
      if (kind === 'pdf') {
        await exportPDFStyled(itemsToExport, filename, meta);
      } else if (kind === 'csv') {
        await exportCSV(itemsToExport, filename);
      }
      
      // Limpiar selección si había
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
      
    } catch (error) {
      console.error(`Error exportando ${kind}:`, error);
      Alert.alert('Error al exportar', `No se pudo exportar el archivo ${kind.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderMovementItem = ({ item }) => {
    // Validación defensiva
    if (!item || !item.id) {
      console.warn('Item inválido en renderMovementItem:', item);
      return null;
    }
    
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
                {item.tipo === 'pago' ? '-' : '+'}${typeof item.monto === 'number' ? item.monto.toLocaleString('es-UY') : (item.monto || '0')}
              </Text>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado || 'pendiente') }]}>
                <Text style={styles.estadoText}>{item.estado || 'pendiente'}</Text>
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
              <TouchableOpacity onPress={() => handleCrearRecordatorio(item)}>
                <Text style={[styles.actionLink, { color: '#3498DB' }]}>🔔 Recordatorio</Text>
              </TouchableOpacity>
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
        
        {/* Botones de filtrado por tipo */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeTab === 'todos' && styles.filterButtonActive
            ]}
            onPress={() => setActiveTab('todos')}
          >
            <Text style={[
              styles.filterButtonText,
              activeTab === 'todos' && styles.filterButtonTextActive
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeTab === 'pagos' && styles.filterButtonActive
            ]}
            onPress={() => setActiveTab('pagos')}
          >
            <Text style={[
              styles.filterButtonText,
              activeTab === 'pagos' && styles.filterButtonTextActive
            ]}>
              Pagos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeTab === 'cobros' && styles.filterButtonActive
            ]}
            onPress={() => setActiveTab('cobros')}
          >
            <Text style={[
              styles.filterButtonText,
              activeTab === 'cobros' && styles.filterButtonTextActive
            ]}>
              Cobros
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Botón para crear recordatorio general */}
        <TouchableOpacity 
          style={styles.generalReminderButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('ReminderForm', { mode: 'create', type: 'general', linkedMovementId: null });
            } else {
              navigation.navigate('ReminderForm', { mode: 'create', type: 'general', linkedMovementId: null });
            }
          }}
        >
          <Ionicons name="notifications-outline" size={20} color="#3498DB" />
          <Text style={styles.generalReminderText}>Nuevo Recordatorio</Text>
        </TouchableOpacity>
        
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
      
      {/* Subtítulo de contexto */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
        <Text style={{ color: '#6B5A4B', fontSize: 14 }}>{subtitle}</Text>
      </View>
      
      {/* FlatList robusto con EmptyState */}
      <View style={styles.listWrapper}>
        <FlatList
          data={sortedMovimientos}
          keyExtractor={(item) => `mov-${item.id ?? item._id ?? `${item.tipo}-${item.fechaISO}`}`}
          renderItem={renderMovementItem}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListEmptyComponent={<EmptyState activeTab={activeTab} />}
          contentContainerStyle={[
            styles.flatListContent,
            {
              paddingHorizontal: 16,
              paddingBottom: 24,
              flexGrow: sortedMovimientos.length === 0 ? 1 : 0,
            },
            selectionMode && selectedItems.size > 0 && { paddingBottom: 100 }
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            sortedMovimientos.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.subtitle}>
                  {sortedMovimientos.length} movimiento{sortedMovimientos.length !== 1 ? 's' : ''} 
                  {(activeTab !== 'todos' || legacyFilter) ? ' (filtrados)' : ''}
                  {selectionMode && selectedItems.size > 0 && (
                    <Text style={styles.selectionCount}> • {selectedItems.size} seleccionado{selectedItems.size !== 1 ? 's' : ''}</Text>
                  )}
                </Text>
              </View>
            ) : null
          )}
        />
      </View>

      {/* ActionsBar para exportación cuando está en modo selección */}
      {selectionMode && (
        <View style={styles.actionsBar}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.exportButton, isExporting && styles.actionButtonDisabled]}
            onPress={openExportOptions}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            <Ionicons name="share" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Exportar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.pdfButton, isExporting && styles.actionButtonDisabled]}
            onPress={() => onExport('pdf')}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="document-text" size={20} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.csvButton, isExporting && styles.actionButtonDisabled]}
            onPress={() => onExport('csv')}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="grid" size={20} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              CSV
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setSelectionMode(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color="#666" />
            <Text style={[styles.actionButtonText, { color: '#666' }]}>
              Cancelar
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

      {/* Modal de exportación para Android */}
      {Platform.OS === 'android' && (
        <Modal
          visible={showExportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar formato de exportación</Text>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => onExport('pdf')}
                disabled={isExporting}
              >
                <Ionicons name="document-text" size={24} color="#3E7D75" />
                <Text style={styles.modalButtonText}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => onExport('csv')}
                disabled={isExporting}
              >
                <Ionicons name="grid" size={24} color="#3E7D75" />
                <Text style={styles.modalButtonText}>CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowExportModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
                <Text style={[styles.modalButtonText, { color: '#666' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEE9E2',
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    gap: 4,
    zIndex: 10,
    elevation: 2,
    pointerEvents: 'auto',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3E7D75',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D3527',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  generalReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#3498DB',
    gap: 8,
  },
  generalReminderText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '600',
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
  // Eliminado - ya no se usa separator individual
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
  // Estilos para ActionsBar
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: '#e74c3c',
  },
  csvButton: {
    backgroundColor: '#27ae60',
  },
  exportButton: {
    backgroundColor: '#3E7D75',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Estilos para modal de Android
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
  },
  modalCancelButton: {
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3E7D75',
  },
}); 