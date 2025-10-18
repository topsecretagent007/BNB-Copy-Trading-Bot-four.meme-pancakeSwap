#!/bin/bash

# BNB Copy Trading Bot Setup Script
# This script helps you set up the bot quickly

echo "🤖 BNB Copy Trading Bot Setup"
echo "=============================="
echo ""

# Check Node.js version
echo "1. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js >= 18.0.0 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"
echo ""

# Install dependencies
echo "2. Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "3. Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "3. .env file already exists"
    echo "⚠️  Skipping .env creation"
fi
echo ""

# Build the project
echo "4. Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Project built successfully"
echo ""

# Create logs directory
echo "5. Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory ready"
echo ""

echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Add your PRIVATE_KEY and WALLET_ADDRESS"
echo "3. Add TARGET_WALLETS you want to copy"
echo "4. (Optional) Add Telegram bot credentials"
echo ""
echo "Then start the bot with:"
echo "  npm start"
echo ""
echo "For more help, see SETUP_GUIDE.md"

