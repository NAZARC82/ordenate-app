// src/utils/estadoColor.js
// Helper centralizado para colores de estados

/**
 * Mapa de colores para estados de movimientos
 * Mantiene la paleta consistente en toda la aplicación
 */
const COLORES_ESTADO = {
  urgente: '#FF4444',    // rojo
  pronto: '#FFA500',     // naranja  
  pendiente: '#FFD700',  // amarillo
  pagado: '#4CAF50'      // verde
};

/**
 * Colores claros para estados seleccionados (mejor contraste)
 */
const COLORES_ESTADO_SELECTED = {
  urgente: '#FFCCCC',    // rojo claro
  pronto: '#FFE4B3',     // naranja claro
  pendiente: '#FFF5CC',  // amarillo claro
  pagado: '#E8F5E8'      // verde muy claro
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
    return '#CCCCCC';
  }
  
  const colorMap = selected ? COLORES_ESTADO_SELECTED : COLORES_ESTADO;
  const color = colorMap[estado];
  
  if (!color) {
    console.warn(`getEstadoColor: estado desconocido '${estado}', usando color por defecto`);
    return '#CCCCCC';
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
