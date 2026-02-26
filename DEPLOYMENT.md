# Vibe Coder Deployment Guide

## Architecture Overview

Vibe Coder consists of two parts:
1. **Frontend (Client)** - React app that can be deployed to Vercel
2. **Backend (Server)** - Node.js server that runs locally to manage agent terminals

## Local Development Setup

### 1. Start the Backend Server (Local)

The backend MUST run locally because it:
- Manages terminal sessions for each agent
- Stores agent memory and prompts locally
- Handles WebSocket connections for real-time communication

```bash
# From the root directory
npm start
```

This starts the server on `http://localhost:3002` (or port specified in env)

### 2. Start the Frontend (Local)

```bash
cd client
npm run dev
```

This starts the Vite dev server on `http://localhost:5173`

## Deploying Frontend to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy from Client Directory

```bash
cd client
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** vibe-coder (or your preferred name)
- **Directory?** ./ (current directory)
- **Override settings?** No

### Step 4: Configure Environment Variables on Vercel

After deployment, set these environment variables in your Vercel project settings:

1. Go to your project on Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:

```
VITE_WS_URL=ws://localhost:3002
VITE_API_URL=http://localhost:3002
```

**Important:** When accessing from Vercel-hosted UI, you'll need to:
- Keep your local server running on your machine
- Update the environment variables to point to your local IP address (e.g., `ws://192.168.1.100:3002`)
- Or expose your local server using a service like ngrok

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Using ngrok for Remote Access (Optional)

If you want to access your locally-running backend from the Vercel-hosted frontend:

### 1. Install ngrok

```bash
brew install ngrok
# or download from https://ngrok.com/
```

### 2. Start ngrok tunnel

```bash
ngrok http 3002
```

### 3. Update Vercel Environment Variables

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update your Vercel environment variables:

```
VITE_WS_URL=wss://abc123.ngrok.io
VITE_API_URL=https://abc123.ngrok.io
```

Note: Use `wss://` for secure WebSocket and `https://` for API calls.

### 4. Update server.js for CORS

If accessing from remote domain, update server.js to allow CORS:

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://your-vercel-app.vercel.app'
}));
```

## Vercel Deployment URL

After deployment, Vercel will provide you with a URL like:
```
https://vibe-coder-xxxxx.vercel.app
```

## Testing the Deployment

1. Start your local backend server:
   ```bash
   npm start
   ```

2. Open the Vercel URL in your browser

3. The UI should connect to your local backend (or ngrok tunnel)

4. Test the Quick Ideas feature by:
   - Typing a prompt
   - Using voice dictation (click microphone icon)
   - Clicking Send
   - Check the `last-prompt` folder locally for saved prompts

## Persistence

All prompts and agent data are saved locally in:
- `last-prompt/` - Quick ideas/prompts
- `agent-memory/` - Agent conversation history
- `shared-workspace/` - Shared files between agents

These persist even if the server restarts or the browser is closed.

## Troubleshooting

### UI can't connect to backend
- Ensure backend server is running locally
- Check WebSocket URL in environment variables
- Verify firewall settings allow connections

### Voice recognition not working
- Voice recognition only works in Chrome/Edge browsers
- Requires HTTPS (Vercel provides this automatically)
- Grant microphone permissions when prompted

### Prompts not saving
- Check backend server logs for errors
- Verify `last-prompt` directory exists and is writable
- Check API URL in environment variables

## Future Enhancements

To make this fully cloud-based:
1. Deploy backend to a cloud service (Railway, Render, DigitalOcean)
2. Replace terminal sessions with containerized agents
3. Use cloud storage for persistence (S3, MongoDB)
4. Implement authentication for multi-user support
