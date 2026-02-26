#!/bin/bash

# OpenClaw Setup Script for The Hive
# This script clones and sets up OpenClaw gateway for MOLTBOT integration

set -e

OPENCLAW_DIR="$HOME/.hive/openclaw"
OPENCLAW_REPO="https://github.com/openclaw/openclaw"

echo "🦞 OpenClaw Setup for THE HIVE"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version must be 18 or higher"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm -v)"
echo ""

# Create .hive directory if it doesn't exist
if [ ! -d "$HOME/.hive" ]; then
    mkdir -p "$HOME/.hive"
    echo "📁 Created $HOME/.hive directory"
fi

# Clone OpenClaw if not already cloned
if [ -d "$OPENCLAW_DIR" ]; then
    echo "⚠️  OpenClaw already exists at $OPENCLAW_DIR"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Updating OpenClaw..."
        cd "$OPENCLAW_DIR"
        git pull
    else
        echo "ℹ️  Skipping update"
    fi
else
    echo "📥 Cloning OpenClaw from $OPENCLAW_REPO..."
    git clone "$OPENCLAW_REPO" "$OPENCLAW_DIR"
    echo "✅ OpenClaw cloned successfully"
fi

# Navigate to OpenClaw directory
cd "$OPENCLAW_DIR"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Build the UI
echo ""
echo "🔨 Building OpenClaw UI..."
pnpm ui:build

# Build the project
echo ""
echo "🔨 Building OpenClaw..."
pnpm build

# Check if OpenClaw daemon is already installed
if [ -f "$HOME/.openclaw/openclaw.json" ]; then
    echo ""
    echo "✅ OpenClaw daemon configuration found"
else
    echo ""
    echo "🔧 Setting up OpenClaw daemon..."
    pnpm openclaw onboard --install-daemon
fi

echo ""
echo "╔═════════════════════════════════════════════════════════════╗"
echo "║           🦞 OpenClaw Setup Complete! 🦞                    ║"
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 OpenClaw installed at: $OPENCLAW_DIR"
echo ""
echo "🚀 To start the OpenClaw gateway:"
echo "   cd $OPENCLAW_DIR"
echo "   pnpm openclaw gateway --port 18789"
echo ""
echo "   Or use the convenience script:"
echo "   ./scripts/start-openclaw-gateway.sh"
echo ""
echo "🐝 THE HIVE will automatically connect to the gateway at:"
echo "   ws://127.0.0.1:18789"
echo ""
echo "📖 OpenClaw docs: https://github.com/openclaw/openclaw"
echo ""
