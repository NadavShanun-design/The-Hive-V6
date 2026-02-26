#!/bin/bash

# THE HIVE - Quick Start Script
# Starts the terminal server and optionally OpenClaw gateway

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   🐝 THE HIVE STARTUP 🐝                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter to continue (or Ctrl+C to exit and configure .env first)..."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Ask if user wants to start OpenClaw
echo ""
echo "🦞 Do you want to start the OpenClaw gateway (MOLTBOT)?"
read -p "   (y/n, default: n): " -n 1 -r
echo
START_OPENCLAW=false
if [[ $REPLY =~ ^[Yy]$ ]]; then
    START_OPENCLAW=true
fi

# Check if OpenClaw is installed
if [ "$START_OPENCLAW" = true ]; then
    OPENCLAW_DIR="$HOME/.hive/openclaw"
    if [ ! -d "$OPENCLAW_DIR" ]; then
        echo "⚠️  OpenClaw not found. Running setup script..."
        ./scripts/setup-openclaw.sh
    fi

    echo "🦞 Starting OpenClaw gateway..."
    cd "$OPENCLAW_DIR"
    pnpm openclaw gateway --port 18789 &
    OPENCLAW_PID=$!
    cd "$SCRIPT_DIR"
    echo "✅ OpenClaw gateway started (PID: $OPENCLAW_PID)"
    echo "   Gateway URL: ws://127.0.0.1:18789"
    echo "   Control UI: http://127.0.0.1:18789"
    echo ""
    sleep 2
fi

# Start THE HIVE server
echo "🚀 Starting THE HIVE server..."
echo ""

# Trap Ctrl+C to clean up
cleanup() {
    echo ""
    echo "🛑 Shutting down THE HIVE..."
    if [ -n "$OPENCLAW_PID" ]; then
        echo "   Stopping OpenClaw gateway..."
        kill $OPENCLAW_PID 2>/dev/null || true
    fi
    echo "✅ Shutdown complete"
    exit 0
}

trap cleanup INT TERM

# Start the server
node server-hive.js

# If server exits, clean up
cleanup
