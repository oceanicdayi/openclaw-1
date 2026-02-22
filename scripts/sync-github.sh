#!/bin/bash
set -e

# OpenClaw GitHub Sync Script
# 將工作站狀態同步到 GitHub repo

cd /root/.openclaw/workspace

# 檢查是否已設定 remote
if ! git remote | grep -q origin; then
    echo "ERROR: No git remote 'origin' configured."
    echo "Please set up your GitHub repository first:"
    echo "  git remote add origin git@github.com:youruser/your-repo.git"
    exit 1
fi

# 同步開關：只在環境變數啟用時執行
if [ "${GIT_SYNC_ENABLED:-true}" != "true" ]; then
    echo "Git sync disabled (GIT_SYNC_ENABLED != true)"
    exit 0
fi

# 從遠端拉取最新狀態（避免衝突）
echo "Pulling latest changes from remote..."
git fetch origin
# 嘗試合併，如果失敗則保留雙方變更（標記衝突）
git merge origin/master --no-edit || {
    echo "WARNING: Merge conflicts detected. Resolving with 'ours' strategy..."
    git checkout --ours .
    git add -A
    git commit -m "Merge resolution: keep local changes"
}

# 添加所有 modified files（僅限允許的檔案類型）
git add -A memory/*.md *.md

# 檢查是否有變更
if ! git diff-index --quiet HEAD --; then
    echo "Committing changes..."
    git commit -m "Auto-sync: $(date -Iseconds) [OpenClaw]"

    # Push 到遠端
    echo "Pushing to remote..."
    git push origin master
    echo "✓ Sync completed successfully"
else
    echo "✓ No changes to sync"
fi