@echo off
setlocal enabledelayedexpansion

echo Windows Startup Item Removal Tool
echo ================================
echo.

:: Ask for the name of the startup item to remove
set /p "item_name=Enter the name of the startup item to remove: "

:: Check if the item exists in the common startup locations
set found=0

:: Check user's startup folder
echo Checking user startup folder...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\%item_name%.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\%item_name%.lnk"
    echo Removed from user startup folder.
    set found=1
)

:: Check all users startup folder
echo Checking all users startup folder...
if exist "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Startup\%item_name%.lnk" (
    del "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Startup\%item_name%.lnk"
    echo Removed from all users startup folder.
    set found=1
)

:: Check registry Run key (current user)
echo Checking registry Run key (current user)...
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%item_name%" >nul 2>&1
if %errorlevel% equ 0 (
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%item_name%" /f
    echo Removed from registry Run key (current user).
    set found=1
)

:: Check registry Run key (local machine)
echo Checking registry Run key (local machine)...
reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "%item_name%" >nul 2>&1
if %errorlevel% equ 0 (
    reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "%item_name%" /f
    echo Removed from registry Run key (local machine).
    set found=1
)

:: Display results
if %found% equ 1 (
    echo.
    echo Startup item "%item_name%" has been successfully removed.
) else (
    echo.
    echo No startup item with the name "%item_name%" was found.
    echo Check the exact name of the startup item and try again.
)

echo.
pause 