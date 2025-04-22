@echo off
echo Setting up Local SQL Server to run at startup...

:: Get the full path of the start-server.bat file
set "SCRIPT_PATH=%~dp0start-server.bat"

:: Create a shortcut in the Windows Startup folder
echo Creating startup shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Startup') + '\LocalSQLServer.lnk'); $Shortcut.TargetPath = '%SCRIPT_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.WindowStyle = 7; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo Success! The server will now start automatically when Windows boots.
    echo Shortcut created at: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LocalSQLServer.lnk
) else (
    echo Failed to create startup shortcut. Please check permissions and try again.
)

pause 