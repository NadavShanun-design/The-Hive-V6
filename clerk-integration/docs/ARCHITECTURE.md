# Clerk + Tauri Authentication Architecture

This document explains how the Clerk authentication system works within a Tauri desktop application, including technical details, data flow, and design decisions.

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Session Management](#session-management)
5. [Security Model](#security-model)
6. [Why tauri-plugin-clerk?](#why-tauri-plugin-clerk)
7. [Technical Challenges & Solutions](#technical-challenges--solutions)

---

## High-Level Overview

### The Problem

Clerk is designed for web applications and doesn't officially support Tauri desktop apps. The main challenges are:

1. **Cookie Management**: Tauri's webview has limited cookie support
2. **Redirect URLs**: OAuth callbacks use `http://localhost` which doesn't work in production
3. **Session Persistence**: Desktop apps need to maintain sessions across restarts
4. **CORS**: Tauri's webview has strict security policies

### The Solution

We use `tauri-plugin-clerk`, a community-built plugin that:
- Patches `globalThis.fetch` to route all network requests through Tauri's HTTP plugin
- Uses `tauri-plugin-store` for persistent session storage
- Handles OAuth redirects by intercepting and rewriting URLs
- Bypasses webview cookie limitations by managing tokens directly

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tauri Application                        │
│                                                              │
│  ┌────────────┐                           ┌──────────────┐  │
│  │   Login    │                           │     Main     │  │
│  │   Window   │                           │    Window    │  │
│  │            │                           │              │  │
│  │  Clerk UI  │ ─── handle_login_success ───▶ │ App Layout │  │
│  │  (OAuth)   │                           │  Onboarding  │  │
│  └────────────┘                           └──────────────┘  │
│        │                                         │          │
│        │                                         │          │
│        ▼                                         ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Clerk React Provider                        │  │
│  │  (ClerkProvider wraps entire app)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│        │                                         │          │
│        ▼                                         ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         tauri-plugin-clerk (Rust)                    │  │
│  │  • Patches fetch()                                   │  │
│  │  • Routes requests through Tauri HTTP                │  │
│  │  • Manages session via tauri-plugin-store            │  │
│  └──────────────────────────────────────────────────────┘  │
│        │                                         │          │
│        ▼                                         ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Tauri Backend (Rust Commands)                │  │
│  │  • handle_login_success                              │  │
│  │  • get_onboarding_status                             │  │
│  │  • complete_onboarding                               │  │
│  │  • check_onboarding_for_user                         │  │
│  └──────────────────────────────────────────────────────┘  │
│        │                                                    │
│        ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Persistent Storage                           │  │
│  │  • tauri-plugin-store (onboarding-status.json)       │  │
│  │  • SQLite Database (user data, settings)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │  Clerk Backend │
                  │  (clerk.com)   │
                  └────────────────┘
```

---

## Data Flow

### 1. Application Startup

```
1. Tauri launches → Two windows created: "login" (visible) and "main" (hidden)
2. Next.js loads in both windows
3. layout.tsx runs on mount
4. Clerk initialization begins:
   - import('tauri-plugin-clerk')
   - initClerk() → Returns Clerk instance
   - ClerkProvider wraps app with Clerk instance
5. Clerk loads session from tauri-plugin-store
6. If session exists → Auto-login
7. If no session → Show login UI
```

### 2. Login Flow

```
User clicks "Sign in with Google"
       ↓
Clerk opens OAuth popup/redirect
       ↓
User authenticates with Google
       ↓
Google redirects to: https://your-app.clerk.accounts.dev/v1/oauth_callback
       ↓
Clerk backend processes callback, creates session
       ↓
Clerk redirects to: tauri://localhost/login (forceRedirectUrl)
       ↓
Clerk SDK in webview receives tokens
       ↓
tauri-plugin-clerk saves session to tauri-plugin-store
       ↓
useAuth() hook detects: isSignedIn = true
       ↓
useEffect in login page detects sign-in
       ↓
Calls: invoke('handle_login_success')
       ↓
Rust command:
  1. Checks onboarding status
  2. If not completed → Set to step 3 (Download Progress)
  3. Shows main window
  4. Closes login window
       ↓
Main window loads with Clerk session
       ↓
layout.tsx checks onboarding status
       ↓
If not completed → Shows OnboardingFlow
If completed → Shows main app
```

### 3. Onboarding Flow

```
Main window opens (first-time user)
       ↓
layout.tsx calls: invoke('get_onboarding_status')
       ↓
Rust loads from tauri-plugin-store: onboarding-status.json
       ↓
Returns: { completed: false, current_step: 3 }
       ↓
layout.tsx sets: showOnboarding = true
       ↓
<OnboardingFlow> component renders:
  • Step 1: Welcome (skipped, goes to step 3)
  • Step 2: Setup Overview (skipped)
  • Step 3: Download Progress ← STARTS HERE
    - Downloads Parakeet model for transcription
    - Downloads Gemma model for summarization
  • Step 4: Permissions (macOS only)
    - Microphone access
    - System audio access
    - Notifications
       ↓
User completes all steps
       ↓
Calls: invoke('complete_onboarding', { model, userEmail })
       ↓
Rust command:
  1. Saves model config to SQLite
  2. Marks onboarding as completed in tauri-plugin-store
  3. Saves user email to onboarding-status.json
       ↓
OnboardingFlow calls: onComplete()
       ↓
layout.tsx reloads: window.location.reload()
       ↓
Main app loads (onboarding no longer shown)
```

### 4. Session Persistence

```
App closes
       ↓
Clerk session stored in: tauri-plugin-store
Location: ~/Library/Application Support/com.your-app/store.json (macOS)
Content: { "clerk_session": "sess_...", "clerk_tokens": {...} }
       ↓
App reopens
       ↓
Clerk loads session from store
       ↓
Validates token with Clerk backend
       ↓
If valid → Auto-login (no login window shown)
If expired → Show login window
```

---

## Session Management

### Token Storage

**Where tokens are stored:**
- `tauri-plugin-store` → JSON file on disk
- Path: `$APPDATA/store/clerk.json`
- Format:
  ```json
  {
    "clerk_session_id": "sess_2abc...",
    "clerk_client_id": "client_2xyz...",
    "clerk_tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_at": 1234567890
    }
  }
  ```

### Token Refresh

Clerk automatically refreshes tokens:
1. Token expiration checked on every API call
2. If expired, Clerk calls `/v1/refresh` endpoint
3. New tokens stored in tauri-plugin-store
4. App continues without interruption

### Sign Out

```typescript
// Frontend
import { useClerk } from '@clerk/clerk-react'

const { signOut } = useClerk()

await signOut()
```

What happens:
1. Clerk clears session from tauri-plugin-store
2. Calls Clerk backend to invalidate session
3. App can call `invoke('handle_sign_out')` to switch windows
4. Main window closes, login window opens

---

## Security Model

### Content Security Policy (CSP)

The CSP in `tauri.conf.json` restricts:

```json
{
  "csp": {
    "connect-src": "... https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev",
    "script-src": "... https://*.clerk.accounts.dev https://*.clerk.com",
    "frame-src": "... https://*.clerk.accounts.dev https://*.clerk.com"
  }
}
```

**Why this matters:**
- Prevents XSS attacks by limiting external scripts
- Allows Clerk domains for OAuth popups and API calls
- Blocks untrusted third-party scripts

### Permissions

Tauri capabilities restrict what the app can do:

```json
{
  "permissions": [
    "clerk:default",  // Clerk plugin access
    "store:default",  // Persistent storage
    "http:default",   // HTTPS requests only
    "fs:allow-app-read",  // Read app directory only
    "fs:allow-app-write"  // Write app directory only
  ]
}
```

**Security principles:**
- ✅ Least privilege: Only grant necessary permissions
- ✅ Scope isolation: File system access limited to app directory
- ✅ HTTPS-only: HTTP plugin restricts to HTTPS by default
- ✅ No secret keys in frontend: Only publishable key is embedded

### Data Protection

**Sensitive data handling:**
- ❌ Secret keys (`sk_test_*`, `sk_live_*`) → NEVER in frontend or Rust
- ✅ Publishable keys (`pk_test_*`, `pk_live_*`) → Safe to embed
- ✅ Session tokens → Stored in encrypted format by tauri-plugin-store
- ✅ User data → Stored in local SQLite (not transmitted)

---

## Why tauri-plugin-clerk?

### The Problem with Native Webviews

Tauri uses native webviews (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux). These have limitations:

1. **Cookie Isolation**: Cookies don't persist between app sessions
2. **OAuth Redirects**: Can't use `http://localhost:3000` in production
3. **CORS Issues**: Strict policies block some Clerk API calls
4. **Session Storage**: `localStorage` is cleared on some platforms

### How tauri-plugin-clerk Solves This

#### 1. Fetch Patching

```rust
// Rust (simplified)
impl ClerkPlugin {
    fn init(&mut self, webview: &WebView) {
        webview.eval(r#"
            const originalFetch = window.fetch;
            window.fetch = async (url, options) => {
                // Intercept all fetch calls
                return await window.__TAURI__.http.fetch(url, options);
            };
        "#);
    }
}
```

**Result**: All `fetch()` calls go through Tauri's HTTP client, which:
- Has proper cookie management
- Can set custom headers
- Bypasses webview CORS restrictions

#### 2. Session Persistence

```rust
// Store session data
let store = app.store("clerk.json")?;
store.set("clerk_session", session_data);
store.save()?;  // Persists to disk

// Load on next launch
let session = store.get("clerk_session");
```

**Result**: Sessions survive app restarts.

#### 3. Redirect URL Rewriting

```javascript
// tauri-plugin-clerk rewrites:
https://your-app.clerk.accounts.dev/oauth_callback
  ↓
tauri://localhost/login

// Clerk sees this as valid redirect URL
```

**Result**: OAuth works in production builds.

---

## Technical Challenges & Solutions

### Challenge 1: React 19 `use()` Hook with Promises

**Problem**: Clerk needs to be initialized asynchronously, but ClerkProvider expects a synchronous Clerk instance.

**Solution**: Use React 19's `use()` hook with Suspense:

```typescript
function ClerkWrappedProviders({
  clerkPromise
}: {
  clerkPromise: Promise<Clerk>
}) {
  const clerk = use(clerkPromise);  // Suspends until resolved

  return <ClerkProvider Clerk={clerk}>...</ClerkProvider>;
}

// In RootLayout
<Suspense fallback={<Loading />}>
  <ClerkWrappedProviders clerkPromise={clerkPromise} />
</Suspense>
```

### Challenge 2: Window Switching

**Problem**: Need to close login window and open main window after authentication.

**Solution**: Tauri command with window management:

```rust
#[tauri::command]
async fn handle_login_success<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let login_window = app.get_webview_window("login")?;
    let main_window = app.get_webview_window("main")?;

    main_window.show()?;
    main_window.set_focus()?;
    login_window.close()?;

    Ok(())
}
```

**Key insight**: Show new window BEFORE closing old window to prevent flicker.

### Challenge 3: Per-User Onboarding

**Problem**: Multiple users on the same machine should have separate onboarding states.

**Solution**: Store user email in onboarding status:

```rust
#[derive(Serialize, Deserialize)]
pub struct OnboardingStatus {
    pub completed: bool,
    pub user_email: Option<String>,  // Clerk user email
    // ...
}

#[tauri::command]
pub async fn check_onboarding_for_user(
    app: AppHandle,
    user_email: String,
) -> Result<bool, String> {
    let status = load_onboarding_status(&app).await?;
    Ok(status.completed && status.user_email == Some(user_email))
}
```

### Challenge 4: Production DevTools

**Problem**: Need to debug authentication issues in production DMG builds.

**Solution**: Add DevTools command with keyboard shortcuts:

```rust
#[tauri::command]
async fn open_devtools(app: AppHandle, label: String) -> Result<(), String> {
    let window = app.get_webview_window(&label)?;
    window.open_devtools();  // Works in both dev and production
    Ok(())
}
```

```typescript
// Frontend: F12 or Cmd+Shift+I
useEffect(() => {
    const handler = (e: KeyboardEvent) => {
        if (e.key === 'F12' || (e.metaKey && e.shiftKey && e.key === 'I')) {
            invoke('open_devtools', { label: 'login' });
        }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
}, []);
```

---

## Best Practices

### 1. Plugin Initialization Order

**Critical**: HTTP plugin must be initialized before Clerk plugin:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_http::init())  // FIRST
    .plugin(
        tauri_plugin_clerk::ClerkPluginBuilder::new()
            .publishable_key(CLERK_PUBLISHABLE_KEY)
            .with_tauri_store()
            .build()  // SECOND
    )
    .run(tauri::generate_context!())?;
```

### 2. Error Handling

Always handle Clerk initialization failures gracefully:

```typescript
import('tauri-plugin-clerk')
    .then(mod => mod.initClerk())
    .then(clerk => setClerkPromise(Promise.resolve(clerk)))
    .catch(err => {
        console.error('[Clerk] Failed to initialize:', err);
        // Show user-friendly error message
    });
```

### 3. Session Validation

Check session validity on app startup:

```typescript
useEffect(() => {
    if (isLoaded && !isSignedIn) {
        // Session expired, redirect to login
        window.location.href = '/login';
    }
}, [isLoaded, isSignedIn]);
```

---

## Performance Considerations

### Clerk Initialization Time

- **Cold start**: ~500-1000ms (first initialization)
- **Warm start**: ~100-300ms (cached session)

### Optimization Tips

1. **Lazy load Clerk**: Only initialize when needed
2. **Cache session**: Use tauri-plugin-store effectively
3. **Preload main window**: Create both windows on startup (hidden)
4. **Minimize redirects**: Use `forceRedirectUrl` to skip intermediate pages

---

## Future Improvements

Potential enhancements:

1. **Biometric Authentication**: Add Touch ID/Face ID support
2. **Offline Mode**: Cache user profile for offline access
3. **Multi-Account**: Support switching between multiple logged-in users
4. **Auto-Update**: Integrate with tauri-plugin-updater for seamless updates
5. **Analytics**: Track authentication events with PostHog/Mixpanel

---

For implementation details, see:
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Step-by-step integration
- [API_REFERENCE.md](./API_REFERENCE.md) - All available commands
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Architecture Version**: 1.0
**Last Updated**: February 2026
**Tauri Version**: 2.6+
**Clerk SDK**: v5.122+
