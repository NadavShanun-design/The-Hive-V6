# Clerk Authentication Setup Guide

This guide will walk you through setting up Clerk authentication for your Tauri application from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clerk Dashboard Setup](#clerk-dashboard-setup)
3. [Get Your API Keys](#get-your-api-keys)
4. [Configure Clerk Dashboard for Tauri](#configure-clerk-dashboard-for-tauri)
5. [Environment Variables](#environment-variables)
6. [Testing Authentication](#testing-authentication)

---

## Prerequisites

Before you begin, ensure you have:

- A Tauri 2.x application set up
- Node.js and npm/pnpm installed
- Rust toolchain installed
- A Clerk account (free tier available)

---

## Clerk Dashboard Setup

### Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com)
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2: Create a New Application

1. Once logged in, click "Add application" or "Create application"
2. Enter your application name (e.g., "My Tauri App")
3. Select authentication providers you want to enable:
   - **Recommended**: Google, GitHub
   - Email/Password is enabled by default
4. Click "Create application"

---

## Get Your API Keys

### Publishable Key

1. In your Clerk dashboard, go to **API Keys** section
2. You'll see two types of keys:
   - **Publishable Key** (starts with `pk_test_...` for development)
   - **Secret Key** (starts with `sk_test_...`) - DO NOT use this in frontend!

3. Copy your **Publishable Key** - you'll need this for:
   - Rust backend configuration
   - Frontend environment variables

**Example:**
```
pk_test_ZGVzaXJlZC10dW5hLTk3LmNsZXJrLmFjY291bnRzLmRldiQ
```

---

## Configure Clerk Dashboard for Tauri

This is **CRITICAL** - Clerk doesn't officially support Tauri, so we need to configure specific settings.

### Step 1: Add Tauri Redirect URLs

Go to **Dashboard → Configure → Paths** and add the following URLs:

**Redirect URLs (Sign-in/Sign-up):**
```
tauri://localhost
tauri://localhost/login
http://localhost:3118 (for development)
http://localhost:3118/login (for development)
```

**Sign-out URLs:**
```
tauri://localhost/login
http://localhost:3118/login (for development)
```

### Step 2: Configure Allowed Origins

Go to **Dashboard → Configure → Domains** and add:

**Allowed Origins:**
```
tauri://localhost
http://localhost:3118 (for development)
```

### Step 3: Enable Session Management

Go to **Dashboard → Configure → Sessions**:
- Enable "Multi-session"
- Set session lifetime to your preference (default: 7 days)
- Enable "Sign-out from all devices" if needed

### Step 4: Configure OAuth Providers (Optional)

If using Google OAuth:

1. Go to **Dashboard → Configure → Social Connections**
2. Click **Google**
3. You can use Clerk's development keys for testing
4. For production, add your own Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     ```
     https://your-app.clerk.accounts.dev/v1/oauth_callback
     ```

---

## Environment Variables

### For Development

Create a `.env.local` file in your frontend directory:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### For Production (Rust Backend)

In `src-tauri/src/lib.rs`, set your publishable key:

```rust
const CLERK_PUBLISHABLE_KEY: &str = "pk_test_your_key_here"; // Replace with your actual key

// Or use environment variable at build time:
const CLERK_PUBLISHABLE_KEY: &str = env!("CLERK_PUBLISHABLE_KEY");
```

**For build-time environment variable:**
```bash
# macOS/Linux
export CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
npm run tauri:build

# Windows
set CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
npm run tauri:build
```

---

## Testing Authentication

### Development Mode

1. Start your development server:
   ```bash
   npm run tauri:dev
   ```

2. The login window should open automatically
3. Try signing in with your configured providers
4. Check the browser console (F12) for Clerk initialization logs

### Expected Logs

You should see:
```
[Clerk] Starting initialization...
[Clerk] Plugin module loaded successfully
[Clerk] Successfully initialized
[Clerk] Publishable key: pk_test_...
```

### Troubleshooting Login Issues

If login fails:

1. **Open DevTools**: Press `F12` or `Cmd+Shift+I` on the login window
2. Check for errors in Console tab
3. Common issues:
   - ❌ **"redirect_uri mismatch"** → Check Clerk dashboard redirect URLs
   - ❌ **"Invalid publishable key"** → Verify your API key
   - ❌ **CORS errors** → Add `tauri://localhost` to allowed origins
   - ❌ **Clerk not initializing** → Check CSP in `tauri.conf.json`

---

## Next Steps

Once authentication is working:

1. ✅ Test sign-in flow
2. ✅ Test sign-out flow
3. ✅ Test onboarding flow (first-time users)
4. ✅ Test user session persistence
5. ✅ Build and test production DMG/EXE

For integration instructions, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).

---

## Security Best Practices

### DO:
- ✅ Use environment variables for API keys
- ✅ Use `pk_test_` keys for development only
- ✅ Upgrade to `pk_live_` keys for production
- ✅ Implement proper CSP in `tauri.conf.json`
- ✅ Use HTTPS in production

### DON'T:
- ❌ Never commit API keys to version control
- ❌ Never use Secret Keys (`sk_test_` or `sk_live_`) in frontend
- ❌ Don't disable CSP for convenience
- ❌ Don't skip redirect URL configuration

---

## Production Checklist

Before going to production:

- [ ] Replace `pk_test_` with `pk_live_` publishable key
- [ ] Configure production domain in Clerk dashboard
- [ ] Update redirect URLs to production URLs
- [ ] Enable webhook signing (optional, for advanced integrations)
- [ ] Set up proper error handling
- [ ] Test with real users
- [ ] Monitor authentication success rate

---

## Support & Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Tauri Plugin Clerk**: https://github.com/clerk/tauri-plugin-clerk
- **Clerk Community**: https://discord.com/invite/clerk
- **Tauri Discord**: https://discord.com/invite/tauri

---

## Common Errors & Solutions

### Error: "Clerk is not initialized"

**Solution**: Check that:
1. `tauri-plugin-clerk` is installed in Cargo.toml
2. Plugin is registered in `lib.rs` before `.run()`
3. CSP allows Clerk domains

### Error: "Failed to fetch"

**Solution**:
1. Add `tauri-plugin-http` to your Cargo.toml
2. Ensure HTTP plugin is initialized before Clerk plugin
3. Check that `http:default` permission is in capabilities

### Error: "Session expired"

**Solution**:
1. Check session lifetime settings in Clerk dashboard
2. Implement token refresh logic (Clerk handles this automatically)
3. Verify `tauri-plugin-store` is working correctly

---

**Last Updated**: February 2026
**Clerk API Version**: v1
**Tauri Version**: 2.6+
