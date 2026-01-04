/**
 * Kakeibo Lens - AI Analysis Service
 * GPT-4o Visionを使用した手書き家計簿の解析
 */

import { AIAnalysisResult } from '@/types/kakeibo';

/**
 * 画像をBase64エンコード
 */
async function imageToBase64(imageUri: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 手書き家計簿の画像を解析
 */
export async function analyzeKakeiboImage(imageUri: string): Promise<AIAnalysisResult> {
  try {
    // 画像をBase64エンコード
    const base64Image = await imageToBase64(imageUri);

    // サーバーのAI解析APIを呼び出し
    // EXPO_PUBLIC_API_BASE_URLを使用（開発環境と本番環境の両方に対応）
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/analyze-kakeibo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI解析に失敗しました: ${response.statusText}`);
    }

    const result = await response.json();
    return result as AIAnalysisResult;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('AI解析中にエラーが発生しました。もう一度お試しください。');
  }
}

/**
 * カテゴリ名の正規化（AIが推測したカテゴリ名をデフォルトカテゴリにマッピング）
 */
export function normalizeCategoryName(suggestedCategory: string | undefined): string {
  if (!suggestedCategory) return 'その他';

  const normalized = suggestedCategory.toLowerCase().trim();

  // カテゴリ名のマッピング
  const categoryMap: Record<string, string> = {
    '食費': '食費',
    '食事': '食費',
    '食料': '食費',
    '食材': '食費',
    '外食': '食費',
    '日用品': '日用品',
    '生活用品': '日用品',
    '雑貨': '日用品',
    '交通費': '交通費',
    '交通': '交通費',
    '電車': '交通費',
    'バス': '交通費',
    'タクシー': '交通費',
    'ガソリン': '交通費',
    '娯楽': '娯楽',
    '趣味': '娯楽',
    'レジャー': '娯楽',
    'エンタメ': '娯楽',
    '医療費': '医療費',
    '医療': '医療費',
    '病院': '医療費',
    '薬': '医療費',
    '教育費': '教育費',
    '教育': '教育費',
    '学費': '教育費',
    '書籍': '教育費',
    '光熱費': '光熱費',
    '電気': '光熱費',
    'ガス': '光熱費',
    '水道': '光熱費',
    '通信費': '通信費',
    '通信': '通信費',
    '電話': '通信費',
    'インターネット': '通信費',
    'その他': 'その他',
  };

  // 部分一致でマッピング
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'その他';
}
