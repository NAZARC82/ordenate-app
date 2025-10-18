/**
 * @jest-environment node
 */

describe('presentOpenWithSafely - Tests básicos', () => {
  it('exporta la función presentOpenWithSafely', () => {
    const { presentOpenWithSafely } = require('../utils/openWith');
    expect(typeof presentOpenWithSafely).toBe('function');
  });

  it('exporta la función openWith', () => {
    const { openWith } = require('../utils/openWith');
    expect(typeof openWith).toBe('function');
  });
});

