# CRITICAL RULES FOR THIS FOLDER

## YOU MUST FOLLOW THESE RULES FOR EVERY SINGLE PROMPT

### Rule 1: NEVER LIE
- Always tell the complete truth
- If something isn't working, say it
- If you made a mistake, admit it immediately
- No sugarcoating, no hiding failures

### Rule 2: NO SHORTCUTS
- Do EXACTLY what the user asks
- If you can't do it, say: "I cannot do this because [reason]"
- If you need more information, say: "I need [specific information] to do this"
- Never fake it, never pretend something works when it doesn't
- Never take an easier path than what was requested

### Rule 3: TRANSPARENCY ABOUT LIMITATIONS
- If something isn't working, explain what's broken
- Ask for what you need: more info, permissions, tools, etc.
- Keep trying different approaches until it works
- Document what you tried and what failed

### Rule 4: FOLDER ISOLATION - CRITICAL
**WHEN WORKING IN THIS FOLDER:**
- NEVER use files from other folders on this computer
- NEVER use node_modules from other folders
- NEVER use OpenClaw/services running from other folders
- NEVER reference or import from paths outside this folder
- Everything must run ENTIRELY from within this project folder
- If something needs to be installed, install it HERE in this folder
- If something needs to run, run it FROM this folder

## VERIFICATION CHECKLIST
Before completing any task, verify:
- [ ] Did I tell the truth about what happened?
- [ ] Did I do exactly what was asked (no shortcuts)?
- [ ] Is everything running from THIS folder only?
- [ ] Did I document any failures or issues?
- [ ] Did I ask for information if I needed it?

## PROJECT: THE HIVE
This folder contains The Hive - a multi-agent terminal orchestration system with OpenClaw integration.

**Critical requirement:** OpenClaw must run ENTIRELY from this folder, isolated from all other OpenClaw instances on the system.

### Running The Hive — FULL CHECKLIST
When told to "run the Hive", do ALL of the following (without stopping anything else):

1. **OpenClaw Gateway** — must be on port **18791**
   - Check: `lsof -i :18791 | grep LISTEN`
   - If not running, start it with:
     `OPENCLAW_STATE_DIR=./.openclaw-state ./node_modules/.bin/openclaw gateway >> ./openclaw-gateway.log 2>&1 &`
   - This powers The Queen chat panel

2. **Hive Server** — must be on port **3002** (or your chosen PORT)
   - Check: `lsof -i :3002 | grep LISTEN`
   - If not running, start it with:
     `node server-hive.js >> server-output.log 2>&1 &`

3. **Open in browser**: `open http://localhost:3002/hive.html`
   - ALWAYS `/hive.html` — NOT `/` or `/index.html`
   - `hive.html` = black/gray/white UI with The Queen panel ✅
   - `index.html` = old neon/cyberpunk UI ❌

**Do NOT stop OpenClaw (the main process) or any other running processes.**
