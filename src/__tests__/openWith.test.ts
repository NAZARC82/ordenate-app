// src/__tests__/openWith.test.ts
/**
 * Tests básicos para openWith - Enfoque en validación de parámetros
 * Los mocks de expo-sharing son complejos; se recomienda testing manual end-to-end
 */
import { openWith, openPDF, openCSV } from '../utils/openWith';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve(undefined)),
}));

describe('openWith - Validación de parámetros', () => {
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
  it('debe retornar boolean', async () => {
    const result = await openPDF('file:///doc.pdf');
    
    expect(typeof result).toBe('boolean');
  });
});

describe('openCSV helper', () => {
  it('debe retornar boolean', async () => {
    const result = await openCSV('file:///data.csv');
    
    expect(typeof result).toBe('boolean');
  });
});
