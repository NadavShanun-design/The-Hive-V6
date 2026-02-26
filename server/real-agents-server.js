const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { ClaudeAgentManager } = require('./claude-agent-manager');

const app = express();
const PORT = 3002; // Different port from demo server

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Claude agent manager
const agentManager = new ClaudeAgentManager();
const agents = agentManager.initializeAllAgents();

console.log('🤖 Claude Code Multi-Agent System Server');
console.log('=========================================');
console.log('');
console.log('✅ Agent workspaces created:');
agents.forEach((agent, name) => {
  console.log(`   - ${name}: ${agent.workspace}`);
});
console.log('');

// Store active agent connections
const agentConnections = new Map();
const uiClients = new Set();

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Real Claude Agent Server is running' });
});

app.get('/api/agents', (req, res) => {
  const status = agentManager.getStatus();
  const connectedAgents = {};

  agentConnections.forEach((ws, agentName) => {
    if (ws.readyState === 1) {
      connectedAgents[agentName] = true;
    }
  });

  Object.keys(status).forEach(agentName => {
    status[agentName].connected = connectedAgents[agentName] || false;
  });

  res.json(status);
});

app.post('/api/message', (req, res) => {
  const { from, to, content } = req.body;

  if (!from || !to || !content) {
    return res.status(400).json({ error: 'Missing required fields: from, to, content' });
  }

  const message = {
    type: 'agent_message',
    from,
    to,
    content,
    timestamp: Date.now()
  };

  // Broadcast to all agent bridges
  broadcastToAgents(message);

  // Broadcast to UI
  broadcastToUI({
    type: 'new_message',
    message,
    timestamp: Date.now()
  });

  res.json({ success: true, message: 'Message sent' });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Start agent bridges in separate terminals');
  console.log('   2. Start Claude Code CLI for each agent');
  console.log('   3. Open UI at http://localhost:5173');
  console.log('');
  console.log('📖 See agent-workspaces/*/README.md for instructions');
  console.log('');
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received:', message.type, message);

      if (message.type === 'agent_register') {
        // Agent bridge registering
        const agentName = message.agentName;
        agentConnections.set(agentName, ws);
        ws.agentName = agentName;

        console.log(`✅ Agent registered: ${agentName}`);

        // Notify UI
        broadcastToUI({
          type: 'agent_connected',
          agentName,
          timestamp: Date.now()
        });

        // Send confirmation
        ws.send(JSON.stringify({
          type: 'registration_success',
          agentName,
          message: `Successfully registered as ${agentName}`
        }));

      } else if (message.type === 'ui_register') {
        // UI client registering
        uiClients.add(ws);
        ws.isUI = true;

        console.log('✅ UI client connected');

        // Send current agent status
        ws.send(JSON.stringify({
          type: 'agent_statuses',
          data: agentManager.getStatus(),
          timestamp: Date.now()
        }));

      } else if (message.type === 'agent_message') {
        // Message from an agent
        console.log(`💬 Message from ${message.from} to ${message.to}: ${message.content.substring(0, 50)}...`);

        // Broadcast to target agent(s)
        if (message.to === 'all') {
          broadcastToAgents(message);
        } else {
          const targetWs = agentConnections.get(message.to);
          if (targetWs && targetWs.readyState === 1) {
            targetWs.send(JSON.stringify(message));
          } else {
            console.log(`⚠️  Agent ${message.to} not connected`);
          }
        }

        // Also send to UI for visibility
        broadcastToUI({
          type: 'new_message',
          message,
          timestamp: Date.now()
        });

      } else if (message.type === 'ui_message') {
        // Message from UI to an agent
        const agentMessage = {
          type: 'agent_message',
          from: 'ui',
          to: message.to || 'master',
          content: message.content,
          timestamp: Date.now()
        };

        const targetWs = agentConnections.get(agentMessage.to);
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify(agentMessage));
          console.log(`💬 UI message sent to ${agentMessage.to}`);
        } else {
          console.log(`⚠️  Agent ${agentMessage.to} not connected`);
        }

        // Echo to UI
        broadcastToUI({
          type: 'new_message',
          message: agentMessage,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (ws.agentName) {
      console.log(`❌ Agent disconnected: ${ws.agentName}`);
      agentConnections.delete(ws.agentName);

      broadcastToUI({
        type: 'agent_disconnected',
        agentName: ws.agentName,
        timestamp: Date.now()
      });
    }

    if (ws.isUI) {
      console.log('❌ UI client disconnected');
      uiClients.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast helper for agents
function broadcastToAgents(message) {
  agentConnections.forEach((ws, agentName) => {
    if (ws.readyState === 1) {
      // Don't send message back to sender
      if (message.from !== agentName) {
        ws.send(JSON.stringify(message));
      }
    }
  });
}

// Broadcast helper for UI clients
function broadcastToUI(data) {
  const message = JSON.stringify(data);
  uiClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// Periodic status updates to UI
setInterval(() => {
  const status = agentManager.getStatus();
  const connectedAgents = {};

  agentConnections.forEach((ws, agentName) => {
    if (ws.readyState === 1) {
      connectedAgents[agentName] = true;
    }
  });

  Object.keys(status).forEach(agentName => {
    status[agentName].connected = connectedAgents[agentName] || false;
  });

  broadcastToUI({
    type: 'agent_statuses',
    data: status,
    timestamp: Date.now()
  });
}, 2000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
