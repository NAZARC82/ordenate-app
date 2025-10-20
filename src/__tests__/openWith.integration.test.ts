// src/__tests__/openWith.integration.test.ts
/**
 * Tests de integración para la función openWith y presentOpenWithSafely
 * Verifica que se invoca correctamente expo-sharing con los parámetros adecuados
 */
import * as Sharing from 'expo-sharing';
import { openWith, presentOpenWithSafely } from '../utils/openWith';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => ({})),
}));

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

describe('openWith - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar implementaciones por defecto
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});
  });

  it('invoca shareAsync con mimeType para PDF', async () => {
    await openWith('file:///docs/reporte.pdf', 'application/pdf');

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///docs/reporte.pdf',
      expect.objectContaining({
        mimeType: 'application/pdf',
      })
    );
  });

  it('invoca shareAsync con mimeType para CSV', async () => {
    await openWith('file:///data/export.csv', 'text/csv');

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///data/export.csv',
      expect.objectContaining({
        mimeType: 'text/csv',
      })
    );
  });

  it('usa dialogTitle personalizado cuando se proporciona', async () => {
    // Simular plataforma Android
    jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({ OS: 'android' });
    
    await openWith('file:///test.pdf', 'application/pdf', {
      dialogTitle: 'Compartir Reporte'
    });

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///test.pdf',
      expect.objectContaining({
        dialogTitle: 'Compartir Reporte',
      })
    );
  });

  it('verifica disponibilidad antes de compartir', async () => {
    await openWith('file:///test.pdf', 'application/pdf');

    expect(Sharing.isAvailableAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('retorna false si sharing no está disponible', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    const result = await openWith('file:///test.pdf', 'application/pdf');

    expect(result).toBe(false);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('maneja errores de shareAsync correctamente', async () => {
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('User cancelled'));

    const result = await openWith('file:///test.pdf', 'application/pdf');

    expect(result).toBe(false);
  });

  it('retorna true cuando sharing es exitoso', async () => {
    const result = await openWith('file:///test.pdf', 'application/pdf');

    expect(result).toBe(true);
  });
});

describe('presentOpenWithSafely - Integration Tests', () => {
  it('exporta la función', () => {
    expect(typeof presentOpenWithSafely).toBe('function');
  });

  it('acepta los parámetros correctos con kind=pdf', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});
    
    // Nueva API usa 'kind' en lugar de 'mime'
    const result = await presentOpenWithSafely({
      uri: 'file:///test.pdf',
      kind: 'pdf',
    });

    expect(result).toBe(true);
  });

  it('acepta los parámetros correctos con kind=csv', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});
    
    const result = await presentOpenWithSafely({
      uri: 'file:///data.csv',
      kind: 'csv',
    });

    expect(result).toBe(true);
  });

  it('usa kind=pdf por defecto si no se especifica', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});
    
    const result = await presentOpenWithSafely({
      uri: 'file:///test.pdf',
    });

    expect(result).toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///test.pdf',
      expect.objectContaining({
        mimeType: 'application/pdf', // Default es PDF
      })
    );
  });
});

