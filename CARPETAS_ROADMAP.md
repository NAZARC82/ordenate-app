# 📂 Roadmap de Implementación: Sistema de Carpetas

## ✅ FASE 1: API y Modelo de Datos (COMPLETADO)

**Commit**: `feat(folders): API crear/listar/renombrar/eliminar + move helpers`

### Archivos creados:
- ✅ `src/features/documents/folders.ts` - API completa de carpetas
- ✅ `src/features/documents/move.ts` - Mover archivos + actualizar registry
  
### Archivos modificados:
- ✅ `src/features/documents/registry.ts` - DocKind +zip, +folder
- ✅ `src/utils/fs-safe.ts` - movePDFSafe/saveCSVSafe +subfolder

### Funcionalidad:
- ✅ Normalización de nombres: `[a-z0-9_\- ]`
- ✅ Crear/listar/renombrar/eliminar carpetas custom
- ✅ Mover archivos entre carpetas y tipos
- ✅ Actualización automática de registry
- ✅ Validaciones (carpeta vacía para eliminar, etc.)

---

## 🔄 FASE 2: Integración con Exportación (EN PROGRESO)

**Objetivo**: Agregar selector "Guardar en" al ExportOptionsModal

### 2.1 Extender Presets (✅ HECHO)
- ✅ `ExportPresetV1` +lastFolder +saveLocation
- ✅ Persistencia en AsyncStorage
- ✅ Defaults: `saveLocation: 'auto'`

### 2.2 Modificar Exporters
**Archivo**: `src/utils/pdfExport.js`
```javascript
// CAMBIO NECESARIO (línea ~965):
const { uri: finalUri, exists } = await movePDFSafe(uri, fileName, subfolder);
//                                                                  ^^^^^^^^^ NUEVO parámetro
```

**Archivo**: `src/utils/csvExport.js`
```javascript
// CAMBIO NECESARIO (línea ~165):
const { uri: finalUri, exists } = await saveCSVSafe(fileName, csvConBOM, subfolder);
//                                                                        ^^^^^^^^^ NUEVO parámetro
```

### 2.3 UI en ExportOptionsModal
**Archivo**: `src/components/ExportOptionsModal.js`

**Estado nuevo**:
```javascript
const [saveLocation, setSaveLocation] = useState('auto'); // 'auto' | 'last' | 'choose'
const [selectedFolder, setSelectedFolder] = useState(null);
const [showFolderPicker, setShowFolderPicker] = useState(false);
```

**UI nueva** (antes del footer):
```jsx
{/* Selector "Guardar en" */}
<View style={styles.saveLocationSection}>
  <Text style={styles.sectionTitle}>Guardar en:</Text>
  
  <TouchableOpacity 
    style={[styles.saveOption, saveLocation === 'auto' && styles.saveOptionActive]}
    onPress={() => setSaveLocation('auto')}
  >
    <Ionicons name="folder-outline" size={20} />
    <Text>Automático por tipo (PDF/, CSV/)</Text>
  </TouchableOpacity>
  
  {preset.lastFolder && (
    <TouchableOpacity 
      style={[styles.saveOption, saveLocation === 'last' && styles.saveOptionActive]}
      onPress={() => setSaveLocation('last')}
    >
      <Ionicons name="time-outline" size={20} />
      <Text>Última carpeta: {preset.lastFolder}</Text>
    </TouchableOpacity>
  )}
  
  <TouchableOpacity 
    style={[styles.saveOption, saveLocation === 'choose' && styles.saveOptionActive]}
    onPress={() => setShowFolderPicker(true)}
  >
    <Ionicons name="folder-open-outline" size={20} />
    <Text>Elegir carpeta...</Text>
    {selectedFolder && <Text style={styles.mutedSmall}>{selectedFolder}</Text>}
  </TouchableOpacity>
</View>
```

**Lógica de exportación** (determinar subfolder):
```javascript
// En handleExportar(), antes de exportPDFColored():
let subfolder = undefined;

if (saveLocation === 'auto') {
  // Dejar undefined → fs-safe usa /exports/ root
  subfolder = undefined;
} else if (saveLocation === 'last' && preset.lastFolder) {
  subfolder = `custom/${preset.lastFolder}`;
} else if (saveLocation === 'choose' && selectedFolder) {
  subfolder = `custom/${selectedFolder}`;
}

// Pasar a exporters:
const pdfResult = await exportPDFColored(movsFiltrados, {
  ...opciones,
  subfolder, // NUEVO
});
```

**Guardar en preset**:
```javascript
if (saveLocation === 'choose' && selectedFolder) {
  await saveCurrentSelection({
    ...preset,
    lastFolder: selectedFolder,
    saveLocation: 'choose'
  });
}
```

### 2.4 Componente FolderPicker (NUEVO)
**Archivo**: `src/components/FolderPicker.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { listFolders, createFolder } from '../features/documents/folders';

export function FolderPicker({ visible, onClose, onSelect }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  const loadFolders = async () => {
    setLoading(true);
    const all = await listFolders();
    const custom = all.filter(f => f.type === 'custom');
    setFolders(custom);
    setLoading(false);
  };

  const handleCreateNew = async () => {
    Alert.prompt(
      'Nueva carpeta',
      'Nombre de la carpeta:',
      async (name) => {
        try {
          await createFolder(name);
          await loadFolders();
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text>Seleccionar carpeta</Text>
        
        <FlatList
          data={folders}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelect(item.name)}>
              <Text>{item.name} ({item.filesCount} archivos)</Text>
            </TouchableOpacity>
          )}
        />
        
        <TouchableOpacity onPress={handleCreateNew}>
          <Text>➕ Nueva carpeta...</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onClose}>
          <Text>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
```

---

## 📋 FASE 3: UI Gestor de Documentos

**Archivo**: `src/screens/DocumentManagerScreen.tsx`

### Nuevo Tab "Carpetas"
```typescript
const [activeTab, setActiveTab] = useState<'firmas' | 'diseno' | 'carpetas'>('firmas');
```

### UI del Tab:
```tsx
{activeTab === 'carpetas' && (
  <View>
    {/* Sección: Tipos */}
    <Text style={styles.sectionTitle}>Carpetas por Tipo</Text>
    {typeFolders.map(folder => (
      <TouchableOpacity 
        key={folder.name}
        onPress={() => navigateToFolder(folder)}
      >
        <Text>{folder.name} ({folder.filesCount} archivos)</Text>
      </TouchableOpacity>
    ))}
    
    {/* Sección: Personalizadas */}
    <Text style={styles.sectionTitle}>Carpetas Personalizadas</Text>
    <TouchableOpacity onPress={handleCreateFolder}>
      <Text>➕ Nueva carpeta</Text>
    </TouchableOpacity>
    
    {customFolders.map(folder => (
      <View key={folder.name}>
        <Text>{folder.name} ({folder.filesCount})</Text>
        <TouchableOpacity onPress={() => handleRename(folder)}>
          <Ionicons name="create-outline" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(folder)}>
          <Ionicons name="trash-outline" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}
```

### Mini-Explorador (nueva pantalla o modal):
```typescript
// FolderExplorerScreen.tsx
// - Lista archivos dentro de una carpeta
// - Permite: Abrir con, Ver, Eliminar, Mover a...
```

---

## 🎯 FASE 4: ActionSheet - "Mover a..."

**Archivo**: `src/components/ActionSheet.js`

### Nueva acción en el menú:
```javascript
const actions = [
  { id: 'openWith', label: 'Abrir con...', icon: 'share-outline' },
  { id: 'view', label: 'Ver', icon: 'eye-outline' },
  { id: 'move', label: 'Mover a...', icon: 'folder-outline' }, // ← NUEVO
  { id: 'deleteRecent', label: 'Eliminar de Recientes', icon: 'close-circle-outline' },
  { id: 'deletePhysical', label: 'Eliminar del dispositivo', icon: 'trash-outline' },
];
```

### Modal "Mover a":
```javascript
const [showMoveModal, setShowMoveModal] = useState(false);

const handleMove = async (destination) => {
  // destination = 'pdf' | 'csv' | 'zip' | 'custom/<name>'
  try {
    if (destination.startsWith('custom/')) {
      const folderName = destination.replace('custom/', '');
      await moveToFolder(fileUri, folderName);
    } else {
      await moveToKind(fileUri, destination);
    }
    
    Alert.alert('Éxito', `Movido a ${destination}`);
    onClose();
  } catch (err) {
    Alert.alert('Error', err.message);
  }
};
```

### Submenú:
```jsx
<Modal visible={showMoveModal}>
  <Text>Mover a:</Text>
  
  <TouchableOpacity onPress={() => handleMove('pdf')}>
    <Text>📄 PDF</Text>
  </TouchableOpacity>
  
  <TouchableOpacity onPress={() => handleMove('csv')}>
    <Text>📊 CSV</Text>
  </TouchableOpacity>
  
  {customFolders.map(f => (
    <TouchableOpacity onPress={() => handleMove(`custom/${f.name}`)}>
      <Text>📁 {f.name}</Text>
    </TouchableOpacity>
  ))}
  
  <TouchableOpacity onPress={handleCreateAndMove}>
    <Text>➕ Nueva carpeta...</Text>
  </TouchableOpacity>
</Modal>
```

---

## 🧹 FASE 5: Limpieza y Retención

**Archivo**: `src/features/documents/retention.ts`

### Actualizar purgeOlderThan():
```typescript
export async function purgeOlderThan(days: number = RETENTION_DAYS): Promise<PurgeResult> {
  const files = await listExportFiles(); // Ya recorre /exports/ completo
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  let removed = 0;
  
  for (const file of files) {
    if (file.mtime < cutoff) {
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
        
        // Eliminar de recientes
        const recents = await getRecents();
        const doc = recents.find(d => d.uri === file.uri);
        if (doc) {
          await deleteRecent(doc.id);
        }
        
        removed++;
      } catch (err) {
        console.warn('[Retention] Error eliminando:', err);
      }
    }
  }
  
  // ⚠️ NO eliminar carpetas custom, solo archivos dentro
  
  return { removed };
}
```

### Actualizar listExportFiles():
```typescript
// YA funciona recursivamente gracias a readDirectoryAsync
// No requiere cambios (verifica que recorra subdirectorios)
```

---

## 🧪 FASE 6: Tests

### Nuevos archivos de tests:

**`src/__tests__/features/folders.test.ts`**
```typescript
describe('Folders API', () => {
  it('debe crear carpeta custom normalizada', async () => {
    const folder = await createFolder('Mis Reportes 2025!');
    expect(folder.name).toBe('mis_reportes_2025');
  });
  
  it('debe listar carpetas con count', async () => {
    const folders = await listFolders();
    expect(folders).toContainEqual({
      name: 'PDF',
      type: 'pdf',
      filesCount: expect.any(Number)
    });
  });
  
  it('no debe eliminar carpeta con archivos', async () => {
    await expect(deleteFolder('non-empty')).rejects.toThrow('contiene');
  });
});
```

**`src/__tests__/features/move.test.ts`**
```typescript
describe('Move Files', () => {
  it('debe mover archivo a custom y actualizar registry', async () => {
    const result = await moveToFolder('file:///exports/test.pdf', 'reportes');
    expect(result.success).toBe(true);
    expect(result.newUri).toContain('custom/reportes');
    
    const recents = await getRecents();
    const moved = recents.find(d => d.name === 'test.pdf');
    expect(moved?.folder).toBe('custom/reportes');
  });
  
  it('debe limpiar registro si archivo no existe', async () => {
    await expect(moveToFolder('file:///missing.pdf', 'carpeta')).rejects.toThrow();
    
    const recents = await getRecents();
    expect(recents.find(d => d.uri.includes('missing'))).toBeUndefined();
  });
});
```

**`src/__tests__/export.destination.test.ts`**
```typescript
describe('Export Destination', () => {
  it('debe exportar a PDF/ por defecto', async () => {
    const result = await exportPDFColored(movs, { saveLocation: 'auto' });
    expect(result.fileUri).toMatch(/exports\/[^/]+\.pdf$/);
  });
  
  it('debe exportar a custom folder', async () => {
    const result = await exportPDFColored(movs, { 
      subfolder: 'custom/reportes' 
    });
    expect(result.fileUri).toContain('custom/reportes');
  });
});
```

**`src/__tests__/retention.walk.test.ts`**
```typescript
describe('Retention Walk', () => {
  it('debe purgar archivos en custom/**', async () => {
    // Setup: crear archivo viejo en custom/test/
    const oldFile = 'file:///exports/custom/test/old.pdf';
    // ...mock con mtime viejo
    
    const result = await purgeOlderThan(30);
    expect(result.removed).toBeGreaterThan(0);
    
    const info = await FileSystem.getInfoAsync(oldFile);
    expect(info.exists).toBe(false);
  });
  
  it('no debe eliminar carpetas custom', async () => {
    await purgeOlderThan(1); // Purgar todo
    
    const folders = await listFolders();
    const custom = folders.filter(f => f.type === 'custom');
    expect(custom.length).toBeGreaterThan(0); // Carpetas intactas
  });
});
```

**`src/__tests__/components/ActionSheet.move.test.tsx`**
```tsx
describe('ActionSheet - Mover a', () => {
  it('debe mostrar opción "Mover a..."', () => {
    const { getByText } = render(<ActionSheet visible={true} {...props} />);
    expect(getByText('Mover a...')).toBeTruthy();
  });
  
  it('debe mover archivo a custom', async () => {
    // Mock moveToFolder
    // Simular tap en "Mover a..." → seleccionar carpeta
    // Verificar toast de confirmación
  });
});
```

---

## 📊 CRITERIOS DE ACEPTACIÓN (QA Checklist)

### Carpetas
- [ ] Puedo crear carpeta custom desde Gestor → Carpetas
- [ ] Nombre se normaliza: `Mis Reportes!` → `mis_reportes`
- [ ] Puedo renombrar carpeta custom
- [ ] NO puedo eliminar carpeta con archivos (Alert claro)
- [ ] Puedo eliminar carpeta vacía

### Exportación
- [ ] Selector "Guardar en" visible en ExportOptionsModal
- [ ] Opción "Automático por tipo" exporta a /exports/
- [ ] Opción "Última carpeta" usa preset.lastFolder
- [ ] Opción "Elegir carpeta" abre FolderPicker
- [ ] FolderPicker muestra carpetas custom + "Nueva carpeta"
- [ ] Archivo se exporta a carpeta correcta
- [ ] Preset guarda lastFolder después de exportar

### Gestor
- [ ] Tab "Carpetas" visible en DocumentManagerScreen
- [ ] Lista muestra tipos (PDF/CSV/ZIP) con count
- [ ] Lista muestra carpetas custom con count
- [ ] Tap en carpeta abre mini-explorador
- [ ] Mini-explorador muestra archivos dentro
- [ ] Desde archivo: puedo Abrir con, Ver, Mover, Eliminar

### ActionSheet
- [ ] Acción "Mover a..." visible en menú
- [ ] Submenú muestra: PDF, CSV, ZIP, carpetas custom, "➕ Nueva"
- [ ] Mover a tipo actualiza registry.folder
- [ ] Mover a custom actualiza registry.folder
- [ ] Toast confirma: "Movido a <carpeta>"
- [ ] "Nueva carpeta" inline funciona (crea + mueve)

### Retención
- [ ] purgeOlderThan() elimina archivos viejos en custom/**
- [ ] Archivos eliminados se limpian de Recientes
- [ ] Carpetas custom NO se eliminan (solo contenido viejo)

### Regresiones
- [ ] Export/compartir/visor funcionan igual que antes
- [ ] Sin warnings de expo-file-system
- [ ] Tests en verde (mínimo 95% passing)
- [ ] Performance sin degradación

---

## 🚀 COMMITS ATÓMICOS (Orden de Ejecución)

### 1. ✅ HECHO
```bash
git commit -m "feat(folders): API crear/listar/renombrar/eliminar + move helpers"
```

### 2. Próximo
```bash
git add src/features/exports/presets.ts
git commit -m "feat(export): preset con lastFolder + saveLocation
  
- ExportPresetV1 +lastFolder +saveLocation
- Defaults: saveLocation='auto'
- Persistencia en AsyncStorage"
```

### 3. Siguiente
```bash
git add src/utils/pdfExport.js src/utils/csvExport.js
git commit -m "feat(export): exporters soportan subfolder opcional

- movePDFSafe(uri, name, subfolder?)
- saveCSVSafe(name, content, subfolder?)
- Si subfolder definido → custom/<name>/
- Si undefined → /exports/ root"
```

### 4. UI Modal
```bash
git add src/components/ExportOptionsModal.js src/components/FolderPicker.js
git commit -m "feat(export): selector 'Guardar en' + FolderPicker

- Opciones: Auto | Última | Elegir
- FolderPicker lista custom + crear inline
- Guarda lastFolder en preset
- Pasa subfolder a exporters"
```

### 5. Gestor
```bash
git add src/screens/DocumentManagerScreen.tsx
git commit -m "feat(manager): tab Carpetas + mini-explorador

- Nuevo tab 'Carpetas'
- Lista tipos + custom con count
- CRUD: crear/renombrar/eliminar
- Navegación a mini-explorador de archivos"
```

### 6. ActionSheet
```bash
git add src/components/ActionSheet.js
git commit -m "feat(actionsheet): acción 'Mover a...' + submenú

- Nueva acción en menú principal
- Submenú: tipos + custom + crear inline
- Usa moveToFolder/moveToKind
- Toast de confirmación"
```

### 7. Retención
```bash
git add src/features/documents/retention.ts
git commit -m "chore(retention): recorrer pdf/csv/zip/custom/**

- purgeOlderThan() ya recorre subdirectorios
- Limpia entradas de Recientes
- NO elimina carpetas custom (solo archivos)"
```

### 8. Tests
```bash
git add src/__tests__/**
git commit -m "test(folders|move|export|retention|sheet): suites completas

- folders.test.ts: CRUD + normalización
- move.test.ts: moveToFolder/Kind + registry
- export.destination.test.ts: subfolder en exporters
- retention.walk.test.ts: purge en custom/**
- actionsheet.move.test.tsx: UI mover
- Mocks extendidos con árbol de directorios"
```

### 9. Final
```bash
git add .
git commit -m "docs(carpetas): README + demo gif

- README con guía de uso
- Demo.gif: crear carpeta → exportar → mover archivo
- CHANGELOG actualizado"
```

---

## 📝 NOTAS TÉCNICAS

### Normalización de Nombres
```javascript
// Ejemplos:
'Mis Reportes 2025!'  → 'mis_reportes_2025'
'Facturas  del  Mes'  → 'facturas_del_mes'
'___Test___'          → 'test'
```

### Paths Absolutos
```
/exports/                  (root)
/exports/pdf/             (tipo)
/exports/csv/             (tipo)
/exports/zip/             (tipo)
/exports/custom/reportes/  (custom)
```

### FolderType en Registry
```typescript
folder?: 'pdf' | 'csv' | 'zip' | 'legacy' | `custom/${string}`;

// Ejemplos:
{ folder: 'pdf' }                    // En /exports/pdf/
{ folder: 'custom/mis_reportes' }    // En /exports/custom/mis_reportes/
{ folder: undefined }                // En /exports/ root (legacy)
```

---

## ⚠️ EDGE CASES A VALIDAR

1. **Carpeta ya existe**: Alert "La carpeta ya existe"
2. **Renombrar a nombre existente**: Error controlado
3. **Eliminar carpeta no vacía**: Alert con count de archivos
4. **Mover a carpeta que no existe**: Crear automáticamente (tipo custom)
5. **URIs con espacios**: Normalización correcta en paths
6. **Android content://**: AssetManager puede requerir copy antes de move
7. **Archivo no existe**: Limpiar de Recientes y mostrar error
8. **Preset.lastFolder no existe**: Fallback a 'auto'
9. **Múltiples exports simultáneos**: Mutex ya implementado (OK)
10. **Purge durante export**: Sin locks (aceptable, FileSystem.deleteAsync es atomic)

---

## 🎬 DEMO GIF (Guión)

1. Abrir app → Ajustes → Gestor → Tab "Carpetas"
2. Tap "Nueva carpeta" → Nombre: "Reportes Enero"
3. Carpeta aparece en lista custom
4. Volver a Historial → Seleccionar movimientos → Exportar
5. En modal: Selector "Guardar en" → "Elegir carpeta"
6. FolderPicker → Seleccionar "Reportes Enero"
7. Exportar PDF → ActionSheet → "Abrir con..."
8. PDF se abre desde custom/reportes_enero/
9. Volver → Ajustes → Gestor → Carpetas
10. Tap "Reportes Enero" → Ver PDF listado
11. Tap PDF → ActionSheet → "Mover a..." → Seleccionar "CSV"
12. Toast: "Movido a CSV"
13. Verificar en Tab Firmas → Recientes → PDF ahora en CSV/

---

## 🔗 DEPENDENCIAS

- ✅ expo-file-system/legacy (ya en uso)
- ✅ AsyncStorage (ya en uso)
- ✅ @react-navigation (para mini-explorador si se hace pantalla separada)
- ⚠️ react-native-fs (NO necesario, FileSystem.readDirectoryAsync es recursivo)

---

## 📚 REFERENCIAS

- [Expo FileSystem Legacy Docs](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [AsyncStorage API](https://react-native-async-storage.github.io/async-storage/)
- Especificación original del usuario (arriba)
- Commits previos de export/share/visor (contexto)

---

**Última actualización**: FASE 1 completada  
**Próximo paso**: Commit de presets + modificar exporters  
**ETA**: 4 commits más para funcionalidad completa + 1 commit de tests
