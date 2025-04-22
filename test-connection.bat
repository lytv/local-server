@echo off
echo SQL Connection Tester
echo ===================
echo.

cd /d "%~dp0"
set /p CONNECTION_STRING=Enter your connection string (e.g. Server=localhost;Database=ERPYamato;User ID=sa;Password=yourpassword;): 

echo.
echo Testing SQL connection...
node test-sql-connection.js "%CONNECTION_STRING%"

echo.
echo Test complete!
pause
