// src/features/pdf/flags.ts
// Feature flags para gestión de documentos PDF

/**
 * Flags de configuración para features de PDF
 * 
 * @constant FLAGS - Configuración de features disponibles
 */
export const FLAGS = {
  /**
   * @deprecated Botón "Modificar PDF" en flujos de exportación
   * Desactivado: centralizado en Ajustes → Gestor de Documentos
   */
  pdfDesignerInExport: false,
  
  /**
   * Hub centralizado de gestión de documentos en Ajustes
   * Incluye: Diseño PDF, Firmas, Recientes
   */
  pdfHubInSettings: true,
} as const;

/**
 * Type-safe access to feature flags
 */
export type FeatureFlags = typeof FLAGS;

/**
 * Verifica si una feature está habilitada
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FLAGS[feature] === true;
}

/**
 * Log de estado de features (solo desarrollo)
 */
export function logFeatureStatus() {
  if (__DEV__) {
    console.log('[PDF Features] Estado actual:', FLAGS);
  }
}
