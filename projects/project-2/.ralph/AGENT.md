# Ralph Agent Configuration - Project 2: Message Bus

## Project Overview
Inter-Agent Communication System for THE HIVE - TypeScript/Node.js message bus with pub/sub pattern and persistent storage.

## Build Instructions

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode for development (auto-rebuild on changes)
npm run dev
```

## Test Instructions

```bash
# Run unit tests
npm test

# Test CLI manually - Send a message
npm run send -- --from project2-master --to project2-coder --topic test --type status --payload '{"message":"hello"}'

# Listen to messages
npm run listen -- --agent project2-master --topic test
```

## Run Instructions

### CLI Usage Examples

#### Send a message
```bash
npm run send -- \
  --from project2-master \
  --to project2-coder \
  --topic task.assignment \
  --type instruction \
  --priority high \
  --payload '{"task":"Implement feature X"}'
```

#### Listen for messages
```bash
npm run listen -- --agent project2-master --topic "*"
```

## Key Features Implemented

✅ **Phase 1 Complete:**
- TypeScript project with strict typing
- In-memory pub/sub message bus
- File-based persistence (`.hive-messages/messages.json`)
- Topic-based routing with wildcard support
- Priority message handling
- CLI tools for sending and listening
- Unit tests for core functionality

## Notes
- Messages persist to `.hive-messages/` for audit and replay
- Supports both in-memory (fast) and persistent (durable) modes
- All 6 HIVE agents can use this message bus
- ISO 8601 timestamps for consistency
