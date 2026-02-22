"""
HuggingFace Space - Earthquake AI Demo
這個檔案是 HuggingFace Space 部署用的 Gradio App 範本
"""

import gradio as gr
import requests
from datetime import datetime, timedelta
import pygmt
import numpy as np

def fetch_usgs_earthquakes(days=1, minmag=4.0, region=None):
    """
    從 USGS 取得地震數據
    region: [lon_min, lon_max, lat_min, lat_max] (預設台灣附近)
    """
    if region is None:
        region = [119, 123, 21, 26]  # 台灣範圍

    end = datetime.utcnow()
    start = end - timedelta(days=days)

    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    params = {
        "format": "geojson",
        "starttime": start.isoformat(),
        "endtime": end.isoformat(),
        "minmagnitude": minmag,
        "minlongitude": region[0],
        "maxlongitude": region[1],
        "minlatitude": region[2],
        "maxlatitude": region[3],
        "limit": 1000
    }

    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        return [], f"USGS API error: {resp.status_code}"

    data = resp.json()
    return data.get('features', []), None

def create_earthquake_map(earthquakes):
    """
    使用 PyGMT 繪製地震分布圖
    """
    if not earthquakes:
        return None

    fig = pygmt.Figure()

    # 海岸線
    fig.coast(
        region=[119, 123, 21, 26],
        projection='M4i',
        frame=['a2', 'WSne'],
        land='lightgray',
        water='lightblue',
        borders=[1, 2]
    )

    # 地震點
    lons = [eq['geometry']['coordinates'][0] for eq in earthquakes]
    lats = [eq['geometry']['coordinates'][1] for eq in earthquakes]
    mags = [eq['properties']['mag'] for eq in earthquakes]

    # 用規模調整點大小
    sizes = [0.2 + (m - 2) * 0.3 for m in mags]

    # 畫出地震點
    fig.plot(
        x=lons,
        y=lats,
        size=sizes,
        style='cc',
        fill='red',
        pen='1p,black',
        transparency=30
    )

    # 加入圖例
    fig.legend(
        position='JTR+jTR+o0.2c',
        box=True,
        frame=True
    )

    return fig

def main(days=1, minmag=4.0):
    """
    主函數
    """
    earthquakes, error = fetch_usgs_earthquakes(days, minmag)

    if error:
        return f"❌ {error}", None

    if not earthquakes:
        return f"✅ 過去 {days} 天沒有找到 M{minmag}+ 的地震（台灣附近）", None

    count = len(earthquakes)
    msg = f"✅ 找到 {count} 個地震事件\n\n"
    for i, eq in enumerate(earthquakes[:5]):  # 顯示前 5 個
        mag = eq['properties']['mag']
        place = eq['properties']['place']
        time = datetime.fromtimestamp(eq['properties']['time']/1000).strftime('%m-%d %H:%M')
        msg += f"{i+1}. M{mag} - {place} ({time})\n"

    if count > 5:
        msg += f"... 還有 {count-5} 個事件\n"

    fig = create_earthquake_map(earthquakes)
    png_path = "/tmp/earthquake_map.png"
    fig.savefig(png_path)

    return msg, png_path

# Gradio Interface
demo = gr.Interface(
    fn=main,
    inputs=[
        gr.Slider(1, 30, value=1, label="過去天數"),
        gr.Slider(3.0, 7.0, value=4.0, step=0.1, label="最小規模")
    ],
    outputs=[
        gr.Textbox(label="地震列表"),
        gr.Image(label="分布圖")
    ],
    title="🌏 Earthquake AI Demo",
    description="查詢 USGS 台灣地區地震並繪製分布圖 (Powered by PyGMT)",
    theme=gr.themes.Soft()
)

if __name__ == "__main__":
    demo.launch()