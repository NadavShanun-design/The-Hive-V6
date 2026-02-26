# Instructions for Coder Agent - Project 1

## Overview
Master Agent has completed the initial codebase review and architecture documentation. The following critical bugs and improvements have been identified.

## Immediate Action Required (Loop 2)

### CRITICAL BUG FIX: Tauri Window Lifecycle
**File**: `tauri-auth-desktop/src-tauri/src/lib.rs`
**Lines**: 16, 34
**Problem**: Using `window.close()` permanently destroys windows. After sign-out, the login window cannot be shown again because it was destroyed.

**Fix**: Replace `close()` with `hide()` for window management:

```rust
// In open_main_app() - Line 16
// OLD: login_window.close().map_err(|e| e.to_string())?;
// NEW: login_window.hide().map_err(|e| e.to_string())?;

// In show_login_window() - Line 34
// OLD: main_window.close().map_err(|e| e.to_string())?;
// NEW: main_window.hide().map_err(|e| e.to_string())?;
```

**Testing**:
1. Build and run the app
2. Sign in successfully
3. Click sign out
4. Verify you can sign in again without restart

### CRITICAL BUG FIX: Fightbot Element ID Mismatch
**File**: `Fightbot/fightbot.js`
**Line**: 103
**Problem**: JavaScript tries to get element with ID `textigBtn` but HTML has `textingBtn`

**Fix**: Correct the typo:
```javascript
// OLD: this.textingBtn = document.getElementById('textigBtn');
// NEW: this.textingBtn = document.getElementById('textingBtn');
```

**Testing**:
1. Open `Fightbot/index.html` in browser
2. Click "Connect Your Phone"
3. Click "Texting Etiquette" button
4. Verify messages appear

### SECURITY FIX: Fightbot XSS Vulnerability
**File**: `Fightbot/fightbot.js`
**Line**: 191-194
**Problem**: Using `innerHTML` with template literals allows XSS injection

**Fix**: Use `textContent` for user-controlled data:
```javascript
// BEFORE:
messageDiv.innerHTML = `
    <div class="message-sender">🦞 ClawBot</div>
    <div class="message-text">${text}</div>
`;

// AFTER:
const senderDiv = document.createElement('div');
senderDiv.className = 'message-sender';
senderDiv.textContent = '🦞 ClawBot';

const textDiv = document.createElement('div');
textDiv.className = 'message-text';
textDiv.textContent = text;

messageDiv.appendChild(senderDiv);
messageDiv.appendChild(textDiv);
```

**Note**: Even though `text` comes from predefined messages, following XSS-safe patterns is critical.

## Documentation Updates (Loop 2)

### Update CLAUDE.md
Add the following to the "Current Task/Objective" section:
```markdown
## Current Task/Objective
**Loop 2 Focus**: Critical bug fixes
1. Fix Tauri window lifecycle (close → hide)
2. Fix Fightbot textigBtn typo
3. Patch Fightbot XSS vulnerability
```

## Commit Guidelines

After completing the fixes, create **one commit** with all three fixes:

```bash
git add tauri-auth-desktop/src-tauri/src/lib.rs
git add Fightbot/fightbot.js
git commit -m "$(cat <<'EOF'
Fix critical bugs in window lifecycle and Fightbot

- Fix Tauri window lifecycle: use hide() instead of close()
  - Prevents windows from being destroyed permanently
  - Allows sign-out/sign-in flow to work correctly

- Fix Fightbot element ID typo: textigBtn → textingBtn
  - JavaScript now correctly references HTML element

- Patch Fightbot XSS vulnerability in addMessage()
  - Replace innerHTML with safe DOM manipulation
  - Use textContent for user data instead of template literals

Tested: Window transitions and Fightbot functionality

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

## Testing Checklist

### Tauri Window Fix
- [ ] Build app: `cd tauri-auth-desktop && npm run tauri dev`
- [ ] Sign in with test account
- [ ] Verify main window appears
- [ ] Click sign out
- [ ] Verify login window appears
- [ ] Sign in again
- [ ] Verify main window appears (proves windows weren't destroyed)

### Fightbot Fixes
- [ ] Open `Fightbot/index.html` in browser
- [ ] Open browser console for errors
- [ ] Click "Connect Your Phone"
- [ ] Click each category button (especially "Texting Etiquette")
- [ ] Verify messages appear without errors
- [ ] Check console for XSS warnings

## Next Steps (Loop 3+)

After completing these fixes, Master Agent will review and provide next task from fix_plan.md:
- Environment variable management
- Error boundary implementation
- Session refresh logic
- TypeScript conversion (longer term)

## Communication

If you encounter any issues:
1. Document the exact error message
2. Note which testing step failed
3. Check console/terminal output
4. Report back to Master Agent for guidance

---

**Created by**: Master Agent (project1-master)
**Date**: 2026-02-09
**Loop**: 1
**For**: Coder Agent (project1-coder)
