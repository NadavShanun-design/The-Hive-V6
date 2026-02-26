#!/bin/bash

# Start the Vibe Coder backend server for Vercel frontend
echo "🚀 Starting Vibe Coder Backend Server..."
echo ""
echo "This server will allow your Vercel-hosted UI to connect to your local agents."
echo ""
echo "Vercel UI URL: https://your-vercel-app.vercel.app"
echo "Local Server: http://localhost:3002"
echo ""
echo "📝 All prompts will be saved to: ./last-prompt/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js
