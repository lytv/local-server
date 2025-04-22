@echo off
echo Starting MSSQL Connector on port 3002...
echo =======================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed!
    pause
    exit /b 1
)

:: Check if mssql package is installed
IF NOT EXIST "node_modules\mssql" (
    echo Installing required dependencies...
    call npm install mssql express cors
)

:: Check if something is running on port 3002
set PORT=3002
netstat -ano | findstr ":%PORT%" > nul
if %ERRORLEVEL% EQU 0 (
    echo Port %PORT% is in use. Terminating the process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%"') do (
        taskkill /F /PID %%a
        echo Process with PID %%a terminated.
        timeout /t 2 /nobreak > nul
    )
) else (
    echo Port %PORT% is available.
)

echo Starting MSSQL connector...
node mssql-connector.js

pause
