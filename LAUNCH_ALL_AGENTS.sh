#!/bin/bash

echo "🚀 Launching All Claude Code CLI Agents!"
echo ""
echo "This will open 5 terminal windows, each running Claude Code CLI"
echo "in a different agent workspace."
echo ""
echo "⚠️  Make sure you have authenticated with 'claude auth' first!"
echo ""
read -p "Press Enter to launch all agents..."

# Function to open new terminal and run claude
open_agent_terminal() {
    local agent_name=$1
    local workspace="/path/to/hive/agent-workspaces/$agent_name"

    osascript <<EOF
tell application "Terminal"
    activate
    set newTab to do script "cd $workspace && echo '🤖 $agent_name Agent' && echo 'Running Claude Code CLI in: $workspace' && echo '' && claude"
    set custom title of newTab to "$agent_name Agent"
end tell
EOF

    sleep 1
}

echo "🤖 Launching Master Agent..."
open_agent_terminal "master"

echo "💻 Launching Coder Agent..."
open_agent_terminal "coder"

echo "🔍 Launching Researcher Agent..."
open_agent_terminal "researcher"

echo "🧪 Launching Tester Agent..."
open_agent_terminal "tester"

echo "📁 Launching File Manager Agent..."
open_agent_terminal "file_manager"

echo ""
echo "✅ All 5 Claude Code CLI instances launched!"
echo ""
echo "📋 In each terminal window:"
echo "   1. If asked, authenticate with 'claude auth'"
echo "   2. Start chatting with Claude"
echo "   3. Messages from the UI will appear here"
echo ""
echo "🌐 Open the UI at: http://localhost:5173"
echo ""
