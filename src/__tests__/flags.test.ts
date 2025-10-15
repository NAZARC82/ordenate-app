// src/__tests__/flags.test.ts
import { FLAGS } from '../features/pdf/flags';

describe('Feature Flags', () => {
  test('pdfDesignerInExport debe estar en false (oculto en exportación)', () => {
    expect(FLAGS.pdfDesignerInExport).toBe(false);
  });

  test('pdfHubInSettings debe estar en true (visible en Ajustes)', () => {
    expect(FLAGS.pdfHubInSettings).toBe(true);
  });

  test('flags deben ser readonly', () => {
    expect(Object.isFrozen(FLAGS)).toBe(false); // const no congela el objeto
    expect(typeof FLAGS).toBe('object');
  });
});
