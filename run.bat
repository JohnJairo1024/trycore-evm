@echo off
setlocal enabledelayedexpansion
title EVM Dashboard API - Backend
echo ============================================
echo   EVM Dashboard API - Backend
echo ============================================
echo.

cd /d "%~dp0evm-api"

:: ── Liberar puerto 8000 si está ocupado ──
echo [INFO] Verificando puerto 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [WARN] Puerto 8000 ocupado por PID: %%a. Deteniendo...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Proceso %%a detenido.
    ) else (
        echo [WARN] No se pudo detener el PID %%a. Continuando...
    )
)
timeout /t 2 /nobreak >nul
echo.

:: ── Verificar entorno virtual ──
IF NOT EXIST "venv\Scripts\activate.bat" (
    echo [ERROR] No se encuentra el entorno virtual.
    echo Ejecuta primero: python -m venv venv
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo [OK] Entorno virtual activado
echo.

set DATABASE_URL=postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database

echo [OK] Conectando a PostgreSQL: evm_database
echo.
echo ============================================
echo   Servidor iniciado en:
echo   http://127.0.0.1:8000
echo   http://127.0.0.1:8000/api-docs
echo ============================================
echo.

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

pause
