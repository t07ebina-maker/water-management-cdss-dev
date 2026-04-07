# DESIGN.md — 静岡市立静岡病院 スライド・Web デザインシステム

バージョン: v1.0
作成日: 2026-04-07
対象ツール: Claude Code / Codex / claude.ai（pptx 生成・HTML 生成共通）

---

## 1. ブランド概要

組織名: 静岡市立静岡病院
ブランドコンセプト: 誠実・清潔・地域に根ざした医療
デザインの基調: 白地をベースに、病院ブランドブルー (#0068B3) とアクセントグリーン (#6FBA2C) を
              主軸とした 2 トーン構成。富士山シルエットをフッターに配置することで
              静岡らしさを表現する。

---

## 2. カラーパレット

### ブランドカラー（必須）

| 役割             | 色名               | HEX     | 使用箇所                             |
|------------------|--------------------|---------|--------------------------------------|
| プライマリ        | 病院ブルー          | #0068B3 | ヘッダー帯・アクセント・アイコン       |
| セカンダリ        | アクセントグリーン  | #6FBA2C | サブ帯・強調バー                      |
| ライトブルー      | スカイブルー        | #009DD9 | 補助装飾                             |
| 背景              | ホワイト            | #FFFFFF | スライド・ページ本文背景               |
| テキスト（主）    | ダークグレー        | #222222 | 本文テキスト                         |
| テキスト（副）    | ミディアムグレー    | #555555 | キャプション・注釈                    |

### 禁止事項

- 上記以外のカラーを帯・ヘッダー・フッターの背景に使用しないこと
- グラデーション背景の使用禁止（表紙院章マークのグラデーションは既存アセット限定）
- ネオンカラー・原色の赤・紫系の使用禁止

---

## 3. タイポグラフィ

### フォント指定

| 要素              | フォント（和文）  | フォント（欧文）     | サイズ目安   |
|-------------------|------------------|----------------------|-------------|
| スライドタイトル  | 游ゴシック Bold   | Calibri Light Bold   | 28〜36pt    |
| 本文・箇条書き    | 游ゴシック        | Calibri              | 18〜22pt    |
| キャプション      | Meiryo UI        | Meiryo UI            | 10〜12pt    |
| HTML 見出し h1    | 游ゴシック / sans-serif | Calibri Light   | 2.0rem      |
| HTML 本文         | 游ゴシック / sans-serif | Calibri         | 1.0rem      |

### 禁止フォント

- MS Pゴシック、MS P明朝（古い印象）
- 装飾系フォント全般

---

## 4. スライドレイアウト規則

### 共通仕様（全スライド）

- スライドサイズ: 横 33.87cm × 縦 19.05cm（ワイド 16:9）
- コンテンツ有効領域: x=0.9cm 〜 x=32.9cm、y=2.9cm 〜 y=17.8cm

### 表紙レイアウト（slideLayout1 相当）

タイトルエリア:
  位置: x=6.4cm, y=5.1cm、幅 25.5cm、高さ 4.0cm
  フォント: 游ゴシック Bold、白またはダークグレー
サブタイトルエリア:
  位置: x=10.8cm, y=11.3cm、幅 18.5cm、高さ 2.9cm

帯（表紙専用）:
  - 太帯（青）: x=0cm, y=9.4cm、幅 17.2cm、高さ 1.0cm、色 #0068B3
  - 区切り帯: x=1.8cm, y=8.9cm、幅 32.2cm、高さ 1.0cm（白）

表紙専用アセット:
  - 院章マーク（大）: image6.jpeg、位置 x=0.5cm, y=4.7cm、5.9×4.4cm
    → 表紙中央左に大きく配置。グラデーションブルーの菱形デザイン。

### 本文スライドレイアウト（slideLayout2 相当）

タイトルバー:
  位置: x=3.4cm, y=0.5cm、幅 30.3cm、高さ 2.0cm
  下部に青ライン: y=2.5cm、高さ 0.1cm、色 #0068B3
  タイトル左に院章小マーク（image5.png）を配置: x=0.7cm, y=0.6cm、2.5×1.9cm

コンテンツエリア:
  位置: x=0.9cm, y=2.9cm、幅 32.0cm、高さ 14.6cm

---

## 5. フッター規則（全スライド共通・スライドマスターで定義）

フッターはスライドマスターに固定配置されており、全スライドに自動適用される。
AIがスライドを生成する際、フッター要素をコンテンツエリアに侵食させてはならない。

### フッター構成要素

| 要素                        | ファイル     | 位置 (x, y)          | サイズ (w×h)     | 備考                        |
|-----------------------------|-------------|----------------------|------------------|-----------------------------|
| 病院外観写真（小）          | image4.png  | x=0.75cm, y=17.93cm | 2.21×0.97cm      | 左端・外観建物写真           |
| 院章マーク（小・EMF）       | image5.png  | x=0.65cm, y=17.98cm | 2.22×0.98cm      | 左端・菱形マーク             |
| 静岡市立静岡病院ロゴ（横）  | image2.jpeg | x=3.06cm, y=18.02cm | 5.05×0.85cm      | ロゴマーク＋病院名テキスト   |
| 富士山シルエット            | image3.png  | x=23.64cm, y=17.88cm| 9.69×1.11cm      | 右端・青い富士山シルエット   |

### フッター装飾ライン（スライドマスター定義）

| 要素           | 色      | 位置 y      | 高さ   | 全幅  |
|----------------|---------|-------------|--------|-------|
| 緑ライン       | #6FBA2C | y=18.82cm   | 0.13cm | 全幅  |
| 波形（曲線）   | 白/緑   | y=18.60cm   | 0.31cm | 全幅  |
| 下部青ライン   | #0068B3 | y=18.93cm   | 0.13cm | 全幅  |
| 上部青ライン   | #0068B3 | y=0.00cm    | 0.13cm | 全幅  |

フッター保護ゾーン: y=17.75cm より下はコンテンツ配置禁止

---

## 6. アセットファイル一覧

pptx/media/ ディレクトリに格納。HTMLプロジェクトでは assets/assets/ に同梱すること。

| ファイル名    | 内容                              | 用途                         |
|---------------|-----------------------------------|------------------------------|
| image2.jpeg   | 静岡市立静岡病院ロゴ（横型）      | フッター・本文スライド左上    |
| image3.png    | 富士山シルエット（青・EMF）       | フッター右端（全スライド）    |
| image4.png    | 病院外観写真（小・98×57px PNG）   | フッター左端                  |
| image5.png    | 院章マーク（小・EMF）             | フッター左端・本文タイトル左  |
| image6.jpeg   | 院章マーク（大・393×393px JPEG） | 表紙中央左のみ                |
| hdphoto1.wdp  | 高精細写真（WDP形式）             | 表紙背景用（予備）            |

---

## 7. HTML デザイン規則

スライドと同一ブランドを Web ページ・ツール画面に適用するための規則。

### ページ全体

```css
body {
  background-color: #FFFFFF;
  color: #222222;
  font-family: '游ゴシック', 'Yu Gothic', 'Meiryo UI', sans-serif;
  font-size: 16px;
  line-height: 1.7;
  margin: 0;
  padding: 0;
}
```

### ヘッダー

```css
header {
  background-color: #0068B3;
  color: #FFFFFF;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 3px solid #6FBA2C;
}
header .hospital-name {
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 0.05em;
}
```

### フッター

```css
footer {
  background-color: #0068B3;
  color: #FFFFFF;
  font-size: 0.8rem;
  padding: 8px 24px;
  border-top: 3px solid #6FBA2C;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### ボタン・アクション要素

```css
/* プライマリボタン */
.btn-primary {
  background-color: #0068B3;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn-primary:hover {
  background-color: #005091;
}

/* セカンダリボタン */
.btn-secondary {
  background-color: #6FBA2C;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
}
```

### カード・セクション

```css
.card {
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-left: 4px solid #0068B3;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

/* セクション区切り */
.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #0068B3;
  border-bottom: 2px solid #0068B3;
  padding-bottom: 4px;
  margin-bottom: 12px;
}
```

### 強調・警告

```css
.alert-warning {
  background-color: #FFF8E1;
  border-left: 4px solid #F9A825;
  padding: 12px 16px;
}
.alert-info {
  background-color: #E3F2FD;
  border-left: 4px solid #0068B3;
  padding: 12px 16px;
}
```

### 禁止事項（HTML）

- box-shadow の多用禁止（フラットデザインを基本とする）
- グラデーション背景禁止
- 赤・紫系をメインカラーとして使用禁止
- フォントサイズ 12px 未満のテキスト禁止（医療現場での視認性確保）
- スクロールなしで見えない位置への重要情報配置禁止

---

## 8. AI エージェント向け指示（AGENTS GUIDE）

### Claude Code / Codex 向け

1. pptx を生成する場合は、必ずこの DESIGN.md を参照し、
   スライドマスター（slideMaster1.xml）のフッター要素を改変しないこと。

2. フッター保護ゾーン（y > 17.75cm）にコンテンツを配置しないこと。

3. 新規スライドを追加する場合は、slideLayout2（本文）または slideLayout1（表紙）
   を必ず使用すること。独自レイアウトの作成は禁止。

4. カラーは Section 2 のパレット外の色を追加しないこと。

5. HTML を生成する場合は、Section 7 の CSS 規則に従い、
   ヘッダーには必ず院章マーク（image5.png → PNG 変換版）と
   「静岡市立静岡病院」テキストを配置すること。

6. フォントは Section 3 の指定に従い、游ゴシックを第一候補とすること。

### 確認チェックリスト

pptx 生成後:
  [ ] フッターの 4 要素（外観写真・院章・ロゴ横・富士山）が全スライドに表示されている
  [ ] y > 17.75cm にコンテンツが侵食していない
  [ ] タイトルバーが #0068B3 または白地で構成されている
  [ ] 游ゴシックまたは Meiryo UI が使用されている

HTML 生成後:
  [ ] ヘッダーが #0068B3 背景・白テキスト
  [ ] フッターが #0068B3 背景・緑ラインあり
  [ ] 本文フォントが游ゴシック系
  [ ] ボタンが #0068B3 または #6FBA2C
  [ ] グラデーション・box-shadow が使用されていない

---

## 9. Do's and Don'ts

### Do（推奨）

- 白地に #0068B3 と #6FBA2C の 2 トーンで構成する
- タイトル左に院章マーク（小）を添える
- フッターに富士山シルエットを維持する
- 游ゴシックで清潔感のある表示を確保する
- スライドタイトルは左揃えで青ラインと合わせる

### Don't（禁止）

- フッター保護ゾーンへのコンテンツ配置
- 富士山・院章・病院ロゴの削除・移動・変形
- グラデーション背景の追加
- 病院ブランド外の色（赤・紫・オレンジなど）の使用
- MS ゴシック・MS 明朝への変更
- 表紙以外への大型院章マーク（image6.jpeg）の使用
