// src/utils/estadoColor.js
// Helper centralizado para colores de estados usando tema unificado
import { COLORS } from '../theme/colors';

/**
 * Mapa de colores para estados de movimientos usando el tema centralizado
 * Mantiene la paleta consistente en toda la aplicación
 */
const COLORES_ESTADO = {
  urgente: COLORS.export.urgent,     // rojo del tema
  pronto: COLORS.export.pending,     // naranja del tema (pendiente y pronto son similares)
  pendiente: COLORS.export.pending,  // naranja del tema
  pagado: COLORS.export.paid         // verde del tema
};

/**
 * Colores claros para estados seleccionados (versiones más claras del tema)
 * Usando transparencia para mantener coherencia con el tema base
 */
const COLORES_ESTADO_SELECTED = {
  urgente: COLORS.export.urgent + '33',     // rojo claro (20% opacidad)
  pronto: COLORS.export.pending + '33',     // naranja claro (20% opacidad)
  pendiente: COLORS.export.pending + '33',  // naranja claro (20% opacidad)
  pagado: COLORS.export.paid + '33'         // verde claro (20% opacidad)
};

/**
 * Obtiene el color para un estado específico
 * @param {string} estado - Estado del movimiento ('pendiente'|'pronto'|'urgente'|'pagado')
 * @param {Object} opts - Opciones adicionales
 * @param {boolean} opts.selected - Si el estado está seleccionado (usa color claro)
 * @returns {string} Color en formato hex
 */
export function getEstadoColor(estado, opts = {}) {
  const { selected = false } = opts;
  
  if (!estado) {
    console.warn('getEstadoColor: estado no definido, usando color por defecto');
    return COLORS.text.secondary; // Color por defecto del tema
  }
  
  const colorMap = selected ? COLORES_ESTADO_SELECTED : COLORES_ESTADO;
  const color = colorMap[estado.toLowerCase()];
  
  if (!color) {
    console.warn(`getEstadoColor: estado desconocido '${estado}', usando color por defecto`);
    return COLORS.text.secondary; // Color por defecto del tema
  }
  
  return color;
}

/**
 * Alias para retrocompatibilidad con getColorForEstado
 * @param {string} estado - Estado del movimiento
 * @param {boolean} isSelected - Si está seleccionado
 * @returns {string} Color en formato hex
 */
export function getColorForEstado(estado, isSelected = false) {
  return getEstadoColor(estado, { selected: isSelected });
}

// Export por defecto para facilitar importación
export default getEstadoColor;