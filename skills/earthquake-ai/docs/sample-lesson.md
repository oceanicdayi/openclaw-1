# 地震波傳播（中階程度）

> 這是一個由 AI 自動生成的教材示範

## 📚 學習目標

1. 理解 P 波與 S 波的物理特性
2. 認識走時曲線的概念與用途
3. 了解波速結構如何影響地震定位

---

## 1. P 波與 S 波

### 1.1 基本差異

| 特性 | P波 (Primary) | S波 (Secondary) |
|------|---------------|-----------------|
| **粒子運動** | 傳播方向平行震動（壓縮波） | 傳播方向垂直震動（剪切波） |
| **速度** | ~6 – 8 km/s | ~3.5 – 4.5 km/s |
| **穿透性** | 固體、液體、氣體 | 僅固體 |
| **到達順序** | 最先抵達 | 第二個抵達 |
| **破壞性** | 較小 | 較大（尤其水平分量） |

### 1.2 物理公式

P波速度：Vp = √[(K + 4μ/3) / ρ]

S波速度：Vs = √[μ / ρ]

其中：
- K = 體積模數
- μ = 剪切模數
- ρ = 密度

由於 μ 在液體中為 0，S波無法通過液态外核。

---

## 2. 走時曲線 (Travel-Time Curve)

### 2.1 什麼是走時曲線？

走時曲線是地震波**傳播距離**與**所需時間**之間的關係圖。

### 2.2 PyGMT 繪圖範例

```python
import pygmt
import numpy as np

# 距離 (km)
dist = np.arange(0, 2000, 50)
# P波 (速度 ~6 km/s), S波 (~3.5 km/s)
vp, vs = 6.0, 3.5
p_time = dist / vp
s_time = dist / vs

fig = pygmt.Figure()
fig.plot(x=dist, y=p_time, pen='2p,blue', label='P-wave')
fig.plot(x=dist, y=s_time, pen='2p,red', label='S-wave')
fig.legend(position='JTR')
fig.savefig('ttcurve.png')
```

## 3. 課堂測驗

1. **P波與S波的主要粒子運動差異是？**
   - A. 完全相同
   - B. P波平行傳播方向，S波垂直
   - C. P波垂直傳播方向，S波平行
   - D. 無法比較

2. **S波無法通過什麼介质？**
   - A. 固體
   - B. 液體
   - C. 氣體
   - D. 真空

3. **走時曲線描述的是？**
   - A. 震央規模與距離
   - B. 地震波時間與距離關係
   - C. 深度與波速
   - D. 震源時間函數

*答案：1-B, 2-B, 3-B*

---

## 4. 延伸閱讀

- USGS Glossary: [P Waves](https://www.usgs.gov/...)
- Shearer, P. M. (2009). *Introduction to Seismology*.
- PyGMT 官方文件: https://www.pygmt.org

---

> 本教材由地動先知 AI 自動生成，整合 USGS 數據與 PyGMT 可視化。