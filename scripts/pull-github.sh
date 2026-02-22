#!/bin/bash
set -e

# OpenClaw GitHub Pull Script
# 启动时从 GitHub 恢复状态

cd /root/.openclaw/workspace

# 檢查 remote
if ! git remote | grep -q origin; then
    echo "WARNING: No git remote configured. Skipping pull."
    exit 0
fi

echo "Pulling latest state from GitHub..."
git fetch origin

# 檢查是否有本地未提交的變更
if ! git diff-index --quiet HEAD --; then
    echo "WARNING: Local changes detected. Stashing temporarily..."
    git stash push -m "Pre-pull stash $(date -Iseconds)"
    STASHED=true
else
    STASHED=false
fi

# 拉取最新狀態
git pull origin master --no-edit || {
    echo "ERROR: Pull failed. Keeping local state."
    if [ "$STASHED" = "true" ]; then
        git stash pop || true
    fi
    exit 1
}

# 恢復 stash 的變更（如果有的話）
if [ "$STASHED" = "true" ]; then
    git stash pop || {
        echo "WARNING: Conflicts after pull. Local changes preserved in stash."
    }
fi

echo "✓ State restored from GitHub"