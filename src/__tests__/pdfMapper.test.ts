// src/__tests__/pdfMapper.test.ts
import { mapPrefsToPdfOptions } from '../features/pdf/mapper';
import { DEFAULT_PDF_PREFS, PdfPreferences } from '../features/pdf/prefs';

describe('PDF Mapper', () => {
  it('debe mapear prefs default a opciones de builder', () => {
    const options = mapPrefsToPdfOptions(DEFAULT_PDF_PREFS);
    
    expect(options).toBeDefined();
    expect(options.headerColor).toBe('#50616D');
    expect(options.accentColor).toBe('#6A5ACD');
    expect(options.accentOpacity).toBeCloseTo(1.0, 1);
  });

  it('debe aplicar color corporativo personalizado', () => {
    const customPrefs: PdfPreferences = {
      ...DEFAULT_PDF_PREFS,
      accentColor: '#FF00AA',
    };
    
    const options = mapPrefsToPdfOptions(customPrefs);
    expect(options.accentColor).toBe('#FF00AA');
  });

  it('debe convertir intensidad a opacidad', () => {
    const customPrefs: PdfPreferences = {
      ...DEFAULT_PDF_PREFS,
      colorIntensity: 0.5,
    };
    
    const options = mapPrefsToPdfOptions(customPrefs);
    expect(options.accentOpacity).toBeCloseTo(0.5, 1);
  });

  it('debe mapear negativeRed a color', () => {
    const strong: PdfPreferences = { ...DEFAULT_PDF_PREFS, negativeRed: 'strong' };
    const medium: PdfPreferences = { ...DEFAULT_PDF_PREFS, negativeRed: 'medium' };
    const soft: PdfPreferences = { ...DEFAULT_PDF_PREFS, negativeRed: 'soft' };
    
    expect(mapPrefsToPdfOptions(strong).negativeColor).toBe('#C0392B');
    expect(mapPrefsToPdfOptions(medium).negativeColor).toBe('#E74C3C');
    expect(mapPrefsToPdfOptions(soft).negativeColor).toBe('#EC7063');
  });

  it('debe incluir flags de contenido', () => {
    const options = mapPrefsToPdfOptions(DEFAULT_PDF_PREFS);
    
    expect(options.showMovementCount).toBe(true);
    expect(options.showGenerationDate).toBe(true);
  });
});
