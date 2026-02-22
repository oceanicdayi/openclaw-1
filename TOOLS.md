# Token 節省指南

_Compiled from best practices for OpenClaw agent usage_

## 🔍 基本原則

Token 是 AI 模型的「思考貨幣」，每一次對話都會消耗上下文空間。以下策略可以顯著降低 token 使用量。

---

## 📊 實際節省技巧

### 1. **精確控制記憶體存取**

**Problem:** 每次都讀取整個 `MEMORY.md` 或大檔案會耗費大量 token。

**Solution:**
- 使用 `memory_search` 先語義搜尋，再用 `memory_get` 只取 needed lines
- 範例：
  ```javascript
  // ✅ Good
  const results = await memory_search("地震預警系統需求");
  if (results.length > 0) {
    const snippet = await memory_get(results[0].path, { from: results[0].from, lines: 5 });
  }
  // ❌ Bad - read entire MEMORY.md every time
  ```

### 2. **善用文件結構化**

**Problem:** 大型綜合文件（如 `MEMORY.md`）隨著時間增長，每次讀取都沉重。

**Solution:**
- 将記憶體拆分為多個小文件：`memory/people.md`, `memory/projects/earthquake-ai.md`, `memory/decisions/2025-*.md`
- 保持每個文件 < 100 行
- 在需要時才讀取特定文件

### 3. **避免冗長對話**

**Problem:** LLM 會將整個對話历史都放在上下文裡，長的聊天-costly。

**Solution:**
- 每個工作日結束時，整理重要資訊存入 `MEMORY.md`，然後開始新對話
- 复杂任务使用 `sessions_spawn` 建立子代理，避免污染主對話歷史
- 問題解决後，用 `memory_search` + `memory_get` 取得關鍵資訊，而非回溯整段對話

### 4. **工具呼叫的效率**

**Problem:** 每次 tool call 都會產生 estrutured output（JSON 格式描述）。

**Solution:**
- 批次處理：一次 exec 多個命令，而非分散呼叫
  ```javascript
  // ✅ batch
  await exec("command1 && command2");
  // ❌ separate
  await exec("command1");
  await exec("command2");
  ```
- 避免不必要的 `web_fetch`；如果需要提取純文本，使用 `extractMode=text` 而非 `markdown`

### 5. **模型選擇**

**Problem:** 使用過強的模型（如 GPT-4o, Claude 3 Opus）處理簡單任務。

**Solution:**
- 查詢情報、簡單任務：用 `step-3.5-flash` 或 `gemini-2.0-flash`
- 複雜推理、創意寫作：才切換到強模型
- 可透過 `/status` 設定 per-session model override

### 6. **心跳檢查（Heartbeat）最佳化**

**Problem:** 頻繁的 heartbeat 會累積 token。

**Solution:**
- `HEARTBEAT.md` 每次只檢查 2-4 件事
- 使用 `memory/heartbeat-state.json` 記錄上次檢查時間，避免重複操作
- 深夜（23:00-08:00）靜音，除非緊急

### 7. **Web 搜尋與浏览**

**Problem:** `web_search` 返回 10 個結果的 titile+URL+snippet 就已經不少 token。

**Solution:**
- 先語義化搜尋，只取需要的資料
- 需詳細內容才用 `web_fetch`
- 使用 `maxChars` 限制回傳長度

---

## 📈 監控與度量

- `openclaw status` 可以看到本次會話的 context 使用量（0/256k）
- 每次 run 後檢查 `session_status` 中的 cost 資訊（如有）
- 定期Review `memory/YYYY-MM-DD.md` 的大小

---

## 🎯 我的承諾

作為你的 AI 助手，我會：
- 先讀取必要的記憶體片段，而非全部
- 爭取一次对话解决問題，減少追問
- 使用合适的模型層級
- 在回覆中保持專業 but concise

如果你發現我的對話歷史變得過長，隨時提醒我「請總結並寫入 MEMORY.md，然後重新開始」！

---

_This file is a living document. Update as you learn more tricks._