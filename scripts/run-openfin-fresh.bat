@echo off
echo Clearing OpenFin cache and restarting...

REM Kill OpenFin processes
taskkill /F /IM OpenFin.exe /T 2>nul
taskkill /F /IM OpenFinRVM.exe /T 2>nul
timeout /t 2 /nobreak >nul

REM Clear cache
rd /s /q "%LOCALAPPDATA%\OpenFin\cache" 2>nul

REM Launch fresh
echo Starting OpenFin...
node scripts/launch-openfin.mjs