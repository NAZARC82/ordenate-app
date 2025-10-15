// src/__tests__/registry.test.ts
import { addRecent, getRecents, clearRecents } from '../features/documents/registry';

describe('Document Registry', () => {
  beforeEach(async () => {
    await clearRecents();
  });

  it('debe agregar documento reciente', async () => {
    await addRecent({
      id: 'doc1',
      kind: 'pdf',
      name: 'Test PDF',
      uri: 'file:///test.pdf',
    });

    const recents = await getRecents();
    expect(recents).toHaveLength(1);
    expect(recents[0].name).toBe('Test PDF');
    expect(recents[0].kind).toBe('pdf');
  });

  it('debe evitar duplicados por URI', async () => {
    const doc = {
      id: 'doc1',
      kind: 'pdf' as const,
      name: 'Test PDF',
      uri: 'file:///test.pdf',
    };

    await addRecent(doc);
    await addRecent({ ...doc, name: 'Test PDF Updated' });

    const recents = await getRecents();
    expect(recents).toHaveLength(1);
    expect(recents[0].name).toBe('Test PDF Updated');
  });

  it('debe limitar a 20 documentos recientes', async () => {
    for (let i = 0; i < 25; i++) {
      await addRecent({
        id: `doc${i}`,
        kind: 'pdf',
        name: `PDF ${i}`,
        uri: `file:///test${i}.pdf`,
      });
    }

    const recents = await getRecents();
    expect(recents).toHaveLength(20);
  });

  it('debe limpiar todos los recientes', async () => {
    await addRecent({
      id: 'doc1',
      kind: 'csv',
      name: 'Test CSV',
      uri: 'file:///test.csv',
    });

    await clearRecents();
    
    const recents = await getRecents();
    expect(recents).toHaveLength(0);
  });

  it('debe incluir timestamp', async () => {
    const before = Date.now();
    await addRecent({
      id: 'doc1',
      kind: 'pdf',
      name: 'Test',
      uri: 'file:///test.pdf',
    });
    const after = Date.now();

    const recents = await getRecents();
    expect(recents[0].ts).toBeGreaterThanOrEqual(before);
    expect(recents[0].ts).toBeLessThanOrEqual(after);
  });
});
