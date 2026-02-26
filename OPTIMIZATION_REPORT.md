# Vibe-Coder Performance & Size Optimization Report

## Executive Summary
The Vibe-Coder application is bloated primarily due to **build tools and dev dependencies** that shouldn't be included in production. The actual runtime dependencies are lean, but toolchain packages (ESLint, Vite, Babel) consume 47MB of the 71MB client directory.

---

## 1. LARGE FILES & DISK SPACE ANALYSIS

### Total Disk Usage Breakdown:
- **Client directory**: 71M (68MB+ from node_modules)
- **Root node_modules**: 66M (primarily node-pty)
- **Server directory**: 4.2M (includes redundant node_modules)
- **Agent workspaces**: 11M (5x 2.1MB node_modules)
- **Total project size**: ~170MB+

### Critical Problem: node-pty (62MB in root node_modules)
```
/path/to/hive/node_modules/node-pty: 62M
```
**Analysis**: node-pty includes native bindings for multiple platforms (win32, linux, darwin, etc.) compiled binaries.

**Issue**: This is a native module with compiled binaries that bloats the installation
- Contains platform-specific builds even though you likely only need macOS
- Default npm install gets all platform variants

**Optimization**: 
- Use `npm install --omit=optional` to skip optional dependencies if not needed for PTY
- Consider using only the binaries for your target platform
- Alternatively, use `npm prune --production` to remove after development

---

## 2. HEAVY DEPENDENCIES ANALYSIS

### Client Build Tools (47MB of 71MB = 66% of size)
Located in `/path/to/hive/client/node_modules`:

| Dependency | Size | Status | Recommendation |
|------------|------|--------|-----------------|
| @esbuild | 9.9M | Dev Tool | Remove from production |
| @babel | 9.9M | Dev Tool | Remove from production |
| react-dom | 7.1M | Runtime | Keep |
| zod | 6.0M | ⚠️ UNUSED | Remove - not imported anywhere |
| eslint-plugin-react-hooks | 4.1M | Dev Tool | Remove from production |
| caniuse-lite | 4.1M | Dev Tool | Remove from production |
| eslint | 3.8M | Dev Tool | Remove from production |
| rollup | 2.7M | Build Tool | Remove from production |
| vite | 2.2M | Build Tool | Remove from production |
| @rollup | 1.7M | Build Tool | Remove from production |
| @eslint | 1.6M | Dev Tool | Remove from production |
| csstype | 1.2M | Dev Dependency | Remove from production |
| hermes-parser | 1.1M | Dev Tool | Remove from production |
| esquery | 1.1M | Dev Tool | Remove from production |
| ajv | 1.1M | Dev Tool | Remove from production |

**Total Build Tools**: ~47MB (2/3 of client size)

**CRITICAL FINDING - ZOD Library (6MB)**:
```bash
/path/to/hive/client/node_modules/zod: 6.0M
```
- **Not used** in the codebase at all
- Not listed in package.json dependencies
- Appears to be a transitive dependency of an unused package
- Pure waste of 6MB

**Action Required**: 
```bash
# Run npm audit and find what's pulling in zod
npm why zod

# Then remove the package that depends on it
npm uninstall <problematic-package>
```

---

## 3. BUNDLED RESOURCES & OPTIMIZATION OPPORTUNITIES

### Production Bundle Size: 212KB (GOOD)
```
/path/to/hive/client/dist: 212K
  - index-58ImGOgQ.js: 194K (JavaScript)
  - index-t6Gvj10g.css: 6.2K (CSS)
  - vite.svg: 1.5K
  - index.html: 453B
```

**Status**: Production bundle is actually well-optimized.

### Vite Configuration - Missing Optimizations
File: `/path/to/hive/client/vite.config.js`

Current config is minimal:
```javascript
export default defineConfig({
  plugins: [react()],
})
```

**Recommendations**:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React into its own chunk
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    minify: 'terser', // Already default but ensure it's on
    sourcemap: false,  // Don't include source maps in production
  },
  // Remove source maps in production
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
```

---

## 4. BACKGROUND PROCESSES & MEMORY USAGE

### Active Watchers (server.js, line 230)
```javascript
const watcher = setInterval(() => {
    // Checks every 2 seconds for command files
    const files = fs.readdirSync(inboxDir);
    const commandFiles = files.filter(f => f.startsWith('__command_'));
    // ... process commands
}, 2000);
```

**Issue**: A setInterval polling for file changes every 2 seconds
- Not performance-critical but not ideal
- Creates 5 watcher instances (one per agent workspace)
- Reads file system 30 times per minute per agent

**Optimization**: 
```javascript
// Use fs.watch or fs.watchFile instead
fs.watch(inboxDir, (eventType, filename) => {
    if (filename.startsWith('__command_')) {
        // Process command
    }
});
// Much more efficient and event-driven
```

### Terminal Sessions (pty.spawn)
Each WebSocket connection spawns a real shell process via node-pty:
```javascript
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 120,
    rows: 30,
    cwd: process.cwd(),
    env: env
});
```

**Issue**: Each agent maintains a persistent shell - 5 agents = 5 shell processes always running
- Each shell process uses ~20-50MB of RAM
- Total baseline: ~100-250MB for shell processes alone

**Memory impact**:
- 5 bash/zsh processes: ~5 × 30MB = 150MB
- Node.js process: ~80MB
- WebSocket memory overhead: ~20MB
- React app: ~15-20MB

**Total estimated RAM**: 250-400MB minimum

**Optimization recommendations**:
1. Spawn shells on-demand, not always-on
2. Implement shell session timeout and termination
3. Limit concurrent active sessions to 2-3 max

---

## 5. REDUNDANT NODE_MODULES

### Multiple Copies of node_modules:
```
/path/to/hive/node_modules: 66M          (root)
/path/to/hive/client/node_modules: 71M   (client)
/path/to/hive/server/node_modules: 4.1M  (server)
/agent-workspaces/*/node_modules: 2.1M × 5                         (agents)
```

**Total redundant modules**: ~130M+ duplicated packages

**Each agent workspace** unnecessarily has its own node_modules (2.1M each):
- master: 2.1M
- coder: 2.1M  
- researcher: 2.1M
- tester: 2.1M
- file_manager: 2.1M
- **Total**: 10.5M wasted (could be shared)

**Recommendation**: Use workspace structure or symlinks
```json
{
  "workspaces": [
    "client",
    "server",
    "agent-workspaces/*"
  ]
}
```

This would:
- Reduce total install to ~80M (vs current 170M+)
- Share common dependencies
- Speed up installations
- Reduce disk I/O

---

## 6. WEBVIEW & RENDERER PROCESS CONFIGURATION

### App.jsx Analysis
File: `/path/to/hive/client/src/App.jsx`

**Memory Concerns**:

1. **Message Buffer** (Line 38-41):
```javascript
setMessages(prev => {
  const newMessages = [...prev, ...data.data]
  return newMessages.slice(-100)  // Only keeps last 100
})
```
- Keeps last 100 messages in React state
- Each message is a full object with content and metadata
- Estimated: ~2-5MB for 100 messages

2. **WebSocket Connection** (Line 17-18):
```javascript
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
const ws = new WebSocket(wsUrl)
```
- Maintains persistent WebSocket connection
- Continuous stream of agent status updates
- No backpressure handling visible

3. **Unoptimized Rendering** (Line 270-290):
```javascript
messages.map((msg, index) => (
  <div key={index} className={`message ${msg.type}`}>  // ⚠️ Bad: using array index
    // ... renders full message content
  </div>
))
```

**Issues**:
- Uses array index as key (causes re-renders on insertion)
- Renders 100+ DOM nodes even if not visible
- No virtualization for scrolling performance

**Optimizations**:

```javascript
// 1. Use unique message IDs, not array indices
<div key={msg.id} className={`message ${msg.type}`}>

// 2. Implement virtualization for long message lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style} key={messages[index].id}>
      {/* render message */}
    </div>
  )}
</FixedSizeList>

// 3. Debounce WebSocket message handling
const [messageBuffer, setMessageBuffer] = useState([]);

useEffect(() => {
  const timer = setTimeout(() => {
    setMessages(prev => [...prev, ...messageBuffer].slice(-100));
    setMessageBuffer([]);
  }, 500);
  
  return () => clearTimeout(timer);
}, [messageBuffer]);
```

---

## 7. MEMORY-RELATED ISSUES

### Unbounded Promise Accumulation
File: `/path/to/hive/agent-memory/*/prompt-history.json`

Current approach: Keeps up to 1000 prompts in memory (memory-manager.js, line 72-74)
```javascript
if (history.length > 1000) {
  history.shift();
}
```

**Issue**: 
- At 1000 prompts × 1000 bytes each = 1MB per agent
- But they're ALL loaded into memory for every query
- 5 agents = 5MB of prompt history always in RAM

**Data sizes**:
- master/prompt-history.json: 8.6K
- tester/prompt-history.json: 5.7K
- researcher/prompt-history.json: 1.8K
- coder/prompt-history.json: 1.7K
- file_manager/prompt-history.json: 538B

**Recommendation**: 
- Implement database (SQLite) instead of JSON
- Load only recent 50 prompts
- Use pagination for history queries
- Archive old prompts to disk

---

## OPTIMIZATION PRIORITY & ACTION PLAN

### HIGH PRIORITY (Do First - Easy Wins)

1. **Remove Build Tools from Production** - 47MB savings
   ```bash
   cd client
   npm install --omit=dev
   rm -rf node_modules/.bin
   npm prune --production
   ```
   **Impact**: -47MB, no functionality loss

2. **Remove Zod Dependency** - 6MB savings
   ```bash
   npm why zod  # Find what depends on it
   npm uninstall <package>
   ```
   **Impact**: -6MB, fix unused dependency

3. **Consolidate node_modules** - 90MB savings
   Use npm workspaces to prevent duplication
   **Impact**: -90MB disk, faster installs

4. **Move Polling to File Watch** (server.js, line 230)
   ```bash
   # RAM: -5-10MB
   # CPU: -30% polling overhead
   ```
   **Impact**: Lower CPU, immediate responsiveness

### MEDIUM PRIORITY (Do Next - Good Impact)

5. **Implement Shell Session Pooling** - 150-200MB RAM savings
   - Keep only 2 shells active instead of 5
   - Spawn on-demand with timeout cleanup
   **Impact**: -150MB RAM baseline

6. **Virtualize Message List** - 20-30MB RAM savings
   - Render only visible messages
   - Fix key prop warnings
   **Impact**: -20MB, smoother scrolling

7. **Optimize Vite Config** - 5-10% bundle reduction
   - Add code splitting
   - Disable source maps
   - Minify CSS
   **Impact**: -20KB bundle

### LOWER PRIORITY (Do Last - Diminishing Returns)

8. **Move to Database for Memory** - 2-5MB savings
   - SQLite for prompt history
   - Lazy load vs. all-in-memory
   **Impact**: -5MB, better scalability

9. **Implement Compression** for WebSocket
   - Compress message traffic
   **Impact**: Network optimization

10. **Remove Unused Assets**
    - Only vite.svg is unused (1.5K)
    **Impact**: -1.5K (negligible)

---

## SUMMARY TABLE

| Issue | Current | Optimized | Savings | Priority |
|-------|---------|-----------|---------|----------|
| Build tools in production | 47MB | 0MB | 47MB | HIGH |
| Unused Zod dependency | 6MB | 0MB | 6MB | HIGH |
| Duplicate node_modules | 130MB | 80MB | 50MB | HIGH |
| File polling watchers | 5 active | 1 event-based | 10MB RAM | MEDIUM |
| Always-on shells | 5×30MB | 2×30MB | 90MB RAM | MEDIUM |
| Message list rendering | 100 DOM nodes | virtualized | 20MB RAM | MEDIUM |
| Memory data all-loaded | 1000/agent | 50/agent | 2MB RAM | LOW |

---

## DEPLOYMENT RECOMMENDATIONS

### Production Build Checklist:

```bash
# 1. Remove all dev dependencies
npm install --omit=dev

# 2. Clean up node_modules
npm prune --production

# 3. Verify zod is gone
npm ls zod  # Should show nothing

# 4. Build client for production
cd client
npm run build

# 5. Check bundle size
du -sh dist/

# 6. Remove client node_modules (not needed at runtime)
rm -rf client/node_modules

# 7. Remove unused agent workspace node_modules
rm -rf agent-workspaces/*/node_modules

# 8. Keep only:
# - root node_modules (for server)
# - client/dist (built app)
# - server/ files
# - agent-memory/ and agent-workspaces/ (runtime)

# Expected final size: ~150MB -> 70MB (53% reduction)
```

### Production Docker Image:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN cd client && npm install && npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/*.js ./
COPY package*.json ./

# Expected final image: ~400MB (vs ~1GB without optimization)

EXPOSE 3002
CMD ["node", "server.js"]
```

---

## Monitoring & Testing

After optimizations, monitor:
- Memory usage (baseline should drop to ~300MB)
- Startup time (should improve with fewer watchers)
- Responsiveness (should improve with virtualized lists)
- WebSocket reconnection stability

Test:
- Spawn 100+ messages → check RAM and scroll performance
- Keep app running for 1 hour → check for memory leaks
- Toggle agent status updates → verify CPU usage
- Stress test with concurrent agent activity

