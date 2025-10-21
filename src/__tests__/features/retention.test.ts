/**
 * Tests para retention - Retención automática de archivos
 */
import {
  listExportFiles,
  purgeOlderThan,
  cleanOrphanRecents,
  shouldRunRetention,
  markRetentionRun,
} from '../../features/documents/retention';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as registry from '../../features/documents/registry';

jest.mock('expo-file-system/legacy');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../features/documents/registry');

describe('Retention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.documentDirectory as any) = 'file://mock/';
  });

  describe('listExportFiles', () => {
    it('debe listar archivos en /exports/', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        isDirectory: true,
      });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'test.pdf',
        'data.csv',
      ]);

      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
        if (uri.includes('exports')) {
          return Promise.resolve({ exists: true, isDirectory: true });
        }
        return Promise.resolve({
          exists: true,
          isDirectory: false,
          modificationTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 días atrás
          size: 1024,
        });
      });

      const files = await listExportFiles();

      expect(files.length).toBe(2);
      expect(files[0].name).toBe('test.pdf');
      expect(files[0].uri).toMatch(/^file:\/\//);
      expect(files[0].mtime).toBeGreaterThan(0);
      expect(files[0].size).toBe(1024);
    });

    it('debe retornar array vacío si directorio no existe', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const files = await listExportFiles();

      expect(files).toEqual([]);
    });

    it('debe ignorar directorios', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        isDirectory: true,
      });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'file.pdf',
        'subfolder',
      ]);

      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
        if (uri.endsWith('subfolder')) {
          return Promise.resolve({ exists: true, isDirectory: true });
        }
        return Promise.resolve({
          exists: true,
          isDirectory: false,
          modificationTime: Date.now(),
          size: 512,
        });
      });

      const files = await listExportFiles();

      expect(files.length).toBe(1);
      expect(files[0].name).toBe('file.pdf');
    });
  });

  describe('purgeOlderThan', () => {
    it('debe borrar archivos >30 días', async () => {
      const now = Date.now();
      const old = now - 35 * 24 * 60 * 60 * 1000; // 35 días
      const recent = now - 10 * 24 * 60 * 60 * 1000; // 10 días

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, isDirectory: true }) // directorio exports
        .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: old, size: 1024 })
        .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: recent, size: 512 });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'old_file.pdf',
        'recent_file.pdf',
      ]);

      const { removed } = await purgeOlderThan(30);

      expect(removed).toBe(1);
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
      expect(registry.deleteRecent).toHaveBeenCalledTimes(1);
    });

    it('no debe borrar archivos recientes', async () => {
      const recent = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 días

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, isDirectory: true })
        .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: recent, size: 1024 });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['recent.pdf']);

      const { removed } = await purgeOlderThan(30);

      expect(removed).toBe(0);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('debe manejar errores al borrar archivos individuales', async () => {
      const old = Date.now() - 35 * 24 * 60 * 60 * 1000;

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, isDirectory: true })
        .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: old, size: 1024 })
        .mockResolvedValueOnce({ exists: true, isDirectory: false, modificationTime: old, size: 512 });

      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['file1.pdf', 'file2.pdf']);

      (FileSystem.deleteAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(undefined);

      const { removed } = await purgeOlderThan(30);

      // Solo se borra el segundo (el primero falló)
      expect(removed).toBe(1);
    });
  });

  describe('cleanOrphanRecents', () => {
    it('debe limpiar recientes sin archivo físico', async () => {
      (registry.getRecents as jest.Mock).mockResolvedValue([
        { fileUri: 'file://existing.pdf', ts: Date.now() },
        { fileUri: 'file://missing.pdf', ts: Date.now() },
      ]);

      (FileSystem.getInfoAsync as jest.Mock).mockImplementation((uri: string) => {
        if (uri.includes('missing')) {
          return Promise.resolve({ exists: false });
        }
        return Promise.resolve({ exists: true, isDirectory: false });
      });

      const { cleaned } = await cleanOrphanRecents();

      expect(cleaned).toBe(1);
      expect(registry.deleteRecent).toHaveBeenCalledWith('file://missing.pdf');
    });

    it('no debe limpiar recientes con archivo existente', async () => {
      (registry.getRecents as jest.Mock).mockResolvedValue([
        { fileUri: 'file://existing.pdf', ts: Date.now() },
      ]);

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        isDirectory: false,
      });

      const { cleaned } = await cleanOrphanRecents();

      expect(cleaned).toBe(0);
      expect(registry.deleteRecent).not.toHaveBeenCalled();
    });
  });

  describe('shouldRunRetention', () => {
    it('debe retornar true si nunca se ejecutó', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const should = await shouldRunRetention();

      expect(should).toBe(true);
    });

    it('debe retornar true si pasaron >7 días', async () => {
      const weekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(weekAgo.toString());

      const should = await shouldRunRetention();

      expect(should).toBe(true);
    });

    it('debe retornar false si fue reciente', async () => {
      const yesterday = Date.now() - 1 * 24 * 60 * 60 * 1000;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(yesterday.toString());

      const should = await shouldRunRetention();

      expect(should).toBe(false);
    });
  });

  describe('markRetentionRun', () => {
    it('debe guardar timestamp actual', async () => {
      await markRetentionRun();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@ordenate:last_retention_check',
        expect.any(String)
      );

      const saved = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const timestamp = parseInt(saved, 10);
      expect(timestamp).toBeGreaterThan(Date.now() - 1000);
    });
  });
});
