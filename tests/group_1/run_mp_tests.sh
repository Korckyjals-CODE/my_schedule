#!/bin/bash
# Test 1.2 Medium-Priority Refactoring Verification - Automated Test Suite Runner
# This script runs the medium-priority refactoring verification tests

echo ""
echo "========================================"
echo "Test 1.2 Medium-Priority Refactoring Verification"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed"

# Check if we're in the correct directory
if [ ! -f "test_1_2_mp_refactoring_verification.js" ]; then
    echo "❌ Test files not found in current directory"
    echo "Please run this script from the tests/group_1 directory"
    exit 1
fi

echo "✅ Test files found"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Server is not running on localhost:3000"
    echo "Please start the server first:"
    echo "  cd ../../"
    echo "  node src/server.js"
    echo ""
    echo "Running simplified tests instead (no server required)..."
    echo ""
    node test_1_2_mp_simplified_verification.js
    exit $?
else
    echo "✅ Server is running"
fi

# Set environment variables for testing
export NODE_ENV=development
export DISABLE_EMAIL_CONFIRMATION=true

# Run the test suite
echo "🧪 Running automated test suite..."
node test_1_2_mp_refactoring_verification.js

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Test suite completed successfully"
else
    echo "❌ Test suite failed with exit code $?"
fi

echo ""
echo "========================================"
echo "Test completed"
echo "========================================"
