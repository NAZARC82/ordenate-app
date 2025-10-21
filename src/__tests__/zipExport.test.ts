/**
 * Tests para zipExport - Generación de archivos ZIP
 */
import { createZip } from '../utils/zipExport';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy');

describe('zipExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock FileSystem por defecto
    (FileSystem.documentDirectory as any) = 'file://mock/';
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 1024,
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('dGVzdCBjb250ZW50'); // "test content" en base64
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createZip', () => {
    it('debe crear ZIP con múltiples archivos', async () => {
      const result = await createZip({
        files: [
          { uri: 'file:///exports/test.pdf', name: 'test.pdf' },
          { uri: 'file:///exports/data.csv', name: 'data.csv' },
        ],
        outName: 'export_2025-10-20.zip',
      });

      expect(result.uri).toContain('export_2025-10-20.zip');
      expect(result.uri).toMatch(/^file:\/\//);
      expect(result.size).toBeGreaterThanOrEqual(0);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('exports/export_2025-10-20.zip'),
        expect.any(String),
        expect.objectContaining({
          encoding: FileSystem.EncodingType.Base64,
        })
      );
    });

    it('debe lanzar error si files está vacío', async () => {
      await expect(
        createZip({
          files: [],
          outName: 'empty.zip',
        })
      ).rejects.toThrow('files array is empty');
    });

    it('debe lanzar error si archivo no existe', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: false,
      });

      await expect(
        createZip({
          files: [{ uri: 'file:///missing.pdf', name: 'missing.pdf' }],
          outName: 'test.zip',
        })
      ).rejects.toThrow('file not found');
    });

    it('debe leer archivos en Base64', async () => {
      await createZip({
        files: [{ uri: 'file:///test.pdf', name: 'test.pdf' }],
        outName: 'test.zip',
      });

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file:///test.pdf',
        expect.objectContaining({
          encoding: FileSystem.EncodingType.Base64,
        })
      );
    });

    it('debe normalizar URI con file:// prefix', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
        if (uri.includes('export_normalized.zip')) {
          return Promise.resolve({
            exists: true,
            isDirectory: false,
            size: 2048,
          });
        }
        return Promise.resolve({
          exists: true,
          isDirectory: false,
        });
      });

      const result = await createZip({
        files: [{ uri: 'file:///test.pdf', name: 'test.pdf' }],
        outName: 'export_normalized.zip',
      });

      expect(result.uri).toMatch(/^file:\/\//);
    });

    it('debe escribir en /exports/', async () => {
      await createZip({
        files: [{ uri: 'file:///test.pdf', name: 'test.pdf' }],
        outName: 'archive.zip',
      });

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('exports/archive.zip'),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('ZIP format (store method)', () => {
    it('debe generar ZIP válido con signature correcta', async () => {
      let capturedBase64 = '';

      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(
        (uri: string, content: string) => {
          capturedBase64 = content;
          return Promise.resolve();
        }
      );

      await createZip({
        files: [{ uri: 'file:///test.pdf', name: 'test.pdf' }],
        outName: 'valid.zip',
      });

      expect(capturedBase64).toBeTruthy();
      expect(capturedBase64.length).toBeGreaterThan(0);

      // ZIP debe empezar con PK signature (0x04034b50)
      const bytes = Buffer.from(capturedBase64, 'base64');
      expect(bytes[0]).toBe(0x50); // 'P'
      expect(bytes[1]).toBe(0x4b); // 'K'
      expect(bytes[2]).toBe(0x03);
      expect(bytes[3]).toBe(0x04);
    });
  });
});
