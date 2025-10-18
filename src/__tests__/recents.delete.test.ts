// src/__tests__/recents.delete.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { getRecents, addRecent, deleteRecent, purgeMissing } from '../features/documents/registry';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// FileSystem mock viene de __mocks__/expo-file-system.js automáticamente
jest.mock('expo-file-system');

describe('deleteRecent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('elimina un documento de recientes por id', async () => {
    // Agregar documentos
    await addRecent({ id: '1', kind: 'pdf', name: 'a.pdf', uri: 'file:///x/a.pdf' });
    await addRecent({ id: '2', kind: 'csv', name: 'b.csv', uri: 'file:///x/b.csv' });
    await addRecent({ id: '3', kind: 'pdf', name: 'c.pdf', uri: 'file:///x/c.pdf' });

    // Mock para que getRecents retorne los 3 documentos
    const mockDocs = [
      { id: '3', kind: 'pdf', name: 'c.pdf', uri: 'file:///x/c.pdf', ts: Date.now() },
      { id: '2', kind: 'csv', name: 'b.csv', uri: 'file:///x/b.csv', ts: Date.now() - 1000 },
      { id: '1', kind: 'pdf', name: 'a.pdf', uri: 'file:///x/a.pdf', ts: Date.now() - 2000 },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

    // Eliminar el documento con id '2'
    const result = await deleteRecent('2');

    // Verificar que se eliminó correctamente
    expect(result.length).toBe(2);
    expect(result.find(x => x.id === '2')).toBeUndefined();
    expect(result.find(x => x.id === '1')).toBeDefined();
    expect(result.find(x => x.id === '3')).toBeDefined();

    // Verificar que se guardó en AsyncStorage
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'documents:recent',
      expect.stringContaining('"id":"1"')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'documents:recent',
      expect.stringContaining('"id":"3"')
    );
  });

  it('retorna lista vacía si el id no existe', async () => {
    const mockDocs = [
      { id: '1', kind: 'pdf', name: 'a.pdf', uri: 'file:///x/a.pdf', ts: Date.now() },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

    const result = await deleteRecent('999');

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('maneja lista vacía sin errores', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

    const result = await deleteRecent('1');

    expect(result).toEqual([]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('documents:recent', '[]');
  });
});

describe('purgeMissing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('elimina documentos cuyos archivos no existen', async () => {
    const mockDocs = [
      { id: '1', kind: 'pdf', name: 'existe.pdf', uri: 'file:///x/existe.pdf', ts: Date.now() },
      { id: '2', kind: 'csv', name: 'no-existe.csv', uri: 'file:///x/no-existe.csv', ts: Date.now() - 1000 },
      { id: '3', kind: 'pdf', name: 'existe2.pdf', uri: 'file:///x/existe2.pdf', ts: Date.now() - 2000 },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

    // Mock FileSystem.getInfoAsync para simular que el segundo archivo no existe
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (uri: string) => {
      if (uri.includes('no-existe')) {
        return { exists: false, size: 0, modificationTime: 0, uri, isDirectory: false };
      }
      return { exists: true, size: 100, modificationTime: Date.now(), uri, isDirectory: false };
    });

    const result = await purgeMissing();

    expect(result.length).toBe(2);
    expect(result.find(x => x.id === '1')).toBeDefined();
    expect(result.find(x => x.id === '2')).toBeUndefined(); // Eliminado
    expect(result.find(x => x.id === '3')).toBeDefined();
  });

  it('mantiene todos los documentos si todos existen', async () => {
    const mockDocs = [
      { id: '1', kind: 'pdf', name: 'a.pdf', uri: 'file:///x/a.pdf', ts: Date.now() },
      { id: '2', kind: 'csv', name: 'b.csv', uri: 'file:///x/b.csv', ts: Date.now() },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));
    
    // Mock FileSystem.getInfoAsync - todos existen
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ 
      exists: true, 
      size: 100, 
      modificationTime: Date.now(),
      uri: 'file:///x/mock.pdf',
      isDirectory: false 
    });

    const result = await purgeMissing();

    expect(result.length).toBe(2);
  });

  it('maneja errores de FileSystem sin crashear', async () => {
    const mockDocs = [
      { id: '1', kind: 'pdf', name: 'a.pdf', uri: 'file:///x/a.pdf', ts: Date.now() },
      { id: '2', kind: 'csv', name: 'b.csv', uri: 'file:///x/b.csv', ts: Date.now() },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));
    
    // Simular error en FileSystem.getInfoAsync()
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('Permission denied'));

    const result = await purgeMissing();

    // Todos eliminados porque getInfoAsync() falló
    expect(result.length).toBe(0);
  });

  it('retorna lista vacía si no hay recientes', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

    const result = await purgeMissing();

    expect(result).toEqual([]);
  });
});
