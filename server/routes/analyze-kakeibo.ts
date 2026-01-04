/**
 * AI解析APIエンドポイント
 * 手書き家計簿の画像を解析してJSON形式で返す
 */

import { Router } from 'express';
import { invokeLLM } from '../_core/llm.js';

const router = Router();

router.post('/analyze-kakeibo', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: '画像データが必要です' });
    }

    // GPT-4o Visionで画像を解析
    const prompt = `
あなたは手書き家計簿の画像を解析するAIアシスタントです。
画像から以下の情報を抽出し、JSON形式で返してください。

抽出する情報:
- 日付（YYYY-MM-DD形式）
- 項目名（摘要）
- 金額（数値のみ、カンマなし）
- カテゴリ（食費、日用品、交通費、娯楽、医療費、教育費、光熱費、通信費、その他のいずれか）

JSON形式の例:
{
  "entries": [
    {
      "date": "2026-01-04",
      "itemName": "スーパーで買い物",
      "amount": 3500,
      "suggestedCategory": "食費"
    },
    {
      "date": "2026-01-04",
      "itemName": "電車代",
      "amount": 500,
      "suggestedCategory": "交通費"
    }
  ],
  "confidence": 0.85
}

注意事項:
- 日付が不明な場合は、今日の日付を使用してください
- 金額が不明確な場合は、最も可能性の高い数値を推測してください
- カテゴリが不明な場合は「その他」を使用してください
- 複数の項目がある場合は、すべて抽出してください
- 信頼度（confidence）は0から1の間の数値で、解析の確実性を表します

画像を解析して、JSON形式で結果を返してください。
`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      responseFormat: { type: 'json_object' },
    });

    // レスポンスからJSONを抽出
    const messageContent = response.choices[0]?.message?.content;
    let content = '';
    
    if (typeof messageContent === 'string') {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      // 配列の場合、テキストパートを結合
      content = messageContent
        .filter((part) => part.type === 'text')
        .map((part) => (part as any).text)
        .join('');
    }
    
    // JSONブロックを抽出（```json ... ```の形式に対応）
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

    // 結果を返す
    res.json(result);
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      error: 'AI解析中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
