# Git 初始化狀態 - 待辦清單

## ✅ 已完成

- [x] 建立 `.gitignore`（排除 credentials/, sessions/ 等）
- [x] 創建同步腳本：`scripts/pull-github.sh`、`scripts/sync-github.sh`
- [x] 整理所有核心狀態檔案（IDENTITY.md, USER.md, MEMORY.md, memory/）
- [x] 撰寫部署指南 `DEPLOYMENT_GUIDE.md`
- [x] 將所有檔案加到 git staging

## ⏳ 待完成（需要你執行）

### 1. 建立 GitHub Private Repository

1. 登入 GitHub → New Repository
2. 名稱：`openclaw-workspace`（或自定）
3. **不要**勾選 Initialize with README
4. 創建後複製 URL（SSH 或 HTTPS）

### 2. 設定 remote 並首次 push

```bash
cd /root/.openclaw/workspace

# 添加 remote（替換成你的 repo URL）
git remote add origin git@github.com:你的帳號/openclaw-workspace.git
# 或 HTTPS:
# git remote add origin https://github.com/你的帳號/openclaw-workspace.git

# 設定使用者資訊（ optional）
git config user.email "your-email@example.com"
git config user.name "Dayi"

# 首次提交
git commit -m "Initial: OpenClaw workspace with GitHub sync setup"
git push -u origin master
```

### 3. 產生 GitHub Token 並加入 Hugging Face Secrets

在 Hugging Face Space Settings → Repository secrets：

| Secret Name      | Value                                                         |
|------------------|---------------------------------------------------------------|
| `GITHUB_TOKEN`   | [你的 GitHub PAT with `repo` scope]                           |
| `GIT_SYNC_ENABLED` | `true` (可選，預設已啟用)                                  |
| `GIT_REMOTE_URL` | `git@github.com:你的帳號/openclaw-workspace.git`（可選）     |

### 4. 修改 Space 部署配置

根據你的 Space 類型（Docker/Gradio/Streamlit），按照 `DEPLOYMENT_GUIDE.md` 步驟修改：
- 如果是 Docker：修改 `Dockerfile` + `entrypoint.sh`
- 如果是 Python app：在 `app.py` 開頭呼叫 `pull-github.sh`

### 5. 測試同步循環

1. Push 後，重啟 Space（或重新部署）
2. Space 啟動時自動 `git pull`
3. 修改某些檔案（如新增 `memory/2026-02-23.md`）
4. 檢查是否自動 `git push`（或手動執行 `scripts/sync-github.sh`）

---

## 🎯 檢查點

完成後應看到：

```bash
$ git log --oneline
abc123 Initial: OpenClaw workspace with GitHub sync setup

$ git remote -v
origin  git@github.com:youruser/openclaw-workspace.git (fetch)
origin  git@github.com:youruser/openclaw-workspace.git (push)
```

Space 重啟後，`MEMORY.md` 和 `memory/` 應該能從 GitHub 恢復。

---

需要我幫你检查当前的状态，或协助完成某个具体步骤吗？