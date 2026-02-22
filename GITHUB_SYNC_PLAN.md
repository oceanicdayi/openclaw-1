# OpenClaw 檔案架構分析與 GitHub 持久化方案

_2026-02-22 — 針對 Hugging Face Spaces 部署的長期儲存設計_

## 📊 當前檔案結構分析

### ✅ **需要長期保存**（核心狀態）

```
/root/.openclaw/workspace/
├── IDENTITY.md              (125 bytes)
├── USER.md                  (470 bytes)
├── SOUL.md                  (2.0K)
├── MEMORY.md                (475 bytes)
├── TOOLS.md                 (2.3K)
├── AGENTS.md                (8.0K)
├── HEARTBEAT.md             (empty)
├── memory/
│   └── 2026-02-22.md       (601 bytes)
└── .git/                    (Git repo initialized but no commits)

/root/.openclaw/agents/main/sessions/
└── [對話歷史檔案]           (~272K total)
```

**總計：約 300KB**（非常適合 Git 版本控制！）

### ❌ **不要放到 GitHub**（敏感/暫時性資料）

```
/root/.openclaw/credentials/     ← 包含 API keys、tokens（極敏感！）
/root/.openclaw/canvas/          ← 暫存圖片/UI 快照
/root/.openclaw/cron/            ← cron 作業狀態（可重建）
/root/.openclaw/workspace/.openclaw/
    └── workspace-state.json     ← 可重建的狀態 marking
/root/.openclaw/agents/main/agent/
    └── [暫存檔案]                ← 執行狀態（non-persistent）
```

## 🎯 **GitHub 持久化方案設計**

### 方案 1：**單一repo + git subtree split**（推薦）

```bash
# 結構：把可持久化的目錄分別推送到不同的 GitHub repo
# 優點：清晰分離，易於管理
# 缺點：需要多個 repo（或使用 subtree）

# 步驟：
# 1. 初始化 workspace 為 git repo（已完成）
# 2. 設定 sparse-checkout 只追蹤需要的檔案
# 3. 定期 commit & push

# 64 bytes
git init /root/.openclaw/workspace
cd /root/.openclaw/workspace
git add IDENTITY.md USER.md SOUL.md MEMORY.md TOOLS.md AGENTS.md HEARTBEAT.md memory/
git commit -m "Initial state"

# 推送到 GitHub
git remote add origin git@github.com:youruser/openclaw-workspace.git
git push -u origin master
```

### 方案 2：**Git submodule 組織**

```bash
# 分隔 storage 到獨立 repo：
# openclaw-main/    ← 只放部署腳本、技能配置
# openclaw-memory/  ← 記憶體、daily logs
# openclaw-sessions/← 對話歷史

# Hugging Face Spaces 部署時：
# 1. Clone 主 repo
# 2. git submodule update --init --recursive
# 3. 啟動 OpenClaw
```

### 方案 3：**自動同步腳本（最適合 HF Spaces）**

建立同步腳本 `scripts/sync-github.sh`：

```bash
#!/bin/bash
set -e

# 只在持久化存儲目錄中工作
cd /root/.openclaw/workspace

# 1. Pull 最新狀態（避免衝突）
git fetch origin
git merge origin/master --no-edit || true

# 2. 添加 modified files
git add -A memory/ *.md

# 3. Commit（如果有的話）
if ! git diff-index --quiet HEAD --; then
    git commit -m "Auto-sync: $(date -Iseconds)"
    git push origin master
fi
```

**在 Hugging Face Spaces 使用：**
- `on_startup`：執行 `git pull`
- 周期性（每 10 次對話後）：執行 `sync-github.sh`
- `on_shutdown`：執行 `git push`

## 🚀 **Implementation Plan**

### Step 1：建立 Git 忽略規則
```bash
# /root/.openclaw/workspace/.gitignore
.openclaw/
credentials/
cron/
canvas/
agents/main/agent/
*.log
*.tmp
```

### Step 2：初始提交
```bash
cd /root/.openclaw/workspace
git add IDENTITY.md USER.md SOUL.md MEMORY.md TOOLS.md AGENTS.md HEARTBEAT.md memory/
git commit -m "feat: initial OpenClaw workspace state"
```

### Step 3：設定 GitHub Secrets（HF Spaces）
在 Hugging Face Space Settings → Repository secrets：
- `GITHUB_TOKEN`：具有倉存存取權的 token
- `GIT_SYNC_ENABLED`：`true`

### Step 4：部署鈤同步鈤指令
在 `app.py` 或 Dockerfile 中添加：

```python
import subprocess
import os

def sync_from_github():
    if os.getenv("GIT_SYNC_ENABLED") == "true":
        subprocess.run(["git", "pull", "--no-edit"], cwd="/root/.openclaw/workspace")

def sync_to_github():
    if os.getenv("GIT_SYNC_ENABLED") == "true":
        subprocess.run(["bash", "/app/scripts/sync-github.sh"])
```

### Step 5：異常處理
- 使用 GitHub token 認證（避免 interactive git push）
- 自動處理合併衝突（保留兩邊變更，標記衝突）
- heartbeat 時檢查同步狀態

## 🎁 **額外好處**

1. **版本歷史**：追蹤 `MEMORY.md` 如何隨著時間演變
2. **備份**：GitHub 作為 off-site backup
3. **多實例同步**：如果有多個 OpenClaw 部署，可共享狀態
4. **rollback**：可回到任何過去的狀態
5. **審計**：查看誰（哪個實例）何時修改了什麼

## ⚠️ **安全警告**

- **絕不**將 `/root/.openclaw/credentials/` 提交到 GitHub
- 使用 GitHub **private repo**
- 使用 **machine user token** 而非個人帳號密碼
- 設定 `.gitignore` 確保敏感檔案不被追蹤
- 考慮使用 GitHub Actions 自動加密備份（替代方案）

## 📈 **實際測試建議**

1. 先在本機測試同步流程
2. 監控同步頻率：太高會觸發 API limit，太低會丟失資料
3. 建議頻率：
   - 每次 `MEMORY.md` 修改後立即 push
   - `memory/*.md` 每日一次
   - 對話歷史每 10 條訊息一次

---

**結論：GitHub repo 是非常適合的長期儲存方案！**  
只需要 300KB 的資料，Git 版本控制完美 match，且能解决 Hugging Face Spaces 的無狀態問題。
