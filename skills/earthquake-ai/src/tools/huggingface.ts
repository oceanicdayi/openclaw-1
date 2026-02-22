import { tool } from '@openclaw/tools';
import fetch from 'node-fetch';

export const huggingFaceDeploy = tool({
  name: 'huggingface.deploy',
  description: '將地震學 Web App 部署到 HuggingFace Space (Gradio/Streamlit)',
  parameters: {
    type: 'object',
    properties: {
      appType: {
        type: 'string',
        enum: ['gradio', 'streamlit'],
        description: 'App 框架類型'
      },
      appFile: {
        type: 'string',
        description: 'app.py 或 app.py 的完整程式碼內容'
      },
      requirements: {
        type: 'string',
        description: 'requirements.txt 內容（每行一個套件）'
      },
      name: {
        type: 'string',
        description: 'Space 名稱（唯一 ID，小寫、連字符）'
      },
      description: {
        type: 'string',
        description: 'Space 描述'
      },
      public: {
        type: 'boolean',
        description: '是否公開，預設 true'
      }
    },
    required: ['appType', 'appFile', 'name']
  }
}, async ({ appType, appFile, requirements = '', name, description = 'Earthquake AI Demo', public = true }) => {
  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) {
    throw new Error('HUGGINGFACE_TOKEN 未設定。請在 HuggingFace 帳戶設定中生成 access token。');
  }

  // HuggingFace API 端點
  const endpoint = `https://huggingface.co/api/spaces/${name}`;

  // Space 設定
  const spaceConfig = {
    title: name,
    sdk: appType === 'gradio' ? 'gradio' : 'streamlit',
    hardware: 'cpu-basic',
    secret: [],
    allowAppWrite: true,
    private: !public,
    description
  };

  // 1. 建立 Space
  const createRes = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(spaceConfig)
  });

  if (!createRes.ok && createRes.status !== 409) { // 409 表示已存在
    const err = await createRes.text();
    throw new Error(`建立 Space 失敗: ${createRes.status} ${err}`);
  }

  // 2. 上傳檔案到 Space 的 Git repository
  // 我們需要將檔案推送到 https://huggingface.co/spaces/{owner}/{space}/git
  const gitUrl = `https://huggingface.co/spaces/${name}`;

  // 簡化版部署回傳 HuggingFace Space URL
  // 實際部署需要完整 Git 流程，這裡提供範例架構
  // 真正的 production 建議在 CI/CD 中執行 git push

  const spaceUrl = `https://huggingface.co/spaces/${name}`;

  // 回傳 Gradio/Streamlit 範本
  const sampleGradioApp = `import gradio as gr
import pygmt
import requests
from datetime import datetime, timedelta

def fetch_usgs_recent(days=1, minmag=4.0):
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={start.isoformat()}&endtime={end.isoformat()}&minmagnitude={minmag}"
    r = requests.get(url)
    data = r.json()
    return data.get('features', [])

def plot_earthquake_map(eqs):
    import pygmt
    fig = pygmt.Figure()
    lons = [eq['geometry']['coordinates'][0] for eq in eqs]
    lats = [eq['geometry']['coordinates'][1] for eq in eqs]
    mags = [eq['properties']['mag'] for eq in eqs]
    # 簡單的中台灣範圍
    fig.coast(region=[119, 123, 21, 26], projection='M4i', frame=True, land='lightgray', water='lightblue')
    for lon, lat, mag in zip(lons, lats, mags):
        size = 0.1 + (mag - 3) * 0.2
        fig.plot(x=lon, y=lat, style=f'c{size}c', fill='red', pen='1p,black')
    return fig

def main():
    eqs = fetch_usgs_recent()
    if not eqs:
        return "No recent earthquakes found."

    fig = plot_earthquake_map(eqs)
    png_path = "/tmp/map.png"
    fig.savefig(png_path)
    return png_path

iface = gr.Interface(fn=main, inputs=[], outputs="image", title="Earthquake AI Demo")
iface.launch()
`;

  const sampleStreamlitApp = `import streamlit as st
import pygmt
import requests
from datetime import datetime, timedelta

st.title("Earthquake AI Demo")
days = st.slider("Past days", 1, 30, 1)
minmag = st.slider("Min magnitude", 3.0, 7.0, 4.0)

if st.button("Fetch & Plot"):
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={start.isoformat()}&endtime={end.isoformat()}&minmagnitude={minmag}"
    r = requests.get(url)
    data = r.json()
    eqs = data.get('features', [])
    st.write(f"Found {len(eqs)} events")
    if eqs:
        fig = pygmt.Figure()
        # ... 繪圖邏輯類似 Gradio 版
        st.pyplot(fig)
`;

  const recommendedRequirements = `pygmt>=0.10.0
requests>=2.31.0
google-generativeai>=0.5.0
numpy>=1.24.0
pandas>=2.0.0
`;

  const finalAppFile = appFile || (appType === 'gradio' ? sampleGradioApp : sampleStreamlitApp);
  const finalRequirements = requirements || recommendedRequirements;

  return {
    space_url: spaceUrl,
    status: 'created',
    message: `✅ Space ${name} 已建立！請使用 HuggingFace Git 推送:\n\n1. git clone ${gitUrl}.git\n2. 更新 app.py 與 requirements.txt\n3. git add . && git commit -m "init"\n4. git push\n\nSpace 網址: ${spaceUrl}\n\n預設範本已提供，您可自行修改。`,
    sample_files: {
      'app.py': finalAppFile,
      'requirements.txt': finalRequirements
    }
  };
});