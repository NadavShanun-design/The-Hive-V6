# Agent-to-Agent Communication System

## ✅ FULLY WORKING Multi-Agent Communication

This system implements **real agent-to-agent communication** based on research from:
- **A2A Protocol** (Agent-to-Agent open standard)
- **TeammateTool** (Claude Code's built-in multi-agent system)
- **ccswarm** and **claude-flow** (Production multi-agent frameworks)

## 🎯 What's Implemented

### 1. File-Based Message Broker
- JSON message files in agent inboxes
- Direct messaging between specific agents
- Broadcast messaging to all agents
- Message history and timestamps

### 2. Shared Workspace Access
All agents have environment variables for coordination:
- `$AGENT_NAME` - Agent identifier
- `$SHARED_WORKSPACE` - Common workspace path
- `$AGENT_INBOX` - Personal message inbox
- `$AGENT_PROJECTS` - Shared code/projects
- `$AGENT_TASKS` - Task queue
- `$AGENT_OUTPUTS` - Results directory

### 3. Separate Claude Configs
Each agent maintains independent authentication:
- `~/.claude-agent-master`
- `~/.claude-agent-coder`
- `~/.claude-agent-researcher`
- `~/.claude-agent-tester`
- `~/.claude-agent-file_manager`

## 📨 How It Works

### Architecture

```
┌──────────┐   Message    ┌──────────┐
│  Master  │─────────────►│  Coder   │
│  Agent   │              │  Agent   │
└─────┬────┘              └──────────┘
      │                        ▲
      │ Coordinate             │ Reports back
      ▼                        │
┌──────────────────────────────┴────┐
│    Shared Workspace               │
│  - /messages (mailboxes)          │
│  - /projects (code)                │
│  - /tasks (specifications)         │
│  - /outputs (results)              │
└────────────────────────────────────┘
```

### Message Flow

1. **Master Agent** receives user request
2. **Master** sends message to specialist agent(s)
3. **Specialist** checks inbox, completes task
4. **Specialist** saves output to shared workspace
5. **Specialist** sends completion message back to Master
6. **Master** synthesizes results

## 🚀 Quick Start for Master Agent

### Step 1: Verify Environment

In the Master terminal:
```bash
env | grep AGENT
```

You should see:
```
AGENT_NAME=master
SHARED_WORKSPACE=/path/to/shared-workspace
AGENT_INBOX=/path/to/shared-workspace/messages/master
AGENT_PROJECTS=/path/to/shared-workspace/projects
AGENT_TASKS=/path/to/shared-workspace/tasks
AGENT_OUTPUTS=/path/to/shared-workspace/outputs
```

### Step 2: Read the Guide

```bash
cat $SHARED_WORKSPACE/MASTER_AGENT_GUIDE.md
```

### Step 3: Test Communication

```bash
cd $SHARED_WORKSPACE

# Send a message to coder
node agent-messenger.js send master coder "Hello! Can you see this message?"

# Broadcast to everyone
node agent-messenger.js broadcast master "Team standup in 5 minutes!"

# Check your inbox for responses
node agent-messenger.js read master
```

### Step 4: Coordinate a Real Task

```bash
# Example: Build a login system

# 1. Research phase
node agent-messenger.js send master researcher "Research best practices for secure authentication in Node.js applications"

# 2. Wait for research (check inbox in 30 seconds)
sleep 30
node agent-messenger.js read master

# 3. Delegate implementation
node agent-messenger.js send master coder "Implement JWT-based authentication, save to $AGENT_PROJECTS/auth/jwt-auth.js"

# 4. Request testing
node agent-messenger.js send master tester "Test the JWT authentication for security vulnerabilities"

# 5. Check all outputs
ls -la $AGENT_OUTPUTS/
```

## 📖 For Other Agents

### Coder Agent Workflow

```bash
# 1. Check inbox regularly
cd $SHARED_WORKSPACE
node agent-messenger.js read coder

# 2. Complete the task (write code)
# ... do your coding work ...

# 3. Save output
echo "Login function implemented" > $AGENT_OUTPUTS/coder-login-impl.md

# 4. Report back
node agent-messenger.js send coder master "Task complete: $AGENT_OUTPUTS/coder-login-impl.md"

# 5. Clear inbox
node agent-messenger.js clear coder
```

### Researcher Agent Workflow

```bash
# Check tasks
node agent-messenger.js read researcher

# Do research

# Save findings
echo "OAuth 2.0 recommended" > $AGENT_OUTPUTS/researcher-auth-analysis.md

# Report
node agent-messenger.js send researcher master "Research complete: $AGENT_OUTPUTS/researcher-auth-analysis.md"
```

### Tester Agent Workflow

```bash
# Check test requests
node agent-messenger.js read tester

# Run tests

# Save results
echo "All tests passed" > $AGENT_OUTPUTS/tester-results.txt

# Report
node agent-messenger.js send tester master "Testing complete: $AGENT_OUTPUTS/tester-results.txt"
```

## 💡 Best Practices

### 1. Use Shared Workspace Paths
Always reference `$AGENT_PROJECTS`, `$AGENT_OUTPUTS`, etc. in messages

### 2. Be Specific
Include clear instructions and file paths:
- ❌ "Do some coding"
- ✅ "Implement login() function in $AGENT_PROJECTS/auth/login.js using bcrypt"

### 3. Check Inbox Regularly
```bash
# Run this periodically
node agent-messenger.js read $AGENT_NAME
```

### 4. Acknowledge Messages
When you receive a task, send confirmation:
```bash
node agent-messenger.js send $AGENT_NAME master "Task received, starting work on authentication"
```

### 5. Report Completion
Always tell Master when done:
```bash
node agent-messenger.js send $AGENT_NAME master "Completed: results in $AGENT_OUTPUTS/my-output.md"
```

## 🔧 Tested and Working

✅ Message sending (direct)
✅ Message broadcasting (to all)
✅ Message reading (inbox)
✅ Shared workspace access
✅ Environment variables
✅ Separate Claude configs
✅ Real terminal emulation
✅ File-based coordination

## 📚 References

This implementation is based on:

1. **A2A Protocol** - https://github.com/a2aproject/A2A
   - JSON-RPC 2.0 messaging
   - Agent discovery and capabilities
   
2. **TeammateTool** (Built into Claude Code)
   - File-based mailbox system
   - Leader-worker patterns
   
3. **ccswarm** - https://github.com/nwiizo/ccswarm
   - ACP (Agent Client Protocol)
   - WebSocket communication
   - Git worktree isolation

4. **Claude Flow** - https://github.com/ruvnet/claude-flow
   - Enterprise multi-agent swarms
   - Distributed coordination

## 🎉 You're Ready!

Your multi-agent system is now **fully operational** with:
- Real terminals (node-pty + xterm.js)
- Real Claude Code CLI instances
- Real agent-to-agent communication
- Shared workspace coordination
- File-based message passing

**Open your browser at http://localhost:3000 and start coordinating!**

---

Built with real research, real code, real terminals, and real agent communication! 🚀
