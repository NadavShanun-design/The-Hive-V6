# 🐝 THE HIVE + Ralph - Autonomous Multi-Agent Development System

## What is THE HIVE + Ralph?

THE HIVE combined with Ralph creates a **fully autonomous multi-agent development system** where:
- **6 Claude Code terminals** run continuously via Ralph's autonomous loop
- **3 Projects** × **2 Agents** (Master + Coder) = **6 Autonomous Terminals**
- **MOLTBOT** orchestrates all agents with screen capture and full authority
- **Ralph Loop** keeps each agent working until all tasks are complete

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🐝 THE HIVE UI                               │
│                http://localhost:3002/hive.html                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Project 1   │  │  Project 2   │  │  Project 3   │          │
│  │  Master      │  │  Master      │  │  Master      │          │
│  │  (Ralph ∞)   │  │  (Ralph ∞)   │  │  (Ralph ∞)   │          │
│  │  Coder       │  │  Coder       │  │  Coder       │          │
│  │  (Ralph ∞)   │  │  (Ralph ∞)   │  │  (Ralph ∞)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            MOLTBOT Chat Panel                               │ │
│  │            (Screen Capture + Full Authority)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────────┐
              │   HIVE Server        │
              │   (server-hive.js)   │
              │   + Ralph Auto-Start │
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

## How It Works

### Ralph's Autonomous Loop

Each of the 6 terminals runs Ralph in autonomous mode:

1. **Auto-Start**: When a terminal connects, Ralph automatically starts
2. **Continuous Loop**: Ralph reads fix_plan.md and executes tasks
3. **Claude Code Execution**: Ralph runs Claude Code CLI repeatedly
4. **Progress Tracking**: Ralph monitors completion and file changes
5. **Intelligent Exit**: Ralph exits only when all tasks are done

### Agent Roles

#### Master Agents (project1-master, project2-master, project3-master)
- Plan and architect solutions
- Review code from Coder agents
- Make architectural decisions
- Direct Coder agents with instructions
- Focus on strategy and code quality

#### Coder Agents (project1-coder, project2-coder, project3-coder)
- Implement code based on Master's direction
- Write and run tests
- Debug issues
- Report progress to Master
- Focus on execution and implementation

### MOLTBOT's Authority

MOLTBOT has full authority over all 6 terminals:
- Can see your screen via Peekaboo (screen capture)
- Can send prompts to any terminal
- Can coordinate tasks across projects
- Can override agent instructions when needed

## Quick Start

### 1. Start THE HIVE with Ralph Integration

```bash
cd /your-home/path/to/hive
./start-hive-with-moltbot.sh
```

This will:
1. Start OpenClaw Gateway (port 18789)
2. Start THE HIVE Server (port 3002) with Ralph auto-start
3. Instructions to start MOLTBOT
4. Open browser to THE HIVE UI

### 2. Start MOLTBOT

```bash
cd /path/to/hive/openclaw
pnpm openclaw agent --session-id "hive-moltbot" --local --thinking low
```

### 3. Watch THE HIVE Work

Open http://localhost:3002/hive.html and watch:
- All 6 terminals running Ralph autonomous loops
- Each agent working on their tasks
- Master agents directing Coder agents
- Continuous progress until work is complete

## Ralph Configuration

Each project has Ralph configured:

### Project Directories
- `./projects/project-1/.ralph/` - Project 1 Ralph config
- `./projects/project-2/.ralph/` - Project 2 Ralph config
- `./projects/project-3/.ralph/` - Project 3 Ralph config

### Key Ralph Files per Project
- **PROMPT.md**: Agent instructions and HIVE context
- **fix_plan.md**: Prioritized task list
- **AGENT.md**: Build and run commands
- **.ralphrc**: Ralph loop configuration

### Example fix_plan.md Structure

```markdown
## High Priority
- [ ] Review codebase and understand architecture
- [ ] Implement core feature X
- [ ] Add test coverage

## Medium Priority
- [ ] Documentation updates
- [ ] Code cleanup

## Low Priority
- [ ] Performance optimization
```

## Monitoring and Control

### Via THE HIVE UI
- **Terminal Output**: See real-time Ralph loop output for each agent
- **MOLTBOT Chat**: Send commands to MOLTBOT
- **Inter-Agent Communication**: Agents share workspace and can coordinate

### Via Ralph Status

Check Ralph status in each project:
```bash
cd /path/to/hive/projects/project-1
cat .ralph/logs/ralph.log
cat .ralph/status.json
```

### Via MOLTBOT

MOLTBOT can:
- Ask "What is project1-master working on?"
- Send "Tell project1-coder to implement feature X"
- Coordinate "Have all master agents review their coder's work"

## Ralph Exit Conditions

Ralph will exit a loop when:
1. **All tasks complete**: All items in fix_plan.md are marked [x]
2. **Explicit signal**: Agent sets EXIT_SIGNAL: true in RALPH_STATUS
3. **Dual-condition check**: completion_indicators >= 2 AND EXIT_SIGNAL: true
4. **Circuit breaker**: Too many loops with no progress (safety)

## Stopping THE HIVE

```bash
# Kill by port
lsof -ti:18789 | xargs kill
lsof -ti:3002 | xargs kill

# Or by PID from startup script output
kill <GATEWAY_PID> <HIVE_PID>
```

## Configuration Files

### Terminal Permission Settings
All 6 terminals skip permissions automatically:
- `~/.claude-project1-master/settings.json`
- `~/.claude-project1-coder/settings.json`
- `~/.claude-project2-master/settings.json`
- `~/.claude-project2-coder/settings.json`
- `~/.claude-project3-master/settings.json`
- `~/.claude-project3-coder/settings.json`

### Ralph Configuration (.ralphrc per project)
```bash
PROJECT_NAME="project-1"
PROJECT_TYPE="typescript"
MAX_CALLS_PER_HOUR=100
CLAUDE_TIMEOUT_MINUTES=15
CLAUDE_OUTPUT_FORMAT="json"
ALLOWED_TOOLS="Write,Read,Edit,Bash(git *),Bash(npm *),Bash(pytest)"
SESSION_CONTINUITY=true
SESSION_EXPIRY_HOURS=24
```

## Troubleshooting

### Ralph not starting in terminals
Check server-hive.js logs:
```bash
tail -f /tmp/hive-server.log
```

### Ralph exits too early
- Check fix_plan.md has uncompleted tasks
- Review .ralph/logs/ralph.log for exit reason
- Agents may be setting EXIT_SIGNAL: true prematurely

### Terminals not responding
Check if Ralph is running:
```bash
# In THE HIVE UI terminal, press Ctrl+C to interrupt Ralph
# Check status
cd /path/to/hive/projects/project-1
ralph --status
```

### MOLTBOT can't see screen
Grant Screen Recording permission:
1. System Settings → Privacy & Security → Screen Recording
2. Enable for OpenClaw/node process
3. Restart OpenClaw gateway

## Advanced Usage

### Customizing Agent Behavior

Edit the PROMPT.md file for each project:
```bash
cd /path/to/hive/projects/project-1
nano .ralph/PROMPT.md
```

### Adding Tasks

Update fix_plan.md:
```bash
cd /path/to/hive/projects/project-1
nano .ralph/fix_plan.md
```

### Pausing Ralph Loops

In any terminal in THE HIVE UI:
1. Press Ctrl+C to interrupt Ralph
2. Type commands manually if needed
3. Type `ralph --verbose` to restart

## Benefits of THE HIVE + Ralph

✅ **Fully Autonomous**: Each agent works continuously without manual prompts
✅ **Parallel Development**: 6 agents working simultaneously on 3 projects
✅ **Master/Coder Pattern**: Clear separation of planning vs implementation
✅ **MOLTBOT Orchestration**: Central authority with screen capture
✅ **Intelligent Exit**: Agents only stop when work is truly complete
✅ **Rate Limited**: Built-in API rate limiting prevents overuse
✅ **Session Continuity**: Agents maintain context across loop iterations
✅ **Safety Mechanisms**: Circuit breakers prevent infinite loops

## Next Steps

1. ✅ THE HIVE + Ralph is running
2. ✅ All 6 terminals auto-start Ralph loops
3. ✅ MOLTBOT has full authority and screen access
4. ✅ Agents work continuously until tasks complete

**Your job now**: Define tasks in fix_plan.md and let THE HIVE work!

---

**Documentation**: This system combines:
- [THE HIVE Documentation](./README-HIVE.md)
- [Ralph Documentation](./ralph/README.md)
- [Ralph CLAUDE.md](./ralph/CLAUDE.md)
