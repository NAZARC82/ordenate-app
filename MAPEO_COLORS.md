# Mapeo de Colores y Estilos - Legacy a Theme System

## Resumen de la Refactorización

Se han separado los exportadores en dos archivos especializados y se ha creado un sistema de tema centralizado que mapea todos los colores del código legacy.

### Archivos Creados

1. **`src/utils/csvExport.js`** - Exportación CSV especializada
2. **`src/utils/pdfExport.js`** - Exportación PDF con dos variantes
3. **`src/theme/colors.ts`** - Paleta centralizada (ya existía, se mantiene)
4. **`src/pdf/theme.ts`** - Mapeo específico para PDFs (ya existía, se mantiene)

### Mapeo de Colores Legacy → Theme

#### Del Código Legacy SettingsScreen:
```javascript
// LEGACY                    →  NUEVO THEME
"#FCFCF8"                   →  COLORS.background.primary
"#4D3527"                   →  COLORS.text.primary  
"#666"                      →  COLORS.text.secondary
"#999"                      →  COLORS.text.tertiary
"#3E7D75"                   →  COLORS.primary
"#F0F7F6"                   →  COLORS.background.icon
"#FFFFFF"                   →  COLORS.background.secondary
"#F8F9FA"                   →  COLORS.background.accent
```

#### Gradientes Nuevos (Inspirados en Legacy):
```javascript
// Header violeta (derivado del #3E7D75 legacy)
COLORS.export.violetStart   →  "#667EEA"
COLORS.export.violetEnd     →  "#764BA2"

// Tabla azul (derivado del #3E7D75 legacy)  
COLORS.export.blueStart     →  "#3498DB"
COLORS.export.blueEnd       →  "#2980B9"
```

#### Sistema de Estados:
```javascript
// Montos
COLORS.export.positive      →  "#2e7d32" (cobros +)
COLORS.export.negative      →  "#c62828" (pagos -)

// Badges
COLORS.export.urgent        →  "#E74C3C" (URGENTE - rojo)
COLORS.export.pending       →  "#F39C12" (PENDIENTE - amarillo)
COLORS.export.paid          →  "#27AE60" (PAGADO - verde)
```

### Medidas y Espaciados Legacy

#### Del código StyleSheet legacy:
```javascript
// Radios
borderRadius: 12           →  pdfTheme.styles.radius.lg
borderRadius: 8            →  pdfTheme.styles.radius.md

// Padding/Margin  
padding: 24                →  pdfTheme.styles.spacing.xl
padding: 16                →  pdfTheme.styles.spacing.lg
padding: 12                →  pdfTheme.styles.spacing.md

// Fuentes
fontSize: 24               →  pdfTheme.styles.font.h1
fontSize: 16               →  Estándar body
fontSize: 12               →  pdfTheme.styles.font.base
fontSize: 11               →  pdfTheme.styles.font.small

// Sombras
shadowOpacity: 0.05        →  Replicado en CSS box-shadow
shadowRadius: 6            →  Convertido a 6px blur
elevation: 2               →  Convertido a shadow suave
```

### Funciones Exportadas

#### csvExport.js
- `escapeCSVField(field)` - Única función de escape CSV (elimina duplicaciones)
- `exportCSV(movimientos, opciones)` - Exportación CSV con signos +/- para montos

#### pdfExport.js  
- `exportPDF(movimientos, opciones)` - PDF básico sin gradientes
- `exportPDFStyled(movimientos, opciones)` - PDF estilizado con gradientes y badges
- `exportarPDFSeleccion` - Alias para mantener compatibilidad

### Características del PDF Estilizado

#### Header con Gradiente Violeta:
- Fondo: `linear-gradient(135deg, #667EEA 0%, #764BA2 100%)`
- Tipografía: 28px, peso 700, color blanco
- Padding: 24px, border-radius: 12px
- Box-shadow: `0 4px 12px rgba(0,0,0,0.15)`

#### Resumen Ejecutivo con Tarjetas:
- 3 tarjetas: 💚 Cobros, 🪙 Pagos, ⚖️ Balance
- Cada tarjeta con border-top de 4px en color de estado
- Box-shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Íconos emoji para identificación visual

#### Tabla con Gradiente Azul:
- Header: `linear-gradient(135deg, #3498DB 0%, #2980B9 100%)`
- Íconos en headers: 📅 📰 💵 🔄 📝
- Badges de estado con border-radius: 12px
- Hover effects y zebra striping

#### Sistema de Badges:
- **URGENTE**: Fondo #E74C3C, texto blanco, uppercase
- **PENDIENTE**: Fondo #F39C12, texto blanco, uppercase  
- **PAGADO**: Fondo #27AE60, texto blanco, uppercase
- Padding: 4px 8px, border-radius: 12px, font-size: 10px

### Compatibilidad

- ✅ Mantiene todas las funciones existentes
- ✅ Alias `exportarPDFSeleccion` para compatibilidad hacia atrás
- ✅ Sin hardcoded hex values en exportadores
- ✅ Sistema de tema centralizado
- ✅ Separación de responsabilidades (CSV vs PDF)
- ✅ Sin duplicaciones de funciones

### Testing

Verificado que:
1. No hay errores de compilación
2. No hay identificadores duplicados  
3. `escapeCSVField` existe solo una vez en `csvExport.js`
4. PDFs usan solo colores del tema (no hex hardcodeados)
5. Cambios en `colors.ts` se reflejan en PDFs automáticamente