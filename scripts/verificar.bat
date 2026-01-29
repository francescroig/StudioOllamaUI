@echo off
echo.
echo ================================================
echo   Verificacion de StudioOllamaUI
echo ================================================
echo.

cd /d "%~dp0..\frontend"

echo Verificando dependencias...
echo.

if not exist "node_modules" (
    echo [INSTALANDO] Dependencias del frontend...
    call npm install
) else (
    echo [OK] Dependencias del frontend
)

if not exist "server\node_modules" (
    echo [INSTALANDO] Dependencias del servidor...
    cd server
    call npm install
    cd ..
) else (
    echo [OK] Dependencias del servidor
)

echo.
echo Compilando servidor...
cd server
call npx tsc
cd ..

echo.
echo ================================================
echo   Verificacion completa
echo ================================================
echo.
echo Puedes ejecutar "iniciar .bat" ahora
echo.
pause