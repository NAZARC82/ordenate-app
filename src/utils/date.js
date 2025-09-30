// src/utils/date.js
/**
 * Utilities for date handling and timezone-safe comparisons
 */

/**
 * Get current date as local start-of-day (no UTC conversion)
 * @returns {Date} - Today at 00:00:00 local time
 */
export const todayLocalStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Convert Date to YYYY-MM-DD in local timezone (no UTC)
 * @param {Date} date - Date object
 * @returns {string} - Date in YYYY-MM-DD format (local)
 */
export const toYMDLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD string to local Date at start-of-day
 * @param {string} ymdString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date at 00:00:00 local time
 */
export const parseYMDToLocal = (ymdString) => {
  if (!ymdString) return new Date();
  
  try {
    const [year, month, day] = ymdString.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0); // Start at noon to avoid DST issues
    date.setHours(0, 0, 0, 0); // Then set to start of day
    return date;
  } catch (error) {
    console.warn('Invalid YMD string:', ymdString);
    return new Date();
  }
};

/**
 * Extract YYYY-MM-DD string from ISO date string, ignoring time/timezone
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const getDateString = (isoString) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch (error) {
    console.warn('Invalid ISO date string:', isoString);
    return '';
  }
};

/**
 * Check if two ISO date strings represent the same day (ignoring time)
 * @param {string} iso1 - First ISO date string
 * @param {string} iso2 - Second ISO date string
 * @returns {boolean} - True if same day
 */
export const sameDay = (iso1, iso2) => {
  if (!iso1 || !iso2) return false;
  return getDateString(iso1) === getDateString(iso2);
};

/**
 * Get current date in YYYY-MM-DD format (local timezone)
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return toYMDLocal(todayLocalStart());
};

/**
 * Validate if a string is a valid ISO date
 * @param {string} isoString - ISO date string to validate
 * @returns {boolean} - True if valid ISO date
 */
export const isValidISODate = (isoString) => {
  if (!isoString || typeof isoString !== 'string') return false;
  const date = new Date(isoString);
  return !isNaN(date.getTime()) && isoString.includes('T');
};

/**
 * Get month key (YYYY-MM) from ISO date string
 * @param {string} isoString - ISO date string
 * @returns {string} - Month in YYYY-MM format
 */
export const getMonthString = (isoString) => {
  if (!isoString) return '';
  try {
    return getDateString(isoString).substring(0, 7); // YYYY-MM
  } catch (error) {
    console.warn('Invalid ISO date string for month:', isoString);
    return '';
  }
};

/**
 * Parse user date input with implicit current year
 * @param {string} input - User input like "25/09" or "25/09/2025"
 * @param {Date} today - Reference date for current year (default: new Date())
 * @returns {Object} - {dd, mm, yyyy, iso, error, displayValue}
 */
export const parseFechaUsuario = (input, today = new Date()) => {
  if (!input || typeof input !== 'string') {
    return { error: 'Fecha requerida' };
  }

  // Clean input - only digits and slashes
  const cleanInput = input.replace(/[^\d\/]/g, '');
  
  // Try patterns: dd/mm or dd/mm/yyyy
  const shortPattern = /^(\d{1,2})\/(\d{1,2})$/;
  const fullPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  let dd, mm, yyyy;
  
  const shortMatch = shortPattern.exec(cleanInput);
  const fullMatch = fullPattern.exec(cleanInput);
  
  if (fullMatch) {
    // Full date provided
    [, dd, mm, yyyy] = fullMatch.map(Number);
  } else if (shortMatch) {
    // Only day/month provided - use current year
    [, dd, mm] = shortMatch.map(Number);
    yyyy = today.getFullYear();
  } else {
    return { error: 'Formato inválido. Use dd/mm o dd/mm/aaaa' };
  }

  // Validate ranges
  if (dd < 1 || dd > 31) {
    return { error: 'Día debe estar entre 1 y 31' };
  }
  
  if (mm < 1 || mm > 12) {
    return { error: 'Mes debe estar entre 1 y 12' };
  }
  
  if (yyyy < 1900 || yyyy > 2100) {
    return { error: 'Año debe estar entre 1900 y 2100' };
  }

  // Create date and validate it exists (handles leap years, etc.)
  const testDate = new Date(yyyy, mm - 1, dd, 12, 0, 0); // Local time for validation
  
  if (testDate.getFullYear() !== yyyy || 
      testDate.getMonth() !== mm - 1 || 
      testDate.getDate() !== dd) {
    return { error: 'Fecha no válida (verifique día del mes)' };
  }

  // Create ISO string at UTC noon (use Date.UTC to avoid timezone offset)
  const iso = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0)).toISOString();
  
  // Format display value
  const displayValue = `${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`;
  
  return {
    dd,
    mm, 
    yyyy,
    iso,
    displayValue,
    error: null
  };
};