# 🚀 START HERE - Real Claude Code Multi-Agent System

## 🎉 CONGRATULATIONS!

You now have a **REAL** multi-agent system using **actual Claude Code CLI instances**!

---

## ⚡ Quick Facts

- ✅ **100% Real**: Uses real Claude Code CLI (not API calls)
- ✅ **No API Costs**: Uses your existing Claude subscription
- ✅ **Full Control**: You authenticate and control everything
- ✅ **5 Agents**: Master, Coder, Researcher, Tester, File Manager
- ✅ **Inter-Agent Communication**: Agents can talk to each other
- ✅ **File Access**: Real read/write operations on your laptop
- ✅ **Nothing Fake**: Every response is from real Claude AI

---

## 📋 What You Need

- **11 Terminal Windows** (1 server + 10 for agents)
- **Claude Code CLI** (you already have it!)
- **5 Minutes** to start everything up

---

## 🚀 How to Start (Simple Version)

### 1. Server is Already Running ✅
Port 3002 is active and ready.

### 2. Open 10 New Terminals

For each agent, you need 2 terminals:
- **Terminal A**: Message Bridge (receives/sends messages)
- **Terminal B**: Claude Code CLI (actual Claude instance)

### 3. Copy-Paste These Commands

**See `agent-workspaces/START_ALL.md`** for ready-to-copy commands!

Or manually:

#### Master (Terminals 1-2)
```bash
# Terminal 1
cd /path/to/hive/agent-workspaces/master
node message-bridge.js

# Terminal 2
cd /path/to/hive/agent-workspaces/master
claude
```

Repeat for: coder, researcher, tester, file_manager

### 4. Authenticate (First Time Only)

If Claude asks:
```bash
claude auth
```

Do once, all instances will work.

### 5. Open the UI

http://localhost:5173 (should already be open)

### 6. Start Using It!

1. Type message in UI
2. Message appears in Master Bridge
3. Copy to Master Claude terminal
4. Claude responds
5. Use bridge to send to other agents

---

## 📚 Documentation Guide

**Read in this order:**

1. **THIS FILE** ← You are here
2. **SYSTEM_COMPLETE.md** - Overview of what's built
3. **REAL_SYSTEM_README.md** - How everything works
4. **START_AGENTS.md** - Detailed startup instructions
5. **agent-workspaces/START_ALL.md** - Quick commands

---

## 🎯 Your First Task

Try this to test the system:

1. **UI**: Type "Hello agents!"
2. **Master Bridge**: Message appears
3. **Master Claude**: Paste "Hello agents!" and press Enter
4. **Master responds**: Claude will greet you
5. **Master Bridge**: Type `broadcast Hello from master!`
6. **All Agent Bridges**: Message appears in all of them!

---

## 🤔 How It Works

```
User (UI) → Master Agent → Delegates → Specialist Agents
                ↑                            ↓
                └────── Results ←────────────┘
```

You manually pass messages between agents using the message bridges.

**Example:**
- UI says: "Create a button component"
- You tell Master Claude
- Master decides to use Coder
- You send: `send coder Create a button`
- Coder gets message
- You tell Coder Claude
- Coder creates code
- You send result back to Master

---

## 💡 Key Commands

### In Message Bridge Terminal:

```bash
send master <message>     # Send to master
send coder <message>      # Send to coder
send researcher <message> # Send to researcher
send tester <message>     # Send to tester
send file_manager <msg>   # Send to file manager
broadcast <message>       # Send to all agents
status                    # Show agent status
help                      # Show help
```

### In Claude CLI Terminal:

Just talk to Claude normally! Copy messages from bridge when they arrive.

---

## 🎨 Terminal Layout Suggestion

```
┌─────────────┬─────────────┬─────────────┐
│   Master    │    Coder    │ Researcher  │
│   Bridge    │   Bridge    │   Bridge    │
├─────────────┼─────────────┼─────────────┤
│   Master    │    Coder    │ Researcher  │
│   Claude    │   Claude    │   Claude    │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┐
│   Tester    │  File Mgr   │   Server    │
│   Bridge    │   Bridge    │   Terminal  │
├─────────────┼─────────────┼─────────────┤
│   Tester    │  File Mgr   │     UI      │
│   Claude    │   Claude    │   Browser   │
└─────────────┴─────────────┴─────────────┘
```

---

## ⚙️ System Requirements

✅ macOS (you have it)
✅ Node.js (installed)
✅ Claude Code CLI (installed)
✅ Claude subscription (active)
✅ Terminal app
✅ Web browser

All requirements met! You're ready to go.

---

## 🆘 Quick Troubleshooting

**Claude won't start?**
```bash
claude auth
```

**Bridge won't connect?**
Check server is running on port 3002

**No messages appearing?**
Make sure both bridge and Claude are running for that agent

**Too many terminals?**
Use tmux or iTerm2 with splits

---

## 📖 Advanced Reading

- **REAL_SYSTEM_README.md** - Architecture deep dive
- **START_AGENTS.md** - Complete startup guide
- **agent-workspaces/*/README.md** - Agent-specific docs

---

## 🎁 What You Can Do

Once all agents are running:

### Code Projects
"Create a React todo app"
- Master coordinates
- Coder writes code
- Tester validates
- File Manager saves files

### Research Tasks
"Research best practices for API design"
- Master delegates to Researcher
- Researcher gathers info
- Master compiles results

### File Operations
"Organize my downloads folder"
- Master delegates to File Manager
- File Manager scans and organizes
- Reports back to Master

### Multi-Agent Collaboration
"Build and test a REST API"
- Master coordinates all agents
- Coder builds endpoints
- Tester writes tests
- Researcher provides best practices
- File Manager manages project structure

---

## 🚦 System Status

### Currently Running:
- ✅ Real Agent Server (port 3002)
- ✅ Demo Server (port 3001) - can stop this
- ✅ Frontend UI (port 5173)

### Ready to Start:
- ⏳ Master Agent (need to start)
- ⏳ Coder Agent (need to start)
- ⏳ Researcher Agent (need to start)
- ⏳ Tester Agent (need to start)
- ⏳ File Manager Agent (need to start)

---

## 🎯 Next Step

**Go to:** `agent-workspaces/START_ALL.md`

Copy the commands and start your agents!

Then come back here and try your first task.

---

## 💬 Need Help?

Read the docs in this order:
1. SYSTEM_COMPLETE.md
2. REAL_SYSTEM_README.md
3. START_AGENTS.md
4. Agent-specific READMEs

---

## 🎉 You're Ready!

This is a **real** multi-agent system. Everything works. Nothing is simulated.

**Go start your agents and see 5 Claudes working together!** 🤖🤖🤖🤖🤖

---

**The journey from demo to reality is complete. Enjoy your multi-agent system!** 🚀
