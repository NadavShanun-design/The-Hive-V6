# Vibe-Coder Disk Usage & File Size Breakdown

## Complete Directory Structure with Sizes

### Root Level
```
/path/to/hive/
├── client/                          71M  ⚠️ BLOATED (66% is node_modules)
├── node_modules/                    66M  ⚠️ CRITICAL (62MB is node-pty)
├── server/                          4.2M
├── agent-workspaces/                11M  ⚠️ 5x 2.1M duplicate modules
├── agent-memory/                    72K  ✓ OK
├── public/                          20K  ✓ OK
├── last-prompt/                     12K  ✓ OK
├── shared-workspace/                88K  ✓ OK
├── Documentation files              ~100K ✓ OK
├── *.js files (server, memory-cli)  ~20K ✓ OK
└── package-lock.json                32K  ✓ OK

TOTAL: ~170MB
```

---

## Detailed Breakdown by Directory

### 1. Client Directory (71MB)

#### /client/node_modules (71MB) - MAIN PROBLEM
```
/client/node_modules/
├── @esbuild/                        9.9M  🔴 Build tool - REMOVE
├── @babel/                          9.9M  🔴 Build tool - REMOVE
├── react-dom/                       7.1M  🟢 Keep (runtime)
├── zod/                             6.0M  🔴 UNUSED - REMOVE (see npm why)
├── eslint-plugin-react-hooks/       4.1M  🔴 Dev tool - REMOVE
├── caniuse-lite/                    4.1M  🔴 Build tool - REMOVE
├── eslint/                          3.8M  🔴 Build tool - REMOVE
├── rollup/                          2.7M  🔴 Build tool - REMOVE
├── vite/                            2.2M  🔴 Build tool - REMOVE
├── @rollup/                         1.7M  🔴 Build tool - REMOVE
├── @eslint/                         1.6M  🔴 Build tool - REMOVE
├── csstype/                         1.2M  🔴 Dev tool - REMOVE
├── hermes-parser/                   1.1M  🔴 Build tool - REMOVE
├── esquery/                         1.1M  🔴 Build tool - REMOVE
├── ajv/                             1.1M  🔴 Build tool - REMOVE
├── @eslint-community/               1.0M  🔴 Build tool - REMOVE
└── [Other small packages]           <100K each

BUILD TOOLS SUBTOTAL: 47MB (66% of node_modules!)
SHOULD KEEP ONLY:
  - react: ~8K
  - react-dom: 7.1M
  TOTAL RUNTIME: ~7.1M (10% of current)
```

#### /client/src (25K) - GOOD
```
/client/src/
├── App.jsx              9.5K  📝 Main React component
├── App.css              7.0K  📝 Styles
├── index.css            1.1K  📝 Global styles
├── main.jsx             229B  📝 Entry point
└── assets/
    └── react.svg        4.0K  📝 Logo
TOTAL: 25K ✓ GOOD
```

#### /client/dist (212K) - GOOD (Production Build)
```
/client/dist/
├── assets/
│   ├── index-58ImGOgQ.js         194K  📦 JavaScript bundle
│   ├── index-t6Gvj10g.css        6.2K  📦 CSS bundle
│   └── [other assets]            2K
├── index.html                     453B  📄 HTML entry
└── vite.svg                       1.5K  🖼️ Asset

TOTAL: 212K ✓ GOOD - NO OPTIMIZATION NEEDED
```

#### /client/.vercel (4K)
Vercel deployment config - negligible

---

### 2. Root node_modules (66MB) - CRITICAL

```
/node_modules/
├── node-pty/                      62M   🔴 CRITICAL - Native bindings
│   ├── build/                     ~30MB (Multiple platform binaries)
│   ├── lib/                       ~5MB
│   ├── node_modules/              ~27MB (Dependencies)
│
├── express/                       256K  🟢 Needed for server
├── ws/                            192K  🟢 Needed for WebSocket
├── Other packages                 ~3.7M 🟢 Various dependencies

TOTAL: 66M
ACTION: npm install --omit=optional for production
```

**node-pty Analysis:**
- Contains pre-built binaries for:
  - Darwin (macOS): 10MB
  - Linux: 10MB
  - Windows: 10MB
  - Plus source: 5MB
  - Plus node_modules: 27MB

Only need the Darwin binary for production deployment.

---

### 3. Server Directory (4.2M)

```
/server/
├── node_modules/                  4.1M  🔴 Duplicate of root modules
│   ├── iconv-lite/                400K
│   ├── qs/                        336K
│   ├── uuid/                      312K
│   ├── mime-db/                   236K
│   ├── ws/                        192K
│   └── [other]                    ~2.6M
├── package.json                   463B
├── package-lock.json              32K
├── claude-agent-manager.js        12K
├── agents.js                      12K
├── real-agents-server.js          8K
├── index.js                       3.9K

TOTAL: 4.2M
ACTION: Share with root node_modules via workspaces
```

---

### 4. Agent Workspaces (11M)

```
/agent-workspaces/
├── master/                        2.1M
│   ├── node_modules/              2.1M  🔴 DUPLICATE
│   └── [source files]             <10K
├── coder/                         2.1M
│   ├── node_modules/              2.1M  🔴 DUPLICATE
│   └── [source files]             <10K
├── researcher/                    2.1M
│   ├── node_modules/              2.1M  🔴 DUPLICATE
│   └── [source files]             <10K
├── tester/                        2.1M
│   ├── node_modules/              2.1M  🔴 DUPLICATE
│   └── [source files]             <10K
└── file_manager/                  2.1M
    ├── node_modules/              2.1M  🔴 DUPLICATE
    └── [source files]             <10K

TOTAL: 11M (All same 2.1M duplicated 5x!)
ACTION: Share single node_modules via npm workspaces
SAVINGS: ~8.4M (save 4 of the 5 copies)
```

---

### 5. Agent Memory (72K) - GOOD

```
/agent-memory/
├── master/
│   ├── prompt-history.json        8.6K
│   ├── memory-summary.md          ~200B
│   └── context.json               ~300B
├── tester/
│   ├── prompt-history.json        5.7K
│   └── [metadata]                 ~500B
├── researcher/
│   ├── prompt-history.json        1.8K
│   └── [metadata]                 ~500B
├── coder/
│   ├── prompt-history.json        1.7K
│   └── [metadata]                 ~500B
└── file_manager/
    ├── prompt-history.json        538B
    └── [metadata]                 ~400B

TOTAL: 72K ✓ GOOD - Well managed
MAX: 1000 prompts per agent (line 72-74 memory-manager.js)
```

---

### 6. Static Assets (20K) - GOOD

```
/public/
└── vite.svg                       1.5K  ✓ OK

Documentation (negligible):
- *.md files                       ~100K (documentation, not runtime)
```

---

## File Size Summary Table

| Location | Size | Type | Priority | Action |
|----------|------|------|----------|--------|
| node_modules/node-pty | 62M | Native binary | HIGH | --omit=optional |
| client/node_modules (build tools) | 47M | Dev tools | HIGH | --omit=dev |
| client/node_modules/zod | 6M | Unused | HIGH | npm uninstall |
| agent-workspaces/*/node_modules | 10.5M | Duplicate | HIGH | npm workspaces |
| server/node_modules | 4.1M | Duplicate | HIGH | npm workspaces |
| client/src + dist | 237K | Source/Build | KEEP | No changes |
| agent-memory | 72K | Runtime data | KEEP | Good |
| Documentation | ~100K | Not runtime | REMOVE | Delete for production |

---

## Production Optimization Target

### Current State
```
Total: 170MB
  - node_modules: 137MB (81%)
  - Other: 33MB (19%)
```

### Target State
```
Total: 70MB (59% reduction)
  - node_modules: 40MB (57%)
    - express deps: 1.5M
    - ws deps: 0.5M
    - node-pty (darwin only): 15M
    - node-addon-api: 0.4M
  - Built client (dist): 0.2M
  - Source files: 5M
  - agent-memory: 72K
  - Documentation: REMOVED

BREAKDOWN:
- Root needed: 20M (express + ws + minimal deps)
- node-pty (optimized): 15M
- client/dist: 0.2M
- Source: 5M
- Data: 1M
= 41M minimum viable
```

---

## Specific File Paths for Quick Reference

### Files to Remove for Production
```
/path/to/hive/client/node_modules/.bin/*
/path/to/hive/client/node_modules/@esbuild/
/path/to/hive/client/node_modules/@babel/
/path/to/hive/client/node_modules/eslint/
/path/to/hive/client/node_modules/vite/
/path/to/hive/client/node_modules/rollup/
/path/to/hive/client/node_modules/zod/
/path/to/hive/server/node_modules/  (duplicate)
/path/to/hive/agent-workspaces/*/node_modules/  (duplicates)
```

### Files to Keep
```
/path/to/hive/node_modules/node-pty/
/path/to/hive/node_modules/express/
/path/to/hive/node_modules/ws/
/path/to/hive/client/dist/
/path/to/hive/agent-memory/
/path/to/hive/server.js
/path/to/hive/memory-manager.js
```

### Critical Code Files with Issues
```
/path/to/hive/server.js:230
  - setInterval polling (should use fs.watch)

/path/to/hive/server.js:284
  - Always-on pty.spawn (should be on-demand)

/path/to/hive/client/src/App.jsx:270
  - key={index} (should be key={msg.id})

/path/to/hive/client/vite.config.js
  - Missing build optimizations
```

