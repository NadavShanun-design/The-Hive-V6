# 🐝 THE HIVE

**Multi-Agent Vibe Coding Command Center**

A cyberpunk-themed orchestration dashboard for managing multiple Claude Code CLI terminals organized into project batches, with integrated OpenClaw (MOLTBOT) chat interface.

![Architecture](https://img.shields.io/badge/Architecture-Hybrid-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Node](https://img.shields.io/badge/Node-18+-brightgreen)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**THE HIVE** is a multi-agent terminal orchestration system that allows you to:

- Manage **6 Claude Code CLI terminals** organized into **3 project batches**
- Each batch has 2 agents: **Master** (planning/architecture) and **Coder** (implementation)
- All agents share workspaces within their batch for seamless collaboration
- Integrated **MOLTBOT** (OpenClaw) panel for high-level orchestration
- **Quick Ideas** panel for capturing thoughts and routing them to agents
- Real-time inter-agent messaging and communication
- Persistent memory system tracking all agent interactions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│          CLOUDFLARE PAGES (Static Frontend - Optional)          │
│  - Cyberpunk UI served from global CDN                          │
│  - WebSocket connects back to local server via tunnel           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                   Cloudflare Tunnel (secure connection)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│        LOCAL TERMINAL SERVER (Node.js + Express + WS)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Project 1: Master + Coder (shared workspace)             │  │
│  │ Project 2: Master + Coder (shared workspace)             │  │
│  │ Project 3: Master + Coder (shared workspace)             │  │
│  │ = 6 real bash shells via node-pty                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ OpenClaw Gateway (MOLTBOT) - ws://127.0.0.1:18789       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | HTML + xterm.js | Cyberpunk dashboard with 6 terminals |
| **Backend** | Node.js + Express | Terminal server, API, WebSocket |
| **Terminals** | node-pty | Real PTY emulation for bash shells |
| **Claude CLI** | Claude Code | AI coding assistant in each terminal |
| **MOLTBOT** | OpenClaw Gateway | High-level agent orchestration |
| **Memory** | File-based JSON | Persistent history per agent |
| **Deployment** | Cloudflare Pages + Tunnel | Global CDN + secure local access |

---

## ✨ Features

### 🎯 Project Batches

- **3 isolated project workspaces**
- Each with **Master + Coder** agent pair
- Shared directory for file collaboration
- Independent Claude Code CLI authentication per agent

### 🧠 Intelligent Agents

**Master Agent:**
- Plans and architects solutions
- Reviews code from Coder
- Sends instructions via message bus
- Tracks project progress

**Coder Agent:**
- Implements code based on Master's guidance
- Tests and debugs implementations
- Reports back to Master
- Executes commands and builds

### 💡 Quick Ideas Panel

- Brain-dump ideas instantly
- Tag ideas to specific projects
- Route directly to agents (Master, Coder, or MOLTBOT)
- Persistent storage with timestamps
- **Keyboard shortcut:** `Ctrl/Cmd + I`

### 🦞 MOLTBOT (OpenClaw Integration)

- High-level orchestration across all 6 agents
- Chat interface for natural language commands
- Can prompt any agent programmatically
- Broadcasts messages to multiple agents
- **Keyboard shortcut:** `Ctrl/Cmd + M`

### 📨 Inter-Agent Communication

- Message bus for agent-to-agent communication
- Master can send prompts to Coder
- Coder can request clarification from Master
- MOLTBOT can orchestrate cross-batch communication
- All messages logged with timestamps

### 🧠 Memory System

- Persistent prompt history per agent (1000 prompts max)
- Context tracking (working directory, files, session count)
- Searchable memory across all agents
- REST API for memory access
- Automatic memory summaries

### 🎨 Cyberpunk UI

- Dark theme with neon accents
- Matrix-style grid background
- Color-coded project batches
- Real-time status indicators
- Responsive terminal sizing

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- **Claude Code CLI** (install: `npm install -g @anthropic/claude-code`)
- **Anthropic API Key** ([get one](https://console.anthropic.com))

### Installation

```bash
# 1. Clone the repository (if not already done)
cd /your-home/path/to/hive

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env and add your Anthropic API key
nano .env
# Set: ANTHROPIC_API_KEY=your_key_here

# 5. Start THE HIVE
npm run hive
```

### First Launch

The server will start on `http://localhost:3002`

Open your browser and navigate to:
```
http://localhost:3002/hive.html
```

You'll see:
- ✅ 6 terminal panels (connecting...)
- ✅ Quick Ideas input bar at top
- ✅ MOLTBOT panel on the right
- ✅ Status indicators in header

### Authenticate Agents

Each terminal needs to authenticate with Claude Code CLI:

1. Click into **Project 1 Master** terminal
2. Type: `claude auth`
3. Follow the authentication flow
4. Repeat for all 6 terminals

**Tip:** Each agent has its own config directory (`~/.claude-project1-master`, etc.), so you can authenticate once and it persists.

---

## 🌐 Deployment

### Option 1: Local Development (Current)

Already done! Server runs on `localhost:3002`.

### Option 2: Cloudflare Pages + Tunnel (Recommended)

Deploy the UI to Cloudflare's global CDN while keeping terminals local:

#### Step 1: Install Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

#### Step 2: Authenticate Cloudflare

```bash
cloudflared tunnel login
```

#### Step 3: Create a Tunnel

```bash
cloudflared tunnel create the-hive-tunnel
```

This creates a tunnel UUID and credentials file.

#### Step 4: Configure the Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /your-home/.cloudflared/<UUID>.json

ingress:
  - hostname: hive.yourdomain.com
    service: http://localhost:3002
  - service: http_status:404
```

#### Step 5: Route DNS

```bash
cloudflared tunnel route dns the-hive-tunnel hive.yourdomain.com
```

#### Step 6: Run the Tunnel

```bash
cloudflared tunnel run the-hive-tunnel
```

Now your local server is accessible at `https://hive.yourdomain.com`

#### Step 7: Deploy Frontend to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Pages
wrangler pages deploy public --project-name=the-hive
```

Your UI is now on Cloudflare's CDN, connecting back to your local terminal server via the tunnel.

---

## 📖 Usage Guide

### Basic Workflow

#### 1. Start THE HIVE
```bash
npm run hive
```

#### 2. Open Dashboard
Navigate to `http://localhost:3002/hive.html`

#### 3. Authenticate All Agents
Type `claude auth` in each of the 6 terminals.

#### 4. Use Quick Ideas
- Type an idea in the top bar
- Tag it to a project (optional)
- Click "Save Idea" or press `Ctrl+Enter`
- Select "Send to..." to route it to an agent

#### 5. Orchestrate with MOLTBOT
- Type in the MOLTBOT panel
- Example: "Tell Project 1 Master to review the authentication code"
- MOLTBOT sends prompts to the specified agents

#### 6. Watch Agents Collaborate
- Master reviews code and sends feedback
- Coder implements changes
- All communication visible in terminals

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + I` | Focus Quick Ideas input |
| `Ctrl/Cmd + M` | Focus MOLTBOT input |
| `Ctrl/Cmd + Enter` | Submit current input |

### Agent Roles

**Master Agent Responsibilities:**
- 📐 Architecture planning
- 📋 Task breakdown and delegation
- 👀 Code review
- 🎯 Project coordination

**Coder Agent Responsibilities:**
- 💻 Code implementation
- 🧪 Testing and debugging
- 📦 Building and deploying
- 📄 Documentation

### Inter-Agent Communication

Agents communicate via the message bus:

```bash
# In Master terminal, send message to Coder:
echo "[TO CODER]: Implement login function with JWT"

# The message appears in Coder's terminal automatically
```

Or use the API:

```bash
curl -X POST http://localhost:3002/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "from": "project1-master",
    "to": "project1-coder",
    "content": "Implement login function",
    "type": "prompt"
  }'
```

---

## 🔌 API Reference

### Memory API

**Get agent memory:**
```http
GET /api/memory/:agent
```

**Get prompt history:**
```http
GET /api/memory/:agent/history?limit=50
```

**Search prompts:**
```http
GET /api/memory/:agent/search?q=authentication
```

**Save prompt:**
```http
POST /api/memory/:agent/prompt
Content-Type: application/json

{
  "prompt": "Implement JWT auth",
  "response": "Here's the implementation...",
  "metadata": {}
}
```

### Ideas API

**Save idea:**
```http
POST /api/ideas
Content-Type: application/json

{
  "content": "Add dark mode toggle",
  "tags": ["ui", "feature"],
  "projectId": "project1",
  "targetAgent": "project1-coder"
}
```

**Get all ideas:**
```http
GET /api/ideas
```

### Messages API

**Send message:**
```http
POST /api/messages
Content-Type: application/json

{
  "from": "project1-master",
  "to": "project1-coder",
  "content": "Review the auth code",
  "type": "prompt"
}
```

**Get messages:**
```http
GET /api/messages?from=project1-master&to=project1-coder&limit=20
```

### MOLTBOT API

**Send MOLTBOT message:**
```http
POST /api/moltbot/message
Content-Type: application/json

{
  "content": "Orchestrate all agents to review security",
  "targetAgents": ["project1-master", "project2-master", "project3-master"]
}
```

**Get MOLTBOT status:**
```http
GET /api/moltbot/status
```

### Projects API

**List projects:**
```http
GET /api/projects
```

**Get project files:**
```http
GET /api/projects/project1/files
```

### Terminal Output API

**Get terminal output:**
```http
GET /api/terminals/project1-master/output?lines=200
```

---

## 🦞 OpenClaw Integration

### Setup OpenClaw

```bash
# Run the setup script
./scripts/setup-openclaw.sh
```

This will:
1. Clone OpenClaw to `~/.hive/openclaw`
2. Install dependencies
3. Build the UI and project
4. Configure the daemon

### Start OpenClaw Gateway

```bash
# Start the gateway
./scripts/start-openclaw-gateway.sh
```

The gateway runs on `ws://127.0.0.1:18789`

THE HIVE automatically connects to it on startup.

### Using MOLTBOT

Once OpenClaw is running:

1. Type in the MOLTBOT panel
2. Messages are sent to OpenClaw gateway
3. OpenClaw processes and orchestrates
4. Responses appear in MOLTBOT chat

---

## 🛠️ Troubleshooting

### Terminals Not Connecting

**Issue:** Terminals show "Connecting..." forever

**Solution:**
```bash
# Check if server is running
ps aux | grep node

# Check WebSocket port
lsof -i :3002

# Restart server
npm run hive
```

### OpenClaw Connection Failed

**Issue:** "OpenClaw gateway connection error"

**Solution:**
```bash
# Check if OpenClaw gateway is running
ps aux | grep openclaw

# Start the gateway
cd ~/.hive/openclaw
pnpm openclaw gateway --port 18789
```

### Authentication Issues

**Issue:** Claude Code CLI won't authenticate

**Solution:**
```bash
# Check if ANTHROPIC_API_KEY is set
echo $ANTHROPIC_API_KEY

# Set it in .env file
# Then restart server
```

### Port Already in Use

**Issue:** "Port 3002 already in use"

**Solution:**
```bash
# Find process using port 3002
lsof -i :3002

# Kill it
kill -9 <PID>

# Or change PORT in .env
PORT=3003 npm run hive
```

### Memory Issues

**Issue:** Server crashes with "out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run hive
```

---

## 📁 Project Structure

```
Vibe-coder/
├── server-hive.js              # Main server (THE HIVE)
├── server.js                   # Legacy server (5 agents)
├── package.json                # Dependencies
├── wrangler.toml               # Cloudflare Pages config
├── .env.example                # Environment variables template
├── HIVE-README.md              # This file
│
├── public/
│   ├── hive.html               # THE HIVE dashboard UI
│   ├── hive.js                 # Frontend WebSocket client
│   └── index.html              # Legacy UI
│
├── scripts/
│   ├── setup-openclaw.sh       # OpenClaw installation
│   └── start-openclaw-gateway.sh # Start OpenClaw gateway
│
├── projects/
│   ├── project-1/              # Project 1 workspace
│   ├── project-2/              # Project 2 workspace
│   └── project-3/              # Project 3 workspace
│
├── agent-memory/               # Persistent agent memory
│   ├── project1-master/
│   ├── project1-coder/
│   └── ...
│
├── agent-messages/             # Inter-agent messages
├── ideas/                      # Saved quick ideas
└── shared-workspace/           # Legacy shared workspace
```

---

## 🎨 UI Color Codes

| Project | Accent Color | Border |
|---------|-------------|--------|
| Project 1 | Neon Green (`#00ff41`) | Green |
| Project 2 | Neon Blue (`#00d4ff`) | Blue |
| Project 3 | Neon Pink (`#ff006e`) | Pink |
| MOLTBOT | Neon Yellow (`#ffbe0b`) | Yellow |

---

## 🔐 Security Notes

- **API Keys:** Never commit `.env` to git
- **Terminal Access:** Agents have full shell access to their workspaces
- **OpenClaw:** Runs locally on `127.0.0.1` only
- **Cloudflare Tunnel:** Encrypted connection to local server
- **HTTPS:** Always use HTTPS in production

---

## 🤝 Contributing

This is a personal project, but suggestions welcome!

Open an issue or submit a PR.

---

## 📄 License

MIT License - Do whatever you want with it!

---

## 🙏 Credits

- **xterm.js** - Terminal emulation in the browser
- **node-pty** - PTY implementation for Node.js
- **OpenClaw** - AI orchestration framework
- **Claude Code CLI** - Anthropic's coding assistant
- **Cloudflare** - Edge hosting and tunneling

---

## 🎯 Roadmap

- [x] 3 project batches with 6 terminals
- [x] Inter-agent messaging
- [x] Quick Ideas panel
- [x] MOLTBOT integration
- [x] Memory system
- [x] Cloudflare deployment support
- [ ] Real-time file watching per project
- [ ] Agent performance metrics
- [ ] Shared clipboard between agents
- [ ] Terminal recording and playback
- [ ] Mobile-responsive UI
- [ ] Multi-user support
- [ ] Database backend (PostgreSQL)

---

## 📞 Support

For issues, check:
1. This README
2. [OpenClaw Docs](https://github.com/openclaw/openclaw)
3. [Claude Code Docs](https://docs.anthropic.com/claude/docs)
4. [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

**🐝 THE HIVE - Where AI Agents Collaborate**

Made with ⚡ by Nadav Shanun
