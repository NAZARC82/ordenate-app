# 🔧 COMANDOS PASO A PASO - SOLUCIÓN MANUAL

## EJECUTAR EN POWERSHELL (Administrador)

### PASO 1: DETENER PROCESOS
```powershell
# Detener cualquier proceso de Node/Expo
taskkill /F /IM node.exe /T
Start-Sleep -Seconds 2
```

### PASO 2: LIMPIEZA PROFUNDA
```powershell
# Ir al directorio del proyecto
cd C:\Users\59895\Ordenate\frontend\ordenate-app

# Eliminar node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Eliminar package-lock.json
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Eliminar cachés de Expo y Metro
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue

# Limpiar caché de npm
npm cache clean --force
npm cache verify
```

### PASO 3: REINSTALAR DEPENDENCIAS BASE
```powershell
# Instalar todas las dependencias
npm install
```

### PASO 4: INSTALAR REACT-REFRESH (CRÍTICO)
```powershell
# Esta es la dependencia faltante que causa el error
npm install --save-dev react-refresh@^0.14.0
```

### PASO 5: CORREGIR VERSIONES DE JEST
```powershell
# Downgrade de Jest a versión compatible con Expo SDK 54
npm install --save-dev jest@29.7.0 @types/jest@29.5.14
```

### PASO 6: ACTUALIZAR EXPO (OPCIONAL PERO RECOMENDADO)
```powershell
# Actualizar a última versión de Expo SDK 54
npm install expo@54.0.13 expo-file-system@~19.0.17 expo-font@~14.0.9
```

### PASO 7: VERIFICAR INSTALACIÓN
```powershell
# Verificar que react-refresh esté instalado
npm list react-refresh

# Debería mostrar:
# react-refresh@0.14.x
```

### PASO 8: INICIAR PROYECTO LIMPIO
```powershell
# Iniciar con caché limpio
npx expo start -c
```

---

## COMANDOS RÁPIDOS (UNA LÍNEA)

Si prefieres ejecutar todo en secuencia:

```powershell
cd C:\Users\59895\Ordenate\frontend\ordenate-app; taskkill /F /IM node.exe /T; Remove-Item -Recurse -Force node_modules, package-lock.json, .expo -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npm install --save-dev react-refresh@^0.14.0 jest@29.7.0 @types/jest@29.5.14; npm install expo@54.0.13; npx expo start -c
```

---

## VERIFICACIÓN DE ÉXITO

Después de ejecutar los comandos, deberías ver:

✅ **En terminal:**
```
Starting Metro Bundler
✓ Metro waiting on exp://...
✓ Using Expo Go
```

✅ **Sin errores de:**
- `Cannot find module 'react-refresh/babel'`
- `Expected version` warnings

---

## SI PERSISTE EL ERROR

### Plan B - Reinstalación completa de Babel:
```powershell
npm install --save-dev @babel/core@^7.20.0 babel-preset-expo@^54.0.0 react-refresh@^0.14.0
npx expo start -c
```

### Plan C - Verificar babel.config.js:
Asegurarte que solo tenga:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```
