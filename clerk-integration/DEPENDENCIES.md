# Dependencies

Complete list of all dependencies required for the Clerk + Tauri integration.

---

## Frontend Dependencies (npm/pnpm)

### Required for Clerk Integration

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@clerk/clerk-react": "^5.122.0",
    "@clerk/clerk-js": "^5.0.0",
    "tauri-plugin-clerk": "^0.1.0",
    "@tauri-apps/api": "^2.6.2",
    "@tauri-apps/plugin-store": "^2.4.0"
  }
}
```

### Framework & UI Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.2.25",
    "typescript": "^5.7.2"
  }
}
```

### Optional (for full onboarding experience)

```json
{
  "dependencies": {
    "sonner": "^1.5.0",
    "framer-motion": "^11.15.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "tailwindcss": "^3.4.1",
    "clsx": "^2.1.1"
  }
}
```

---

## Backend Dependencies (Rust/Cargo)

### Required for Clerk Integration

Add to your `src-tauri/Cargo.toml`:

```toml
[dependencies]
# Tauri Core
tauri = { version = "2.6", features = ["macos-private-api"] }

# Clerk Plugin (local path)
tauri-plugin-clerk = { path = "../tauri-plugin-clerk" }

# Required Tauri Plugins
tauri-plugin-store = "2.4"
tauri-plugin-http = "2.0.0-rc.6"
tauri-plugin-notification = "2.3.1"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Logging
log = "0.4"

# Error Handling
anyhow = "1.0"

# Date/Time (for onboarding timestamps)
chrono = "0.4"

# Database (for onboarding persistence)
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio-native-tls", "migrate"] }

# Async Runtime
tokio = { version = "1.32", features = ["full"] }
```

### Optional Tauri Plugins

```toml
[dependencies]
tauri-plugin-dialog = "2.0"
tauri-plugin-shell = "2.3.4"
tauri-plugin-updater = "2.3.0"
tauri-plugin-process = "2.0"
tauri-plugin-fs = "2.4.0"
```

---

## Version Compatibility

### Tested Versions (February 2026)

| Package | Version | Required? |
|---------|---------|-----------|
| **Frontend** | | |
| @clerk/clerk-react | 5.122.0 | ✅ Required |
| tauri-plugin-clerk | 0.1.0 | ✅ Required |
| @tauri-apps/api | 2.6.2 | ✅ Required |
| Next.js | 14.2.25 | ✅ Required |
| React | 18.2.0 | ✅ Required |
| TypeScript | 5.7.2 | ⚠️ Recommended |
| **Backend** | | |
| Tauri | 2.6.2 | ✅ Required |
| tauri-plugin-clerk | local | ✅ Required |
| tauri-plugin-store | 2.4.0 | ✅ Required |
| tauri-plugin-http | 2.0.0-rc.6 | ✅ Required |
| SQLx | 0.7.x | ✅ Required |
| Serde | 1.0.x | ✅ Required |
| Tokio | 1.32+ | ✅ Required |

### Minimum Versions

- **Tauri**: 2.0.0 (2.6+ recommended)
- **Clerk SDK**: 5.0.0 (5.122+ recommended)
- **React**: 18.0.0 (for `use()` hook)
- **Next.js**: 14.0.0 (for App Router)
- **Node.js**: 18.0.0 (LTS)
- **Rust**: 1.70.0 (stable channel)

---

## Installation Commands

### All-in-One Installation

**Frontend:**
```bash
cd frontend

# Using npm
npm install @clerk/clerk-react @clerk/clerk-js tauri-plugin-clerk @tauri-apps/api @tauri-apps/plugin-store react react-dom next typescript

# Using pnpm
pnpm add @clerk/clerk-react @clerk/clerk-js tauri-plugin-clerk @tauri-apps/api @tauri-apps/plugin-store react react-dom next typescript
```

**Backend:**
```bash
cd src-tauri

# Cargo dependencies are added via Cargo.toml
# Then run:
cargo build
```

---

## Platform-Specific Requirements

### macOS

**System Requirements:**
- macOS 11.0 (Big Sur) or later
- Xcode Command Line Tools

**Installation:**
```bash
xcode-select --install
```

**Tauri CLI:**
```bash
cargo install tauri-cli --version "^2.0"
```

### Windows

**System Requirements:**
- Windows 10 (64-bit) or later
- WebView2 runtime (usually pre-installed)

**Installation:**
```powershell
# Install WebView2 if not present
winget install Microsoft.EdgeWebView2Runtime

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select: "Desktop development with C++"
```

**Tauri CLI:**
```powershell
cargo install tauri-cli --version "^2.0"
```

### Linux

**System Requirements:**
- Ubuntu 20.04+ (or equivalent)
- WebKitGTK 4.0+

**Installation (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Installation (Fedora):**
```bash
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

**Tauri CLI:**
```bash
cargo install tauri-cli --version "^2.0"
```

---

## Development Tools

### Recommended

```bash
# Node Version Manager (optional but useful)
nvm install 18
nvm use 18

# Rust toolchain (required)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Tauri CLI
npm install --save-dev @tauri-apps/cli@latest
# or
cargo install tauri-cli --version "^2.0"

# SQLx CLI (for migrations)
cargo install sqlx-cli --no-default-features --features sqlite
```

---

## Optional Dependencies

### For Full GEODO-like Experience

**Audio Processing:**
```toml
# src-tauri/Cargo.toml
[dependencies]
cpal = "0.15"          # Audio I/O
symphonia = "0.5"      # Audio decoding
rubato = "0.15"        # Resampling
```

**AI/ML Models:**
```toml
whisper-rs = "0.13"    # Speech recognition
ort = "2.0.0-rc.10"    # ONNX runtime
```

**UI Components:**
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.5",
    "@blocknote/react": "^0.36.0",
    "react-hook-form": "^7.59.0",
    "zod": "^3.23.8"
  }
}
```

---

## Peer Dependencies

### Automatically Resolved

Most peer dependencies are handled automatically by package managers, but be aware:

**Clerk requires:**
- `react` >= 18.0.0
- `react-dom` >= 18.0.0

**Tauri requires:**
- `@tauri-apps/api` matching your Tauri version

**Next.js requires:**
- `react` and `react-dom` at matching versions

---

## Build Dependencies

### Frontend Build

```json
{
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.7.2"
  }
}
```

### Backend Build

Managed by Cargo. Key build dependencies:

```toml
[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

---

## Runtime Requirements

### User's Machine (for your distributed app)

**macOS:**
- macOS 11+ (Big Sur or later)
- No additional runtime required

**Windows:**
- Windows 10+ (64-bit)
- WebView2 Runtime (usually pre-installed)

**Linux:**
- WebKitGTK 4.1
- GTK 3
- libayatana-appindicator3

---

## Clerk Account Requirements

### Free Tier Includes:

- ✅ Unlimited users in development
- ✅ Up to 10,000 monthly active users (production)
- ✅ Google OAuth
- ✅ Email/password authentication
- ✅ Session management
- ✅ User management dashboard

### Paid Tiers Add:

- More monthly active users
- Advanced security features
- SAML SSO
- Advanced analytics
- SLA guarantees

**For this integration**: Free tier is sufficient for most applications.

---

## Update Commands

### Update All Dependencies

**Frontend:**
```bash
# Check for updates
npm outdated

# Update all (carefully!)
npm update

# Update specific package
npm update @clerk/clerk-react
```

**Backend:**
```bash
# Update all Cargo dependencies
cargo update

# Check for outdated crates
cargo outdated  # Requires: cargo install cargo-outdated
```

---

## Troubleshooting Dependencies

### Issue: "Cannot find module 'tauri-plugin-clerk'"

**Solution:**
```bash
# Ensure plugin is in correct location
ls -la tauri-plugin-clerk/

# Install from npm (if using npm package)
npm install tauri-plugin-clerk

# Or update Cargo.toml path
[dependencies]
tauri-plugin-clerk = { path = "../tauri-plugin-clerk" }  # Adjust path
```

### Issue: Cargo build fails with "linker error"

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential  # Ubuntu/Debian
sudo dnf groupinstall "Development Tools"  # Fedora
```

**Windows:**
```powershell
# Install Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/
```

### Issue: "WebView2 not found" (Windows)

**Solution:**
```powershell
winget install Microsoft.EdgeWebView2Runtime
```

### Issue: SQLx migration errors

**Solution:**
```bash
# Install SQLx CLI
cargo install sqlx-cli --no-default-features --features sqlite

# Create database and run migrations
cd src-tauri
sqlx database create
sqlx migrate run
```

---

## Dependency Tree

### Core Dependencies

```
Your Tauri App
├── Tauri 2.6
│   ├── tauri-plugin-clerk
│   │   ├── tauri-plugin-http
│   │   └── tauri-plugin-store
│   └── Other Tauri plugins
│
└── Next.js 14
    ├── @clerk/clerk-react
    │   └── @clerk/clerk-js
    └── tauri-plugin-clerk (npm package)
```

---

## Security Notes

### Safe to Commit to Git:

- ✅ `package.json` with dependencies
- ✅ `Cargo.toml` with dependencies
- ✅ `package-lock.json` or `pnpm-lock.yaml`
- ✅ `Cargo.lock`

### Never Commit:

- ❌ `.env` files with API keys
- ❌ `node_modules/`
- ❌ `target/` (Rust build output)
- ❌ Secret keys (`sk_test_*`, `sk_live_*`)

---

## License Information

### Open Source Dependencies

All listed dependencies are open source:

- **Tauri**: MIT/Apache 2.0
- **React**: MIT
- **Next.js**: MIT
- **Clerk SDK**: MIT
- **Rust crates**: Various (mostly MIT/Apache 2.0)

### Commercial Services

- **Clerk Platform**: Commercial (free tier available)
  - SDK is open source (MIT)
  - Backend service requires account

---

## Summary

**Minimum Required:**
- `@clerk/clerk-react`, `tauri-plugin-clerk`, `@tauri-apps/api` (frontend)
- `tauri`, `tauri-plugin-clerk`, `tauri-plugin-store`, `tauri-plugin-http` (backend)

**Total Installation Size:**
- Frontend: ~500MB (with node_modules)
- Backend: ~2GB (with Rust target/ directory)
- User's machine: ~60-100MB (final app size)

**Installation Time:**
- First time: ~10-15 minutes (depends on internet speed)
- Subsequent: ~2-3 minutes (cached dependencies)

---

For installation help, see:
- [INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md) - Step-by-step setup
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common dependency issues

---

**Last Updated**: February 2026
