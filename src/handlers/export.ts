// src/handlers/export.ts
// Handler unificado para exportar y compartir archivos

import { Alert } from 'react-native';
import { exportPDFColored } from '../utils/pdfExport';
import { exportCSV } from '../utils/csvExport';
import { shareFileSmart, delayForModalClose } from '../utils/share';

export type ExportFormat = 'pdf-colored' | 'csv';

interface ExportResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  documentId?: string;
  message?: string;
  error?: string;
}

interface ExportAndShareOptions {
  /** Cerrar modal antes de compartir */
  closeModal?: () => void;
  /** Mostrar toast de éxito */
  onSuccess?: (result: ExportResult) => void;
  /** Manejar error */
  onError?: (error: string) => void;
}

/**
 * Exportar y compartir archivo de forma robusta
 * 
 * Flujo:
 * 1. Generar archivo (PDF o CSV)
 * 2. Cerrar modal si existe
 * 3. Compartir con shareFileSmart
 * 4. Retornar resultado para UI
 */
export async function handleExportAndShare(
  format: ExportFormat,
  movimientos: any[],
  options: ExportAndShareOptions = {}
): Promise<ExportResult> {
  const { closeModal, onSuccess, onError } = options;

  console.log(`[handleExportAndShare] Iniciando exportación: ${format}`);
  console.log(`[handleExportAndShare] Movimientos: ${movimientos.length}`);

  try {
    // 1. GENERAR archivo según formato
    let exportResult: ExportResult;

    if (format === 'pdf-colored') {
      console.log('[handleExportAndShare] Exportando PDF...');
      exportResult = await exportPDFColored(movimientos, {
        titulo: 'Reporte Corporativo Ordénate',
        subtitulo: `${movimientos.length} movimiento(s)`
      });
    } else if (format === 'csv') {
      console.log('[handleExportAndShare] Exportando CSV...');
      exportResult = await exportCSV(movimientos, {
        contexto: 'reporte',
        cantidad: movimientos.length
      });
    } else {
      throw new Error(`Formato desconocido: ${format}`);
    }

    // 2. VERIFICAR que la exportación fue exitosa
    if (!exportResult.success) {
      const errorMsg = exportResult.error || 'Error al generar el archivo';
      console.error('[handleExportAndShare] Error en exportación:', errorMsg);
      
      Alert.alert(
        'Error de Exportación',
        exportResult.message || errorMsg
      );
      
      onError?.(errorMsg);
      return exportResult;
    }

    console.log('[handleExportAndShare] ✓ Archivo generado:', {
      fileName: exportResult.fileName,
      mimeType: exportResult.mimeType
    });

    // 3. CERRAR modal antes de compartir (evita crash de modales superpuestos)
    if (closeModal) {
      console.log('[handleExportAndShare] Cerrando modal...');
      closeModal();
      await delayForModalClose(100); // Pequeño delay para que React complete el cierre
    }

    // 4. COMPARTIR archivo con shareFileSmart
    console.log('[handleExportAndShare] Compartiendo archivo...');
    
    const shareResult = await shareFileSmart({
      fileUri: exportResult.fileUri!,
      mimeType: exportResult.mimeType!,
      subject: 'Reporte Ordénate',
      body: `Reporte con ${movimientos.length} movimiento(s)`,
      dialogTitle: format === 'pdf-colored' ? 'Compartir PDF' : 'Compartir CSV'
    });

    if (shareResult.success) {
      console.log(`[handleExportAndShare] ✅ Compartido con método: ${shareResult.method}`);
      onSuccess?.(exportResult);
    } else {
      console.log(`[handleExportAndShare] Usuario canceló o falló: ${shareResult.error}`);
      // No es un error fatal, el archivo se guardó correctamente
    }

    // 5. RETORNAR resultado para que la UI pueda mostrar "Ver en Historial" o "Modificar"
    return exportResult;

  } catch (error: any) {
    console.error('[handleExportAndShare] Error inesperado:', error);
    
    const errorMsg = error.message || 'Error inesperado al exportar';
    
    Alert.alert(
      'Error',
      'No pude generar o compartir el archivo. Intentá de nuevo o revisá los permisos.'
    );
    
    onError?.(errorMsg);
    
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Modificar (re-exportar) con nuevas opciones
 * Útil para cambiar colores, columnas, etc. sin volver a seleccionar movimientos
 */
export async function handleModify(
  format: ExportFormat,
  movimientos: any[],
  newOptions: any = {},
  shareOptions: ExportAndShareOptions = {}
): Promise<ExportResult> {
  console.log('[handleModify] Re-exportando con nuevas opciones:', newOptions);
  
  // Simplemente re-ejecuta el export con las nuevas opciones
  return handleExportAndShare(format, movimientos, shareOptions);
}
