@echo off
title EVM Dashboard - Detener Backend
echo ============================================
echo   Deteniendo EVM Dashboard API...
echo ============================================
echo.

for /f "tokens=2 delims= " %%a in ('tasklist ^| findstr /i "python"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] Servidor detenido.
echo.
pause
