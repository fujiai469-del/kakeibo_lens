# Kakeibo Lens - デプロイ手順

## Manusの組み込みデプロイ機能を使用（推奨）

このアプリは、Manusの組み込みデプロイ機能を使用して簡単にデプロイできます。

### 手順

1. **チェックポイントの作成**
   - 最新の変更がチェックポイントとして保存されていることを確認してください
   - チェックポイントが作成されると、UIに「Publish」ボタンが表示されます

2. **Publishボタンをクリック**
   - ManusのUIの右上にある「Publish」ボタンをクリックします
   - モバイルアプリ（Web版）とAPIサーバーの両方が自動的にデプロイされます

3. **デプロイ完了**
   - デプロイが完了すると、公開URLが表示されます
   - このURLをブラウザで開くと、Webアプリにアクセスできます

### デプロイ後の確認事項

- ✅ Webアプリが正常に表示されること
- ✅ スキャン画面で画像を選択できること
- ✅ AI解析が正常に動作すること
- ✅ データが正しく保存されること
- ✅ ホーム画面と分析画面でデータが表示されること

### 注意事項

- **Web環境の制限**: Web環境ではカメラプレビューが使用できないため、画像選択のみ対応しています
- **データ保存**: Web環境ではブラウザのLocalStorage（AsyncStorage）を使用してデータを保存します
- **AI解析**: サーバー側のGPT-4o Vision APIを使用して画像を解析します

---

## 代替方法: Git + Vercel（手動設定）

手動でGit/Vercelにデプロイする場合は、以下の手順を参照してください。

### 1. GitHubリポジトリの作成

```bash
# プロジェクトディレクトリに移動
cd /home/ubuntu/kakeibo_lens

# Gitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: Kakeibo Lens v1.2"

# GitHubリポジトリを作成してリモートを追加
# （GitHubでリポジトリを作成後）
git remote add origin https://github.com/YOUR_USERNAME/kakeibo-lens.git
git branch -M main
git push -u origin main
```

### 2. Vercelでのデプロイ設定

1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. 以下の設定を行う:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm run build:web`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 3. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を追加:

```
EXPO_PUBLIC_API_BASE_URL=https://your-api-server.vercel.app
```

### 4. APIサーバーのデプロイ

APIサーバーは別途デプロイする必要があります:

```bash
# サーバー用のビルド
pnpm run build

# Vercelにデプロイ（サーバーレス関数として）
# または、別のホスティングサービス（Heroku、Railway等）を使用
```

### 制限事項

- Vercelの無料プランでは、サーバーレス関数の実行時間に制限があります（10秒）
- AI解析は時間がかかる場合があるため、タイムアウトする可能性があります
- そのため、**Manusの組み込みデプロイ機能を使用することを強く推奨します**

---

## トラブルシューティング

### AI解析エラーが発生する

- APIサーバーが正常に動作しているか確認してください
- ブラウザのコンソールでエラーメッセージを確認してください
- 環境変数`EXPO_PUBLIC_API_BASE_URL`が正しく設定されているか確認してください

### データが保存されない

- ブラウザのLocalStorageが有効になっているか確認してください
- プライベートブラウジングモードでは、LocalStorageが無効になっている場合があります

### 画像が選択できない

- ブラウザがファイル選択をサポートしているか確認してください
- HTTPSで接続していることを確認してください（一部のブラウザではHTTPでファイル選択が制限されます）

---

## サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください:

- ブラウザの種類とバージョン
- エラーメッセージ（ブラウザのコンソールログ）
- 実行した操作の詳細
