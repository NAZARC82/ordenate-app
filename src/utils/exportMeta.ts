/**
 * exportMeta.ts
 * Centraliza la metadata de exports (PDF/CSV): extensión y mimeType.
 * Asegura consistencia en todo el flujo de exportación.
 */

export type ExportKind = 'pdf' | 'csv';

export interface ExportMeta {
  ext: string;
  mime: string;
}

/**
 * Retorna la metadata correcta para cada tipo de export
 * @param kind - Tipo de export: 'pdf' o 'csv'
 * @returns {ext, mime} - Extensión y mimeType correctos
 */
export function getExportMeta(kind: ExportKind): ExportMeta {
  return kind === 'csv'
    ? { ext: '.csv', mime: 'text/csv' }
    : { ext: '.pdf', mime: 'application/pdf' };
}

/**
 * Asegura que el nombre de archivo tenga la extensión correcta
 * @param name - Nombre base del archivo
 * @param ext - Extensión a asegurar (ej: '.pdf', '.csv')
 * @returns Nombre de archivo con extensión garantizada
 */
export function ensureFileName(name: string, ext: string): string {
  if (!name) return `documento${ext}`;
  const lowerName = name.toLowerCase();
  return lowerName.endsWith(ext) ? name : `${name}${ext}`;
}

/**
 * Determina el tipo de export basado en el mimeType
 * @param mimeType - MIME type del archivo
 * @returns 'pdf' o 'csv'
 */
export function getKindFromMime(mimeType: string): ExportKind {
  return mimeType === 'text/csv' ? 'csv' : 'pdf';
}
