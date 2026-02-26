# Vibe-Coder: Comprehensive Architecture Analysis

**Generated:** February 4, 2026
**Project Location:** `/your-home/path/to/hive`
**Type:** Multi-Agent Terminal Orchestration System

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [Existing Features](#existing-features)
6. [Agent System](#agent-system)
7. [Communication Layer](#communication-layer)
8. [Memory System](#memory-system)
9. [Deployment Status](#deployment-status)
10. [Known Issues & Optimization Opportunities](#known-issues--optimization-opportunities)
11. [What's Working vs What Needs to Be Built](#whats-working-vs-what-needs-to-be-built)

---

## EXECUTIVE SUMMARY

Vibe-Coder is a **real terminal orchestration system** that uses `node-pty` to spawn actual bash shells in the browser via WebSockets. It provides:

- **5 Independent Agent Terminals** (Master, Coder, Researcher, Tester, File Manager)
- **Real Claude Code CLI Integration** - Each agent can authenticate separately
- **File-Based Message Broker** - Agent-to-agent communication via JSON files
- **Persistent Memory System** - Each agent tracks history and context
- **Hybrid Frontend** - React UI + xterm.js terminals
- **WebSocket Real-Time Communication** - Live terminal I/O streaming

**Status:** Functional system with real terminals and basic agent communication. NOT using actual AI agents yet - this is a terminal orchestration framework ready for AI integration.

---

## CURRENT ARCHITECTURE

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ React App (client/src/)                                  │  │
│  │  - Dashboard with agent status                           │  │
│  │  - Task submission interface                             │  │
│  │  - Message feed / Communication display                  │  │
│  │  - Quick Ideas feature with voice input                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓ WebSocket                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Terminal UI (public/app.js + xterm.js)                   │  │
│  │  - 5 xterm.js terminal instances                         │  │
│  │  - Real-time output streaming                            │  │
│  │  - Input echo and character rendering                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ WebSocket Connections
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Server (server.js)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Express HTTP Server (Port 3000 or env.PORT)              │  │
│  │  - Static file serving (public/)                         │  │
│  │  - Memory API endpoints (/api/memory/*)                  │  │
│  │  - Prompt saving endpoints (/api/save-prompt)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WebSocket Server (ws://)                                 │  │
│  │  - Handles 5 concurrent agent connections                │  │
│  │  - Routes terminal I/O                                   │  │
│  │  - Manages auto-prompt watching                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Memory Manager (memory-manager.js)                       │  │
│  │  - Tracks prompt history per agent                       │  │
│  │  - Maintains context and summaries                       │  │
│  │  - Provides search and export capabilities               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Command Watcher (watchForCommands)                       │  │
│  │  - Monitors /shared-workspace/messages/{agent}/           │  │
│  │  - Watches for __command_* files                         │  │
│  │  - Auto-injects commands into terminals                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ node-pty Spawning
┌─────────────────────────────────────────────────────────────────┐
│                   Real PTY Sessions (node-pty)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5 Real Bash Shell Sessions (/bin/bash)                   │  │
│  │  - Master:        ~/.claude-agent-master                 │  │
│  │  - Coder:         ~/.claude-agent-coder                  │  │
│  │  - Researcher:    ~/.claude-agent-researcher             │  │
│  │  - Tester:        ~/.claude-agent-tester                 │  │
│  │  - File Manager:  ~/.claude-agent-file_manager           │  │
│  │                                                           │  │
│  │ Each has separate:                                       │  │
│  │  - CLAUDE_CONFIG_DIR (isolated authentication)           │  │
│  │  - SHARED_WORKSPACE access (shared-workspace/)           │  │
│  │  - Message inbox (shared-workspace/messages/{name}/)     │  │
│  │  - Working directory                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input → Browser Terminal** (xterm.js)
2. **Browser → WebSocket → Server** (JSON message with type: 'input')
3. **Server → node-pty Process** (ptyProcess.write())
4. **Shell → PTY Output** (ptyProcess.onData())
5. **Server → WebSocket → Browser** (JSON with type: 'output')
6. **Browser → xterm.js Terminal** (term.write())

---

## TECHNOLOGY STACK

### Backend
- **Runtime**: Node.js (v18+)
- **Server**: Express.js 4.18
- **Terminal Emulation**: node-pty 1.0.0 (native PTY binding)
- **WebSocket**: ws 8.16 (WebSocket server)
- **Storage**: File system (JSON files)
- **CLI Integration**: Claude Code CLI (user-authenticated)

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Terminal UI**: xterm.js 5.3 + xterm-addon-fit
- **State Management**: React hooks (useState, useEffect, useRef)
- **Voice Input**: Web Speech API (browser native)

### Data Persistence
- **Prompt History**: JSON files (agent-memory/{agent}/prompt-history.json)
- **Memory Summaries**: Markdown files (agent-memory/{agent}/memory-summary.md)
- **Agent Context**: JSON files (agent-memory/{agent}/context.json)
- **Shared Workspace**: File-based message queue (shared-workspace/messages/)

### Infrastructure (Current)
- **Hosting**: Local development (localhost:3000)
- **Deployment**: None yet (DEPLOYMENT.md covers Vercel option)
- **Cloud Integration**: Planned Cloudflare (not implemented)

---

## FILE STRUCTURE

### Root Level
```
/path/to/hive/
├── server.js                              # Main server (Express + WS + Memory)
├── memory-manager.js                      # Agent memory persistence
├── memory-cli.js                          # CLI tool for memory access
├── package.json                           # Root dependencies (express, ws, node-pty)
├── package-lock.json
│
├── client/                                # React frontend
│   ├── src/
│   │   ├── App.jsx                       # Main React component
│   │   ├── App.css                       # Styling
│   │   ├── main.jsx                      # Entry point
│   │   └── index.css                     # Global styles
│   ├── package.json                      # React + Vite dependencies
│   ├── vite.config.js                    # Vite configuration
│   ├── eslint.config.js
│   └── dist/                             # Built React app
│
├── public/                                # Served static files
│   ├── index.html                        # HTML with 5 xterm containers
│   └── app.js                            # WebSocket + xterm.js initialization
│
├── server/                                # Alternative server implementations
│   ├── agents.js                         # Agent message bus (MessageBus class)
│   ├── claude-agent-manager.js           # Agent workspace setup
│   ├── real-agents-server.js             # Prototype real agents server
│   └── package.json
│
├── shared-workspace/                     # Inter-agent communication
│   ├── messages/
│   │   ├── master/                      # Master's inbox
│   │   ├── coder/                       # Coder's inbox
│   │   ├── researcher/                  # Researcher's inbox
│   │   ├── tester/                      # Tester's inbox
│   │   └── file_manager/                # File Manager's inbox
│   ├── tasks/                           # Task queue
│   ├── projects/                        # Shared project files
│   ├── outputs/                         # Agent output results
│   ├── agent-messenger.js               # File-based message API
│   ├── auto-prompt.js                   # Auto-prompt injection
│   ├── MASTER_AGENT_GUIDE.md            # Instructions for master agent
│   └── README.md
│
├── agent-memory/                        # Persistent agent memory
│   ├── master/
│   │   ├── prompt-history.json         # All prompts/responses
│   │   ├── memory-summary.md           # Human-readable summary
│   │   └── context.json                # Current context
│   ├── coder/
│   ├── researcher/
│   ├── tester/
│   └── file_manager/
│
├── agent-workspaces/                    # Agent working directories
│   ├── master/
│   ├── coder/
│   ├── researcher/
│   ├── tester/
│   └── file_manager/
│
├── last-prompt/                         # Quick ideas storage
│   ├── latest.json                      # Most recent prompt
│   └── prompt_*.json                    # Historical prompts
│
├── clerk-integration/                   # Clerk authentication package
│   ├── frontend/                        # React login components
│   ├── backend/                         # Rust/Tauri commands
│   ├── plugin/                          # Tauri plugin
│   ├── config/                          # Configuration
│   ├── docs/                            # Documentation
│   └── README.md
│
├── Documentation/
│   ├── README.md                        # Project overview
│   ├── DEPLOYMENT.md                    # Vercel deployment guide
│   ├── MEMORY-SYSTEM.md                 # Memory system documentation
│   ├── AGENT_COMMUNICATION_GUIDE.md     # Communication patterns
│   ├── AUTO_PROMPTING_GUIDE.md          # Auto-prompt system
│   ├── ARCHITECTURE_OPTIONS.md          # Design options (Hybrid/Local/Cloud)
│   ├── CURRENT_STATUS.md                # Status and next steps
│   ├── QUICK_FIX_GUIDE.md               # Optimization tips (170MB → 70MB)
│   ├── OPTIMIZATION_REPORT.md           # Detailed analysis
│   └── [Other guides...]
│
└── node_modules/                        # 137MB of dependencies
    ├── node-pty/                        # 62MB - Terminal emulation
    ├── express/                         # HTTP server
    ├── ws/                              # WebSocket
    └── [others...]
```

### Client Subdirectories
```
client/src/
├── App.jsx                 # Main component with agent status, task form, messages
├── App.css                 # Styled components
├── main.jsx               # React 19 entry point
├── index.css              # Global CSS
└── assets/                # Images/static

client/dist/               # Built production bundle (~212KB)
├── index.html            # Generated HTML
├── assets/               # Chunked JS/CSS
└── [hash].js files
```

---

## EXISTING FEATURES

### ✅ FULLY WORKING

#### 1. **Real Terminal Sessions**
- 5 actual bash shells via node-pty
- Proper TTY emulation (xterm-color)
- Real ANSI color support
- Proper terminal resizing

#### 2. **Browser-Based Terminal UI**
- xterm.js with fit addon (responsive sizing)
- Separate terminal for each agent
- Agent status indicators (connected/disconnected)
- Dark theme with syntax highlighting

#### 3. **Claude Code CLI Integration**
- Each agent has isolated config directory
- Can run `claude` command in any terminal
- Separate authentication per agent
- Session persistence

#### 4. **Memory System** (See MEMORY-SYSTEM.md)
- Automatic prompt history tracking
- Per-agent memory storage (1000 prompts max)
- Context tracking (working directory, files, session count)
- Memory summaries (markdown)
- REST API for memory access
- CLI tool for quick access
- Search capability

#### 5. **Agent-to-Agent Communication**
- File-based message broker (shared-workspace/messages/)
- Direct messaging (agent → agent)
- Broadcast messaging (agent → all)
- Message inbox (read/clear/list)
- Task completion reporting
- Message timestamps and IDs

#### 6. **Shared Workspace**
- Common directory structure
- Environment variables for all agents:
  - `$AGENT_NAME` - Agent identifier
  - `$SHARED_WORKSPACE` - Common path
  - `$AGENT_INBOX` - Personal inbox
  - `$AGENT_PROJECTS` - Shared projects
  - `$AGENT_TASKS` - Task queue
  - `$AGENT_OUTPUTS` - Results directory

#### 7. **API Endpoints**
```
GET  /api/memory                              # All agents overview
GET  /api/memory/:agent                       # Agent memory summary
GET  /api/memory/:agent/history               # Prompt history (with limit)
GET  /api/memory/:agent/search?q=keyword      # Search prompts
GET  /api/memory/:agent/export                # Export all memory
POST /api/memory/:agent/prompt                # Save new prompt
DELETE /api/memory/:agent                     # Clear all memory

POST /api/save-prompt                         # Save quick idea
GET  /api/saved-prompts                       # Get all quick ideas
```

#### 8. **Voice Input** (Web Speech API)
- Microphone dictation support
- Voice-to-text for quick ideas
- Browser native (Chrome/Edge required)

#### 9. **Auto-Prompting System**
- Watch for `__command_*.json` files
- Auto-inject commands into terminals
- Used for master-to-agent command delegation

---

### ⚠️ PARTIALLY WORKING / NEEDS REFINEMENT

#### 1. **React UI**
- Status: Functional but basic
- Issue: Auto-scroll removed, key warnings on messages
- Missing: Real-time agent status updates
- Missing: Message filtering/search in UI

#### 2. **Clerk Integration** (Planned, not integrated with main system)
- Authentication plugin for Tauri
- Located in `clerk-integration/` directory
- Has complete documentation but NOT connected to main system
- Status: Standalone, awaiting integration

#### 3. **Deployment**
- Status: Only DEPLOYMENT.md written (Vercel for frontend)
- Backend still local-only
- No Cloudflare Workers setup yet
- ngrok tunnel documented but not tested

---

### ❌ NOT WORKING / NOT YET BUILT

#### 1. **Real AI Integration**
- No Claude API usage yet
- No agent intelligence
- Agents are just terminal shells
- No automated decision-making

#### 2. **Master Agent Orchestration**
- No automatic task delegation
- No workflow coordination
- No dependency management between agents

#### 3. **Cloudflare Deployment**
- Design discussed (ARCHITECTURE_OPTIONS.md)
- Not implemented
- Would require durable objects for state
- Needs environment variable tunneling

#### 4. **MOLTBOT Integration**
- Mentioned in your requirements
- Not present in codebase
- Would need to be added

#### 5. **OpenClaw Integration**
- Mentioned in your requirements
- Not present in codebase
- Would need to be added

---

## AGENT SYSTEM

### Agent Configuration

**5 Agents (hardcoded):**
```javascript
const agentNames = ['master', 'coder', 'researcher', 'tester', 'file_manager'];
```

**Agent Roles:**
```javascript
{
  master: 'Orchestrates and coordinates tasks across all agents',
  coder: 'Writes and implements code, handles development tasks',
  researcher: 'Researches solutions, documentation, and best practices',
  tester: 'Tests code, writes tests, ensures quality',
  file_manager: 'Manages files, organizes project structure'
}
```

### Agent Initialization (server.js, line 263-304)

Each WebSocket connection triggers:
1. Create agent's config directory: `~/.claude-agent-{name}`
2. Set up environment variables (AGENT_NAME, SHARED_WORKSPACE, etc.)
3. Spawn bash shell via node-pty with PTY configuration
4. Initialize memory manager for that agent
5. Start watching inbox for auto-prompt commands

### Terminal Session Properties
```javascript
{
  ptyProcess,        // node-pty process
  ws,               // WebSocket connection
  memory,           // MemoryManager instance
  inputBuffer,      // Buffered user input
  outputBuffer      // Buffered terminal output
}
```

---

## COMMUNICATION LAYER

### 1. **WebSocket Communication (Client ↔ Server)**

**Client sends to Server:**
```json
{
  "type": "input",
  "data": "command text\r"
}
```

**Server sends to Client:**
```json
{
  "type": "output",
  "data": "[ANSI escape codes and text]"
}
```

**Terminal Resize:**
```json
{
  "type": "resize",
  "cols": 120,
  "rows": 30
}
```

### 2. **File-Based Message Broker (Agent ↔ Agent)**

**Location:** `shared-workspace/messages/{agent}/{id}.json`

**Message Format:**
```json
{
  "id": "2026-02-04T10:00:00.000Z-abc123def",
  "from": "master",
  "to": "coder",
  "content": "Implement login function",
  "timestamp": "2026-02-04T10:00:00.000Z",
  "type": "direct"  // or "broadcast"
}
```

**API (agent-messenger.js):**
```javascript
const messenger = new AgentMessenger('master');
messenger.sendTo('coder', 'message content');
messenger.broadcast('broadcast message');
messenger.readInbox();  // All messages in inbox
messenger.clearInbox();
```

### 3. **Command Injection (Server → Terminal)**

**Files watched:** `shared-workspace/messages/{agent}/__command_*.json`

**Command format:**
```json
{
  "type": "auto_prompt",
  "command": "ls -la"
}
```

**Flow:**
1. File written to agent's inbox
2. Server's watchForCommands detects it
3. Command injected via `ptyProcess.write(command + '\r')`
4. File deleted after execution
5. Agent sees output naturally in terminal

---

## MEMORY SYSTEM

### Structure

**Prompt History** (`agent-memory/{agent}/prompt-history.json`)
```json
[
  {
    "timestamp": "2026-02-04T10:00:00.000Z",
    "prompt": "user input or command",
    "response": "ai response (if applicable)",
    "metadata": {
      "cwd": "/current/working/directory",
      "files": ["file1.js", "file2.js"],
      "type": "command"
    }
  }
]
```

**Context** (`agent-memory/{agent}/context.json`)
```json
{
  "agentName": "coder",
  "role": "Writes and implements code...",
  "currentWorkingDirectory": "/Users/...",
  "currentFiles": ["index.js", "utils.js"],
  "lastUpdated": "2026-02-04T10:00:00.000Z",
  "sessionCount": 15,
  "lastPrompt": "Write a function...",
  "lastResponse": "Here's the function..."
}
```

**Summary** (`agent-memory/{agent}/memory-summary.md`)
- Human-readable markdown
- Role description
- Current context
- Last 5 prompts
- Current files being worked on

### Automatic Tracking

**From server.js (line 316-344):**
- When user types command + Enter in terminal
- Command extracted from inputBuffer
- Automatically saved to memory via `memory.savePrompt(command, '', metadata)`
- Memory updated with context

### Accessing Memory

**CLI Tool:**
```bash
node memory-cli.js master show          # Show summary
node memory-cli.js coder history 20     # Show last 20
node memory-cli.js researcher search "jwt"
```

**REST API:**
```bash
curl http://localhost:3000/api/memory/coder/history?limit=10
curl http://localhost:3000/api/memory/master/search?q=authentication
```

---

## DEPLOYMENT STATUS

### Current Setup
- **Backend**: Runs locally on port 3000 (or env.PORT)
- **Frontend**: Vite dev server on 5173 (or production build served from backend)
- **Database**: None (file-based storage)

### Deployment Options Documented

#### Option 1: Vercel (Frontend Only) - Documented in DEPLOYMENT.md
- Frontend: Vercel
- Backend: Local (requires ngrok tunnel)
- Environment variables: VITE_WS_URL, VITE_API_URL
- Status: Documented but not tested

#### Option 2: Local Development
- Everything on localhost
- Working correctly
- Status: Current default

#### Option 3: Hybrid (Recommended in docs)
- Master agent on Cloudflare Workers
- File agent local
- Specialist agents on Cloudflare/Workers
- Status: Designed in ARCHITECTURE_OPTIONS.md, not implemented

### Cloud Integration Notes

**Not implemented:**
- Cloudflare Workers deployment
- Environment variable tunneling
- Durable objects for state management
- Worker-to-local communication protocol
- Authentication/authorization layer
- Database persistence (currently file-based)

---

## KNOWN ISSUES & OPTIMIZATION OPPORTUNITIES

### Performance Issues (from OPTIMIZATION_REPORT.md)

#### Disk Usage: 170MB
- `node_modules/`: 137MB (should be ~40MB)
  - node-pty: 62MB (native binaries for all platforms)
  - Duplicate dependencies: 10.5MB
  - Build tools (client): 47MB (unnecessary at runtime)
  - Unused zod: 6MB

**Solution:** -59% with npm workspaces + production-only deps

#### RAM Usage: 250-400MB baseline
- 5 bash shells: 150MB
- Node process: 80MB
- WebSocket connections: 20MB
- React app: 20MB

**Solutions:**
- File polling every 2 seconds (30 reads/min) → file watching (event-driven)
- Shell pooling (spawn on-demand instead of always-on)
- Memory limits (keep 1000 prompts max per agent)

### Code Quality Issues

#### React Warnings
- **Issue:** Line 270 in App.jsx uses `index` as key
- **Impact:** React re-render warnings
- **Fix:** Use `msg.timestamp || Math.random()` or proper ID

#### File Polling (server.js line 230)
- **Issue:** `setInterval` every 2 seconds
- **Impact:** 30 unnecessary disk reads per minute
- **Fix:** Replace with `fs.watch()` for event-driven detection
- **Performance gain:** -30% CPU, +100% responsiveness

### Missing Features

#### Monitoring
- No error tracking
- No performance metrics
- No agent health checks
- No memory usage monitoring

#### Reliability
- No session recovery on disconnect
- No automatic reconnection
- No message persistence (file-based, but not queued)
- No transaction/atomicity guarantees

#### Security
- No authentication (local only)
- No encryption for file-based messages
- No input validation/sanitization
- No rate limiting

---

## WHAT'S WORKING VS WHAT NEEDS TO BE BUILT

### ✅ WORKING: Terminal Infrastructure
- node-pty spawning and management
- xterm.js rendering
- WebSocket bidirectional communication
- ANSI color support
- Terminal resizing
- Input/output buffering

### ✅ WORKING: Agent Isolation
- Separate config directories
- Separate environment variables
- Separate shells per agent
- Claude Code CLI can authenticate independently

### ✅ WORKING: File-Based Communication
- Message creation and delivery
- Inbox reading
- Message clearing
- Broadcast messaging

### ✅ WORKING: Memory Persistence
- Prompt history storage
- Context tracking
- Memory summaries
- REST API access
- CLI tool access
- Search functionality

### ✅ WORKING: Basic UI
- Dashboard display
- Agent status indicators
- Task input form
- Message feed
- Voice input support

### ⚠️ PARTIALLY WORKING: Auto-Prompting
- File watching works
- Command injection works
- Issue: Only detects `__command_*.json` files (hardcoded)
- Missing: Integration with master agent logic

### ❌ NOT WORKING: Intelligence/Automation

**Missing from architecture:**
1. **Master Agent Logic**
   - No task parsing
   - No dependency analysis
   - No workflow orchestration
   - No progress tracking

2. **Agent Coordination**
   - No automatic task delegation
   - No request/response handling
   - No error recovery
   - No result aggregation

3. **AI Integration**
   - No Claude API calls
   - No AI-driven decisions
   - No context injection
   - No prompt engineering

4. **Advanced Features**
   - No MOLTBOT integration
   - No OpenClaw integration
   - No Cloudflare deployment
   - No database backend
   - No multi-user support
   - No project management

---

## RECOMMENDED NEXT STEPS

### Phase 1: Fix Current Issues (2-3 hours)
1. Optimize disk usage (remove build tools, workspaces)
2. Replace file polling with fs.watch()
3. Fix React key warnings
4. Add proper error handling

### Phase 2: Add Master Agent Logic (4-6 hours)
1. Parse user task into subtasks
2. Create task delegation system
3. Track task progress
4. Aggregate results

### Phase 3: AI Integration (4-8 hours)
1. Integrate Claude API
2. Add prompt engineering
3. Context injection from memory
4. Error handling with retries

### Phase 4: Cloudflare Deployment (6-10 hours)
1. Set up Workers
2. Implement durable objects for state
3. Environment variable tunneling
4. Local-to-cloud communication

### Phase 5: Advanced Features (Open-ended)
1. MOLTBOT integration
2. OpenClaw integration
3. Multi-user support
4. Project persistence layer

---

## TECHNICAL DEBT & FUTURE WORK

### Short Term
- Performance optimization (170MB → 70MB)
- Error handling improvements
- Session persistence
- Proper logging system

### Medium Term
- Master agent orchestration logic
- AI API integration (Claude/OpenAI)
- Database layer (SQLite or PostgreSQL)
- Test suite

### Long Term
- Cloudflare Workers deployment
- Advanced agent frameworks
- Multi-user authentication
- Real-time collaboration
- Distributed tracing
- Advanced monitoring

---

**Created:** February 4, 2026
**System Status:** Production-ready terminal infrastructure, awaiting AI agent implementation
