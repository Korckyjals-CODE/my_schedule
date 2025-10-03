@echo off
REM Test 1.2 Medium-Priority Refactoring Verification - Automated Test Suite Runner
REM This script runs the medium-priority refactoring verification tests

echo.
echo ========================================
echo Test 1.2 Medium-Priority Refactoring Verification
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Check if we're in the correct directory
if not exist "test_1_2_mp_refactoring_verification.js" (
    echo ❌ Test files not found in current directory
    echo Please run this script from the tests/group_1 directory
    pause
    exit /b 1
)

echo ✅ Test files found

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Check if server is running
echo 🔍 Checking if server is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Server is not running on localhost:3000
    echo Please start the server first:
    echo   cd ../../
    echo   node src/server.js
    echo.
    echo Running simplified tests instead (no server required)...
    echo.
    node test_1_2_mp_simplified_verification.js
    goto :end
) else (
    echo ✅ Server is running
)

REM Set environment variables for testing
set NODE_ENV=development
set DISABLE_EMAIL_CONFIRMATION=true

REM Run the test suite
echo 🧪 Running automated test suite...
node test_1_2_mp_refactoring_verification.js

REM Check exit code
if %errorlevel% equ 0 (
    echo ✅ Test suite completed successfully
) else (
    echo ❌ Test suite failed with exit code %errorlevel%
)

:end
echo.
echo ========================================
echo Test completed
echo ========================================
pause
