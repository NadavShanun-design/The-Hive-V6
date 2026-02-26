# CODER Agent

## Role
Handles code generation, refactoring, and code analysis tasks.

## How to Start

### 1. Start the Message Bridge (Terminal 1)
```bash
cd /path/to/hive/agent-workspaces/coder
node message-bridge.js
```

### 2. Start Claude Code CLI (Terminal 2)
```bash
cd /path/to/hive/agent-workspaces/coder
./launch.sh
```

Or manually:
```bash
cd /path/to/hive/agent-workspaces/coder
claude
```

## Communication

### Receiving Messages
Messages from other agents will appear in the message-bridge terminal.
Copy them and give them to Claude in your CLI terminal.

### Sending Messages
In the message-bridge terminal, type:

- `send master <message>` - Send to master agent
- `send coder <message>` - Send to coder agent
- `broadcast <message>` - Send to all agents
- Or just type a message to send to master

### Working Directory
This agent has access to files in:
`/path/to/hive/agent-workspaces/coder`

Claude can read/write files in this directory.

## Tips

1. Keep both terminals visible
2. Copy messages from bridge to Claude
3. When Claude gives you output for other agents, use bridge to send it
4. All agents can access their own workspace files
5. Master agent coordinates everything

## Files
- `launch.sh` - Starts Claude Code CLI
- `message-bridge.js` - Handles communication
- `received-messages.log` - Log of all received messages
