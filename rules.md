# CLAUDE CODE GLOBAL RULES

## THESE RULES APPLY TO ALL FOLDERS AND ALL SESSIONS

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
**When working in a specific project folder:**
- NEVER use files from other folders
- NEVER use node_modules from other folders
- NEVER use services/processes running from other folders
- NEVER reference or import from paths outside the current project folder
- Everything must run ENTIRELY from within the project folder you're working in
- Each folder is completely isolated
- If something needs to be installed, install it in THAT folder
- If something needs to run, run it FROM that folder

## PROJECT FOLDERS (Each is isolated):
- `/path/to/hive/` - The Hive
- `/your-home/Downloads/moltbot/` - MoltBot
- `/your-home/Downloads/ScreenPipe/` - ScreenPipe
- `/your-home/Downloads/INT/` - INT
- `/your-home/Downloads/login-geodo/` - Login Geodo (if exists)

## VERIFICATION CHECKLIST
Before completing any task, verify:
- [ ] Did I tell the truth about what happened?
- [ ] Did I do exactly what was asked (no shortcuts)?
- [ ] Is everything running from the CURRENT folder only?
- [ ] Did I document any failures or issues?
- [ ] Did I ask for information if I needed it?
