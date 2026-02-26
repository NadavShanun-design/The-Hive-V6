#!/bin/bash

echo "🤖 Claude Code Multi-Agent System"
echo "=================================="
echo ""
echo "This script will help you start the REAL agent system"
echo "with actual Claude Code CLI instances."
echo ""
echo "⚠️  REQUIREMENTS:"
echo "   - You must have 'claude' command available"
echo "   - You must have authenticated with 'claude auth'"
echo "   - You need 11 terminal windows/tabs"
echo ""
echo "📋 WHAT WILL START:"
echo "   1. Server (1 terminal)"
echo "   2. Master Agent (2 terminals: bridge + claude)"
echo "   3. Coder Agent (2 terminals: bridge + claude)"
echo "   4. Researcher Agent (2 terminals: bridge + claude)"
echo "   5. Tester Agent (2 terminals: bridge + claude)"
echo "   6. File Manager Agent (2 terminals: bridge + claude)"
echo "   TOTAL: 11 terminals"
echo ""
echo "📖 See START_AGENTS.md for detailed instructions"
echo ""

read -p "Press Enter to start the server..."

cd /path/to/hive/server
echo "🌐 Starting server on port 3002..."
node real-agents-server.js
