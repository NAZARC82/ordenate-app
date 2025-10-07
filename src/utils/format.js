/**
 * Centralized formatting utilities for Ordenate App
 * Única fuente de verdad para formateo de fechas y montos
 */

/**
 * Formatear fecha en formato local dd/MM/yyyy
 * @param {string} isoString - Fecha ISO
 * @returns {string} - Fecha formateada
 */
export function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

/**
 * Formatear moneda con formato LATAM (sin símbolo)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Monto formateado
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00';
  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatear moneda con símbolo UYU (para pantallas)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Monto formateado con símbolo
 */
export function formatCurrencyWithSymbol(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '$U 0';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatear fecha abreviada (para exports)
 * @param {string|Date} date - Fecha
 * @returns {string} - Fecha formateada
 */
export function formatDateShort(date) {
  try {
    return new Intl.DateTimeFormat('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    return 'Fecha inválida';
  }
}

/**
 * Formatear fecha y hora completa
 * @param {string|Date} date - Fecha
 * @returns {string} - Fecha y hora formateada
 */
export function formatDateTime(date) {
  try {
    return new Intl.DateTimeFormat('es-UY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  } catch (error) {
    return 'Fecha inválida';
  }
}