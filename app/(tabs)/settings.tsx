import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { generateCSV, clearAllData } from '@/lib/storage';

/**
 * 設定画面
 * CSVエクスポート、データ削除、アプリ情報
 */
export default function SettingsScreen() {
  const colors = useColors();
  const [isExporting, setIsExporting] = useState(false);

  // CSVエクスポート
  const handleExportCSV = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // CSVデータを生成
      const csvData = await generateCSV();

      if (!csvData || csvData.split('\n').length <= 1) {
        Alert.alert('エクスポート', 'エクスポートするデータがありません');
        return;
      }

      // ファイルに保存
      const fileName = `kakeibo_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 共有
      await Share.share({
        url: fileUri,
        message: `家計簿データをエクスポートしました: ${fileName}`,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('エクスポート完了', `${fileName} を保存しました`);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('エラー', 'エクスポートに失敗しました');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // 全データ削除
  const handleClearAllData = () => {
    Alert.alert(
      '全データ削除',
      'すべての家計簿データを削除します。この操作は取り消せません。本当に削除しますか?',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              Alert.alert('削除完了', 'すべてのデータを削除しました');
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('エラー', 'データの削除に失敗しました');

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-foreground">設定</Text>
            <Text className="text-base text-muted">アプリの設定と管理</Text>
          </View>

          {/* データ管理セクション */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">データ管理</Text>

            {/* CSVエクスポート */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 12,
                marginBottom: 12,
              }}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <Text className="text-background text-center font-semibold">
                {isExporting ? 'エクスポート中...' : 'CSVエクスポート'}
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-muted mb-4">
              家計簿データをCSV形式でエクスポートします。PCなどで詳細な分析を行う際にご利用ください。
            </Text>

            {/* 全データ削除 */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.error,
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 12,
              }}
              onPress={handleClearAllData}
            >
              <Text className="text-white text-center font-semibold">全データ削除</Text>
            </TouchableOpacity>

            <Text className="text-xs text-muted mt-2">
              すべての家計簿データを削除します。この操作は取り消せません。
            </Text>
          </View>

          {/* アプリ情報セクション */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">アプリ情報</Text>

            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">アプリ名</Text>
                <Text className="text-sm text-foreground font-semibold">Kakeibo Lens</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">バージョン</Text>
                <Text className="text-sm text-foreground font-semibold">1.0.0</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">開発</Text>
                <Text className="text-sm text-foreground font-semibold">Manus</Text>
              </View>
            </View>
          </View>

          {/* 使い方セクション */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">使い方</Text>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1">1. 家計簿をスキャン</Text>
                <Text className="text-xs text-muted">
                  「スキャン」タブから手書き家計簿を撮影します。AIが自動的に日付・項目・金額を認識します。
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-1">2. データを確認</Text>
                <Text className="text-xs text-muted">
                  「ホーム」タブで今月の支出総額とカテゴリ別サマリーを確認できます。
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-1">3. 分析を見る</Text>
                <Text className="text-xs text-muted">
                  「分析」タブでカテゴリ別円グラフや月ごとの支出推移グラフを確認できます。
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-1">4. データをエクスポート</Text>
                <Text className="text-xs text-muted">
                  CSVエクスポート機能で、PCなどで詳細な分析を行うことができます。
                </Text>
              </View>
            </View>
          </View>

          {/* プライバシーセクション */}
          <View className="w-full bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">プライバシー</Text>

            <Text className="text-sm text-muted leading-relaxed">
              Kakeibo Lensは、ユーザーのプライバシーを重視しています。
              すべての家計簿データは端末内に保存され、外部サーバーには送信されません。
              AI解析時のみ、画像データが一時的にサーバーに送信されますが、解析後すぐに削除されます。
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
