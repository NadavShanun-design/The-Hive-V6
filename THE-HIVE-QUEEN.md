# THE HIVE QUEEN - OpenClaw Integration Guide

## Overview
The Hive uses an isolated OpenClaw instance called "The Queen" that runs EXCLUSIVELY from the vibe-coder folder. This ensures complete isolation from other OpenClaw instances on the system.

## Critical Requirements

### 1. Isolation
- **ALL** OpenClaw components must run from `/path/to/hive/` or `~/.hive/openclaw/`
- **NO** dependencies on global OpenClaw installation
- **NO** shared config with other OpenClaw instances
- Gateway must be isolated to this Hive instance only

### 2. The Queen (OpenClaw Chat)
- Located in Terminal 7 (T7) on the right side of The Hive
- Controls and communicates with all 6 Claude Code terminals
- MUST be tested every time The Hive starts
- MUST be able to see screen and respond

### 3. Testing Procedure
Every time The Hive starts, run this test:
```bash
echo '{"message":"What do you see on my screen?","sessionKey":"queen-test"}' > /tmp/queen-test.json
curl -X POST http://localhost:3002/api/openclaw/chat/send \
  -H "Content-Type: application/json" \
  -d @/tmp/queen-test.json
```

Expected result:
- API returns: `{"success":true}`
- OpenClaw describes what's visible on screen
- No errors about missing screen access or gateway failures

## Architecture

### Directory Structure
```
/path/to/hive/
├── server-hive.js          # Main Hive server
├── openclaw-chat-client.js # OpenClaw backend integration
├── public/
│   ├── index.html          # The Hive interface (6 terminals + Queen)
│   ├── hive.html           # Same as index.html
│   └── hive.js             # Frontend JavaScript
├── projects/
│   ├── project-1/          # Workspace for T1 & T2
│   ├── project-2/          # Workspace for T3 & T4
│   └── project-3/          # Workspace for T5 & T6
└── node_modules/           # Dependencies

~/.hive/openclaw/           # Isolated OpenClaw installation
├── openclaw binary
├── gateway
└── .env (API keys)
```

### Terminals Layout
```
┌──────────┬──────────┬──────────┬────────────────┐
│ PROJECT 1│ PROJECT 2│ PROJECT 3│   THE QUEEN    │
│          │          │          │  (OpenClaw)    │
│ T1 Master│ T3 Master│ T5 Master│                │
│ Opus 4.6 │ Opus 4.6 │ Opus 4.6 │   Terminal 7   │
│          │          │          │                │
│ T2 Coder │ T4 Coder │ T6 Coder │   Chat with    │
│ Sonnet4.5│ Sonnet4.5│ Sonnet4.5│   Claude via   │
│          │          │          │   OpenClaw     │
└──────────┴──────────┴──────────┴────────────────┘
```

## Starting The Hive

### Command
```bash
cd /your-home/path/to/hive
npm run hive
```

This starts:
1. Express server on port 3002
2. WebSocket server for 6 terminals
3. OpenClaw CLI integration
4. HTTP API for OpenClaw chat

### What Should Happen
1. Server starts with message: "🐝 THE HIVE IS ONLINE 🐝"
2. 6 terminals connect (project1-master, project1-coder, etc.)
3. Message: "✅ OpenClaw CLI available"
4. NO bash deprecation warnings (using zsh)
5. Browser opens at http://localhost:3002

## The Queen (OpenClaw) Integration

### Backend (server-hive.js)
```javascript
// OpenClaw CLI helper - runs from ~/.hive/openclaw
async function openclawSend(message, sessionId = 'default') {
    const cmd = `cd ~/.hive/openclaw && pnpm openclaw agent --message "${message}" --session-id "${sessionId}" --json`;
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
}
```

### API Endpoints
- `POST /api/openclaw/chat/send` - Send message to The Queen
- `GET /api/openclaw/chat/history` - Get chat history
- `POST /api/openclaw/chat/abort` - Abort current chat
- `GET /api/openclaw/status` - Check Queen status

### Frontend (T7 - OpenClaw Chat Panel)
- Yellow-themed panel on the right side
- Input textarea for messages
- Send button triggers API call
- Messages display in scrollable area
- Status indicator shows connection state

## Common Issues & Solutions

### Issue: "missing scope: operator.read"
**Cause:** OpenClaw gateway authentication issues
**Solution:** Using CLI method instead (no gateway needed)

### Issue: "Local media path is not under an allowed directory"
**Cause:** OpenClaw embedded mode can't access screen
**Solution:** Start OpenClaw gateway properly or use alternative screen capture

### Issue: Bash deprecation warning appears
**Cause:** Terminals using /bin/bash instead of zsh
**Solution:** Fixed - terminals now use /bin/zsh (see server-hive.js line 22)

### Issue: The Queen not responding
**Test:**
```bash
curl -s http://localhost:3002/api/openclaw/status
# Should return: {"connected":true,"method":"cli"}
```

## Shell Configuration

### CRITICAL: Using ZSH (Not Bash)
```javascript
// server-hive.js line 22
const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh';
```

### Environment Variables Set for Each Terminal
```javascript
env.CLAUDE_CODE_SHELL = '/bin/zsh';
env.BASH_SILENCE_DEPRECATION_WARNING = '1';
env.CLAUDE_CONFIG_DIR = configDir; // Isolated config per terminal
```

## Running The Hive - Standard Procedure

1. **Start The Hive**
   ```bash
   cd /your-home/path/to/hive
   npm run hive
   ```

2. **Verify Status**
   ```bash
   curl -s http://localhost:3002/api/openclaw/status
   # Expected: {"connected":true,"method":"cli"}
   ```

3. **Test The Queen**
   ```bash
   echo '{"message":"What do you see on my screen?","sessionKey":"test"}' > /tmp/test.json
   curl -X POST http://localhost:3002/api/openclaw/chat/send -H "Content-Type: application/json" -d @/tmp/test.json
   # Expected: {"success":true}
   ```

4. **Open Browser**
   ```bash
   open http://localhost:3002
   ```

5. **Verify in Browser**
   - See "🐝 THE HIVE - Multi-Agent Command Center" in title
   - See 6 terminals (T1-T6) connecting
   - See T7 (OpenClaw Chat) on the right
   - See "MOLTBOT ready" status
   - All terminals show bash prompts with no deprecation warnings

## Success Criteria

### The Hive is Working When:
✅ All 6 terminals connected and showing zsh prompts
✅ No bash deprecation warnings in any terminal
✅ OpenClaw status returns "connected": true
✅ The Queen (T7) can send/receive messages
✅ The Queen can see and describe the screen
✅ Quick Ideas bar functional
✅ Memory & Tasks button works

### The Queen is Working When:
✅ Can describe what's on screen when asked
✅ Responds within 30-60 seconds
✅ No "missing scope" errors
✅ No "device token mismatch" errors
✅ Messages appear in T7 chat panel
✅ Status shows "online" or "connected"

## Maintenance

### Restart The Hive
```bash
pkill -f "server-hive"
npm run hive
```

### Check Logs
```bash
# Find the latest hive process
ps aux | grep server-hive | grep -v grep

# Or check specific output file if running in background
tail -f /path/to/output/file
```

### Update OpenClaw (The Queen)
```bash
cd ~/.hive/openclaw
pnpm install openclaw@latest
```

## Remember
- The Hive = 6 Claude Code terminals + The Queen (OpenClaw)
- The Queen = Terminal 7 = OpenClaw Chat on the right
- ALWAYS test The Queen when starting The Hive
- EVERYTHING runs from vibe-coder folder (isolated)
- NO global OpenClaw dependencies
- Using zsh (NOT bash) for all terminals
