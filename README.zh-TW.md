# OpenClaw 繁體中文使用手冊

> OpenClaw 是一套個人 AI 代理平台，可連接 Telegram、WhatsApp、Discord、Slack 等即時通訊頻道，讓你的 AI 助理隨時隨地為你服務。

---

## 📋 目錄

1. [系統需求](#-系統需求)
2. [安裝說明](#-安裝說明)
3. [初始設定](#️-初始設定)
4. [啟動 Gateway](#-啟動-gateway)
5. [指令使用手冊](#-指令使用手冊)
6. [頻道設定](#-頻道設定)
7. [工作區設定](#️-工作區設定)
8. [常用範例](#-常用範例)
9. [疑難排解](#-疑難排解)
10. [更新與維護](#-更新與維護)

---

## 📋 系統需求

安裝 OpenClaw 前，請確認你的系統已具備下列軟體：

| 需求項目 | 最低版本 | 說明 |
|---------|---------|------|
| **Node.js** | v20 以上 | [下載 Node.js](https://nodejs.org/) |
| **npm** | v9 以上 | 隨 Node.js 一同安裝 |
| **Git** | v2.30 以上 | 工作區同步用 |
| **作業系統** | macOS / Linux / Windows (WSL2) | Windows 需使用 WSL2 |

你還需要至少一組 **LLM API 金鑰**（必須具備其中之一才能使用 OpenClaw）：

- [Anthropic API 金鑰](https://console.anthropic.com/) — 用於 Claude 模型（**推薦，效果最佳**）
- [OpenAI API 金鑰](https://platform.openai.com/) — 用於 GPT 模型
- [Google AI API 金鑰](https://aistudio.google.com/) — 用於 Gemini 模型

> **提示：** 建議優先申請 Anthropic API 金鑰。Claude 模型是 OpenClaw 的主要支援 LLM，提供最穩定的使用體驗。

---

## 🚀 安裝說明

### 方式一：透過 npm 安裝（推薦）

```bash
npm install -g openclaw
```

安裝完成後，驗證版本：

```bash
openclaw --version
```

### 方式二：從原始碼安裝

```bash
# 複製儲存庫
git clone https://github.com/oceanicdayi/openclaw-1.git
cd openclaw-1

# 安裝相依套件
npm install

# 全域連結 CLI
npm link
```

---

## ⚙️ 初始設定

### 步驟一：執行初始化精靈

```bash
openclaw init
```

此指令會在 `~/.openclaw/` 建立工作區目錄，結構如下：

```
~/.openclaw/
├── openclaw.json          # 主要設定檔
├── workspace/
│   ├── AGENTS.md          # 代理行為指示
│   ├── SOUL.md            # 代理人格設定
│   ├── USER.md            # 使用者個人資料
│   ├── MEMORY.md          # 長期記憶（僅主 session 載入）
│   ├── HEARTBEAT.md       # 週期性任務清單
│   ├── TOOLS.md           # 工具使用備註
│   └── memory/            # 每日記憶記錄（YYYY-MM-DD.md）
├── credentials/           # 頻道憑證（請勿提交至 Git）
└── identity/              # 自動產生的身份檔案
```

### 步驟二：設定 API 金鑰

建立 `.env` 檔案，或在 shell 設定檔（`~/.bashrc`、`~/.zshrc`）中匯出環境變數：

```bash
# LLM 服務商（至少需要一組）
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...

# 選用：其他服務商
export MINIMAX_API_KEY=...
export ELEVENLABS_API_KEY=...   # 文字轉語音
```

或將以下內容放入工作目錄的 `.env` 檔案中：

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### 步驟三：編輯主要設定檔

開啟 `~/.openclaw/openclaw.json` 進行自訂設定：

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

**主要設定項說明：**

| 設定項 | 說明 | 範例值 |
|-------|------|-------|
| `agent.model` | 使用的 LLM 模型 | `"anthropic/claude-opus-4-6"` |
| `agent.thinking` | 思考深度（`low`/`medium`/`high`） | `"low"` |
| `gateway.bind` | Gateway 監聽位址與連接埠 | `"127.0.0.1:18789"` |
| `gateway.tailscale.mode` | 遠端存取模式（`off`/`serve`/`funnel`） | `"off"` |

---

## 🌐 啟動 Gateway

啟動 OpenClaw Gateway 伺服器：

```bash
openclaw gateway start
```

Web 控制介面位於：**http://localhost:18789**

透過 Web UI 可以：
- 檢視並管理 session
- 編輯設定
- 監控頻道狀態
- 管理已連線裝置

---

## 📖 指令使用手冊

### 系統指令

| 指令 | 說明 |
|-----|------|
| `openclaw --version` | 顯示目前版本號 |
| `openclaw --help` | 顯示說明文件 |
| `openclaw init` | 執行初始化精靈，建立預設設定 |
| `openclaw init --reset` | 重置設定為預設值 |
| `openclaw status` | 顯示 Gateway 狀態與 context 使用量 |

### Gateway 指令

| 指令 | 說明 |
|-----|------|
| `openclaw gateway start` | 啟動 Gateway 伺服器 |
| `openclaw gateway stop` | 停止 Gateway 伺服器 |
| `openclaw gateway restart` | 重新啟動 Gateway 伺服器 |

**範例：**

```bash
# 啟動 gateway
openclaw gateway start

# 檢查 gateway 狀態
openclaw status

# 重新啟動 gateway（修改設定後使用）
openclaw gateway restart
```

### 對話指令

| 指令 | 說明 |
|-----|------|
| `openclaw chat "訊息內容"` | 透過 CLI 直接與 AI 代理對話 |

**範例：**

```bash
# 測試 AI 代理是否正常運作
openclaw chat "你好，你在嗎？"

# 詢問工作相關問題
openclaw chat "幫我整理一份今天的待辦事項"

# 執行複雜任務
openclaw chat "請分析 ~/Documents/report.csv 的內容並產生摘要"
```

### 頻道指令

| 指令 | 說明 |
|-----|------|
| `openclaw channels restart <頻道名稱>` | 重新啟動指定頻道 |
| `openclaw channels login <頻道名稱>` | 登入頻道（如 WhatsApp QR code） |
| `openclaw channels log <頻道名稱>` | 查看指定頻道的日誌 |

**範例：**

```bash
# 重新啟動 Telegram 頻道
openclaw channels restart telegram

# 透過 QR code 登入 WhatsApp
openclaw channels login whatsapp

# 查看 Discord 頻道日誌
openclaw channels log discord

# 重新登入 WhatsApp
openclaw channels login whatsapp
openclaw channels restart whatsapp
```

### 排程指令（Cron）

| 指令 | 說明 |
|-----|------|
| `openclaw cron add "<cron 表達式>" "<指令>"` | 新增排程任務 |
| `openclaw cron list` | 列出所有排程任務 |
| `openclaw cron remove <任務ID>` | 移除排程任務 |

**範例：**

```bash
# 每 30 分鐘同步 GitHub 工作區
openclaw cron add "*/30 * * * *" "/root/.openclaw/workspace/scripts/sync-github.sh"

# 每天早上 9 點產生日報
openclaw cron add "0 9 * * *" "openclaw chat '請產生今日工作摘要'"

# 列出所有排程
openclaw cron list
```

### 更新指令

| 指令 | 說明 |
|-----|------|
| `openclaw update` | 更新至最新版本 |
| `openclaw update --dry-run` | 預覽更新（不實際執行） |
| `openclaw update --channel <頻道>` | 切換更新頻道 |

**更新頻道選項：**
- `stable` — 穩定版（預設）
- `beta` — 測試版
- `dev` — 開發版

**範例：**

```bash
# 檢查是否有可用更新
openclaw update --dry-run

# 執行更新（會自動重新啟動 gateway）
openclaw update

# 切換至測試版頻道
openclaw update --channel beta

# 切換回穩定版
openclaw update --channel stable
```

---

## 💬 頻道設定

OpenClaw 支援連接多個即時通訊平台。在 `~/.openclaw/openclaw.json` 的 `"channels"` 區塊中進行設定。

### Telegram

1. 透過 [@BotFather](https://t.me/BotFather) 建立 bot 並複製 token。
2. 在設定檔中加入以下設定：

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

3. 重新啟動 Telegram 頻道：

```bash
openclaw channels restart telegram
```

**設定項說明：**

| 設定項 | 說明 |
|-------|------|
| `botToken` | BotFather 提供的 bot token |
| `allowFrom` | 允許互動的使用者名稱清單（`@username` 格式） |
| `groups.*.requireMention` | 在群組中是否需要 @提及才回應 |

### WhatsApp

1. 透過 QR code 登入：

```bash
openclaw channels login whatsapp
```

2. 使用手機 WhatsApp 掃描終端機顯示的 QR code。
3. 在設定檔中加入手機號碼白名單：

```json
"channels": {
  "whatsapp": {
    "allowFrom": ["+886912345678"]
  }
}
```

> **注意：** 手機號碼需包含國碼（如台灣為 `+886`）。

### Discord

1. 在 [Discord 開發者入口網站](https://discord.com/developers/applications) 建立應用程式與 bot。
2. 複製 bot token 及你的使用者 ID / 伺服器 ID。
3. 在設定檔中加入以下設定：

```json
"channels": {
  "discord": {
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "allowFrom": ["你的使用者ID"],
    "guilds": ["你的伺服器ID"]
  }
}
```

4. 重新啟動 Discord 頻道：

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

> **提示：** `allowFrom` 中填入的是 Slack 使用者 ID（以 `U` 開頭），而非顯示名稱。

---

## 🗂️ 工作區設定

工作區檔案位於 `~/.openclaw/workspace/`，是 OpenClaw 最核心的自訂區域。

### SOUL.md — AI 人格設定

定義 AI 代理的行為風格與核心價值觀。你可以用任何語言撰寫。

```markdown
# SOUL.md - 我是誰

## 核心原則

- 真正幫助你，不做表面功夫
- 有自己的觀點，適時提出建議
- 在詢問之前先試著解決問題
- 保護你的隱私

## 風格

直接、清晰、有效率。不廢話，不拍馬屁。
```

### USER.md — 使用者個人資料

讓 AI 了解你是誰、你的偏好和背景。

```markdown
# USER.md - 使用者資訊

- **姓名：** 大宜老師
- **職業：** 大學教授、地震測報人員
- **時區：** Asia/Taipei (UTC+8)
- **語言偏好：** 繁體中文
- **常用工具：** Python、Git、LaTeX
```

### MEMORY.md — 長期記憶

儲存重要的長期資訊，**僅在與你直接對話（主 session）時載入**；在 Discord、群組聊天或與他人共享的 session 中不會載入，以保護個人隱私安全。

```markdown
# MEMORY.md - 長期記憶

## 進行中的計畫
- 地震資料分析專案（截止日期：2026-06）
- 課程教材更新

## 偏好設定
- 程式碼使用 4 空格縮排
- 報告格式：Markdown + LaTeX 數學公式
```

### HEARTBEAT.md — 週期性任務

設定定時執行的背景任務清單。

```markdown
# HEARTBEAT.md

- 檢查重要電子郵件是否需要回覆
- 查看明後兩天的行事曆
- 確認今日待辦事項進度
```

---

## 🎯 常用範例

### 範例一：快速開始（完整流程）

```bash
# 1. 安裝 OpenClaw
npm install -g openclaw

# 2. 設定 API 金鑰
export ANTHROPIC_API_KEY=sk-ant-你的金鑰

# 3. 初始化
openclaw init

# 4. 啟動 Gateway
openclaw gateway start

# 5. 測試對話
openclaw chat "你好！請介紹一下你自己。"
```

### 範例二：設定 Telegram 機器人

```bash
# 1. 前往 https://t.me/BotFather 建立 bot，取得 token
# 2. 編輯設定檔
nano ~/.openclaw/openclaw.json

# 3. 在 "channels" 區塊加入 telegram 設定
# （參考上方頻道設定說明）

# 4. 重新啟動頻道
openclaw channels restart telegram

# 5. 開啟 Telegram，與你的 bot 開始對話
```

### 範例三：每日自動報告

```bash
# 設定每天早上 8 點產生工作摘要並寄送提醒
openclaw cron add "0 8 * * 1-5" "openclaw chat '請檢查今日行事曆並列出三件最重要的事'"
```

### 範例四：連接多個頻道

```json
{
  "channels": {
    "telegram": {
      "botToken": "123:ABC",
      "allowFrom": ["@my_username"]
    },
    "whatsapp": {
      "allowFrom": ["+886912345678"]
    },
    "discord": {
      "token": "DISCORD_BOT_TOKEN",
      "allowFrom": ["123456789012345678"],
      "guilds": ["987654321098765432"]
    }
  }
}
```

```bash
# 重新啟動所有頻道
openclaw channels restart telegram
openclaw channels restart discord
# WhatsApp 會自動重新連線
```

### 範例五：自訂 AI 人格（繁體中文版）

編輯 `~/.openclaw/workspace/SOUL.md`：

```markdown
# SOUL.md

## 我是誰
我是你的個人 AI 助理，專門協助處理學術研究、資料分析和日常事務。

## 溝通風格
- 預設使用繁體中文回應
- 技術問題提供具體可執行的建議
- 學術內容保持嚴謹，日常溝通輕鬆友善

## 專業領域
- 地球科學與地震分析
- Python 程式設計
- 學術論文寫作
```

### 範例六：開啟遠端存取（Tailscale）

在 `~/.openclaw/openclaw.json` 中設定：

```json
{
  "gateway": {
    "tailscale": {
      "mode": "serve"
    }
  }
}
```

```bash
# 重新啟動 gateway 套用設定
openclaw gateway restart

# 現在可以透過 Tailscale 網路從任何裝置存取
```

### 範例七：安裝自訂技能

```bash
# 建立技能目錄
mkdir -p ~/.openclaw/workspace/skills/my-skill

# 建立技能定義檔
cat > ~/.openclaw/workspace/skills/my-skill/SKILL.md << 'EOF'
# Skill: My Custom Skill

## Description
執行自訂工作流程。

## Usage
說「執行我的自訂技能」來觸發。

## Tools
- `my-tool` — 執行特定操作
EOF
```

---

## 🐛 疑難排解

### Gateway 無法啟動

```bash
# 檢查連接埠 18789 是否已被占用
lsof -i :18789

# 如果被占用，在 openclaw.json 中改用其他連接埠
# "gateway": { "bind": "127.0.0.1:18790" }
```

### API 金鑰錯誤

```bash
# 確認金鑰已正確載入
echo $ANTHROPIC_API_KEY

# 如需重新載入
source ~/.bashrc   # 或 source ~/.zshrc
```

### 頻道連線問題

```bash
# 查看頻道日誌
openclaw channels log telegram

# 重新登入頻道
openclaw channels login whatsapp

# 重新啟動頻道
openclaw channels restart telegram
```

### WhatsApp QR code 掃描失敗

```bash
# 重新執行登入流程
openclaw channels login whatsapp
# 在 30 秒內用手機掃描 QR code
```

### 重置設定

```bash
# 備份現有設定
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# 重置為預設值
openclaw init --reset
```

---

## 🔄 更新與維護

### 更新 OpenClaw

```bash
# 預覽可用更新
openclaw update --dry-run

# 執行更新（會自動重新啟動 gateway）
openclaw update

# 切換更新頻道
openclaw update --channel beta   # 選項：stable | beta | dev
```

### 備份工作區

```bash
# 備份整個工作區
cp -r ~/.openclaw/workspace ~/openclaw-workspace-backup-$(date +%Y%m%d)

# 或使用 Git 同步（參考 DEPLOYMENT_GUIDE.md）
```

---

## 🐳 容器化部署

如需在 Docker 或 Hugging Face Spaces 中部署 OpenClaw，請參考：

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** — 含 GitHub 狀態同步的 Hugging Face Spaces 部署指南

### 最簡 Dockerfile 範例：

```dockerfile
FROM node:20

# 安裝 OpenClaw
RUN npm install -g openclaw

# 複製工作區與設定
COPY workspace/ /root/.openclaw/workspace/
COPY openclaw.json /root/.openclaw/openclaw.json

# 開放 Gateway 連接埠
EXPOSE 18789

CMD ["openclaw", "gateway", "start"]
```

---

## 📚 後續步驟

成功安裝後，你可以：

- 在 `~/.openclaw/workspace/SOUL.md` 中自訂 AI 人格
- 在 `~/.openclaw/workspace/USER.md` 中設定使用者個人資料
- 在 `~/.openclaw/workspace/HEARTBEAT.md` 中設定週期性任務
- 在 `~/.openclaw/workspace/skills/` 中安裝自訂技能
- 將 `gateway.tailscale.mode` 設為 `"serve"` 或 `"funnel"` 啟用遠端存取

如需架構細節與進階設定，請參閱 **[Structure.md](./Structure.md)**。

---

*如有任何問題，歡迎在 [GitHub Issues](https://github.com/oceanicdayi/openclaw-1/issues) 提問。*
