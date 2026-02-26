#!/usr/bin/env node
// Simple script to prompt the researcher agent and get a "Hi" response

const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const SERVER_URL = 'ws://localhost:3002';
let serverWs = null;
let researcherWs = null;

console.log('🚀 Starting Researcher Agent Interaction Demo');
console.log('==============================================\n');

// Start the server
console.log('📡 Step 1: Starting WebSocket server...');
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['real-agents-server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: ['ignore', 'pipe', 'pipe']
});

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running')) {
    console.log('✅ Server started successfully!\n');
    setTimeout(startResearcher, 1000);
  }
});

serverProcess.stderr.on('data', (data) => {
  // Ignore errors for demo
});

function startResearcher() {
  console.log('🤖 Step 2: Connecting researcher agent...');

  // Create researcher agent that auto-responds
  researcherWs = new WebSocket(SERVER_URL);

  researcherWs.on('open', () => {
    console.log('✅ Researcher agent connected!\n');

    // Register as researcher
    researcherWs.send(JSON.stringify({
      type: 'agent_register',
      agentName: 'researcher',
      workspace: path.join(__dirname, 'agent-workspaces/researcher'),
      timestamp: Date.now()
    }));

    setTimeout(sendMessage, 1000);
  });

  researcherWs.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'agent_message') {
      console.log('📨 Researcher received message:');
      console.log(`   From: ${message.from}`);
      console.log(`   Content: ${message.content}\n`);

      console.log('💬 Researcher is responding...\n');

      // Respond with "Hi!"
      setTimeout(() => {
        researcherWs.send(JSON.stringify({
          type: 'agent_message',
          from: 'researcher',
          to: message.from,
          content: 'Hi! 👋 This is the researcher agent. Nice to meet you!',
          timestamp: Date.now()
        }));

        console.log('✅ Researcher sent response: "Hi! 👋 This is the researcher agent. Nice to meet you!"\n');
        console.log('==============================================');
        console.log('✨ Demo complete! The researcher agent said Hi!');
        console.log('==============================================\n');

        cleanup();
      }, 500);
    }
  });
}

function sendMessage() {
  console.log('📤 Step 3: Sending message to researcher...');

  // Connect as a client to send message
  serverWs = new WebSocket(SERVER_URL);

  serverWs.on('open', () => {
    console.log('✅ Client connected!\n');

    // Send message to researcher
    serverWs.send(JSON.stringify({
      type: 'agent_message',
      from: 'claude',
      to: 'researcher',
      content: 'Hello researcher! Please say hi back!',
      timestamp: Date.now()
    }));

    console.log('✅ Message sent to researcher!\n');
  });

  serverWs.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'agent_message' && message.from === 'researcher') {
      console.log('🎉 Received response from researcher:');
      console.log(`   "${message.content}"\n`);
    }
  });
}

function cleanup() {
  setTimeout(() => {
    if (researcherWs) researcherWs.close();
    if (serverWs) serverWs.close();
    if (serverProcess) serverProcess.kill();
    process.exit(0);
  }, 1000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Error:', error.message);
  cleanup();
});

process.on('SIGINT', cleanup);
