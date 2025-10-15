// utils/format.js
// Centraliza funciones de formato para toda la app (moneda, fecha, porcentaje)
// Última actualización: 2025-10-13 por Claude

/**
 * Centralized formatting utilities for Ordenate App
 * Única fuente de verdad para formateo de fechas y montos
 */

/**
 * Formatear fecha en formato local dd/MM/yyyy usando UTC
 * @param {string} isoString - Fecha ISO
 * @param {string} locale - Locale a usar (default: 'es-UY')
 * @returns {string} - Fecha formateada
 */
export function formatDate(isoString, locale = 'es-UY') {
  try {
    return new Date(isoString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // Usar UTC para consistencia
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

/**
 * Formatear moneda con formato LATAM (sin símbolo)
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'UYU')
 * @param {string} locale - Locale a usar (default: 'es-UY')
 * @returns {string} - Monto formateado
 */
export function formatCurrency(amount, currency = 'UYU', locale = 'es-UY') {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00';
  
  // Para mantener compatibilidad con uso actual sin símbolo
  if (currency === 'UYU' && locale === 'es-UY') {
    return new Intl.NumberFormat('es-UY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback si el locale/currency no es soportado
    return new Intl.NumberFormat('es-UY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

/**
 * Formatear moneda con símbolo UYU (para pantallas)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Monto formateado con símbolo (formato: $ -500 para negativos)
 */
export function formatCurrencyWithSymbol(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '$ 0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Formatear con Intl
  const formatted = new Intl.NumberFormat('es-UY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);
  
  // Formato: $ -500 para negativos, $ 500 para positivos
  return isNegative ? `$ -${formatted}` : `$ ${formatted}`;
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

/**
 * Formatear porcentaje con locales
 * @param {number} value - Valor a formatear como porcentaje (ej: 0.15 -> 15,0%)
 * @param {number} decimals - Número de decimales (default: 1)
 * @param {string} locale - Locale a usar (default: 'es-UY')
 * @returns {string} - Porcentaje formateado
 */
export function formatPercent(value, decimals = 1, locale = 'es-UY') {
  if (typeof value !== 'number' || isNaN(value)) return '0,0%';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    return `${(value * 100).toFixed(decimals).replace('.', ',')}%`;
  }
}