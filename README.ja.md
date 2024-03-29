# Boxdraw

罫線文字で図形を描くための拡張機能です。

![boxdraw](https://github.com/taizod1024/vscode-boxdraw-extension/blob/main/images/boxdraw.gif?raw=true)

## 機能

罫線文字および矢印で図形を描けます。
罫線文字以外にブロック文字でも図形を描けます。

## 使い方

### 共通

| 共通機能                         | キー             |
| -------------------------------- | ---------------- |
| 罫線モードの有効／無効の切り替え | `ctrl + alt + m` |

### 罫線モード

| 機能                                         | キー                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| 罫線文字の描画                               | `ctrl + 矢印キー` もしくは `alt + 矢印キー`                 |
| 矢印文字の描画                               | `ctrl + alt + 矢印キー`                                     |
| 文字のクリア                                 | `ctrl + shift + 矢印キー` もしくは `alt + shift + 矢印キー` |
| 描画モード（罫線＋矢印／ブロック）の切り替え | `ctrl + alt + b`                                            |
| カーソルの上下移動                           | `上下矢印キー`                                              |

## 留意事項

- vscode
  - 設定
    - 日本語フォントは等幅のものにしてください。
    - スペースによるインデントにしてください。
  - 制限
    - マルチカーソルには対応していません。
  - 全角文字の内部実装
    - vscode では多くの全角記号が内部的には半角文字として扱われています。
      詳細は https://github.com/microsoft/vscode/blob/main/src/vs/base/common/strings.ts の isFullWidthCharacter()をご覧ください。
      その結果、カーソルを上下移動させると左右にがたつきます。
- boxdraw
  - 仕様
    - cursorUp/cursorDown
      - 罫線文字が内部的に半角 1 文字で計算されていることによるカーソルの上下移動時の左右のがたつきを抑制します。
    - cursorDown
      - 最下行では行末に移動する動きは実装していません。
    - cursorUpSelect/cursorDownSelect
      - 選択領域の制御は実装していません。

## 謝辞

- Boxdraw の基本的なアイデアは xyzzy の boxdraw.l を参考にしています。
