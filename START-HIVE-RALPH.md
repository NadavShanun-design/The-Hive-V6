# 🚀 Starting THE HIVE with Ralph Integration

## Quick Start (3 Commands)

### 1. Start OpenClaw Gateway (if not already running)
```bash
cd /path/to/hive/openclaw
pnpm gateway:dev > /tmp/openclaw-gateway.log 2>&1 &
```

### 2. Start THE HIVE Server with Ralph Auto-Start
```bash
cd /your-home/path/to/hive
node server-hive.js > /tmp/hive-server.log 2>&1 &
HIVE_PID=$!
echo "HIVE Server PID: $HIVE_PID"
```

### 3. Start MOLTBOT with Screen Access
```bash
cd /path/to/hive/openclaw
pnpm openclaw agent --session-id "hive-moltbot" --local --thinking low
```

### 4. Open Browser (automatic or manual)
```bash
open http://localhost:3002/hive.html
```

## What Happens When You Start THE HIVE?

1. **Server starts** and creates 6 PTY sessions
2. **2 seconds later**, each terminal auto-runs: `ralph --verbose --output-format json`
3. **Ralph loops start** for all 6 agents:
   - project1-master
   - project1-coder
   - project2-master
   - project2-coder
   - project3-master
   - project3-coder
4. **Each Ralph loop**:
   - Reads `fix_plan.md` for tasks
   - Runs Claude Code CLI
   - Tracks progress
   - Continues until all tasks complete

## Verification

### Check if everything is running:
```bash
# Check OpenClaw Gateway
lsof -ti:18789 && echo "✅ Gateway running" || echo "❌ Gateway not running"

# Check HIVE Server
lsof -ti:3002 && echo "✅ HIVE running" || echo "❌ HIVE not running"

# Check server logs
tail -f /tmp/hive-server.log

# Check if Ralph auto-started
tail -50 /tmp/hive-server.log | grep "Starting Ralph Loop"
```

You should see:
```
🚀 Starting Ralph Loop for project1-master...
🚀 Starting Ralph Loop for project1-coder...
🚀 Starting Ralph Loop for project2-master...
🚀 Starting Ralph Loop for project2-coder...
🚀 Starting Ralph Loop for project3-master...
🚀 Starting Ralph Loop for project3-coder...
```

## Monitoring Ralph Loops

### Via THE HIVE UI
- Open http://localhost:3002/hive.html
- Each terminal shows Ralph's output
- You'll see Claude Code CLI running repeatedly
- Progress updates from each agent

### Via Log Files
```bash
# Project 1 Ralph logs
tail -f /path/to/hive/projects/project-1/.ralph/logs/ralph.log

# Project 2 Ralph logs
tail -f /path/to/hive/projects/project-2/.ralph/logs/ralph.log

# Project 3 Ralph logs
tail -f /path/to/hive/projects/project-3/.ralph/logs/ralph.log
```

### Via Ralph Status
```bash
# Check Ralph status for any project
cd /path/to/hive/projects/project-1
ralph --status
```

## Stopping THE HIVE

### Stop All Services
```bash
# Kill HIVE server
lsof -ti:3002 | xargs kill

# Kill OpenClaw gateway
lsof -ti:18789 | xargs kill

# Or use PID from startup
kill $HIVE_PID
```

### Stop Individual Ralph Loops
In THE HIVE UI terminal:
1. Click into the terminal
2. Press `Ctrl+C` to interrupt Ralph
3. Terminal returns to normal bash shell
4. Type `ralph --verbose` to restart if needed

## Troubleshooting

### Ralph not auto-starting?
Check server-hive.js modification at line ~866:
```javascript
setTimeout(() => {
    console.log(`🚀 Starting Ralph Loop for ${agentId}...`);
    ptyProcess.write('ralph --verbose --output-format json\r');
}, 2000);
```

### Ralph exits immediately?
Check fix_plan.md - if all tasks are complete, Ralph exits.
```bash
cd /path/to/hive/projects/project-1
cat .ralph/fix_plan.md
```

Add uncompleted tasks:
```bash
nano .ralph/fix_plan.md
```

### Permission errors in Ralph?
Update .ralphrc ALLOWED_TOOLS:
```bash
cd /path/to/hive/projects/project-1
nano .ralphrc
```

Set:
```bash
ALLOWED_TOOLS="Write,Read,Edit,Bash(git *),Bash(npm *),Bash(pytest)"
```

### MOLTBOT can't see screen?
1. System Settings → Privacy & Security → Screen Recording
2. Enable for OpenClaw/node process
3. Restart OpenClaw gateway

## Configuration Files

### Per-Terminal Claude Configs (permission skip)
- `~/.claude-project1-master/settings.json`
- `~/.claude-project1-coder/settings.json`
- `~/.claude-project2-master/settings.json`
- `~/.claude-project2-coder/settings.json`
- `~/.claude-project3-master/settings.json`
- `~/.claude-project3-coder/settings.json`

### Per-Project Ralph Configs
- `./projects/project-1/.ralph/PROMPT.md` - Agent instructions
- `./projects/project-1/.ralph/fix_plan.md` - Task list
- `./projects/project-1/.ralph/AGENT.md` - Build commands
- `./projects/project-1/.ralphrc` - Ralph settings

## Next Steps

1. ✅ THE HIVE is running with Ralph auto-start
2. ✅ All 6 terminals are running Ralph loops
3. ✅ MOLTBOT has full authority with screen access
4. 🎯 **Define tasks** in each project's `fix_plan.md`
5. 🎯 **Let it run** - agents work until all tasks complete
6. 🎯 **Monitor progress** via THE HIVE UI or logs

## Resources

- [THE HIVE Documentation](./README-HIVE.md)
- [Ralph Documentation](./ralph/README.md)
- [THE HIVE + Ralph Integration](./README-HIVE-RALPH.md)
- [HIVE Startup Procedure](./HIVE-STARTUP.md)

---

**Current Status**:
- ✅ Ralph installed globally
- ✅ Ralph enabled in all 3 projects
- ✅ server-hive.js modified for Ralph auto-start
- ✅ All PROMPT.md files updated with HIVE context
- ✅ MOLTBOT authority documented
- ✅ System tested and verified working

**You're all set! THE HIVE + Ralph is ready for autonomous multi-agent development! 🐝🦞**
