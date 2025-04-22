@echo off
echo Starting Local SQL Server...

:: Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Downloading and installing Node.js...
    
    :: Create a temporary directory for downloads
    mkdir "%TEMP%\node-install" 2> nul
    cd /d "%TEMP%\node-install"
    
    :: Download Node.js installer
    echo Downloading Node.js installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi' -OutFile 'node-installer.msi'}"
    
    if not exist "node-installer.msi" (
        echo Failed to download Node.js installer. Please install Node.js manually.
        pause
        exit /b 1
    )
    
    :: Install Node.js silently
    echo Installing Node.js...
    msiexec /i node-installer.msi /qn
    
    :: Wait for installation to complete
    timeout /t 10 /nobreak > nul
    
    :: Clean up
    cd /d "%~dp0"
    rmdir /s /q "%TEMP%\node-install" 2> nul
    
    :: Verify installation
    node --version > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Node.js installation failed. Please install Node.js manually.
        pause
        exit /b 1
    )
    
    echo Node.js installed successfully.
)

:: Navigate to the project directory
cd /d "%~dp0"

:: Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install npm dependencies.
        pause
        exit /b 1
    )
    
    echo Dependencies installed successfully.
)

:: Check if something is running on port 3001
set PORT=3001
netstat -ano | findstr ":%PORT%" > nul
if %ERRORLEVEL% EQU 0 (
    echo Port %PORT% is in use. Terminating the process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%"') do (
        taskkill /F /PID %%a
        echo Process with PID %%a terminated.
        :: Give some time for the process to fully terminate
        timeout /t 2 /nobreak > nul
    )
) else (
    echo Port %PORT% is available.
)

:: Start the server
echo Starting server on port %PORT%...
call npm run start

:: The script will remain running while the server is active 