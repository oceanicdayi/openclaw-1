# OpenClaw 技術架構文件

> 本文件以繁體中文說明 OpenClaw 的核心技術架構、系統元件與設計原則。  
> 參考來源：[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

---

## 目錄

1. [專案概述](#1-專案概述)
2. [整體架構](#2-整體架構)
3. [核心元件](#3-核心元件)
   - [3.1 Gateway（閘道器）](#31-gateway閘道器)
   - [3.2 Agent Runtime（代理執行期）](#32-agent-runtime代理執行期)
   - [3.3 Channel 層（頻道層）](#33-channel-層頻道層)
   - [3.4 CLI 介面](#34-cli-介面)
   - [3.5 Web 控制介面](#35-web-控制介面)
   - [3.6 Companion Apps（同伴應用）](#36-companion-apps同伴應用)
4. [通訊協定](#4-通訊協定)
5. [工作區與記憶體系統](#5-工作區與記憶體系統)
6. [工具與技能平台](#6-工具與技能平台)
7. [模型管理](#7-模型管理)
8. [安全性設計](#8-安全性設計)
9. [自動化與排程](#9-自動化與排程)
10. [部署架構](#10-部署架構)
11. [技術棧](#11-技術棧)
12. [設計原則](#12-設計原則)

---

## 1. 專案概述

**OpenClaw** 是一套個人化 AI 助理平台，其設計理念是讓使用者在自己的裝置上運行完整的 AI 代理系統，並透過使用者已經習慣的通訊頻道（如 WhatsApp、Telegram、Discord、Slack 等）與 AI 互動。

**核心定位：**

- **本地優先（Local-first）**：Gateway 在本機執行，資料不強制上傳雲端
- **多頻道收件匣**：單一代理，連接多種通訊平台
- **個人化 AI**：透過工作區文件自訂代理人格、記憶與行為
- **可擴充技能**：支援安裝外部或自訂技能（Skills）
- **開放原始碼**：MIT 授權，社群驅動開發

---

## 2. 整體架構

OpenClaw 採用**以 Gateway 為核心的星型拓撲**，所有元件透過 WebSocket 連線至 Gateway：

```
WhatsApp / Telegram / Slack / Discord / Signal / Google Chat
iMessage / BlueBubbles / Matrix / IRC / Microsoft Teams
Feishu / LINE / Mattermost / Nextcloud Talk / Nostr
Synology Chat / Tlon / Twitch / Zalo / WebChat
            │
            │ HTTP/WebSocket 事件推送
            ▼
┌───────────────────────────────────────────────────────┐
│                   Gateway（控制平面）                  │
│  綁定：ws://127.0.0.1:18789                           │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ 會話管理 │  │ 頻道路由 │  │  認證 / 授權     │    │
│  └──────────┘  └──────────┘  └──────────────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ 排程引擎 │  │ Webhook  │  │   Canvas Host    │    │
│  └──────────┘  └──────────┘  └──────────────────┘    │
└───────────┬───────────────────────────────────────────┘
            │ WebSocket RPC
            ├─────────────────────────────────────┐
            │                                     │
            ▼                                     ▼
┌───────────────────────┐            ┌────────────────────────┐
│   Agent Runtime       │            │   Companion Nodes       │
│   （Pi Agent）        │            │   macOS / iOS / Android │
│                       │            │                        │
│  • LLM 推論           │            │  • Voice Wake          │
│  • 工具呼叫           │            │  • Talk Mode           │
│  • 記憶檢索           │            │  • Camera / Screen     │
│  • 技能執行           │            │  • Canvas / A2UI       │
└───────────────────────┘            └────────────────────────┘
            │
            ├─ CLI（openclaw …）
            └─ Web Control UI（http://localhost:18789）
```

---

## 3. 核心元件

### 3.1 Gateway（閘道器）

Gateway 是整個系統的**控制平面（Control Plane）**，負責協調所有元件之間的通訊。

**主要職責：**

| 功能 | 說明 |
|------|------|
| **WebSocket 控制平面** | 所有客戶端（CLI、Web UI、Agent、Nodes）均透過 WS 連線 |
| **會話管理** | 管理 `main` 主會話、群組會話、啟動模式與排隊模式 |
| **頻道路由** | 將不同頻道的訊息路由至對應的代理或工作區 |
| **認證授權** | 支援 token 模式、密碼模式與 Tailscale Identity Header |
| **Webhook 接收** | 外部服務可透過 Webhook 觸發 Agent |
| **排程引擎（Cron）** | 內建定時任務管理，支援標準 cron 表達式 |
| **Canvas Host** | 承載 A2UI 視覺化工作區 |
| **Web Control UI** | 嵌入式 Web 介面，供管理 session、設定、裝置 |

**網路綁定預設值：**

```
ws://127.0.0.1:18789    ← 本機 loopback（預設）
```

可透過 Tailscale Serve（tailnet 內部）或 Funnel（公開 HTTPS）對外暴露。

---

### 3.2 Agent Runtime（代理執行期）

Agent Runtime 是實際處理使用者訊息、呼叫 LLM 並執行工具的核心元件，又稱 **Pi Agent**。

**運作流程：**

```
接收訊息
    │
    ▼
載入工作區檔案
（SOUL.md / USER.md / MEMORY.md / memory/*.md）
    │
    ▼
建構 System Prompt
    │
    ▼
呼叫 LLM API（支援串流 Streaming）
    │
    ▼
解析工具呼叫（Tool Use）
    │
    ├── 執行工具（瀏覽器、Canvas、節點指令…）
    │
    ▼
產生回覆（支援分塊 Chunking）
    │
    ▼
透過 Gateway 回傳至來源頻道
```

**關鍵特性：**

- **RPC 模式**：透過 Gateway WebSocket 以 JSON-RPC 方式呼叫
- **工具串流（Tool Streaming）**：工具執行過程中即時推送進度
- **區塊串流（Block Streaming）**：LLM 輸出分批推送至前端
- **會話隔離**：每個頻道 / 使用者 / 群組可設定獨立的會話上下文

---

### 3.3 Channel 層（頻道層）

頻道層負責與各個即時通訊平台對接，並將訊息標準化後轉交給 Gateway。

**支援頻道（截至 2025 年）：**

| 類別 | 頻道 | 底層函式庫 |
|------|------|-----------|
| 行動通訊 | WhatsApp | Baileys |
| 即時通訊 | Telegram | grammY |
| 企業協作 | Slack | Bolt SDK |
| 遊戲社群 | Discord | discord.js |
| Google 生態 | Google Chat | Chat API |
| 加密通訊 | Signal | signal-cli |
| Apple 生態 | iMessage / BlueBubbles | 原生橋接 |
| IRC | IRC | - |
| 微軟生態 | Microsoft Teams | - |
| 分散式 | Matrix、Nostr | - |
| 中國生態 | Feishu（飛書）、Zalo | - |
| 其他 | LINE、Mattermost、Nextcloud Talk、Synology Chat、Tlon、Twitch | - |
| 網頁 | WebChat | 嵌入式 UI |

**頻道路由設定（多代理架構）：**

```json
{
  "channels": {
    "telegram": {
      "agent": "work-agent",
      "allowFrom": ["@alice"],
      "dmPolicy": "pairing"
    },
    "discord": {
      "agent": "personal-agent",
      "guilds": ["guild_id"],
      "dmPolicy": "open"
    }
  }
}
```

**DM 安全政策（`dmPolicy`）：**

| 值 | 行為 |
|----|------|
| `pairing`（預設） | 未知發送者收到配對碼，Bot 不處理訊息 |
| `open` | 公開接受所有訊息（需搭配 `allowFrom: ["*"]`） |

---

### 3.4 CLI 介面

CLI（`openclaw`）是操作 Gateway 的主要終端工具。

**主要指令群：**

```
openclaw onboard          # 互動式初始化精靈（推薦新手使用）
openclaw gateway          # Gateway 啟動 / 停止 / 狀態
openclaw agent            # 直接觸發代理任務
openclaw message send     # 透過 CLI 傳送訊息至頻道
openclaw channels         # 頻道管理（登入 / 重啟 / 日誌）
openclaw pairing          # 管理 DM 配對授權
openclaw cron             # 排程任務管理
openclaw update           # 版本更新 / 頻道切換
openclaw doctor           # 健康檢查 / 設定問題診斷
openclaw status           # 顯示執行狀態
```

**開發模式（從原始碼）：**

```bash
pnpm gateway:watch   # TypeScript 即時重載
pnpm openclaw ...    # 直接透過 tsx 執行 TypeScript
```

---

### 3.5 Web 控制介面

Gateway 內建 Web Control UI，無需額外安裝，啟動 Gateway 後即可存取：

```
http://localhost:18789
```

**功能：**

- 查看並管理活躍會話（Sessions）
- 即時監控頻道連線狀態
- 編輯 `openclaw.json` 設定
- 管理已配對裝置（Nodes）
- 檢視使用量與費用追蹤

**WebChat：**  
Gateway 同時內建輕量級 WebChat 介面，可直接從瀏覽器與 AI 代理對話，適合無法安裝 App 的場景。

---

### 3.6 Companion Apps（同伴應用）

Companion Apps 是執行在使用者裝置上的**節點（Nodes）**，透過 Gateway WebSocket 與主系統連線，提供裝置原生能力。

**macOS 應用：**

| 功能 | 說明 |
|------|------|
| 選單列控制 | 常駐選單列，快速管理 Gateway 狀態 |
| Voice Wake | 喚醒詞監聽（離線辨識） |
| Talk Mode | 持續語音對話覆蓋介面 |
| Canvas | 代理驅動的視覺工作區（A2UI） |
| Node 模式 | 暴露 `system.run`、`system.notify` 等本機指令 |
| 遠端 Gateway | 可連線至遠端 Linux Gateway |

**iOS 節點：**

- Canvas（A2UI）視覺工作區
- Voice Wake 喚醒詞
- Talk Mode 語音覆蓋
- 相機拍照 / 螢幕錄影
- Bonjour 裝置配對

**Android 節點：**

- 聊天會話介面
- 語音功能（持續語音）
- Canvas（A2UI）
- 相機 / 螢幕錄影
- 裝置指令：通知 / 位置 / SMS / 照片 / 聯絡人 / 行事曆 / 動作感測 / 應用更新

**Node 通訊協定（node.invoke）：**

```
node.list      → 列出已連線節點
node.describe  → 取得節點能力與權限映射
node.invoke    → 執行裝置本機動作
```

---

## 4. 通訊協定

### 4.1 WebSocket 控制平面

Gateway 以 WebSocket 作為統一的控制平面協定，所有訊息遵循 JSON-RPC 格式。

**主要 WS 方法：**

| 方法 | 說明 |
|------|------|
| `sessions.list` | 列出所有活躍會話 |
| `sessions.patch` | 更新會話參數（模型、思考層級等） |
| `agent.run` | 觸發代理執行 |
| `node.invoke` | 呼叫裝置節點動作 |
| `node.list` | 列出連線節點 |
| `channels.status` | 查詢頻道連線狀態 |

### 4.2 訊息串流

Agent 輸出採用**分塊串流（Chunk Streaming）**機制：

```
LLM 輸出 → 分塊 → WebSocket 推送 → 頻道逐步呈現
```

長訊息依頻道限制自動分割（WhatsApp / SMS 等有字數限制的頻道）。

### 4.3 重試策略

內建可設定的重試機制，處理 LLM API 暫時性錯誤與頻道連線中斷。

---

## 5. 工作區與記憶體系統

工作區是 OpenClaw **最核心的自訂區域**，以純文字 Markdown 檔案定義代理的「大腦」。

### 5.1 工作區結構

```
~/.openclaw/workspace/
├── AGENTS.md          # 代理行為與 session 載入規則（系統核心）
├── SOUL.md            # AI 人格定義（每次對話載入）
├── USER.md            # 使用者個人資料（每次對話載入）
├── MEMORY.md          # 長期記憶（僅主 session 載入）
├── HEARTBEAT.md       # 週期性心跳任務清單
├── TOOLS.md           # 工具使用備註
├── memory/
│   └── YYYY-MM-DD.md  # 每日原始記憶記錄（自動生成）
└── skills/
    └── <skill-name>/
        └── SKILL.md   # 技能定義
```

### 5.2 記憶體架構

OpenClaw 採用**分層記憶體模型**：

```
每次對話
  ├── SOUL.md        ← 人格層（永遠載入）
  ├── USER.md        ← 使用者層（永遠載入）
  ├── memory/今天.md  ← 短期記憶（當日 + 前日）
  └── MEMORY.md      ← 長期記憶（僅主 session）
```

**設計原則：**

- `MEMORY.md` **不在群組聊天或共享 session 載入**，保護個人隱私
- 每日記憶記錄（`memory/YYYY-MM-DD.md`）是原始日誌，定期由代理蒸餾更新至 `MEMORY.md`
- 代理在 session 間透過讀寫工作區檔案達成「記憶持續性」

### 5.3 Session 模型

| Session 類型 | 說明 |
|-------------|------|
| `main` | 使用者直接對話的主要 session |
| 群組 session | 群組聊天的隔離 session |
| 多代理路由 | 不同頻道可路由至不同的代理（工作區 + 獨立 session） |

**Session 可調參數（透過 `sessions.patch`）：**

- `model`：使用的 LLM 模型
- `thinkingLevel`：推理深度（`low` / `medium` / `high`）
- `verboseLevel`：輸出詳細度
- `sendPolicy`：回傳政策
- `groupActivation`：群組中的啟動條件
- `elevated`：是否啟用 macOS 提升權限

---

## 6. 工具與技能平台

### 6.1 內建工具

| 工具 | 說明 |
|------|------|
| **瀏覽器控制** | 管理專用 Chrome/Chromium 實例，支援 CDP 協定 |
| **Canvas / A2UI** | 代理驅動的視覺工作區推送 / 重置 / 評估 / 截圖 |
| **節點指令** | 相機拍照、螢幕錄影、位置取得、通知推送 |
| **排程（Cron）** | 定時任務觸發 |
| **Webhook** | 外部事件接收 |
| **Gmail Pub/Sub** | Gmail 郵件事件訂閱 |
| **Agent 協作（sessions_\*）** | 跨 session 協調多代理工作 |

### 6.2 技能平台（Skills）

技能是可安裝、可共享的擴充模組，擴充代理能力而無需修改核心。

**技能類型：**

| 類型 | 說明 |
|------|------|
| 捆綁技能（Bundled） | 隨 OpenClaw 核心預裝 |
| 管理技能（Managed） | 透過 ClawHub（`clawhub.ai`）安裝 |
| 工作區技能（Workspace） | 在 `workspace/skills/` 下手動建立 |

**技能定義格式（`SKILL.md`）：**

```markdown
# Skill: 技能名稱

## Description
技能的功能說明。

## Usage
觸發方式（自然語言描述）。

## Configuration
- Required: `config.someKey`
- Optional: `config.optionalKey`

## Tools
- `tool-name` — 工具說明
```

### 6.3 MCP 支援

OpenClaw 透過 **mcporter** 整合 MCP（Model Context Protocol）：

```
OpenClaw ←→ mcporter ←→ MCP Server
```

採用橋接模式以保持核心精簡，可動態新增 / 更換 MCP 伺服器而無需重啟 Gateway。

---

## 7. 模型管理

### 7.1 支援的 LLM 提供者

| 提供者 | 模型系列 | 備註 |
|--------|---------|------|
| Anthropic | Claude（推薦） | 最佳體驗，最低提示注入風險 |
| OpenAI | GPT / Codex | 支援 OAuth |
| Google | Gemini | - |
| 其他 | 多家提供者 | 詳見文件 |

### 7.2 模型切換與容錯

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6",
    "thinking": "low"
  }
}
```

**模型容錯（Model Failover）：**  
可設定備用模型清單；主要模型不可用時自動切換至備用模型。

**Auth Profile 輪換：**  
支援多組 API 金鑰輪換，分散請求負載。

### 7.3 Session 裁剪

當對話歷史超過模型 context 視窗時，自動裁剪（Session Pruning）舊訊息以維持可用性。

---

## 8. 安全性設計

安全性是 OpenClaw 的**核心設計原則**，不是事後補強。

### 8.1 Gateway 認證

| 模式 | 說明 |
|------|------|
| `token`（預設） | 隨機產生的 bearer token |
| `password` | 使用者設定的密碼 |
| Tailscale Identity | 透過 Tailscale Identity Header 驗證 |

### 8.2 DM 安全政策

預設所有頻道啟用 **DM 配對（Pairing）** 機制，防止未知使用者濫用代理：

1. 未知發送者收到配對碼
2. 管理員執行：`openclaw pairing approve <channel> <code>`
3. 發送者加入本機白名單，後續訊息正常處理

**高風險設定需明確啟用：**
```json
{
  "channels": {
    "telegram": {
      "dmPolicy": "open",
      "allowFrom": ["*"]
    }
  }
}
```

### 8.3 Tailscale 存取控制

| 模式 | 說明 |
|------|------|
| `off`（預設） | 不設定 Tailscale |
| `serve` | tailnet 內部 HTTPS（透過 Tailscale Identity 驗證） |
| `funnel` | 公開 HTTPS（**強制要求密碼驗證**） |

**限制：**
- 啟用 `serve` / `funnel` 時，`gateway.bind` 必須設為 `loopback`
- `funnel` 模式必須設定 `gateway.auth.mode: "password"`

### 8.4 macOS 權限管理（TCC）

macOS Node 透過 Gateway 協定暴露 TCC 權限狀態：

| 功能 | 所需權限 |
|------|---------|
| `system.run` | 選擇性要求螢幕錄製 |
| `system.notify` | 通知權限 |
| `canvas.*`、`camera.*` | 相機存取 |
| `screen.record` | 螢幕錄製 |
| `location.get` | 位置服務 |

**提升權限（Elevated Bash）：**
- 透過 `/elevated on|off` 切換，需管理員預先啟用
- 狀態透過 `sessions.patch` 持久化

### 8.5 健康檢查

```bash
openclaw doctor   # 偵測危險設定與錯誤配置
```

---

## 9. 自動化與排程

### 9.1 Cron 排程引擎

內建基於標準 cron 表達式的排程系統：

```bash
# 每天早上 9 點執行
openclaw cron add "0 9 * * *" "openclaw agent --message '請產生今日報告'"

# 每 30 分鐘同步
openclaw cron add "*/30 * * * *" "/path/to/sync.sh"
```

### 9.2 心跳機制（Heartbeat）

Gateway 定期觸發心跳任務，由代理自主執行 `HEARTBEAT.md` 中定義的工作：

```markdown
# HEARTBEAT.md
- 檢查重要電子郵件
- 確認明後天行事曆
- 確認今日待辦事項進度
```

### 9.3 Webhook

外部系統可透過 Webhook 觸發代理執行，支援 HMAC 簽章驗證。

### 9.4 Gmail Pub/Sub

整合 Gmail Pub/Sub，在新郵件到達時主動通知代理，實現郵件自動處理。

---

## 10. 部署架構

### 10.1 本機部署（推薦）

```
使用者裝置（macOS / Linux / Windows WSL2）
└── Gateway（Node.js 服務）
    ├── launchd（macOS）
    └── systemd user service（Linux）
```

```bash
openclaw onboard --install-daemon   # 自動安裝系統服務
```

### 10.2 遠端 Linux 伺服器

Gateway 可運行於遠端 Linux 實例，客戶端透過 Tailscale 或 SSH 隧道連線：

```
遠端 Linux Server
└── Gateway
    ├── Tailscale Serve（tailnet 存取）
    └── SSH 隧道（本機轉發）

使用者裝置（macOS / iOS / Android）
└── Companion Node（裝置本機動作）
    └── 透過 Gateway 的 node.invoke 協定
```

**職責分工：**
- Gateway 主機：執行 exec 工具、管理頻道連線
- 裝置節點：執行 `system.run`、相機、螢幕錄影、通知等裝置原生動作

### 10.3 容器化部署（Docker）

```dockerfile
FROM node:22

RUN npm install -g openclaw@latest

COPY workspace/ /root/.openclaw/workspace/
COPY openclaw.json /root/.openclaw/openclaw.json

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--verbose"]
```

### 10.4 Nix 宣告式部署

支援透過 Nix Flake 進行宣告式設定，詳見 [nix-openclaw](https://github.com/openclaw/nix-openclaw)。

### 10.5 更新頻道

| 頻道 | npm dist-tag | 說明 |
|------|-------------|------|
| `stable` | `latest` | 正式發布版（版本格式：`vYYYY.M.D`） |
| `beta` | `beta` | 預發布測試版（`vYYYY.M.D-beta.N`） |
| `dev` | `dev` | main 分支最新開發版 |

```bash
openclaw update --channel stable|beta|dev
```

---

## 11. 技術棧

| 層級 | 技術選型 | 說明 |
|------|---------|------|
| 執行期 | Node.js ≥ 22 | 核心執行環境 |
| 語言 | TypeScript | 主要開發語言 |
| 建構工具 | pnpm / tsx | 套件管理與直接 TS 執行 |
| 建構輸出 | `dist/` | 透過 pnpm build 產生 |
| 通訊 | WebSocket（JSON-RPC） | Gateway 控制平面協定 |
| 瀏覽器控制 | Chrome DevTools Protocol（CDP） | 自動化瀏覽器操作 |
| 語音 TTS | ElevenLabs / 系統 TTS | Talk Mode 文字轉語音 |
| 設定格式 | JSON（`openclaw.json`） | 主要設定檔 |
| 工作區格式 | Markdown（`.md`） | 代理人格 / 記憶 / 技能定義 |
| 授權 | MIT | 開放原始碼 |

**開源贊助商：** OpenAI、Vercel、Blacksmith、Convex

---

## 12. 設計原則

### 12.1 本地優先

> 「Gateway 就是控制平面——產品本身是 AI 助理。」

使用者資料與設定預設保存在本機，對外暴露是可選且明確的行為。

### 12.2 安全預設

- 所有頻道預設啟用 DM 配對，未知來源無法直接存取代理
- 提升權限（`elevated`）需明確啟用
- 公開暴露（Funnel）強制要求密碼保護

### 12.3 核心精簡，外部擴充

- 核心（Core）只保留必要功能
- 可選能力透過 Skills 或 npm 套件發布至 ClawHub
- MCP 整合透過 mcporter 橋接而非內建

### 12.4 TypeScript 優先，可駭入性強

選用 TypeScript 而非 Python 或 Rust，主要原因：

- 廣泛熟知，社群貢獻門檻低
- 快速迭代，適合以協作為主的整合型系統
- 易讀、易修改、易擴充

### 12.5 終端機優先，漸進 UI

設定與操作以 CLI 為主要介面，讓使用者清楚看見所有安全決策。  
UI（Web / App）是便利性的補充，而非安全細節的隱藏層。

---

*本文件依據 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) 官方資訊整理，版本截止日期：2026 年 3 月。如有最新異動，請以官方文件為準。*
