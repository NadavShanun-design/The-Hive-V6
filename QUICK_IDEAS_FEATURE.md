# Quick Ideas Feature

## What's New

Added a **Quick Ideas** box at the bottom of the Vibe Coder interface that allows you to:
- Type quick notes and ideas
- Save them instantly to local storage
- All prompts persist even if the app crashes or browser closes

## How It Works

### UI Location
The Quick Ideas box appears at the bottom of the page, below all 5 agent terminals:
- Master Agent
- Coder Agent
- Researcher Agent
- Tester Agent
- File Manager Agent

### Features
1. **Simple Text Input** - Just type your idea
2. **Send Button** - Click to save
3. **Instant Feedback** - Input border flashes green when saved
4. **Persistent Storage** - All prompts saved to `last-prompt/` folder

## Storage Details

### Location
All prompts are saved in:
```
/path/to/hive/last-prompt/
```

### File Format
Each prompt is saved as a JSON file:
```json
{
  "prompt": "Your idea text here",
  "timestamp": "2026-02-03T19:20:00.000Z",
  "id": 1738611600000
}
```

### Files Created
- `prompt_[timestamp].json` - Individual prompt file
- `latest.json` - Always contains the most recent prompt

## Usage

1. **Start the server:**
   ```bash
   cd /your-home/path/to/hive
   node server.js
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Use Quick Ideas:**
   - Scroll to bottom of page
   - Type your idea in the text box
   - Click "Send"
   - Input will clear and flash green

4. **Access saved prompts:**
   - Check the `last-prompt/` folder
   - Each prompt is saved as a separate JSON file
   - Files persist across restarts

## Benefits

✅ **Persistent** - Survives crashes and restarts
✅ **Simple** - No complex UI, just type and send
✅ **Organized** - Each prompt in its own file with timestamp
✅ **Fast** - Instant save, no delays
✅ **Local** - All data stored on your machine

## Technical Details

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Backend:** Express.js API endpoint
- **Storage:** Local filesystem (JSON files)
- **Port:** 3000 (configurable via PORT env variable)

## API Endpoint

```
POST /api/save-prompt
Content-Type: application/json

{
  "prompt": "Your idea here",
  "timestamp": "2026-02-03T19:20:00.000Z"
}
```

Response:
```json
{
  "success": true,
  "message": "Prompt saved successfully",
  "filepath": "/path/to/last-prompt/prompt_123456789.json",
  "data": {
    "prompt": "Your idea here",
    "timestamp": "2026-02-03T19:20:00.000Z",
    "id": 123456789
  }
}
```

## Notes

- No voice dictation (use your OS dictation instead)
- All 5 agent terminals remain unchanged
- Agent memory is preserved
- Connections work exactly as before
