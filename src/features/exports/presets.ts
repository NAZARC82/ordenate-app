/**
 * Presets de exportación - Recordar última selección del usuario
 * 
 * Persiste en AsyncStorage y restaura por defecto al abrir modal de exportación.
 * 
 * @module features/exports/presets
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const PRESET_KEY = '@ordenate:export_preset:v1';

export interface ExportPresetV1 {
  dateRange: 'day' | 'week' | 'month' | 'custom';
  includePdf: boolean;
  includeCsv: boolean;
  includeTotals: boolean;
  lastUsedAt: number; // Date.now()
  lastFolder?: string; // Última carpeta custom usada (ej: 'mis-reportes')
  saveLocation?: 'auto' | 'last' | 'choose'; // Estrategia de guardar
}

export const DEFAULT_PRESET: ExportPresetV1 = {
  dateRange: 'day',
  includePdf: true,
  includeCsv: false,
  includeTotals: true,
  lastUsedAt: 0,
  lastFolder: undefined,
  saveLocation: 'auto', // Por defecto: automático por tipo
};

/**
 * Cargar preset desde AsyncStorage
 * @returns Preset guardado o DEFAULT_PRESET si no existe
 */
export async function loadPreset(): Promise<ExportPresetV1> {
  try {
    const json = await AsyncStorage.getItem(PRESET_KEY);
    if (!json) {
      return { ...DEFAULT_PRESET };
    }

    const parsed = JSON.parse(json);
    
    // Validar estructura
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_PRESET };
    }

    // Merge con defaults para compatibilidad con versiones futuras
    return {
      dateRange: parsed.dateRange || DEFAULT_PRESET.dateRange,
      includePdf: parsed.includePdf ?? DEFAULT_PRESET.includePdf,
      includeCsv: parsed.includeCsv ?? DEFAULT_PRESET.includeCsv,
      includeTotals: parsed.includeTotals ?? DEFAULT_PRESET.includeTotals,
      lastUsedAt: parsed.lastUsedAt || 0,
      lastFolder: parsed.lastFolder || undefined,
      saveLocation: parsed.saveLocation || DEFAULT_PRESET.saveLocation,
    };
  } catch (error) {
    // Manejo de errores silencioso - retornar defaults
    console.warn('[presets] Error loading preset:', error);
    return { ...DEFAULT_PRESET };
  }
}

/**
 * Guardar preset en AsyncStorage
 * @param preset Preset a guardar
 */
export async function savePreset(preset: ExportPresetV1): Promise<void> {
  try {
    const toSave: ExportPresetV1 = {
      ...preset,
      lastUsedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(PRESET_KEY, JSON.stringify(toSave));
  } catch (error) {
    // Manejo de errores silencioso
    console.warn('[presets] Error saving preset:', error);
  }
}

/**
 * Resetear preset a valores por defecto
 */
export async function resetPreset(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRESET_KEY);
  } catch (error) {
    console.warn('[presets] Error resetting preset:', error);
  }
}

/**
 * Hook para manejar presets de exportación
 * 
 * @example
 * const { preset, isLoading, save, reset } = useExportPreset();
 * 
 * // En modal de exportación
 * useEffect(() => {
 *   if (preset) {
 *     setIncludePdf(preset.includePdf);
 *     setIncludeCsv(preset.includeCsv);
 *   }
 * }, [preset]);
 * 
 * // Al confirmar export
 * await save({
 *   dateRange: 'week',
 *   includePdf: true,
 *   includeCsv: false,
 *   includeTotals: true,
 * });
 */
export function useExportPreset() {
  const [preset, setPreset] = useState<ExportPresetV1>(DEFAULT_PRESET);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preset al montar
  useEffect(() => {
    loadPreset()
      .then((loaded) => {
        setPreset(loaded);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Guardar preset (memoizado para evitar recrear función)
  const save = useCallback(async (newPreset: Partial<ExportPresetV1>) => {
    const merged: ExportPresetV1 = {
      ...preset,
      ...newPreset,
      lastUsedAt: Date.now(),
    };

    setPreset(merged);
    await savePreset(merged);
  }, [preset]);

  // Resetear preset
  const reset = useCallback(async () => {
    setPreset(DEFAULT_PRESET);
    await resetPreset();
  }, []);

  return {
    preset,
    isLoading,
    save,
    reset,
  };
}
