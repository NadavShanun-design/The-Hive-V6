#!/bin/bash

# Start OpenClaw Gateway for THE HIVE

OPENCLAW_DIR="$HOME/.hive/openclaw"
GATEWAY_PORT=18789

echo "🦞 Starting OpenClaw Gateway..."
echo ""

if [ ! -d "$OPENCLAW_DIR" ]; then
    echo "❌ Error: OpenClaw not found at $OPENCLAW_DIR"
    echo "Please run: ./scripts/setup-openclaw.sh first"
    exit 1
fi

cd "$OPENCLAW_DIR"

echo "🌐 Gateway URL: ws://127.0.0.1:$GATEWAY_PORT"
echo "🎛️  Control UI: http://127.0.0.1:18789"
echo ""
echo "Press Ctrl+C to stop the gateway"
echo ""

pnpm openclaw gateway --port $GATEWAY_PORT
