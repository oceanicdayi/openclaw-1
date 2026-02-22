#!/usr/bin/env bash
# 部署 Earthquake AI Skill 到 HuggingFace Space
# 用法: ./deploy-to-hf.sh <space-name> [region]
#  Example: ./deploy-to-hf.sh dayi-earthquake "[119,123,21,26]"

set -e

SPACE_NAME="${1:-earthquake-ai-demo}"
REGION="${2:-[119,123,21,26]}"
HF_TOKEN="${HUGGINGFACE_TOKEN}"

if [ -z "$HF_TOKEN" ]; then
  echo "❌ 請先設定 HUGGINGFACE_TOKEN 環境變數"
  exit 1
fi

echo "🌍 部署到 HuggingFace Space: $SPACE_NAME"

# 克隆或建立 Space repo
if git ls-remote -h "https://huggingface.co/spaces/$SPACE_NAME" &>/dev/null; then
  echo "📂 Space 已存在，克隆..."
  git clone "https://huggingface.co/spaces/$SPACE_NAME" hf-space
else
  echo "🆕 建立新 Space..."
  curl -X POST "https://huggingface.co/api/spaces/$SPACE_NAME" \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sdk":"gradio","hardware":"cpu-basic"}'
  git clone "https://huggingface.co/spaces/$SPACE_NAME" hf-space
fi

cd hf-space

# 放置檔案
cp ../huggingface-space/app.py ./app.py
cp ../huggingface-space/requirements.txt ./requirements.txt

# 自訂 region (可選)
if [ "$REGION" != "[119,123,21,26]" ]; then
  sed -i "s/region = \[119, 123, 21, 26\]/region = $REGION/g" app.py
fi

git add .
git commit -m "Deploy Earthquake AI Skill v1"
git push origin main

echo "✅ 部署完成！"
echo "🔗 Space URL: https://huggingface.co/spaces/$SPACE_NAME"