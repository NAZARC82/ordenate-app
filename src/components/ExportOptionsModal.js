import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { exportPDFColored, generarVistaPreviaHTML } from '../utils/pdfExport';
import { exportCSV } from '../utils/csvExport';
import { useNavigation } from '@react-navigation/native';
import ActionSheet from './ActionSheet';
import { generateSignatureOptions } from '../utils/signatureStorage';
import { FLAGS } from '../features/pdf/flags';
import { useExportModalPresets, exportWithZip, shouldCreateZip, showPostExportToast } from '../features/exports/presetIntegration';

// Clave para AsyncStorage
const STORAGE_KEY = 'exportOptions:v1';

// Opciones por defecto
const DEFAULT_OPTIONS = {
  rangoFecha: 'actual',
  fechaDesde: '',
  fechaHasta: '',
  tipo: 'ambos',
  estados: {
    pendiente: true,
    pronto: true,
    urgente: true,
    pagado: true
  },
  columnas: {
    fecha: true,
    tipo: true,
    monto: true,
    estado: true,
    nota: true
  },
  firmas: {
    modo: 'none', // 'none', 'lines', 'images'
    incluirEnCSV: false
  }
};

const ExportOptionsModal = ({ 
  visible, 
  onClose, 
  onExport, 
  movimientos = [],
  loading = false 
}) => {
  // 🔍 DEBUG: Confirmar que este componente se renderiza
  console.log('[ExportOptionsModal] render - movimientos:', movimientos.length);
  
  const navigation = useNavigation();
  
  // Estado para las opciones (inicializadas con defaults)
  const [rangoFecha, setRangoFecha] = useState(DEFAULT_OPTIONS.rangoFecha);
  const [fechaDesde, setFechaDesde] = useState(DEFAULT_OPTIONS.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(DEFAULT_OPTIONS.fechaHasta);
  const [tipo, setTipo] = useState(DEFAULT_OPTIONS.tipo);
  const [estados, setEstados] = useState(DEFAULT_OPTIONS.estados);
  const [columnas, setColumnas] = useState(DEFAULT_OPTIONS.columnas);
  const [firmas, setFirmas] = useState(DEFAULT_OPTIONS.firmas);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf', 'csv', 'both'
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Hook de presets - carga automáticamente al abrir
  const { preset, isLoading: presetsLoading, saveCurrentSelection } = useExportModalPresets({
    onLoad: (loadedPreset) => {
      console.log('[ExportOptionsModal] Preset cargado:', loadedPreset);
      // Restaurar formato si existe en el preset
      if (loadedPreset.includePdf && loadedPreset.includeCsv) {
        setExportFormat('both');
      } else if (loadedPreset.includeCsv) {
        setExportFormat('csv');
      } else {
        setExportFormat('pdf');
      }
    }
  });

  // Resetear estado de navegación cuando se cierra el modal
  useEffect(() => {
    if (!visible && isNavigating) {
      setIsNavigating(false);
    }
  }, [visible, isNavigating]);

  // Función de fallback para compartir archivos
  const shareWithFallback = async (result) => {
    try {
      // Verificar si sharing está disponible
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(result.fileUri, {
          mimeType: result.mimeType || 'application/octet-stream',
          dialogTitle: 'Compartir archivo'
        });
      } else {
        // Fallback: intentar guardar en directorio de documentos del usuario
        const fileName = result.fileName || 'archivo_exportado';
        const documentsDir = FileSystem.documentDirectory;
        const newPath = `${documentsDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: result.fileUri,
          to: newPath
        });
        
        Alert.alert(
          'Archivo guardado',
          `El archivo se guardó en: ${newPath}`,
          [
            { text: 'OK' },
            {
              text: 'Abrir carpeta',
              onPress: () => FileSystem.getInfoAsync(documentsDir)
                .then(() => Alert.alert('Info', 'Archivo disponible en la carpeta de documentos de la app'))
                .catch(() => {})
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al compartir archivo:', error);
      Alert.alert(
        'Error al compartir',
        'No se pudo compartir el archivo. Se guardó localmente en la app.'
      );
    }
  };

  // Funciones de persistencia
  const saveOptions = async () => {
    try {
      const options = {
        rangoFecha,
        fechaDesde,
        fechaHasta,
        tipo,
        estados,
        columnas,
        firmas
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (error) {
      console.warn('Error guardando opciones de exportación:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const savedOptions = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedOptions) {
        const parsed = JSON.parse(savedOptions);
        
        // Aplicar opciones guardadas
        setRangoFecha(parsed.rangoFecha || DEFAULT_OPTIONS.rangoFecha);
        setFechaDesde(parsed.fechaDesde || DEFAULT_OPTIONS.fechaDesde);
        setFechaHasta(parsed.fechaHasta || DEFAULT_OPTIONS.fechaHasta);
        setTipo(parsed.tipo || DEFAULT_OPTIONS.tipo);
        setEstados({ ...DEFAULT_OPTIONS.estados, ...parsed.estados });
        setColumnas({ ...DEFAULT_OPTIONS.columnas, ...parsed.columnas });
        setFirmas({ ...DEFAULT_OPTIONS.firmas, ...parsed.firmas });
      }
    } catch (error) {
      console.warn('Error cargando opciones de exportación:', error);
      // En caso de error, mantener defaults
    }
  };

  // Cargar opciones guardadas al abrir el modal
  useEffect(() => {
    if (visible) {
      loadOptions();
    }
  }, [visible]);

  // Validar fecha personalizada (dd/mm/aaaa)
  const validarFecha = (fecha) => {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = fecha.match(regex);
    
    if (!match) return null;
    
    const [, dia, mes, ano] = match;
    const fechaObj = new Date(ano, mes - 1, dia);
    
    // Verificar si la fecha es válida
    if (fechaObj.getDate() != dia || fechaObj.getMonth() != mes - 1 || fechaObj.getFullYear() != ano) {
      return null;
    }
    
    return fechaObj;
  };

  // Filtrar movimientos según opciones
  const filtrarMovimientos = () => {
    let movsFiltrados = [...movimientos];
    
    // Filtrar por fecha
    if (rangoFecha === 'actual') {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      movsFiltrados = movsFiltrados.filter(mov => {
        if (!mov.fechaISO) return false;
        return mov.fechaISO.slice(0, 7) === mesActual;
      });
    } else if (rangoFecha === 'anterior') {
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1);
      const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;
      movsFiltrados = movsFiltrados.filter(mov => {
        if (!mov.fechaISO) return false;
        return mov.fechaISO.slice(0, 7) === mesAnteriorStr;
      });
    } else if (rangoFecha === 'personalizado') {
      const desde = validarFecha(fechaDesde);
      const hasta = validarFecha(fechaHasta);
      
      if (!desde || !hasta) {
        throw new Error('Fechas personalizadas inválidas');
      }
      
      if (desde > hasta) {
        throw new Error('La fecha desde debe ser menor o igual a la fecha hasta');
      }
      
      movsFiltrados = movsFiltrados.filter(mov => {
        if (!mov.fechaISO) return false;
        const fechaMov = new Date(mov.fechaISO);
        return fechaMov >= desde && fechaMov <= hasta;
      });
    }
    
    // Filtrar por tipo
    if (tipo === 'pagos') {
      movsFiltrados = movsFiltrados.filter(mov => mov.tipo === 'pago');
    } else if (tipo === 'cobros') {
      movsFiltrados = movsFiltrados.filter(mov => mov.tipo === 'cobro');
    }
    
    // Filtrar por estados
    const estadosSeleccionados = Object.keys(estados).filter(key => estados[key]);
    if (estadosSeleccionados.length === 0) {
      throw new Error('Debe seleccionar al menos un estado');
    }
    movsFiltrados = movsFiltrados.filter(mov => {
      // Validar que el movimiento tenga datos mínimos
      if (!mov || typeof mov !== 'object') return false;
      const estado = mov.estado || 'pendiente';
      return estadosSeleccionados.includes(estado);
    });
    
    return movsFiltrados;
  };

  // Obtener columnas seleccionadas
  const obtenerColumnasSeleccionadas = () => {
    const columnasSeleccionadas = Object.keys(columnas).filter(key => columnas[key]);
    if (columnasSeleccionadas.length === 0) {
      throw new Error('Debe seleccionar al menos una columna');
    }
    return columnasSeleccionadas;
  };

  // Manejar exportación
  const handleExportar = async () => {
    console.log('[export] Iniciando exportación - formato:', exportFormat);
    try {
      setLocalLoading(true);
      
      const movsFiltrados = filtrarMovimientos();
      const columnasSeleccionadas = obtenerColumnasSeleccionadas();
      
      console.log('[export] Movimientos filtrados:', movsFiltrados.length);
      console.log('[export] Columnas seleccionadas:', columnasSeleccionadas);
      
      if (movsFiltrados.length === 0) {
        Alert.alert(
          'Sin resultados',
          'No hay movimientos que coincidan con los filtros seleccionados.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Generar contexto para el nombre del archivo
      const contexto = {
        rango: rangoFecha,
        tipo: tipo,
        estados: Object.keys(estados).filter(key => estados[key]),
        cantidad: movsFiltrados.length,
        fechaDesde: rangoFecha === 'personalizado' ? fechaDesde : null,
        fechaHasta: rangoFecha === 'personalizado' ? fechaHasta : null
      };
      
      // Guardar opciones antes de exportar
      await saveOptions();
      
      // Guardar preset con el formato seleccionado
      await saveCurrentSelection({
        includePdf: exportFormat === 'pdf' || exportFormat === 'both',
        includeCsv: exportFormat === 'csv' || exportFormat === 'both',
        includeTotals: true,
        dateRange: rangoFecha
      });
      
      // Generar opciones de firma si están habilitadas
      let signatureOptions = null;
      if (firmas.modo !== 'none') {
        signatureOptions = await generateSignatureOptions(firmas.modo);
      }

      let pdfResult = null;
      let csvResult = null;
      
      // Generar PDF si es necesario
      if (exportFormat === 'pdf' || exportFormat === 'both') {
        pdfResult = await exportPDFColored(movsFiltrados, {
          columnas: columnasSeleccionadas,
          titulo: 'Reporte Corporativo Filtrado',
          subtitulo: `${movsFiltrados.length} movimiento(s) - ${getRangoTexto()}`,
          contexto: 'filtrado',
          signatures: signatureOptions,
          ...contexto
        });
      }
      
      // Generar CSV si es necesario
      if (exportFormat === 'csv' || exportFormat === 'both') {
        csvResult = await exportCSV(movsFiltrados, {
          columnas: columnasSeleccionadas,
          incluirFirmas: firmas.incluirEnCSV,
          ...contexto
        });
      }
      
      // Si ambos formatos, crear ZIP
      if (exportFormat === 'both' && pdfResult?.success && csvResult?.success) {
        console.log('[export] Creando ZIP con PDF y CSV...');
        const baseName = pdfResult.fileName.replace('.pdf', '');
        const zipUri = await exportWithZip({
          pdfUri: pdfResult.uri,
          csvUri: csvResult.uri,
          outName: `${baseName}.zip`
        });
        
        const zipName = `${baseName}.zip`;
        await showPostExportToast(zipName, zipUri, 'pdf');
        
        setExportResult({ 
          success: true, 
          fileUri: zipUri,  // ActionSheet espera fileUri, no uri
          uri: zipUri,      // Mantener por compatibilidad
          fileName: zipName,
          mimeType: 'application/zip'
        });
        setActionSheetVisible(true);
      } 
      // Si solo PDF
      else if (exportFormat === 'pdf' && pdfResult?.success) {
        await showPostExportToast(pdfResult.fileName, pdfResult.uri, 'pdf');
        setExportResult(pdfResult);
        setActionSheetVisible(true);
      }
      // Si solo CSV
      else if (exportFormat === 'csv' && csvResult?.success) {
        await showPostExportToast(csvResult.fileName, csvResult.uri, 'csv');
        setExportResult(csvResult);
        setActionSheetVisible(true);
      }
      else {
        const errorMsg = 'No se pudo completar la exportación.';
        Alert.alert('Error de Exportación', errorMsg);
        onClose();
      }
      
    } catch (error) {
      console.error('[export] Error al exportar:', error.message);
      console.error('[export] Stack trace:', error.stack);
      
      let userMessage = 'No se pudo exportar el archivo.';
      if (error.message.includes('Fechas')) {
        userMessage = 'Verifica las fechas ingresadas (formato: dd/mm/aaaa).';
      } else if (error.message.includes('columna') || error.message.includes('estado')) {
        userMessage = 'Selecciona al menos una columna y un estado.';
      } else if (error.message.includes('Sin resultados')) {
        userMessage = 'No hay movimientos que coincidan con los filtros.';
      }
      
      Alert.alert('Error de Exportación', userMessage);
      onClose();
    } finally {
      setLocalLoading(false);
    }
  };

  // Manejar exportación CSV
  const handleExportarCSV = async () => {
    console.log('[export] Iniciando exportación CSV...');
    console.log('[Export] CSV click');
    try {
      setLocalLoading(true);
      
      const movsFiltrados = filtrarMovimientos();
      const columnasSeleccionadas = obtenerColumnasSeleccionadas();
      
      console.log('[export] Movimientos filtrados para CSV:', movsFiltrados.length);
      console.log('[export] Columnas seleccionadas para CSV:', columnasSeleccionadas);
      
      if (movsFiltrados.length === 0) {
        Alert.alert(
          'Sin resultados',
          'No hay movimientos que coincidan con los filtros seleccionados.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Generar contexto para el nombre del archivo
      const contexto = {
        rango: rangoFecha,
        tipo: tipo,
        estados: Object.keys(estados).filter(key => estados[key]),
        cantidad: movsFiltrados.length,
        fechaDesde: rangoFecha === 'personalizado' ? fechaDesde : null,
        fechaHasta: rangoFecha === 'personalizado' ? fechaHasta : null
      };
      
      // Guardar opciones antes de exportar
      await saveOptions();
      
      // Generar opciones de firma si están habilitadas para CSV
      let signatureOptions = null;
      if (firmas.incluirEnCSV && firmas.modo !== 'none') {
        signatureOptions = await generateSignatureOptions(firmas.modo);
      }
      
      // Exportar CSV usando la función importada
      const result = await exportCSV(movsFiltrados, {
        columnas: columnasSeleccionadas,
        contexto: 'filtrado',
        includeSignatureColumns: firmas.incluirEnCSV,
        signatures: signatureOptions,
        ...contexto
      });
      
      if (result.success) {
        setExportResult(result);
        setActionSheetVisible(true);
        // No cerrar el modal aquí - se cierra cuando se complete el ActionSheet
      } else {
        const errorMsg = result?.message || 'No se pudo exportar el archivo CSV.';
        Alert.alert('Error de Exportación', errorMsg);
        // Solo cerrar si hay error
        onClose();
      }
      
    } catch (error) {
      console.error('[export] Error al exportar CSV:', error.message);
      console.error('[export] Stack trace:', error.stack);
      
      let userMessage = 'No se pudo exportar el archivo CSV.';
      if (error.message.includes('Fechas')) {
        userMessage = 'Verifica las fechas ingresadas (formato: dd/mm/aaaa).';
      } else if (error.message.includes('columna') || error.message.includes('estado')) {
        userMessage = 'Selecciona al menos una columna y un estado.';
      } else if (error.message.includes('Sin resultados')) {
        userMessage = 'No hay movimientos que coincidan con los filtros.';
      } else if (error.message.includes('write') || error.message.includes('storage')) {
        userMessage = 'Error escribiendo el archivo. Verifica el espacio disponible.';
      }
      
      Alert.alert('Error de Exportación', userMessage);
      // Cerrar modal en caso de error
      onClose();
    } finally {
      setLocalLoading(false);
    }
  };

  // Manejar vista previa
  const handleVistaPrevia = async () => {
    console.log('[export] Iniciando vista previa...');
    // Prevenir doble navegación
    if (isNavigating || localLoading || loading) {
      console.log('[export] Vista previa cancelada - estado ocupado');
      return;
    }
    
    try {
      setIsNavigating(true);
      const movsFiltrados = filtrarMovimientos();
      
      console.log('[export] Movimientos para vista previa:', movsFiltrados.length);
      const columnasSeleccionadas = obtenerColumnasSeleccionadas();
      
      if (movsFiltrados.length === 0) {
        Alert.alert(
          'Sin resultados',
          'No hay movimientos que coincidan con los filtros seleccionados.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Generar contexto para las opciones
      const contexto = {
        rango: rangoFecha,
        tipo: tipo,
        estados: Object.keys(estados).filter(key => estados[key]),
        cantidad: movsFiltrados.length,
        fechaDesde: rangoFecha === 'personalizado' ? fechaDesde : null,
        fechaHasta: rangoFecha === 'personalizado' ? fechaHasta : null
      };
      
      // Opciones para la vista previa
      const opciones = {
        columnas: columnasSeleccionadas,
        titulo: 'Reporte Filtrado',
        subtitulo: `${movsFiltrados.length} movimiento(s) - ${getRangoTexto()}`,
        contexto: 'filtrado',
        ...contexto
      };
      
      // Generar HTML para la vista previa
      const htmlContent = generarVistaPreviaHTML(movsFiltrados, opciones);
      
      // Guardar opciones antes de navegar
      await saveOptions();
      
      // Cerrar el modal primero
      onClose();
      
      // Navegar a la vista previa después de un pequeño delay
      setTimeout(() => {
        navigation.navigate('VistaPreviaExport', {
          htmlContent,
          movimientos: movsFiltrados,
          opciones
        });
      }, 100);
      
    } catch (error) {
      console.error('[export] Error al generar vista previa:', error.message);
      console.error('[export] Stack trace:', error.stack);
      Alert.alert('Error', `No se pudo generar la vista previa: ${error.message}`);
      setIsNavigating(false);
    }
  };

  // Obtener texto descriptivo del rango
  const getRangoTexto = () => {
    switch (rangoFecha) {
      case 'actual':
        return 'Mes actual';
      case 'anterior':
        return 'Mes anterior';
      case 'personalizado':
        return `${fechaDesde} - ${fechaHasta}`;
      default:
        return '';
    }
  };

  const toggleEstado = (estado) => {
    setEstados(prev => ({ ...prev, [estado]: !prev[estado] }));
  };

  const toggleColumna = (columna) => {
    setColumnas(prev => ({ ...prev, [columna]: !prev[columna] }));
  };

  // Manejar cierre del ActionSheet
  const handleActionSheetClose = () => {
    setActionSheetVisible(false);
    setExportResult(null);
    // Cerrar el modal después de que se complete el ActionSheet
    onClose();
  };

  // Manejar cierre del modal guardando opciones
  const handleClose = async () => {
    await saveOptions();
    onClose();
  };

  if (!visible) return null;

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Opciones de Exportación</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rango de fechas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Rango de fechas</Text>
            
            <TouchableOpacity 
              style={[styles.radioOption, rangoFecha === 'actual' && styles.radioSelected]}
              onPress={() => setRangoFecha('actual')}
            >
              <Ionicons 
                name={rangoFecha === 'actual' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Mes actual</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioOption, rangoFecha === 'anterior' && styles.radioSelected]}
              onPress={() => setRangoFecha('anterior')}
            >
              <Ionicons 
                name={rangoFecha === 'anterior' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Mes anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioOption, rangoFecha === 'personalizado' && styles.radioSelected]}
              onPress={() => setRangoFecha('personalizado')}
            >
              <Ionicons 
                name={rangoFecha === 'personalizado' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Personalizado</Text>
            </TouchableOpacity>

            {rangoFecha === 'personalizado' && (
              <View style={styles.dateInputs}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Desde:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={fechaDesde}
                    onChangeText={setFechaDesde}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Hasta:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={fechaHasta}
                    onChangeText={setFechaHasta}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Tipo de movimientos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Tipo de movimientos</Text>
            
            <TouchableOpacity 
              style={[styles.radioOption, tipo === 'ambos' && styles.radioSelected]}
              onPress={() => setTipo('ambos')}
            >
              <Ionicons 
                name={tipo === 'ambos' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Ambos (pagos y cobros)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioOption, tipo === 'pagos' && styles.radioSelected]}
              onPress={() => setTipo('pagos')}
            >
              <Ionicons 
                name={tipo === 'pagos' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Solo pagos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioOption, tipo === 'cobros' && styles.radioSelected]}
              onPress={() => setTipo('cobros')}
            >
              <Ionicons 
                name={tipo === 'cobros' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498DB" 
              />
              <Text style={styles.radioText}>Solo cobros</Text>
            </TouchableOpacity>
          </View>

          {/* Estados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Estados (selección múltiple)</Text>
            
            {Object.keys(estados).map((estado) => (
              <TouchableOpacity 
                key={estado}
                style={[styles.checkboxOption, estados[estado] && styles.checkboxSelected]}
                onPress={() => toggleEstado(estado)}
              >
                <Ionicons 
                  name={estados[estado] ? 'checkbox' : 'checkbox-outline'} 
                  size={20} 
                  color="#3498DB" 
                />
                <Text style={styles.checkboxText}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Columnas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Columnas a incluir</Text>
            
            {Object.keys(columnas).map((columna) => (
              <TouchableOpacity 
                key={columna}
                style={[styles.checkboxOption, columnas[columna] && styles.checkboxSelected]}
                onPress={() => toggleColumna(columna)}
              >
                <Ionicons 
                  name={columnas[columna] ? 'checkbox' : 'checkbox-outline'} 
                  size={20} 
                  color="#3498DB" 
                />
                <Text style={styles.checkboxText}>{columna.charAt(0).toUpperCase() + columna.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Firmas */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={styles.sectionTitle}>🖋️ Opciones de Firma</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => navigation.navigate('SignatureManager')}
              >
                <Ionicons name="settings" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              Configure cómo se mostrarán las firmas en las exportaciones
            </Text>
            
            {/* Modo de firma */}
            <View style={styles.signatureModeContainer}>
              {[
                { key: 'none', label: 'Sin firmas', icon: 'close-circle-outline' },
                { key: 'lines', label: 'Solo líneas', icon: 'remove' },
                { key: 'images', label: 'Con imágenes', icon: 'image-outline' }
              ].map((mode) => (
                <TouchableOpacity 
                  key={mode.key}
                  style={[
                    styles.signatureModeButton, 
                    firmas.modo === mode.key && styles.signatureModeSelected
                  ]}
                  onPress={() => setFirmas(prev => ({ ...prev, modo: mode.key }))}
                >
                  <Ionicons 
                    name={mode.icon} 
                    size={18} 
                    color={firmas.modo === mode.key ? '#FFFFFF' : '#666'} 
                  />
                  <Text style={[
                    styles.signatureModeText,
                    firmas.modo === mode.key && styles.signatureModeTextSelected
                  ]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Opción para CSV */}
            {firmas.modo !== 'none' && (
              <View style={styles.csvSignatureOption}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Incluir datos de firma en CSV</Text>
                  <Switch
                    value={firmas.incluirEnCSV}
                    onValueChange={(value) => setFirmas(prev => ({ ...prev, incluirEnCSV: value }))}
                    trackColor={{ false: '#E0E0E0', true: '#3E7D75' }}
                    thumbColor={firmas.incluirEnCSV ? '#FFFFFF' : '#F4F3F4'}
                  />
                </View>
                <Text style={styles.csvHelpText}>
                  Agrega columnas con información de firma al archivo CSV
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {/* Selector de formato */}
          <View style={styles.formatSelector}>
            <Text style={styles.formatLabel}>Formato de Exportación:</Text>
            <View style={styles.formatButtons}>
              <TouchableOpacity 
                style={[
                  styles.formatButton, 
                  exportFormat === 'pdf' && styles.formatButtonActive
                ]}
                onPress={() => setExportFormat('pdf')}
              >
                <Ionicons 
                  name="document-text" 
                  size={18} 
                  color={exportFormat === 'pdf' ? '#FFFFFF' : '#666'} 
                />
                <Text style={[
                  styles.formatButtonText,
                  exportFormat === 'pdf' && styles.formatButtonTextActive
                ]}>PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.formatButton, 
                  exportFormat === 'csv' && styles.formatButtonActive
                ]}
                onPress={() => setExportFormat('csv')}
              >
                <Ionicons 
                  name="grid" 
                  size={18} 
                  color={exportFormat === 'csv' ? '#FFFFFF' : '#666'} 
                />
                <Text style={[
                  styles.formatButtonText,
                  exportFormat === 'csv' && styles.formatButtonTextActive
                ]}>CSV</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.formatButton, 
                  exportFormat === 'both' && styles.formatButtonActive
                ]}
                onPress={() => setExportFormat('both')}
              >
                <Ionicons 
                  name="folder-outline" 
                  size={18} 
                  color={exportFormat === 'both' ? '#FFFFFF' : '#666'} 
                />
                <Text style={[
                  styles.formatButtonText,
                  exportFormat === 'both' && styles.formatButtonTextActive
                ]}>ZIP</Text>
              </TouchableOpacity>
            </View>
            {exportFormat === 'both' && (
              <Text style={styles.formatHelpText}>
                Genera PDF y CSV en un solo archivo ZIP
              </Text>
            )}
          </View>
          
          {/* Primera fila - Vista Previa */}
          <TouchableOpacity 
            style={[styles.exportButton, styles.previewButton, (isNavigating || localLoading || loading) && styles.exportButtonDisabled]}
            onPress={handleVistaPrevia}
            disabled={isNavigating || localLoading || loading}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.exportButtonText}>Vista Previa</Text>
          </TouchableOpacity>
          
          {/* Botón único de exportar */}
          <TouchableOpacity 
            style={[styles.exportButton, styles.pdfButton, (localLoading || loading) && styles.exportButtonDisabled]}
            onPress={handleExportar}
            disabled={localLoading || loading}
          >
            {(localLoading || loading) ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons 
                name={exportFormat === 'pdf' ? 'document-text' : exportFormat === 'csv' ? 'grid' : 'folder-outline'} 
                size={20} 
                color="white" 
              />
            )}
            <Text style={styles.exportButtonText}>
              {(localLoading || loading) ? 'Generando...' : `Exportar ${exportFormat.toUpperCase()}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* ActionSheet para compartir */}
    <ActionSheet
      visible={actionSheetVisible}
      onClose={handleActionSheetClose}
      fileUri={exportResult?.fileUri}
      fileName={exportResult?.fileName}
      mimeType={exportResult?.mimeType}
      documentId={exportResult?.documentId}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  radioSelected: {
    backgroundColor: '#e3f2fd',
  },
  radioText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#2c3e50',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  checkboxSelected: {
    backgroundColor: '#e3f2fd',
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#2c3e50',
  },
  dateInputs: {
    marginTop: 12,
    gap: 12,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    width: 60,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: 'white',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  previewButton: {
    backgroundColor: '#3498db',
  },
  designButton: {
    backgroundColor: '#6A5ACD', // Violeta corporativo
  },
  pdfButton: {
    backgroundColor: '#e74c3c',
  },
  csvButton: {
    backgroundColor: '#27ae60',
  },
  exportButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  signatureModeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  signatureModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  signatureModeSelected: {
    backgroundColor: '#3E7D75',
    borderColor: '#3E7D75',
  },
  signatureModeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  signatureModeTextSelected: {
    color: '#FFFFFF',
  },
  csvSignatureOption: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  formatSelector: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
  },
  formatButtonActive: {
    backgroundColor: '#3E7D75',
    borderColor: '#3E7D75',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  formatButtonTextActive: {
    color: '#FFFFFF',
  },
  formatHelpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  csvHelpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default ExportOptionsModal;