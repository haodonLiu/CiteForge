@echo off
setlocal

echo.
echo ==========================================
echo   CiteForge Build
echo ==========================================
echo.

echo [1/2] Building frontend...
cd /d "%~dp0src"
call npm install --silent
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed
    exit /b 1
)
echo Frontend done
echo.

echo [2/2] Building Tauri exe...
cd /d "%~dp0src-tauri"
call cargo tauri build
if %errorlevel% neq 0 (
    echo Tauri build failed
    exit /b 1
)

echo.
echo ==========================================
echo   Build complete!
echo ==========================================
echo.
echo Output:
echo   Installer: target\release\bundle\nsis\
echo   Binary:    target\release\citeforge-tauri.exe
echo.

explorer "%~dp0target\release\bundle\nsis"

endlocal
