#!/bin/bash

# THE HIVE + MOLTBOT - Complete Startup Script
# This script starts THE HIVE with the real MOLTBOT agent

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🐝 THE HIVE + MOLTBOT STARTUP 🦞                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if processes are already running
if lsof -ti:18789 > /dev/null 2>&1; then
    echo "⚠️  Port 18789 already in use. Killing existing process..."
    lsof -ti:18789 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3002 > /dev/null 2>&1; then
    echo "⚠️  Port 3002 already in use. Killing existing process..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "🚀 Starting THE HIVE components..."
echo ""

# 1. Start OpenClaw Gateway
echo "[1/3] 🦞 Starting OpenClaw Gateway..."
cd "$SCRIPT_DIR/openclaw"
pnpm gateway:dev > /tmp/openclaw-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "      PID: $GATEWAY_PID"
echo "      Log: /tmp/openclaw-gateway.log"

# Wait for gateway to be ready
echo "      Waiting for gateway..."
for i in {1..15}; do
    if lsof -i:18789 | grep -q LISTEN; then
        echo "      ✅ Gateway ready on port 18789"
        break
    fi
    sleep 1
done

# 2. Start THE HIVE Server
echo ""
echo "[2/3] 🐝 Starting THE HIVE Server..."
cd "$SCRIPT_DIR"
node server-hive.js > /tmp/hive-server.log 2>&1 &
HIVE_PID=$!
echo "      PID: $HIVE_PID"
echo "      Log: /tmp/hive-server.log"

# Wait for HIVE to be ready
echo "      Waiting for HIVE server..."
for i in {1..10}; do
    if lsof -i:3002 | grep -q LISTEN; then
        echo "      ✅ HIVE ready on port 3002"
        break
    fi
    sleep 1
done

# 3. Start MOLTBOT (Real Agent with Screen Access)
echo ""
echo "[3/3] 🤖 Starting MOLTBOT (Real Agent with Screen Access)..."
echo "      This is the agent that can see your screen!"
echo "      Model: Claude Opus 4.5"
echo "      Capabilities: Screen capture via Peekaboo"
echo ""
echo "      To interact with MOLTBOT:"
echo "      - Use THE HIVE UI at http://localhost:3002/hive.html"
echo "      - Or run: pnpm openclaw agent --session-id 'hive-moltbot' --message 'your message' --local"
echo ""

# Note: MOLTBOT runs interactively, so we don't background it here
# The user can start it separately when needed, or integrate it differently

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ THE HIVE IS ONLINE!                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 URLs:"
echo "   • THE HIVE Dashboard: http://localhost:3002/hive.html"
echo "   • OpenClaw Gateway:   http://localhost:18789"
echo ""
echo "📊 Running Processes:"
echo "   • OpenClaw Gateway:  PID $GATEWAY_PID (port 18789)"
echo "   • HIVE Server:       PID $HIVE_PID (port 3002)"
echo ""
echo "🦞 To start MOLTBOT with screen access:"
echo "   cd $SCRIPT_DIR/openclaw"
echo "   pnpm openclaw agent --session-id 'hive-moltbot' --message 'Hello!' --local"
echo ""
echo "🛑 To stop THE HIVE:"
echo "   kill $GATEWAY_PID $HIVE_PID"
echo ""

# Open browser
sleep 2
open "http://localhost:3002/hive.html"

echo "✅ Browser opened. THE HIVE is ready!"
echo ""
echo "Press Ctrl+C to view this info again, or run 'kill $GATEWAY_PID $HIVE_PID' to stop."
echo ""

# Keep script running
tail -f /dev/null
