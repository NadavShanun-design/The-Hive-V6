# Dynamic Terminals Implementation Plan

## Goal
Add ability to create unlimited terminals dynamically with a "+" button

## Current Structure
- 4-column grid: 3 project batches (6 terminals total) + Queen chat
- Fixed layout

## New Structure
- 2-column layout:
  - LEFT: Scrollable terminal grid (3 columns, unlimited rows)
  - RIGHT: Fixed Queen chat panel

## Implementation Steps

### 1. HTML/CSS Changes
- [ ] Change main-grid from 4 columns to 2 columns (terminals | queen)
- [ ] Create scrollable terminal container with 3-column grid
- [ ] Add "+" button component (terminal-sized)
- [ ] Style "+" button to match terminal size

### 2. JavaScript Changes
- [ ] Track terminals in array with dynamic IDs
- [ ] Create `addNewTerminal()` function
- [ ] Handle "+" button click → create terminal + move button
- [ ] Generate unique terminal IDs (terminal-1, terminal-2, etc.)

### 3. Backend Changes
- [ ] Change hardcoded terminal IDs to dynamic lookup
- [ ] Update "hive" detection to loop through ALL terminals
- [ ] Support dynamic terminal creation via WebSocket

### 4. Terminal Creation Flow
1. User clicks "+"
2. Frontend generates unique ID
3. Creates WebSocket connection
4. Backend creates PTY process
5. Terminal appears in grid
6. "+" button moves to next position

### 5. "Hive" Command Update
- Instead of: `['project1-master', 'project1-coder', ...]`
- Use: `Array.from(terminals.keys())` - ALL terminals
