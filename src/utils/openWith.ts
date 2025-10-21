// src/utils/openWith.ts
// Helper para compartir y visualizar archivos de forma segura por plataforma

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';

export type OpenKind = 'pdf' | 'csv';

/**
 * Normaliza una URI de archivo:
 * - Asegura que tenga prefijo file://
 * - Valida que no esté vacía
 * - Mantiene codificación existente
 */
function normalizeFileUri(raw: string): string {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error('Empty URI');
  }
  
  // Asegurar prefijo file://
  let uri = raw.startsWith('file://') ? raw : `file://${raw}`;
  
  // Validar formato básico
  if (!uri.includes('://')) {
    throw new Error('Invalid URI format');
  }
  
  return uri;
}

/**
 * Visualiza un archivo internamente:
 * - iOS: usa Print.printAsync como visor nativo (cancelación no es error)
 * - Android: usa Intent con content:// URI, fallback a Sharing si falla
 */
export async function viewInternallySafely(rawUri: string, kind: OpenKind): Promise<void> {
  try {
    const uri = normalizeFileUri(rawUri);
    console.log('[viewInternallySafely] Iniciando vista interna:', { uri, kind, platform: Platform.OS });
    
    // Verificar existencia del archivo
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('File does not exist');
    }

    if (Platform.OS === 'ios') {
      // iOS: usar el visor nativo de impresión como preview
      console.log('[viewInternallySafely] iOS: usando Print.printAsync...');
      try {
        await Print.printAsync({ uri });
        console.log('[viewInternallySafely] ✓ Print dialog completado');
      } catch (e: any) {
        // Usuario canceló o no completó: no tratar como crash
        const msg = String(e?.message || e);
        if (/did not complete|canceled|cancelled/i.test(msg)) {
          console.log('[viewInternallySafely] Usuario canceló vista previa (normal)');
          return;
        }
        throw e;
      }
      return;
    }

    // ANDROID: intentar con Intent y content://
    console.log('[viewInternallySafely] Android: obteniendo content URI...');
    const contentUri = await FileSystem.getContentUriAsync(uri);
    console.log('[viewInternallySafely] Content URI:', contentUri);
    
    try {
      console.log('[viewInternallySafely] Lanzando Intent VIEW...');
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: kind === 'csv' ? 'text/csv' : 'application/pdf',
      });
      console.log('[viewInternallySafely] ✓ Intent lanzado exitosamente');
      return;
    } catch (intentError) {
      console.warn('[viewInternallySafely] Intent falló, usando fallback Sharing...', intentError);
      // fallback a compartir si no hay visor
      await Sharing.shareAsync(uri, {
        mimeType: kind === 'csv' ? 'text/csv' : 'application/pdf',
        dialogTitle: 'Compartir archivo',
      });
    }
  } catch (err: any) {
    console.error('[viewInternallySafely] Error:', err);
    const errorMsg = err?.message || String(err);
    console.error('[viewInternallySafely] Error details:', { 
      message: errorMsg, 
      uri: rawUri, 
      kind,
      stack: err?.stack 
    });
    
    Alert.alert(
      'Error al abrir archivo',
      `No se pudo abrir el archivo para vista previa.\n\nDetalle: ${errorMsg}`
    );
  }
}

/**
 * Presenta el Share Sheet nativo para "Abrir con...":
 * - Valida URI y existencia del archivo
 * - iOS: usa Sharing.shareAsync con UTI correcto
 * - Android: usa Sharing.shareAsync o Intent como fallback
 */
export async function presentOpenWithSafely(rawUri: string, kind: OpenKind): Promise<void> {
  try {
    const uri = normalizeFileUri(rawUri);
    console.log('[presentOpenWithSafely] Iniciando:', { uri, kind, platform: Platform.OS });
    
    // Verificar existencia del archivo
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('File does not exist');
    }

    // Intentar con Sharing API
    if (await Sharing.isAvailableAsync()) {
      console.log('[presentOpenWithSafely] Usando Sharing.shareAsync...');
      
      const shareOptions: any = {
        mimeType: kind === 'csv' ? 'text/csv' : 'application/pdf',
        dialogTitle: 'Compartir archivo',
      };
      
      // En iOS, usar UTI para mejor compatibilidad (especialmente CSV)
      if (Platform.OS === 'ios') {
        shareOptions.UTI = kind === 'csv'
          ? 'public.comma-separated-values-text'
          : 'com.adobe.pdf';
      }
      
      await Sharing.shareAsync(uri, shareOptions);
      console.log('[presentOpenWithSafely] ✓ Sharing completado');
      return;
    }

    // Fallback extremo si Sharing no está disponible
    console.warn('[presentOpenWithSafely] Sharing no disponible, usando fallback...');
    
    if (Platform.OS === 'android') {
      console.log('[presentOpenWithSafely] Android fallback: usando Intent SEND...');
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
        data: contentUri,
        flags: 1,
        type: kind === 'csv' ? 'text/csv' : 'application/pdf',
      });
    } else {
      Alert.alert(
        'Vista previa',
        kind === 'csv'
          ? 'CSV generado correctamente. Usa "Compartir" para enviarlo.'
          : 'PDF generado correctamente. Usa "Compartir" para enviarlo.'
      );
    }
  } catch (err: any) {
    console.error('[presentOpenWithSafely] Error:', err);
    
    // No mostrar error si el usuario canceló
    const msg = String(err?.message || err);
    if (/cancel|cancelled/i.test(msg)) {
      console.log('[presentOpenWithSafely] Usuario canceló (normal)');
      return;
    }
    
    const errorMsg = err?.message || String(err);
    console.error('[presentOpenWithSafely] Error details:', { 
      message: errorMsg, 
      uri: rawUri, 
      kind,
      stack: err?.stack 
    });
    
    Alert.alert(
      'Error al compartir',
      `No se pudo abrir el menú de compartir.\n\nDetalle: ${errorMsg}`
    );
  }
}
