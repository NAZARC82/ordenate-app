# Sistema de Firmas - Ordénate

## 📦 Instalación de Dependencias

Antes de usar el sistema de firmas, instale la dependencia requerida:

```bash
npm install react-native-signature-canvas
# o
yarn add react-native-signature-canvas
```

## 🗂️ Archivos Creados/Modificados

### Archivos Nuevos:

1. **`src/types/signatures.ts`** - Tipos TypeScript para el sistema de firmas
2. **`src/utils/signatureStorage.js`** - Utilidades para AsyncStorage de firmas
3. **`src/components/SignatureCapture.js`** - Componente de captura de firmas
4. **`src/screens/SignatureManagerScreen.js`** - Pantalla independiente del gestor

### Archivos Modificados:

1. **`src/utils/pdfExport.js`** - Agregado soporte para firmas en PDF
2. **`src/utils/csvExport.js`** - Agregado columnas de firma en CSV
3. **`src/components/ExportOptionsModal.js`** - Agregadas opciones de firma

## 🚀 Integración en Navegación

Para que funcione completamente, debe agregar el SignatureManagerScreen a su navegador:

```javascript
// En su stack navigator
import SignatureManagerScreen from '../screens/SignatureManagerScreen';

// Dentro del Stack.Navigator
<Stack.Screen 
  name="SignatureManager" 
  component={SignatureManagerScreen}
  options={{ 
    title: 'Gestor de Firmas',
    headerShown: true 
  }} 
/>
```

## 🧪 Pruebas Manuales

### 1. Configurar Firmas

1. **Navegar al gestor:**
   - Ir a ExportOptionsModal → Sección "🖋️ Opciones de Firma" → Tocar ⚙️
   - O navegar directamente: `navigation.navigate('SignatureManager')`

2. **Configurar metadatos:**
   - Tocar el icono de edición en "⚙️ Configuración General"
   - Cambiar lugar por defecto (ej: "Buenos Aires, Argentina")
   - Cambiar nombres (ej: "Juan Pérez", "María González")
   - Guardar cambios

3. **Capturar firmas:**
   - En "👤 Firma del Cliente" → Tocar + → Firmar → Guardar
   - En "👔 Firma del Responsable" → Tocar + → Firmar → Guardar
   - Verificar que las imágenes se muestran correctamente

### 2. Probar PDF con Líneas

1. **Configurar exportación:**
   - Ir a ExportOptionsModal
   - En "🖋️ Opciones de Firma" seleccionar "Solo líneas"
   - Mantener CSV switch OFF

2. **Exportar PDF:**
   - Tocar "PDF"
   - Verificar que al final del PDF aparecen:
     - Fecha y lugar
     - Dos líneas de firma con nombres configurados
     - Labels "Firma del Cliente" / "Firma del Responsable"

### 3. Probar PDF con Imágenes

1. **Configurar exportación:**
   - En "🖋️ Opciones de Firma" seleccionar "Con imágenes"
   - Asegurar que hay firmas guardadas

2. **Exportar PDF:**
   - Verificar que aparecen las imágenes de firma en lugar de líneas
   - Si falta una firma, debe mostrar línea vacía

### 4. Probar CSV con Columnas de Firma

1. **Configurar exportación:**
   - Seleccionar "Con imágenes" o "Solo líneas" (no "Sin firmas")
   - Activar "Incluir datos de firma en CSV"

2. **Exportar CSV:**
   - Abrir el archivo CSV
   - Verificar columnas adicionales:
     - `Firma Requerida` (Sí/No)
     - `Cliente Nombre` (nombre configurado)
     - `Responsable Nombre` (nombre configurado)  
     - `Firma Fecha` (fecha actual)
     - `Firma Lugar` (lugar configurado)

### 5. Probar CSV sin Columnas de Firma

1. **Configurar exportación:**
   - Seleccionar "Sin firmas" O mantener switch CSV OFF
   
2. **Exportar CSV:**
   - Verificar que NO aparecen las columnas de firma
   - Solo columnas normales (Fecha, Tipo, Monto, etc.)

## 🔧 Debugging

### Logs Útiles

```javascript
// Ver configuración cargada
import { loadSignatureConfig } from '../utils/signatureStorage';
const config = await loadSignatureConfig();
console.log('Config actual:', JSON.stringify(config, null, 2));

// Ver opciones generadas para exportación  
import { generateSignatureOptions } from '../utils/signatureStorage';
const options = await generateSignatureOptions('images');
console.log('Opciones firma:', JSON.stringify(options, null, 2));
```

### Problemas Comunes

1. **Error "react-native-signature-canvas not found"**
   - Instalar dependencia: `npm install react-native-signature-canvas`

2. **Firmas no aparecen en PDF**
   - Verificar que `signatures` se pasa a `exportPDFColored`
   - Verificar que `mode !== 'none'`

3. **Columnas CSV no aparecen**
   - Verificar que `includeSignatureColumns: true`
   - Verificar que `signatures.mode !== 'none'`

4. **Navegación a SignatureManager falla**
   - Agregar la pantalla al stack navigator
   - Verificar que la ruta se llama exactamente "SignatureManager"

## 📊 Estructura de Datos

### AsyncStorage Key: `ordenate:signatures:v1`

```json
{
  "version": 1,
  "defaultMeta": {
    "lugar": "Montevideo, Uruguay",
    "clienteNombre": "Cliente",
    "responsableNombre": "Responsable", 
    "firmaRequerida": true
  },
  "clienteSignature": {
    "dataURL": "data:image/png;base64,iVBORw0KGgoAAAA...",
    "timestamp": "2025-10-10T15:30:00.000Z",
    "name": "Juan Pérez"
  },
  "responsableSignature": {
    "dataURL": "data:image/png;base64,iVBORw0KGgoAAAA...", 
    "timestamp": "2025-10-10T15:35:00.000Z",
    "name": "María González"
  }
}
```

## ✅ Checklist de Validación

- [ ] Dependencia `react-native-signature-canvas` instalada
- [ ] SignatureManagerScreen agregado al navegador
- [ ] PDF sin firmas (mode='none') - funciona igual que antes
- [ ] PDF con líneas (mode='lines') - muestra líneas y labels
- [ ] PDF con imágenes (mode='images') - muestra firmas capturadas
- [ ] CSV sin columnas - funciona igual que antes  
- [ ] CSV con columnas - incluye 5 columnas adicionales
- [ ] Gestor de firmas - captura y guarda correctamente
- [ ] Persistencia - configuración se mantiene entre sesiones