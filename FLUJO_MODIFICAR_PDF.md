# 🔄 Flujo Completo: Botón "Modificar PDF"

## 📱 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO: Usuario en App                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
           ┌─────────────────────┐
           │  Usuario va a       │
           │  Historial          │
           └──────────┬──────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Toca botón exportar    │
         │ (arriba derecha)       │
         └──────────┬─────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │  MODAL: ExportOptionsModal.js         │
    │  ┌─────────────────────────────────┐  │
    │  │ [👁 Vista Previa]              │  │
    │  │ [🎨 Modificar PDF] ← VIOLETA   │  │ ⭐ NUEVO
    │  │ [📄 PDF]  [📊 CSV]             │  │
    │  └─────────────────────────────────┘  │
    └───────────────┬───────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    ┌─────────┐         ┌──────────────┐
    │ Toca    │         │ Toca         │
    │ PDF     │         │ Modificar    │
    │ directo │         │ PDF          │
    └────┬────┘         └──────┬───────┘
         │                     │
         │                     ▼
         │         ┌───────────────────────────┐
         │         │ MODAL: PdfDesignerSheet   │
         │         │ ┌────────────────────────┐│
         │         │ │ Intensidad: [slider]   ││
         │         │ │ Rojo: ●Fuerte ○Medio   ││
         │         │ │ ☑ Mostrar fecha        ││
         │         │ │ ☑ Mostrar contador     ││
         │         │ │                        ││
         │         │ │ [Guardar] [Cancelar]   ││
         │         │ └────────────────────────┘│
         │         └────────┬──────────────────┘
         │                  │
         │         ┌────────┴────────┐
         │         │                 │
         │         ▼                 ▼
         │    ┌─────────┐      ┌─────────┐
         │    │ Guardar │      │ Cancelar│
         │    └────┬────┘      └────┬────┘
         │         │                │
         │         ▼                │
         │    ┌──────────────┐     │
         │    │ AsyncStorage │     │
         │    │ guarda prefs │     │
         │    └──────┬───────┘     │
         │           │              │
         │           └─────┬────────┘
         │                 │
         │                 ▼
         │         [Modal se cierra]
         │                 │
         │                 ▼
         │         [Vuelve a Export Modal]
         │                 │
         └─────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Usuario toca PDF     │
         └──────────┬───────────┘
                    │
                    ▼
    ┌───────────────────────────────────┐
    │  exportPDFColored()               │
    │  ├─ getPdfPrefs() → AsyncStorage  │
    │  ├─ mapPrefsToPdfOptions()        │
    │  └─ builderOptions                │
    └────────────┬──────────────────────┘
                 │
                 ▼
    ┌───────────────────────────────────┐
    │  buildPdfHtmlColored()            │
    │  ├─ colors.header = prefs.header  │
    │  ├─ colors.accent = prefs.accent  │
    │  ├─ opacity = prefs.intensity     │
    │  └─ negative = prefs.negativeRed  │
    └────────────┬──────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │  HTML + CSS  │
         │  Personalizado│
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Print.print  │
         │ ToFileAsync  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  PDF File    │
         │  Generado    │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Sharing.    │
         │  shareAsync  │
         └──────┬───────┘
                │
                ▼
       ┌────────────────┐
       │ Usuario comparte│
       │ o guarda PDF   │
       └────────────────┘
```

---

## 🎨 Anatomía del Botón "Modificar PDF"

```
ExportOptionsModal Layout:

┌─────────────────────────────────────────────┐
│  📊 Opciones de Exportación                 │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  [Sección Filtros y Opciones]              │
│  • Rango de fechas                          │
│  • Tipo de movimientos                      │
│  • Estados                                  │
│  • Columnas                                 │
│  • Firmas                                   │
│                                             │
├─────────────────────────────────────────────┤
│                    FOOTER                   │ ← Botones de acción
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ 👁  Vista Previa                       ││ ← Azul #3498db
│  └────────────────────────────────────────┘│
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ 🎨  Modificar PDF                      ││ ← 🟣 VIOLETA #6A5ACD ⭐
│  └────────────────────────────────────────┘│
│                                             │
│  ┌──────────────────┬────────────────────┐│
│  │ 📄 PDF           │ 📊 CSV             ││ ← Rojo + Verde
│  └──────────────────┴────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

**Características del botón**:
- Color: Violeta (#6A5ACD) - Corporativo Ordénate
- Icono: `color-palette` (Ionicons)
- Texto: "Modificar PDF"
- Posición: Entre "Vista Previa" y botones PDF/CSV
- Width: 100% del container
- Height: 50px aprox.
- Border radius: 12px
- Estado disabled: Gris (#bdc3c7) cuando loading

---

## 🎨 Anatomía del Modal de Diseño

```
PdfDesignerSheet Layout:

┌─────────────────────────────────────────────┐
│  ← [Cerrar]  Diseño de PDF  [↻ Restaurar]  │ ← Header
├─────────────────────────────────────────────┤
│  📊 PERSONALIZACIÓN DEL PDF                 │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Intensidad de Colores                   ││
│  │                                         ││
│  │ Suave  ━━━━●━━━━━━━━━━  Intenso       ││ ← Slider
│  │                                         ││
│  │ Preview: [█████████] ← Color con opacity││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Tonalidad de Números Rojos              ││
│  │                                         ││
│  │ [●Fuerte] [○Medio] [○Suave]            ││ ← Radio buttons
│  │  #C0392B   #E74C3C   #EC7063           ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Opciones de Contenido                   ││
│  │                                         ││
│  │ Mostrar fecha de generación      [ON]  ││ ← Switch
│  │ Mostrar cantidad de movimientos  [ON]  ││ ← Switch
│  └─────────────────────────────────────────┘│
│                                             │
├─────────────────────────────────────────────┤
│  [GUARDAR]  [CANCELAR]                      │ ← Footer
└─────────────────────────────────────────────┘
```

---

## 🗄️ Estructura de Datos en AsyncStorage

```typescript
// Key: @ordenate:pdf_prefs

{
  "version": 1,
  "headerColor": "#50616D",
  "accentColor": "#6A5ACD",
  "colorIntensity": 0.75,        // 0.0 - 1.0
  "negativeRed": "medium",       // "strong" | "medium" | "soft"
  "showMovementCount": true,
  "showGenerationDate": false,
  "updatedAt": "2025-10-13T10:30:00.000Z"
}
```

---

## 🔄 Flujo de Datos

```
┌────────────────────────────────────────────────────┐
│                  ARQUITECTURA                      │
└────────────────────────────────────────────────────┘

┌──────────────┐
│ AsyncStorage │ ← Persistencia
└──────┬───────┘
       │
       │ getPdfPrefs() / savePdfPrefs()
       │
       ▼
┌──────────────┐
│  prefs.ts    │ ← Modelo de datos
└──────┬───────┘
       │
       │ usePdfPrefs()
       │
       ▼
┌──────────────────┐
│ usePdfPrefs.ts   │ ← Hook React (estado)
└────────┬─────────┘
         │
         │ {prefs, updatePrefs, reset}
         │
         ▼
┌────────────────────────┐
│ PdfDesignerSheet.tsx   │ ← UI (controles)
└─────────┬──────────────┘
          │
          │ onSave → updatePrefs(localPrefs)
          │
          ▼
     [AsyncStorage actualizado]
          │
          │ Al exportar PDF...
          │
          ▼
┌─────────────────┐
│ pdfExport.js    │ ← Generador
│ ├─ getPdfPrefs()│
│ └─ mapPrefs...  │
└────────┬────────┘
         │
         │ builderOptions
         │
         ▼
┌──────────────────┐
│ HTML Builder     │ ← Renderizado
│ colors.header    │
│ colors.accent    │
│ colors.negative  │
│ showDate / Count │
└────────┬─────────┘
         │
         ▼
     [PDF File]
```

---

## 🎯 Casos de Uso

### **Caso 1: Usuario Conservador**
```
1. Nunca toca "Modificar PDF"
2. Solo usa botón "PDF" directo
3. ✓ Siempre obtiene PDF idéntico al actual
```

### **Caso 2: Usuario Personalizador**
```
1. Abre "Modificar PDF"
2. Cambia intensidad a 60%
3. Selecciona "Rojo Suave"
4. Guarda
5. ✓ Sus PDFs siempre usan ese estilo
```

### **Caso 3: Usuario Experimental**
```
1. Prueba diferentes combinaciones
2. Exporta PDFs con distintos estilos
3. Usa "Restaurar" cuando necesita volver al original
4. ✓ Flexibilidad total sin romper defaults
```

### **Caso 4: Usuario de CSV**
```
1. Personaliza el PDF
2. Exporta CSV
3. ✓ CSV no se afecta en absoluto
```

---

## 🔍 Decisiones de Diseño

### **¿Por qué un botón separado?**
- ✅ No modifica flujo existente
- ✅ Opcional (usuario conservador no afectado)
- ✅ Visualmente claro (violeta corporativo)
- ✅ Fácil de encontrar

### **¿Por qué AsyncStorage?**
- ✅ Persistencia entre sesiones
- ✅ No requiere backend
- ✅ Simple y confiable
- ✅ Rápido acceso

### **¿Por qué defaults exactos?**
- ✅ Backward compatibility 100%
- ✅ Sin breaking changes
- ✅ Usuarios existentes no notan diferencia
- ✅ Tests pasan sin cambios

### **¿Por qué mapper separado?**
- ✅ Separación de responsabilidades
- ✅ Facilita testing
- ✅ User-friendly prefs → Technical options
- ✅ Permite cambios futuros sin tocar UI

---

## 📊 Métricas de Éxito

| Métrica | Target | Actual |
|---------|--------|--------|
| Errores de compilación | 0 | ✅ 0 |
| Breaking changes | 0 | ✅ 0 |
| Archivos modificados | ≤5 | ✅ 3 |
| Archivos nuevos | ~4 | ✅ 4 |
| Tests manuales requeridos | ≤10 min | ✅ 5-10 min |
| Defaults preservados | 100% | ✅ 100% |
| CSV afectado | 0% | ✅ 0% |

---

## 🎓 Guía para el Desarrollador

### **Agregar nueva opción de personalización**

1. **Actualizar interface** en `prefs.ts`:
```typescript
export interface PdfPreferences {
  // ... existentes
  newOption: boolean; // Nueva
}

export const DEFAULT_PDF_PREFS = {
  // ... existentes
  newOption: true // Default
};
```

2. **Mapear en** `mapper.ts`:
```typescript
export function mapPrefsToPdfOptions(prefs: PdfPreferences) {
  return {
    // ... existentes
    newOption: prefs.newOption
  };
}
```

3. **Agregar control en** `PdfDesignerSheet.tsx`:
```tsx
<Switch
  value={localPrefs.newOption}
  onValueChange={(value) => 
    updateLocal({ newOption: value })
  }
/>
```

4. **Consumir en** `pdfExport.js`:
```javascript
const useNewOption = builderOptions?.newOption !== false;

// Aplicar en HTML
${useNewOption ? '<div>...</div>' : ''}
```

---

*Documentación completa del flujo*  
*Última actualización: 13 de octubre, 2025*
