import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { loadEntries, loadCategories, getEntriesByMonth } from '@/lib/storage';
import { KakeiboEntry, Category, MonthlySummary } from '@/types/kakeibo';

/**
 * ホーム画面
 * 今月の支出総額、カテゴリ別サマリー、最近のスキャン履歴を表示
 */
export default function HomeScreen() {
  const colors = useColors();
  const [entries, setEntries] = useState<KakeiboEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // データを読み込み
  const loadData = async () => {
    try {
      const [loadedEntries, loadedCategories] = await Promise.all([
        loadEntries(),
        loadCategories(),
      ]);

      setEntries(loadedEntries);
      setCategories(loadedCategories);

      // 今月のサマリーを計算
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const monthlyEntries = await getEntriesByMonth(currentYear, currentMonth);
      const summary = calculateMonthlySummary(monthlyEntries, loadedCategories, currentYear, currentMonth);
      setMonthlySummary(summary);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 月次サマリーを計算
  const calculateMonthlySummary = (
    entries: KakeiboEntry[],
    categories: Category[],
    year: number,
    month: number
  ): MonthlySummary => {
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    // カテゴリ別の集計
    const categoryMap = new Map<string, { name: string; color: string; amount: number }>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { name: cat.name, color: cat.color, amount: 0 });
    });

    entries.forEach((entry) => {
      const cat = categoryMap.get(entry.categoryId);
      if (cat) {
        cat.amount += entry.amount;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        categoryColor: data.color,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const daysInMonth = new Date(year, month, 0).getDate();
    const averageDailySpending = totalAmount / daysInMonth;

    return {
      year,
      month,
      totalAmount,
      categoryBreakdown,
      entryCount: entries.length,
      averageDailySpending,
    };
  };

  // 画面がフォーカスされたときにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 初回読み込み
  useEffect(() => {
    loadData();
  }, []);

  // リフレッシュ
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // スキャン画面へ遷移
  const handleScan = () => {
    router.push('/scan');
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold" style={{ color: colors.primary }}>
              Kakeibo Lens
            </Text>
            <Text className="text-base text-muted text-center">
              手書き家計簿をデジタルで管理
            </Text>
          </View>

          {/* 今月の支出総額 */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-sm text-muted mb-2">今月の支出総額</Text>
            <Text className="text-4xl font-bold text-foreground">
              ¥{monthlySummary?.totalAmount.toLocaleString() || '0'}
            </Text>
            <Text className="text-sm text-muted mt-2">
              {monthlySummary?.entryCount || 0}件の記録
            </Text>
          </View>

          {/* カテゴリ別サマリー */}
          {monthlySummary && monthlySummary.categoryBreakdown.length > 0 && (
            <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">カテゴリ別支出</Text>
              {monthlySummary.categoryBreakdown.slice(0, 5).map((item) => (
                <View key={item.categoryId} className="flex-row items-center mb-3">
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: item.categoryColor,
                      marginRight: 8,
                    }}
                  />
                  <Text className="flex-1 text-sm text-foreground">{item.categoryName}</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    ¥{item.amount.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-muted ml-2">
                    {item.percentage.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 最近のスキャン履歴 */}
          {entries.length > 0 && (
            <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">最近のスキャン</Text>
              {entries.slice(0, 3).map((entry) => {
                const category = categories.find((c) => c.id === entry.categoryId);
                return (
                  <View key={entry.id} className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{entry.itemName}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {entry.date} • {category?.name || 'その他'}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">
                      ¥{entry.amount.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* スキャンボタン */}
          <View className="items-center mt-4">
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 32,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={handleScan}
            >
              <Text className="text-background text-lg font-semibold">家計簿をスキャン</Text>
            </TouchableOpacity>
          </View>

          {/* 空の状態 */}
          {entries.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-lg text-muted text-center mb-4">
                まだデータがありません
              </Text>
              <Text className="text-sm text-muted text-center">
                「家計簿をスキャン」ボタンから{'\n'}手書き家計簿を撮影してください
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
