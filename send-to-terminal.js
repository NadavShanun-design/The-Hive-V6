const WebSocket = require('ws');

const agentId = process.argv[2] || 'project1-master';
const message = process.argv[3] || 'echo "Hello from OpenClaw!"';

const ws = new WebSocket(`ws://localhost:3002?agent=${agentId}`);

ws.on('open', () => {
    console.log(`Connected to ${agentId}`);
    ws.send(JSON.stringify({ type: 'input', data: message + '\r' }));
    setTimeout(() => {
        ws.close();
        console.log('Message sent!');
    }, 500);
});

ws.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
