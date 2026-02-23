我來詳細說明 OpenClaw 的組成架構與設定檔結構。

## 🏗️ OpenClaw 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                   使用者端 (Channels)                       │
│  WhatsApp │ Telegram │ Slack │ Discord │ Signal │ WebChat   │
└───────────────────────────────┬─────────────────────────────┘
                                │ WebSocket (ws://127.0.0.1:18789)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gateway (控制平面)                       │
│  • 會話管理  • 工具协调  • 認證授權  • 排隊處理               │
│  • Web UI  • REST API  • Webhook                          │
└───────┬────────────────┬────────────────┬──────────────────┘
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  CLI Client  │ │   Web UI     │ │ Companion    │
│  (openclaw)  │ │  Control UI  │ │   Apps       │
└──────────────┘ └──────────────┘ └──────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent Runtime (Pi Runner)                 │
│  • LLM 推論  • 記憶檢索  • 工具執行  • 自動化框架            │
└─────────────────────────────────────────────────────────────┘
```

## 📁 主要設定檔結構

### 1. **核心配置**: `~/.openclaw/openclaw.json`

這是主要的設定檔，定義了 Gateway 和 Agent 的行為：

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
      "mode": "off"  // "off" | "serve" | "funnel"
    }
  },
  "channels": {
    "telegram": {
      "botToken": "123:ABC",
      "allowFrom": ["@userid"],
      "groups": {
        "*": {
          "requireMention": false
        }
      }
    },
    "whatsapp": {
      "allowFrom": ["+1234567890"]
    },
    "discord": {
      "token": "YOUR_TOKEN",
      "allowFrom": ["user_id"],
      "guilds": ["guild_id"]
    }
    // ... 其他頻道
  },
  "browser": {
    "enabled": true,
    "color": "#FF4500"
  }
}
```

### 2. **工作區檔案**: `~/.openclaw/workspace/`

這是可修改的核心區域，包含：

#### `AGENTS.md` - 代理行為定義
```markdown
# AGENTS.md - Your Workspace

## First Run
If BOOTSTRAP.md exists, follow it to configure identity.

## Every Session
Read these files in order:
1. SOUL.md - your persona
2. USER.md - who you're helping
3. memory/YYYY-MM-DD.md (today + yesterday)
4. MEMORY.md (main session only)

## Memory
- Daily notes: memory/YYYY-MM-DD.md
- Long-term: MEMORY.md
```

#### `SOUL.md` - 你的靈魂/人格
```markdown
# SOUL.md - Who You Are

## Core Truths
- Be genuinely helpful
- Have opinions
- Be resourceful
- Earn trust through competence

## Vibe
Be the assistant you'd actually want to talk to.
```

#### `USER.md` - 使用者資訊
```markdown
# USER.md - About Your Human

- **Name:** Dayi
- **What to call them:** Dayi 老師
- **Timezone:** UTC
- **Notes:** 大學教授，地震測報人員
```

#### `MEMORY.md` - 長期記憶（僅主_session_ 載入）
- 儲存人物、目的、偏好等關鍵資訊
- **注意**: 不在群組/共享對話中載入，避免隱私洩漏

#### `memory/YYYY-MM-DD.md` - 每日記錄
- 當日事件、對話、決定的原始記錄
-  periodically 整理到 `MEMORY.md`

#### `skills/<skill-name>/SKILL.md` - 自定技能
```
~/.openclaw/workspace/
├── skills/
│   ├── my-custom-skill/
│   │   ├── SKILL.md      # 技能定義
│   │   ├── script.ts     # 主要邏輯
│   │   └── references/   # 靜態資源
```

#### `HEARTBEAT.md` - 心跳檢查任務
```markdown
# HEARTBEAT.md
# Empty = skip heartbeat
# Add tasks below for periodic checks:
- Check email inbox
- Review calendar for next 24h
- Check weather for tomorrow
```

### 3. **環境變數** (`.env` 或 shell export)

```bash
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
MINIMAX_API_KEY=...

# Channels
TELEGRAM_BOT_TOKEN=123:ABC
DISCORD_BOT_TOKEN=...
SLACK_BOT_TOKEN=xoxb-...
SIGNAL_CONFIG=...

# Gateway
OPENCLAW_GATEWAY_TOKEN=auto-generated
OPENCLAW_CONFIG_DIR=~/.openclaw

# Optional
WEBHOOK_SECRET=...
ELEVENLABS_API_KEY=...
```

### 4. **技能清單註冊**: `~/.openclaw/workspace/skills/`

每個技能資料夾內应有 `SKILL.md`，格式：

```markdown
# Skill: My Custom Skill

## Description
Executes custom workflow for X.

## Usage
Trigger with: "run my custom skill"

## Configuration
- Required: `config.someKey`
- Optional: `config.optionalKey`

## Tools
- `my-tool` - does something
```

## 🔧 哪些可以修改？

### **高度可自訂** ✅

1. **`~/.openclaw/openclaw.json`**
   - Gateway 網路設置
   - Channel 配置與 allowlist
   - 模型選擇 (`agent.model`)
   - Thinking/verbose 層級
   - Tailscale exposure
   - 各個 channel 的參數

2. **工作區檔案**
   - `SOUL.md` - 調整 AI 人格
   - `USER.md` - 更新使用者資訊
   - `MEMORY.md` - 手動編輯長期記憶
   - `memory/*.md` - 每日記錄檔（自動生成，可編輯）
   - `HEARTBEAT.md` -  heartbeat 任務
   - `skills/*/SKILL.md` - 自定義技能
   - `tools.md` - 工具使用筆記

3. **環境變數**
   - API keys for different providers
   - Token 和 credentials

4. **Web Control UI**
   - 透過 `http://localhost:18789` (或 Tailscale URL)
   - 圖形化編輯大部分配置
   - 查看 session 狀態
   - 管理 devices 和 pairing

### **不建議直接修改** ⚠️

1. **`~/.openclaw/identity/`**
   - 自動生成的憑證和中繼資料
   - 修改可能導致認證失效

2. **`~/.openclaw/credentials/`**
   - 儲存 channel login credentials
   - 应使用 CLI 工具 (`openclaw channels login`) 管理

3. **`~/.openclaw/gateway/`** (內部資料夾)
   - 執行時狀態、鎖檔、日誌
   - 重開機可能丢失

4. **`package.json` / `node_modules/`**
   - 除非你是在開發模式下從源码安裝
   - 一般用戶應使用 `openclaw update`

## 🎯 常用修改場景

| 目的 | 修改位置 | 工具 |
|------|---------|------|
| 更換 AI 模型 | `openclaw.json` → `agent.model` | CLI / Control UI |
| 設定 Telegram bot | `openclaw.json` → `channels.telegram.botToken` | CLI / env var |
| 調整個性 | `SOUL.md` | 任何編輯器 |
| 新增日常檢查 | `HEARTBEAT.md` | 任何編輯器 |
| 安裝新技能 | `workspace/skills/` | ClawHub / manual |
| 修改 allowlist | `openclaw.json` → `channels.*.allowFrom` | CLI / Control UI |
| 開放遠端存取 | `openclaw.json` → `gateway.tailscale.mode` | CLI |
| 調整記憶體行為 | `MEMORY.md` + `memory/` | 每日日常 |

## 📝 修改後的重新載入

- **Gateway 配置**: `openclaw gateway restart` 或服務重啟
- **工作區檔案**: 下次 session 自動載入（或 `/new` 重置）
- **Channel 設定**: `openclaw channels restart <channel>`
- **技能**: 在對話中reload或重啟

## 🔄 版本更新

```bash
# 檢查更新
openclaw update --dry-run

# 套用更新 (會自動重啟 gateway)
openclaw update

# 切換 channel (stable|beta|dev)
openclaw update --channel beta
```

---

需要我詳細解釋某個配置項的用法嗎？例如如何設定特定 channel 的 allowlist，或如何建立自定義技能？
