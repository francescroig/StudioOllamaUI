@echo off
setlocal enabledelayedexpansion

title StudioOllamaUI - Iniciando

cls
echo.
echo ============================================
echo    STUDIO OLLAMA UI v1.0
echo    Iniciando servicios...
echo ============================================
echo.

for %%i in ("%~dp0..") do set "SCRIPT_DIR=%%~fi"

set OLLAMA_DIR=%SCRIPT_DIR%\ollama
set MODELOS_DIR=%OLLAMA_DIR%\.ollama\models

set FRONTEND_DIR=%SCRIPT_DIR%\frontend
set NODE_DIR=%SCRIPT_DIR%\Progs
set WORK_DIR=%SCRIPT_DIR%\work

if not exist "%WORK_DIR%" mkdir "%WORK_DIR%"

set OLLAMA_MODELS=%MODELOS_DIR%
set PATH=%NODE_DIR%;%OLLAMA_DIR%;%PATH%

echo Paso 1: Verificando componentes...
echo.

if not exist "%OLLAMA_DIR%\ollama.exe" (
    echo ERROR: Ollama no encontrado
    pause
    exit /b 1
)
echo OK - Ollama

if not exist "%MODELOS_DIR%" (
    echo ERROR: Modelos no encontrados
    pause
    exit /b 1
)
echo OK - Modelos

if not exist "%NODE_DIR%\nodejs-portable.exe" (
    echo ERROR: Node.js no encontrado
    pause
    exit /b 1
)
echo OK - Node.js

if not exist "%FRONTEND_DIR%\package.json" (
    echo ERROR: Frontend no encontrado
    pause
    exit /b 1
)
echo OK - Frontend

echo.
echo Paso 2: Instalando dependencias (primera vez)...
echo.

if not exist "%FRONTEND_DIR%\node_modules" (
    cd /d "%FRONTEND_DIR%"
    call npm install >nul 2>&1
    echo OK - Dependencias frontend
)

if not exist "%FRONTEND_DIR%\server\node_modules" (
    cd /d "%FRONTEND_DIR%\server"
    call npm install >nul 2>&1
    echo OK - Dependencias servidor
)

echo.
echo Paso 3: Iniciando servicios...
echo.

cd /d "%WORK_DIR%"

echo Iniciando Ollama...
start "StudioOllamaUI-Ollama" cmd /k "cd /d "%OLLAMA_DIR%" && ollama serve"
timeout /t 3 /nobreak >nul

echo Iniciando servidor de archivos...
start "StudioOllamaUI-FileServer" cmd /k "cd /d "%FRONTEND_DIR%\server" && npm run dev"
timeout /t 2 /nobreak >nul

echo Iniciando frontend...
start "StudioOllamaUI-Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Paso 4: Abriendo navegador...
echo.

timeout /t 2 /nobreak >nul

if exist "%SCRIPT_DIR%\FirefoxPortable\FirefoxPortable.exe" (
    start "" "%SCRIPT_DIR%\FirefoxPortable\FirefoxPortable.exe" "http://localhost:5173"
)

echo.
echo ============================================
echo    STUDIO OLLAMA UI INICIADO
echo.
echo Accesos:
echo - Frontend:    http://localhost:5173
echo - Ollama API:  http://localhost:11434
echo - File Server: http://localhost:3001
echo.
echo Cuando termines, cierra Firefox
echo Los servicios se detendran automaticamente
echo ============================================
echo.

REM Esperar a que se cierre Firefox
:esperar_firefox
tasklist | findstr /I "firefox" >nul
if !errorlevel! equ 0 (
    timeout /t 2 /nobreak >nul
    goto esperar_firefox
)

REM Firefox se cerro, matar todos los servicios
echo.
echo Firefox cerrado. Deteniendo servicios...
echo.

taskkill /IM ollama.exe /F /T >nul 2>&1
taskkill /IM node.exe /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq StudioOllamaUI*" /T >nul 2>&1

echo Hecho. StudioOllamaUI se ha cerrado.
timeout /t 2 /nobreak >nul
exit /b 0
