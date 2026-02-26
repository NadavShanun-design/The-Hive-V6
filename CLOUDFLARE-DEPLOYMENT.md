# Cloudflare Deployment Guide for THE HIVE

This guide walks you through deploying THE HIVE with Cloudflare Pages (frontend) and Cloudflare Tunnel (secure access to local terminal server).

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│               CLOUDFLARE GLOBAL NETWORK                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Cloudflare Pages (Frontend - hive.html + hive.js)    │    │
│  │  Deployed to 300+ edge locations globally             │    │
│  │  URL: https://the-hive.pages.dev                      │    │
│  └───────────────────────┬────────────────────────────────┘    │
│                          │ WebSocket                            │
│  ┌───────────────────────▼────────────────────────────────┐    │
│  │  Cloudflare Tunnel (secure encrypted tunnel)          │    │
│  │  URL: https://hive.yourdomain.com                      │    │
│  └───────────────────────┬────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTPS/WSS Tunnel
┌────────────────────────────▼─────────────────────────────────────┐
│                   YOUR LOCAL MACHINE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ THE HIVE Server (Node.js)                                │  │
│  │ - 6 terminal sessions (node-pty)                         │  │
│  │ - Claude Code CLI in each terminal                       │  │
│  │ - OpenClaw gateway (MOLTBOT)                             │  │
│  │ - Listens on localhost:3002                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Frontend served from Cloudflare's global CDN (fast loading anywhere)
- ✅ Terminals run locally (full file system access, Claude CLI)
- ✅ Secure encrypted tunnel (no port forwarding, no exposed IP)
- ✅ Custom domain support
- ✅ Free tier available

---

## Part 1: Deploy Frontend to Cloudflare Pages

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare.

### Step 3: Deploy to Pages

```bash
cd /your-home/path/to/hive

# Deploy the public directory to Cloudflare Pages
wrangler pages deploy public --project-name=the-hive
```

**Output:**
```
✨ Successfully created the 'the-hive' project.
🌍  Deploying...
✨ Success! Deployed to https://the-hive-xxx.pages.dev
```

### Step 4: Configure Custom Domain (Optional)

If you have a domain (e.g., `yourdomain.com`):

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Select your Pages project: **the-hive**
3. Go to **Custom domains**
4. Click **Set up a custom domain**
5. Enter: `hive.yourdomain.com`
6. Cloudflare automatically configures DNS

Now your frontend is at: `https://hive.yourdomain.com`

### Step 5: Update WebSocket URL

Since the frontend is now on Cloudflare, but the terminal server is still local, we need to update the WebSocket URL.

**Edit `public/hive.js`:**

```javascript
// Change this line:
const WS_URL = window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;

// To this (replace with your tunnel URL - see Part 2):
const WS_URL = 'wss://hive-tunnel.yourdomain.com';
```

**Re-deploy:**
```bash
wrangler pages deploy public --project-name=the-hive
```

---

## Part 2: Set Up Cloudflare Tunnel (Terminal Server)

### Step 1: Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

**Windows:**
Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Step 2: Authenticate cloudflared

```bash
cloudflared tunnel login
```

This opens your browser. Select the domain you want to use for the tunnel.

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create the-hive-tunnel
```

**Output:**
```
Tunnel credentials written to /your-home/.cloudflared/<UUID>.json
Created tunnel the-hive-tunnel with id <UUID>
```

**Save the UUID!** You'll need it next.

### Step 4: Configure the Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /your-home/.cloudflared/<UUID>.json

ingress:
  # Route hive-tunnel.yourdomain.com to local server
  - hostname: hive-tunnel.yourdomain.com
    service: http://localhost:3002

  # Catch-all rule (required)
  - service: http_status:404
```

Replace:
- `<YOUR_TUNNEL_UUID>` with the UUID from Step 3
- `hive-tunnel.yourdomain.com` with your desired subdomain

### Step 5: Route DNS

Tell Cloudflare to route traffic to your tunnel:

```bash
cloudflared tunnel route dns the-hive-tunnel hive-tunnel.yourdomain.com
```

**Output:**
```
Successfully routed hive-tunnel.yourdomain.com to tunnel the-hive-tunnel
```

### Step 6: Test the Tunnel

Start your local server:
```bash
npm run hive
```

In another terminal, start the tunnel:
```bash
cloudflared tunnel run the-hive-tunnel
```

**Output:**
```
2026-02-04T10:00:00Z INF Connection registered connIndex=0
2026-02-04T10:00:00Z INF Registered tunnel connection
```

### Step 7: Test the Connection

Open your browser:
```
https://hive-tunnel.yourdomain.com
```

You should see THE HIVE dashboard!

---

## Part 3: Update Frontend to Use Tunnel

Now that the tunnel is working, update the frontend to connect to it.

### Option 1: Hardcode the Tunnel URL

**Edit `public/hive.js`:**

```javascript
const WS_URL = 'wss://hive-tunnel.yourdomain.com';
```

Re-deploy:
```bash
wrangler pages deploy public --project-name=the-hive
```

### Option 2: Environment Variable (Better)

Use environment variables to configure the WebSocket URL at build time.

**Create `public/_headers`:**
```
/*
  X-Robots-Tag: noindex
  X-Content-Type-Options: nosniff
```

**Create `public/_env.js`:**
```javascript
window.ENV = {
  WS_URL: 'wss://hive-tunnel.yourdomain.com'
};
```

**Update `public/hive.html`:**
```html
<!-- Add before hive.js -->
<script src="_env.js"></script>
<script src="hive.js"></script>
```

**Update `public/hive.js`:**
```javascript
const WS_URL = window.ENV?.WS_URL || 'ws://localhost:3002';
```

Re-deploy:
```bash
wrangler pages deploy public --project-name=the-hive
```

---

## Part 4: Automate with Systemd (Linux) or LaunchAgent (macOS)

### macOS: Create a LaunchAgent

**Create `~/Library/LaunchAgents/com.thehive.tunnel.plist`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thehive.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>the-hive-tunnel</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/thehive-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/thehive-tunnel.error.log</string>
</dict>
</plist>
```

**Load the agent:**
```bash
launchctl load ~/Library/LaunchAgents/com.thehive.tunnel.plist
```

**Check status:**
```bash
launchctl list | grep thehive
```

### Linux: Create a Systemd Service

**Create `/etc/systemd/system/thehive-tunnel.service`:**

```ini
[Unit]
Description=Cloudflare Tunnel for THE HIVE
After=network.target

[Service]
Type=simple
User=yourusername
ExecStart=/usr/local/bin/cloudflared tunnel run the-hive-tunnel
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable thehive-tunnel
sudo systemctl start thehive-tunnel
sudo systemctl status thehive-tunnel
```

---

## Part 5: Start THE HIVE Server on Boot

### macOS LaunchAgent

**Create `~/Library/LaunchAgents/com.thehive.server.plist`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thehive.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/hive/server-hive.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/your-home/path/to/hive</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/thehive-server.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/thehive-server.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>3002</string>
        <key>ANTHROPIC_API_KEY</key>
        <string>YOUR_API_KEY_HERE</string>
    </dict>
</dict>
</plist>
```

**Load:**
```bash
launchctl load ~/Library/LaunchAgents/com.thehive.server.plist
```

### Linux Systemd Service

**Create `/etc/systemd/system/thehive-server.service`:**

```ini
[Unit]
Description=THE HIVE Terminal Server
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/your-home/path/to/hive
Environment="PORT=3002"
Environment="ANTHROPIC_API_KEY=YOUR_API_KEY_HERE"
ExecStart=/usr/bin/node /path/to/hive/server-hive.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable thehive-server
sudo systemctl start thehive-server
```

---

## Part 6: Verify Everything Works

### Checklist

- [ ] **Frontend deployed to Cloudflare Pages**: `https://the-hive-xxx.pages.dev`
- [ ] **Cloudflare Tunnel running**: `cloudflared tunnel run the-hive-tunnel`
- [ ] **THE HIVE server running**: `npm run hive`
- [ ] **OpenClaw gateway running** (optional): `./scripts/start-openclaw-gateway.sh`
- [ ] **DNS configured**: `hive-tunnel.yourdomain.com` points to tunnel
- [ ] **Frontend connects to tunnel**: Open Pages URL, terminals should connect

### Test Commands

```bash
# Check if tunnel is running
ps aux | grep cloudflared

# Check if server is running
ps aux | grep "node.*server-hive"

# Check if port 3002 is listening
lsof -i :3002

# Check tunnel logs
tail -f /tmp/thehive-tunnel.log

# Check server logs
tail -f /tmp/thehive-server.log
```

### Test WebSocket Connection

Open browser console on your Cloudflare Pages URL:

```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://hive-tunnel.yourdomain.com?agent=project1-master');

ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (err) => console.error('❌ Error:', err);
ws.onclose = () => console.log('🔌 Disconnected');
```

---

## 🎛️ Environment Variables for Production

**Create `.env` on your local server:**

```bash
# Server
PORT=3002
NODE_ENV=production

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# OpenClaw (optional)
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_URL=https://hive-tunnel.yourdomain.com
```

**Important:** Never commit `.env` to git!

---

## 🔐 Security Best Practices

1. **API Keys:**
   - Store in environment variables
   - Use `.env` file (never commit)
   - Rotate keys periodically

2. **Cloudflare Tunnel:**
   - Already encrypted (TLS)
   - No exposed ports
   - Cloudflare handles authentication

3. **Terminal Access:**
   - Agents have full shell access
   - Restrict to trusted users only
   - Monitor command history

4. **HTTPS Only:**
   - Always use `wss://` not `ws://`
   - Frontend auto-redirects to HTTPS

---

## 📊 Monitoring

### Check Tunnel Health

```bash
cloudflared tunnel info the-hive-tunnel
```

### View Tunnel Logs

```bash
tail -f ~/.cloudflared/tunnel.log
```

### View Server Logs

```bash
tail -f /tmp/thehive-server.log
```

### Cloudflare Analytics

Go to: https://dash.cloudflare.com

- **Pages**: Analytics → THE HIVE project
- **Tunnel**: Zero Trust → Tunnels → the-hive-tunnel

---

## 🐛 Troubleshooting

### Issue: "Tunnel not connecting"

**Check if cloudflared is running:**
```bash
ps aux | grep cloudflared
```

**Restart tunnel:**
```bash
cloudflared tunnel run the-hive-tunnel
```

### Issue: "WebSocket connection failed"

**Check server is running:**
```bash
lsof -i :3002
```

**Test direct connection:**
```bash
curl http://localhost:3002
```

**Check tunnel config:**
```bash
cat ~/.cloudflared/config.yml
```

### Issue: "502 Bad Gateway"

**Cause:** Server is not running or tunnel config is wrong

**Solution:**
1. Start server: `npm run hive`
2. Check tunnel routes to correct port: `localhost:3002`
3. Restart tunnel

### Issue: "DNS not resolving"

**Check DNS:**
```bash
nslookup hive-tunnel.yourdomain.com
```

**Re-route DNS:**
```bash
cloudflared tunnel route dns the-hive-tunnel hive-tunnel.yourdomain.com
```

---

## 💰 Cost Estimates

### Cloudflare Pages (Frontend)

**Free Tier:**
- Unlimited requests
- 500 builds/month
- Custom domain included

**Paid ($20/mo):**
- More builds
- Advanced features

### Cloudflare Tunnel (Terminal Server)

**Free Tier:**
- Unlimited bandwidth
- All features included

**Paid (optional):**
- Zero Trust features ($7/user/mo)
- Advanced security

### Local Server

**Free:**
- Runs on your machine
- No cloud compute costs

**Estimated Total: $0/mo** (if using free tiers)

---

## 🚀 Next Steps

1. ✅ Deploy frontend to Cloudflare Pages
2. ✅ Set up Cloudflare Tunnel
3. ✅ Configure custom domain
4. ✅ Start server and tunnel on boot
5. 📖 Read HIVE-README.md for usage
6. 🦞 Set up OpenClaw (optional)
7. 🎨 Customize the UI
8. 📊 Monitor performance

---

## 📚 Additional Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **OpenClaw**: https://github.com/openclaw/openclaw

---

**🐝 THE HIVE - Now globally distributed!**
