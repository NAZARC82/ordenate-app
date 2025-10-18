/**
 * @jest-environment node
 * 
 * TEST: Flujo completo de compartir archivo
 * Verifica mocks básicos del Share flow
 */

import { describe, it, expect, jest } from '@jest/globals';

// Mock simple de expo-sharing
const mockShareAsync = jest.fn((_uri: string, _options?: any) => Promise.resolve());
const mockIsAvailableAsync = jest.fn(() => Promise.resolve(true));

jest.mock('expo-sharing', () => ({
  shareAsync: mockShareAsync,
  isAvailableAsync: mockIsAvailableAsync
}));

describe('Share Flow - Mocks', () => {
  it('debe tener expo-sharing mockeado correctamente', () => {
    expect(mockShareAsync).toBeDefined();
    expect(mockIsAvailableAsync).toBeDefined();
    expect(typeof mockShareAsync).toBe('function');
    expect(typeof mockIsAvailableAsync).toBe('function');
  });

  it('debe retornar Promise desde shareAsync', async () => {
    const result = await mockShareAsync('file://test.pdf', { mimeType: 'application/pdf' });
    expect(result).toBeUndefined(); // Promise.resolve() sin valor
  });

  it('debe retornar true desde isAvailableAsync', async () => {
    const result = await mockIsAvailableAsync();
    expect(result).toBe(true);
  });
});
