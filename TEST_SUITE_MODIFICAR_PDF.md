# 🧪 Test Suite: Botón "Modificar PDF"

## ⚡ Test Rápido (5 minutos)

### ✅ Test 1: Botón Visible (30 segundos)
```
1. Abrir app
2. Ir a Historial → Tocar icono de exportación
3. VERIFICAR: Ver botón violeta "🎨 Modificar PDF"
   ├─ Ubicación: Entre "Vista Previa" y botones PDF/CSV
   ├─ Color: Violeta #6A5ACD
   └─ Icono: Paleta de colores (color-palette)

✓ PASS si el botón es visible
✗ FAIL si no aparece o está en otro lado
```

---

### ✅ Test 2: Modal Abre (30 segundos)
```
1. Desde el modal de exportación
2. Tocar "🎨 Modificar PDF"
3. VERIFICAR: Se abre modal de diseño
   ├─ Título: "Diseño de PDF"
   ├─ Slider de intensidad visible
   ├─ 3 botones de rojo (Fuerte/Medio/Suave)
   └─ 2 switches (fecha y contador)

✓ PASS si el modal abre correctamente
✗ FAIL si crash o no abre
```

---

### ✅ Test 3: PDF Default (1 minuto)
```
OBJETIVO: Verificar que sin tocar nada, el PDF es idéntico

1. Cerrar modal de diseño
2. Tocar botón "PDF"
3. Esperar generación
4. Abrir PDF generado
5. VERIFICAR:
   ├─ Header azul oscuro (#50616D)
   ├─ Resumen violeta INTENSO (opacity ~0.95)
   ├─ Rojos FUERTES en pagos (#C0392B)
   ├─ Footer muestra fecha "Generado el..."
   └─ Footer muestra "Total: X movimientos"

✓ PASS si luce IGUAL que siempre
✗ FAIL si hay diferencias visuales
```

---

### ✅ Test 4: Cambios Aplicados (2 minutos)
```
OBJETIVO: Verificar que los cambios se aplican al PDF

1. Abrir "🎨 Modificar PDF"
2. Cambiar intensidad a 50% (slider al medio)
3. Seleccionar "Rojo Medio" (botón del centro)
4. Desactivar "Mostrar fecha de generación"
5. Tocar "Guardar" → Ver alert de confirmación
6. Tocar "PDF"
7. Abrir PDF generado
8. VERIFICAR:
   ├─ Resumen violeta MÁS TRANSPARENTE (~70% opacity)
   ├─ Rojos MÁS SUAVES en pagos (#E74C3C)
   ├─ Footer SIN fecha "Generado el..."
   └─ Footer SIGUE mostrando "Total: X movimientos"

✓ PASS si todos los cambios son visibles
✗ FAIL si el PDF luce igual o con cambios parciales
```

---

### ✅ Test 5: Persistencia (1 minuto)
```
OBJETIVO: Verificar que los cambios persisten

1. Con los cambios del Test 4 guardados
2. Cerrar COMPLETAMENTE la app (kill process)
3. Reabrir app
4. Ir a exportación → Tocar "PDF" directamente
5. VERIFICAR: PDF tiene los cambios del Test 4
   └─ (Violeta suave + rojos medios + sin fecha)

✓ PASS si los cambios persisten
✗ FAIL si vuelve a defaults
```

---

### ✅ Test 6: Restaurar Defaults (1 minuto)
```
OBJETIVO: Verificar que podemos volver al original

1. Abrir "🎨 Modificar PDF"
2. Tocar botón "↻" (refresh) en el header
3. Confirmar "Restaurar" en el Alert
4. Tocar "Guardar"
5. Tocar "PDF"
6. VERIFICAR: PDF idéntico al Test 3
   └─ (Violeta intenso + rojos fuertes + fecha + contador)

✓ PASS si vuelve al diseño original
✗ FAIL si quedan restos de cambios
```

---

## 📊 Tabla de Resultados

| Test | Descripción | Estado | Notas |
|------|-------------|--------|-------|
| 1 | Botón visible | ⬜ | |
| 2 | Modal abre | ⬜ | |
| 3 | PDF default | ⬜ | |
| 4 | Cambios aplicados | ⬜ | |
| 5 | Persistencia | ⬜ | |
| 6 | Restaurar defaults | ⬜ | |

**Legend**: ⬜ No ejecutado | ✅ PASS | ❌ FAIL

---

## 🔧 Tests Adicionales (Opcionales)

### Test 7: Extremos de Intensidad
```
1. Intensidad 0% → PDF con violeta MUY SUAVE (opacity ~0.45)
2. Intensidad 100% → PDF con violeta MUY INTENSO (opacity ~0.95)
```

### Test 8: Todos los Rojos
```
1. Rojo Fuerte → #C0392B (rojo oscuro intenso)
2. Rojo Medio → #E74C3C (rojo estándar)
3. Rojo Suave → #EC7063 (rosa rojizo)
```

### Test 9: Combinaciones de Switches
```
1. Ambos ON → Footer completo
2. Solo fecha ON → Footer solo "Generado el..."
3. Solo contador ON → Footer solo "Total: X movimientos"
4. Ambos OFF → Footer solo "📱 Generado por Ordénate App"
```

### Test 10: CSV Intacto
```
1. Cambiar preferencias de PDF
2. Exportar CSV
3. VERIFICAR: CSV sin cambios (mismo formato que siempre)
```

---

## 🐛 Reportar Bugs

Si encuentras un problema, anota:

```
Test #: ___
Descripción: ____________
Esperado: _______________
Obtenido: _______________
Logs: ___________________
Screenshots: ____________
```

---

## ✅ Criterios de Éxito Total

**La implementación es exitosa si**:
- ✅ Tests 1-6 pasan al 100%
- ✅ PDF sin cambios es IDÉNTICO al actual
- ✅ Cambios se aplican correctamente
- ✅ Persistencia funciona entre sesiones
- ✅ Restaurar vuelve al original
- ✅ CSV no se afecta

---

## 📸 Capturas Recomendadas

1. **Modal de exportación**: Botón violeta visible
2. **Modal de diseño**: Controles completos
3. **PDF default**: Para comparación futura
4. **PDF personalizado**: Con cambios aplicados
5. **PDF restaurado**: Idéntico al default

---

*Tiempo estimado total: 5-10 minutos*  
*Última actualización: 13 de octubre, 2025*
