@echo off
echo ============================================
echo    L.SISTEM - Gestao de Leads
echo ============================================
echo.
echo Iniciando o sistema...
echo.

start "Backend - API" cmd /k "cd /d %~dp0backend && node index.js"
timeout /t 2 /nobreak >nul
start "Frontend - Interface" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Sistema iniciado!
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pressione qualquer tecla para fechar este aviso...
pause >nul
