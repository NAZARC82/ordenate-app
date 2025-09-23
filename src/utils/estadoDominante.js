// src/utils/estadoDominante.js
// Helper para determinar estado dominante según prioridad
// urgente > pronto > pendiente > pagado

const PRIORIDAD_ESTADOS = {
  'urgente': 4,
  'pronto': 3, 
  'pendiente': 2,
  'pagado': 1
};

const COLORES_ESTADO = {
  urgente: '#FF4444',    // rojo
  pronto: '#FFA500',     // naranja
  pendiente: '#FFD700',  // amarillo
  pagado: '#4CAF50'      // verde
};

const COLORES_ESTADO_SELECTED = {
  urgente: '#FFCCCC',    // rojo claro para fondo verde
  pronto: '#FFE4B3',     // naranja claro
  pendiente: '#FFF5CC',  // amarillo claro
  pagado: '#E8F5E8'      // verde muy claro
};

/**
 * Determina el estado dominante de un día basado en prioridad
 * @param {Array} movimientosDelDia - Array de movimientos del día
 * @returns {string|null} - Estado dominante o null si no hay movimientos
 */
export function getEstadoDominante(movimientosDelDia) {
  if (!movimientosDelDia || movimientosDelDia.length === 0) {
    return null;
  }
  
  let estadoDominante = null;
  let prioridadMaxima = 0;
  
  movimientosDelDia.forEach(mov => {
    const prioridad = PRIORIDAD_ESTADOS[mov.estado] || 0;
    if (prioridad > prioridadMaxima) {
      prioridadMaxima = prioridad;
      estadoDominante = mov.estado;
    }
  });
  
  return estadoDominante;
}

/**
 * Obtiene el color para un estado
 * @param {string} estado - Estado del movimiento
 * @param {boolean} isSelected - Si el día está seleccionado
 * @returns {string} - Color hex
 */
export function getColorForEstado(estado, isSelected = false) {
  if (!estado) return null;
  
  const colorMap = isSelected ? COLORES_ESTADO_SELECTED : COLORES_ESTADO;
  return colorMap[estado] || '#CCCCCC';
}

/**
 * Genera un mapa de días a estado dominante para el calendario
 * @param {Array} movimientos - Array de todos los movimientos
 * @param {Function} getDateString - Función para extraer fecha string de ISO
 * @returns {Object} - Objeto con key=YYYY-MM-DD, value=estado dominante
 */
export function getDayStateMap(movimientos, getDateString) {
  const dayStateMap = {};
  
  // Agrupar movimientos por día
  const movimientosPorDia = {};
  movimientos.forEach(mov => {
    const dateKey = getDateString(mov.fechaISO);
    if (!dateKey) return;
    
    if (!movimientosPorDia[dateKey]) {
      movimientosPorDia[dateKey] = [];
    }
    movimientosPorDia[dateKey].push(mov);
  });
  
  // Calcular estado dominante para cada día
  Object.keys(movimientosPorDia).forEach(dateKey => {
    const estadoDominante = getEstadoDominante(movimientosPorDia[dateKey]);
    if (estadoDominante) {
      dayStateMap[dateKey] = estadoDominante;
    }
  });
  
  return dayStateMap;
}