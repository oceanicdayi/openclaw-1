import { tool } from '@openclaw/tools';

// 動態載入 Google Gemini SDK（不硬性依賴）
let genai: any = null;
async function loadGemini() {
  if (!genai) {
    try {
      const module = await import('google-generativeai');
      genai = module.GoogleGenerativeAI;
    } catch (e) {
      throw new Error('Gemini SDK 未安裝。請執行: pip install google-generativeai');
    }
  }
  return genai;
}

export const geminiExplain = tool({
  name: 'gemini.explain',
  description: '使用 Gemini AI 解釋地震現象或分析數據',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: '學生的提問（中文或英文）'
      },
      context: {
        type: 'string',
        description: '相關數據或圖表描述（可選）'
      },
      level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: '解釋深度，預設 intermediate'
      },
      language: {
        type: 'string',
        enum: ['zh-TW', 'zh-CN', 'en'],
        description: '回傳語言，預設 zh-TW'
      }
    },
    required: ['question']
  }
}, async ({ question, context = '', level = 'intermediate', language = 'zh-TW' }) => {
  const GoogleGenerativeAI = await loadGemini();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未設定。請在環境變數中設定。');
  }

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
你是一位地震學專家，請用 ${language} 以 ${level} 程度回答。

問題：${question}

背景資料：
${context || '無額外資料'}

請：
1. 提供清晰、準確的解釋
2. 使用恰當的專業術語
3. 必要時提供圖表建議
4. 保持教學導向
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const answer = response.text();

  return {
    answer: answer.trim(),
    model: 'gemini-1.5-pro',
    level,
    language
  };
});