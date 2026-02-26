#!/bin/bash

# Start the Vibe Coder multi-agent system

echo "🚀 Starting Vibe Coder Multi-Agent System..."
echo ""

# Start server in background
echo "📡 Starting backend server..."
cd server && node index.js &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 2

# Start client
echo "🎨 Starting frontend..."
cd client && npm run dev

# Cleanup on exit
trap "kill $SERVER_PID" EXIT
