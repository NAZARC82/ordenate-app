import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { exportPDFColored } from '../utils/pdfExport';
import { exportCSV } from '../utils/csvExport';

type ExportState = 'idle' | 'exporting_pdf' | 'exporting_csv';

interface ExportBarProps {
  movimientosSeleccionados?: any[];
  onExportComplete?: () => void;
  style?: any;
}

export default function ExportBar({ 
  movimientosSeleccionados = [], 
  onExportComplete,
  style 
}: ExportBarProps) {
  const [exportState, setExportState] = useState<ExportState>('idle');
  
  const isBusy = exportState !== 'idle';
  const haySeleccion = movimientosSeleccionados.length > 0;

  const disabledStyle = useMemo(
    () => ({ opacity: isBusy || !haySeleccion ? 0.5 : 1 }),
    [isBusy, haySeleccion]
  );

  async function onExportPDF() {
    if (!haySeleccion || isBusy) return;
    
    setExportState('exporting_pdf');
    console.log('[Export] PDF click');
    
    try {
      const result = await exportPDFColored(movimientosSeleccionados, {
        titulo: 'Reporte Corporativo Ordénate',
        subtitulo: `${movimientosSeleccionados.length} movimientos seleccionados`
      });
      
      if (result.success) {
        console.log('[Export] PDF exportado exitosamente:', result.fileName);
        onExportComplete?.();
      } else {
        console.error('[Export] Error en PDF:', result.error);
      }
    } catch (error) {
      console.error('[Export] Error exportando PDF:', error);
    } finally {
      setExportState('idle');
    }
  }

  async function onExportCSVPress() {
    if (!haySeleccion || isBusy) return;
    
    setExportState('exporting_csv');
    console.log('[Export] CSV click');
    
    try {
      const result = await exportCSV(movimientosSeleccionados, {
        contexto: 'seleccion',
        cantidad: movimientosSeleccionados.length
      });
      
      if (result.success) {
        console.log('[Export] CSV exportado exitosamente:', result.fileName);
        onExportComplete?.();
      } else {
        console.error('[Export] Error en CSV:', result.error);
      }
    } catch (error) {
      console.error('[Export] Error exportando CSV:', error);
    } finally {
      setExportState('idle');
    }
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        disabled={isBusy || !haySeleccion}
        onPress={() => onExportPDF()}
        style={[styles.button, styles.pdfButton, disabledStyle]}
        activeOpacity={0.8}
      >
        {exportState === 'exporting_pdf' ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>PDF</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        disabled={isBusy || !haySeleccion}
        onPress={() => onExportCSVPress()}
        style={[styles.button, styles.csvButton, disabledStyle]}
        activeOpacity={0.8}
      >
        {exportState === 'exporting_csv' ? (
          <ActivityIndicator color="#111827" size="small" />
        ) : (
          <Text style={[styles.buttonText, styles.csvButtonText]}>CSV</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButton: {
    backgroundColor: '#50616D', // Color azul corporativo
  },
  csvButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  csvButtonText: {
    color: '#111827',
  },
});