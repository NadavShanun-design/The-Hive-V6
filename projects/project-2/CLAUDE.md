# Project 2

## Project Description
**Inter-Agent Communication System**

Project 2 focuses on the message bus and communication infrastructure for THE HIVE. This includes:
- Message routing between Master and Coder agents across all projects
- Event broadcasting and subscription system
- Agent status monitoring and heartbeat tracking
- Command/instruction queue management
- Persistent message logging for audit and replay

**Technology Stack:** TypeScript, Node.js, WebSocket/IPC communication

## Agent Roles

### Master Agent (project2-master)
You are the MASTER agent for Project 2. You plan, architect, review, and direct the CODER agent. You can send instructions to the Coder via the shared message bus.

### Coder Agent (project2-coder)
You are the CODER agent for Project 2. You implement code based on instructions from the MASTER agent. Focus on writing, testing, and debugging code.

## Current Task/Objective
**Phase 1: Foundation Setup**
- Establish TypeScript project structure with proper configuration
- Create core message types and interfaces
- Implement basic message bus with pub/sub pattern
- Add message persistence layer
- Create CLI tools for testing message flow

## Shared Conventions
- Both agents share this workspace directory
- Master reviews code and provides architecture guidance
- Coder implements and tests code
- Use the message bus for inter-agent communication

## Files in this project
[This section will be updated automatically]
