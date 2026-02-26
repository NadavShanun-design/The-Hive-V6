# Troubleshooting Guide

Common issues and solutions for Clerk + Tauri authentication integration.

---

## Table of Contents

1. [Clerk Initialization Issues](#clerk-initialization-issues)
2. [Login Problems](#login-problems)
3. [Onboarding Issues](#onboarding-issues)
4. [Session Management](#session-management)
5. [Window Management](#window-management)
6. [Build & Deployment](#build--deployment)
7. [Debug Tools](#debug-tools)

---

## Clerk Initialization Issues

### Error: "Clerk is not initialized"

**Symptoms:**
- Login page shows blank screen or error
- Console shows: `[Clerk] Failed to initialize`

**Possible Causes:**

#### 1. tauri-plugin-http not initialized

**Solution:**
```rust
// In src-tauri/src/lib.rs
// IMPORTANT: HTTP plugin MUST come before Clerk plugin

tauri::Builder::default()
    .plugin(tauri_plugin_http::init())  // ← HTTP FIRST
    .plugin(
        tauri_plugin_clerk::ClerkPluginBuilder::new()
            .publishable_key(CLERK_PUBLISHABLE_KEY)
            .with_tauri_store()
            .build()  // ← Clerk SECOND
    )
    .run(tauri::generate_context!())?;
```

#### 2. Invalid Publishable Key

**Check:**
```rust
const CLERK_PUBLISHABLE_KEY: &str = "pk_test_...";
```

**Solution:**
- Verify key starts with `pk_test_` (development) or `pk_live_` (production)
- Check for typos
- Regenerate key in Clerk dashboard if needed

#### 3. CSP Blocking Clerk Domains

**Check `tauri.conf.json`:**
```json
{
  "security": {
    "csp": {
      "connect-src": "... https://*.clerk.accounts.dev https://*.clerk.com",
      "script-src": "... https://*.clerk.accounts.dev https://*.clerk.com",
      "frame-src": "... https://*.clerk.accounts.dev https://*.clerk.com"
    }
  }
}
```

**Solution:** Add missing Clerk domains to CSP.

#### 4. clerk:default Permission Missing

**Check `tauri.conf.json`:**
```json
{
  "capabilities": [
    {
      "permissions": [
        "clerk:default"  // ← Must be present
      ]
    }
  ]
}
```

---

### Error: "Module not found: tauri-plugin-clerk"

**Symptoms:**
- Build fails
- Runtime error: "Cannot find module 'tauri-plugin-clerk'"

**Solution:**

1. **Check npm package:**
   ```bash
   npm install tauri-plugin-clerk
   ```

2. **Verify Cargo.toml:**
   ```toml
   [dependencies]
   tauri-plugin-clerk = { path = "../tauri-plugin-clerk" }
   ```

3. **Check plugin location:**
   ```bash
   ls -la tauri-plugin-clerk/
   # Should contain Cargo.toml, src/, etc.
   ```

---

## Login Problems

### Issue: "redirect_uri mismatch"

**Symptoms:**
- OAuth fails after clicking "Sign in with Google"
- Clerk shows error: "The redirect_uri does not match"

**Solution:**

1. **Add redirect URLs in Clerk dashboard:**
   - Go to Dashboard → Configure → Paths
   - Add:
     ```
     tauri://localhost
     tauri://localhost/login
     http://localhost:3118 (dev only)
     ```

2. **Add to sign-out URLs:**
   ```
   tauri://localhost/login
   ```

3. **Rebuild app after changes:**
   ```bash
   npm run tauri:build
   ```

---

### Issue: Login succeeds but window doesn't switch

**Symptoms:**
- User authenticates successfully
- Login window stays open
- Main window doesn't appear

**Debug Steps:**

1. **Check console for errors:**
   - Press F12 on login window
   - Look for `handle_login_success` errors

2. **Verify command registration:**
   ```rust
   .invoke_handler(tauri::generate_handler![
       handle_login_success,  // ← Must be registered
       // ...
   ])
   ```

3. **Check if main window exists:**
   ```bash
   # In tauri.conf.json
   "windows": [
       { "label": "login", ... },
       { "label": "main", ... }  // ← Must exist
   ]
   ```

**Solution:**
If window switching fails, add error handling:

```typescript
useEffect(() => {
  if (isSignedIn && isLoaded) {
    invoke('handle_login_success')
      .catch(err => {
        console.error('[Login] Failed:', err);
        // Fallback: reload the page
        window.location.href = '/';
      });
  }
}, [isSignedIn, isLoaded]);
```

---

### Issue: Infinite redirect loop

**Symptoms:**
- Page keeps redirecting between `/login` and `/`
- Console shows repeated navigation events

**Causes:**
- Onboarding check triggers redirect
- Clerk session check conflicts with routing

**Solution:**

```typescript
// In layout.tsx, prevent redirect loops
const [isCheckingAuth, setIsCheckingAuth] = useState(true);

useEffect(() => {
  if (pathname === '/login') {
    setIsCheckingAuth(false);
    return; // Don't check onboarding on login page
  }

  // Check auth state
  invoke('get_onboarding_status')
    .then(/* ... */)
    .finally(() => setIsCheckingAuth(false));
}, [pathname]);

// Don't render app until check completes
if (isCheckingAuth) {
  return <LoadingSpinner />;
}
```

---

## Onboarding Issues

### Issue: Onboarding appears every time

**Symptoms:**
- Onboarding flow shows on every app launch
- "Complete Setup" doesn't persist

**Debug Steps:**

1. **Check if onboarding is being saved:**
   ```typescript
   // After completing onboarding
   const status = await invoke('get_onboarding_status');
   console.log('Saved status:', status);
   // Should show: { completed: true }
   ```

2. **Verify tauri-plugin-store is working:**
   ```bash
   # Check if store file exists (macOS)
   ls ~/Library/Application\ Support/com.your-app/
   # Should contain: onboarding-status.json
   ```

3. **Check for store errors:**
   ```rust
   // In onboarding.rs, add detailed logs
   match save_onboarding_status(&app, &status).await {
       Ok(_) => log::info!("✅ Saved successfully"),
       Err(e) => log::error!("❌ Save failed: {}", e),
   }
   ```

**Solutions:**

#### tauri-plugin-store not initialized:
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())  // ← Add this
    .plugin(...)
```

#### Permission denied (file system):
```json
// In tauri.conf.json
{
  "permissions": [
    "fs:allow-app-write",  // ← Add if missing
    "store:default"
  ]
}
```

---

### Issue: Model download fails

**Symptoms:**
- Onboarding stuck at "Downloading models..."
- Download progress never completes

**Debug:**

1. **Check Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return list of models
   ```

2. **Check network connectivity:**
   - Parakeet downloads from GitHub/Hugging Face
   - Gemma downloads via Ollama API

3. **Check CSP allows connections:**
   ```json
   {
     "csp": {
       "connect-src": "... http://localhost:11434 https://api.ollama.ai"
     }
   }
   ```

**Solutions:**

- **Ollama not installed:**
  ```bash
  brew install ollama  # macOS
  ollama serve         # Start server
  ```

- **Download interrupted:**
  - Retry download (button should appear)
  - Check disk space (models are 1-4GB)

- **Firewall blocking:**
  - Allow app to access localhost:11434
  - Check macOS Security & Privacy settings

---

### Issue: Onboarding step 3 skipped immediately

**Symptoms:**
- After login, onboarding starts at step 4 (permissions)
- Models not downloaded

**Cause:** `handle_login_success` sets onboarding to step 3, but logic might skip it.

**Solution:**

Verify onboarding flow doesn't auto-advance:

```typescript
// In OnboardingFlow.tsx
const [currentStep, setCurrentStep] = useState(3);  // Start at 3

// Don't auto-advance unless user clicks button
const handleNext = () => {
  if (modelsDownloaded) {
    setCurrentStep(currentStep + 1);
  }
};
```

---

## Session Management

### Issue: User logged out after app restart

**Symptoms:**
- User must login every time app opens
- Session doesn't persist

**Debug:**

1. **Check store persistence:**
   ```bash
   # macOS
   cat ~/Library/Application\ Support/com.your-app/clerk.json
   # Should contain: { "clerk_session_id": "..." }
   ```

2. **Check Clerk initialization:**
   ```typescript
   useEffect(() => {
     import('tauri-plugin-clerk')
       .then(mod => mod.initClerk())
       .then(clerk => {
         console.log('Session loaded:', clerk.session);  // ← Check this
       });
   }, []);
   ```

**Solutions:**

- **Store not persisting:**
  ```rust
  // Ensure .with_tauri_store() is called
  tauri_plugin_clerk::ClerkPluginBuilder::new()
      .publishable_key(CLERK_PUBLISHABLE_KEY)
      .with_tauri_store()  // ← Must have this
      .build()
  ```

- **Session expired:**
  - Default: 7 days
  - Check Clerk dashboard → Sessions → Session lifetime

---

### Issue: "Session expired" during active use

**Symptoms:**
- User logged out while using app
- Error: "Token expired"

**Cause:** Token refresh failed.

**Solution:**

Clerk should auto-refresh, but if it fails:

1. **Check network connectivity**
2. **Verify Clerk API is accessible:**
   ```bash
   curl https://api.clerk.com/v1/health
   ```

3. **Add manual refresh logic:**
   ```typescript
   import { useClerk } from '@clerk/clerk-react';

   const { session } = useClerk();

   useEffect(() => {
     const interval = setInterval(async () => {
       if (session) {
         await session.touch(); // Force refresh
       }
     }, 60000); // Every minute

     return () => clearInterval(interval);
   }, [session]);
   ```

---

## Window Management

### Issue: Windows flicker during switch

**Symptoms:**
- Brief flash of empty window
- Both windows visible momentarily

**Solution:**

Ensure correct order in `handle_login_success`:

```rust
// CORRECT ORDER:
main_window.show()?;          // 1. Show new window
main_window.set_focus()?;     // 2. Focus new window
login_window.close()?;        // 3. Close old window

// DON'T DO THIS:
login_window.close()?;        // ❌ Creates visible gap
main_window.show()?;
```

---

### Issue: DevTools won't open

**Symptoms:**
- F12 or Cmd+Shift+I does nothing
- No DevTools window appears

**Solutions:**

1. **Check command registration:**
   ```rust
   .invoke_handler(tauri::generate_handler![
       open_devtools,  // ← Must be here
   ])
   ```

2. **Check keyboard event listener:**
   ```typescript
   // In login page
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if (e.key === 'F12') {
         e.preventDefault();  // ← Important!
         invoke('open_devtools', { label: 'login' });
       }
     };
     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
   }, []);
   ```

3. **macOS Issue - Fullscreen mode:**
   - DevTools might open in another space
   - Check Mission Control for DevTools window

---

## Build & Deployment

### Issue: DMG build succeeds but Clerk fails in production

**Symptoms:**
- Development works fine
- Production DMG shows "Clerk not initialized"

**Solutions:**

1. **Check publishable key is embedded:**
   ```rust
   // In lib.rs
   const CLERK_PUBLISHABLE_KEY: &str = "pk_test_...";
   // Or use environment variable at build time:
   const CLERK_PUBLISHABLE_KEY: &str = env!("CLERK_PUBLISHABLE_KEY");
   ```

2. **Verify CSP in production:**
   ```json
   {
     "csp": {
       "script-src": "'unsafe-eval' ...",  // ← Needed for Clerk
       "connect-src": "https://*.clerk.accounts.dev https://*.clerk.com"
     }
   }
   ```

3. **Check entitlements (macOS):**
   ```xml
   <!-- entitlements.plist -->
   <key>com.apple.security.network.client</key>
   <true/>
   ```

---

### Issue: Code signing errors (macOS)

**Symptoms:**
- Build fails with "code signature invalid"
- App won't open on other Macs

**Solutions:**

1. **Sign with Apple Developer ID:**
   ```json
   // tauri.conf.json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAMID)",
         "providerShortName": "TEAMID"
       }
     }
   }
   ```

2. **Notarize for distribution:**
   ```bash
   xcrun notarytool submit your-app.dmg \
     --apple-id "you@example.com" \
     --password "app-specific-password" \
     --team-id "TEAMID"
   ```

---

## Debug Tools

### Enable Verbose Logging

**Rust side:**
```rust
// In lib.rs
log::set_max_level(log::LevelFilter::Debug);  // or Trace
```

**Frontend side:**
```typescript
// Add to layout.tsx
if (process.env.NODE_ENV === 'development') {
  (window as any).debugClerk = () => {
    console.log('Clerk debug info:', {
      isLoaded,
      isSignedIn,
      session: clerk?.session,
      user: clerk?.user
    });
  };
}

// Then in browser console:
debugClerk()
```

---

### Check Store Contents

**macOS:**
```bash
# Onboarding status
cat ~/Library/Application\ Support/com.your-app/onboarding-status.json | jq

# Clerk session
cat ~/Library/Application\ Support/com.your-app/clerk.json | jq
```

**Windows:**
```powershell
# %APPDATA%\com.your-app\onboarding-status.json
type "%APPDATA%\com.your-app\onboarding-status.json"
```

---

### Network Debugging

Check if Clerk API calls are working:

1. **Open DevTools (F12)**
2. **Go to Network tab**
3. **Filter:** `clerk`
4. **Look for:**
   - `/v1/client` - Session check
   - `/v1/oauth_callback` - OAuth redirect
   - `/v1/refresh` - Token refresh

Expected status codes:
- `200 OK` - Success
- `401 Unauthorized` - Session expired (will trigger re-login)
- `403 Forbidden` - Invalid API key or origin

---

### Test Commands Directly

**In browser console (DevTools):**
```javascript
// Check onboarding status
await window.__TAURI__.core.invoke('get_onboarding_status')

// Test window switching
await window.__TAURI__.core.invoke('handle_login_success')

// Open DevTools
await window.__TAURI__.core.invoke('open_devtools', { label: 'main' })
```

---

## Common Error Messages

### `"Window 'main' not found"`

**Cause:** Main window wasn't created in `tauri.conf.json`

**Fix:** Add main window to config:
```json
{
  "windows": [
    { "label": "main", "title": "Your App", "url": "/" }
  ]
}
```

---

### `"Failed to access onboarding store: ..."`

**Cause:** tauri-plugin-store not initialized or permissions missing

**Fix:**
```rust
.plugin(tauri_plugin_store::Builder::default().build())
```

```json
{
  "permissions": ["store:default"]
}
```

---

### `"CORS error: ... clerk.accounts.dev"`

**Cause:** CSP blocking Clerk domains

**Fix:** Update CSP in `tauri.conf.json`:
```json
{
  "csp": {
    "connect-src": "'self' https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev"
  }
}
```

---

## Still Having Issues?

1. **Check GitHub Issues:**
   - [tauri-plugin-clerk issues](https://github.com/clerk/tauri-plugin-clerk/issues)
   - [Clerk issues](https://github.com/clerk/javascript/issues)

2. **Join Communities:**
   - [Clerk Discord](https://discord.com/invite/clerk)
   - [Tauri Discord](https://discord.com/invite/tauri)

3. **Enable Debug Mode:**
   ```bash
   # Run with full logging
   RUST_LOG=debug npm run tauri:dev
   ```

4. **Check Logs:**
   ```bash
   # macOS
   tail -f ~/Library/Logs/your-app/tauri.log

   # Windows
   type %LOCALAPPDATA%\your-app\logs\tauri.log
   ```

---

**Last Updated**: February 2026
