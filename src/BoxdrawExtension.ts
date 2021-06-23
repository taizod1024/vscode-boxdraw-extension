import { assert } from 'console';
import * as vscode from 'vscode';
var eaw = require('eastasianwidth');

// - vscode
//      - vscodeの全角文字の実装は不完全、以下のisFullWidthCharacter()を参照のこと
//          https://github.com/microsoft/vscode/blob/main/src/vs/base/common/strings.ts
//      
//      - 罫線文字は表示幅は半角2文字分だが、表示桁数は半角1文字で計算されている
// - boxdraw-extension
//      - cursorDownが最下行では行末に移動する動きは実装しない
//      - cursorUpSelect/cursorDownSelectは実装しない
//      - タブ文字は対象外

class BoxdrawExtension {

    // constant
    public appname: string;
    public appid: string;
    public applabel: string;

    // context
    public mode: boolean;

    // vscode
    public channel: vscode.OutputChannel;
    public statusbaritem: vscode.StatusBarItem;

    // constructor
    constructor() {

        // init constant
        this.appname = "boxdraw";
        this.appid = "boxdraw-extension";
        this.applabel = "BoxDraw";
    }

    // activate extension
    public activate(context: vscode.ExtensionContext) {

        // init context
        this.channel = vscode.window.createOutputChannel(this.appname);
        this.channel.show(true);
        this.channel.appendLine(`[${this.timestamp()}] ${this.appname}`);

        // init context
        this.mode = false;

        // init vscode

        // - command
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.toggleMode`, () => { boxdrawextension.toggleMode(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorUp`, () => { boxdrawextension.cursorUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorDown`, () => { boxdrawextension.cursorDown(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeft`, () => { boxdrawextension.drawLeft(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRight`, () => { boxdrawextension.drawRight(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUp`, () => { boxdrawextension.drawUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDown`, () => { boxdrawextension.drawDown(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeftArrow`, () => { boxdrawextension.drawLeftArrow(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRightArrow`, () => { boxdrawextension.drawRightArrow(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUpArrow`, () => { boxdrawextension.drawUpArrow(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDownArrow`, () => { boxdrawextension.drawDownArrow(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearLeft`, () => { boxdrawextension.clearLeft(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearRight`, () => { boxdrawextension.clearRight(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearUp`, () => { boxdrawextension.clearUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearDown`, () => { boxdrawextension.clearDown(); }));

        // - statusbar
        this.statusbaritem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusbaritem.command = `${this.appid}.toggleMode`;
        this.statusbaritem.show();
        context.subscriptions.push(this.statusbaritem);

        // - setcontext
        this.setMode(false, true);
    }

    // public interface

    // - mode management
    public toggleMode() {
        this.channel.appendLine(`--------`);
        this.setMode(!this.mode);
    }

    // - move cursor
    public cursorUp() {
        this.channel.appendLine(`--------`);
        let cpos = CPosition.getActive();
        cpos.backwardLine()
    }
    public cursorDown() {
        this.channel.appendLine(`--------`);
        let cpos = CPosition.getActive();
        cpos.forwardLine();
    }

    // - draw line
    public drawLeft() {
        this.channel.appendLine(`--------`);
        this.drawBox("left", false, false);
    }
    public drawRight() {
        this.channel.appendLine(`--------`);
        this.drawBox("right", false, false);
    }
    public drawUp() {
        this.channel.appendLine(`--------`);
        this.drawBox("up", false, false);
    }
    public drawDown() {
        this.channel.appendLine(`--------`);
        this.drawBox("down", false, false);
    }

    // - draw arrow
    public drawLeftArrow() {
        this.channel.appendLine(`--------`);
        this.drawBox("left", true, false);
    }
    public drawRightArrow() {
        this.channel.appendLine(`--------`);
        this.drawBox("right", true, false);
    }
    public drawUpArrow() {
        this.channel.appendLine(`--------`);
        this.drawBox("up", true, false);
    }
    public drawDownArrow() {
        this.channel.appendLine(`--------`);
        this.drawBox("down", true, false);
    }

    // clear line
    public clearLeft() {
        this.drawBox("left", false, true);
    }
    public clearRight() {
        this.drawBox("right", false, true);
    }
    public clearUp() {
        this.drawBox("up", false, true);
    }
    public clearDown() {
        this.drawBox("down", false, true);
    }

    // inner interface
    protected drawBox(direction: string, isarrow: boolean, isclear: boolean) {

        this.channel.appendLine(`[${this.timestamp()}] drawBox(${[...arguments]})`);

        // check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        // check active position
        const cpos = CPosition.getActive();
        const ppos = new CPosition(cpos.line - 1, cpos.column);
        const npos = new CPosition(cpos.line + 1, cpos.column);
        ppos.getPosition();
        cpos.getPosition();
        npos.getPosition();

        this.channel.appendLine(
            "- <" + ppos.ptxt + "><" + ppos.ctxt + "><" + ppos.ntxt + ">[" + ppos.rbgntxt + "][" + ppos.rendtxt + "]" + ppos.rbgnchr + "," + ppos.rendchr + "\n" +
            "- <" + cpos.ptxt + "><" + cpos.ctxt + "><" + cpos.ntxt + ">[" + cpos.rbgntxt + "][" + cpos.rendtxt + "]" + cpos.rbgnchr + "," + cpos.rendchr + "\n" +
            "- <" + npos.ptxt + "><" + npos.ctxt + "><" + npos.ntxt + ">[" + npos.rbgntxt + "][" + npos.rendtxt + "]" + npos.rbgnchr + "," + npos.rendchr + "\n");

        // draw current position
        if (cpos.ctxt != "■") {

            editor.edit(builder => {
                this.channel.appendLine(`[${this.timestamp()}] drawBox#edit1`);
                const posbgn = new vscode.Position(cpos.line, cpos.rbgnchr);
                const posend = new vscode.Position(cpos.line, cpos.rendchr);
                const range = new vscode.Range(posbgn, posend);
                builder.replace(range, cpos.rbgntxt + "■" + cpos.rendtxt);
            });

        } else {

            // goto next position
            let moving = false;
            if (direction == "up") {
                if (cpos.line >= 1) {
                    moving = true;
                    cpos.line--;
                    ppos.line--;
                    npos.line--;
                }
            } else if (direction == "left") {
                if (cpos.column >= 2) {
                    moving = true;
                    cpos.column -= 2;
                    ppos.column -= 2;
                    npos.column -= 2;
                }
            } else if (direction == "down") {
                moving = true;
                cpos.line++;
                ppos.line++;
                npos.line++;
            } else if (direction == "right") {
                moving = true;
                cpos.column += 2;
                ppos.column += 2;
                npos.column += 2;
            }

            // if moving ...
            if (moving) {

                // check next position
                cpos.gotoPosition(true);
                ppos.getPosition();
                cpos.getPosition();
                npos.getPosition();

                this.channel.appendLine(
                    "- <" + ppos.ptxt + "><" + ppos.ctxt + "><" + ppos.ntxt + ">[" + ppos.rbgntxt + "][" + ppos.rendtxt + "]" + ppos.rbgnchr + "," + ppos.rendchr + "\n" +
                    "- <" + cpos.ptxt + "><" + cpos.ctxt + "><" + cpos.ntxt + ">[" + cpos.rbgntxt + "][" + cpos.rendtxt + "]" + cpos.rbgnchr + "," + cpos.rendchr + "\n" +
                    "- <" + npos.ptxt + "><" + npos.ctxt + "><" + npos.ntxt + ">[" + npos.rbgntxt + "][" + npos.rendtxt + "]" + npos.rbgnchr + "," + npos.rendchr + "\n");


                // draw next position and move active
                editor.edit(builder => {
                this.channel.appendLine(`[${this.timestamp()}] drawBox#edit2`);
                    if (cpos.ctxt != "■") {
                        const posbgn = new vscode.Position(cpos.line, cpos.rbgnchr);
                        const posend = new vscode.Position(cpos.line, cpos.rendchr);
                        const range = new vscode.Range(posbgn, posend);
                        builder.replace(range, cpos.rbgntxt + "■" + cpos.rendtxt);
                    }
                    const posact = new vscode.Position(cpos.line, cpos.rbgnchr + cpos.rbgntxt.length);
                    editor.selection = new vscode.Selection(posact, posact);
                });
            }
        }
    }

    // vscode
    public setMode(mode: boolean, force = false) {

        this.channel.appendLine(`[${this.timestamp()}] setMode(${[...arguments]})`);

        if (this.mode != mode || force) {
            this.mode = mode;
            vscode.commands.executeCommand('setContext', `${this.appname}Mode`, this.mode);
            this.updateStatusbar();
        }
    }
    public updateStatusbar() {

        this.channel.appendLine(`[${this.timestamp()}] updateStatusbar(${[...arguments]})`);

        let msg = "";
        msg += this.mode ? "$(edit)" : ""
        msg += this.applabel;
        this.statusbaritem.text = msg;
    }

    // utility
    public timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();

class CPosition {

    // property
    public line: number;
    public column: number;
    protected lineendpos: vscode.Position;
    protected fulfillblank: number;
    public ctxt: string;
    public ptxt: string;
    public ntxt: string;
    public rbgnchr: number;
    public rendchr: number;
    public rbgntxt: string;
    public rendtxt: string;
    public static boxchars: { char: string, val: number }[] = [
        { val: 0b00000000, char: "" },
        { val: 0b00000001, char: "" },
        { val: 0b00000010, char: "" },
        { val: 0b00000011, char: "└" },
        { val: 0b00000100, char: "" },
        { val: 0b00000101, char: "│" },
        { val: 0b00000110, char: "┌" },
        { val: 0b00000111, char: "├" },
        { val: 0b00001000, char: "" },
        { val: 0b00001001, char: "┘" },
        { val: 0b00001010, char: "─" },
        { val: 0b00001011, char: "┴" },
        { val: 0b00001100, char: "┐" },
        { val: 0b00001101, char: "┤" },
        { val: 0b00001110, char: "┬" },
        { val: 0b00001111, char: "┼" },
        { val: 0b00000101, char: "↑" },
        { val: 0b00000101, char: "↓" },
        { val: 0b00001010, char: "→" },
        { val: 0b00001010, char: "←" }
    ];

    // constructor
    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
        this.initInner();
    }

    // init property
    protected initInner() {
        this.lineendpos = null;
        this.fulfillblank = 0;
        this.ctxt = "";
        this.ptxt = "";
        this.ntxt = "";
        this.rbgnchr = 0;
        this.rendchr = 0;
        this.rbgntxt = "";
        this.rendtxt = "";
    }

    // get cursor cposition
    public static getActive(): CPosition {

        boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] getActive(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        const current = editor.selection.active;
        let bol = new vscode.Position(current.line, 0);
        let range = new vscode.Range(bol, current);
        let text = document.getText(range);
        let cpos = new CPosition(current.line, eaw.length(text));
        return cpos;
    }

    // location to position
    public getPosition(fulfill = false) {

        boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] getPosition(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;

        // init property
        this.initInner();

        // validation
        if (this.line < 0) return null;
        if (this.line >= document.lineCount) return null;

        // get line
        const line = document.lineAt(this.line);
        this.lineendpos = line.range.end;

        // calc character begin
        let chars = line.text.split("");
        let column = 0;
        let character = 0;
        while (true) {
            if (column == this.column) {
                if (character > 0) this.ptxt = chars[character - 1];
                this.rbgnchr = character;
                this.rendchr = character;
                break;
            }
            if (column > this.column) {
                this.rbgnchr = character - 1;
                this.rendchr = character - 1;
                this.rbgntxt = " ";
                break;
            }
            if (character >= chars.length) {
                this.rbgnchr = character;
                this.rendchr = character;
                break;
            }
            let chr = chars[character];
            column += eaw.characterLength(chars[character]);
            character++
        }

        // calc character end
        while (true) {
            if (column == this.column + 2) {
                if (character < chars.length) this.ntxt = chars[character];
                this.rendchr = character;
                break;
            }
            if (column > this.column + 2) {
                this.rendchr = character;
                this.rendtxt = " ";
                break;
            }
            if (character >= chars.length) {
                this.rendchr = character;
                break;
            }
            if (this.rbgntxt == "") this.ctxt += chars[character];
            column += eaw.characterLength(chars[character]);
            character++
        }

        // fulfill
        if (fulfill) {
            this.fulfillblank = (column < this.column) ? this.column - column : 0;
            this.rbgntxt += " ".repeat(this.fulfillblank);
        }

        // 
        let actchr = this.rbgnchr + this.fulfillblank;
        // if (character >= chars.length) actchr = chars.length;
        let pos = new vscode.Position(this.line, actchr);
        return pos;
    }

    // goto
    public gotoPosition(fulfill = false) {

        boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] gotoPosition(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        let pos = this.getPosition(fulfill);
        if (fulfill) {
            // return after insertion
            return editor.edit(builder => {
                boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] gotoPosition#edit1`);
                builder.insert(this.lineendpos, " ".repeat(this.fulfillblank));
                editor.selection = new vscode.Selection(pos, pos);
            });
        } else {
            // return immediately
            editor.selection = new vscode.Selection(pos, pos);
            return null;
        }
    }

    // backward line
    public backwardLine(fulfill = false) {

        boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] backwardLine(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        return editor.edit(() => {
            boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] backwardLine#edit1`);
            if (this.line > 0) {
                this.line--;
                this.gotoPosition(fulfill);
            }
        });
    }

    // forward line
    public forwardLine(fulfill = false) {

        boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] forwardLine(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        return editor.edit(builder => {
            boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] forwardLine#edit1`);
            this.line++;
            if (this.line < document.lineCount) {
                this.gotoPosition(fulfill);
            } else if (fulfill) {
                const line = document.lineAt(document.lineCount - 1);
                builder.insert(line.range.end, "\n" + " ".repeat(this.column));
                const pos = new vscode.Position(this.line, this.column);
                editor.selection = new vscode.Selection(pos, pos);
            }
        });
    }
}
