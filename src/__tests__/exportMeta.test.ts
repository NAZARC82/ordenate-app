/**
 * @jest-environment node
 */

import { getExportMeta, ensureFileName, getKindFromMime } from '../utils/exportMeta';

describe('exportMeta - Metadata de exports (PDF/CSV)', () => {
  
  describe('getExportMeta', () => {
    it('retorna ext y mime correctos para PDF', () => {
      const meta = getExportMeta('pdf');
      
      expect(meta).toEqual({
        ext: '.pdf',
        mime: 'application/pdf'
      });
    });

    it('retorna ext y mime correctos para CSV', () => {
      const meta = getExportMeta('csv');
      
      expect(meta).toEqual({
        ext: '.csv',
        mime: 'text/csv'
      });
    });

    it('ext siempre incluye el punto', () => {
      const pdfMeta = getExportMeta('pdf');
      const csvMeta = getExportMeta('csv');
      
      expect(pdfMeta.ext.startsWith('.')).toBe(true);
      expect(csvMeta.ext.startsWith('.')).toBe(true);
    });
  });

  describe('ensureFileName', () => {
    it('agrega extensión si no existe', () => {
      const result = ensureFileName('documento', '.pdf');
      expect(result).toBe('documento.pdf');
    });

    it('no duplica extensión si ya existe (lowercase)', () => {
      const result = ensureFileName('reporte.pdf', '.pdf');
      expect(result).toBe('reporte.pdf');
    });

    it('no duplica extensión si ya existe (uppercase)', () => {
      const result = ensureFileName('REPORTE.PDF', '.pdf');
      expect(result).toBe('REPORTE.PDF');
    });

    it('no duplica extensión si ya existe (mixed case)', () => {
      const result = ensureFileName('Reporte.PDF', '.pdf');
      expect(result).toBe('Reporte.PDF');
    });

    it('agrega extensión a CSV', () => {
      const result = ensureFileName('data', '.csv');
      expect(result).toBe('data.csv');
    });

    it('no duplica extensión CSV', () => {
      const result = ensureFileName('export.csv', '.csv');
      expect(result).toBe('export.csv');
    });

    it('maneja nombre vacío', () => {
      const result = ensureFileName('', '.pdf');
      expect(result).toBe('documento.pdf');
    });

    it('maneja null/undefined', () => {
      const result1 = ensureFileName(null as any, '.pdf');
      const result2 = ensureFileName(undefined as any, '.csv');
      
      expect(result1).toBe('documento.pdf');
      expect(result2).toBe('documento.csv');
    });

    it('preserva nombre completo con guiones y números', () => {
      const result = ensureFileName('Ordenate_20251017_5mov_1234', '.pdf');
      expect(result).toBe('Ordenate_20251017_5mov_1234.pdf');
    });
  });

  describe('getKindFromMime', () => {
    it('retorna "csv" para text/csv', () => {
      const kind = getKindFromMime('text/csv');
      expect(kind).toBe('csv');
    });

    it('retorna "pdf" para application/pdf', () => {
      const kind = getKindFromMime('application/pdf');
      expect(kind).toBe('pdf');
    });

    it('retorna "pdf" para cualquier otro mime (default)', () => {
      const kind1 = getKindFromMime('application/json');
      const kind2 = getKindFromMime('text/plain');
      const kind3 = getKindFromMime('');
      
      expect(kind1).toBe('pdf');
      expect(kind2).toBe('pdf');
      expect(kind3).toBe('pdf');
    });
  });

  describe('Integración - flujo completo', () => {
    it('flujo PDF: getExportMeta → ensureFileName', () => {
      const baseName = 'Ordenate_20251017_3mov_1045';
      const { ext, mime } = getExportMeta('pdf');
      const fileName = ensureFileName(baseName, ext);
      
      expect(fileName).toBe('Ordenate_20251017_3mov_1045.pdf');
      expect(mime).toBe('application/pdf');
    });

    it('flujo CSV: getExportMeta → ensureFileName', () => {
      const baseName = 'Ordenate_Enero_2025_15mov';
      const { ext, mime } = getExportMeta('csv');
      const fileName = ensureFileName(baseName, ext);
      
      expect(fileName).toBe('Ordenate_Enero_2025_15mov.csv');
      expect(mime).toBe('text/csv');
    });

    it('nombre ya con extensión no se duplica', () => {
      const baseName = 'reporte.pdf';
      const { ext } = getExportMeta('pdf');
      const fileName = ensureFileName(baseName, ext);
      
      expect(fileName).toBe('reporte.pdf');
      expect(fileName.split('.pdf').length - 1).toBe(1); // Solo una ocurrencia de .pdf
    });
  });
});
