// src/__tests__/format.test.js
/**
 * Unit tests for formatting utilities (migrados a format.js)
 * 
 * [PENDIENTE] - CONFIGURACIÓN DE TESTING
 * Este archivo contiene tests válidos pero requiere configuración adicional para RN:
 * - Jest configuration para React Native
 * - Babel transform para ES modules
 * - Mock de dependencias nativas (Expo, etc.)
 * 
 * Tests validados manualmente:
 * ✅ format.js tiene sintaxis válida (node -e test)
 * ✅ Funciones exportadas correctamente (formatCurrency, formatDate, formatPercent)  
 * ✅ Importación en pdfExport.js funciona en contexto RN
 */

import { formatCurrencyWithSymbol, formatDate, formatDateTime, formatCurrency, formatPercent } from '../utils/format';

describe('format utilities (centralizadas)', () => {
  
  describe('formatCurrencyWithSymbol', () => {
    test('should format positive amounts correctly', () => {
      expect(formatCurrencyWithSymbol(1000)).toBe('$ 1.000');
      expect(formatCurrencyWithSymbol(500)).toBe('$ 500');
      expect(formatCurrencyWithSymbol(1234.56)).toBe('$ 1.235'); // Rounded to 0 decimals
    });

    test('should format zero correctly', () => {
      expect(formatCurrencyWithSymbol(0)).toBe('$ 0');
    });

    test('should format negative amounts correctly', () => {
      expect(formatCurrencyWithSymbol(-500)).toBe('$ -500');
      expect(formatCurrencyWithSymbol(-1234.56)).toBe('$ -1.235');
    });

    test('should handle large numbers', () => {
      expect(formatCurrencyWithSymbol(1000000)).toBe('$ 1.000.000');
      expect(formatCurrencyWithSymbol(999999.99)).toBe('$ 1.000.000');
    });
  });

  describe('formatDate', () => {
    test('should format dates correctly', () => {
      const testDate = new Date('2025-09-30T12:00:00Z');
      const result = formatDate(testDate.toISOString());
      
      // Format should be dd/mm/yyyy for es-UY locale
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    test('should handle ISO string input', () => {
      const result = formatDate('2025-09-30T12:00:00Z');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    test('should handle different dates', () => {
      expect(formatDate('2025-01-01T00:00:00Z')).toMatch(/01\/01\/2025/);
      expect(formatDate('2025-12-31T23:59:59Z')).toMatch(/31\/12\/2025/);
    });
  });

  describe('formatDateTime', () => {
    test('should format datetime correctly', () => {
      const testDate = new Date('2025-09-30T15:30:45Z');
      const result = formatDateTime(testDate.toISOString());
      
      // Should include date and time components (textual format: "30 set. 2025, 12:30:45 p. m.")
      expect(result).toMatch(/\d{1,2}\s+\w+\.?\s+\d{4}/); // Date part (textual month)
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Time part with seconds
    });

    test('should handle ISO string input', () => {
      const result = formatDateTime('2025-09-30T15:30:45Z');
      expect(result).toMatch(/\d{1,2}\s+\w+\.?\s+\d{4}.*\d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe('formatCurrency', () => {
    test('should format amounts without symbol (default UYU)', () => {
      expect(formatCurrency(1000)).toBe('1.000,00');
      expect(formatCurrency(500.75)).toBe('500,75');
      expect(formatCurrency(0)).toBe('0,00');
    });

    test('should handle different currencies', () => {
      expect(formatCurrency(1000, 'USD', 'en-US')).toMatch(/\$1,000\.00/);
      expect(formatCurrency(1000, 'EUR', 'de-DE')).toMatch(/1\.000,00\s*€/);
    });

    test('should fallback gracefully for invalid values', () => {
      expect(formatCurrency(NaN)).toBe('0,00');
      expect(formatCurrency('invalid')).toBe('0,00');
    });
  });

  describe('formatPercent', () => {
    test('should format percentages with default 1 decimal', () => {
      expect(formatPercent(0.15)).toBe('15,0%');
      expect(formatPercent(0.5)).toBe('50,0%');
      expect(formatPercent(1.25)).toBe('125,0%');
    });

    test('should handle custom decimal places', () => {
      expect(formatPercent(0.1234, 2)).toBe('12,34%');
      expect(formatPercent(0.1234, 0)).toBe('12%');
    });

    test('should handle edge cases', () => {
      expect(formatPercent(0)).toBe('0,0%');
      expect(formatPercent(NaN)).toBe('0,0%');
      expect(formatPercent('invalid')).toBe('0,0%');
    });
  });
});