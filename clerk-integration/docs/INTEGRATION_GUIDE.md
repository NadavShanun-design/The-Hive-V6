# Clerk Integration Guide - Step-by-Step

This guide will help you integrate the complete Clerk authentication system into your Tauri + Next.js application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Install Dependencies](#install-dependencies)
3. [Backend Integration (Rust/Tauri)](#backend-integration-rusttauri)
4. [Frontend Integration (Next.js/React)](#frontend-integration-nextjsreact)
5. [Database Setup](#database-setup)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Build for Production](#build-for-production)

---

## Quick Start

**What you're getting:**
- ✅ Complete Clerk authentication (Google OAuth, Email/Password)
- ✅ Login window + Main app window flow
- ✅ Multi-step onboarding with model downloads & permissions
- ✅ Per-user onboarding tracking
- ✅ Session persistence across app restarts
- ✅ DevTools access for debugging (F12)

**Time to integrate**: ~30-45 minutes

---

## Install Dependencies

### 1. Frontend Dependencies (npm/pnpm)

Add these to your `frontend/package.json`:

```json
{
  "dependencies": {
    "@clerk/clerk-react": "^5.122.0",
    "@clerk/clerk-js": "^5.0.0",
    "tauri-plugin-clerk": "^0.1.0",
    "@tauri-apps/api": "^2.6.2",
    "@tauri-apps/plugin-store": "^2.4.0",
    "sonner": "^1.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.2.25"
  }
}
```

Install:
```bash
cd frontend
npm install
# or
pnpm install
```

### 2. Backend Dependencies (Cargo.toml)

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2.6", features = ["macos-private-api"] }
tauri-plugin-clerk = { path = "../tauri-plugin-clerk" }  # Local plugin
tauri-plugin-store = "2.4"
tauri-plugin-http = "2.0.0-rc.6"
tauri-plugin-notification = "2.3.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
anyhow = "1.0"
chrono = "0.4"
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio-native-tls"] }
tokio = { version = "1.32", features = ["full"] }
```

---

## Backend Integration (Rust/Tauri)

### Step 1: Copy Plugin to Your Project

```bash
# From the clerk-integration folder
cp -r plugin/tauri-plugin-clerk /path/to/your-project/
```

### Step 2: Add Onboarding Module

Copy the onboarding Rust code:

```bash
# From clerk-integration/backend/commands/
cp onboarding.rs /path/to/your-project/src-tauri/src/
```

In your `src-tauri/src/lib.rs`, add:

```rust
mod onboarding;

use onboarding::{
    get_onboarding_status,
    save_onboarding_status_cmd,
    complete_onboarding,
    check_onboarding_for_user,
    reset_onboarding_status_cmd,
};
```

### Step 3: Add Window Management Commands

Add these commands to your `lib.rs`:

```rust
use tauri::{AppHandle, Runtime};

const CLERK_PUBLISHABLE_KEY: &str = "pk_test_YOUR_KEY_HERE"; // Replace!

#[tauri::command]
async fn handle_login_success<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    log::info!("User logged in successfully, switching windows");

    // Set onboarding to step 3 for first-time users
    match onboarding::load_onboarding_status(&app).await {
        Ok(status) => {
            if !status.completed {
                let mut new_status = status.clone();
                new_status.current_step = 3; // Download Progress
                new_status.completed = false;

                let _ = onboarding::save_onboarding_status(&app, &new_status).await;
            }
        }
        Err(_) => {}
    }

    // Switch windows: close login, show main
    let login_window = app.get_webview_window("login")
        .ok_or_else(|| "Login window not found".to_string())?;
    let main_window = app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    main_window.show().map_err(|e| format!("{}", e))?;
    main_window.set_focus().map_err(|e| format!("{}", e))?;
    login_window.close().map_err(|e| format!("{}", e))?;

    Ok(())
}

#[tauri::command]
async fn open_devtools<R: Runtime>(app: AppHandle<R>, label: String) -> Result<(), String> {
    let window = app.get_webview_window(&label)
        .ok_or_else(|| format!("Window '{}' not found", label))?;

    window.open_devtools();
    Ok(())
}
```

### Step 4: Register Commands

In your `pub fn run()` function:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_clerk::ClerkPluginBuilder::new()
                .publishable_key(CLERK_PUBLISHABLE_KEY)
                .with_tauri_store()
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            open_devtools,
            handle_login_success,
            get_onboarding_status,
            save_onboarding_status_cmd,
            complete_onboarding,
            check_onboarding_for_user,
            reset_onboarding_status_cmd,
            // ... your other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**⚠️ Important Order**: `tauri-plugin-http` MUST be initialized before `tauri-plugin-clerk`!

---

## Frontend Integration (Next.js/React)

### Step 1: Copy Components

```bash
# From clerk-integration/frontend/
cp -r components/onboarding /path/to/your-project/src/components/
cp -r pages/login /path/to/your-project/src/app/
cp pages/layout.tsx /path/to/your-project/src/app/
cp -r contexts/OnboardingContext.tsx /path/to/your-project/src/contexts/
```

### Step 2: Update Your Root Layout

Replace your `src/app/layout.tsx` with the copied one, or merge these changes:

```typescript
'use client'

import { useEffect, useState, Suspense, use } from 'react'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { invoke } from '@tauri-apps/api/core'
import { OnboardingFlow } from '@/components/onboarding'
import type { Clerk } from '@clerk/clerk-js'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (pathname === '/login') return;

    invoke<{ completed: boolean } | null>('get_onboarding_status')
      .then((status) => {
        if (!status || !status.completed) {
          setShowOnboarding(true);
        }
      });
  }, [pathname]);

  // Verify user-specific onboarding when Clerk loads
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) return;

    invoke<boolean>('check_onboarding_for_user', { userEmail })
      .then((isComplete) => {
        setShowOnboarding(!isComplete);
      });
  }, [isLoaded, isSignedIn, user]);

  if (pathname === '/login') {
    return children;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => {
      setShowOnboarding(false);
      window.location.reload();
    }} />;
  }

  return <div className="flex">
    {/* Your app layout */}
    {children}
  </div>;
}

function ClerkWrappedProviders({
  clerkPromise,
  children
}: {
  clerkPromise: Promise<Clerk>
  children: React.ReactNode
}) {
  const clerk = use(clerkPromise);

  return (
    <ClerkProvider
      publishableKey={clerk.publishableKey}
      Clerk={clerk}
    >
      {/* Your other providers */}
      <LayoutContent>{children}</LayoutContent>
    </ClerkProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [clerkPromise, setClerkPromise] = useState<Promise<Clerk> | null>(null);

  useEffect(() => {
    console.log('[Clerk] Starting initialization...');

    import('tauri-plugin-clerk')
      .then(mod => mod.initClerk())
      .then(clerk => {
        console.log('[Clerk] Successfully initialized');
        setClerkPromise(Promise.resolve(clerk));
      })
      .catch(err => {
        console.error('[Clerk] Failed to initialize:', err);
      });
  }, []);

  if (!clerkPromise) {
    return <html lang="en"><body>Loading...</body></html>;
  }

  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ClerkWrappedProviders clerkPromise={clerkPromise}>
            {children}
          </ClerkWrappedProviders>
        </Suspense>
      </body>
    </html>
  );
}
```

### Step 3: Create Login Page

File: `src/app/login/page.tsx` (already copied)

This should contain:
- Clerk `<SignIn />` component
- DevTools keyboard shortcuts (F12, Cmd+Shift+I)
- Auto-redirect to main app after successful login

### Step 4: Add Onboarding Context

The `OnboardingContext.tsx` provides state management for the onboarding flow. Make sure it's imported in your layout:

```typescript
import { OnboardingProvider } from '@/contexts/OnboardingContext'

// Wrap your app in the provider
<OnboardingProvider>
  {children}
</OnboardingProvider>
```

---

## Database Setup

### Step 1: Copy Migrations

```bash
mkdir -p /path/to/your-project/src-tauri/migrations
cp clerk-integration/backend/database/migrations/*.sql /path/to/your-project/src-tauri/migrations/
```

### Step 2: Add SQLx Setup

In your `src-tauri/src/lib.rs`, add database initialization:

```rust
use sqlx::{sqlite::SqlitePool, migrate::MigrateDatabase, Sqlite};

async fn init_database() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_url = "sqlite://path/to/your/app.db";

    // Create database if it doesn't exist
    if !Sqlite::database_exists(db_url).await? {
        Sqlite::create_database(db_url).await?;
    }

    // Connect
    let pool = SqlitePool::connect(db_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
```

The migrations include:
- `onboarding_status` table for tracking setup progress
- Settings table for user preferences
- Meeting/transcript tables (if needed)

---

## Configuration

### Step 1: Update tauri.conf.json

Add these sections to your `src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "label": "login",
        "title": "Sign in to Your App",
        "url": "/login",
        "width": 500,
        "height": 650,
        "resizable": false,
        "center": true,
        "visible": true
      },
      {
        "label": "main",
        "title": "Your App",
        "url": "/",
        "width": 1100,
        "height": 700,
        "resizable": true,
        "center": true,
        "visible": false
      }
    ],
    "security": {
      "csp": {
        "default-src": "'self'",
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' asset: https://asset.localhost data: https://*.clerk.accounts.dev https://*.clerk.com",
        "connect-src": "'self' https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev wss://*.clerk.com",
        "script-src": "'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com",
        "frame-src": "'self' https://*.clerk.accounts.dev https://*.clerk.com"
      },
      "capabilities": [
        {
          "identifier": "main",
          "windows": ["main", "login"],
          "permissions": [
            "core:default",
            "store:default",
            "notification:default",
            "clerk:default",
            {
              "identifier": "http:default",
              "allow": [{"url": "https://*"}]
            }
          ]
        }
      ]
    }
  }
}
```

### Step 2: macOS Entitlements (Optional)

If on macOS, add `entitlements.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
```

Reference in `tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "entitlements": "entitlements.plist"
    }
  }
}
```

---

## Testing

### Development Mode

```bash
cd frontend
npm run tauri:dev
```

**Expected behavior:**
1. Login window opens automatically
2. Click "Sign in with Google" (or email)
3. Complete authentication
4. Login window closes
5. Main window opens with onboarding (Step 3: Download Progress)
6. Complete onboarding steps
7. Main app loads

### Debug Mode

- Press `F12` or `Cmd+Shift+I` on any window to open DevTools
- Check Console tab for Clerk initialization logs
- Look for errors related to redirect URIs or CORS

### Test Cases

✅ **Login Flow**
- [ ] Google OAuth works
- [ ] Email/password login works
- [ ] Window switches correctly after login

✅ **Onboarding Flow**
- [ ] Onboarding appears on first launch
- [ ] Model download works
- [ ] Permissions are requested (macOS only)
- [ ] Onboarding completes successfully

✅ **Session Persistence**
- [ ] User stays logged in after restart
- [ ] Onboarding doesn't re-appear after completion

✅ **Sign Out**
- [ ] Sign out returns to login window
- [ ] Main window closes properly

---

## Build for Production

### macOS

```bash
cd frontend
npm run tauri:build

# Output: src-tauri/target/release/bundle/dmg/your-app.dmg
```

### Windows

```bash
npm run tauri:build

# Output: src-tauri/target/release/bundle/nsis/your-app-installer.exe
```

### Code Signing (macOS)

Add to `tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Your Developer ID Application",
      "providerShortName": "YOUR_TEAM_ID"
    }
  }
}
```

---

## Troubleshooting

### Clerk not initializing

1. Check that `tauri-plugin-http` is initialized first
2. Verify CSP allows Clerk domains
3. Check publishable key is correct

### Login redirects to blank page

1. Verify `tauri://localhost` is in Clerk redirect URLs
2. Check `handle_login_success` command is registered
3. Look for errors in DevTools console

### Onboarding appears every time

1. Check `tauri-plugin-store` is installed
2. Verify `complete_onboarding` command saves correctly
3. Check user email is being passed to onboarding commands

### Build fails

1. Ensure all Rust dependencies are in Cargo.toml
2. Run `cargo clean` and rebuild
3. Check that migrations folder exists in src-tauri

---

## Next Steps

1. ✅ Customize onboarding steps for your app
2. ✅ Add your own post-login logic
3. ✅ Implement user profile page
4. ✅ Set up analytics for authentication events
5. ✅ Configure production Clerk keys

---

For more details, see:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Clerk dashboard setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How everything works
- [API_REFERENCE.md](./API_REFERENCE.md) - All Tauri commands

---

**Integration Support**: If you run into issues, check TROUBLESHOOTING.md or open an issue.
