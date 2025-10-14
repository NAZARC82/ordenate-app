# ✅ CHECKLIST VISUAL RÁPIDO

## 🎯 Verificación en 2 Minutos

### 1️⃣ Archivos Existen
```bash
□ src/features/pdf/prefs.ts
□ src/features/pdf/usePdfPrefs.ts
□ src/features/pdf/mapper.ts
□ src/features/pdf/PdfDesignerSheet.tsx
```

### 2️⃣ Código Integrado
```bash
□ ExportOptionsModal.js tiene import de PdfDesignerSheet
□ ExportOptionsModal.js tiene estado pdfDesignerVisible
□ ExportOptionsModal.js tiene botón violeta "Modificar PDF"
□ ExportOptionsModal.js renderiza <PdfDesignerSheet />
□ pdfExport.js llama a getPdfPrefs()
□ pdfExport.js usa builderOptions en buildPdfHtmlColored()
```

### 3️⃣ Sin Errores
```bash
□ npm start / npx expo start sin errores
□ TypeScript compila sin warnings
□ JavaScript sin errores de sintaxis
```

---

## 👁️ Verificación Visual en la App

### Paso 1: Abrir Modal
```
1. Ir a Historial
2. Tocar botón exportar (⋮ arriba derecha)
3. ✅ Se abre modal "Opciones de Exportación"
```

### Paso 2: Ver Botón Violeta
```
Buscar en el modal:

┌─────────────────────────────┐
│ [👁 Vista Previa]          │ ← Azul
│ [🎨 Modificar PDF]         │ ← 🟣 ESTE (violeta)
│ [📄 PDF] [📊 CSV]          │ ← Rojo + Verde
└─────────────────────────────┘

✅ Botón violeta visible
✅ Texto "Modificar PDF"
✅ Icono paleta (🎨)
```

### Paso 3: Abrir Diseñador
```
1. Tocar botón "🎨 Modificar PDF"
2. ✅ Se abre nuevo modal "Diseño de PDF"
3. ✅ Ver:
   - Slider de intensidad
   - 3 botones de rojo
   - 2 switches
   - Botones Guardar/Cancelar
```

### Paso 4: Probar Controles
```
1. Mover slider → ✅ Ver preview cambiar
2. Tocar "Rojo Medio" → ✅ Botón se selecciona
3. Toggle switch → ✅ Cambia ON/OFF
4. Tocar "Guardar" → ✅ Ver alert confirmación
5. Modal se cierra → ✅ Vuelve a opciones
```

### Paso 5: Exportar PDF
```
1. Tocar "PDF" (botón rojo)
2. Esperar generación
3. Abrir PDF
4. ✅ Ver cambios aplicados (si modificaste algo)
   O
   ✅ Ver PDF idéntico al actual (si no tocaste nada)
```

---

## 🔍 Debugging Rápido

### Si el botón NO aparece:

```bash
# 1. Verificar import
grep "PdfDesignerSheet" src/components/ExportOptionsModal.js

# 2. Verificar botón en código
grep -A 5 "Modificar PDF" src/components/ExportOptionsModal.js

# 3. Verificar estilo
grep "designButton" src/components/ExportOptionsModal.js

# 4. Reiniciar Expo
Ctrl+C
npx expo start -c
```

### Si el modal NO abre:

```bash
# 1. Ver logs en consola (buscar errores)
# 2. Verificar estado
grep "pdfDesignerVisible" src/components/ExportOptionsModal.js

# 3. Verificar onPress
# Debe tener: onPress={() => setPdfDesignerVisible(true)}
```

### Si los cambios NO se aplican:

```bash
# 1. Ver logs al exportar
[exportPDFColored] Aplicando preferencias de diseño: {...}

# 2. Si dice "Sin preferencias"
# → Verificar que guardaste en el diseñador

# 3. Borrar AsyncStorage y probar de nuevo
# Dev Tools → Application → AsyncStorage → 
# Borrar key: @ordenate:pdf_prefs
```

---

## 📸 Capturas de Pantalla Recomendadas

### Captura 1: Modal de Exportación
```
Screenshot mostrando:
- Botón "Vista Previa" (azul)
- Botón "Modificar PDF" (violeta) ⭐
- Botones "PDF" y "CSV"
```

### Captura 2: Modal de Diseño
```
Screenshot mostrando:
- Slider de intensidad
- Preview de color
- Botones de rojo
- Switches
```

### Captura 3: PDF Default
```
Screenshot del PDF sin cambios:
- Header azul oscuro
- Resumen violeta intenso
- Rojos fuertes
```

### Captura 4: PDF Personalizado
```
Screenshot del PDF con cambios:
- Resumen violeta suave
- Rojos más claros
- Sin fecha (si desactivaste)
```

---

## ✅ Checklist de Funcionalidad

### Core Features
```bash
□ Botón visible en modal
□ Modal de diseño abre
□ Slider funciona
□ Selector de rojo funciona
□ Switches funcionan
□ Botón "Guardar" guarda
□ Botón "Restaurar" restaura
□ PDF sin prefs = idéntico al actual
□ PDF con prefs = cambios aplicados
□ CSV no afectado
□ Persistencia funciona (cerrar/reabrir app)
```

### Edge Cases
```bash
□ Sin AsyncStorage funciona (usa defaults)
□ AsyncStorage corrupto no crashea
□ Cambiar y no guardar no afecta siguiente export
□ Restaurar defaults realmente vuelve al original
□ Multiple guardados consecutivos funciona
```

### UX
```bash
□ Botón violeta fácil de identificar
□ Modal responsive
□ Preview visual ayuda
□ Confirmaciones claras
□ Estados disabled correctos
□ Loading states visibles
```

---

## 🎯 Criterios de PASS/FAIL

### ✅ PASS si:
- ✅ Botón violeta visible
- ✅ Modal abre sin crashes
- ✅ Controles funcionan
- ✅ PDF default idéntico
- ✅ Cambios se aplican
- ✅ Persistencia funciona
- ✅ CSV intacto

### ❌ FAIL si:
- ❌ Botón no aparece
- ❌ Modal crashea
- ❌ Controles no responden
- ❌ PDF default diferente
- ❌ Cambios no se aplican
- ❌ Persistencia no funciona
- ❌ CSV se rompe

---

## 🚀 Comando Final

```bash
cd C:\Users\59895\Ordenate\frontend\ordenate-app
npx expo start
```

Luego:
1. ✅ Escanear QR en dispositivo
   O
2. ✅ Presionar 'a' para Android emulator
   O
3. ✅ Presionar 'i' para iOS simulator

---

## 📝 Template de Reporte

Si encuentras un bug:

```
🐛 BUG REPORT

Paso a paso:
1. 
2. 
3. 

Esperado:
- 

Obtenido:
- 

Logs:
```

Screenshots:
- 

Prioridad: □ Alta □ Media □ Baja
```

---

## ✅ Estado Final Esperado

Después de seguir este checklist:

```
✅ Todos los archivos existen
✅ Sin errores de compilación
✅ Botón visible en la app
✅ Modal funcional
✅ Controles responden
✅ PDF se personaliza
✅ Defaults preservados
✅ CSV intacto
✅ Persistencia funciona
```

**= 🎉 IMPLEMENTACIÓN EXITOSA**

---

*Última actualización: 13 de octubre, 2025*  
*Tiempo estimado: 2 minutos de verificación*
