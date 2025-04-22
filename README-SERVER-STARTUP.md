# Local SQL Server Startup Guide

This guide explains how to use the provided batch scripts to automatically run the Local SQL Server when Windows starts.

## Files Included

- `start-server.bat` - Script to start the server (with auto-installation of dependencies)
- `setup-startup.bat` - Script to configure the server to start automatically with Windows

## Quick Start

1. **Run the server manually:**
   - Double-click `start-server.bat`
   - The server will start and remain running in the command window

2. **Set up automatic startup:**
   - Double-click `setup-startup.bat`
   - This creates a shortcut in your Windows Startup folder
   - The server will start automatically when you log into Windows

## What These Scripts Do

### start-server.bat

This script:
- Checks if Node.js is installed and installs it if needed
- Installs npm dependencies if they're missing
- Checks if port 3001 is already in use, and if so:
  - Finds the process using that port
  - Terminates the process
  - Waits for the port to be available
- Starts the Local SQL Server

### setup-startup.bat

This script:
- Creates a shortcut to the start-server.bat file in your Windows Startup folder
- Ensures the server starts automatically when you log into Windows
- The shortcut is configured to run minimized

## Requirements

- Windows 10 or later
- Administrator privileges (for Node.js installation if needed)
- Internet connection (for downloading Node.js if needed)

## Troubleshooting

- **Script fails to start the server:**
  - Run Command Prompt as administrator
  - Navigate to the script directory
  - Run `start-server.bat` manually to see detailed error messages

- **Server doesn't start automatically:**
  - Check if the shortcut exists in: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`
  - Try running `setup-startup.bat` again as administrator

- **Node.js installation fails:**
  - Download and install Node.js manually from https://nodejs.org/
  - Run `start-server.bat` again after installation

## Manual Removal

If you want to stop the server from starting automatically:
1. Press `Win + R`, type `shell:startup` and press Enter
2. Delete the `LocalSQLServer.lnk` shortcut 