// src/__tests__/pdfPrefs.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { usePdfPrefs } from '../features/pdf/usePdfPrefs';
import { DEFAULT_PDF_PREFS } from '../features/pdf/prefs';

describe('usePdfPrefs hook', () => {
  beforeEach(() => {
    // Limpiar AsyncStorage antes de cada test
    jest.clearAllMocks();
  });

  it('debe inicializar con defaults', async () => {
    const { result } = renderHook(() => usePdfPrefs());
    
    await act(async () => {
      // Esperar a que cargue
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.prefs).toBeDefined();
    expect(result.current.prefs.headerColor).toBe(DEFAULT_PDF_PREFS.headerColor);
    expect(result.current.prefs.accentColor).toBe(DEFAULT_PDF_PREFS.accentColor);
  });

  it('debe actualizar color corporativo', async () => {
    const { result } = renderHook(() => usePdfPrefs());
    
    await act(async () => {
      await result.current.updatePrefs({ accentColor: '#FF5500' });
    });

    expect(result.current.prefs.accentColor).toBe('#FF5500');
  });

  it('debe actualizar intensidad', async () => {
    const { result } = renderHook(() => usePdfPrefs());
    
    await act(async () => {
      await result.current.updatePrefs({ colorIntensity: 0.6 });
    });

    expect(result.current.prefs.colorIntensity).toBe(0.6);
  });

  it('debe resetear a defaults', async () => {
    const { result } = renderHook(() => usePdfPrefs());
    
    // Cambiar algo primero
    await act(async () => {
      await result.current.updatePrefs({ accentColor: '#123456' });
    });

    // Resetear
    await act(async () => {
      await result.current.reset();
    });

    expect(result.current.prefs.accentColor).toBe(DEFAULT_PDF_PREFS.accentColor);
  });
});
