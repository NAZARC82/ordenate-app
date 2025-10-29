// src/utils/toastUtils.ts
// FASE6.1: Toasts centralizados para operaciones de carpetas

import { Platform, ToastAndroid, Alert } from 'react-native';

type FolderToastType = 'add' | 'remove' | 'clean' | 'forceDelete' | 'rename' | 'create';

/**
 * Toast centralizado para operaciones de carpetas
 * Usa ToastAndroid en Android y Alert en iOS
 */
export function showFolderToast(type: FolderToastType, name?: string): void {
  let message = '';

  switch (type) {
    case 'add':
      message = name ? `✅ Añadido a "${name}"` : '✅ Añadido a carpeta';
      break;
    case 'remove':
      message = name ? `❌ Eliminado de "${name}"` : '❌ Eliminado de carpeta';
      break;
    case 'clean':
      message = '🧹 Limpieza automática ejecutada';
      break;
    case 'forceDelete':
      message = name ? `📁 Carpeta "${name}" eliminada con todo su contenido` : '📁 Carpeta eliminada con todo su contenido';
      break;
    case 'rename':
      message = name ? `📝 Carpeta renombrada a "${name}"` : '📝 Carpeta renombrada';
      break;
    case 'create':
      message = name ? `✨ Carpeta "${name}" creada` : '✨ Carpeta creada';
      break;
    default:
      message = '✅ Operación completada';
  }

  console.log(`[FASE6.1] showFolderToast: ${type} - ${message}`);

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // iOS: usar Alert simple (más sutil que un alert modal)
    // Alternativamente, podrías usar una librería como react-native-toast-message
    Alert.alert('', message, [{ text: 'OK' }], { cancelable: true });
  }
}

/**
 * Toast genérico para éxito
 */
export function showSuccessToast(message: string): void {
  console.log(`[FASE6.1] showSuccessToast: ${message}`);

  if (Platform.OS === 'android') {
    ToastAndroid.show(`✅ ${message}`, ToastAndroid.SHORT);
  } else {
    Alert.alert('', `✅ ${message}`, [{ text: 'OK' }], { cancelable: true });
  }
}

/**
 * Toast genérico para error
 */
export function showErrorToast(message: string): void {
  console.log(`[FASE6.1] showErrorToast: ${message}`);

  if (Platform.OS === 'android') {
    ToastAndroid.show(`❌ ${message}`, ToastAndroid.LONG);
  } else {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}

/**
 * Toast genérico para warning
 */
export function showWarningToast(message: string): void {
  console.log(`[FASE6.1] showWarningToast: ${message}`);

  if (Platform.OS === 'android') {
    ToastAndroid.show(`⚠️ ${message}`, ToastAndroid.SHORT);
  } else {
    Alert.alert('', `⚠️ ${message}`, [{ text: 'OK' }], { cancelable: true });
  }
}
