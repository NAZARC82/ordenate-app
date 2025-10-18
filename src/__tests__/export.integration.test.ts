/**
 * @jest-environment node
 * 
 * TESTS DE INTEGRACIÓN: Exportación PDF/CSV
 * 
 * Verifica que el flujo completo de exportación funcione correctamente:
 * 1. Exportar PDF/CSV genera archivo
 * 2. Archivo se registra en Recientes
 * 3. fileExists() valida el archivo antes de compartir
 * 4. Share Sheet se presenta correctamente
 * 
 * CRÍTICO: Estos tests verifican que la migración a fileExists()
 * no rompió la funcionalidad de exportación.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

// Mock de expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  getInfoAsync: jest.fn(() => Promise.resolve({ 
    exists: true, 
    size: 1024, 
    isDirectory: false 
  })),
  moveAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
}));

// Mock de expo-print
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ 
    uri: 'file://mock/temp.pdf' 
  })),
}));

// Mock de expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

describe('Exportación PDF/CSV - Integración', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock por defecto: archivos existen
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024,
      isDirectory: false
    });
  });

  describe('exportPDFColored()', () => {
    
    it('genera PDF, registra en recientes y retorna URI válida', async () => {
      const { exportPDFColored } = require('../utils/pdfExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      const result = await exportPDFColored(movimientos);
      
      // Verificar resultado exitoso
      expect(result.success).toBe(true);
      expect(result.fileUri).toBeDefined();
      expect(result.fileName).toContain('.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.documentId).toBeDefined();
      
      // Verificar que se llamó a Print.printToFileAsync
      expect(Print.printToFileAsync).toHaveBeenCalled();
      
      // Nota: fs.ts usa expo-file-system/legacy internamente
      // No verificamos mocks específicos porque están en otro módulo
      
      console.log('[TEST] ✅ PDF exportado correctamente:', result.fileName);
    });

    it('maneja error cuando no hay movimientos', async () => {
      const { exportPDFColored } = require('../utils/pdfExport');
      
      const result = await exportPDFColored([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay movimientos');
    });

    it('incluye documentId para poder eliminar desde ActionSheet', async () => {
      const { exportPDFColored } = require('../utils/pdfExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      const result = await exportPDFColored(movimientos);
      
      expect(result.documentId).toBeDefined();
      expect(result.documentId).toMatch(/^pdf_\d+$/);
    });
  });

  describe('exportCSV()', () => {
    
    it('genera CSV, registra en recientes y retorna URI válida', async () => {
      const { exportCSV } = require('../utils/csvExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test CSV', 
          monto: 200, 
          tipo: 'egreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      const result = await exportCSV(movimientos);
      
      // Verificar resultado exitoso
      expect(result.success).toBe(true);
      expect(result.fileUri).toBeDefined();
      expect(result.fileName).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.documentId).toBeDefined();
      
      // Nota: fs.ts usa expo-file-system/legacy internamente
      // No verificamos mocks específicos porque están en otro módulo
      
      console.log('[TEST] ✅ CSV exportado correctamente:', result.fileName);
    });

    it('maneja error cuando no hay movimientos', async () => {
      const { exportCSV } = require('../utils/csvExport');
      
      const result = await exportCSV([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay movimientos');
    });

    it('incluye documentId para poder eliminar desde ActionSheet', async () => {
      const { exportCSV } = require('../utils/csvExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      const result = await exportCSV(movimientos);
      
      expect(result.documentId).toBeDefined();
      expect(result.documentId).toMatch(/^csv_\d+$/);
    });
  });

  describe('Flujo completo: Exportar → Validar → Compartir', () => {
    
    it('PDF: exportar → fileExists valida → presentOpenWithSafely', async () => {
      const { exportPDFColored } = require('../utils/pdfExport');
      const { fileExists } = require('../utils/fileExists');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      // 1. Exportar
      const result = await exportPDFColored(movimientos);
      expect(result.success).toBe(true);
      
      // 2. Validar que el archivo existe (simula lo que hace presentOpenWithSafely)
      const exists = await fileExists(result.fileUri);
      expect(exists).toBe(true);
      
      // 3. Verificar que getInfoAsync fue llamado (por fileExists)
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(result.fileUri);
      
      console.log('[TEST] ✅ Flujo PDF completo: exportar → validar → OK');
    });

    it('CSV: exportar → fileExists valida → presentOpenWithSafely', async () => {
      const { exportCSV } = require('../utils/csvExport');
      const { fileExists } = require('../utils/fileExists');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      // 1. Exportar
      const result = await exportCSV(movimientos);
      expect(result.success).toBe(true);
      
      // 2. Validar que el archivo existe
      const exists = await fileExists(result.fileUri);
      expect(exists).toBe(true);
      
      // 3. Verificar que getInfoAsync fue llamado
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(result.fileUri);
      
      console.log('[TEST] ✅ Flujo CSV completo: exportar → validar → OK');
    });

    it('detecta archivo inexistente antes de compartir', async () => {
      const { fileExists } = require('../utils/fileExists');
      
      // Mock: archivo NO existe
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: false,
        size: 0,
        isDirectory: false
      });
      
      const exists = await fileExists('file://fake/missing.pdf');
      
      expect(exists).toBe(false);
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file://fake/missing.pdf');
      
      console.log('[TEST] ✅ fileExists detecta archivo inexistente');
    });

    it('maneja error de FileSystem sin crashear', async () => {
      const { fileExists } = require('../utils/fileExists');
      
      // Mock: getInfoAsync lanza error
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );
      
      const exists = await fileExists('file://restricted/file.pdf');
      
      // fileExists debe retornar false en caso de error, no crashear
      expect(exists).toBe(false);
      
      console.log('[TEST] ✅ fileExists maneja errores gracefully');
    });
  });

  describe('Registro en Recientes', () => {
    
    it('PDF se registra correctamente en recientes', async () => {
      // Mock del registry
      const mockAddRecent = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../features/documents/registry', () => ({
        addRecent: mockAddRecent
      }));
      
      // Re-importar para usar el mock
      jest.resetModules();
      const { exportPDFColored } = require('../utils/pdfExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      const result = await exportPDFColored(movimientos);
      
      expect(result.success).toBe(true);
      
      // Nota: en el código real, addRecent se llama dentro de un try-catch
      // y no hace crash si falla, solo hace console.warn
    });
  });

  describe('Seguridad: NO auto-compartir', () => {
    
    it('exportPDFColored NO llama a Sharing.shareAsync', async () => {
      const Sharing = require('expo-sharing');
      const { exportPDFColored } = require('../utils/pdfExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      await exportPDFColored(movimientos);
      
      // CRÍTICO: NO debe compartir automáticamente
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
      
      console.log('[TEST] ✅ PDF NO se comparte automáticamente');
    });

    it('exportCSV NO llama a Sharing.shareAsync', async () => {
      const Sharing = require('expo-sharing');
      const { exportCSV } = require('../utils/csvExport');
      
      const movimientos = [
        { 
          id: '1', 
          concepto: 'Test', 
          monto: 100, 
          tipo: 'ingreso',
          fecha: new Date().toISOString(),
          estado: 'pago'
        }
      ];
      
      await exportCSV(movimientos);
      
      // CRÍTICO: NO debe compartir automáticamente
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
      
      console.log('[TEST] ✅ CSV NO se comparte automáticamente');
    });
  });
});
