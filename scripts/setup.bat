@echo off
REM BNB Copy Trading Bot Setup Script for Windows

echo ========================================
echo  BNB Copy Trading Bot Setup
echo ========================================
echo.

REM Check Node.js
echo 1. Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed
    echo Please install Node.js ^>= 18.0.0 from https://nodejs.org/
    pause
    exit /b 1
)

node -v
echo Node.js found
echo.

REM Install dependencies
echo 2. Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo X Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed
echo.

REM Create .env file
echo 3. Setting up configuration...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo .env file created from .env.example
    ) else (
        echo X .env.example not found
        pause
        exit /b 1
    )
) else (
    echo .env file already exists
    echo Skipping .env creation
)
echo.

REM Build project
echo 4. Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo X Build failed
    pause
    exit /b 1
)
echo Project built successfully
echo.

REM Create logs directory
echo 5. Creating logs directory...
if not exist logs mkdir logs
echo Logs directory ready
echo.

echo ========================================
echo  Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Add your PRIVATE_KEY and WALLET_ADDRESS
echo 3. Add TARGET_WALLETS you want to copy
echo 4. ^(Optional^) Add Telegram bot credentials
echo.
echo Then start the bot with:
echo   npm start
echo.
echo For more help, see SETUP_GUIDE.md
echo.
pause

