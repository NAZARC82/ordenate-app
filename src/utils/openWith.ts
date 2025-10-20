// src/utils/openWith.ts
// Helper para abrir archivos con aplicaciones externas

import * as Sharing from 'expo-sharing';
import { Platform, InteractionManager, Alert } from 'react-native';
import { fileExists } from './fsExists';

export interface OpenWithOptions {
  dialogTitle?: string;
}

/**
 * Obtiene el UTI correcto para iOS según el mimeType
 */
function getUTI(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'com.adobe.pdf';
    case 'text/csv':
      return 'public.comma-separated-values-text';
    default:
      return mimeType;
  }
}

/**
 * Abre un archivo con el selector nativo de aplicaciones "Abrir con..."
 * @param uri URI del archivo a compartir (puede ser file:// o content://)
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
      console.warn('[openWith] Sharing no está disponible en esta plataforma');
      return false;
    }

    // Preparar opciones según la plataforma
    const shareOptions: any = {
      mimeType,
    };

    // En iOS, usar UTI en lugar de dialogTitle
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
      `No se pudo abrir el archivo:\n\n${error.message || 'Error desconocido'}\n\nCódigo: ${error.code || 'N/A'}\n\nAsegúrate de que el archivo existe y tienes permisos para compartirlo.`,
      [{ text: 'OK' }]
    );
    
    return false;
  }
}

/**
 * Helper específico para abrir PDFs
 */
export async function openPDF(uri: string, title?: string): Promise<boolean> {
  return openWith(uri, 'application/pdf', { 
    dialogTitle: title || 'Abrir PDF con...' 
  });
}

/**
 * Helper específico para abrir CSVs
 */
export async function openCSV(uri: string, title?: string): Promise<boolean> {
  return openWith(uri, 'text/csv', { 
    dialogTitle: title || 'Abrir CSV con...' 
  });
}

/**
 * Presentación segura: cerrar modal antes y esperar 250ms
 * Evita conflicto en iOS donde no se pueden tener dos modales simultáneos
 */
export async function presentOpenWithSafely({
  uri,
  mime,
  setModalVisible,
}: {
  uri: string;
  mime: string;
  setModalVisible?: (v: boolean) => void;
}): Promise<boolean> {
  try {
    console.log('[presentOpenWithSafely] Iniciando preparación para Share Sheet');
    
    // Cerrar modal si existe (opcional ahora)
    if (setModalVisible) {
      console.log('[presentOpenWithSafely] Cerrando modal proporcionado...');
      setModalVisible(false);
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
    
    // Delay adicional de 300ms (optimizado) para asegurar que todo esté listo
    console.log('[presentOpenWithSafely] Esperando 300ms para estabilización...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verificar que el archivo existe antes de abrir Share Sheet
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
