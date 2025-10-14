// src/features/pdf/usePdfPrefs.ts
// Hook de React para gestionar preferencias de PDF

import { useState, useEffect, useCallback } from 'react';
import { getPdfPrefs, savePdfPrefs, resetPdfPrefs, PdfPreferences, DEFAULT_PDF_PREFS } from './prefs';

export function usePdfPrefs() {
  const [prefs, setPrefs] = useState<PdfPreferences>(DEFAULT_PDF_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar preferencias al montar
  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await getPdfPrefs();
      setPrefs(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando preferencias');
      console.error('[usePdfPrefs] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrefs = useCallback(async (updates: Partial<PdfPreferences>) => {
    try {
      setError(null);
      await savePdfPrefs(updates);
      const updated = await getPdfPrefs();
      setPrefs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando preferencias');
      throw err;
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      setError(null);
      await resetPdfPrefs();
      setPrefs(DEFAULT_PDF_PREFS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reseteando preferencias');
      throw err;
    }
  }, []);

  return {
    prefs,
    loading,
    error,
    updatePrefs,
    reset,
    reload: loadPrefs
  };
}
