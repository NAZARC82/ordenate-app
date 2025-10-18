// src/__tests__/DocumentManager.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import DocumentManagerScreen from '../screens/DocumentManagerScreen';

// Mock de módulos
jest.mock('../features/documents/registry', () => ({
  getRecents: jest.fn(() => Promise.resolve([])),
  addRecent: jest.fn(),
  clearRecents: jest.fn(),
  deleteRecent: jest.fn(() => Promise.resolve([])),
  purgeMissing: jest.fn(() => Promise.resolve([])),
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

jest.mock('../features/documents/signatures', () => ({
  listSignatures: jest.fn(() => Promise.resolve([])),
  saveSignature: jest.fn(),
  deleteSignature: jest.fn(),
}));

jest.mock('../utils/openWith', () => ({
  openWith: jest.fn(() => Promise.resolve(true)),
  openPDF: jest.fn(() => Promise.resolve(true)),
  openCSV: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../features/pdf/usePdfPrefs', () => ({
  usePdfPrefs: jest.fn(() => ({
    prefs: {
      accentColor: '#6A5ACD',
      colorIntensity: 1.0,
      negativeRed: 'strong',
      headerColor: '#50616D',
      showMovementCount: true,
      showGenerationDate: true,
      showOpenWithAfterExport: false,
    },
    updatePrefs: jest.fn(),
    reset: jest.fn(),
    loading: false,
  })),
}));

describe('DocumentManagerScreen', () => {
  it('debe renderizar correctamente', () => {
    render(<DocumentManagerScreen />);
    
    expect(screen.getByTestId('docmgr-root')).toBeTruthy();
  });

  it('debe renderizar los 2 tabs (Firmas y Diseño)', () => {
    render(<DocumentManagerScreen />);
    
    expect(screen.getByTestId('tab-firmas')).toBeTruthy();
    expect(screen.getByTestId('tab-diseno')).toBeTruthy();
  });

  it('debe mostrar tab Firmas por defecto', () => {
    render(<DocumentManagerScreen />);
    
    expect(screen.getByTestId('signatures-list')).toBeTruthy();
    expect(screen.getByText('✍️ Firmas Digitales')).toBeTruthy();
  });

  it('debe cambiar a tab Diseño al presionar', async () => {
    render(<DocumentManagerScreen />);
    
    const tabDiseno = screen.getByTestId('tab-diseno');
    fireEvent.press(tabDiseno);
    
    await waitFor(() => {
      expect(screen.getByTestId('design-panel')).toBeTruthy();
      expect(screen.getByText('🎨 Diseño de PDF')).toBeTruthy();
    });
  });

  it('debe renderizar botón para agregar firma en tab Firmas', () => {
    render(<DocumentManagerScreen />);
    
    // Tab Firmas es el default, no necesita cambiar de tab
    expect(screen.getByTestId('btn-add-signature')).toBeTruthy();
  });

  it('debe renderizar paleta de colores en tab Diseño', async () => {
    render(<DocumentManagerScreen />);
    
    fireEvent.press(screen.getByTestId('tab-diseno'));
    
    await waitFor(() => {
      expect(screen.getByText('Color Corporativo')).toBeTruthy();
      expect(screen.getByTestId('swatch-#50616D')).toBeTruthy();
      expect(screen.getByTestId('swatch-#6A5ACD')).toBeTruthy();
    });
  });

  it('debe renderizar controles de intensidad en tab Diseño', async () => {
    render(<DocumentManagerScreen />);
    
    fireEvent.press(screen.getByTestId('tab-diseno'));
    
    await waitFor(() => {
      expect(screen.getByText('Intensidad de Color')).toBeTruthy();
      expect(screen.getByTestId('int-0.4')).toBeTruthy();
      expect(screen.getByTestId('int-1')).toBeTruthy(); // Fixed: int-1 not int-1.0
    });
  });

  it('debe tener botón de reset en tab Diseño', async () => {
    render(<DocumentManagerScreen />);
    
    fireEvent.press(screen.getByTestId('tab-diseno'));
    
    await waitFor(() => {
      expect(screen.getByTestId('btn-reset-prefs')).toBeTruthy();
    });
  });

  it('debe tener switch para "Abrir con..." en tab Diseño', async () => {
    render(<DocumentManagerScreen />);
    
    fireEvent.press(screen.getByTestId('tab-diseno'));
    
    await waitFor(() => {
      expect(screen.getByTestId('switch-open-with')).toBeTruthy();
      expect(screen.getByText('Abrir con... automático')).toBeTruthy();
    });
  });

  // Los siguientes tests de documentos recientes fueron eliminados
  // porque el tab "Recientes" ya no existe en DocumentManagerScreen.
  // La gestión de documentos recientes ahora se hace exclusivamente desde
  // PantallaHistorial usando el componente ActionSheet.
});
