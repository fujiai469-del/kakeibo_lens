/**
 * Kakeibo Lens - Data Models
 */

/**
 * カテゴリ（支出の分類）
 */
export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
  icon?: string; // Optional icon name
  createdAt: string; // ISO 8601 date string
}

/**
 * 家計簿エントリー（1つの支出項目）
 */
export interface KakeiboEntry {
  id: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  itemName: string; // 項目名（摘要）
  amount: number; // 金額
  categoryId: string; // カテゴリID
  categoryName?: string; // カテゴリ名（表示用、オプション）
  note?: string; // メモ（オプション）
  imageUri?: string; // 撮影した画像のURI（オプション）
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * AI解析結果（GPT-4o Visionからの応答）
 */
export interface AIAnalysisResult {
  entries: Array<{
    date: string; // YYYY-MM-DD
    itemName: string;
    amount: number;
    suggestedCategory?: string; // AIが推測したカテゴリ名
  }>;
  confidence: number; // 0-1の信頼度スコア
  rawText?: string; // OCRで抽出された生テキスト（デバッグ用）
}

/**
 * 月次サマリー（分析画面用）
 */
export interface MonthlySummary {
  year: number;
  month: number; // 1-12
  totalAmount: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    amount: number;
    percentage: number; // 0-100
  }>;
  entryCount: number;
  averageDailySpending: number;
}

/**
 * 支出ハイライト（注意すべき支出）
 */
export interface SpendingHighlight {
  type: 'high_category' | 'high_day' | 'unusual_pattern';
  categoryId?: string;
  categoryName?: string;
  date?: string;
  amount: number;
  message: string; // ユーザーに表示するメッセージ
}

/**
 * デフォルトカテゴリ
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '食費', color: '#FF6B6B', icon: 'cart' },
  { name: '日用品', color: '#4ECDC4', icon: 'home' },
  { name: '交通費', color: '#45B7D1', icon: 'car' },
  { name: '娯楽', color: '#FFA07A', icon: 'game-controller' },
  { name: '医療費', color: '#98D8C8', icon: 'medical' },
  { name: '教育費', color: '#F7DC6F', icon: 'book' },
  { name: '光熱費', color: '#BB8FCE', icon: 'flash' },
  { name: '通信費', color: '#85C1E2', icon: 'phone-portrait' },
  { name: 'その他', color: '#95A5A6', icon: 'ellipsis-horizontal' },
];
