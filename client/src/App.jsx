import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [task, setTask] = useState('')
  const [agents, setAgents] = useState({})
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [quickPrompt, setQuickPrompt] = useState('')
  const [isListening, setIsListening] = useState(false)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Connect to WebSocket - use env variable or default to localhost
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to WebSocket')
      setConnected(true)

      // Register as UI client
      ws.send(JSON.stringify({
        type: 'ui_register'
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('WebSocket message:', data)

      if (data.type === 'agent_statuses') {
        setAgents(data.data)
      } else if (data.type === 'new_messages') {
        setMessages(prev => {
          const newMessages = [...prev, ...data.data]
          // Keep only last 100 messages
          return newMessages.slice(-100)
        })
      } else if (data.type === 'task_submitted') {
        // Could show a notification here
        console.log('Task submitted:', data.task)
      }
    }

    ws.onclose = () => {
      console.log('Disconnected from WebSocket')
      setConnected(false)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    // Setup voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setQuickPrompt(prev => prev + ' ' + transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      ws.close()
    }
  }, [])

  // Removed auto-scroll - user can scroll freely

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!task.trim()) return

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ui_message',
        to: 'master',
        content: task.trim()
      }))
      setTask('')
    } else {
      alert('Not connected to server')
    }
  }

  const handleQuickPromptSubmit = async (e) => {
    e.preventDefault()
    if (!quickPrompt.trim()) return

    try {
      // Save to local server - use env variable or default to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      const response = await fetch(`${apiUrl}/api/save-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: quickPrompt.trim(),
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        console.log('Prompt saved successfully')
        setQuickPrompt('')
      } else {
        console.error('Failed to save prompt')
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
    }
  }

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const getAgentColor = (type) => {
    const colors = {
      coordinator: '#4CAF50',
      code: '#2196F3',
      research: '#FF9800',
      testing: '#9C27B0'
    }
    return colors[type] || '#757575'
  }

  const getStatusColor = (status) => {
    const colors = {
      idle: '#4CAF50',
      working: '#FF9800',
      coding: '#2196F3',
      researching: '#9C27B0',
      testing: '#E91E63'
    }
    return colors[status] || '#757575'
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 Vibe Coder - Multi-Agent System</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="container">
        {/* Agent Status Panel */}
        <div className="agents-panel">
          <h2>Agents Status</h2>
          <div className="agents-grid">
            {Object.entries(agents).map(([key, agent]) => (
              <div key={agent.id} className="agent-card" style={{ borderLeftColor: getAgentColor(agent.type) }}>
                <div className="agent-header">
                  <h3>{agent.name}</h3>
                  <span className="agent-type">{agent.type}</span>
                </div>
                <div className="agent-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(agent.status) }}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="agent-info">
                  <small>Messages: {agent.memoryCount}</small>
                </div>
              </div>
            ))}

            {/* Quick Ideas Card */}
            <div className="agent-card quick-ideas-card" style={{ borderLeftColor: '#FF6B6B' }}>
              <div className="agent-header">
                <h3>Quick Ideas</h3>
                <span className="agent-type">notes</span>
              </div>
              <form onSubmit={handleQuickPromptSubmit} className="quick-ideas-form">
                <div className="quick-ideas-input-group">
                  <textarea
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="Type or dictate your ideas..."
                    className="quick-ideas-input"
                    rows="3"
                  />
                  <div className="quick-ideas-controls">
                    <button
                      type="button"
                      onClick={toggleVoiceRecognition}
                      className={`voice-button ${isListening ? 'listening' : ''}`}
                      title={isListening ? 'Stop dictation' : 'Start dictation'}
                    >
                      {isListening ? '🛑' : '🎤'}
                    </button>
                    <button
                      type="submit"
                      className="send-button"
                      disabled={!quickPrompt.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Task Input */}
        <div className="task-panel">
          <h2>Submit Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter a task for the agents (e.g., 'implement a sorting function', 'research React hooks', 'test the login flow')"
                className="task-input"
              />
              <button type="submit" className="submit-button" disabled={!connected || !task.trim()}>
                Send Task
              </button>
            </div>
          </form>
          <div className="task-examples">
            <small>Try: "implement a binary search function" or "research state management" or "test error handling"</small>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="messages-panel">
          <h2>Agent Communication</h2>
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Submit a task to see agents in action!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  <div className="message-header">
                    <span className="message-type">{msg.type === 'sent' ? '📤' : '📥'}</span>
                    <span className="message-agent">{msg.message?.fromName || 'System'}</span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">
                    {typeof msg.message?.content === 'string'
                      ? msg.message.content
                      : JSON.stringify(msg.message?.content, null, 2)}
                  </div>
                  {msg.message?.to && (
                    <div className="message-footer">
                      <small>To: {msg.message.to}</small>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
