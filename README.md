# Boxdraw

vscode extension for drawing figures with ruled line characters.

![boxdraw](https://github.com/taizod1024/vscode-boxdraw-extension/blob/main/images/boxdraw.gif?raw=true)

## features

You can draw figures with ruled line characters and arrows.

## usage

### general

|function|keyboard shortcuts|
|-|-|
|enable / disable boxdraw mode|`ctrl + alt + m`|

### boxdraw mode

|function|keyboard shortcuts|
|-|-|
|draw ruled line characters|`ctrl + arrow key`|
|draw arrow characters| `ctrl + alt + arrow key`|
|clear characters| `ctrl + shift + arrow key`|
|switch the drawing mode (ruled line + arrow / block)| `ctrl + alt + b`|
|move the cursor up and down|`up / down arrow key`|

## note

- vscode
    - settings
      - Please use monospaced Japanese fonts.
      - Please indent by space.
    - limitation
        - Multi-cursor is not supported.
    - internal implementation of double-byte characters
        - In vscode, many double-byte symbols are treated as half-width characters internally.
            As a result, moving the cursor up and down will cause it to rattle left and right.
            See isFullWidthCharacter() in https://github.com/microsoft/vscode/blob/main/src/vs/base/common/strings.ts
- boxdraw
    - spec
        - cursorUp/cursorDown
            - It suppresses left and right rattling when moving the cursor up and down due to the ruled line characters being calculated internally with one half-width character.
        - cursorDown
            - The bottom line does not implement the movement to move to the end of the line.
        - cursorUpSelect/cursorDownSelect
            - It does not implement control of the selection area.

## acknowledgments

- The basic idea of ​​Boxdraw is based on xyzzy's boxdraw.l .
