/**
 * Toast wrapper - Mensajes temporales en UI
 * 
 * Wrapper simple para mostrar toasts con react-native-toast-message
 * o Alert como fallback.
 * 
 * @module utils/toast
 */

import { Alert, Platform } from 'react-native';

// Tracking de último toast para evitar duplicados
let lastToastTime = 0;
let lastToastText = '';
const DEBOUNCE_MS = 2000;

/**
 * Mostrar toast de éxito
 * 
 * @param text - Texto del toast
 * @param options - Opciones adicionales
 * 
 * @example
 * showToast('✅ Archivo guardado', {
 *   action: {
 *     label: 'Abrir',
 *     onPress: () => openFile()
 *   }
 * });
 */
export function showToast(
  text: string,
  options?: {
    duration?: number;
    action?: {
      label: string;
      onPress: () => void;
    };
  }
): void {
  const now = Date.now();

  // Debounce: evitar toasts duplicados
  if (now - lastToastTime < DEBOUNCE_MS && text === lastToastText) {
    return;
  }

  lastToastTime = now;
  lastToastText = text;

  // Si hay acción, usar Alert nativo
  if (options?.action) {
    Alert.alert(
      '',
      text,
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: options.action.label,
          onPress: options.action.onPress,
        },
      ],
      { cancelable: true }
    );
    return;
  }

  // Sin acción: toast simple o Alert
  // Intentar usar react-native-toast-message si está disponible
  try {
    const Toast = require('react-native-toast-message');
    
    if (Toast && Toast.default && Toast.default.show) {
      Toast.default.show({
        type: 'success',
        text1: text,
        position: 'bottom',
        visibilityTime: options?.duration || 3000,
        autoHide: true,
      });
      return;
    }
  } catch {
    // Toast library no disponible, usar Alert
  }

  // Fallback: Alert nativo (menos intrusivo en iOS)
  if (Platform.OS === 'ios') {
    // En iOS, solo mostrar si el texto es importante
    // (evitar spam de Alerts)
    return;
  }

  Alert.alert('', text, [{ text: 'OK' }], { cancelable: true });
}

/**
 * Toast de error
 */
export function showErrorToast(text: string): void {
  try {
    const Toast = require('react-native-toast-message');
    
    if (Toast && Toast.default && Toast.default.show) {
      Toast.default.show({
        type: 'error',
        text1: text,
        position: 'bottom',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    }
  } catch {
    // Fallback
  }

  Alert.alert('Error', text, [{ text: 'OK' }]);
}

/**
 * Toast post-exportación con acción
 * 
 * Mensaje optimizado para después de exportar archivos.
 * 
 * @param fileName - Nombre del archivo exportado
 * @param onOpen - Callback al presionar "Abrir"
 */
export function showExportToast(fileName: string, onOpen: () => void): void {
  showToast(`✅ Guardado: ${fileName}`, {
    action: {
      label: 'Abrir',
      onPress: onOpen,
    },
  });
}
