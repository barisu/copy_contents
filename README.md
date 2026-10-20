# Quick Article Copy 📋

Mozilla の **Readability** を利用して、閲覧中のネット記事から本文のみを抽出し、**Markdown 形式でサクッとコピペできる Chrome 拡張機能 (Manifest V3)** です。

外部ライブラリ依存ゼロ・ビルドステップ不要の **Pure Vanilla JS** で作られているため、将来のライブラリ脆弱性の心配やメンテナンスコストがありません。

---

## ✨ 主な機能

- **一発コピー (ショートカットキー)**
  - `Alt + C` (Mac: `Option + C`) を押すだけで、画面遷移なしに即座に記事本文を Markdown でクリップボードにコピー。
  - 完了時に画面右上にスタイリッシュなトースト通知（「📋 Markdownをコピーしました！」）が表示されます。
- **ポップアップ UI**
  - 拡張機能アイコンをクリックすると、タイトル、ドメイン名、文字数、想定読了時間、プレビューを表示。
  - ワンクリックで Markdown コピー。
  - 「タイトルを含める」「URLを含める」トグル設定（状態は自動保存）。
- **右クリックメニュー (コンテキストメニュー)**
  - ページ上で右クリックし、「記事をMarkdownでコピー」からも一発コピー可能。
- **ゼロ依存・ゼロビルド**
  - `turndown` などの外部ライブラリは一切不使用。ブラウザ標準の DOM API のみを用いた自作の軽量パーサーで Markdown に変換。
  - TypeScript や Vite などのビルドツールも不要。

---

## 🚀 Chrome への導入手順

ビルド作業（`npm run build` など）は一切不要です！

1. Google Chrome を開き、URL バーに `chrome://extensions` と入力してアクセスします。
2. 画面右上にある **「デベロッパー モード」** を ON にします。
3. 画面左上の **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリックします。
4. このプロジェクトディレクトリ（`content_copy_extension`）をそのまま選択します。
5. ツールバーの拡張機能一覧からピン留めすれば完了です！

### ショートカットキーの変更
- ショートカットキー（デフォルト: `Alt + C`）を変更したい場合は、`chrome://extensions/shortcuts` にアクセスして自由に変更できます。

---

## 📄 ライセンス & クレジット

本プロジェクトは [MIT License](LICENSE) の下で公開されています。

### サードパーティライセンス
- **Readability.js** (`lib/Readability.js`):
  - Copyright (c) 2010 Arc90 Inc / Mozilla Foundation
  - Licensed under the Apache License, Version 2.0.
  - ライセンス全文は [lib/LICENSE-Readability.txt](lib/LICENSE-Readability.txt) をご覧ください。
