// src/navigation/navHelpers.ts
import { navigationRef } from './navigationRef';

/**
 * Navega al tab de Diseño PDF en el Gestor de Documentos
 * Usa navegación anidada segura: Tabs > SettingsTab > DocumentManager
 */
export function goToPdfDesign() {
  if (!navigationRef.isReady()) {
    console.warn('[navHelpers] Navigation no está lista');
    return;
  }

  try {
    console.log('[navHelpers] Navegando a Diseño PDF en Ajustes');
    
    // Navegación anidada: Tabs > SettingsTab > DocumentManager con initialTab
    // @ts-ignore - Navegación anidada compleja
    navigationRef.navigate('Tabs', {
      screen: 'SettingsTab',
      params: {
        screen: 'DocumentManager',
        params: { initialTab: 'design' }
      }
    });
  } catch (error) {
    console.error('[navHelpers] Error navegando a Diseño:', error);
  }
}
