@echo off
REM Test 1.2 Refactoring Verification Runner for Windows
REM This script sets up and runs the automated test suite

echo 🚀 Starting Test 1.2 Refactoring Verification...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Navigate to test directory
cd /d "%~dp0"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing test dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
)

REM Check if the application is running
echo 🔍 Checking if application is running on localhost:3000...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Application is not running on localhost:3000
    echo Please start your application first:
    echo   npm start
    echo   or
    echo   node src/server.js
    exit /b 1
)

echo ✅ Application is running

REM Set environment variables for testing
set NODE_ENV=development
set DISABLE_EMAIL_CONFIRMATION=true

REM Run the test suite
echo 🧪 Running automated test suite...
node test_1_2_hp_refactoring_verification.js

REM Check exit code
if %errorlevel% equ 0 (
    echo ✅ Test suite completed successfully
) else (
    echo ❌ Test suite failed
    exit /b 1
)
