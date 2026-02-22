import { tool } from '@openclaw/tools';

export const notebookLmGenerate = tool({
  name: 'notebooklm.generate',
  description: '自動生成地震學教材與筆記 (NotebookLM 風格)',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '教材主題，例如：斷層帶類型、地震波傳播、預警系統原理'
      },
      level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: '學生程度'
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: '資料來源列表（可選）'
      },
      includeQuiz: {
        type: 'boolean',
        description: '是否包含測驗題，預設 true'
      },
      format: {
        type: 'string',
        enum: ['markdown', 'html'],
        description: '輸出格式，預設 markdown'
      }
    },
    required: ['topic']
  }
}, async ({ topic, level = 'intermediate', sources = [], includeQuiz = true, format = 'markdown' }) => {
  // _template 基底教材內容 (模仿 NotebookLM 的結構化筆記)
  const templates: Record<string, any> = {
    '斷層帶類型': {
      beginner: {
        outline: [
          '什麼是斷層？',
          '三種主要斷層類型：正斷層、逆斷層、平移斷層',
          '如何辨識地表特徵'
        ],
        content: `
## 簡介
斷層是地殼中的破裂面，兩側岩層發生相對位移。

## 三種基本類型

### 1. 正斷層 (Normal Fault)
- **運動方式**：上盤向下滑動
- **應力類型**：張力
- **例子**：台灣東部海岸山脈

### 2. 逆斷層 (Reverse/Thrust Fault)
- **運動方式**：上盤向上推移
- **應力類型**：壓縮力
- **例子**：中央山脈

### 3. 平移斷層 (Strike-slip Fault)
- **運動方式**：水平相對運動
- **應力類型**：剪切力
- **例子**：車籠埔斷層（部分水平分量）
`
      },
      intermediate: {
        outline: [
          '斷層幾何: 傾角、走向',
          '應力與應變關係',
          '板塊邊界與斷層系統',
          '台灣斷層分布實例'
        ],
        content: `
## 斷層幾何學
- **走向** (strike): 斷層面與水平面的交線方向
- **傾角** (dip): 斷層面與水平面的夾角
- **滑移矢量** (slip vector): 相對運動方向

## 應力狀態
- 最大主應力 (σ₁) → 逆斷層
- 最小主應力 (σ₃) → 正斷層
- 中間主應力 (σ₂) → 平移斷層

## 台灣案例
1. **車籠埔斷層**：右平移 + 逆移 (1999 年 921 地震)
2. **奇美斷層**：逆移斷層
3. **慮 Guadalupe 斷層系統**：複雜的交集構造
`
      },
      advanced: {
        outline: [
          '斷層带的流變學',
          '應力降與能量釋放',
          '斷層鎖固與蠕滑',
          '數值模擬: 有限元素分析'
        ],
        content: `
## 流變學模型
斷層带的強度服從Mohr-Coulomb准则：
τ = μσ_n + C

## 應力降 (Stress Drop)
Δτ ≈ (7/16) * Δσ * (Δu / r_0)  // Eshelby 理論

## 鎖固區段 (Patch)
- Asperity: 高强度、大耦合區域
- Stable sliding: 弱區、蠕滑產生
- 前震序列與主震的空間關聯

## 模擬工具
- PyGMT 繪製斷層幾何
- SpecFEM 模擬波動傳播
- OFFICER 斷層動力學
`
      }
    },
    '地震波傳播': {
      beginner: {
        outline: ['P波 vs S波', '地震波Hostname', '252如何抵達全球'],
        content: `
## P波 (Primary)
- 壓縮波，最先抵達
- 速度: ~6 km/s (地殼)
- 可通過固體、液體、氣體

## S波 (Secondary)
- 剪波，第二個抵達
- 速度: ~3.5 km/s
- 僅可通過固體

## 表面波 (Surface Waves)
- Love波 & Rayleigh波
- 速度較慢，但振幅大、破壞力強
`
      },
      intermediate: {
        outline: ['走時曲線', '震相識別', '深度與波速結構'],
        content: `
## 走時曲線 (Travel-Time Curve)
- 計算地震波走時與距離的關係
- pygmt.plot_ttcurve() 可繪製

## 震相 (Phases)
- P, S, PKP, SKS, etc.
- 利用震相反推震源
`
      },
      advanced: {
        outline: ['全波形反演', '三維速度結構', ' attenuation Q'],
        content: `
## 全波形反演 (FWI)
- adjoint method
- 梯度下降優化

## 各向異性
- 裂隙效應
- 板塊構造

## 衰减 (Attenuation)
- Q值反演
- 應變相關衰減
`
      }
    }
  };

  const levelTemplate = templates[topic]?.[level] || {
    outline: ['建立新教材'],
    content: `## ${topic}\n\n請參考地震學標準教科書內容，並整合最新研究成果。`
  };

  // quiz 生成
  let quiz = [];
  if (includeQuiz) {
    const qMap: Record<string, any[]> = {
      '斷層帶類型': [
        { question: '正斷層的上盤運動方向是？', options: ['向上', '向下', '水平'], answer: 1 },
        { question: '平移斷層的應力類型是？', options: ['張力', '壓縮', '剪切'], answer: 2 }
      ],
      '地震波傳播': [
        { question: 'P波速度约为？', options: ['3.5 km/s', '6 km/s', '8 km/s'], answer: 1 },
        { question: 'S波無法通過？', options: ['固體', '液體', '地殼'], answer: 1 }
      ]
    };
    quiz = qMap[topic] || [
      { question: `${topic} 的核心概念是什麼？`, options: ['A', 'B', 'C', 'D'], answer: 0 }
    ];
  }

  // 格式輸出
  let markdown = `# ${topic}\n\n**難度：${level}**\n\n## 學習目標\n\n`;
  for (const item of levelTemplate.outline) {
    markdown += `- ${item}\n`;
  }
  markdown += `\n## 內容\n\n${levelTemplate.content}\n`;

  if (quiz.length > 0) {
    markdown += `\n## 課堂測驗\n\n`;
    quiz.forEach((q, i) => {
      markdown += `${i+1}. **${q.question}**\n`;
      q.options.forEach((opt: string, j: number) => {
        markdown += `   ${String.fromCharCode(65+j)}. ${opt}\n`;
      });
      markdown += `   *(答案: ${String.fromCharCode(65+q.answer)})\n\n`;
    });
  }

  if (sources.length > 0) {
    markdown += `\n## 參考資料\n\n`;
    sources.forEach(src => markdown += `- ${src}\n`);
  }

  return {
    markdown,
    quiz,
    topic,
    level,
    format
  };
});