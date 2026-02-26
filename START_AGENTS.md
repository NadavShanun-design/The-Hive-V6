# 🚀 How to Start Your Real Claude Code Multi-Agent System

## Overview

You will run **5 instances of Claude Code CLI** - each as a separate agent:
1. **Master** - Coordinates everything
2. **Coder** - Handles code tasks
3. **Researcher** - Does research
4. **Tester** - Tests and validates
5. **File Manager** - Manages files

Each agent runs in **TWO terminals**:
- Terminal A: Message Bridge (shows incoming messages)
- Terminal B: Claude Code CLI (where you interact with Claude)

## Quick Start

### Step 1: Start the Server

```bash
cd /path/to/hive/server
node real-agents-server.js
```

Keep this running. It will say:
```
🤖 Claude Code Multi-Agent System Server
🌐 Server running on http://localhost:3002
```

### Step 2: Start Each Agent (10 terminals total)

#### MASTER Agent (Terminals 1 & 2)

**Terminal 1 - Message Bridge:**
```bash
cd /path/to/hive/agent-workspaces/master
node message-bridge.js
```

**Terminal 2 - Claude Code CLI:**
```bash
cd /path/to/hive/agent-workspaces/master
claude
```

If asked to authenticate:
```bash
claude auth
```
Then restart Claude.

---

#### CODER Agent (Terminals 3 & 4)

**Terminal 3 - Message Bridge:**
```bash
cd /path/to/hive/agent-workspaces/coder
node message-bridge.js
```

**Terminal 4 - Claude Code CLI:**
```bash
cd /path/to/hive/agent-workspaces/coder
claude
```

---

#### RESEARCHER Agent (Terminals 5 & 6)

**Terminal 5 - Message Bridge:**
```bash
cd /path/to/hive/agent-workspaces/researcher
node message-bridge.js
```

**Terminal 6 - Claude Code CLI:**
```bash
cd /path/to/hive/agent-workspaces/researcher
claude
```

---

#### TESTER Agent (Terminals 7 & 8)

**Terminal 7 - Message Bridge:**
```bash
cd /path/to/hive/agent-workspaces/tester
node message-bridge.js
```

**Terminal 8 - Claude Code CLI:**
```bash
cd /path/to/hive/agent-workspaces/tester
claude
```

---

#### FILE MANAGER Agent (Terminals 9 & 10)

**Terminal 9 - Message Bridge:**
```bash
cd /path/to/hive/agent-workspaces/file_manager
node message-bridge.js
```

**Terminal 10 - Claude Code CLI:**
```bash
cd /path/to/hive/agent-workspaces/file_manager
claude
```

---

### Step 3: Open the UI (Terminal 11)

The frontend should already be running at http://localhost:5173

If not:
```bash
cd /path/to/hive/client
npm run dev
```

Open: http://localhost:5173

---

## How It Works

### Sending Messages Between Agents

#### From UI to Master:
1. Type in the UI and click "Send Task"
2. Message appears in Master's message-bridge terminal
3. Copy the message and paste it into Master's Claude terminal

#### From Master to Other Agents:
In Master's **message-bridge terminal**, type:
```
send coder Please implement a fibonacci function
```

Or broadcast to all:
```
broadcast Working on a new task, everyone standby
```

#### Between Any Agents:
In any agent's **message-bridge terminal**:
```
send master Task completed, here are the results
send coder Can you review this code?
broadcast Need help with testing
```

### The Workflow

1. **UI** → sends task → **Master's bridge**
2. **You** → copy message → **Master's Claude CLI**
3. **Master (Claude)** → analyzes task → decides which agent to use
4. **You** → in Master's bridge → `send coder <task>`
5. **Coder's bridge** → shows incoming message
6. **You** → copy to Coder's Claude CLI
7. **Coder (Claude)** → completes task → gives you response
8. **You** → in Coder's bridge → `send master <response>`
9. **Master's bridge** → receives response
10. **Repeat** as needed

---

## Tips

### Organizing Your Terminals

Recommended layout:
```
┌─────────────┬─────────────┐
│ Master      │ Master      │
│ Bridge      │ Claude      │
├─────────────┼─────────────┤
│ Coder       │ Coder       │
│ Bridge      │ Claude      │
├─────────────┼─────────────┤
│ Researcher  │ Researcher  │
│ Bridge      │ Claude      │
├─────────────┼─────────────┤
│ Tester      │ Tester      │
│ Bridge      │ Claude      │
├─────────────┼─────────────┤
│ File Mgr    │ File Mgr    │
│ Bridge      │ Claude      │
└─────────────┴─────────────┘
```

### Using tmux (Optional)

Create a tmux session with all windows:
```bash
tmux new-session -d -s agents

# Server
tmux send-keys -t agents "cd /path/to/hive/server && node real-agents-server.js" C-m

# Create windows for each agent
tmux split-window -h
tmux send-keys "cd /path/to/hive/agent-workspaces/master && node message-bridge.js" C-m
tmux split-window -v
tmux send-keys "cd /path/to/hive/agent-workspaces/master && claude" C-m

# Attach to session
tmux attach -t agents
```

### Authentication

- Only need to run `claude auth` **once** per machine
- All 5 Claude instances will use the same authentication
- If you get auth errors, run `claude auth` in any terminal

### Message Bridge Commands

In any message-bridge terminal:
- `help` - Show commands
- `status` - Show agent status
- `send <agent> <message>` - Send to specific agent
- `broadcast <message>` - Send to all agents
- Just type message - sends to master

### Checking Connections

Look at the UI - it shows which agents are connected (green) vs disconnected (red).

### Message Logs

Each agent saves received messages to:
```
agent-workspaces/<agent>/received-messages.log
```

---

## Example Session

### Starting a Coding Task

1. **In UI**: Type "Create a sorting algorithm"
2. **Master Bridge**: Shows new message from UI
3. **In Master Claude**: Paste the task, Claude responds with plan
4. **In Master Bridge**: Type `send coder Implement quicksort in JavaScript`
5. **Coder Bridge**: Shows message from Master
6. **In Coder Claude**: Paste the request, Claude writes the code
7. **In Coder Bridge**: Type `send master Here's the code: ...`
8. **Master Bridge**: Receives the code
9. **In Master Claude**: Review and decide next steps
10. **In Master Bridge**: Type `send tester Test this code: ...`
11. **Continue the workflow...**

---

## Troubleshooting

### Agent bridge won't connect
- Make sure server is running on port 3002
- Check: http://localhost:3002/api/health

### Claude CLI won't start
- Run `claude auth` first
- Make sure you're in the right directory
- Check if another claude instance is using the workspace

### Messages not showing
- Make sure bridge is running and connected
- Check the server terminal for errors
- Verify WebSocket connection in bridge output

### UI not updating
- Make sure UI is connected to ws://localhost:3002
- Check browser console for errors
- Frontend might need to update WebSocket URL

---

## What's Different from the Demo

❌ **Demo System**: Fake agents (JavaScript only)
✅ **Real System**: Actual Claude Code CLI instances

❌ **Demo**: Auto responses
✅ **Real**: You control each Claude instance

❌ **Demo**: Simulated communication
✅ **Real**: Real message passing via WebSocket

❌ **Demo**: No file access
✅ **Real**: Each agent can access its workspace files

---

## File Access

Each agent can read/write files in their workspace:

- **Master**: `/path/to/hive/agent-workspaces/master/`
- **Coder**: `/path/to/hive/agent-workspaces/coder/`
- **Researcher**: `/path/to/hive/agent-workspaces/researcher/`
- **Tester**: `/path/to/hive/agent-workspaces/tester/`
- **File Manager**: `/path/to/hive/agent-workspaces/file_manager/`

To access files elsewhere on your laptop, tell the File Manager agent and it can use its full Claude Code capabilities.

---

## You're in Control

**Important**: This is 100% real. Nothing is simulated.

- Real Claude Code CLI instances
- Real AI responses
- Real file operations
- Real code execution
- You manually pass messages between agents
- You authenticate each Claude instance yourself

**This is the real deal!** 🔥
