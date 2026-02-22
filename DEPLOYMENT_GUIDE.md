# OpenClaw x Hugging Face Spaces 部署指南

_永久儲存方案：使用 GitHub 同步工作區狀態_

---

## 🎯 問題：Spaces 是無狀態的

Hugging Face Spaces 容器重啟後會丟失所有文件（除非掛載外部存儲）。  
本方案利用 **GitHub repo** 作為持久層，在 Space 生命週期之間同步 `workspace/` 狀態。

---

## 📦 包含的檔案

同步範圍（安全且重要）：

```
workspace/
├── IDENTITY.md
├── USER.md
├── SOUL.md
├── MEMORY.md
├── TOOLS.md
├── AGENTS.md
├── HEARTBEAT.md
├── memory/              # 每日日誌
└── scripts/             # 同步腳本

勿提交：
- credentials/          # API keys
- agents/main/sessions/ # 會話歷史（可選）
- .openclaw/           # 執行狀態
```

---

## ⚙️ 實施步驟

### 第一步：建立 GitHub Private Repo

1. 登入 GitHub，創建新 repo `openclaw-workspace`
2. **不要**初始化 README/.gitignore（我們會推送現有狀態）
3. 複製 repo URL（SSH 或 HTTPS）

### 第二步：配置 Hugging Face Space Secrets

在 Space Settings → Repository secrets 新增：

| Key                | Value                                               |
|--------------------|-----------------------------------------------------|
| `GITHUB_TOKEN`     | 具有 `repo` 權限的 Personal Access Token            |
| `GIT_SYNC_ENABLED` | `true`（可選，預設為 true）                         |
| `GIT_REMOTE_URL`   | `git@github.com:youruser/openclaw-workspace.git`   |

**產生 GITHUB_TOKEN：**
```bash
# GitHub → Settings → Developer settings → Personal access tokens
# 權限：repo（_full control of private repositories）
```

### 第三步：修改 Space 部署配置

#### 如果你使用 `Dockerfile`：

```dockerfile
FROM node:20

# ... 其他安裝步驟 ...

# 複製同步腳本
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Entrypoint wrapper
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

#### `entrypoint.sh` 範例：

```bash
#!/bin/bash
set -e

# 1. 從 GitHub  Pull 最新狀態
if [ -n "$GITHUB_TOKEN" ]; then
    git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"
fi

cd /root/.openclaw/workspace
if [ -d ".git" ]; then
    /root/.openclaw/workspace/scripts/pull-github.sh || true
fi

# 2. 啟動 OpenClaw Gateway
echo "Starting OpenClaw gateway..."
exec openclaw gateway "$@"
```

#### 如果你使用 `app.py`（Gradio/Streamlit）：

在 `main()` 開頭添加：

```python
import subprocess
import os

def init_git_sync():
    """Space 启动時同步 GitHub 狀態"""
    if os.getenv("GITHUB_TOKEN"):
        # 設定 git 認證
        subprocess.run(["git", "config", "--global", "url.https://${GITHUB_TOKEN}@github.com/.insteadOf", "git@github.com:"], check=False)
        # Pull 最新狀態
        subprocess.run(["bash", "/root/.openclaw/workspace/scripts/pull-github.sh"], check=False)

# 在應用程式啟動前呼叫
init_git_sync()
```

### 第四步：首次手動提交

在本地或一个新容器中运行：

```bash
cd /root/.openclaw/workspace

# 設定 remote（用你的 repo URL）
git remote add origin git@github.com:youruser/openclaw-workspace.git

# 初始提交
git add -A
git commit -m "Initial commit: OpenClaw workspace state"
git push -u origin master

# 設定使用者資訊（可選）
git config user.email "openclaw@huggingface.co"
git config user.name "OpenClaw Agent"
```

### 第五步：自動定期同步（可選）

在 `HEARTBEAT.md` 中添加定期 sync：

```markdown
# Heartbeat Tasks

- Run `scripts/sync-github.sh` after every agent turn (if memory modified)
- Check for merge conflicts and report if found
```

或者在 OpenClaw 設定中建立 cron job：

```bash
openclaw cron add "*/30 * * * *" "/root/.openclaw/workspace/scripts/sync-github.sh"
```

---

## 🔄 同步流程

### Startup（容器啟動）
```
HF Space → pull-github.sh → 恢復 MEMORY.md, memory/*.md 等
         → 啟動 OpenClaw gateway
```

### Runtime（運行中）
- Agent turn 結束後自動觸發 `sync-github.sh`
- 或 heartbeat 定時同步（每 30 分鐘）

### Shutdown（容器停止）
- 最後一次 sync 確保所有變更推送

---

## 🐛 常見問題

### Q: Merge conflict 怎麼辦？

A: `sync-github.sh` 預設使用 `--ours` 策略（保留本地變更）。  
如果發生衝突，腳本會：
1. 自動提交 merge resolution
2. Push 到 GitHub
3. 在 `HEARTBEAT.md` 或 log 中標記

### Q: 要不要同步 `agents/main/sessions/`？

A: 可選。
- **優點**：完整對話歷史備份
- **缺點**：很快就會很大（每天數 MB）
- 建議：**僅同步 `memory/` 和 `MEMORY.md`**，`sessions/` 定期打包壓縮後上傳

### Q: Push 失敗（auth error）？

A: 檢查：
```bash
echo $GITHUB_TOKEN | git push origin master
# 如果 token 無效，重新生成新的 PAT
```

### Q: 如何強制重新初始化？

```bash
cd /root/.openclaw/workspace
rm -rf .git
git init
git remote add origin <your-repo-url>
git add -A
git commit -m "Re-init"
git push -u origin master
```

---

## 📈 最佳實踐

1. **小步提交**：每次修改立刻 commit，避免大量衝突
2. **使用 branch**：開發時用 `feature/` branch，測試完 merge 到 master
3. **標記版本**：每月一次 tagged release（如 `v2026-02`）
4. **監控大小**：定期檢查 repo size，避免超過 GitHub limit（1GB）
5. **加密敏感資料**：如需備份 credentials，使用 git-crypt 或 sops

---

## 🎉 完成檢查清單

- [ ] 建立 GitHub private repo
- [ ] 產生 GITHUB_TOKEN 並加入 Space Secrets
- [ ] 更新 `.gitignore`
- [ ] 初始 commit 並 push 到 GitHub
- [ ] 測試 `pull-github.sh`（在空的容器中）
- [ ] 設定 Space entrypoint 呼叫 pull 腳本
- [ ] 測試 entire 流程（修改 → sync → 重新部署 → 恢復）

---

完成後，你的 OpenClaw 狀態將在 HF Spaces 的生命週期之外永久保存！