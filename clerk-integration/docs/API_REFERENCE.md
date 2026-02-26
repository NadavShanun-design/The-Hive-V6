# Tauri Commands API Reference

Complete reference for all Tauri commands used in the Clerk integration, including authentication, onboarding, and window management.

---

## Table of Contents

1. [Authentication Commands](#authentication-commands)
2. [Onboarding Commands](#onboarding-commands)
3. [Window Management Commands](#window-management-commands)
4. [Utility Commands](#utility-commands)
5. [Frontend Utilities](#frontend-utilities)
6. [Type Definitions](#type-definitions)

---

## Authentication Commands

### `handle_login_success`

Handles successful login by switching from login window to main window and initializing onboarding for first-time users.

**Signature:**
```rust
#[tauri::command]
async fn handle_login_success<R: Runtime>(app: AppHandle<R>) -> Result<(), String>
```

**Frontend Usage:**
```typescript
import { invoke } from '@tauri-apps/api/core';

await invoke('handle_login_success');
```

**Parameters:** None

**Returns:** `Promise<void>`

**Behavior:**
1. Loads current onboarding status
2. If onboarding not completed → Sets to Step 3 (Download Progress)
3. Shows main window
4. Focuses main window
5. Closes login window

**Errors:**
- `"Login window not found"` - Login window doesn't exist
- `"Main window not found"` - Main window doesn't exist
- `"Failed to show main window: ..."` - Window operations failed

**Example:**
```typescript
// In login page after successful authentication
useEffect(() => {
  if (isSignedIn && isLoaded) {
    invoke('handle_login_success')
      .then(() => console.log('Switched to main window'))
      .catch(err => console.error('Failed to switch windows:', err));
  }
}, [isSignedIn, isLoaded]);
```

---

### `handle_sign_out`

Handles sign-out by switching from main window back to login window.

**Signature:**
```rust
#[tauri::command]
async fn handle_sign_out<R: Runtime>(app: AppHandle<R>) -> Result<(), String>
```

**Frontend Usage:**
```typescript
import { invoke } from '@tauri-apps/api/core';

await invoke('handle_sign_out');
```

**Parameters:** None

**Returns:** `Promise<void>`

**Behavior:**
1. Gets or creates login window
2. Shows login window
3. Focuses login window
4. Closes main window

**Errors:**
- `"Main window not found"` - Main window doesn't exist
- `"Failed to create login window: ..."` - Window creation failed

**Example:**
```typescript
// In user menu or settings
const handleSignOut = async () => {
  await clerk.signOut(); // Clear Clerk session first
  await invoke('handle_sign_out'); // Then switch windows
};
```

---

## Onboarding Commands

### `get_onboarding_status`

Retrieves the current onboarding status from persistent storage.

**Signature:**
```rust
#[tauri::command]
pub async fn get_onboarding_status<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Option<OnboardingStatus>, String>
```

**Frontend Usage:**
```typescript
import { invoke } from '@tauri-apps/api/core';

interface OnboardingStatus {
  version: string;
  completed: boolean;
  current_step: number;
  model_status: {
    parakeet: 'downloaded' | 'not_downloaded' | 'downloading';
    summary: 'downloaded' | 'not_downloaded' | 'downloading';
  };
  last_updated: string; // ISO 8601 timestamp
  user_email?: string;
}

const status = await invoke<OnboardingStatus | null>('get_onboarding_status');
```

**Parameters:** None

**Returns:** `Promise<OnboardingStatus | null>`
- `null` if onboarding never started
- `OnboardingStatus` object if exists

**Example:**
```typescript
useEffect(() => {
  invoke<OnboardingStatus | null>('get_onboarding_status')
    .then(status => {
      if (!status || !status.completed) {
        setShowOnboarding(true);
      }
    });
}, []);
```

---

### `save_onboarding_status_cmd`

Saves onboarding status to persistent storage.

**Signature:**
```rust
#[tauri::command]
pub async fn save_onboarding_status_cmd<R: Runtime>(
    app: AppHandle<R>,
    status: OnboardingStatus,
) -> Result<(), String>
```

**Frontend Usage:**
```typescript
await invoke('save_onboarding_status_cmd', {
  status: {
    version: '1.0',
    completed: false,
    current_step: 3,
    model_status: {
      parakeet: 'downloading',
      summary: 'not_downloaded'
    },
    last_updated: new Date().toISOString(),
    user_email: 'user@example.com'
  }
});
```

**Parameters:**
- `status`: `OnboardingStatus` - Complete onboarding status object

**Returns:** `Promise<void>`

**Errors:**
- `"Failed to save onboarding status: ..."` - Persistence failure

**Example:**
```typescript
// Update onboarding step
const updateStep = async (step: number) => {
  const currentStatus = await invoke<OnboardingStatus>('get_onboarding_status');
  await invoke('save_onboarding_status_cmd', {
    status: {
      ...currentStatus,
      current_step: step,
      last_updated: new Date().toISOString()
    }
  });
};
```

---

### `complete_onboarding`

Marks onboarding as completed and saves model configuration to database.

**Signature:**
```rust
#[tauri::command]
pub async fn complete_onboarding<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    model: String,
    user_email: Option<String>,
) -> Result<(), String>
```

**Frontend Usage:**
```typescript
await invoke('complete_onboarding', {
  model: 'gemma3:4b', // or 'gemma3:1b'
  userEmail: 'user@example.com'
});
```

**Parameters:**
- `model`: `string` - Selected summary model (`gemma3:1b` or `gemma3:4b`)
- `user_email`: `string | null` - Clerk user email (for per-user tracking)

**Returns:** `Promise<void>`

**Behavior:**
1. Saves model config to SQLite database:
   - Provider: `builtin-ai`
   - Model: provided model name
   - Whisper: `large-v3`
   - Transcription: `parakeet-tdt-0.6b-v3-int8`
2. Marks onboarding as completed in tauri-plugin-store
3. Associates with user email

**Errors:**
- `"Failed to save builtin-ai model config: ..."` - Database error
- `"Failed to save transcription model config: ..."` - Database error
- `"Failed to save completed onboarding status: ..."` - Store error

**Example:**
```typescript
const handleComplete = async () => {
  try {
    await invoke('complete_onboarding', {
      model: selectedModel,
      userEmail: user?.primaryEmailAddress?.emailAddress
    });

    console.log('Onboarding completed!');
    window.location.reload(); // Reload to show main app
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
  }
};
```

---

### `check_onboarding_for_user`

Checks if onboarding is completed for a specific user (by email).

**Signature:**
```rust
#[tauri::command]
pub async fn check_onboarding_for_user<R: Runtime>(
    app: AppHandle<R>,
    user_email: String,
) -> Result<bool, String>
```

**Frontend Usage:**
```typescript
const isComplete = await invoke<boolean>('check_onboarding_for_user', {
  userEmail: 'user@example.com'
});
```

**Parameters:**
- `user_email`: `string` - Clerk user email address

**Returns:** `Promise<boolean>`
- `true` if onboarding completed for this user
- `false` if not completed or different user

**Use Case:**
This enables per-user onboarding tracking. Multiple users can log in on the same machine, and each will go through onboarding once.

**Example:**
```typescript
useEffect(() => {
  if (!user) return;

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return;

  invoke<boolean>('check_onboarding_for_user', { userEmail: email })
    .then(isComplete => {
      setShowOnboarding(!isComplete);
    });
}, [user]);
```

---

### `reset_onboarding_status_cmd`

Resets onboarding status (for testing or allowing users to re-run onboarding).

**Signature:**
```rust
#[tauri::command]
pub async fn reset_onboarding_status_cmd<R: Runtime>(
    app: AppHandle<R>,
) -> Result<(), String>
```

**Frontend Usage:**
```typescript
await invoke('reset_onboarding_status_cmd');
```

**Parameters:** None

**Returns:** `Promise<void>`

**Behavior:**
Deletes onboarding status from tauri-plugin-store, forcing onboarding to restart on next app launch.

**Example:**
```typescript
// In settings/debug menu
const handleResetOnboarding = async () => {
  if (confirm('Reset onboarding? You will go through setup again on restart.')) {
    await invoke('reset_onboarding_status_cmd');
    alert('Onboarding reset. Restart the app to go through setup again.');
  }
};
```

---

## Window Management Commands

### `open_devtools`

Opens DevTools for a specific window (works in both development and production).

**Signature:**
```rust
#[tauri::command]
async fn open_devtools<R: Runtime>(app: AppHandle<R>, label: String) -> Result<(), String>
```

**Frontend Usage:**
```typescript
await invoke('open_devtools', { label: 'main' });
// or
await invoke('open_devtools', { label: 'login' });
```

**Parameters:**
- `label`: `string` - Window label (`"main"` or `"login"`)

**Returns:** `Promise<void>`

**Errors:**
- `"Window 'X' not found"` - Specified window doesn't exist

**Example:**
```typescript
// Add keyboard shortcut to open DevTools
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // F12 or Cmd+Shift+I
    if (e.key === 'F12' || (e.metaKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
      invoke('open_devtools', { label: 'login' });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Utility Commands

### Frontend Clerk Initialization

**Usage:**
```typescript
import { useEffect, useState } from 'react';
import type { Clerk } from '@clerk/clerk-js';

const [clerkPromise, setClerkPromise] = useState<Promise<Clerk> | null>(null);

useEffect(() => {
  console.log('[Clerk] Starting initialization...');

  import('tauri-plugin-clerk')
    .then(mod => {
      console.log('[Clerk] Plugin loaded');
      return mod.initClerk();
    })
    .then(clerk => {
      console.log('[Clerk] Initialized successfully');
      console.log('[Clerk] Publishable key:', clerk.publishableKey);
      setClerkPromise(Promise.resolve(clerk));
    })
    .catch(err => {
      console.error('[Clerk] Initialization failed:', err);
    });
}, []);
```

**Returns:** `Promise<Clerk>`
- Clerk SDK instance with all authentication methods

---

## Frontend Utilities

### Clerk React Hooks

**useAuth** - Access authentication state:
```typescript
import { useAuth } from '@clerk/clerk-react';

const { isSignedIn, isLoaded } = useAuth();
```

**useUser** - Access current user:
```typescript
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();

const email = user?.primaryEmailAddress?.emailAddress;
```

**useClerk** - Access Clerk methods:
```typescript
import { useClerk } from '@clerk/clerk-react';

const { signOut } = useClerk();

await signOut();
```

---

## Type Definitions

### OnboardingStatus

```typescript
interface OnboardingStatus {
  version: string;              // "1.0"
  completed: boolean;           // true if onboarding done
  current_step: number;         // 1-4
  model_status: ModelStatus;    // Download status
  last_updated: string;         // ISO 8601 timestamp
  user_email?: string;          // Clerk user email
}
```

### ModelStatus

```typescript
interface ModelStatus {
  parakeet: 'downloaded' | 'not_downloaded' | 'downloading';
  summary: 'downloaded' | 'not_downloaded' | 'downloading';
}
```

---

## Command Registration

All commands must be registered in your `src-tauri/src/lib.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    // Authentication
    handle_login_success,
    handle_sign_out,

    // Onboarding
    get_onboarding_status,
    save_onboarding_status_cmd,
    complete_onboarding,
    check_onboarding_for_user,
    reset_onboarding_status_cmd,

    // Utilities
    open_devtools,

    // ... your other commands
])
```

---

## Error Handling Best Practices

### Frontend Error Handling

```typescript
try {
  const result = await invoke<ReturnType>('command_name', { param: value });
  // Handle success
} catch (error) {
  console.error('Command failed:', error);

  // Show user-friendly error
  toast.error('Operation failed', {
    description: error as string
  });
}
```

### Rust Error Handling

```rust
#[tauri::command]
pub async fn my_command() -> Result<SuccessType, String> {
    // Use ? to propagate errors
    let data = load_data().await
        .map_err(|e| format!("Failed to load data: {}", e))?;

    // Explicit error handling
    if data.is_empty() {
        return Err("No data found".to_string());
    }

    Ok(data)
}
```

---

## Testing Commands

### Using Browser DevTools

```typescript
// Open DevTools in your app
// Then run commands directly in console:

await window.__TAURI__.core.invoke('get_onboarding_status');

await window.__TAURI__.core.invoke('complete_onboarding', {
  model: 'gemma3:1b',
  userEmail: 'test@example.com'
});
```

### Unit Tests (Frontend)

```typescript
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke for testing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

test('loads onboarding status', async () => {
  (invoke as Mock).mockResolvedValue({
    completed: false,
    current_step: 3
  });

  const status = await invoke('get_onboarding_status');
  expect(status.current_step).toBe(3);
});
```

---

## Performance Notes

### Command Execution Time

Typical execution times (development mode):

- `handle_login_success`: ~500ms (window operations)
- `get_onboarding_status`: ~10ms (store read)
- `save_onboarding_status_cmd`: ~20ms (store write + disk persist)
- `complete_onboarding`: ~50ms (database + store operations)
- `check_onboarding_for_user`: ~15ms (store read + comparison)
- `open_devtools`: ~100ms (webview operation)

**Optimization tip**: Batch multiple operations when possible rather than calling commands in sequence.

---

## Security Considerations

### Input Validation

All commands validate inputs:
- Window labels checked against existing windows
- Email addresses validated (basic format check)
- JSON structures validated via serde

### Permission Model

Commands require capabilities in `tauri.conf.json`:
```json
{
  "permissions": [
    "core:window:default",
    "store:default"
  ]
}
```

### Data Access

- Onboarding data stored per-app (isolated)
- User email only saved with consent
- No sensitive data in logs

---

For more information:
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration steps
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How commands work internally
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Last Updated**: February 2026
**API Version**: 1.0
**Tauri**: 2.6+
