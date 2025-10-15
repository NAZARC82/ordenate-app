// src/__tests__/signatures.test.ts
import { listSignatures, saveSignature, deleteSignature, clearSignatures } from '../features/documents/signatures';

describe('Signatures Module', () => {
  beforeEach(async () => {
    await clearSignatures();
  });

  it('debe retornar lista vacía inicialmente', async () => {
    const sigs = await listSignatures();
    expect(sigs).toHaveLength(0);
  });

  it('debe guardar firma nueva', async () => {
    const sig = await saveSignature({
      id: 'sig1',
      name: 'Firma Prueba',
      dataUri: 'data:image/png;base64,ABC123',
    });

    expect(sig.id).toBe('sig1');
    expect(sig.name).toBe('Firma Prueba');
    expect(sig.createdAt).toBeDefined();

    const list = await listSignatures();
    expect(list).toHaveLength(1);
  });

  it('debe actualizar firma existente', async () => {
    await saveSignature({
      id: 'sig1',
      name: 'Firma V1',
      dataUri: 'data:image/png;base64,V1',
    });

    await saveSignature({
      id: 'sig1',
      name: 'Firma V2',
      dataUri: 'data:image/png;base64,V2',
    });

    const list = await listSignatures();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Firma V2');
  });

  it('debe eliminar firma por ID', async () => {
    await saveSignature({
      id: 'sig1',
      name: 'Firma 1',
      dataUri: 'data:image/png;base64,1',
    });

    await saveSignature({
      id: 'sig2',
      name: 'Firma 2',
      dataUri: 'data:image/png;base64,2',
    });

    await deleteSignature('sig1');

    const list = await listSignatures();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('sig2');
  });

  it('debe manejar eliminación de firma inexistente', async () => {
    await saveSignature({
      id: 'sig1',
      name: 'Firma',
      dataUri: 'data:image/png;base64,1',
    });

    await deleteSignature('sig999');

    const list = await listSignatures();
    expect(list).toHaveLength(1);
  });

  it('debe incluir timestamp de creación', async () => {
    const before = Date.now();
    const sig = await saveSignature({
      id: 'sig1',
      name: 'Test',
      dataUri: 'data:image/png;base64,X',
    });
    const after = Date.now();

    expect(sig.createdAt).toBeGreaterThanOrEqual(before);
    expect(sig.createdAt).toBeLessThanOrEqual(after);
  });
});
