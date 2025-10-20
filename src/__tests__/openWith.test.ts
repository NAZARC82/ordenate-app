// src/__tests__/openWith.test.ts
/**
 * Tests para openWith - Fallbacks y validación de parámetros
 * Incluye tests para WebBrowser fallback cuando Sharing no disponible
 */
import { openWith, openPDF, openCSV, presentOpenWithSafely } from '../utils/openWith';

const mockShareAsync = jest.fn(() => Promise.resolve(undefined));
const mockIsAvailableAsync = jest.fn(() => Promise.resolve(true));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: mockIsAvailableAsync,
  shareAsync: mockShareAsync,
}));

const mockOpenBrowserAsync = jest.fn(() => Promise.resolve({ type: 'dismiss' }));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: mockOpenBrowserAsync,
}));

jest.mock('../utils/fsExists', () => ({
  fileExists: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('mock,csv,content')),
}));

describe('openWith - Validación de parámetros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it('debe validar que URI es string no vacío', async () => {
    const result1 = await openWith('', 'application/pdf');
    const result2 = await openWith('   ', 'application/pdf');
    
    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });

  it('debe validar que mimeType es string no vacío', async () => {
    const result1 = await openWith('file:///test.pdf', '');
    
    expect(result1).toBe(false);
  });

  it('debe retornar boolean', async () => {
    const result = await openWith('file:///test.pdf', 'application/pdf');
    
    expect(typeof result).toBe('boolean');
  });
});

describe('openPDF helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it('debe retornar boolean', async () => {
    const result = await openPDF('file:///doc.pdf');
    
    expect(typeof result).toBe('boolean');
  });

  it('debe usar MIME type application/pdf', async () => {
    await openPDF('file:///doc.pdf');
    
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///doc.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
  });
});

describe('openCSV helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it('debe retornar boolean', async () => {
    const result = await openCSV('file:///data.csv');
    
    expect(typeof result).toBe('boolean');
  });

  it('debe usar MIME type text/csv', async () => {
    await openCSV('file:///data.csv');
    
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///data.csv',
      expect.objectContaining({ mimeType: 'text/csv' })
    );
  });
});

describe('openWith - Fallback a WebBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe usar WebBrowser cuando Sharing no disponible para PDF', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    
    const result = await openWith('file:///doc.pdf', 'application/pdf');
    
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
      'file:///doc.pdf',
      expect.objectContaining({
        controlsColor: '#3E7D75',
        toolbarColor: '#FCFCF8',
      })
    );
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('debe mostrar Alert preview cuando Sharing no disponible para CSV', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    
    // Mock Alert
    const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
    
    const result = await openCSV('file:///data.csv');
    
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
    expect(result).toBe(true);
    
    alertSpy.mockRestore();
  });

  it('debe usar Share Sheet cuando Sharing disponible', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    
    await openWith('file:///doc.pdf', 'application/pdf');
    
    expect(mockShareAsync).toHaveBeenCalled();
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
  });
});

describe('presentOpenWithSafely - Nueva API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it('debe aceptar kind="pdf" o kind="csv"', async () => {
    const { fileExists } = require('../utils/fsExists');
    (fileExists as jest.Mock).mockResolvedValue(true);
    
    await presentOpenWithSafely({ uri: 'file:///doc.pdf', kind: 'pdf' });
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///doc.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
    
    jest.clearAllMocks();
    
    await presentOpenWithSafely({ uri: 'file:///data.csv', kind: 'csv' });
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///data.csv',
      expect.objectContaining({ mimeType: 'text/csv' })
    );
  });

  it('debe validar fileExists() antes de compartir', async () => {
    const { fileExists } = require('../utils/fsExists');
    (fileExists as jest.Mock).mockResolvedValue(false);
    
    const result = await presentOpenWithSafely({ uri: 'file:///missing.pdf', kind: 'pdf' });
    
    expect(fileExists).toHaveBeenCalledWith('file:///missing.pdf');
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('debe llamar closeModal si se proporciona', async () => {
    const { fileExists } = require('../utils/fsExists');
    (fileExists as jest.Mock).mockResolvedValue(true);
    
    const closeModal = jest.fn();
    
    await presentOpenWithSafely({ 
      uri: 'file:///doc.pdf', 
      kind: 'pdf',
      closeModal 
    });
    
    expect(closeModal).toHaveBeenCalled();
  });
});
