@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   PCA-Lite 打包工具
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo 安装 PyInstaller...
    pip install pyinstaller --quiet
)

:: Build exe
echo 开始打包...
pyinstaller pca_lite.spec --clean

if errorlevel 1 (
    echo.
    echo [错误] 打包失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包完成！
echo   输出目录: dist\
echo ========================================
pause