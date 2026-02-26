# 🐝 THE HIVE - Multi-Agent Terminal Orchestration System

## What is THE HIVE?

THE HIVE is a multi-agent coordination system that runs **6 Claude Code terminals** simultaneously:
- **3 Projects** × **2 Agents** (Master + Coder) = **6 Terminals**

Each project has:
- **Master Agent**: Planning, architecture, code review
- **Coder Agent**: Implementation, testing, debugging

## What is MOLTBOT?

**MOLTBOT** is the orchestration agent that:
- ✅ **Sees your screen** via Peekaboo (screen capture)
- ✅ **Controls all 6 terminals** - can send prompts to any agent
- ✅ **Coordinates tasks** across multiple projects
- ✅ Uses **Claude Opus 4.5** for maximum capability
- ✅ Has **full authority** over all Claude Code terminals

### IMPORTANT: Real MOLTBOT vs Gateway

```
❌ OpenClaw Gateway (port 18789) = NOT MOLTBOT
   Just a WebSocket proxy/gateway

✅ MOLTBOT = pnpm openclaw agent --local
   Real agent with screen access and full capabilities
```

## Quick Start

### Option 1: Use the startup script
```bash
./start-hive-with-moltbot.sh
```

### Option 2: Manual startup
```bash
# 1. Start OpenClaw Gateway
cd openclaw && pnpm gateway:dev &

# 2. Start THE HIVE Server
node server-hive.js &

# 3. Start MOLTBOT
cd openclaw
pnpm openclaw agent --session-id "hive-moltbot" --local --thinking low

# 4. Open browser
open http://localhost:3002/hive.html
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    🐝 THE HIVE UI                       │
│                http://localhost:3002                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Project1 │  │ Project2 │  │ Project3 │  │MOLTBOT │ │
│  │ Master   │  │ Master   │  │ Master   │  │ Chat   │ │
│  │ Coder    │  │ Coder    │  │ Coder    │  │ Panel  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────────┐
              │   HIVE Server        │
              │   (server-hive.js)   │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  OpenClaw Gateway    │
              │  (port 18789)        │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │   MOLTBOT Agent      │
              │   (--local mode)     │
              │   + Peekaboo         │
              │   + Screen Capture   │
              └──────────────────────┘
```

## MOLTBOT Capabilities

MOLTBOT can:
1. **See your screen** - Ask "What do you see on my screen?"
2. **Control all 6 terminals** - Send prompts to any Claude Code agent
3. **Coordinate tasks** - Distribute work across projects
4. **Monitor progress** - Check status of all agents
5. **Make decisions** - Choose which agent should handle what task

## Configuration

All 6 terminals have permission-skip enabled at:
- `~/.claude-project1-master/settings.json`
- `~/.claude-project1-coder/settings.json`
- `~/.claude-project2-master/settings.json`
- `~/.claude-project2-coder/settings.json`
- `~/.claude-project3-master/settings.json`
- `~/.claude-project3-coder/settings.json`

This means they execute commands without permission prompts.

## Testing MOLTBOT

To verify MOLTBOT has screen access:
```bash
cd openclaw
pnpm openclaw agent --session-id "test" \
  --message "What do you see on my screen? Describe in detail." \
  --local --json
```

MOLTBOT should respond with a detailed description of your screen contents.

## Project Workspaces

Each project has its own workspace:
- `./projects/project-1/` - Project 1 workspace
- `./projects/project-2/` - Project 2 workspace
- `./projects/project-3/` - Project 3 workspace

Each workspace contains:
- `CLAUDE.md` - Agent instructions and conventions
- Source files created by agents
- Shared context between Master and Coder

## Stopping THE HIVE

```bash
# Kill by port
lsof -ti:18789 | xargs kill
lsof -ti:3002 | xargs kill

# Or kill by PID (from startup script output)
kill <GATEWAY_PID> <HIVE_PID>
```

## Troubleshooting

### MOLTBOT says "I can't see your screen"
Grant Screen Recording permission:
1. System Settings → Privacy & Security → Screen Recording
2. Find OpenClaw or node process
3. Enable the toggle
4. Restart OpenClaw gateway

### Terminals not responding
Check if permission-skip settings are in place:
```bash
ls ~/.claude-project*/settings.json
```

### Gateway not connecting
Check logs:
```bash
tail -f /tmp/openclaw-gateway.log
tail -f /tmp/hive-server.log
```

## For Claude Code Agents

**When the user says "run the hive", you must:**
1. Read this file to understand the architecture
2. Run all 3 components (Gateway, HIVE Server, MOLTBOT)
3. Verify MOLTBOT has screen access by testing it
4. Open the browser to THE HIVE UI
5. Confirm all systems are operational

**Remember:** OpenClaw Gateway ≠ MOLTBOT. The real MOLTBOT runs with `--local` flag.
