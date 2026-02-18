@echo off
title Lucid LoFi Space - Starting...
echo ===================================================
echo       LUCID LOFI SPACE - STARTUP SCRIPT
echo ===================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "node_modules" (
    echo [INFO] First time setup detected. Installing specific dependencies...
    echo [INFO] This might take a few minutes. Please wait.
    call npm install
    call npm install lucide-react clsx tailwind-merge
) else (
    echo [INFO] Dependencies found. Starting app...
)

echo.
echo [INFO] Starting Development Server...
echo [INFO] The app will open in your browser automatically when ready.
echo.

start "" "http://localhost:3000"
call npm run dev

pause
