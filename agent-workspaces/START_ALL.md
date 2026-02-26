# Quick Start - All Agents

## Terminal Setup (Copy & Paste These Commands)

### Terminal 1: Server
```bash
cd /path/to/hive/server && node real-agents-server.js
```

---

### Terminal 2: Master Bridge
```bash
cd /path/to/hive/agent-workspaces/master && node message-bridge.js
```

### Terminal 3: Master Claude
```bash
cd /path/to/hive/agent-workspaces/master && claude
```

---

### Terminal 4: Coder Bridge
```bash
cd /path/to/hive/agent-workspaces/coder && node message-bridge.js
```

### Terminal 5: Coder Claude
```bash
cd /path/to/hive/agent-workspaces/coder && claude
```

---

### Terminal 6: Researcher Bridge
```bash
cd /path/to/hive/agent-workspaces/researcher && node message-bridge.js
```

### Terminal 7: Researcher Claude
```bash
cd /path/to/hive/agent-workspaces/researcher && claude
```

---

### Terminal 8: Tester Bridge
```bash
cd /path/to/hive/agent-workspaces/tester && node message-bridge.js
```

### Terminal 9: Tester Claude
```bash
cd /path/to/hive/agent-workspaces/tester && claude
```

---

### Terminal 10: File Manager Bridge
```bash
cd /path/to/hive/agent-workspaces/file_manager && node message-bridge.js
```

### Terminal 11: File Manager Claude
```bash
cd /path/to/hive/agent-workspaces/file_manager && claude
```

---

## UI

The UI should already be running at: http://localhost:5173

If not, start it:
```bash
cd /path/to/hive/client && npm run dev
```

---

## First Time Setup

If Claude asks for authentication:
```bash
claude auth
```

Do this ONCE, then all instances will work.

---

## How to Use

1. Type a message in the UI
2. It appears in Master Bridge terminal
3. Copy it to Master Claude terminal
4. Master Claude responds with what to do
5. Use Master Bridge to send to other agents: `send coder <task>`
6. Repeat for other agents

**See START_AGENTS.md for full instructions**
