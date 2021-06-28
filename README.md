# Boxdraw Extension

![Status-WIP](https://img.shields.io/badge/Status-WIP-orange)

罫線文字で図を描くための拡張機能です。

![boxdraw](https://github.com/taizod1024/vscode-boxdraw-extension/blob/main/images/boxdraw.gif?raw=true)

## 機能

罫線文字および矢印で図を描けます。
罫線文字以外にブロック文字でも図を描けます。

## 使い方

### 共通

|共通機能|キー|
|-|-|
|罫線モードの有効／無効の切り替え|`ctrl + alt + m`|

### 罫線モード

|機能|キー|
|-|-|
|罫線文字の描画|`ctrl + 矢印キー`|
|矢印文字の描画| `ctrl + alt + 矢印キー`|
|文字のクリア| `ctrl + shift + 矢印キー`|
|描画モード（罫線＋矢印／ブロック）の切り替え| `ctrl + alt + b`|
|カーソルの上下移動|`上下矢印キー`|

## 留意事項

- vscode
    - 設定
        - 日本語フォントは等幅のものを設定してください。
        - スペースによるインデントにしてください。
        - マルチカーソルには対応していません。
    - 挙動
        - vscodeの全角文字の扱いは不完全です。多くの全角記号が内部的に半角文字として扱われているためです。罫線文字も例外ではなく、表示幅は半角2文字分ですが表示桁数は半角1文字で計算されています。
    - 実装
        - vscodeの全角文字の実装は以下のURLのisFullWidthCharacter()をご覧ください。
         https://github.com/microsoft/vscode/blob/main/src/vs/base/common/strings.ts
- boxdraw-extension
    - 仕様
        - cursorUp/cursorDown
            - 罫線文字が内部的に半角1文字で計算されていることによるカーソルの縦方向の移動のがたつきを抑制します。
        - cursorDown
            - 最下行では行末に移動する動きは実装しません。
        - cursorUpSelect/cursorDownSelect
            - 選択領域の制御は実装しません。

## 謝辞

- boxdraw-extension の基本的なアイデアは xyzzy の boxdraw.l を参考にしています。
