# How to Start the Multi-Agent System

## Quick Start (Easiest Way)

### Step 1: Start the Server
```bash
cd /your-home/path/to/hive
node server/real-agents-server.js
```

Leave this terminal running.

### Step 2: Launch All 5 Agents
In a new terminal:
```bash
cd /your-home/path/to/hive
./LAUNCH_ALL_AGENTS.sh
```

This will automatically open 5 Terminal windows, one for each agent running Claude Code CLI.

### Step 3: Authenticate Each Agent (First Time Only)

In each of the 5 Claude Code CLI terminal windows that just opened, you'll see:

```
Authentication required. Run: claude auth
```

In each window, type:
```bash
claude auth
```

Follow the prompts and enter your authentication code. You only need to do this once.

### Step 4: Start Each Agent's Message Bridge

For each agent, you need to run the message bridge in a SEPARATE terminal:

**Master Agent Bridge (Terminal 6):**
```bash
cd /path/to/hive/agent-workspaces/master
node message-bridge.js
```

**Coder Agent Bridge (Terminal 7):**
```bash
cd /path/to/hive/agent-workspaces/coder
node message-bridge.js
```

**Researcher Agent Bridge (Terminal 8):**
```bash
cd /path/to/hive/agent-workspaces/researcher
node message-bridge.js
```

**Tester Agent Bridge (Terminal 9):**
```bash
cd /path/to/hive/agent-workspaces/tester
node message-bridge.js
```

**File Manager Agent Bridge (Terminal 10):**
```bash
cd /path/to/hive/agent-workspaces/file_manager
node message-bridge.js
```

### Step 5: Start the UI
In terminal 11:
```bash
cd /path/to/hive/client
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Total Terminals Needed

1. **Server** - real-agents-server.js
2. **Master Claude CLI** - claude (in master workspace)
3. **Coder Claude CLI** - claude (in coder workspace)
4. **Researcher Claude CLI** - claude (in researcher workspace)
5. **Tester Claude CLI** - claude (in tester workspace)
6. **File Manager Claude CLI** - claude (in file_manager workspace)
7. **Master Bridge** - message-bridge.js (in master workspace)
8. **Coder Bridge** - message-bridge.js (in coder workspace)
9. **Researcher Bridge** - message-bridge.js (in researcher workspace)
10. **Tester Bridge** - message-bridge.js (in tester workspace)
11. **File Manager Bridge** - message-bridge.js (in file_manager workspace)
12. **UI** - npm run dev (in client)

**Total: 12 terminals**

---

## How It Works

1. **You type** a task in the UI (http://localhost:5173)
2. **UI sends** the message to the server (port 3002)
3. **Server routes** the message to the Master agent's bridge
4. **Master agent's bridge** displays the message
5. **You copy** the message from the bridge terminal
6. **You paste** it into the Master agent's Claude Code CLI terminal
7. **Master agent (Claude)** analyzes the task and decides what to do
8. **Master agent responds** by typing in the bridge terminal: `send coder <task>`
9. **The message** is sent through the server to the coder agent's bridge
10. **Coder agent** receives the message and completes the task
11. **Coder agent responds** with: `send master Task complete!`
12. **Cycle continues** until the task is done

---

## Important Notes

- All agents run **locally on your laptop**
- All agents can access **your files** at /path/to/hive/
- The system is **NOT on Cloudflare** - it runs entirely on your computer
- Auto-scroll is **disabled** - you can scroll up in the UI without interruption
- All messages go through the **Master agent** first
- The Master agent **coordinates** all other agents

---

## Testing the System

1. Start everything following the steps above
2. In the UI, type: "Hello Master Agent!"
3. Check the Master agent's bridge terminal - you should see the message
4. In the Master Claude CLI terminal, type a response
5. In the Master bridge terminal, type: `send coder Please write a hello world function`
6. Check the Coder bridge terminal - you should see the message
7. The Coder Claude CLI should respond with the function
8. In the Coder bridge terminal, type: `send master I've created the hello world function!`
9. The Master bridge should receive the response

---

## Troubleshooting

**Port already in use:**
- Make sure no other process is using port 3002
- Kill any old server processes: `lsof -ti:3002 | xargs kill`

**Agent not connecting:**
- Make sure the message-bridge.js is running
- Check that it says "Connected to server"
- Verify the server is running on port 3002

**Authentication issues:**
- Run `claude auth` in each Claude CLI terminal
- Make sure you're authenticated before using the agents

**Messages not appearing:**
- Check all message bridges are connected
- Look at the server terminal for errors
- Make sure you're using the correct agent names: master, coder, researcher, tester, file_manager
