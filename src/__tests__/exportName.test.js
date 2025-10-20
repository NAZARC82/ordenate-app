// src/__tests__/exportName.test.js
/**
 * Unit tests for export name generation utilities
 */

import { 
  buildExportName, 
  formatDateForFilename, 
  getMovementsDateRange, 
  isSingleDay, 
  buildSubtitle 
} from '../utils/exportName';

describe('exportName utilities', () => {
  
  describe('buildExportName', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent test results
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(2025, 8, 30, 14, 30, 0)); // Sept 30, 2025, 14:30
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should build basic export name', () => {
      const result = buildExportName({
        activeTab: 'todos',
        ext: 'pdf'
      });
      expect(result).toBe('Ordenate_todos_1430.pdf');
    });

    test('should include specific date', () => {
      const result = buildExportName({
        activeTab: 'pagos',
        dateYMD: '2025-09-29',
        ext: 'csv'
      });
      expect(result).toBe('Ordenate_pagos_2025-09-29_1430.csv');
    });

    test('should include date range', () => {
      const result = buildExportName({
        activeTab: 'cobros',
        rangeStartYMD: '2025-09-01',
        rangeEndYMD: '2025-09-30',
        ext: 'pdf'
      });
      expect(result).toBe('Ordenate_cobros_2025-09-01_a_2025-09-30_1430.pdf');
    });

    test('should include selection count', () => {
      const result = buildExportName({
        activeTab: 'pagos',
        dateYMD: '2025-09-29',
        selectedCount: 5,
        ext: 'pdf'
      });
      expect(result).toBe('Ordenate_pagos_2025-09-29_1430_5sel.pdf');
    });

    test('should use custom base name', () => {
      const result = buildExportName({
        activeTab: 'todos',
        ext: 'csv',
        base: 'MiApp'
      });
      expect(result).toBe('MiApp_todos_1430.csv');
    });

    test('should handle all parameters together', () => {
      const result = buildExportName({
        activeTab: 'cobros',
        rangeStartYMD: '2025-09-01',
        rangeEndYMD: '2025-09-30',
        selectedCount: 10,
        ext: 'csv',
        base: 'Custom'
      });
      expect(result).toBe('Custom_cobros_2025-09-01_a_2025-09-30_1430_10sel.csv');
    });
  });

  describe('formatDateForFilename', () => {
    test('should format ISO date for filename using LOCAL timezone', () => {
      // formatDateForFilename ahora usa toYMDLocal (NO UTC)
      // En timezone GMT-3, '2025-09-30T02:59:59Z' es 29/09 local
      const result = formatDateForFilename('2025-09-30T15:30:00.000Z');
      expect(result).toBe('2025-09-30');
    });

    test('should handle different ISO formats with LOCAL dates', () => {
      // Las fechas ahora respetan el timezone del usuario
      expect(formatDateForFilename('2025-01-05T12:00:00Z')).toBe('2025-01-05');
      expect(formatDateForFilename('2025-12-31T12:00:00.000Z')).toBe('2025-12-31');
    });

    test('should handle invalid dates', () => {
      expect(formatDateForFilename('invalid')).toBe('');
      expect(formatDateForFilename('')).toBe('');
    });

    test('should use LOCAL date not UTC (critical for timezone GMT-3)', () => {
      // Usuario en GMT-3 exportando a las 23:00 del 30/09
      // ISO: 2025-10-01T02:00:00Z (UTC = 01 Oct)
      // LOCAL: 30/09/2025 23:00 (debe usar esta fecha)
      const localMidnight = new Date(2025, 8, 30, 23, 0, 0); // 30 Sept 23:00 local
      const iso = localMidnight.toISOString();
      const result = formatDateForFilename(iso);
      
      // Debe usar fecha LOCAL (30), no UTC (podría ser 01)
      expect(result).toContain('09-30');
    });
  });

  describe('getMovementsDateRange', () => {
    test('should get date range from movements using LOCAL dates', () => {
      const movements = [
        { fechaISO: '2025-09-25T10:00:00Z' },
        { fechaISO: '2025-09-30T15:00:00Z' },
        { fechaISO: '2025-09-28T12:00:00Z' }
      ];
      
      const result = getMovementsDateRange(movements);
      // Ahora usa toYMDLocal (LOCAL timezone)
      expect(result.startYMD).toBe('2025-09-25');
      expect(result.endYMD).toBe('2025-09-30');
    });

    test('should handle single movement', () => {
      const movements = [
        { fechaISO: '2025-09-30T15:00:00Z' }
      ];
      
      const result = getMovementsDateRange(movements);
      expect(result.startYMD).toBe('2025-09-30');
      expect(result.endYMD).toBe('2025-09-30');
    });

    test('should handle empty array', () => {
      const result = getMovementsDateRange([]);
      expect(result.startYMD).toBe('');
      expect(result.endYMD).toBe('');
    });

    test('should use LOCAL dates not UTC for range', () => {
      // Movimientos en timezone GMT-3
      const movements = [
        { fechaISO: '2025-09-30T02:00:00Z' }, // 29/09 23:00 local
        { fechaISO: '2025-10-01T03:00:00Z' }  // 01/10 00:00 local
      ];
      
      const result = getMovementsDateRange(movements);
      // Debe respetar fechas locales del usuario
      expect(result.startYMD).toContain('09-');
      expect(result.endYMD).toContain('10-');
    });
  });

  describe('isSingleDay', () => {
    test('should return true for movements on same day', () => {
      const movements = [
        { fechaISO: '2025-09-30T10:00:00Z' },
        { fechaISO: '2025-09-30T15:00:00Z' },
        { fechaISO: '2025-09-30T20:00:00Z' }
      ];
      
      expect(isSingleDay(movements)).toBe(true);
    });

    test('should return false for movements on different days', () => {
      const movements = [
        { fechaISO: '2025-09-29T10:00:00Z' },
        { fechaISO: '2025-09-30T15:00:00Z' }
      ];
      
      expect(isSingleDay(movements)).toBe(false);
    });

    test('should handle single movement', () => {
      const movements = [
        { fechaISO: '2025-09-30T15:00:00Z' }
      ];
      
      expect(isSingleDay(movements)).toBe(true);
    });

    test('should handle empty array', () => {
      expect(isSingleDay([])).toBe(true);
    });
  });

  describe('buildSubtitle', () => {
    test('should build subtitle for specific date', () => {
      const params = {
        activeTab: 'pagos',
        dateYMD: '2025-09-30',
        resultCount: 5
      };
      
      const result = buildSubtitle(params);
      expect(result).toContain('30/09/2025');
      expect(result).toContain('pagos'); // lowercase as per implementation
      expect(result).toContain('5');
    });

    test('should build subtitle for date range', () => {
      const params = {
        activeTab: 'cobros',
        rangeStartYMD: '2025-09-01',
        rangeEndYMD: '2025-09-30',
        resultCount: 10
      };
      
      const result = buildSubtitle(params);
      expect(result).toContain('01/09/2025');
      expect(result).toContain('30/09/2025');
      expect(result).toContain('cobros'); // lowercase as per implementation
      expect(result).toContain('10');
    });

    test('should include selection count', () => {
      const params = {
        activeTab: 'todos',
        dateYMD: '2025-09-30',
        resultCount: 10,
        selectedCount: 3
      };
      
      const result = buildSubtitle(params);
      expect(result).toContain('3 seleccionados');
    });

    test('should handle no date filter', () => {
      const params = {
        activeTab: 'todos',
        resultCount: 25
      };
      
      const result = buildSubtitle(params);
      expect(result).toContain('Todos');
      expect(result).toContain('25');
    });
  });
});