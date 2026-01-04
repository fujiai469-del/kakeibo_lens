import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { loadCategories, getEntriesByMonth } from '@/lib/storage';
import { Category, KakeiboEntry } from '@/types/kakeibo';

/**
 * 分析画面
 * カテゴリ別円グラフ、月ごとの支出推移グラフを表示
 */
export default function AnalyticsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get('window').width;
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [monthlyEntries, setMonthlyEntries] = useState<KakeiboEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データを読み込み
  const loadData = async () => {
    try {
      const [loadedCategories, entries] = await Promise.all([
        loadCategories(),
        getEntriesByMonth(currentYear, currentMonth),
      ]);

      setCategories(loadedCategories);
      setMonthlyEntries(entries);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 画面がフォーカスされたときにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentYear, currentMonth])
  );

  useEffect(() => {
    loadData();
  }, [currentYear, currentMonth]);

  // 前月へ
  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 次月へ
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // カテゴリ別集計
  const getCategoryData = () => {
    const categoryMap = new Map<string, { name: string; color: string; amount: number }>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { name: cat.name, color: cat.color, amount: 0 });
    });

    monthlyEntries.forEach((entry) => {
      const cat = categoryMap.get(entry.categoryId);
      if (cat) {
        cat.amount += entry.amount;
      }
    });

    return Array.from(categoryMap.values())
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  };

  // 円グラフデータ
  const pieChartData = getCategoryData().map((item) => ({
    name: item.name,
    amount: item.amount,
    color: item.color,
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  // 過去6ヶ月の支出推移データ
  const getMonthlyTrendData = async () => {
    const data = [];
    const labels = [];

    for (let i = 5; i >= 0; i--) {
      let year = currentYear;
      let month = currentMonth - i;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const entries = await getEntriesByMonth(year, month);
      const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

      data.push(total);
      labels.push(`${month}月`);
    }

    return { data, labels };
  };

  const [trendData, setTrendData] = useState<{ data: number[]; labels: string[] }>({
    data: [],
    labels: [],
  });

  useEffect(() => {
    getMonthlyTrendData().then(setTrendData);
  }, [currentYear, currentMonth]);

  const totalAmount = monthlyEntries.reduce((sum, entry) => sum + entry.amount, 0);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-foreground">支出分析</Text>
            <Text className="text-base text-muted">グラフで支出を可視化</Text>
          </View>

          {/* 月選択 */}
          <View className="flex-row items-center justify-between bg-surface rounded-2xl p-4 border border-border">
            <TouchableOpacity
              onPress={handlePreviousMonth}
              style={{
                backgroundColor: colors.primary,
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-background text-xl font-bold">←</Text>
            </TouchableOpacity>

            <Text className="text-xl font-bold text-foreground">
              {currentYear}年 {currentMonth}月
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={{
                backgroundColor: colors.primary,
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-background text-xl font-bold">→</Text>
            </TouchableOpacity>
          </View>

          {/* 支出総額 */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-sm text-muted mb-2">今月の支出総額</Text>
            <Text className="text-4xl font-bold text-foreground">
              ¥{totalAmount.toLocaleString()}
            </Text>
            <Text className="text-sm text-muted mt-2">{monthlyEntries.length}件の記録</Text>
          </View>

          {/* カテゴリ別円グラフ */}
          {pieChartData.length > 0 ? (
            <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">カテゴリ別支出</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          ) : (
            <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">カテゴリ別支出</Text>
              <Text className="text-sm text-muted text-center py-8">
                この月のデータがありません
              </Text>
            </View>
          )}

          {/* 月ごとの支出推移グラフ */}
          {trendData.data.length > 0 && trendData.data.some((v) => v > 0) && (
            <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">支出推移（過去6ヶ月）</Text>
              <BarChart
                data={{
                  labels: trendData.labels,
                  datasets: [
                    {
                      data: trendData.data,
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.foreground,
                  style: {
                    borderRadius: 16,
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                style={{
                  borderRadius: 16,
                }}
                yAxisLabel=""
                yAxisSuffix="円"
                fromZero
              />
            </View>
          )}

          {/* 空の状態 */}
          {monthlyEntries.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-lg text-muted text-center mb-4">
                この月のデータがありません
              </Text>
              <Text className="text-sm text-muted text-center">
                家計簿をスキャンして{'\n'}データを追加してください
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
