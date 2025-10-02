#!/bin/bash

# Test 1.2 Refactoring Verification Runner
# This script sets up and runs the automated test suite

echo "🚀 Starting Test 1.2 Refactoring Verification..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to test directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if the application is running
echo "🔍 Checking if application is running on localhost:3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Application is not running on localhost:3000"
    echo "Please start your application first:"
    echo "  npm start"
    echo "  or"
    echo "  node src/server.js"
    exit 1
fi

echo "✅ Application is running"

# Set environment variables for testing
export NODE_ENV=development
export DISABLE_EMAIL_CONFIRMATION=true

# Run the test suite
echo "🧪 Running automated test suite..."
node test_1_2_hp_refactoring_verification.js

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Test suite completed successfully"
else
    echo "❌ Test suite failed"
    exit 1
fi
