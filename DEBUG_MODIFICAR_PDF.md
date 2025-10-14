# 🔍 CHECKLIST DE DEBUGGING: Botón "Modificar PDF"

**Fecha**: 13 de octubre, 2025  
**Estado**: Debug mode activado  
**Objetivo**: Verificar por qué el botón puede no ser visible  

---

## ✅ VERIFICACIÓN COMPLETA

### 1️⃣ **Componente Correcto** ✅
```
Archivo: src/components/ExportOptionsModal.js
✅ Import de PdfDesignerSheet (línea 23)
✅ Estado pdfDesignerVisible (línea 71)
✅ Botón renderizado (líneas 781-792)
✅ Componente PdfDesignerSheet (líneas 830-837)
```

### 2️⃣ **Console Logs Agregados** ✅
```javascript
// Al renderizar el componente
console.log('[ExportOptionsModal] render - movimientos:', movimientos.length);

// Al presionar el botón
console.log('[ExportOptions] Botón Modificar PDF presionado');
```

### 3️⃣ **TestID Agregado** ✅
```javascript
<TouchableOpacity 
  testID="debug-modificar-pdf"  // ← Para testing
  style={...}
>
  {/* ... */}
  <Text style={{ position: 'absolute', opacity: 0 }}>btn-modificar-pdf-on</Text>
</TouchableOpacity>
```

---

## 🧪 PASOS DE VERIFICACIÓN

### Test 1: Confirmar Componente Renderiza
```bash
1. Abrir consola de Expo
2. Abrir modal de exportación en la app
3. BUSCAR en logs: "[ExportOptionsModal] render"
4. ✅ Si aparece → Componente correcto
5. ❌ Si NO aparece → Estás abriendo otro modal
```

### Test 2: Verificar Botón en Pantalla
```bash
1. Abrir modal de exportación
2. Verificar visualmente:
   - Botón "Vista Previa" (azul) ✅
   - Botón "Modificar PDF" (violeta) ← BUSCAR ESTE
   - Botones "PDF" y "CSV" (rojo y verde) ✅

3. Si NO ves el violeta:
   - Scroll down (puede estar fuera de viewport)
   - Verificar que no esté tapado por footer/tab bar
   - Verificar que el footer tenga gap: 12
```

### Test 3: Verificar Condiciones de Disabled
```bash
Botón se deshabilita si:
- isNavigating === true
- localLoading === true
- loading === true

Estado disabled → Color gris (#bdc3c7)

✅ Verificar: ¿Alguno de estos es true al abrir?
```

### Test 4: Verificar Estilos de Footer
```bash
Footer actual:
{
  padding: 20,
  backgroundColor: 'white',
  borderTopWidth: 1,
  borderTopColor: '#e0e0e0',
  gap: 12  // ← Espacio entre botones
}

✅ Verificar que gap: 12 esté funcionando
✅ Si RN < 0.71, cambiar a:
   rowGap: 12,
   columnGap: 12
```

### Test 5: Probar el Botón
```bash
1. Tocar botón "Modificar PDF"
2. BUSCAR en logs: "[ExportOptions] Botón Modificar PDF presionado"
3. ✅ Modal PdfDesignerSheet debe abrirse
4. ❌ Si no abre → Verificar PdfDesignerSheet existe
```

---

## 🚨 PROBLEMAS COMUNES

### Problema 1: Botón No Visible
**Causa**: Footer sin scroll o fuera de viewport
**Solución**:
```javascript
// Wrap footer en ScrollView si hay muchos botones
<ScrollView>
  <View style={styles.content}>
    {/* Opciones */}
  </View>
</ScrollView>
<View style={styles.footer}>
  {/* Botones - siempre visible */}
</View>
```

### Problema 2: Botón Tapado por Tab Bar
**Causa**: Modal no considera SafeAreaView bottom
**Solución**:
```javascript
// En el Modal
<Modal presentationStyle="pageSheet">
  <SafeAreaView style={{ flex: 1 }}>
    {/* Contenido */}
  </SafeAreaView>
</Modal>
```

### Problema 3: Gap No Funciona
**Causa**: React Native < 0.71
**Solución**:
```javascript
// Reemplazar
gap: 12,

// Por
rowGap: 12,
columnGap: 12,

// O usar marginBottom en cada botón
```

### Problema 4: Botón Gris (Disabled)
**Causa**: Estados loading/navigating en true
**Solución**:
```javascript
// Verificar en consola
console.log('Debug states:', {
  isNavigating,
  localLoading,
  loading
});

// Uno de estos debe ser false para habilitar botón
```

### Problema 5: Modal No Abre
**Causa**: PdfDesignerSheet no existe o tiene error
**Solución**:
```bash
# Verificar archivo existe
ls src/features/pdf/PdfDesignerSheet.tsx

# Verificar import correcto
# Debe ser: import { PdfDesignerSheet } from '../features/pdf/PdfDesignerSheet';
# NO: import PdfDesignerSheet from '...' (default export)
```

---

## 🔧 PARCHE ALTERNATIVO (Si nada funciona)

Si después de verificar todo sigue sin verse:

### Opción A: Botón Siempre Visible
```javascript
{/* Reemplazar disabled prop */}
<TouchableOpacity 
  testID="debug-modificar-pdf"
  style={[
    styles.exportButton, 
    styles.designButton, 
    // (isNavigating || localLoading || loading) && styles.exportButtonDisabled  // ← COMENTAR
  ]}
  onPress={() => {
    console.log('[ExportOptions] Botón Modificar PDF presionado');
    setPdfDesignerVisible(true);
  }}
  // disabled={isNavigating || localLoading || loading}  // ← COMENTAR
>
```

### Opción B: Forzar Estilo Visible
```javascript
designButton: {
  backgroundColor: '#6A5ACD',
  minHeight: 50,  // ← Altura mínima
  minWidth: 200,  // ← Ancho mínimo
  zIndex: 999,    // ← Forzar al frente
  position: 'relative',  // ← Posicionamiento
},
```

### Opción C: Footer con FlexWrap
```javascript
footer: {
  padding: 20,
  backgroundColor: 'white',
  borderTopWidth: 1,
  borderTopColor: '#e0e0e0',
  flexDirection: 'row',  // ← Agregar
  flexWrap: 'wrap',      // ← Agregar
  gap: 12,
  alignItems: 'stretch', // ← Agregar
},
```

---

## 📊 CHECKLIST DE VALIDACIÓN

```bash
□ console.log aparece en logs al abrir modal
□ Botón "Vista Previa" (azul) visible
□ Botón "Modificar PDF" (violeta) visible
□ Botón "PDF" (rojo) visible
□ Botón "CSV" (verde) visible
□ Footer tiene fondo blanco
□ Footer tiene borde superior gris
□ Gap de 12px entre botones
□ Botón NO está disabled (no gris)
□ Al tocar: log "Botón presionado" aparece
□ Modal PdfDesignerSheet abre
□ Modal PdfDesignerSheet tiene controles
□ Guardar cierra modal
□ Cancelar cierra modal
```

---

## 🚀 COMANDO DE TEST

```bash
# Limpiar cache
cd C:\Users\59895\Ordenate\frontend\ordenate-app
npx expo start -c

# Luego:
# 1. Abrir app
# 2. Ir a Historial
# 3. Tocar botón exportar
# 4. Verificar botón violeta "Modificar PDF"
# 5. Ver logs en consola
```

---

## 📸 EVIDENCIA A CAPTURAR

1. **Screenshot del modal** mostrando botones
2. **Logs de consola** con:
   - `[ExportOptionsModal] render - movimientos: X`
   - `[ExportOptions] Botón Modificar PDF presionado`
3. **Inspector React DevTools** (si disponible):
   - Verificar que TouchableOpacity se renderiza
   - Verificar props: disabled, style, onPress

---

## 💡 NOTAS IMPORTANTES

1. **React Native Version**: Si `gap` no funciona, usar `rowGap`/`columnGap` o `marginBottom`
2. **Modal Type**: `pageSheet` en iOS puede tener comportamiento diferente
3. **SafeAreaView**: Asegurar que el footer no quede debajo de áreas seguras
4. **Z-Index**: En Android puede necesitar `elevation` además de `zIndex`
5. **Console Logs**: Deben aparecer CADA VEZ que se renderiza el componente

---

## ✅ ESTADO ACTUAL DEL CÓDIGO

**Archivo**: `src/components/ExportOptionsModal.js`

```javascript
// ✅ Import correcto (línea 23)
import { PdfDesignerSheet } from '../features/pdf/PdfDesignerSheet';

// ✅ Estado correcto (línea 71)
const [pdfDesignerVisible, setPdfDesignerVisible] = useState(false);

// ✅ Console log agregado (línea 57)
console.log('[ExportOptionsModal] render - movimientos:', movimientos.length);

// ✅ Botón renderizado (líneas 781-792)
<TouchableOpacity 
  testID="debug-modificar-pdf"
  style={[styles.exportButton, styles.designButton, ...]}
  onPress={() => {
    console.log('[ExportOptions] Botón Modificar PDF presionado');
    setPdfDesignerVisible(true);
  }}
>
  <Ionicons name="color-palette" size={20} color="white" />
  <Text style={styles.exportButtonText}>Modificar PDF</Text>
  <Text style={{ position: 'absolute', opacity: 0 }}>btn-modificar-pdf-on</Text>
</TouchableOpacity>

// ✅ Componente montado (líneas 830-837)
<PdfDesignerSheet
  visible={pdfDesignerVisible}
  onClose={() => setPdfDesignerVisible(false)}
  onApply={() => console.log('[ExportOptions] Preferencias actualizadas')}
/>

// ✅ Estilo correcto (línea 985)
designButton: {
  backgroundColor: '#6A5ACD', // Violeta
},
```

---

## 🎯 PRÓXIMO PASO

**Ejecutar la app y verificar logs**:
1. `npx expo start -c`
2. Abrir modal de exportación
3. Buscar en consola: `[ExportOptionsModal] render`
4. Si aparece → Componente correcto, verificar visualmente
5. Si no aparece → Hay otro modal en uso

**Reportar**:
- ¿Aparece el log?
- ¿Se ve el botón violeta?
- ¿Al tocar: aparece log de "presionado"?
- ¿Se abre el modal de diseño?

---

*Debug mode activado el 13 de octubre, 2025*  
*Console logs y testID agregados para debugging*  
*Status: ✅ Listo para verificación*
