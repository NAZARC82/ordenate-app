@echo off
REM ========================================
REM SCRIPT DE LIMPIEZA Y REPARACIÓN EXPO
REM Error: "Cannot find module 'react-refresh/babel'"
REM ========================================

echo.
echo ============================================
echo  PASO 1: LIMPIEZA COMPLETA DE PROYECTO
echo ============================================
echo.

REM Detener cualquier proceso de Metro/Expo
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Eliminar node_modules
echo [1/6] Eliminando node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo OK: node_modules eliminado
) else (
    echo OK: node_modules no existe
)

REM Eliminar package-lock.json
echo [2/6] Eliminando package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json
    echo OK: package-lock.json eliminado
) else (
    echo OK: package-lock.json no existe
)

REM Limpiar caché de npm
echo [3/6] Limpiando caché de npm...
call npm cache clean --force
echo OK: Caché de npm limpiado

REM Limpiar caché de Metro Bundler
echo [4/6] Limpiando caché de Metro...
if exist .expo (
    rmdir /s /q .expo
    echo OK: .expo eliminado
)

REM Limpiar caché de Babel
echo [5/6] Limpiando caché de Babel...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo OK: node_modules\.cache eliminado
)

echo [6/6] Limpieza global de temporales...
call npm cache verify
echo.

echo ============================================
echo  PASO 2: INSTALACIÓN DE DEPENDENCIAS
echo ============================================
echo.

echo [1/3] Instalando dependencias base...
call npm install

echo.
echo [2/3] Instalando react-refresh (CRÍTICO)...
call npm install --save-dev react-refresh@^0.14.0

echo.
echo [3/3] Corrigiendo versiones de Jest...
call npm install --save-dev jest@29.7.0 @types/jest@29.5.14

echo.
echo ============================================
echo  PASO 3: ACTUALIZAR EXPO
echo ============================================
echo.

echo Actualizando Expo a SDK 54 (versión recomendada)...
call npm install expo@54.0.13 expo-file-system@~19.0.17 expo-font@~14.0.9

echo.
echo ============================================
echo  PASO 4: VERIFICACIÓN
echo ============================================
echo.

echo Verificando instalación de react-refresh...
call npm list react-refresh

echo.
echo ============================================
echo  PASO 5: INICIAR PROYECTO LIMPIO
echo ============================================
echo.

echo Iniciando Expo con caché limpio...
call npx expo start -c

echo.
echo ============================================
echo  PROCESO COMPLETADO
echo ============================================
