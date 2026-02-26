# Authentication & Onboarding Flow Diagrams

Visual representations of the complete user journey from login to main app.

---

## Table of Contents

1. [Complete User Journey](#complete-user-journey)
2. [Login Flow (Detailed)](#login-flow-detailed)
3. [Onboarding Flow (Detailed)](#onboarding-flow-detailed)
4. [Session Management](#session-management)
5. [Window State Diagram](#window-state-diagram)

---

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                    │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Check Existing        │
              │  Session (Clerk)       │
              └────────────────────────┘
                     │         │
          No Session │         │ Valid Session
                     │         │
                     ▼         ▼
         ┌──────────────┐  ┌────────────────┐
         │    Login     │  │  Check         │
         │    Window    │  │  Onboarding    │
         │   (OAuth)    │  │  Status        │
         └──────────────┘  └────────────────┘
                 │                │         │
                 │                │         │
                 │         Not Done│  Done  │
                 │                │         │
                 ▼                ▼         ▼
         ┌──────────────┐  ┌────────────┐ ┌────────────┐
         │  Google      │  │ Onboarding │ │  Main App  │
         │  Sign In     │  │   Flow     │ │  (Ready)   │
         └──────────────┘  │  Step 3→4  │ └────────────┘
                 │         └────────────┘
                 │                │
                 │                │
                 │                ▼
                 │         ┌────────────────┐
                 │         │  Download      │
                 │         │  Models        │
                 │         │  (Parakeet +   │
                 │         │   Gemma)       │
                 │         └────────────────┘
                 │                │
                 │                ▼
                 │         ┌────────────────┐
                 │         │  Request       │
                 │         │  Permissions   │
                 │         │  (macOS only)  │
                 │         └────────────────┘
                 │                │
                 │                ▼
                 │         ┌────────────────┐
                 │         │  Complete      │
                 │         │  Onboarding    │
                 │         └────────────────┘
                 │                │
                 ▼                ▼
         ┌──────────────────────────┐
         │    Main Window Opens     │
         │   (Login Window Closes)  │
         └──────────────────────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │      Main App Ready      │
         │   (Recording, Notes,     │
         │    Transcription, etc.)  │
         └──────────────────────────┘
```

---

## Login Flow (Detailed)

### Step-by-Step Sequence

```
1. APP LAUNCH
   │
   ├─▶ Create "login" window (visible)
   ├─▶ Create "main" window (hidden)
   │
   ▼
2. CLERK INITIALIZATION
   │
   ├─▶ import('tauri-plugin-clerk')
   ├─▶ initClerk()
   ├─▶ ClerkProvider wraps app
   │
   ▼
3. CHECK SESSION
   │
   ├─▶ Clerk loads from tauri-plugin-store
   │   ├─ Session exists? → Skip to step 8
   │   └─ No session? → Continue
   │
   ▼
4. SHOW LOGIN UI
   │
   ├─▶ <SignIn /> component renders
   ├─▶ User clicks "Sign in with Google"
   │
   ▼
5. OAUTH FLOW
   │
   ├─▶ Clerk opens OAuth popup
   ├─▶ User authenticates with Google
   ├─▶ Google redirects to Clerk callback URL
   ├─▶ Clerk creates session
   │
   ▼
6. REDIRECT TO APP
   │
   ├─▶ Clerk redirects to: tauri://localhost/login
   ├─▶ Clerk SDK receives tokens
   ├─▶ tauri-plugin-clerk saves session
   │
   ▼
7. DETECT SIGN-IN
   │
   ├─▶ useAuth() hook: isSignedIn = true
   ├─▶ useEffect in login page triggers
   ├─▶ invoke('handle_login_success')
   │
   ▼
8. SWITCH WINDOWS
   │
   ├─▶ Rust command: handle_login_success
   │   ├─ Check onboarding status
   │   ├─ If not complete → Set to step 3
   │   ├─ Show main window
   │   └─ Close login window
   │
   ▼
9. MAIN WINDOW LOADS
   │
   ├─▶ layout.tsx mounts
   ├─▶ Check onboarding status
   │   ├─ Not complete? → Show OnboardingFlow
   │   └─ Complete? → Show main app
   │
   ▼
10. READY TO USE
```

### Timeline (Typical)

```
Time      Event
────────────────────────────────────────────────────────────
0ms       App launches
500ms     Clerk initialized
550ms     Session check complete → No session
600ms     Login UI rendered
10s       User clicks "Sign in with Google"
12s       Google OAuth popup opens
15s       User completes Google sign-in
16s       Clerk receives callback
16.5s     Session saved to tauri-plugin-store
17s       handle_login_success called
17.2s     Main window shown, login window closed
17.5s     Onboarding flow renders (Step 3)
```

---

## Onboarding Flow (Detailed)

### Multi-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│                   ONBOARDING STARTS                          │
│         (After successful login, first-time users)           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Step 1: Welcome (SKIPPED)    │
         │   - Show app features          │
         │   - Not shown on login         │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Step 2: Setup Overview       │
         │        (SKIPPED)               │
         │   - Explain what will happen   │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │ ✅ Step 3: Download Progress   │
         │        ⬅ STARTS HERE           │
         └────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Download Parakeet Model             │
      │  - parakeet-tdt-0.6b-v3-int8.gguf    │
      │  - ~600MB                            │
      │  - Real-time progress bar            │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Download Gemma Model via Ollama     │
      │  - gemma3:1b (small) or              │
      │    gemma3:4b (recommended)           │
      │  - 1-4GB download                    │
      │  - Ollama must be running            │
      └──────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │ ✅ Step 4: Permissions         │
         │    (macOS only)                │
         └────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Request Microphone Access           │
      │  - Tauri triggers system prompt      │
      │  - User approves/denies              │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Request System Audio Access         │
      │  - macOS Screen Recording permission │
      │  - Needed for system audio capture   │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Request Notification Permission     │
      │  - Show desktop notifications        │
      │  - Optional but recommended          │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  User clicks "Complete Setup"        │
      │  → invoke('complete_onboarding')     │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Rust Command Execution:             │
      │  1. Save model config to SQLite      │
      │  2. Mark onboarding completed        │
      │  3. Save user email to status        │
      └──────────────────────────────────────┘
                          │
                          ▼
      ┌──────────────────────────────────────┐
      │  Frontend: onComplete() callback     │
      │  → window.location.reload()          │
      └──────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   MAIN APP LOADS               │
         │   (Onboarding hidden)          │
         └────────────────────────────────┘
```

### Onboarding State Transitions

```
State: NOT_STARTED
  │
  ├─▶ User logs in for first time
  │
  ▼
State: IN_PROGRESS (Step 3)
  │
  ├─▶ Downloading models...
  │   ├─ Parakeet: 0% → 50% → 100%
  │   └─ Gemma: 0% → 50% → 100%
  │
  ▼
State: IN_PROGRESS (Step 4)
  │
  ├─▶ Requesting permissions...
  │   ├─ Microphone: Pending → Granted
  │   ├─ System Audio: Pending → Granted
  │   └─ Notifications: Pending → Granted
  │
  ▼
State: COMPLETING
  │
  ├─▶ Saving config to database
  ├─▶ Marking as complete
  │
  ▼
State: COMPLETED
  │
  ├─▶ Onboarding hidden
  └─▶ Main app ready
```

---

## Session Management

### Session Lifecycle

```
┌──────────────────────────────────────────────────────┐
│                  SESSION CREATED                      │
│         (After successful authentication)             │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
      ┌───────────────────────────────────┐
      │  Save to tauri-plugin-store       │
      │  Location: $APPDATA/store.json    │
      │  Content:                         │
      │    - session_id                   │
      │    - access_token                 │
      │    - refresh_token                │
      │    - expires_at                   │
      └───────────────────────────────────┘
                          │
                          ▼
      ┌───────────────────────────────────┐
      │  Session Active                   │
      │  - Valid for 7 days (default)     │
      │  - Auto-refresh on API calls      │
      └───────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
      ┌──────────┐              ┌──────────────┐
      │  Token   │              │  User        │
      │  Expires │              │  Signs Out   │
      └──────────┘              └──────────────┘
            │                           │
            ▼                           ▼
      ┌──────────────┐          ┌──────────────┐
      │  Auto-       │          │  Clear       │
      │  Refresh     │          │  Session     │
      │  (Clerk SDK) │          │  from Store  │
      └──────────────┘          └──────────────┘
            │                           │
            ▼                           ▼
      ┌──────────────┐          ┌──────────────┐
      │  New Token   │          │  Return to   │
      │  Saved       │          │  Login       │
      └──────────────┘          └──────────────┘
            │
            └──────────────┐
                           ▼
      ┌───────────────────────────────────┐
      │  Session Continues                │
      │  (Transparent to user)            │
      └───────────────────────────────────┘
```

---

## Window State Diagram

### Possible Window States

```
┌─────────────────────────────────────────────────────────────┐
│                    WINDOW STATES                             │
└─────────────────────────────────────────────────────────────┘

STATE 1: Initial Launch
┌──────────────┐       ┌──────────────┐
│    Login     │       │     Main     │
│   (Visible)  │       │   (Hidden)   │
└──────────────┘       └──────────────┘

STATE 2: After Login
┌──────────────┐       ┌──────────────┐
│    Login     │  →    │     Main     │
│   (Closing)  │       │  (Showing)   │
└──────────────┘       └──────────────┘

STATE 3: Onboarding Active
┌──────────────┐       ┌──────────────────────┐
│    Login     │       │        Main          │
│   (Closed)   │       │  (Onboarding View)   │
└──────────────┘       └──────────────────────┘

STATE 4: Main App Running
┌──────────────┐       ┌──────────────┐
│    Login     │       │     Main     │
│   (Closed)   │       │   (Active)   │
└──────────────┘       └──────────────┘

STATE 5: Sign Out
┌──────────────┐       ┌──────────────┐
│    Login     │  ←    │     Main     │
│  (Opening)   │       │   (Closing)  │
└──────────────┘       └──────────────┘
```

### Window Transition Rules

```
Transition: LOGIN → MAIN
  Trigger: invoke('handle_login_success')
  Steps:
    1. main_window.show()
    2. main_window.set_focus()
    3. login_window.close()

Transition: MAIN → LOGIN (Sign Out)
  Trigger: invoke('handle_sign_out')
  Steps:
    1. Create or get login_window
    2. login_window.show()
    3. login_window.set_focus()
    4. main_window.close()

Transition: ONBOARDING → MAIN APP
  Trigger: Onboarding completion
  Steps:
    1. Save onboarding status
    2. window.location.reload()
    3. Layout checks status
    4. Hides onboarding, shows app
```

---

## Error Paths

### Failed Login

```
User attempts login
       │
       ▼
OAuth fails (network error, user cancels, etc.)
       │
       ▼
Clerk shows error message
       │
       ▼
User remains on login window
       │
       └─▶ Can retry login
```

### Failed Onboarding

```
User in onboarding (Step 3)
       │
       ▼
Model download fails
       │
       ▼
Show error toast
       │
       ▼
Provide "Retry" button
       │
       ├─▶ Success → Continue to Step 4
       └─▶ Fail → User can close app and retry later
               (Onboarding state preserved)
```

### Session Expired During Use

```
User using app
       │
       ▼
Token expires (after 7 days, or manual revocation)
       │
       ▼
Clerk detects on next API call
       │
       ├─▶ Refresh succeeds → Continue normally
       │
       └─▶ Refresh fails → Clerk logs out
                │
                ▼
           Show login window
```

---

## Performance Metrics

### Typical Timing

```
Event                          Time from Launch    Duration
──────────────────────────────────────────────────────────────
App Launch                     0ms                 -
Clerk Init Start               200ms               -
Clerk Init Complete            500ms               300ms
Session Check                  550ms               50ms
Login UI Render                600ms               50ms
User Clicks Sign In            10s                 -
OAuth Complete                 16s                 6s
Window Switch                  17s                 1s
Onboarding Renders             17.5s               500ms
Model Download Start           18s                 -
Parakeet Download Complete     40s                 22s
Gemma Download Complete        3min                2min 20s
Permissions Complete           3min 30s            30s
Onboarding Complete            3min 31s            1s
Main App Ready                 3min 32s            1s

Total Time to Productivity: ~3-4 minutes (first-time users)
Returning Users: ~1-2 seconds (cached session)
```

---

## State Persistence

### What Gets Saved

```
Component                Storage Location            Persists After
──────────────────────────────────────────────────────────────────────
Clerk Session           tauri-plugin-store          App restart
Onboarding Status       tauri-plugin-store          App restart
Model Config            SQLite Database             App restart
User Settings           SQLite Database             App restart
Meeting Data            SQLite Database             App restart
Downloaded Models       File System                 App restart
```

---

For implementation details:
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - How to integrate
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - Command reference

---

**Last Updated**: February 2026
