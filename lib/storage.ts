/**
 * Kakeibo Lens - Local Storage Management
 * AsyncStorageを使用したデータ永続化
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { KakeiboEntry, Category, DEFAULT_CATEGORIES } from '@/types/kakeibo';

// Storage Keys
const STORAGE_KEYS = {
  ENTRIES: '@kakeibo_lens:entries',
  CATEGORIES: '@kakeibo_lens:categories',
  LAST_SYNC: '@kakeibo_lens:last_sync',
} as const;

/**
 * 家計簿エントリーの保存
 */
export async function saveEntries(entries: KakeiboEntry[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(entries);
    await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, jsonValue);
  } catch (error) {
    console.error('Failed to save entries:', error);
    throw new Error('家計簿データの保存に失敗しました');
  }
}

/**
 * 家計簿エントリーの読み込み
 */
export async function loadEntries(): Promise<KakeiboEntry[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Failed to load entries:', error);
    return [];
  }
}

/**
 * 家計簿エントリーの追加
 */
export async function addEntry(entry: KakeiboEntry): Promise<void> {
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
}

/**
 * 家計簿エントリーの更新
 */
export async function updateEntry(id: string, updates: Partial<KakeiboEntry>): Promise<void> {
  const entries = await loadEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error('エントリーが見つかりません');
  }
  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveEntries(entries);
}

/**
 * 家計簿エントリーの削除
 */
export async function deleteEntry(id: string): Promise<void> {
  const entries = await loadEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await saveEntries(filtered);
}

/**
 * 指定月のエントリーを取得
 */
export async function getEntriesByMonth(year: number, month: number): Promise<KakeiboEntry[]> {
  const entries = await loadEntries();
  return entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month;
  });
}

/**
 * カテゴリの保存
 */
export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(categories);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, jsonValue);
  } catch (error) {
    console.error('Failed to save categories:', error);
    throw new Error('カテゴリの保存に失敗しました');
  }
}

/**
 * カテゴリの読み込み（初回はデフォルトカテゴリを作成）
 */
export async function loadCategories(): Promise<Category[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    } else {
      // 初回起動時はデフォルトカテゴリを作成
      const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `default_${index}`,
        createdAt: new Date().toISOString(),
      }));
      await saveCategories(defaultCategories);
      return defaultCategories;
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

/**
 * カテゴリの追加
 */
export async function addCategory(category: Category): Promise<void> {
  const categories = await loadCategories();
  categories.push(category);
  await saveCategories(categories);
}

/**
 * カテゴリの更新
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const categories = await loadCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('カテゴリが見つかりません');
  }
  categories[index] = { ...categories[index], ...updates };
  await saveCategories(categories);
}

/**
 * カテゴリの削除
 */
export async function deleteCategory(id: string): Promise<void> {
  const categories = await loadCategories();
  const filtered = categories.filter((c) => c.id !== id);
  await saveCategories(filtered);
}

/**
 * 全データの削除（設定画面から実行）
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ENTRIES,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw new Error('データの削除に失敗しました');
  }
}

/**
 * CSVエクスポート用のデータ生成
 */
export async function generateCSV(): Promise<string> {
  const entries = await loadEntries();
  const categories = await loadCategories();

  // カテゴリIDから名前へのマップを作成
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // CSVヘッダー
  let csv = '日付,項目名,金額,カテゴリ,メモ\n';

  // CSVデータ
  entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((entry) => {
      const categoryName = categoryMap.get(entry.categoryId) || 'その他';
      const note = entry.note || '';
      csv += `${entry.date},"${entry.itemName}",${entry.amount},"${categoryName}","${note}"\n`;
    });

  return csv;
}
