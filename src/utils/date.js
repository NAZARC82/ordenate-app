// src/utils/date.js
/**
 * Utilities for date handling and timezone-safe comparisons
 */

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
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
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