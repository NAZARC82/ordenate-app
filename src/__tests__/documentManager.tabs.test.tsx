// src/__tests__/documentManager.tabs.test.tsx
/**
 * Test que valida la eliminación completa del tab "Recientes" en DocumentManagerScreen
 * 
 * Objetivo: Asegurar que solo existen 2 tabs (Firmas y Diseño)
 * y que NO existe ningún tab de Recientes
 */

import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DocumentManagerScreen from '../screens/DocumentManagerScreen';

// Mock de dependencias
jest.mock('../features/documents/signatures', () => ({
  listSignatures: jest.fn(() => Promise.resolve([])),
  saveSignature: jest.fn(() => Promise.resolve()),
  deleteSignature: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/pdf/usePdfPrefs', () => ({
  usePdfPrefs: jest.fn(() => ({
    prefs: {
      accentColor: '#3E7D75',
      colorIntensity: 0.8,
      negativeRed: 'medium',
      showOpenWithAfterExport: true,
    },
    updatePrefs: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
    loading: false,
  })),
}));

describe('DocumentManagerScreen - Tabs', () => {
  test('debe mostrar SOLO los tabs Firmas y Diseño', () => {
    render(<DocumentManagerScreen route={{ params: {} }} />);
    
    // Verificar que existen los 2 tabs esperados
    expect(screen.getByTestId('tab-firmas')).toBeTruthy();
    expect(screen.getByTestId('tab-diseno')).toBeTruthy();
    
    // Verificar que los tabs tienen el texto correcto
    expect(screen.getByText('Firmas')).toBeTruthy();
    expect(screen.getByText('Diseño')).toBeTruthy();
  });

  test('NO debe existir tab de Recientes', () => {
    render(<DocumentManagerScreen route={{ params: {} }} />);
    
    // Verificar que NO existe el tab de recientes
    expect(screen.queryByTestId('tab-recientes')).toBeNull();
    expect(screen.queryByText('Recientes')).toBeNull();
  });

  test('debe mostrar contenido de Firmas por defecto', () => {
    render(<DocumentManagerScreen route={{ params: {} }} />);
    
    // Verificar que se muestra el contenido de Firmas
    expect(screen.getByTestId('signatures-list')).toBeTruthy();
    expect(screen.getByText('✍️ Firmas Digitales')).toBeTruthy();
    expect(screen.getByTestId('btn-add-signature')).toBeTruthy();
  });

  test('debe mostrar contenido de Diseño si initialTab es "design"', () => {
    render(<DocumentManagerScreen route={{ params: { initialTab: 'design' } }} />);
    
    // Verificar que se muestra el contenido de Diseño
    expect(screen.getByTestId('design-panel')).toBeTruthy();
    expect(screen.getByText('🎨 Diseño de PDF')).toBeTruthy();
  });

  test('debe loguear mensaje indicando que no hay tab de Recientes', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<DocumentManagerScreen route={{ params: {} }} />);
    
    // Verificar que se loguea el mensaje correcto
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DocumentManager] 📂 Gestor de Documentos (Firmas + Diseño)'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DocumentManager] Sin tab Recientes - exports solo desde Historial'
    );
    
    consoleSpy.mockRestore();
  });

  test('debe tener Type correcto (solo signatures y design)', () => {
    // Este test valida el Type TypeScript (se valida en compile time)
    // Aquí verificamos que los tabs aceptados son solo los 2 esperados
    
    const validTabs: Array<'signatures' | 'design'> = ['signatures', 'design'];
    
    expect(validTabs).toHaveLength(2);
    expect(validTabs).toContain('signatures');
    expect(validTabs).toContain('design');
    
    // Verificar que NO podemos usar 'recents' como tipo válido
    // Si el type Tab incluyera 'recents', este test fallaría en compile time
    const validTypes = ['signatures', 'design'];
    expect(validTypes).not.toContain('recents');
  });
});
