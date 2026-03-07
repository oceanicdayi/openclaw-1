# OpenClaw Installation Guide

> A step-by-step guide for installing and setting up the OpenClaw AI agent platform.

---

## 📋 Prerequisites

Before installing OpenClaw, make sure your system has the following:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | v20 or higher | [Download](https://nodejs.org/) |
| **npm** | v9 or higher | Bundled with Node.js |
| **Git** | v2.30 or higher | For workspace sync |
| **OS** | macOS / Linux / Windows (WSL2) | Windows requires WSL2 |

You will also need at least one **LLM API key** (at least one is required to use OpenClaw):

- [Anthropic API Key](https://console.anthropic.com/) — for Claude models **(recommended for best results)**
- [OpenAI API Key](https://platform.openai.com/) — for GPT models
- [Google AI API Key](https://aistudio.google.com/) — for Gemini models

> **Tip:** Start with an Anthropic API key. Claude models are the primary supported LLM for OpenClaw and offer the most reliable experience.

---

## 🚀 Installation

### Option 1: Install via npm (recommended)

```bash
npm install -g openclaw
```

Verify the installation:

```bash
openclaw --version
```

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/oceanicdayi/openclaw-1.git
cd openclaw-1

# Install dependencies
npm install

# Link CLI globally
npm link
```

---

## ⚙️ Initial Configuration

### Step 1: Initialize OpenClaw

Run the setup wizard to create the default configuration:

```bash
openclaw init
```

This creates the workspace directory at `~/.openclaw/` with the following structure:

```
~/.openclaw/
├── openclaw.json          # Main configuration file
├── workspace/
│   ├── AGENTS.md          # Agent behavior instructions
│   ├── SOUL.md            # Agent personality
│   ├── USER.md            # User profile
│   ├── MEMORY.md          # Long-term memory (main session only)
│   ├── HEARTBEAT.md       # Periodic task checklist
│   ├── TOOLS.md           # Tool usage notes
│   └── memory/            # Daily memory logs (YYYY-MM-DD.md)
├── credentials/           # Channel credentials (do NOT commit to Git)
└── identity/              # Auto-generated identity files
```

### Step 2: Set Up API Keys

Create a `.env` file or export environment variables in your shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
# LLM Providers (at least one required)
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...

# Optional: Additional providers
export MINIMAX_API_KEY=...
export ELEVENLABS_API_KEY=...   # For text-to-speech
```

Alternatively, you can place these in a `.env` file in your working directory:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### Step 3: Edit the Main Configuration

Open `~/.openclaw/openclaw.json` and customize:

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6",
    "thinking": "low",
    "verbose": false,
    "workspace": "~/.openclaw/workspace"
  },
  "gateway": {
    "bind": "127.0.0.1:18789",
    "auth": {
      "mode": "token",
      "token": "auto-generated"
    },
    "tailscale": {
      "mode": "off"
    }
  },
  "channels": {}
}
```

**Key settings:**

| Setting | Description | Example |
|---------|-------------|---------|
| `agent.model` | LLM model to use | `"anthropic/claude-opus-4-6"` |
| `agent.thinking` | Thinking depth (`low`/`medium`/`high`) | `"low"` |
| `gateway.bind` | Host and port for the gateway | `"127.0.0.1:18789"` |
| `gateway.tailscale.mode` | Remote access (`off`/`serve`/`funnel`) | `"off"` |

---

## 🌐 Starting the Gateway

Start the OpenClaw gateway server:

```bash
openclaw gateway start
```

The Web Control UI is available at: **http://localhost:18789**

Use the Web UI to:
- View and manage sessions
- Edit configuration
- Monitor channel status
- Manage connected devices

**Useful gateway commands:**

```bash
openclaw gateway start      # Start the gateway
openclaw gateway stop       # Stop the gateway
openclaw gateway restart    # Restart the gateway
openclaw status             # Check gateway status and context usage
```

---

## 💬 Setting Up Channels

OpenClaw supports connecting to multiple messaging platforms. Configure channels in `~/.openclaw/openclaw.json` under the `"channels"` key.

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the bot token.
2. Add the configuration:

```json
"channels": {
  "telegram": {
    "botToken": "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
    "allowFrom": ["@your_username"],
    "groups": {
      "*": {
        "requireMention": false
      }
    }
  }
}
```

3. Restart the channels:

```bash
openclaw channels restart telegram
```

### WhatsApp

1. Log in via QR code:

```bash
openclaw channels login whatsapp
```

2. Scan the QR code shown in your terminal with WhatsApp on your phone.
3. Add your phone number to the allowlist:

```json
"channels": {
  "whatsapp": {
    "allowFrom": ["+1234567890"]
  }
}
```

### Discord

1. Create a Discord application and bot at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Copy the bot token and your user/guild IDs.
3. Add the configuration:

```json
"channels": {
  "discord": {
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "allowFrom": ["your_user_id"],
    "guilds": ["your_guild_id"]
  }
}
```

4. Restart the channels:

```bash
openclaw channels restart discord
```

### Slack

```json
"channels": {
  "slack": {
    "botToken": "xoxb-...",
    "allowFrom": ["U012AB3CD"]
  }
}
```

---

## ✅ Verification

After setup, verify everything is working:

```bash
# Check gateway status
openclaw status

# Test the agent via CLI
openclaw chat "Hello, are you there?"
```

You should see a response from the AI agent in your terminal.

---

## 🔄 Updating OpenClaw

```bash
# Check for updates
openclaw update --dry-run

# Apply the update (automatically restarts the gateway)
openclaw update

# Switch release channel
openclaw update --channel beta   # Options: stable | beta | dev
```

---

## 🐳 Docker / Hugging Face Spaces Deployment

For deploying OpenClaw in a containerized or cloud environment, see:

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** — Hugging Face Spaces deployment with GitHub state sync

### Minimal Dockerfile example:

```dockerfile
FROM node:20

# Install OpenClaw
RUN npm install -g openclaw

# Copy workspace and config
COPY workspace/ /root/.openclaw/workspace/
COPY openclaw.json /root/.openclaw/openclaw.json

# Expose gateway port
EXPOSE 18789

CMD ["openclaw", "gateway", "start"]
```

---

## 🐛 Troubleshooting

### Gateway won't start

```bash
# Check if port 18789 is already in use
lsof -i :18789

# Try a different port in openclaw.json
# "gateway": { "bind": "127.0.0.1:18790" }
```

### API key errors

```bash
# Verify your keys are loaded
echo $ANTHROPIC_API_KEY

# Re-export if needed
source ~/.bashrc   # or ~/.zshrc
```

### Channel connection issues

```bash
# View channel logs
openclaw channels log telegram

# Re-login to a channel
openclaw channels login whatsapp
openclaw channels restart telegram
```

### Resetting configuration

```bash
# Backup and reset config
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
openclaw init --reset
```

---

## 📚 Next Steps

After a successful installation, you can:

- Customize your agent's personality in `~/.openclaw/workspace/SOUL.md`
- Set up your user profile in `~/.openclaw/workspace/USER.md`
- Configure periodic tasks in `~/.openclaw/workspace/HEARTBEAT.md`
- Install custom skills in `~/.openclaw/workspace/skills/`
- Enable remote access via Tailscale by setting `gateway.tailscale.mode` to `"serve"` or `"funnel"`

For architecture details and advanced configuration, see **[Structure.md](./Structure.md)**.
