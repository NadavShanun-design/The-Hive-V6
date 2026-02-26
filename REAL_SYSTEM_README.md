# Real Claude Code Multi-Agent System

## What Is This?

This is a **REAL** multi-agent system using **actual Claude Code CLI instances**. Not simulated, not fake - real Claude AI agents working together.

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                     UI (Browser)                     │
│            http://localhost:5173                     │
└───────────────────┬─────────────────────────────────┘
                    │ WebSocket
                    │
┌───────────────────▼─────────────────────────────────┐
│            Central Server (Node.js)                  │
│            Port 3002                                 │
│         - Routes messages between agents             │
│         - Manages WebSocket connections              │
└───┬────────┬────────┬────────┬────────┬─────────────┘
    │        │        │        │        │
    │        │        │        │        │
┌───▼───┐ ┌─▼───┐ ┌──▼────┐ ┌─▼────┐ ┌▼──────────┐
│Master │ │Coder│ │Research│ │Tester│ │File Mgr  │
│Bridge │ │Bridge│ │Bridge  │ │Bridge│ │Bridge    │
│       │ │     │ │        │ │      │ │          │
│  ↕    │ │  ↕  │ │   ↕    │ │  ↕   │ │    ↕     │
│       │ │     │ │        │ │      │ │          │
│Claude │ │Claude│ │Claude  │ │Claude│ │Claude    │
│ CLI   │ │ CLI │ │  CLI   │ │ CLI  │ │  CLI     │
└───────┘ └─────┘ └────────┘ └──────┘ └──────────┘
 YOU      YOU      YOU        YOU      YOU
```

## Key Features

### ✅ 100% Real
- Real Claude Code CLI instances
- Real AI responses (Claude Sonnet 4.5)
- Real file operations
- Real code execution
- Nothing is simulated!

### ✅ Full Control
- YOU authenticate each Claude instance
- YOU pass messages between agents
- YOU control what each agent does
- YOU see everything happening

### ✅ Inter-Agent Communication
- Agents can message each other
- Master coordinates all agents
- Broadcast messages to all agents
- Direct agent-to-agent messaging

### ✅ File Access
- Each agent has its own workspace
- File Manager agent can access anywhere on your laptop
- Real read/write operations
- Code execution in isolated workspaces

## Setup Requirements

1. **Claude Code CLI**
   - Already installed (you're using it now!)
   - Run `claude auth` once

2. **Node.js**
   - Already have it

3. **11 Terminal Windows**
   - 1 for server
   - 2 for each agent (bridge + claude) × 5 agents = 10
   - Total: 11 terminals

4. **Browser**
   - For the UI

## Quick Start

### Option 1: Manual (Recommended First Time)

See **START_AGENTS.md** for step-by-step instructions.

Or use **agent-workspaces/START_ALL.md** for copy-paste commands.

### Option 2: Script

```bash
./start-real-system.sh
```

Then manually start each agent in separate terminals.

## Architecture

### Agents

1. **Master** (Coordinator)
   - Receives tasks from UI
   - Analyzes and delegates
   - Coordinates responses
   - Makes final decisions

2. **Coder**
   - Code generation
   - Code review
   - Refactoring
   - Bug fixing

3. **Researcher**
   - Information gathering
   - Documentation search
   - Best practices
   - Technology research

4. **Tester**
   - Write tests
   - Run tests
   - Validate code
   - QA

5. **File Manager**
   - File operations
   - Code execution
   - System commands
   - File organization

### Communication Flow

1. **UI → Master**: User submits task via browser
2. **Master → Specialist**: Master delegates to appropriate agent
3. **Specialist → Work**: Agent completes task
4. **Specialist → Master**: Returns results
5. **Master → UI**: Presents final output

### Message Bridges

Each agent has a "message bridge" - a Node.js script that:
- Connects to central server via WebSocket
- Receives messages from other agents
- Displays them in the terminal
- Lets you send messages to other agents

You manually copy messages from bridge to Claude CLI and vice versa.

## Usage Example

### Starting a Project

**UI**: Type "Create a todo list web app"

**Master Bridge**: Shows message from UI

**You in Master Claude**:
```
Create a todo list web app

[Master Claude responds with a plan]
Plan:
1. Coder: Create HTML structure
2. Coder: Add CSS styling
3. Coder: Implement JavaScript logic
4. Tester: Write tests
```

**You in Master Bridge**:
```
send coder Create HTML structure for a todo list with input field, add button, and list display
```

**Coder Bridge**: Shows message from Master

**You in Coder Claude**:
```
Create HTML structure for a todo list with input field, add button, and list display

[Coder Claude writes the HTML]
```

**You in Coder Bridge**:
```
send master HTML structure completed: <html>...</html>
```

**Master Bridge**: Receives HTML

**You in Master Claude**: Review and continue...

And so on!

## File Operations

Each agent can access its workspace:

```
agent-workspaces/
├── master/
│   ├── README.md
│   ├── launch.sh
│   ├── message-bridge.js
│   └── received-messages.log
├── coder/
│   └── (same structure)
├── researcher/
│   └── (same structure)
├── tester/
│   └── (same structure)
└── file_manager/
    └── (same structure)
```

For accessing files outside these workspaces, use the **File Manager** agent which has full system access (through Claude Code CLI).

## Security

### Authentication
- You handle all authentication yourself
- Run `claude auth` once
- All instances use your credentials

### File Access
- Each agent isolated to workspace by default
- File Manager can access anywhere (you control it)
- All operations visible in terminals

### No Secrets
- No API keys stored
- No configuration files
- Everything done through Claude CLI
- You see all commands

## Cost

### Free!
- Uses your existing Claude Code subscription
- No additional API costs
- No Cloudflare costs
- All runs locally on your machine

## Differences from Demo System

| Feature | Demo System | Real System |
|---------|------------|-------------|
| AI | ❌ Simulated | ✅ Real Claude |
| Responses | ❌ Pre-programmed | ✅ Dynamic AI |
| File Access | ❌ None | ✅ Full access |
| Code Execution | ❌ Fake | ✅ Real |
| Authentication | ❌ N/A | ✅ Your Claude auth |
| Control | ❌ Automatic | ✅ Manual |
| Communication | ❌ Simulated | ✅ Real WebSocket |
| Cost | Free | ✅ Free (your subscription) |

## Troubleshooting

### Claude won't start
```bash
claude auth
```

### Bridge won't connect
Make sure server is running:
```bash
cd server && node real-agents-server.js
```

### Messages not appearing
1. Check bridge is connected (should say "✅ Connected")
2. Check server logs
3. Verify agent registered

### Too many terminals
Use tmux or screen:
```bash
tmux new-session -s agents
# Create splits and run commands
```

## Tips

1. **Keep bridges visible** - Put them in a row at top of screen
2. **Keep Claude terminals below** - Easy to copy/paste
3. **Use tmux** - Manage all terminals in one window
4. **Save logs** - Each bridge saves messages to .log file
5. **Name your terminals** - "Master Bridge", "Master Claude", etc.

## Advanced Usage

### Broadcasting
Send message to all agents:
```
broadcast Everyone, we're starting a new project
```

### Direct messaging
```
send coder Review this code: ...
send researcher Find documentation about React hooks
send tester Validate this function
send file_manager Read the config file
```

### Checking status
```
status
```

### Getting help
```
help
```

## What's Next

This is a foundation. You can:

1. **Add more agents** - Create new workspaces
2. **Custom agents** - Specialized for specific tasks
3. **Persistent memory** - Save context between sessions
4. **Automation** - Script common workflows
5. **Integration** - Connect to external tools

## Support

See documentation:
- **START_AGENTS.md** - Detailed startup guide
- **agent-workspaces/START_ALL.md** - Quick start commands
- **agent-workspaces/*/README.md** - Individual agent guides

## The Bottom Line

**This is REAL**. You're running 5 instances of the same Claude Code CLI you're using right now. They can communicate with each other through a central server. You manually pass messages between them. Nothing is fake or simulated.

It's like having 5 Claude assistants working together, and you're the coordinator!

🤖 × 5 = 🚀
