@echo off
echo ===============================
echo SQL Server ODBC Driver Checker
echo ===============================
echo.

echo Listing all installed ODBC drivers:
echo ----------------------------------
odbcconf /q /s
echo.

echo Checking for SQL Server Native Client:
echo -------------------------------------
reg query "HKLM\SOFTWARE\ODBC\ODBCINST.INI" /s | findstr /i "SQL Server" 
echo.

echo Checking Node.js version:
echo ------------------------
node --version
echo.

echo Checking ODBC module:
echo -------------------
cd /d "%~dp0"
echo Installing odbc-test if needed...
call npm install odbc-test --save
echo.
echo Running ODBC test...
node -e "try { const odbc = require('odbc'); console.log('ODBC module version:', odbc.version); } catch(e) { console.error('Error loading ODBC module:', e.message); }"
echo.

echo Setting debug environment variables:
echo ----------------------------------
set NODE_ENV=development
set DEBUG=odbc*,sql*

echo DEBUGGING COMPLETE
echo =================
echo If you see errors above, you may need to:
echo 1. Install SQL Server Native Client: https://www.microsoft.com/en-us/download/details.aspx?id=50402
echo 2. Ensure all ODBC dependencies are properly installed
echo.

pause
