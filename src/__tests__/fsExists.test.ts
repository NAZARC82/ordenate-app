// src/__tests__/fsExists.test.ts
/**
 * Tests para fileExists() - Legacy API para SDK 54
 */
import { fileExists } from '../utils/fsExists';
import * as FS from 'expo-file-system/legacy';

// Mock de expo-file-system viene de __mocks__/expo-file-system.js
jest.mock('expo-file-system/legacy');

describe('fileExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Legacy API (getInfoAsync)', () => {
    it('debe retornar true cuando archivo existe', async () => {
      // Mock getInfoAsync desde legacy
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        isDirectory: false,
        size: 1024,
      });

      const result = await fileExists('file://test.pdf');

      expect(result).toBe(true);
      expect(FS.getInfoAsync).toHaveBeenCalledWith('file://test.pdf');
    });

    it('debe retornar false cuando archivo no existe', async () => {
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
        isDirectory: false,
      });

      const result = await fileExists('file://missing.pdf');

      expect(result).toBe(false);
    });

    it('debe retornar false si es directorio', async () => {
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        isDirectory: true, // Es carpeta, no archivo
      });

      const result = await fileExists('file://folder');

      expect(result).toBe(false);
    });

    it('debe manejar errores sin explotar', async () => {
      (FS.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await fileExists('file://protected.pdf');

      expect(result).toBe(false);
    });

    it('debe retornar false para URIs inválidas', async () => {
      const invalidUris = [
        '',
        null as any,
        undefined as any,
        123 as any,
        {} as any,
      ];

      for (const uri of invalidUris) {
        const result = await fileExists(uri);
        expect(result).toBe(false);
      }

      // getInfoAsync no debe ser llamado
      expect(FS.getInfoAsync).not.toHaveBeenCalled();
    });

    it('debe funcionar con URIs de diferentes formatos', async () => {
      (FS.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        isDirectory: false,
      });

      await fileExists('file:///path/to/file.pdf');
      await fileExists('file://storage/exports/doc.csv');
      await fileExists('content://media/documents/123');

      expect(FS.getInfoAsync).toHaveBeenCalledTimes(3);
    });
  });
});
