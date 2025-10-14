// src/features/pdf/prefs.ts
// Gestión de preferencias de diseño de PDF con AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ordenate:pdf_prefs';
const PREFS_VERSION = 1;

/**
 * Tipos de preferencias de PDF
 */
export interface PdfPreferences {
  version: number;
  
  // Colores principales
  headerColor: string;      // Color del encabezado (#50616D por defecto)
  accentColor: string;      // Color de acento/resumen (#6A5ACD por defecto)
  
  // Intensidad de colores
  colorIntensity: number;   // 0.0 a 1.0 (1.0 = intenso, 0.5 = suave)
  
  // Tonalidad de cifras negativas
  negativeRed: 'strong' | 'medium' | 'soft';
  
  // Opciones de contenido
  showMovementCount: boolean;
  showGenerationDate: boolean;
  
  // Última actualización
  updatedAt: string;
}

/**
 * Defaults que generan EXACTAMENTE el mismo PDF que hoy
 */
export const DEFAULT_PDF_PREFS: PdfPreferences = {
  version: PREFS_VERSION,
  headerColor: '#50616D',
  accentColor: '#6A5ACD',
  colorIntensity: 1.0,
  negativeRed: 'strong',
  showMovementCount: true,
  showGenerationDate: true,
  updatedAt: new Date().toISOString()
};

/**
 * Cargar preferencias desde AsyncStorage
 */
export async function getPdfPrefs(): Promise<PdfPreferences> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return DEFAULT_PDF_PREFS;
    }
    
    const parsed = JSON.parse(stored) as PdfPreferences;
    
    // Validar versión y migrar si es necesario
    if (parsed.version !== PREFS_VERSION) {
      console.log('[PDF Prefs] Migrando de versión', parsed.version, 'a', PREFS_VERSION);
      return { ...DEFAULT_PDF_PREFS, ...parsed, version: PREFS_VERSION };
    }
    
    return parsed;
  } catch (error) {
    console.error('[PDF Prefs] Error cargando preferencias:', error);
    return DEFAULT_PDF_PREFS;
  }
}

/**
 * Guardar preferencias en AsyncStorage
 */
export async function savePdfPrefs(prefs: Partial<PdfPreferences>): Promise<void> {
  try {
    const current = await getPdfPrefs();
    const updated: PdfPreferences = {
      ...current,
      ...prefs,
      version: PREFS_VERSION,
      updatedAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[PDF Prefs] Preferencias guardadas');
  } catch (error) {
    console.error('[PDF Prefs] Error guardando preferencias:', error);
    throw error;
  }
}

/**
 * Resetear a defaults
 */
export async function resetPdfPrefs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[PDF Prefs] Preferencias reseteadas a defaults');
  } catch (error) {
    console.error('[PDF Prefs] Error reseteando preferencias:', error);
    throw error;
  }
}

/**
 * Verificar si hay preferencias personalizadas
 */
export async function hasCustomPrefs(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    return false;
  }
}
