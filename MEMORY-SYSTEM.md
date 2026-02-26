# Agent Memory System

## Overview

Each agent in Vibe-coder now has its own persistent memory that tracks all interactions, commands, and context. This allows agents to remember previous conversations and maintain continuity across sessions.

## Features

- **Individual Memory Storage**: Each agent (master, coder, researcher, tester, file_manager) has separate memory
- **Automatic Tracking**: All commands typed in terminals are automatically saved
- **Prompt History**: Complete history of all prompts and responses
- **Context Awareness**: Agents track current working directory, files, and session info
- **Memory Summary**: Human-readable markdown summaries of agent activity
- **Search Capability**: Search through past prompts by keyword
- **REST API**: Full API for memory operations
- **CLI Tool**: Command-line tool for quick memory access

## Memory Storage

Memory is stored locally in the `agent-memory/` directory:

```
agent-memory/
├── master/
│   ├── prompt-history.json      # All prompts/responses
│   ├── memory-summary.md        # Human-readable summary
│   └── context.json             # Current context
├── coder/
├── researcher/
├── tester/
└── file_manager/
```

## Using Memory in Terminals

### Automatic Tracking

Every command you type in a terminal is automatically saved to that agent's memory. For example:

```bash
# In the coder terminal:
claude "write a function to parse JSON"
# This is automatically saved to coder's memory
```

### Accessing Memory from Terminal

Use the memory CLI tool from any terminal:

```bash
# Show memory summary
node memory-cli.js master show

# Show last 10 prompts
node memory-cli.js coder history

# Show last 20 prompts
node memory-cli.js coder history 20

# Search for prompts containing "authentication"
node memory-cli.js researcher search "authentication"

# Show current context
node memory-cli.js tester context

# Export all memory as JSON
node memory-cli.js file_manager export

# Clear all memory (use with caution!)
node memory-cli.js master clear
```

### Using Memory with Claude Code CLI

When prompting Claude in a terminal, you can reference the agent's memory:

```bash
# In master terminal:
claude "Look into your memory and tell me what tasks I gave you yesterday"

# In coder terminal:
claude "Check your memory - what files were you working on last session?"

# In researcher terminal:
claude "Search your memory for information about the authentication system"
```

The agent can use the memory CLI tool to access its own history:

```bash
# Claude can run this inside the terminal:
node memory-cli.js coder history 5
```

## REST API

### Get Memory Summary

```bash
curl http://localhost:3000/api/memory/master
```

Response:
```json
{
  "agent": "master",
  "context": {
    "agentName": "master",
    "role": "Orchestrates and coordinates tasks across all agents",
    "currentWorkingDirectory": "/Users/...",
    "sessionCount": 42,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  },
  "summary": "# MASTER Agent Memory\n...",
  "recentPrompts": [...]
}
```

### Get Prompt History

```bash
# Get all prompts
curl http://localhost:3000/api/memory/coder/history

# Get last 20 prompts
curl http://localhost:3000/api/memory/coder/history?limit=20
```

### Save a Prompt Manually

```bash
curl -X POST http://localhost:3000/api/memory/researcher/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Research authentication methods",
    "response": "Found 3 common methods...",
    "metadata": {
      "cwd": "/path/to/project",
      "files": ["auth.js", "login.js"]
    }
  }'
```

### Search Prompts

```bash
curl http://localhost:3000/api/memory/tester/search?q=unit+test
```

### Export All Memory

```bash
curl http://localhost:3000/api/memory/file_manager/export > backup.json
```

### Clear Memory

```bash
curl -X DELETE http://localhost:3000/api/memory/master
```

### Get Overview of All Agents

```bash
curl http://localhost:3000/api/memory
```

## Memory Structure

### prompt-history.json

```json
[
  {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "prompt": "Write a function to parse JSON",
    "response": "Here's a JSON parser...",
    "metadata": {
      "cwd": "/Users/user/project",
      "files": ["parser.js"],
      "type": "command"
    }
  }
]
```

### context.json

```json
{
  "agentName": "coder",
  "role": "Writes and implements code, handles development tasks",
  "currentWorkingDirectory": "/Users/user/project",
  "currentFiles": ["index.js", "utils.js"],
  "lastUpdated": "2024-01-01T12:00:00.000Z",
  "sessionCount": 15,
  "lastPrompt": "Write a function...",
  "lastResponse": "Here's the function..."
}
```

### memory-summary.md

A human-readable markdown file with:
- Agent role and purpose
- Current context (working directory, session count, etc.)
- Recent prompts (last 5)
- Current files being worked on

## Agent Roles

Each agent has a predefined role stored in memory:

- **master**: Orchestrates and coordinates tasks across all agents
- **coder**: Writes and implements code, handles development tasks
- **researcher**: Researches solutions, documentation, and best practices
- **tester**: Tests code, writes tests, ensures quality
- **file_manager**: Manages files, organizes project structure

## Example Workflows

### 1. Continuity Across Sessions

```bash
# Session 1 - In coder terminal:
claude "Implement user authentication"
# ... work happens ...

# Session 2 - Later, in same terminal:
claude "Look at your memory - continue working on the authentication feature"
# Agent can see previous work and continue
```

### 2. Cross-Agent Coordination

```bash
# In master terminal:
claude "Coordinate with coder agent to implement login, then tester agent to test it"

# Master can check what coder did:
node memory-cli.js coder history 5

# Master can check what tester did:
node memory-cli.js tester history 5
```

### 3. Research and Implementation

```bash
# In researcher terminal:
claude "Research best practices for JWT authentication"

# Later, in coder terminal:
claude "Check researcher agent's memory for JWT info, then implement it"
# Coder runs: node memory-cli.js researcher search "JWT"
```

### 4. Testing Previous Work

```bash
# In tester terminal:
claude "Look at your memory - what files did you test last session? Run those tests again"
```

## Tips

1. **Be Specific**: When asking agents to check memory, be specific about what you want
   - Good: "Check your last 5 prompts"
   - Better: "Search your memory for prompts about authentication"

2. **Cross-Agent References**: Agents can check each other's memory
   ```bash
   node memory-cli.js coder history 5  # Check what coder did
   ```

3. **Regular Summaries**: Ask agents to check their memory at the start of sessions
   ```bash
   claude "Show me your memory summary and continue from where we left off"
   ```

4. **Memory Backups**: Export memory regularly
   ```bash
   curl http://localhost:3000/api/memory/master/export > master-backup.json
   ```

## Memory Persistence

- Memory persists across terminal sessions
- Memory survives server restarts
- Each agent maintains independent memory
- Memory is stored locally in JSON/MD files
- No cloud dependency (all local)

## Technical Details

- Memory is implemented in `memory-manager.js`
- Automatic tracking happens in `server.js` WebSocket handlers
- CLI tool available at `memory-cli.js`
- API endpoints available at `/api/memory/*`
- History limited to last 1000 prompts per agent (configurable)

## Future Enhancements

- Cloud sync option (Cloudflare R2, S3, etc.)
- Automatic summarization of long histories
- Memory sharing between agents
- Memory visualization in UI
- Search with fuzzy matching
- Memory compression for old entries
