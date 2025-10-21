/**
 * Tests para presets de exportación
 */
import { loadPreset, savePreset, resetPreset, DEFAULT_PRESET } from '../../features/exports/presets';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Export Presets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPreset', () => {
    it('debe retornar DEFAULT_PRESET si no hay nada guardado', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await loadPreset();

      expect(result).toEqual(DEFAULT_PRESET);
    });

    it('debe cargar preset guardado', async () => {
      const saved = {
        dateRange: 'week',
        includePdf: true,
        includeCsv: true,
        includeTotals: false,
        lastUsedAt: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(saved));

      const result = await loadPreset();

      expect(result.dateRange).toBe('week');
      expect(result.includePdf).toBe(true);
      expect(result.includeCsv).toBe(true);
      expect(result.includeTotals).toBe(false);
    });

    it('debe manejar errores de parsing silenciosamente', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await loadPreset();

      expect(result).toEqual(DEFAULT_PRESET);
    });

    it('debe merge con defaults para compatibilidad', async () => {
      const partial = {
        dateRange: 'month',
        includePdf: false,
        // Faltan includeCsv, includeTotals, lastUsedAt
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(partial));

      const result = await loadPreset();

      expect(result.dateRange).toBe('month');
      expect(result.includePdf).toBe(false);
      expect(result.includeCsv).toBe(DEFAULT_PRESET.includeCsv);
      expect(result.includeTotals).toBe(DEFAULT_PRESET.includeTotals);
    });
  });

  describe('savePreset', () => {
    it('debe guardar preset con lastUsedAt actualizado', async () => {
      const preset = {
        dateRange: 'custom' as const,
        includePdf: true,
        includeCsv: false,
        includeTotals: true,
        lastUsedAt: 0,
      };

      await savePreset(preset);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@ordenate:export_preset:v1',
        expect.any(String)
      );

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );

      expect(savedData.lastUsedAt).toBeGreaterThan(0);
      expect(savedData.dateRange).toBe('custom');
    });

    it('debe manejar errores de escritura silenciosamente', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      await expect(savePreset(DEFAULT_PRESET)).resolves.not.toThrow();
    });
  });

  describe('resetPreset', () => {
    it('debe eliminar preset de AsyncStorage', async () => {
      await resetPreset();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@ordenate:export_preset:v1');
    });

    it('debe manejar errores silenciosamente', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(resetPreset()).resolves.not.toThrow();
    });
  });
});
