// src/features/pdf/mapper.ts
// Mapea preferencias de usuario a opciones concretas del builder HTML

import { PdfPreferences } from './prefs';

/**
 * Opciones aplicables al builder de PDF
 */
export interface PdfBuilderOptions {
  headerColor: string;
  accentColor: string;
  accentOpacity: number;
  negativeColor: string;
  positiveColor: string;
  showMovementCount: boolean;
  showGenerationDate: boolean;
}

/**
 * Mapea intensidad a opacidad del bloque resumen
 */
function mapIntensityToOpacity(intensity: number): number {
  // intensity: 1.0 → 0.95 (muy visible)
  // intensity: 0.5 → 0.70 (medio)
  // intensity: 0.0 → 0.45 (muy suave)
  return 0.45 + (intensity * 0.5);
}

/**
 * Mapea negativeRed a color hexadecimal
 */
function mapNegativeRed(level: 'strong' | 'medium' | 'soft'): string {
  switch (level) {
    case 'strong':
      return '#C0392B'; // Rojo fuerte (actual)
    case 'medium':
      return '#E74C3C'; // Rojo medio
    case 'soft':
      return '#EC7063'; // Rojo suave
    default:
      return '#C0392B';
  }
}

/**
 * Convierte preferencias de usuario a opciones del builder
 */
export function mapPrefsToPdfOptions(prefs: PdfPreferences): PdfBuilderOptions {
  return {
    headerColor: prefs.headerColor,
    accentColor: prefs.accentColor,
    accentOpacity: mapIntensityToOpacity(prefs.colorIntensity),
    negativeColor: mapNegativeRed(prefs.negativeRed),
    positiveColor: '#27AE60', // Verde siempre fijo
    showMovementCount: prefs.showMovementCount,
    showGenerationDate: prefs.showGenerationDate
  };
}

/**
 * Verifica si las opciones generan el mismo resultado que defaults
 */
export function areDefaultOptions(options: PdfBuilderOptions): boolean {
  return (
    options.headerColor === '#50616D' &&
    options.accentColor === '#6A5ACD' &&
    options.accentOpacity >= 0.94 && // tolerance
    options.negativeColor === '#C0392B' &&
    options.positiveColor === '#27AE60' &&
    options.showMovementCount === true &&
    options.showGenerationDate === true
  );
}
