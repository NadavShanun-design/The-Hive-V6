# THE HIVE Quick Reference for Claude Code

When user says: **"run the hive"**

## You MUST run these 3 components:

1. **OpenClaw Gateway** (port 18789)
   ```
   cd openclaw && pnpm gateway:dev &
   ```

2. **HIVE Server** (port 3002)
   ```
   node server-hive.js &
   ```

3. **MOLTBOT** (real agent with screen access)
   ```
   cd openclaw
   pnpm openclaw agent --session-id "hive-moltbot" --local
   ```

## Quick Start
```
./start-hive-with-moltbot.sh
```

## Verification
Test MOLTBOT can see screen:
```
cd openclaw
pnpm openclaw agent --session-id "test" --message "What do you see?" --local --json
```

## Important
- OpenClaw Gateway (18789) ≠ MOLTBOT
- Real MOLTBOT = `pnpm openclaw agent --local`
- MOLTBOT has full authority over all 6 terminals
- Always verify screen access is working

See: README-HIVE.md and HIVE-STARTUP.md for details
