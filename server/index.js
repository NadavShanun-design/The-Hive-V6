const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { AgentManager } = require('./agents');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize agent manager
const agentManager = new AgentManager();

// Store WebSocket clients
const wsClients = new Set();

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/agents', (req, res) => {
  const statuses = agentManager.getAgentStatuses();
  res.json(statuses);
});

app.post('/api/task', (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  try {
    agentManager.submitTask(task);

    // Broadcast task submission to all WebSocket clients
    broadcastToClients({
      type: 'task_submitted',
      task,
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'Task submitted to agents' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const messages = agentManager.getAllMessages(limit);
  res.json(messages);
});

app.get('/api/agent/:type/memory', (req, res) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const memory = agentManager.getAgentMemory(type, limit);
  res.json(memory);
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Agent system initialized');
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);

  // Send initial agent statuses
  ws.send(JSON.stringify({
    type: 'agent_statuses',
    data: agentManager.getAgentStatuses(),
    timestamp: Date.now()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);

      if (data.type === 'submit_task') {
        agentManager.submitTask(data.task);
        broadcastToClients({
          type: 'task_submitted',
          task: data.task,
          timestamp: Date.now()
        });
      } else if (data.type === 'get_statuses') {
        ws.send(JSON.stringify({
          type: 'agent_statuses',
          data: agentManager.getAgentStatuses(),
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Broadcast helper function
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wsClients.forEach((client) => {
    if (client.readyState === 1) { // OPEN state
      client.send(message);
    }
  });
}

// Periodically broadcast agent statuses
setInterval(() => {
  const statuses = agentManager.getAgentStatuses();
  broadcastToClients({
    type: 'agent_statuses',
    data: statuses,
    timestamp: Date.now()
  });
}, 2000);

// Periodically broadcast latest messages
setInterval(() => {
  const messages = agentManager.getAllMessages(20);
  if (messages.length > 0) {
    broadcastToClients({
      type: 'new_messages',
      data: messages,
      timestamp: Date.now()
    });
  }
}, 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
