@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   PCA-Lite 一键启动器
echo ========================================
echo.

:: Check Python version
python --version 2>nul
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check Python version (need 3.10+)
for /f "tokens=2" %%i in ('python --version 2^&1') do set PYVER=%%i
echo 检测到 Python 版本: %PYVER%

:: Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Create venv if not exists
if not exist ".venv" (
    echo.
    echo 正在创建虚拟环境...
    python -m venv .venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
)

:: Activate venv
echo 激活虚拟环境...
call .venv\Scripts\activate.bat

:: Upgrade pip
echo 升级 pip...
python -m pip install --upgrade pip --quiet

:: Install dependencies
echo 安装依赖...
pip install -e . --quiet
pip install ttkbootstrap --quiet

:: Launch GUI
echo 启动 GUI...
python -m launcher.main_launcher

if errorlevel 1 (
    echo.
    echo [错误] 启动失败，请检查错误信息
    pause
)