// src/__tests__/date.test.js
/**
 * Unit tests for date utilities
 */

import { 
  todayLocalStart, 
  toYMDLocal, 
  parseYMDToLocal, 
  getDateString, 
  sameDay, 
  getTodayString, 
  getTodayISO,
  isValidISODate,
  getMonthString,
  parseFechaUsuario
} from '../utils/date';

describe('date utilities', () => {
  
  describe('todayLocalStart', () => {
    test('should return today at start of day', () => {
      const today = todayLocalStart();
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
      expect(today.getMilliseconds()).toBe(0);
    });
  });

  describe('toYMDLocal', () => {
    test('should format dates as YYYY-MM-DD', () => {
      const date = new Date(2025, 8, 30); // September 30, 2025 (month is 0-indexed)
      expect(toYMDLocal(date)).toBe('2025-09-30');
    });

    test('should handle single digit months and days', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(toYMDLocal(date)).toBe('2025-01-05');
    });
  });

  describe('parseYMDToLocal', () => {
    test('should parse YYYY-MM-DD to local date', () => {
      const date = parseYMDToLocal('2025-09-30');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(8); // September (0-indexed)
      expect(date.getDate()).toBe(30);
      expect(date.getHours()).toBe(0);
    });

    test('should handle invalid input gracefully', () => {
      const date = parseYMDToLocal('invalid');
      expect(date).toBeInstanceOf(Date);
    });

    test('should handle empty input', () => {
      const date = parseYMDToLocal('');
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('getDateString', () => {
    test('should extract YYYY-MM-DD from ISO string', () => {
      const iso = '2025-09-30T15:30:00.000Z';
      const result = getDateString(iso);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should handle invalid ISO strings', () => {
      expect(getDateString('invalid')).toBe('');
      expect(getDateString('')).toBe('');
      expect(getDateString(null)).toBe('');
    });
  });

  describe('sameDay', () => {
    test('should return true for same day different times', () => {
      const iso1 = '2025-09-30T10:00:00.000Z';
      const iso2 = '2025-09-30T22:00:00.000Z';
      expect(sameDay(iso1, iso2)).toBe(true);
    });

    test('should return false for different days', () => {
      const iso1 = '2025-09-30T10:00:00.000Z';
      const iso2 = '2025-10-01T10:00:00.000Z';
      expect(sameDay(iso1, iso2)).toBe(false);
    });

    test('should handle invalid inputs', () => {
      expect(sameDay('invalid', '2025-09-30T10:00:00.000Z')).toBe(false);
      expect(sameDay('', '')).toBe(false);
    });
  });

  describe('getTodayString', () => {
    test('should return today in YYYY-MM-DD format', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTodayISO', () => {
    test('should return today as ISO string at noon', () => {
      const result = getTodayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T12:00:00\.\d{3}Z$/);
    });
  });

  describe('isValidISODate', () => {
    test('should validate correct ISO dates', () => {
      expect(isValidISODate('2025-09-30T15:30:00.000Z')).toBe(true);
      expect(isValidISODate('2025-01-01T00:00:00Z')).toBe(true);
    });

    test('should reject invalid ISO dates', () => {
      expect(isValidISODate('2025-09-30')).toBe(false); // No time part
      expect(isValidISODate('invalid')).toBe(false);
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate(null)).toBe(false);
      expect(isValidISODate(undefined)).toBe(false);
    });
  });

  describe('getMonthString', () => {
    test('should extract YYYY-MM from ISO string', () => {
      expect(getMonthString('2025-09-30T15:30:00.000Z')).toBe('2025-09');
      expect(getMonthString('2025-12-01T00:00:00.000Z')).toBe('2025-12');
    });

    test('should handle invalid input', () => {
      expect(getMonthString('invalid')).toBe('');
      expect(getMonthString('')).toBe('');
    });
  });

  describe('parseFechaUsuario', () => {
    const testToday = new Date(2025, 8, 30); // September 30, 2025

    test('should parse dd/mm format with current year', () => {
      const result = parseFechaUsuario('25/09', testToday);
      expect(result.dd).toBe(25);
      expect(result.mm).toBe(9);
      expect(result.yyyy).toBe(2025);
      expect(result.error).toBe(null);
      expect(result.displayValue).toBe('25/09/2025');
    });

    test('should parse dd/mm/yyyy format', () => {
      const result = parseFechaUsuario('25/09/2024', testToday);
      expect(result.dd).toBe(25);
      expect(result.mm).toBe(9);
      expect(result.yyyy).toBe(2024);
      expect(result.error).toBe(null);
    });

    test('should validate day ranges', () => {
      const result = parseFechaUsuario('32/01/2025', testToday);
      expect(result.error).toContain('Día debe estar entre 1 y 31');
    });

    test('should validate month ranges', () => {
      const result = parseFechaUsuario('15/13/2025', testToday);
      expect(result.error).toContain('Mes debe estar entre 1 y 12');
    });

    test('should validate leap years', () => {
      const result = parseFechaUsuario('29/02/2025', testToday); // 2025 is not a leap year
      expect(result.error).toContain('Fecha no válida');
    });

    test('should handle invalid formats', () => {
      expect(parseFechaUsuario('invalid', testToday).error).toContain('Formato inválido');
      expect(parseFechaUsuario('', testToday).error).toContain('Fecha requerida');
      expect(parseFechaUsuario(null, testToday).error).toContain('Fecha requerida');
    });

    test('should clean input and handle extra characters', () => {
      const result = parseFechaUsuario('25 / 09 / 2025', testToday);
      expect(result.error).toBe(null);
      expect(result.displayValue).toBe('25/09/2025');
    });
  });
});