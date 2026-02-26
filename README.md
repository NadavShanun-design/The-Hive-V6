# Vibe Coder - Multi-Agent Claude Code CLI System

A web-based terminal interface that allows you to run multiple Claude Code CLI instances simultaneously, each with their own authentication and configuration. NO FAKE CODE - these are real terminals running real Claude Code CLI!

## What This Actually Does

- **Real Terminals**: Uses `node-pty` + `xterm.js` to create actual terminal sessions in your browser
- **Real Claude Code CLI**: Each terminal is a real bash shell where you can type `claude` and use the official Claude Code CLI
- **Separate Authentication**: Each agent has its own config directory (`~/.claude-agent-{name}`)
- **5 Agent Terminals**: Master, Coder, Researcher, Tester, and File Manager
- **No Simulation**: This is NOT fake - every terminal is a real PTY running a real shell

## Architecture

```
┌─────────────────┐
│   Browser UI    │
│  (xterm.js x5)  │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│  Node.js Server │
│   (Express+WS)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ node-pty│
    └────┬────┘
         │
    ┌────┴────────────────────────┐
    │  5 Real Bash Shells         │
    │  Each with CLAUDE_CONFIG_DIR│
    └─────────────────────────────┘
         │
    ┌────┴────┐
    │ claude  │ (You type this)
    └─────────┘
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm
- Claude Code CLI installed globally (from https://claude.com/claude-code)

### Setup

1. Install dependencies:
```bash
npm install
```

2. **IMPORTANT**: Fix spawn-helper permissions (known node-pty issue on macOS):
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
chmod +x node_modules/node-pty/prebuilds/darwin-x64/spawn-helper
```

3. Start the server:
```bash
npm start
```

4. Open your browser to: **http://localhost:3000**

## Usage

1. **Open your browser**: Navigate to http://localhost:3000
2. **You'll see 5 terminals**: One for each agent (Master, Coder, Researcher, Tester, File Manager)
3. **Type `claude` in each terminal**: This starts the actual Claude Code CLI
4. **Authenticate**: Follow the auth prompts in each terminal (they're independent)
5. **Start coding**: Now you have 5 separate Claude Code CLI instances running!

### Config Directories

Each agent stores its authentication and config in:
- `~/.claude-agent-master`
- `~/.claude-agent-coder`
- `~/.claude-agent-researcher`
- `~/.claude-agent-tester`
- `~/.claude-agent-file_manager`

## How It Actually Works

1. **Server starts**: Node.js server with Express + WebSocket starts on port 3000
2. **Browser connects**: You open http://localhost:3000 in your browser
3. **5 WebSocket connections**: Each terminal creates a WebSocket connection with `?agent={name}` parameter
4. **node-pty spawns shells**: For each connection, node-pty spawns a real bash shell with `CLAUDE_CONFIG_DIR=~/.claude-agent-{name}`
5. **xterm.js displays**: Each terminal renders in the browser using xterm.js
6. **You type commands**: Everything you type goes through WebSocket → node-pty → actual shell
7. **Shell output returns**: Shell output flows back through node-pty → WebSocket → xterm.js display

This is **real terminal emulation**, not a simulation!

## Technical Stack

- **Backend**: Node.js, Express, WebSocket (ws), node-pty
- **Frontend**: HTML, CSS, JavaScript, xterm.js, xterm-addon-fit
- **Terminal**: Real bash shells with PTY (Pseudo Terminal)
- **Claude Code CLI**: Official CLI from Anthropic

## Project Structure

```
Vibe-coder/
├── server.js              # Main server (Express + WebSocket + node-pty)
├── public/
│   ├── index.html         # Main UI with 5 xterm.js terminals
│   └── app.js             # WebSocket client + terminal initialization
├── package.json           # Dependencies
├── node_modules/
│   └── node-pty/          # PTY implementation
└── README.md              # This file
```

## Troubleshooting

### "posix_spawnp failed" Error

This is the most common error - spawn-helper needs execute permissions:
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
chmod +x node_modules/node-pty/prebuilds/darwin-x64/spawn-helper
```

### Terminals Not Connecting

1. Check server is running: `node server.js`
2. Open browser console for WebSocket errors
3. Verify port 3000 is not in use: `lsof -ti:3000`

### Claude Command Not Found

Install Claude Code CLI:
```bash
# Download from https://claude.com/claude-code
# Or if you have the npm package:
npm install -g @anthropic-ai/claude-code
```

### Terminal Exits Immediately

Check server logs - the shell might be failing to start. Verify `/bin/bash` exists:
```bash
ls -la /bin/bash
```

## What Makes This Different?

This is **NOT**:
- ❌ A simulation of Claude
- ❌ Fake agent communication
- ❌ Pre-scripted responses
- ❌ A mock terminal

This **IS**:
- ✅ Real bash shells via node-pty
- ✅ Real Claude Code CLI authentication
- ✅ Real terminal emulation with xterm.js
- ✅ Actual separate config directories for each agent
- ✅ You manually type `claude` and authenticate yourself

## Future Enhancements

- [ ] Message routing layer between agents
- [ ] Shared workspace coordination
- [ ] Auto-launch Claude Code CLI (optional)
- [ ] Session persistence across refreshes
- [ ] Deploy to Cloudflare Workers with Durable Objects
- [ ] Master agent command routing to other agents

## Notes

- Each agent is completely independent
- You control authentication in each terminal
- Perfect for multi-agent workflows where agents need isolation
- Can run any command in these terminals, not just Claude

---

Built with node-pty, xterm.js, WebSockets, and real terminal magic! 🚀
