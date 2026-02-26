# Shared Workspace for Multi-Agent System

## 📁 Directory Structure

```
shared-workspace/
├── messages/          # Agent mailboxes for communication
│   ├── master/       # Master agent inbox
│   ├── coder/        # Coder agent inbox
│   ├── researcher/   # Researcher agent inbox
│   ├── tester/       # Tester agent inbox
│   └── file_manager/ # File manager agent inbox
├── projects/         # Shared project files
├── tasks/            # Task specifications and queues
├── outputs/          # Agent outputs and results
├── agent-messenger.js # Message broker CLI
├── MASTER_AGENT_GUIDE.md # Master coordination guide
└── README.md         # This file
```

## 🔑 Environment Variables

Each agent has access to:

- `$AGENT_NAME` - Your agent name (master, coder, researcher, tester, file_manager)
- `$SHARED_WORKSPACE` - Path to this directory
- `$AGENT_INBOX` - Your personal inbox
- `$AGENT_PROJECTS` - Shared projects directory
- `$AGENT_TASKS` - Shared tasks directory
- `$AGENT_OUTPUTS` - Shared outputs directory

Check with: `env | grep AGENT`

## 📨 Communication Protocol

All agents use `agent-messenger.js` for communication:

### Send a message:
```bash
node agent-messenger.js send <from> <to> "<message>"
```

### Broadcast to all:
```bash
node agent-messenger.js broadcast <from> "<message>"
```

### Read your inbox:
```bash
node agent-messenger.js read <your-name>
```

### Clear your inbox:
```bash
node agent-messenger.js clear <your-name>
```

## 👥 Agent Roles

- **Master**: Orchestration leader, coordinates all agents
- **Coder**: Writes and modifies code
- **Researcher**: Investigates and gathers information
- **Tester**: Tests code and validates functionality
- **File Manager**: Handles file operations and organization

## 🚀 Quick Start

1. **Check your environment:**
   ```bash
   env | grep AGENT
   ```

2. **Read the guide for your role:**
   - Master Agent: Read `MASTER_AGENT_GUIDE.md`
   - Other Agents: Check inbox regularly and respond to tasks

3. **Test messaging:**
   ```bash
   # Send a test message
   node agent-messenger.js send $AGENT_NAME master "Hello from $AGENT_NAME!"
   
   # Check your inbox
   node agent-messenger.js read $AGENT_NAME
   ```

4. **Start collaborating!**

## 📖 Examples

### For Coder Agent:

```bash
# Check for tasks
node agent-messenger.js read coder

# Complete a task and save output
echo "Login function implemented" > $AGENT_OUTPUTS/login-impl.md

# Report back to master
node agent-messenger.js send coder master "Login function complete, see $AGENT_OUTPUTS/login-impl.md"
```

### For Researcher Agent:

```bash
# Check inbox
node agent-messenger.js read researcher

# Do research, save findings
echo "OAuth 2.0 is the best option" > $AGENT_OUTPUTS/auth-research.md

# Send results
node agent-messenger.js send researcher master "Research complete: $AGENT_OUTPUTS/auth-research.md"
```

### For Tester Agent:

```bash
# Read test requests
node agent-messenger.js read tester

# Run tests, save results
echo "All tests passed" > $AGENT_OUTPUTS/test-results.txt

# Report
node agent-messenger.js send tester master "Testing complete, results in $AGENT_OUTPUTS/test-results.txt"
```

## 🔄 Workflow Pattern

1. **Master receives user request**
2. **Master delegates to specialists via messages**
3. **Specialists check inbox, complete tasks, save to shared workspace**
4. **Specialists respond with results location**
5. **Master coordinates and synthesizes results**

## 💡 Tips

- Always use `$AGENT_PROJECTS`, `$AGENT_TASKS`, `$AGENT_OUTPUTS` for shared files
- Check your inbox regularly: `node agent-messenger.js read $AGENT_NAME`
- Be specific in messages - include file paths and clear instructions
- Clear completed messages to keep inbox organized

---

This is a **file-based messaging system** inspired by A2A protocol and TeammateTool patterns. It enables real Claude Code CLI agents to communicate and collaborate!
