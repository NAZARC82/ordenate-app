// src/__tests__/fsExists.test.ts
/**
 * Tests para fileExists() - Nueva File API SDK 54 + fallback legacy
 */
import { fileExists } from '../utils/fsExists';
import * as FS from 'expo-file-system';

// Mock de expo-file-system viene de __mocks__/expo-file-system.js
jest.mock('expo-file-system');

describe('fileExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File API (SDK 54+)', () => {
    it('debe usar File class cuando disponible', async () => {
      // Mock File API
      const mockFile = {
        uri: 'file://test.pdf',
        exists: true,
      };

      (FS as any).File = jest.fn().mockImplementation(() => mockFile);

      const result = await fileExists('file://test.pdf');

      expect(result).toBe(true);
      expect((FS as any).File).toHaveBeenCalledWith('file://test.pdf');
    });

    it('debe leer propiedad exists (NO método)', async () => {
      // exists es PROPIEDAD, no método
      const mockFile = {
        uri: 'file://doc.pdf',
        exists: false, // Propiedad directa
      };

      (FS as any).File = jest.fn().mockImplementation(() => mockFile);

      const result = await fileExists('file://doc.pdf');

      expect(result).toBe(false);
    });

    it('debe manejar archivos que no existen', async () => {
      const mockFile = {
        uri: 'file://missing.pdf',
        exists: false,
      };

      (FS as any).File = jest.fn().mockImplementation(() => mockFile);

      const result = await fileExists('file://missing.pdf');

      expect(result).toBe(false);
    });
  });

  describe('Fallback a getInfoAsync (legacy)', () => {
    it('debe usar getInfoAsync cuando File API no disponible', async () => {
      // Simular que File API no existe
      (FS as any).File = undefined;

      // Mock getInfoAsync desde legacy
      const mockGetInfoAsync = jest.fn().mockResolvedValue({
        exists: true,
        isDirectory: false,
        size: 1024,
      });

      jest.doMock('expo-file-system/legacy', () => ({
        getInfoAsync: mockGetInfoAsync,
      }));

      const result = await fileExists('file://test.pdf');

      expect(result).toBe(true);
    });

    it('debe retornar false si archivo es directorio', async () => {
      (FS as any).File = undefined;

      const mockGetInfoAsync = jest.fn().mockResolvedValue({
        exists: true,
        isDirectory: true, // Es carpeta, no archivo
      });

      jest.doMock('expo-file-system/legacy', () => ({
        getInfoAsync: mockGetInfoAsync,
      }));

      const result = await fileExists('file://folder/');

      expect(result).toBe(false);
    });

    it('debe retornar false si archivo no existe', async () => {
      (FS as any).File = undefined;

      const mockGetInfoAsync = jest.fn().mockResolvedValue({
        exists: false,
      });

      jest.doMock('expo-file-system/legacy', () => ({
        getInfoAsync: mockGetInfoAsync,
      }));

      const result = await fileExists('file://missing.pdf');

      expect(result).toBe(false);
    });
  });

  describe('Casos edge', () => {
    it('debe manejar errores de File API', async () => {
      (FS as any).File = jest.fn().mockImplementation(() => {
        throw new Error('File API error');
      });

      // Debería hacer fallback a getInfoAsync
      const result = await fileExists('file://test.pdf');

      // En el código real, hace fallback
      expect(typeof result).toBe('boolean');
    });

    it('debe manejar URIs vacías', async () => {
      const mockFile = {
        uri: '',
        exists: false,
      };

      (FS as any).File = jest.fn().mockImplementation(() => mockFile);

      const result = await fileExists('');

      expect(result).toBe(false);
    });

    it('debe manejar URIs con diferentes esquemas', async () => {
      const mockFile = {
        uri: 'content://provider/file.pdf',
        exists: true,
      };

      (FS as any).File = jest.fn().mockImplementation(() => mockFile);

      const result = await fileExists('content://provider/file.pdf');

      expect(result).toBe(true);
    });
  });
});
