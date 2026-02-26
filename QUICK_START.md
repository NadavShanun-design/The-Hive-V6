# Quick Start Guide - Vibe Coder

## Current Status: RUNNING ✅

Both the backend and frontend are currently running!

- **Backend Server**: http://localhost:3001 ✅ Running
- **Frontend UI**: http://localhost:5173 ✅ Running

## Access the Application

**Open your browser and go to:** http://localhost:5173

You should see a beautiful dark-themed interface with:
- 4 agent cards showing their status
- A task input field
- A real-time message feed

## Try It Out

1. **Submit a task** by typing in the input field. Try these:
   - "implement a fibonacci function"
   - "research React hooks"
   - "test error handling"

2. **Watch the magic happen**:
   - Agents change status (idle → working/coding/testing)
   - Messages appear in the feed showing inter-agent communication
   - You'll see the Coordinator route tasks to specialists
   - CodeMaster generates code and sends it to Tester
   - Tester validates and reports back

## What You'll See

### Agent Cards
- **Coordinator** (Green) - Routes your tasks
- **CodeMaster** (Blue) - Generates code
- **Researcher** (Orange) - Gathers information
- **Tester** (Purple) - Validates code

### Message Feed
Real-time messages showing:
- 📤 Sent messages (from agents)
- 📥 Received messages (to agents)
- Message content and timestamps
- Agent-to-agent communication

## Example Workflow

When you submit "implement a fibonacci function":

1. **Coordinator** receives the task
2. **Coordinator** identifies it as a code task
3. **Coordinator** routes to **CodeMaster**
4. **CodeMaster** generates the code
5. **CodeMaster** sends code to **Tester**
6. **Tester** validates the code
7. **Tester** reports "All tests passed!"
8. All messages visible in the UI

## Server Management

### Check Server Status
Both servers are running in background processes.

### To Stop Servers
```bash
# Find and kill the processes
lsof -ti:3001 | xargs kill  # Stop backend
lsof -ti:5173 | xargs kill  # Stop frontend
```

### To Restart
```bash
# Backend
cd /path/to/hive/server
npm start &

# Frontend
cd /path/to/hive/client
npm run dev &
```

## Testing Agent Communication

You can also test via command line:

```bash
curl -X POST http://localhost:3001/api/task \
  -H "Content-Type: application/json" \
  -d '{"task": "implement a sorting algorithm"}'
```

## Files to Check

- **PROJECT_STATUS.md** - Full project status and progress
- **README.md** - Complete documentation
- **TASKS.md** - Task tracking

## Troubleshooting

**Can't connect to UI?**
- Make sure you're going to http://localhost:5173
- Check that the frontend dev server is running
- Look for any errors in the terminal

**Agents not responding?**
- Check the backend server logs
- Verify http://localhost:3001 is accessible
- Check browser console for WebSocket errors

**WebSocket not connecting?**
- Backend must be running on port 3001
- Check for firewall blocking
- Try refreshing the page

## What's Next?

- Submit different types of tasks to see different agents in action
- Watch the real-time message feed
- See how agents collaborate and communicate
- Experiment with complex tasks

---

Everything is ready! Just open http://localhost:5173 and start interacting with your multi-agent system! 🚀
