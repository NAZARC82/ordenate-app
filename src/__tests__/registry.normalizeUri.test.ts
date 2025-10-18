/**
 * registry.normalizeUri.test.ts
 * 
 * Verifica que registry.ts normaliza URIs correctamente
 * Todos los URIs deben incluir file:// prefix para evitar errores en FileSystem
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { addRecent, getRecents, purgeMissing } from '../features/documents/registry';
import type { RecentDoc } from '../features/documents/registry';

// Mock de módulos
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024, isDirectory: false })),
  File: jest.fn().mockImplementation((uri) => ({
    uri,
    getInfo: jest.fn(() => Promise.resolve({ 
      exists: true, 
      size: 1024, 
      modificationTime: Date.now(), 
      uri, 
      isDirectory: false 
    })),
  })),
}));

describe('Registry - URI Normalization', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('normalizeUri() - Indirect Testing via addRecent()', () => {
    it('debe agregar file:// prefix a URIs sin prefijo', async () => {
      const docWithoutPrefix: Omit<RecentDoc, 'ts'> = {
        id: 'test-1',
        name: 'test.pdf',
        uri: '/data/user/0/test.pdf', // SIN file://
        kind: 'pdf'
      };

      await addRecent(docWithoutPrefix);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);

      const savedData = JSON.parse(setItemCalls[0][1] as string);
      const savedDoc = savedData[0];

      // Debe tener file:// prefix
      expect(savedDoc.uri).toMatch(/^file:\/\//);
      // Debe contener la ruta
      expect(savedDoc.uri).toContain('data/user/0/test.pdf');
    });

    it('NO debe duplicar file:// si ya existe', async () => {
      const docWithPrefix: Omit<RecentDoc, 'ts'> = {
        id: 'test-2',
        name: 'test.csv',
        uri: 'file:///data/user/0/test.csv', // YA tiene file://
        kind: 'csv'
      };

      await addRecent(docWithPrefix);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);
      const savedDoc = savedData[0];

      // NO debe duplicar
      expect(savedDoc.uri).toBe('file:///data/user/0/test.csv');
      expect(savedDoc.uri).not.toContain('file://file://');
    });

    it('debe manejar URIs vacías correctamente', async () => {
      const docWithEmptyUri: Omit<RecentDoc, 'ts'> = {
        id: 'test-3',
        name: 'test.pdf',
        uri: '', // URI vacía
        kind: 'pdf'
      };

      await addRecent(docWithEmptyUri);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);
      const savedDoc = savedData[0];

      // Debe guardar vacía sin agregar file://
      expect(savedDoc.uri).toBe('');
    });

    it('debe limpiar slashes extras al normalizar', async () => {
      const docWithExtraSlashes: Omit<RecentDoc, 'ts'> = {
        id: 'test-4',
        name: 'test.pdf',
        uri: '///data/user/0/test.pdf', // Múltiples slashes
        kind: 'pdf'
      };

      await addRecent(docWithExtraSlashes);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);
      const savedDoc = savedData[0];

      // Debe limpiar y agregar file://
      expect(savedDoc.uri).toMatch(/^file:\/\//);
      expect(savedDoc.uri).toContain('data/user/0/test.pdf');
      expect(savedDoc.uri).not.toMatch(/file:\/\/\/\/+/); // No múltiples slashes tras file://
    });
  });

  describe('addRecent() - URI Normalization Integration', () => {
    it('debe normalizar URI antes de guardar', async () => {
      const doc: Omit<RecentDoc, 'ts'> = {
        id: 'int-1',
        name: 'integration.pdf',
        uri: '/path/to/file.pdf',
        kind: 'pdf'
      };

      await addRecent(doc);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      expect(setItemCalls.length).toBe(1);

      const savedData = JSON.parse(setItemCalls[0][1] as string);
      expect(savedData[0].uri).toMatch(/^file:\/\//);
    });

    it('debe mantener consistencia con múltiples docs', async () => {
      const docs: Omit<RecentDoc, 'ts'>[] = [
        { id: 'multi-1', name: 'a.pdf', uri: '/path/a.pdf', kind: 'pdf' },
        { id: 'multi-2', name: 'b.csv', uri: 'file:///path/b.csv', kind: 'csv' },
        { id: 'multi-3', name: 'c.pdf', uri: '//path/c.pdf', kind: 'pdf' }
      ];

      for (const doc of docs) {
        mockAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(await getRecents())
        );
        await addRecent(doc);
      }

      const lastCall = mockAsyncStorage.setItem.mock.calls[mockAsyncStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1] as string);

      // Todos deben tener file:// prefix
      savedData.forEach((doc: RecentDoc) => {
        expect(doc.uri).toMatch(/^file:\/\//);
      });
    });
  });

  describe('purgeMissing() - URI Normalization', () => {
    it('debe normalizar URIs antes de verificar con FileSystem', async () => {
      const docsWithMixedUris: RecentDoc[] = [
        {
          id: 'purge-1',
          name: 'exists.pdf',
          uri: '/path/exists.pdf', // SIN file://
          kind: 'pdf',
          ts: Date.now()
        },
        {
          id: 'purge-2',
          name: 'also-exists.csv',
          uri: 'file:///path/also-exists.csv', // CON file://
          kind: 'csv',
          ts: Date.now()
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(docsWithMixedUris));
      
      // Mock FileSystem.getInfoAsync para simular que ambos archivos existen
      const mockGetInfoAsync = jest.fn((uri: string) => {
        // Debe recibir URIs normalizadas con file://
        expect(uri).toMatch(/^file:\/\//);
        return Promise.resolve({ exists: true, size: 1024, isDirectory: false, uri });
      });
      
      (FileSystem.getInfoAsync as jest.Mock) = mockGetInfoAsync;

      const result = await purgeMissing();

      // Ambos documentos deben sobrevivir (existen)
      expect(result).toHaveLength(2);

      // Todos los URIs guardados deben tener file://
      result.forEach(doc => {
        expect(doc.uri).toMatch(/^file:\/\//);
      });

      // Verificar que FileSystem.getInfoAsync fue llamado con URIs normalizadas
      const getInfoCalls = mockGetInfoAsync.mock.calls;
      expect(getInfoCalls.length).toBeGreaterThanOrEqual(2);
      getInfoCalls.forEach(call => {
        expect(call[0]).toMatch(/^file:\/\//);
      });
    });

    it('debe purgar archivos que no existen', async () => {
      const docs: RecentDoc[] = [
        {
          id: 'purge-3',
          name: 'exists.pdf',
          uri: '/path/exists.pdf',
          kind: 'pdf',
          ts: Date.now()
        },
        {
          id: 'purge-4',
          name: 'missing.csv',
          uri: '/path/missing.csv',
          kind: 'csv',
          ts: Date.now()
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(docs));

      // Mock FileSystem.getInfoAsync: solo el primero existe
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (uri: string) => {
        const exists = uri.includes('exists.pdf');
        return { exists, size: exists ? 1024 : 0, isDirectory: false, uri };
      });

      const result = await purgeMissing();

      // Solo debe quedar el que existe
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('exists.pdf');
      expect(result[0].uri).toMatch(/^file:\/\//);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar URIs con espacios', async () => {
      const doc: Omit<RecentDoc, 'ts'> = {
        id: 'edge-1',
        name: 'file with spaces.pdf',
        uri: '/path/file with spaces.pdf',
        kind: 'pdf'
      };

      await addRecent(doc);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);

      expect(savedData[0].uri).toMatch(/^file:\/\//);
      expect(savedData[0].uri).toContain('path/file with spaces.pdf');
    });

    it('debe manejar URIs con caracteres especiales', async () => {
      const doc: Omit<RecentDoc, 'ts'> = {
        id: 'edge-2',
        name: 'file-special_chars.pdf',
        uri: '/path/special-chars_123.pdf',
        kind: 'pdf'
      };

      await addRecent(doc);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);

      expect(savedData[0].uri).toMatch(/^file:\/\//);
      expect(savedData[0].uri).toContain('special-chars_123');
    });

    it('debe prevenir errores de FileSystem con URIs malformadas', async () => {
      // Caso real: expo-file-system falla si URI no tiene file://
      const doc: Omit<RecentDoc, 'ts'> = {
        id: 'edge-3',
        name: 'malformed.pdf',
        uri: 'data/user/0/malformed.pdf', // Falta / inicial
        kind: 'pdf'
      };

      await addRecent(doc);

      const setItemCalls = mockAsyncStorage.setItem.mock.calls;
      const savedData = JSON.parse(setItemCalls[0][1] as string);

      // Debe quedar bien formada
      expect(savedData[0].uri).toMatch(/^file:\/\//);
    });
  });

  describe('Logging Verification', () => {
    it('debe loggear cuando registra documento con URI normalizada', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const doc: Omit<RecentDoc, 'ts'> = {
        id: 'log-1',
        name: 'logged.pdf',
        uri: '/path/logged.pdf',
        kind: 'pdf'
      };

      await addRecent(doc);

      // Debe loggear con [Registry] prefix
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Registry\] Registrando documento:/),
        expect.objectContaining({
          name: 'logged.pdf',
          uri: expect.stringMatching(/^file:\/\//)
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
