import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { analyzeKakeiboImage } from '@/lib/ai-analysis';
import { addEntry } from '@/lib/storage';
import { KakeiboEntry } from '@/types/kakeibo';

/**
 * スキャン画面
 * カメラで家計簿を撮影し、AI解析を実行
 */
export default function ScanScreen() {
  const colors = useColors();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // カメラ権限の確認
  if (!permission) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-foreground text-center mb-4">
          カメラへのアクセスが必要です
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text className="text-background font-semibold">許可する</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // カメラで撮影
  const handleTakePhoto = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        await analyzeImage(photo.uri);
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
    }
  };

  // ギャラリーから選択
  const handlePickImage = async () => {
    if (isAnalyzing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  // 画像を解析
  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);

    try {
      // AI解析を実行
      const result = await analyzeKakeiboImage(imageUri);

      if (result.entries.length === 0) {
        Alert.alert('解析結果', '家計簿のデータが見つかりませんでした。もう一度お試しください。');
        setIsAnalyzing(false);
        return;
      }

      // 解析結果を保存
      for (const entry of result.entries) {
        const kakeiboEntry: KakeiboEntry = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date,
          itemName: entry.itemName,
          amount: entry.amount,
          categoryId: 'default_0', // デフォルトカテゴリ（後で修正可能）
          imageUri,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addEntry(kakeiboEntry);
      }

      // 成功のハプティックフィードバック
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // ホーム画面に戻る
      Alert.alert(
        '解析完了',
        `${result.entries.length}件のデータを保存しました`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('エラー', 'AI解析に失敗しました。インターネット接続を確認してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1">
        {/* カメラプレビュー */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        >
          {/* ガイドライン */}
          <View style={styles.guidelineContainer}>
            <View style={[styles.guideline, { borderColor: colors.primary }]} />
          </View>

          {/* コントロール */}
          <View style={styles.controlsContainer}>
            {/* ギャラリーボタン */}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={handlePickImage}
              disabled={isAnalyzing}
            >
              <Text className="text-white text-sm">ギャラリー</Text>
            </TouchableOpacity>

            {/* シャッターボタン */}
            {isAnalyzing ? (
              <View style={[styles.shutterButton, { backgroundColor: colors.primary }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.shutterButton, { backgroundColor: colors.primary }]}
                onPress={handleTakePhoto}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            )}

            {/* カメラ切り替えボタン */}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              disabled={isAnalyzing}
            >
              <Text className="text-white text-sm">切替</Text>
            </TouchableOpacity>
          </View>

          {/* 解析中のオーバーレイ */}
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-white text-lg mt-4">AI解析中...</Text>
              <Text className="text-white text-sm mt-2">しばらくお待ちください</Text>
            </View>
          )}
        </CameraView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  guidelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guideline: {
    width: '90%',
    height: '70%',
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
