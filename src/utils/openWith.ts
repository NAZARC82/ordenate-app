// src/utils/openWith.ts
// Helper para compartir y visualizar archivos de forma segura por plataforma

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import { fileExists } from './fsExists';

export type OpenKind = 'pdf' | 'csv' | 'zip';

const MIME_TYPES = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  zip: 'application/zip',
} as const;

const UTI_TYPES = {
  pdf: 'com.adobe.pdf',
  csv: 'public.comma-separated-values-text',
  zip: 'public.zip-archive',
} as const;

/**
 * Delay helper para dar tiempo al cierre de modales
 * Usa 450ms (conservador) para evitar race conditions en transiciones iOS/Android
 */
const delay = (ms: number = 450) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Visualiza un archivo internamente con estrategia por plataforma
 * - iOS: Print.printAsync para PDF, Sharing para CSV/ZIP (QuickLook)
 * - Android: Intent VIEW con content:// URI
 */
export async function viewInternallySafely(
  uri: string,
  kind: OpenKind,
  options?: { closeModal?: () => Promise<void> | void }
): Promise<void> {
  try {
    console.log('[viewInternallySafely] Iniciando:', { uri, kind, platform: Platform.OS });
    
    // Verificar existencia del archivo ANTES de cerrar modal
    if (!(await fileExists(uri))) {
      console.warn('[viewInternallySafely] Archivo no existe:', uri);
      Alert.alert('Archivo no encontrado', 'El archivo no existe o fue eliminado.');
      return;
    }

    const mimeType = MIME_TYPES[kind];

    // ⚠️ Abrir visor SIN cerrar el modal primero
    // El modal se cerrará desde ActionSheet después de que esto complete
    
    if (Platform.OS === 'ios') {
      // iOS: Print para PDF, Sharing (QuickLook) para CSV/ZIP
      if (kind === 'pdf') {
        console.log('[viewInternallySafely] iOS: intentando Print.printAsync...');
        try {
          await Print.printAsync({ uri });
          console.log('[viewInternallySafely] ✓ Print completado');
          return;
        } catch (e: any) {
          const msg = String(e?.message || e);
          if (/did not complete|canceled|cancelled/i.test(msg)) {
            console.log('[viewInternallySafely] Usuario canceló (normal)');
            return;
          }
          // Si falla Print, intentar Sharing como fallback
          console.warn('[viewInternallySafely] Print falló, usando Sharing fallback');
        }
      }
      
      // CSV/ZIP o fallback de PDF: usar Sharing para QuickLook
      console.log('[viewInternallySafely] iOS: usando Sharing (QuickLook)...');
      await Sharing.shareAsync(uri, {
        mimeType,
        UTI: UTI_TYPES[kind],
        dialogTitle: 'Vista previa',
      });
      return;
    }

    // ANDROID: Intent VIEW con content://
    console.log('[viewInternallySafely] Android: obteniendo content URI...');
    const contentUri = await FileSystem.getContentUriAsync(uri);
    console.log('[viewInternallySafely] Content URI:', contentUri);
    
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mimeType,
      });
      console.log('[viewInternallySafely] ✓ Intent VIEW exitoso');
    } catch (intentError) {
      console.warn('[viewInternallySafely] Intent falló, usando Sharing fallback:', intentError);
      // Fallback a compartir si no hay app para abrir
      await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: 'Abrir con...',
      });
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[viewInternallySafely] Error:', { message: errorMsg, uri, kind });
    
    Alert.alert(
      'Error al abrir archivo',
      `No se pudo abrir el archivo.\n\nDetalle: ${errorMsg}`
    );
  }
}

/**
 * Presenta el Share Sheet nativo para "Abrir con..."
 * - Valida existencia del archivo
 * - Usa Sharing.shareAsync con UTI/mimeType correctos por plataforma
 */
export async function presentOpenWithSafely(
  uri: string,
  kind: OpenKind,
  options?: { closeModal?: () => Promise<void> | void }
): Promise<void> {
  try {
    console.log('[presentOpenWithSafely] Iniciando:', { uri, kind, platform: Platform.OS });
    
    // Verificar existencia del archivo ANTES de cerrar modal
    if (!(await fileExists(uri))) {
      console.warn('[presentOpenWithSafely] Archivo no existe:', uri);
      Alert.alert('Archivo no encontrado', 'El archivo no existe o fue eliminado.');
      return;
    }

    // Verificar disponibilidad de Sharing ANTES de cerrar modal
    if (!(await Sharing.isAvailableAsync())) {
      console.warn('[presentOpenWithSafely] Sharing no disponible, usando visor fallback');
      return viewInternallySafely(uri, kind, options);
    }

    const mimeType = MIME_TYPES[kind];
    const shareOptions: any = {
      mimeType,
      dialogTitle: 'Abrir con...',
    };
    
    // En iOS, agregar UTI para mejor compatibilidad
    if (Platform.OS === 'ios') {
      shareOptions.UTI = UTI_TYPES[kind];
    }
    
    console.log('[presentOpenWithSafely] Llamando a Sharing.shareAsync con:', shareOptions);
    
    // ⚠️ Abrir Share Sheet SIN cerrar el modal primero
    // El modal se cerrará desde ActionSheet después de que esto complete
    await Sharing.shareAsync(uri, shareOptions);
    
    console.log('[presentOpenWithSafely] ✓ Share Sheet completado');
    
  } catch (err: any) {
    const msg = String(err?.message || err);
    
    // No mostrar error si el usuario canceló
    if (/cancel|cancelled/i.test(msg)) {
      console.log('[presentOpenWithSafely] Usuario canceló (normal)');
      return;
    }
    
    const errorMsg = err?.message || String(err);
    console.error('[presentOpenWithSafely] Error:', { message: errorMsg, uri, kind });
    
    Alert.alert(
      'Error al compartir',
      `No se pudo abrir el menú de compartir.\n\nDetalle: ${errorMsg}`
    );
  }
}
