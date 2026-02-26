# Quick Start Guide

## 🚀 Getting Started (3 Steps)

### 1. Fix Permissions (REQUIRED - do this once)
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
chmod +x node_modules/node-pty/prebuilds/darwin-x64/spawn-helper
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Go to: **http://localhost:3000**

---

## ✨ What You'll See

You'll see 5 real terminal windows in your browser:
- 🎯 **Master Agent**
- 💻 **Coder Agent**
- 🔬 **Researcher Agent**
- 🧪 **Tester Agent**
- 📁 **File Manager Agent**

## 🎮 How to Use

1. **Type `claude` in each terminal** - This starts the real Claude Code CLI
2. **Authenticate each one** - Follow the prompts (they're independent)
3. **Start using your multi-agent system!**

Each agent has its own authentication stored in:
- `~/.claude-agent-master`
- `~/.claude-agent-coder`
- `~/.claude-agent-researcher`
- `~/.claude-agent-tester`
- `~/.claude-agent-file_manager`

---

## ⚠️ Troubleshooting

**If you get "posix_spawnp failed" error:**
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper
```

**If terminals don't connect:**
- Kill any process on port 3000: `lsof -ti:3000 | xargs kill -9`
- Restart: `npm start`

---

## 📖 Full Documentation

See `README.md` for complete documentation and architecture details.
