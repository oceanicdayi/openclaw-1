#!/usr/bin/env node
/**
 * Earthquake AI Skill Installation Script
 * 這個腳本會：
 * 1. 檢查 Node 依賴並編譯 TypeScript
 * 2. 檢查 Python 依賴（PyGMT, gemini SDK）
 * 3. 提示設定環境變數
 * 4. 註冊技能到 OpenClaw
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

console.log('🚀 地震學 AI 技能安裝程序開始...\n');

// 1. 檢查 Node 環境
console.log('📦 檢查 Node.js 依賴...');
try {
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Node 編譯完成\n');
} catch (e) {
  console.error('❌ npm install/build 失敗，請確認 Node.js 環境正常');
  process.exit(1);
}

// 2. 檢查 Python 依賴
console.log('🐍 檢查 Python 依賴 (PyGMT, google-generativeai)...');
try {
  // 嘗試 import 檢查
  execSync('python3 -c "import pygmt"', { stdio: 'ignore' });
  console.log('  ✅ pygmt 已安裝');
} catch {
  console.log('  ⚠️  pygmt 未安裝，建議執行: pip3 install pygmt');
}

try {
  execSync('python3 -c "import google.generativeai"', { stdio: 'ignore' });
  console.log('  ✅ google-generativeai 已安裝');
} catch {
  console.log('  ⚠️  google-generativeai 未安裝，建議執行: pip3 install google-generativeai');
}

console.log('');

// 3. 環境變數檢查
console.log('🔐 檢查環境變數...');
const requiredEnv = ['GEMINI_API_KEY', 'HUGGINGFACE_TOKEN'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.log(`  ⚠️  缺少環境變數: ${missingEnv.join(', ')}`);
  console.log('  建議在 ~/.openclaw/openclaw.json 的 "env" 區段或 shell profile 中設定。\n');
} else {
  console.log('  ✅ 環境變數已設定\n');
}

// 4. 提示 Webhook/Cron 設定
console.log('📅 建議的 Openclaw 整合設定：\n');
console.log(`
# ~/.openclaw/HEARTBEAT.md
# 每日早晨自動生成地震報告
- 0 9 * * * openclaw agent --message "昨日台灣地區 M4+ 地震摘要，附圖"

# ~/.openclaw/openclaw.json 新增 cron:
{
  "cron": {
    "jobs": [
      {
        "spec": "0 9 * * *",
        "command": "agent",
        "args": ["--message", "昨日台灣地區 M4+ 地震摘要，附圖"],
        "delivery": "telegram:YOUR_GROUP_ID"
      }
    ]
  }
}
`);

console.log('✅ 安裝完成！');
console.log('📖 使用方法請見 README.md');