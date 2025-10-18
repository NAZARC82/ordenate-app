// src/utils/share.ts
// Compartir archivos de forma robusta con detección de capacidades

import * as Sharing from 'expo-sharing';
import { Share, Platform, Alert } from 'react-native';
import { fileExistsSafe } from './fs-safe';

// MailComposer es opcional (si se instala expo-mail-composer)
let MailComposer: any = null;
try {
  MailComposer = require('expo-mail-composer');
} catch {
  console.log('[share] expo-mail-composer no instalado, usando fallbacks');
}

interface ShareOptions {
  fileUri: string;
  mimeType: string;
  subject?: string;
  body?: string;
  dialogTitle?: string;
}

interface ShareResult {
  success: boolean;
  method?: 'sharing' | 'mail' | 'share-rn' | 'none';
  error?: string;
}

/**
 * Compartir archivo de forma inteligente con múltiples fallbacks
 * 
 * Prioridades:
 * 1. expo-sharing (mejor para archivos, soporta UTI en iOS)
 * 2. expo-mail-composer (si hay cuenta configurada)
 * 3. Share de React Native (fallback final)
 */
export async function shareFileSmart(options: ShareOptions): Promise<ShareResult> {
  const { fileUri, mimeType, subject, body, dialogTitle } = options;

  console.log('[shareFileSmart] Iniciando compartir:', {
    fileUri: fileUri.substring(fileUri.lastIndexOf('/') + 1),
    mimeType,
    platform: Platform.OS
  });

  // 1. VALIDAR que el archivo existe
  const exists = await fileExistsSafe(fileUri);
  if (!exists) {
    console.error('[shareFileSmart] ❌ Archivo no existe:', fileUri);
    Alert.alert(
      'Archivo no encontrado',
      'No pude adjuntar el archivo. Verificá permisos o probá otro método de envío.'
    );
    return { success: false, error: 'Archivo no existe' };
  }

  console.log('[shareFileSmart] ✓ Archivo verificado');

  // 2. MÉTODO 1: expo-sharing (preferido para archivos)
  try {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    console.log('[shareFileSmart] Sharing disponible:', isSharingAvailable);

    if (isSharingAvailable) {
      // Configuración específica por plataforma
      const shareOptions: any = {
        mimeType,
        dialogTitle: dialogTitle || 'Compartir archivo'
      };

      // En iOS, agregar UTI para PDFs
      if (Platform.OS === 'ios' && mimeType === 'application/pdf') {
        shareOptions.UTI = 'com.adobe.pdf';
        console.log('[shareFileSmart] Configurado UTI para PDF en iOS');
      }

      console.log('[shareFileSmart] Compartiendo con expo-sharing...', shareOptions);
      
      await Sharing.shareAsync(fileUri, shareOptions);
      
      console.log('[shareFileSmart] ✓ Compartido exitosamente con expo-sharing');
      return { success: true, method: 'sharing' };
    }
  } catch (error: any) {
    // Usuario canceló es normal, no es error
    if (error.code === 'ERR_CANCELED' || error.message?.includes('cancel')) {
      console.log('[shareFileSmart] Usuario canceló el share');
      return { success: false, method: 'sharing', error: 'Usuario canceló' };
    }
    console.warn('[shareFileSmart] Error con expo-sharing:', error);
  }

  // 3. MÉTODO 2: expo-mail-composer (si está instalado y hay cuenta configurada)
  if (MailComposer) {
    try {
      const isMailAvailable = await MailComposer.isAvailableAsync();
      console.log('[shareFileSmart] MailComposer disponible:', isMailAvailable);

      if (isMailAvailable) {
        console.log('[shareFileSmart] Compartiendo con MailComposer...');
        
        const result = await MailComposer.composeAsync({
          subject: subject || 'Reporte Ordénate',
          body: body || 'Adjunto el reporte generado.',
          attachments: [fileUri]
        });

        if (result.status === 'sent') {
          console.log('[shareFileSmart] ✓ Email enviado exitosamente');
          return { success: true, method: 'mail' };
        } else if (result.status === 'cancelled') {
          console.log('[shareFileSmart] Usuario canceló el email');
          return { success: false, method: 'mail', error: 'Usuario canceló' };
        }
      }
    } catch (error) {
      console.warn('[shareFileSmart] Error con MailComposer:', error);
    }
  }

  // 4. MÉTODO 3: Share de React Native (fallback final)
  try {
    console.log('[shareFileSmart] Compartiendo con Share RN...');
    
    const result = await Share.share({
      url: fileUri,
      title: subject || 'Reporte Ordénate',
      message: body || 'Reporte generado'
    });

    if (result.action === Share.sharedAction) {
      console.log('[shareFileSmart] ✓ Compartido con Share RN');
      return { success: true, method: 'share-rn' };
    } else if (result.action === Share.dismissedAction) {
      console.log('[shareFileSmart] Usuario canceló Share RN');
      return { success: false, method: 'share-rn', error: 'Usuario canceló' };
    }
  } catch (error) {
    console.error('[shareFileSmart] Error con Share RN:', error);
  }

  // Si todos los métodos fallaron
  console.error('[shareFileSmart] ❌ Ningún método de compartir funcionó');
  Alert.alert(
    'No se pudo compartir',
    'No hay app para compartir este tipo de archivo. Intentá desde el Historial más tarde.'
  );
  
  return { 
    success: false, 
    method: 'none',
    error: 'Ningún método de compartir disponible' 
  };
}

/**
 * Pequeño delay para cerrar modales antes de abrir share sheet
 */
export async function delayForModalClose(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
