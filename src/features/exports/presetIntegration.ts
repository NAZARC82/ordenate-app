/**
 * Helper para integrar presets de exportación en modales
 * 
 * Facilita la integración del sistema de presets en ExportOptionsModal
 * o cualquier otro modal de exportación.
 * 
 * @module features/exports/presetIntegration
 */

import { useEffect } from 'react';
import { useExportPreset, ExportPresetV1 } from './presets';
import { createZip } from '../../utils/zipExport';
import { showExportToast } from '../../utils/toast';
import { presentOpenWithSafely } from '../../utils/openWith';

/**
 * Opciones para exportación con ZIP
 */
export interface ExportWithZipOptions {
  pdfUri?: string;
  csvUri?: string;
  outName: string; // ej: Ordenate_2025-10-20_pdf_csv.zip
}

/**
 * Exportar PDF+CSV en un único ZIP
 * 
 * @param options - URIs de archivos y nombre de salida
 * @returns URI del ZIP generado
 * 
 * @example
 * const zipUri = await exportWithZip({
 *   pdfUri: 'file:///exports/reporte.pdf',
 *   csvUri: 'file:///exports/datos.csv',
 *   outName: 'Ordenate_2025-10-20_pdf_csv.zip'
 * });
 * 
 * await presentOpenWithSafely({
 *   uri: zipUri,
 *   kind: 'pdf', // Usa mime application/zip internamente
 * });
 */
export async function exportWithZip(options: ExportWithZipOptions): Promise<string> {
  const { pdfUri, csvUri, outName } = options;

  const files: Array<{ uri: string; name: string }> = [];

  if (pdfUri) {
    const pdfName = pdfUri.split('/').pop() || 'export.pdf';
    files.push({ uri: pdfUri, name: pdfName });
  }

  if (csvUri) {
    const csvName = csvUri.split('/').pop() || 'export.csv';
    files.push({ uri: csvUri, name: csvName });
  }

  if (files.length === 0) {
    throw new Error('exportWithZip: no files provided');
  }

  const { uri } = await createZip({ files, outName });
  return uri;
}

/**
 * Hook para integrar presets en modal de exportación
 * 
 * Uso en ExportOptionsModal:
 * 
 * @example
 * // 1. Importar hook
 * import { useExportModalPresets } from '../features/exports/presetIntegration';
 * 
 * // 2. Usar en componente
 * const { 
 *   preset, 
 *   isLoading, 
 *   saveCurrentSelection 
 * } = useExportModalPresets({
 *   onLoad: (loaded) => {
 *     // Restaurar valores al abrir modal
 *     setIncludePdf(loaded.includePdf);
 *     setIncludeCsv(loaded.includeCsv);
 *     setDateRange(loaded.dateRange);
 *   }
 * });
 * 
 * // 3. Guardar al confirmar export
 * const handleExport = async () => {
 *   await saveCurrentSelection({
 *     dateRange: 'week',
 *     includePdf: true,
 *     includeCsv: false,
 *     includeTotals: true,
 *   });
 *   
 *   // ... continuar con export
 * };
 */
export function useExportModalPresets(options?: {
  onLoad?: (preset: ExportPresetV1) => void;
}) {
  const { preset, isLoading, save } = useExportPreset();

  // Llamar onLoad cuando el preset cargue
  useEffect(() => {
    if (!isLoading && options?.onLoad) {
      options.onLoad(preset);
    }
  }, [isLoading, preset, options?.onLoad]);

  /**
   * Guardar selección actual
   */
  const saveCurrentSelection = async (current: Partial<ExportPresetV1>) => {
    await save(current);
  };

  return {
    preset,
    isLoading,
    saveCurrentSelection,
  };
}

/**
 * Mostrar toast post-exportación con acción de abrir
 * 
 * @param fileName - Nombre del archivo exportado
 * @param fileUri - URI del archivo
 * @param kind - Tipo de archivo ('pdf', 'csv', o 'zip')
 * 
 * @example
 * await showPostExportToast('Ordenate_2025-10-20.pdf', fileUri, 'pdf');
 */
export async function showPostExportToast(
  fileName: string,
  fileUri: string,
  kind: 'pdf' | 'csv' = 'pdf'
): Promise<void> {
  showExportToast(fileName, async () => {
    // Abrir archivo al presionar "Abrir"
    await presentOpenWithSafely({
      uri: fileUri,
      kind,
    });
  });
}

/**
 * Determinar si se debe generar ZIP
 * 
 * @param includePdf - Usuario quiere PDF
 * @param includeCsv - Usuario quiere CSV
 * @returns true si debe generar ZIP (ambos seleccionados)
 */
export function shouldCreateZip(includePdf: boolean, includeCsv: boolean): boolean {
  return includePdf && includeCsv;
}
