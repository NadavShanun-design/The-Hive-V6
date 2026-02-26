# 🐝 THE HIVE - Startup Procedure

## Critical: How to Run THE HIVE

**When starting THE HIVE, you MUST start THREE components:**

### 1. OpenClaw Gateway (Port 18789)
```bash
cd /path/to/hive/openclaw
pnpm gateway:dev &
```

### 2. THE HIVE Server (Port 3002)
```bash
cd /your-home/path/to/hive
node server-hive.js &
```

### 3. MOLTBOT Agent (Real MOLTBOT with Screen Access)
```bash
cd /path/to/hive/openclaw
pnpm openclaw agent --session-id "hive-moltbot" --local --thinking low
```

## What is MOLTBOT?

**MOLTBOT is the REAL OpenClaw agent** that:
- Runs with `--local` flag (embedded agent with full capabilities)
- Has **screen capture** via Peekaboo tool
- Uses **Claude Opus 4.5** model
- Can see your screen and describe what's visible
- Has **full authority** over all 6 Claude Code terminals in THE HIVE
- Can prompt and control all terminals:
  - project1-master
  - project1-coder
  - project2-master
  - project2-coder
  - project3-master
  - project3-coder

## What is NOT MOLTBOT?

**OpenClaw Gateway (port 18789)** is:
- Just the WebSocket gateway/proxy
- Does NOT have screen access
- Does NOT have the full agent capabilities
- Used for communication between THE HIVE UI and the real MOLTBOT

## Quick Start Script

Use the provided start script:
```bash
./start-hive-with-moltbot.sh
```

This will start all three components properly and open THE HIVE in your browser.

## Accessing THE HIVE

Once all components are running:
- **THE HIVE Dashboard**: http://localhost:3002/hive.html
- **OpenClaw Gateway**: http://localhost:18789
- **MOLTBOT**: Connected via OpenClaw chat panel (right side of HIVE UI)

## Verification

To verify MOLTBOT is working with screen access:
```bash
cd /path/to/hive/openclaw
pnpm openclaw agent --session-id "test" --message "What do you see on my screen?" --local --json
```

MOLTBOT should describe your current screen in detail.

## Important Notes

- MOLTBOT must be started FROM the openclaw directory
- The `--local` flag is CRITICAL - without it, no screen access
- MOLTBOT has full authority to control all 6 HIVE terminals
- Always verify MOLTBOT can see the screen before considering it "working"

---

**Remember: OpenClaw Gateway ≠ MOLTBOT**
**MOLTBOT = `pnpm openclaw agent --local` with screen access**
