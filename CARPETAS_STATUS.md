# 📂 Sistema de Carpetas - Estado de Implementación

## ✅ COMPLETADO (2 commits)

### Commit 1ef8924: feat(folders): API crear/listar/renombrar/eliminar + move helpers

**Archivos nuevos**:
- ✅ `src/features/documents/folders.ts` (307 líneas)
  - `listFolders()` - Lista tipos + custom con filesCount
  - `createFolder(name)` - Crea custom/<normalized>/
  - `renameFolder(old, new)` - Solo custom/, valida existencia
  - `deleteFolder(name)` - Solo vacías, error controlado
  - `folderPath(name, type)` - Helper de paths
  - `normalizeFolderName(name)` - Sanitiza: [a-z0-9_\- ]
  - `folderExists(name, type)` - Verifica existencia

- ✅ `src/features/documents/move.ts` (186 líneas)
  - `moveToFolder(uri, target)` - Mueve a custom/<name>/, actualiza registry
  - `moveToKind(uri, kind)` - Mueve a pdf/|csv/|zip/, actualiza registry
  - Limpia registro si archivo no existe
  - Crea carpeta destino si no existe
  - Normaliza URIs con file://

**Archivos modificados**:
- ✅ `src/features/documents/registry.ts`
  - `DocKind` = 'pdf' | 'csv' | 'zip' (agregado zip)
  - `FolderType` = 'pdf' | 'csv' | 'zip' | 'legacy' | `custom/${string}`
  - `RecentDoc` +folder?: FolderType

- ✅ `src/utils/fs-safe.ts`
  - `getSubfolderPath(folder)` - Nuevo helper
  - `movePDFSafe(uri, name, subfolder?)` - Parámetro opcional subfolder
  - `saveCSVSafe(name, content, subfolder?)` - Parámetro opcional subfolder
  - Soporta /exports/root, /exports/pdf/, /exports/custom/xxx/

### Commit a12cd4c: feat(export): preset con lastFolder + saveLocation

**Archivos modificados**:
- ✅ `src/features/exports/presets.ts`
  - `ExportPresetV1` +lastFolder?: string
  - `ExportPresetV1` +saveLocation?: 'auto' | 'last' | 'choose'
  - `DEFAULT_PRESET.saveLocation = 'auto'`
  - `loadPreset()` con merge backward-compatible

**Archivos nuevos**:
- ✅ `CARPETAS_ROADMAP.md` (roadmap completo de 700 líneas)

---

## 🔄 EN PROGRESO (Próximos pasos inmediatos)

### FASE 2.2: Modificar Exporters para usar subfolder

**Archivos a modificar**:

#### 1. `src/utils/pdfExport.js`

**Línea ~920** (función `exportPDFColored`):
```javascript
// ANTES:
export async function exportPDFColored(movimientos, opciones = {}) {

// DESPUÉS:
export async function exportPDFColored(movimientos, opciones = {}) {
  const { subfolder } = opciones; // Extraer subfolder si existe
```

**Línea ~965** (llamada a movePDFSafe):
```javascript
// ANTES:
const { uri: finalUri, exists } = await movePDFSafe(uri, fileName);

// DESPUÉS:
const { uri: finalUri, exists } = await movePDFSafe(uri, fileName, subfolder);
```

**Línea ~975** (registrar en recientes):
```javascript
// ANTES:
await addRecent({
  id: documentId,
  kind: 'pdf',
  name: fileName,
  uri: finalUri
});

// DESPUÉS:
await addRecent({
  id: documentId,
  kind: 'pdf',
  name: fileName,
  uri: finalUri,
  folder: subfolder || undefined // Registrar carpeta si existe
});
```

#### 2. `src/utils/csvExport.js`

**Línea ~130** (función `exportCSV`):
```javascript
// ANTES:
export async function exportCSV(movimientos, opciones = {}) {

// DESPUÉS:
export async function exportCSV(movimientos, opciones = {}) {
  const { subfolder } = opciones; // Extraer subfolder si existe
```

**Línea ~165** (llamada a saveCSVSafe):
```javascript
// ANTES:
const { uri: finalUri, exists } = await saveCSVSafe(fileName, csvConBOM);

// DESPUÉS:
const { uri: finalUri, exists } = await saveCSVSafe(fileName, csvConBOM, subfolder);
```

**Línea ~175** (registrar en recientes):
```javascript
// ANTES:
await addRecent({
  id: documentId,
  kind: 'csv',
  name: fileName,
  uri: finalUri
});

// DESPUÉS:
await addRecent({
  id: documentId,
  kind: 'csv',
  name: fileName,
  uri: finalUri,
  folder: subfolder || undefined
});
```

**Commit esperado**:
```bash
git commit -m "feat(export): exporters soportan subfolder opcional

FASE 2.2/5: Integrar subfolder en exporters

CAMBIOS:
- pdfExport.js: exportPDFColored() +subfolder en opciones
- csvExport.js: exportCSV() +subfolder en opciones
- Ambos pasan subfolder a fs-safe helpers
- Registry guarda folder en RecentDoc

FLUJO:
- Si subfolder definido → exporta a /exports/<subfolder>/
- Si undefined → exporta a /exports/ (comportamiento actual)
- Backward compatible: código existente sigue funcionando

PRÓXIMO: UI en ExportOptionsModal con selector 'Guardar en'"
```

---

## 📋 TAREAS PENDIENTES (Resumen ejecutivo)

### Alta Prioridad (Core Funcionalidad)

1. **Modificar exporters** (FASE 2.2) - Descrito arriba ↑
2. **UI ExportOptionsModal** (FASE 2.3)
   - Selector "Guardar en" con 3 opciones
   - Estado: saveLocation, selectedFolder
   - Lógica: determinar subfolder antes de exportar
   - Guardar lastFolder en preset
3. **Componente FolderPicker** (FASE 2.4)
   - Modal para elegir carpeta
   - Lista custom folders
   - Botón "Nueva carpeta" inline
4. **Tab Carpetas en Gestor** (FASE 3)
   - Nuevo tab en DocumentManagerScreen
   - Lista tipos + custom con CRUD
   - Mini-explorador de archivos
5. **ActionSheet "Mover a..."** (FASE 4)
   - Nueva acción en menú
   - Submenú con tipos + custom
   - Toast de confirmación

### Media Prioridad (Pulir & QA)

6. **Actualizar retention** (FASE 5)
   - Verificar que recorre custom/**
   - No eliminar carpetas, solo archivos
7. **Suite de tests** (FASE 6)
   - folders.test.ts
   - move.test.ts
   - export.destination.test.ts
   - retention.walk.test.ts
   - actionsheet.move.test.tsx
8. **Demo y documentación** (Final)
   - README con guía de uso
   - GIF demo del flujo completo

### Baja Prioridad (Nice to Have)

9. **Iconos personalizados** para carpetas custom
10. **Estadísticas** (espacio usado por carpeta)
11. **Buscar** archivos en todas las carpetas
12. **Exportar múltiples** archivos a la vez

---

## 🎯 PRÓXIMA ACCIÓN CONCRETA

**Ejecutar estos comandos**:

```bash
# 1. Leer pdfExport.js para entender estructura
code src/utils/pdfExport.js:920

# 2. Modificar líneas descritas arriba
# (Agregar {subfolder} en opciones, pasar a movePDFSafe, guardar en registry)

# 3. Repetir para csvExport.js
code src/utils/csvExport.js:130

# 4. Verificar que compila sin errores
npm run type-check

# 5. Commit
git add src/utils/pdfExport.js src/utils/csvExport.js
git commit -m "feat(export): exporters soportan subfolder opcional

FASE 2.2/5: Integrar subfolder en exporters

..."
```

---

## 📊 PROGRESO GLOBAL

```
FASE 1: API y Modelo           ████████████████████ 100% ✅
FASE 2: Integración Export     ████████░░░░░░░░░░░░  40% 🔄
  2.1 Presets                  ████████████████████ 100% ✅
  2.2 Exporters                ░░░░░░░░░░░░░░░░░░░░   0% ⏳
  2.3 UI Modal                 ░░░░░░░░░░░░░░░░░░░░   0% ⏳
  2.4 FolderPicker             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 3: UI Gestor              ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 4: ActionSheet Mover      ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 5: Limpieza/Retención     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 6: Tests                  ░░░░░░░░░░░░░░░░░░░░   0% ⏳

TOTAL:                         ███░░░░░░░░░░░░░░░░░  20%
```

---

## ✅ CRITERIOS DE DEFINICIÓN DE HECHO (DoD)

Para considerar esta feature completa:

- [ ] **Core Funcionalidad**
  - [x] API de carpetas (crear/listar/renombrar/eliminar)
  - [x] API de mover archivos (toFolder/toKind)
  - [x] Preset con lastFolder + saveLocation
  - [ ] Exporters usan subfolder
  - [ ] UI selector "Guardar en"
  - [ ] FolderPicker funcional
  - [ ] Tab Carpetas en Gestor
  - [ ] ActionSheet "Mover a..."
  
- [ ] **Calidad**
  - [ ] Tests pasando (>95%)
  - [ ] Sin regresiones en export/share/visor
  - [ ] Sin warnings de FileSystem
  - [ ] Performance sin degradación
  
- [ ] **UX**
  - [ ] Errores manejados con Alerts claros
  - [ ] Toast de confirmación al mover
  - [ ] Normalización de nombres automática
  - [ ] Validación de carpeta vacía antes de eliminar
  
- [ ] **Documentación**
  - [ ] README actualizado
  - [ ] Demo GIF del flujo completo
  - [ ] CHANGELOG con breaking changes (si hay)

---

## 🔗 ARCHIVOS CLAVE (Quick Reference)

| Archivo | Estado | Líneas | Descripción |
|---------|--------|--------|-------------|
| `features/documents/folders.ts` | ✅ Nuevo | 307 | API carpetas |
| `features/documents/move.ts` | ✅ Nuevo | 186 | Mover archivos |
| `features/documents/registry.ts` | ✅ Modificado | +15 | +folder en RecentDoc |
| `features/exports/presets.ts` | ✅ Modificado | +10 | +lastFolder +saveLocation |
| `utils/fs-safe.ts` | ✅ Modificado | +50 | +subfolder en helpers |
| `utils/pdfExport.js` | ⏳ Pendiente | ~1000 | Falta integrar subfolder |
| `utils/csvExport.js` | ⏳ Pendiente | ~200 | Falta integrar subfolder |
| `components/ExportOptionsModal.js` | ⏳ Pendiente | ~1000 | Falta UI selector |
| `components/FolderPicker.js` | ⏳ Crear | 0 | No existe |
| `components/ActionSheet.js` | ⏳ Pendiente | ~500 | Falta "Mover a..." |
| `screens/DocumentManagerScreen.tsx` | ⏳ Pendiente | ~700 | Falta tab Carpetas |

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Romper export actual
**Mitigación**: subfolder es opcional, backward compatible ✅

### Riesgo 2: URIs con espacios/caracteres especiales
**Mitigación**: normalizeFolderName() ya sanitiza, FileSystem maneja URIs correctamente ✅

### Riesgo 3: Android content:// vs file://
**Mitigación**: Ya resuelto en commits anteriores (openWith.ts) ✅

### Riesgo 4: Purge borra carpetas custom
**Mitigación**: retention solo borra archivos, no directorios (verificar en tests) ⚠️

### Riesgo 5: UI compleja confunde usuario
**Mitigación**: Defaults simples ('auto'), explicaciones claras, preview antes de mover ⚠️

---

**Última actualización**: 23 Oct 2025  
**Commits**: 2/9 completados  
**Próxima acción**: Modificar pdfExport.js y csvExport.js
