// src/__tests__/format.test.js
/**
 * Unit tests for formatting utilities (migrados a format.js)
 */

import { formatCurrencyWithSymbol, formatDate, formatDateTime } from '../utils/format';

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
      
      // Should include date and time components
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date part
      expect(result).toMatch(/\d{2}:\d{2}/); // Time part
    });

    test('should handle ISO string input', () => {
      const result = formatDateTime('2025-09-30T15:30:45Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{2}:\d{2}/);
    });
  });
});