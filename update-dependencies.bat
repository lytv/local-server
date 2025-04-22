@echo off
echo Updating SQL Server dependencies...
echo ==================================
echo.

cd /d "%~dp0"

echo Uninstalling current odbc package...
call npm uninstall odbc

echo Installing specific version of odbc module...
call npm install odbc@2.4.7

echo Installing mssql package for alternative connection method...
call npm install mssql

echo Creating direct connection test file...
echo.

echo Dependencies updated!
echo Now please run test-connection.bat to verify your connection
pause
