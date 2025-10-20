// src/utils/openWith.ts
// Helper para compartir archivos con Share Sheet nativo

import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as FS from 'expo-file-system/legacy'; // Solo para readAsStringAsync
import { Platform, InteractionManager, Alert } from 'react-native';
import { fileExists } from './fsExists';

// MIME types estándar
const MIME = {
  pdf: 'application/pdf',
  csv: 'text/csv',
} as const;

// iOS UTI para mejor compatibilidad
const UTI_MAP = {
  pdf: 'com.adobe.pdf',
  csv: 'public.comma-separated-values-text',
} as const;

export interface OpenWithOptions {
  dialogTitle?: string;
}

/**
 * Obtiene el UTI correcto para iOS según el mimeType
 */
function getUTI(mimeType: string): string {
  if (mimeType === MIME.pdf) return UTI_MAP.pdf;
  if (mimeType === MIME.csv) return UTI_MAP.csv;
  return mimeType;
}

/**
 * Abre un archivo con el selector nativo de aplicaciones "Abrir con..."
 * Si sharing no está disponible, usa fallback a WebBrowser o preview
 * 
 * @param uri URI del archivo a compartir (debe ser file://)
 * @param mimeType Tipo MIME del archivo ('application/pdf', 'text/csv', etc.)
 * @param options Opciones adicionales (título del diálogo, etc.)
 * @returns true si se compartió exitosamente, false si no está disponible o hubo error
 */
export async function openWith(
  uri: string, 
  mimeType: string,
  options: OpenWithOptions = {}
): Promise<boolean> {
  try {
    console.log('[openWith] Iniciando:', { uri, mimeType, platform: Platform.OS });
    
    // Validar URI
    if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
      console.error('[openWith] URI inválido:', uri);
      return false;
    }

    // Validar mimeType
    if (!mimeType || typeof mimeType !== 'string') {
      console.error('[openWith] mimeType inválido:', mimeType);
      return false;
    }

    // Verificar disponibilidad de Sharing
    const isAvailable = await Sharing.isAvailableAsync();
    console.log('[openWith] Sharing disponible:', isAvailable);
    
    if (!isAvailable) {
      // ✅ FALLBACK: usar WebBrowser para PDF, preview para CSV
      console.log('[openWith] Sharing no disponible, usando fallback...');
      
      if (mimeType === MIME.pdf) {
        console.log('[openWith] Abriendo PDF en WebBrowser...');
        await WebBrowser.openBrowserAsync(uri, {
          controlsColor: '#3E7D75',
          toolbarColor: '#FCFCF8',
          enableBarCollapsing: false,
          showTitle: true,
        });
        return true;
      } else if (mimeType === MIME.csv) {
        console.log('[openWith] Mostrando preview CSV...');
        const content = await FS.readAsStringAsync(uri);
        const preview = content.slice(0, 1000);
        Alert.alert(
          'CSV (vista rápida)', 
          `${preview}${content.length > 1000 ? '\n\n...' : ''}\n\nUsa "Abrir con..." para abrir en Excel, Sheets, etc.`,
          [{ text: 'OK' }]
        );
        return true;
      }
      
      return false;
    }

    // Preparar opciones según la plataforma
    const shareOptions: any = {
      mimeType,
    };

    // En iOS, usar UTI para mejor compatibilidad (especialmente CSV)
    if (Platform.OS === 'ios') {
      shareOptions.UTI = getUTI(mimeType);
    } else {
      // En Android, usar dialogTitle
      shareOptions.dialogTitle = options.dialogTitle || 'Abrir con...';
    }

    console.log('[openWith] Compartiendo con opciones:', shareOptions);
    console.log('[openWith] URI a compartir:', uri);

    // Compartir archivo con Share Sheet nativo
    console.log('[openWith] 🚀 Llamando a Sharing.shareAsync...');
    await Sharing.shareAsync(uri, shareOptions);
    
    console.log('[openWith] ✅ shareAsync completado - El usuario interactuó con el Share Sheet');
    console.log('[openWith] ✓ Share Sheet se presentó correctamente');
    return true;

  } catch (error: any) {
    console.error('[openWith] ❌ Error capturado:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    // No mostrar alert si el usuario canceló
    if (error.code === 'ERR_CANCELED' || 
        error.code === 'E_SHARING_MIS_CANCEL' ||
        error.code === 'CANCELLED' ||
        error.message?.toLowerCase().includes('cancel') ||
        error.message?.toLowerCase().includes('cancelled')) {
      console.log('[openWith] ℹ️ Usuario canceló el Share Sheet (normal)');
      return false;
    }
    
    // Para otros errores, mostrar alert
    console.error('[openWith] ⚠️ Error no manejado:', error);
    Alert.alert(
      'Error al compartir',
      `No se pudo abrir el archivo:\n\n${error.message || 'Error desconocido'}\n\nCódigo: ${error.code || 'N/A'}`,
      [{ text: 'OK' }]
    );
    
    return false;
  }
}

/**
 * Helper específico para abrir PDFs
 */
export async function openPDF(uri: string, title?: string): Promise<boolean> {
  return openWith(uri, MIME.pdf, { 
    dialogTitle: title || 'Abrir PDF con...' 
  });
}

/**
 * Helper específico para abrir CSVs
 */
export async function openCSV(uri: string, title?: string): Promise<boolean> {
  return openWith(uri, MIME.csv, { 
    dialogTitle: title || 'Abrir CSV con...' 
  });
}

/**
 * Presentación segura: cerrar modal antes, delay corto, verificar existencia
 * Evita conflicto en iOS donde no se pueden tener dos modales simultáneos
 * 
 * @param uri URI del archivo (debe existir en file system)
 * @param kind Tipo de archivo ('pdf' o 'csv')
 * @param closeModal Función opcional para cerrar modal antes de compartir
 * @returns true si se compartió exitosamente
 */
export async function presentOpenWithSafely({
  uri,
  kind = 'pdf',
  closeModal,
}: {
  uri: string;
  kind?: 'pdf' | 'csv';
  closeModal?: () => void;
}): Promise<boolean> {
  try {
    console.log('[presentOpenWithSafely] Iniciando preparación para Share Sheet');
    
    // Cerrar modal si existe
    if (closeModal) {
      console.log('[presentOpenWithSafely] Cerrando modal proporcionado...');
      closeModal();
    } else {
      console.log('[presentOpenWithSafely] No hay modal para cerrar (ya cerrado)');
    }
    
    // Esperar a que InteractionManager complete todas las interacciones
    await new Promise<void>(resolve => {
      InteractionManager.runAfterInteractions(() => {
        console.log('[presentOpenWithSafely] Interacciones completadas');
        resolve();
      });
    });
    
    // ✅ Delay optimizado: 300ms (total 300-600ms dependiendo de animaciones)
    console.log('[presentOpenWithSafely] Esperando 300ms para estabilización...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ Verificar que el archivo existe ANTES de abrir Share Sheet
    console.log('[presentOpenWithSafely] Verificando existencia del archivo...');
    const exists = await fileExists(uri);
    
    if (!exists) {
      console.warn('[presentOpenWithSafely] ⚠️ Archivo no encontrado:', uri);
      Alert.alert(
        'Archivo no encontrado',
        'El documento ya no está disponible. Es posible que haya sido eliminado.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    console.log('[presentOpenWithSafely] ✓ Archivo existe, abriendo Share Sheet...');
    
    // Determinar MIME correcto
    const mime = kind === 'csv' ? MIME.csv : MIME.pdf;
    
    // Ahora sí, abrir el Share Sheet
    const result = await openWith(uri, mime);
    
    console.log('[presentOpenWithSafely] Resultado final:', result);
    return result;
  } catch (error) {
    console.error('[presentOpenWithSafely] Error:', error);
    Alert.alert(
      'Error',
      `No se pudo compartir el archivo: ${(error as Error).message}`,
      [{ text: 'OK' }]
    );
    return false;
  }
}
