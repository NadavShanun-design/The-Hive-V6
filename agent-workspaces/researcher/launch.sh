#!/bin/bash
# Launcher for RESEARCHER Agent
# This will start Claude Code CLI for this agent

echo "🤖 Starting RESEARCHER Agent..."
echo "📁 Workspace: $(cd "$(dirname "$0")"; pwd)"
echo ""
echo "⚠️  IMPORTANT: You need to authenticate with Claude Code CLI"
echo "   Run 'claude auth' if you haven't already"
echo ""
echo "This agent will:"
echo "  - Listen for messages from other agents"
echo "  - Communicate with the master agent"
echo "  - Have access to files in: $(cd "$(dirname "$0")"; pwd)"
echo ""
echo "Press Enter to start Claude Code CLI..."
read

cd "$(cd "$(dirname "$0")"; pwd)"

# Start Claude Code in this directory
claude
