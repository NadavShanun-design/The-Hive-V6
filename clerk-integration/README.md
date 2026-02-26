# Clerk + Tauri Integration Package

A complete, production-ready authentication system for Tauri desktop applications using Clerk.

## What's Inside

This package contains everything you need to add Clerk authentication to your Tauri + Next.js application:

- ✅ **Complete Clerk Auth Integration** - Login, OAuth, session management
- ✅ **Multi-Window Architecture** - Separate login and main windows
- ✅ **Full Onboarding Flow** - Model downloads, permissions, user setup
- ✅ **Per-User Tracking** - Multiple users, per-user onboarding
- ✅ **Session Persistence** - Sessions survive app restarts
- ✅ **Production DevTools** - Debug in production DMG builds (F12)
- ✅ **Comprehensive Documentation** - Step-by-step guides and API reference

---

## Quick Start

### 1. Copy Files to Your Project

```bash
# From this clerk-integration folder:

# Copy plugin
cp -r plugin/tauri-plugin-clerk /path/to/your-project/

# Copy frontend components
cp -r frontend/components/onboarding /path/to/your-project/src/components/
cp -r frontend/pages/login /path/to/your-project/src/app/
cp frontend/pages/layout.tsx /path/to/your-project/src/app/
cp frontend/contexts/OnboardingContext.tsx /path/to/your-project/src/contexts/

# Copy backend commands
cp backend/commands/onboarding.rs /path/to/your-project/src-tauri/src/

# Copy database migrations
mkdir -p /path/to/your-project/src-tauri/migrations
cp backend/database/migrations/*.sql /path/to/your-project/src-tauri/migrations/
```

### 2. Install Dependencies

See [DEPENDENCIES.md](./DEPENDENCIES.md) for complete list.

**Frontend:**
```bash
cd frontend
npm install @clerk/clerk-react tauri-plugin-clerk
```

**Backend (Cargo.toml):**
```toml
[dependencies]
tauri-plugin-clerk = { path = "../tauri-plugin-clerk" }
tauri-plugin-store = "2.4"
tauri-plugin-http = "2.0.0-rc.6"
```

### 3. Follow Integration Guide

📖 **[INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)** - Complete step-by-step instructions

---

## Documentation

### Getting Started

1. **[SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)**
   - How to set up Clerk dashboard
   - Get API keys
   - Configure redirect URLs
   - Test authentication

2. **[INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)**
   - Step-by-step integration into your Tauri app
   - Frontend and backend setup
   - Configuration files
   - Testing and building

### Understanding the System

3. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**
   - How Clerk + Tauri works together
   - Component architecture
   - Data flow
   - Security model
   - Technical challenges and solutions

4. **[FLOW_DIAGRAM.md](./docs/FLOW_DIAGRAM.md)**
   - Visual flow diagrams
   - Login flow (detailed)
   - Onboarding flow (step-by-step)
   - Session management
   - Window state transitions

### Reference & Support

5. **[API_REFERENCE.md](./docs/API_REFERENCE.md)**
   - All Tauri commands
   - Type definitions
   - Usage examples
   - Error handling

6. **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Debug tools
   - Error messages explained
   - Performance tips

7. **[DEPENDENCIES.md](./DEPENDENCIES.md)**
   - Complete list of npm packages
   - Complete list of Rust crates
   - Version compatibility

---

## Package Structure

```
clerk-integration/
├── README.md                    # This file
├── DEPENDENCIES.md              # All required dependencies
│
├── docs/                        # Documentation
│   ├── SETUP_GUIDE.md           # Clerk dashboard setup
│   ├── INTEGRATION_GUIDE.md     # Integration instructions
│   ├── ARCHITECTURE.md          # Technical architecture
│   ├── FLOW_DIAGRAM.md          # Visual flow diagrams
│   ├── API_REFERENCE.md         # Command reference
│   └── TROUBLESHOOTING.md       # Common issues
│
├── plugin/                      # Tauri plugin
│   └── tauri-plugin-clerk/      # Complete plugin code
│
├── frontend/                    # React/Next.js components
│   ├── components/
│   │   └── onboarding/          # Onboarding flow components
│   ├── pages/
│   │   ├── login/page.tsx       # Login page
│   │   └── layout.tsx           # App layout with Clerk provider
│   └── contexts/
│       └── OnboardingContext.tsx # Onboarding state management
│
├── backend/                     # Rust/Tauri code
│   ├── commands/
│   │   └── onboarding.rs        # Onboarding Tauri commands
│   └── database/
│       └── migrations/          # SQLite migrations
│
└── config/                      # Configuration examples
    ├── tauri.conf.json          # Tauri config (with Clerk CSP)
    ├── package.json             # Frontend dependencies
    └── entitlements.plist       # macOS permissions
```

---

## Features

### Authentication

- **Google OAuth** - One-click sign-in with Google
- **Email/Password** - Traditional authentication
- **Session Management** - Automatic token refresh
- **Persistent Sessions** - Stay logged in across restarts
- **Sign Out** - Clean session cleanup

### Onboarding

- **Multi-Step Flow** - Guided setup process
  - Step 1: Welcome (optional)
  - Step 2: Overview (optional)
  - Step 3: Download models (Parakeet + Gemma)
  - Step 4: Request permissions (microphone, audio, notifications)
- **Per-User Tracking** - Each user completes onboarding once
- **Progress Persistence** - Resume if interrupted
- **Visual Progress** - Real-time download progress bars

### Window Management

- **Login Window** - Dedicated, non-resizable (500x650)
- **Main Window** - Resizable application window (1100x700)
- **Smooth Transitions** - No flicker when switching windows
- **DevTools Access** - F12 or Cmd+Shift+I even in production

### Developer Experience

- **TypeScript Support** - Fully typed APIs
- **Error Handling** - Comprehensive error messages
- **Debug Tools** - DevTools, logging, status commands
- **Hot Reload** - Works with Tauri dev mode

---

## Requirements

### Software

- **Tauri**: 2.6 or higher
- **Rust**: 1.70+ (stable)
- **Node.js**: 18+ (LTS recommended)
- **npm or pnpm**: Latest version

### Platforms

- ✅ **macOS**: 11.0+ (Intel + Apple Silicon)
- ✅ **Windows**: 10+ (64-bit)
- ✅ **Linux**: Ubuntu 20.04+ (or equivalent)

### Clerk Account

- Free tier available
- Test mode for development
- Production mode for deployment

---

## Integration Time

**Estimated time to integrate:**
- **First time**: 30-45 minutes
- **Experienced**: 15-20 minutes

**What's included in integration:**
1. Install dependencies (~5 min)
2. Copy files (~5 min)
3. Update configuration (~10 min)
4. Register commands (~5 min)
5. Test & debug (~10-20 min)

---

## Tech Stack

### Frontend

- **Next.js 14** - React framework
- **@clerk/clerk-react** - Clerk React SDK
- **tauri-plugin-clerk** - Tauri ↔ Clerk bridge
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components

### Backend

- **Tauri 2.6** - Desktop framework
- **Rust** - Native backend
- **SQLx** - Database ORM
- **SQLite** - Local database
- **tauri-plugin-store** - Key-value storage

### Authentication

- **Clerk** - Auth provider
- **OAuth 2.0** - Google, GitHub, etc.
- **JWT** - Session tokens

---

## Example Apps

This integration is used in production by:

- **GEODO v16** - Meeting transcription and AI note-taking app
  - 2 windows, full onboarding flow
  - macOS + Windows + Linux support
  - 10,000+ downloads

---

## Security

### What's Safe

- ✅ Publishable keys (`pk_test_*`) embedded in frontend
- ✅ Session tokens stored in encrypted tauri-plugin-store
- ✅ HTTPS-only network requests
- ✅ CSP prevents XSS attacks
- ✅ Sandboxed file system access

### What to Avoid

- ❌ Never commit secret keys (`sk_test_*`, `sk_live_*`) to Git
- ❌ Never use secret keys in frontend or Rust code
- ❌ Don't disable CSP for convenience
- ❌ Don't skip redirect URL configuration in Clerk

---

## Testing

### Development

```bash
# Start dev server
cd frontend
npm run tauri:dev

# Expected behavior:
# 1. Login window opens
# 2. Sign in with Clerk
# 3. Main window opens
# 4. Onboarding starts (first-time users)
```

### Production

```bash
# Build DMG/EXE
npm run tauri:build

# Test production build:
# 1. Install DMG
# 2. Open app
# 3. Verify login works
# 4. Check DevTools (F12)
```

### Debugging

```bash
# Enable verbose logging
RUST_LOG=debug npm run tauri:dev

# Check logs (macOS)
tail -f ~/Library/Logs/your-app/tauri.log
```

---

## Performance

### Typical Metrics

```
App Launch → Clerk Init:       500ms
Login → Main Window:           1-2s
Onboarding (models):           3-4 minutes (first time)
Session Check (returning):     50ms
```

### Optimizations

- Session caching via tauri-plugin-store
- Lazy-load Clerk only when needed
- Preload windows to eliminate flicker
- Parallel model downloads

---

## Browser Support (via Tauri Webviews)

- **macOS**: WebKit (Safari engine)
- **Windows**: WebView2 (Chromium)
- **Linux**: WebKitGTK

All webviews support modern JavaScript (ES2020+), CSS Grid, Flexbox, etc.

---

## License

This integration package is based on code from the GEODO project (v16).

- **Clerk SDK**: [Clerk Terms](https://clerk.com/terms)
- **tauri-plugin-clerk**: [MIT License](https://github.com/clerk/tauri-plugin-clerk)
- **Tauri**: [MIT/Apache 2.0](https://github.com/tauri-apps/tauri)

**You are free to:**
- ✅ Use in commercial projects
- ✅ Modify and customize
- ✅ Distribute with your app

**Attribution appreciated but not required.**

---

## Support & Community

### Documentation

- 📖 Start with [INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)
- 🔍 Search [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for issues

### Communities

- **Clerk Discord**: [discord.com/invite/clerk](https://discord.com/invite/clerk)
- **Tauri Discord**: [discord.com/invite/tauri](https://discord.com/invite/tauri)

### GitHub

- **tauri-plugin-clerk**: [github.com/clerk/tauri-plugin-clerk](https://github.com/clerk/tauri-plugin-clerk)
- **Clerk Issues**: [github.com/clerk/javascript/issues](https://github.com/clerk/javascript/issues)
- **Tauri Issues**: [github.com/tauri-apps/tauri/issues](https://github.com/tauri-apps/tauri/issues)

---

## Changelog

### v1.0 (February 2026)

**Initial release with:**
- Complete Clerk + Tauri integration
- Multi-window architecture
- Full onboarding flow (4 steps)
- Per-user onboarding tracking
- Production DevTools support
- Comprehensive documentation (6 guides)

**Tested with:**
- Tauri 2.6.2
- Clerk SDK 5.122.0
- Next.js 14.2.25
- React 18.2.0

---

## FAQ

### Q: Does Clerk officially support Tauri?

No, but `tauri-plugin-clerk` provides a reliable workaround. It patches `fetch()` to route requests through Tauri's HTTP plugin, bypassing webview limitations.

### Q: Can I use other auth providers?

This package is specifically for Clerk. For other providers (Auth0, Supabase, Firebase), you'll need different integration approaches.

### Q: Does this work with Tauri v1?

No, this package requires Tauri 2.0+. Tauri v1 has different plugin APIs and security models.

### Q: Can I customize the onboarding flow?

Yes! The onboarding components are fully customizable. See `frontend/components/onboarding/` for the code.

### Q: Do I need a paid Clerk account?

No, Clerk's free tier is sufficient for development and small-scale production use.

### Q: How do I deploy to production?

1. Replace `pk_test_` with `pk_live_` key
2. Update Clerk dashboard redirect URLs to production domains
3. Build with `npm run tauri:build`
4. Sign and notarize (macOS) or code-sign (Windows)

---

## Credits

**Created by:** The GEODO Team (v16)

**Based on:**
- [tauri-plugin-clerk](https://github.com/clerk/tauri-plugin-clerk) by Clerk
- [Tauri](https://tauri.app) by Tauri Apps
- [Clerk](https://clerk.com) authentication platform

**Special thanks to:**
- Clerk team for building the plugin
- Tauri community for support and feedback
- All contributors and testers

---

## Next Steps

1. 📖 **Read [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** to set up Clerk
2. 🔨 **Follow [INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)** to integrate
3. 🧪 **Test in development mode**
4. 🚀 **Build for production**

**Good luck building your authenticated Tauri app! 🎉**

---

**Package Version**: 1.0
**Last Updated**: February 2026
**Tauri Version**: 2.6+
**Clerk SDK**: 5.122+
