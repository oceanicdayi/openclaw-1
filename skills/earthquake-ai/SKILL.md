# Earthquake AI Skill

## Description
地震學 AI 助手，整合地震數據查詢、PyGMT 繪圖、Gemini AI 解釋、NotebookLM 教材生成等功能。專門用於地震學教學與研究支援。

## Features
- 📡 從 USGS/TAIGER 即時獲取地震數據
- 🗺️ 用 PyGMT 繪製地震分布圖、截面圖、走時曲線
- 🤖 Gemini AI 解釋地震現象與557數據分析
- 📚 自動生成地震學教材與筆記 (NotebookLM 風格)
- 🌐 一鍵部署 Gradio Web 应用到 HuggingFace Space
- 📊 地震目錄統計與可視化 (pandas + matplotlib)

## Tools

### 1. usgs.fetch
從 USGS 地震目錄取得數據。

**參數：**
```json
{
  "starttime": "ISO 8601 format, 例如 2024-01-01T00:00:00",
  "endtime": "ISO 8601 format, 例如 2024-01-02T00:00:00",
  "minmagnitude": 3.0,
  "region": "[xmin, xmax, ymin, ymax]",  // 可選，例如 [119, 123, 21, 26] 台灣
  "format": "geojson"  // 目前僅支援 geojson
}
```

**回傳：**
```json
{
  "count": 156,
  "earthquakes": [
    {
      "id": "us7000abcd",
      "properties": {
        "mag": 4.5,
        "place": "10km NE of Hualien, Taiwan",
        "time": 1704067200000,
        "coord": [121.5, 24.0]
      }
    }
  ]
}
```

**範例：**
```bash
openclaw agent --message "取得過去 24 小時台灣地區 M4.0 以上地震"
# 內部呼叫: usgs.fetch(starttime=..., endtime=..., minmagnitude=4.0, region=[119,123,21,26])
```

---

### 2. pygmt.plot
使用 PyGMT 繪製地圖與圖表。

**參數：**
```json
{
  "type": "map" | "cross_section" | "ttcurve" | "histogram",
  "data": "GeoJSON 格式地震資料 (來自 usgs.fetch)",
  "region": "[xmin, xmax, ymin, ymax]",
  "projection": "M4i"  // Mercator 投影
}
```

**回傳：**
```json
{
  "file_path": "/tmp/earthquake_map.png",
  "caption": "台灣地區過去 24 小時地震分布（M4.0+）"
}
```

**支援的圖表類型：**
- `map`: 地震分布圖（含海岸線、國界）
- `cross_section`: 深度-緯度/經度截面圖
- `ttcurve`: P波/S波走時曲線
- `histogram`: 震央規模分布直方圖

---

### 3. gemini.explain
使用 Gemini AI 解釋地震現象或分析數據。

**參數：**
```json
{
  "question": "學生的提問，例如：'什麼是走時曲線？'",
  "context": "相關數據或圖表描述（可選）"
}
```

**回傳：**
```json
{
  "answer": "Gemini 的解釋內容...",
  "sources": ["參考資料來源"]
}
```

**特色：**
- 根據 PyGMT 圖表提供視覺化解釋
- 適用於課堂問答、作業輔導
- 支援中文與英文

---

### 4. notebooklm.generate
自動生成地震學教材與筆記 (NotebookLM 風格)。

**參數：**
```json
{
  "topic": "教材主題，例如：'斷層帶類型'",
  "level": "beginner" | "intermediate" | "advanced",
  "sources": ["資料來源列表，可包含 usgs.fetch 結果"]
}
```

**回傳：**
```json
{
  "markdown": "# 斷層帶類型\n\n## 1. 正斷層...\n",
  "quiz": [
    { "question": "?", "options": ["A", "B"], "answer": "A" }
  ],
  "references": ["USGS Glossary", "地震學概論"]
}
```

---

### 5. huggingface.deploy
將地震學 Web App 部署到 HuggingFace Space。

**參數：**
```json
{
  "app_type": "gradio" | "streamlit",
  "app_file": "app.py 內容（Gradio 範例）",
  "requirements": "requirements.txt 內容",
  "name": "earthquake-ai-demo"
}
```

**回傳：**
```json
{
  "space_url": "https://huggingface.co/spaces/yourname/earthquake-ai-demo",
  "status": "deployed"
}
```

**內建 Gradio App 模板：**
```python
import gradio as gr
import pygmt
import requests

def plot_earthquakes(days):
    data = fetch_usgs(days)
    fig = pygmt.Figure()
    # 繪圖邏輯
    return "map.png"

interface = gr.Interface(fn=plot_earthquakes, inputs="slider", outputs="image")
```

---

### 6. stats.analyze
統計分析地震目錄。

**參數：**
```json
{
  "data": "GeoJSON 地震資料",
  "metrics": ["count", "magnitude_stats", "depth_distribution", "time_series"]
}
```

**回傳：**
```json
{
  "total_events": 156,
  "magnitude": { "min": 3.1, "max": 5.2, "mean": 3.8 },
  "depth_km": { "shallow": 120, "intermediate": 30, "deep": 6 },
  "timeline": {"dates": [...], "counts": [...]}
}
```

---

## Installation

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/oceanicdayi/earthquake-ai-skill.git earthquake-ai
openclaw skills install earthquake-ai
```

## Prerequisites

- Python 3.10+ (在執行環境中)
- `pip install pygmt pandas requests google-generativeai`
- API Keys:
  - `GEMINI_API_KEY` (Gemini AI)
  - `HUGGINGFACE_TOKEN` (deploy)
  - 可選: `TAIGER_API_KEY` (台灣數據)

## Usage Examples

```bash
# 1. 查詢最近地震
openclaw agent --message "昨天台灣附近 M4+ 地震有哪些？繪圖給我"

# 2. 生成教材
openclaw agent --message "用 NotebookLM 風格生成'地震波傳播'教材（中階）"

# 3. 部署 Web App
openclaw agent --message "把地震查詢功能部署到 HuggingFace"

# 4. 課堂問答
openclaw agent --message "學生問：'P波和S波有什麼不同？' 用簡單方式回答"
```

## Integration with OpenClaw

- 自動連接 Telegram/Discord 群組
- Cron 定時任務：每日 9:00 自動生成地震報告
- Webhook 接收即時地震預警
- Memory 記錄學生提問歷史以便追蹤

## Support

- Issues: https://github.com/oceanicdayi/earthquake-ai-skill/issues
- Docs: See `docs/` folder