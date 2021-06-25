import { assert } from 'console';
import * as vscode from 'vscode';
var eaw = require('eastasianwidth');

// - vscode
//      - vscodeの全角文字の実装は不完全、以下のisFullWidthCharacter()を参照のこと
//          https://github.com/microsoft/vscode/blob/main/src/vs/base/common/strings.ts
//      - 罫線文字は表示幅は半角2文字分だが、表示桁数は半角1文字で計算されている
// - boxdraw-extension
//      - cursorDownが最下行では行末に移動する動きは実装しない
//      - cursorUpSelect/cursorDownSelectは実装しない
//      - タブ文字は対象外
//      - マルチカーソルは対象外

/** boxdraw-extesnion class */
class BoxdrawExtension {

    // constant

    /** application name for vscode*/
    public appname: string;
    /** application id for vscode*/
    public appid: string;

    /** application label for vscode channel output*/
    public applabel: string;

    // context

    /** flag for boxdaw */
    public mode: boolean;
    /** flag for square */
    public square: boolean;
    /** flag for debug  */
    public debug: boolean;

    // vscode

    /** channel for log */
    public channel: vscode.OutputChannel;
    /** statusvar for user */
    public statusbaritem: vscode.StatusBarItem;

    // data

    /** code to char mapping array */
    public static boxchars: { char: string, val: number }[] = [
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


    // method

    /** constructor */
    constructor() {

        // init constant
        this.appname = "boxdraw";
        this.appid = "boxdraw-extension";
        this.applabel = "BoxDraw";
    }

    /** activate extension */
    public activate(context: vscode.ExtensionContext) {

        // init context
        this.channel = vscode.window.createOutputChannel(this.appname);
        this.channel.show(true);
        this.channel.appendLine(`[${this.timestamp()}] ${this.appname} activated`);

        // init context
        this.mode = false;
        this.square = false;
        this.debug = false;

        // init vscode

        // - command
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.toggleMode`, () => { boxdrawextension.toggleMode(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.toggleSquare`, () => { boxdrawextension.toggleSquare(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorUp`, () => { boxdrawextension.cursorUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorDown`, () => { boxdrawextension.cursorDown(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeft`, () => { boxdrawextension.drawBox("left"); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRight`, () => { boxdrawextension.drawBox("right"); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUp`, () => { boxdrawextension.drawBox("up",); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDown`, () => { boxdrawextension.drawBox("down"); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeftArrow`, () => { boxdrawextension.drawBox("left", true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRightArrow`, () => { boxdrawextension.drawBox("right", true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUpArrow`, () => { boxdrawextension.drawBox("up", true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDownArrow`, () => { boxdrawextension.drawBox("down", true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearLeft`, () => { boxdrawextension.drawBox("left", false, true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearRight`, () => { boxdrawextension.drawBox("right", false, true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearUp`, () => { boxdrawextension.drawBox("up", false, true); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearDown`, () => { boxdrawextension.drawBox("down", false, true); }));

        // - statusbar
        this.statusbaritem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusbaritem.command = `${this.appid}.toggleMode`;
        this.statusbaritem.show();
        context.subscriptions.push(this.statusbaritem);

        // - setcontext
        this.setMode(false, true);
        this.setSquare(false, true);
    }

    // public interface

    /** toggle mode */
    public toggleMode() {

        if (this.debug) this.channel.appendLine(`--------`);

        this.setMode(!this.mode);
    }

    /** toggle square */
    public toggleSquare() {

        if (this.debug) this.channel.appendLine(`--------`);

        this.setSquare(!this.square);
    }

    /** move to previous line */
    public cursorUp() {

        if (this.debug) this.channel.appendLine(`--------`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;

        let cpoc = PosColumn.getCursor();
        editor.edit(() => {
            if (cpoc.line > 0) {
                cpoc.line--;
                let cpos = cpoc.toPosition();
                if (cpos) {
                    editor.selection = new vscode.Selection(cpos, cpos);
                    vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
                }
            }
        });
    }

    /** move to next line */
    public cursorDown() {

        if (this.debug) this.channel.appendLine(`--------`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;

        let cpoc = PosColumn.getCursor();
        editor.edit(() => {
            cpoc.line++;
            let cpos = cpoc.toPosition();
            if (cpos) {
                editor.selection = new vscode.Selection(cpos, cpos);
                vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
            }
        });
    }

    /** draw line, draw arrow, clear line */
    protected drawBox(direction: "left" | "right" | "up" | "down", isarrow = false, isclear = false) {

        if (this.debug) this.channel.appendLine(`--------`);
        if (this.debug) this.channel.appendLine(`[${this.timestamp()}] drawBox(${[...arguments]})`);

        // check editor exist
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        if (!editor) return;

        // check cursor poscolumn
        const cpoc = PosColumn.getCursor(); // current poscolumn
        const ppoc = new PosColumn(cpoc.line - 1, cpoc.column); // prev poscolumn
        const npoc = new PosColumn(cpoc.line + 1, cpoc.column); // next poscolumn
        ppoc.toPosition();
        cpoc.toPosition();
        npoc.toPosition();
        let rtxt = this.getReplaceText(ppoc, cpoc, npoc, direction, isarrow, isclear);

        if (this.debug) this.channel.appendLine(
            "- [" + ppoc.ptxt + "][" + ppoc.ctxt + "][" + ppoc.ntxt + "] " + ppoc.rbgnchr + ", " + ppoc.rbgnchr2 + ", " + ppoc.rendchr2 + ", " + ppoc.rendchr + "\n" +
            "- [" + cpoc.ptxt + "][" + cpoc.ctxt + "][" + cpoc.ntxt + "] " + cpoc.rbgnchr + ", " + cpoc.rbgnchr2 + ", " + cpoc.rendchr2 + ", " + cpoc.rendchr + "\n" +
            "- [" + npoc.ptxt + "][" + npoc.ctxt + "][" + npoc.ntxt + "] " + npoc.rbgnchr + ", " + npoc.rbgnchr2 + ", " + npoc.rendchr2 + ", " + npoc.rendchr);

        // check current position
        if (this.isReplaceOrNot(cpoc, rtxt, direction, isarrow, isclear)) {

            // draw current position
            editor.edit(builder => {
                const rbpos = new vscode.Position(cpoc.line, cpoc.rbgnchr); // replace begin position
                const repos = new vscode.Position(cpoc.line, cpoc.rendchr); // replace end position
                const range = new vscode.Range(rbpos, repos);
                builder.replace(range, " ".repeat(cpoc.rbgnchr2) + rtxt + " ".repeat(cpoc.rendchr2));
            }).then(() => {
                const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2); // current position
                editor.selection = new vscode.Selection(cpos, cpos);
                vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
            });
            return;

        }

        // check move or not
        let ismoved = false;
        if (direction == "up") {
            if (cpoc.line >= 1) {
                ismoved = true;
                cpoc.line--;
                ppoc.line--;
                npoc.line--;
            }
        } else if (direction == "left") {
            if (cpoc.column >= 2) {
                ismoved = true;
                cpoc.column -= 2;
                ppoc.column -= 2;
                npoc.column -= 2;
            }
        } else if (direction == "down") {
            ismoved = true;
            cpoc.line++;
            ppoc.line++;
            npoc.line++;
        } else if (direction == "right") {
            ismoved = true;
            cpoc.column += 2;
            ppoc.column += 2;
            npoc.column += 2;
        }

        // exit if not moved
        if (!ismoved) return;

        // check next position
        ppoc.toPosition();
        cpoc.toPosition(true);
        npoc.toPosition();

        if (this.debug) this.channel.appendLine(
            "- [" + ppoc.ptxt + "][" + ppoc.ctxt + "][" + ppoc.ntxt + "] " + ppoc.rbgnchr + ", " + ppoc.rbgnchr2 + ", " + ppoc.rendchr2 + ", " + ppoc.rendchr + "\n" +
            "- [" + cpoc.ptxt + "][" + cpoc.ctxt + "][" + cpoc.ntxt + "] " + cpoc.rbgnchr + ", " + cpoc.rbgnchr2 + ", " + cpoc.rendchr2 + ", " + cpoc.rendchr + "\n" +
            "- [" + npoc.ptxt + "][" + npoc.ctxt + "][" + npoc.ntxt + "] " + npoc.rbgnchr + ", " + npoc.rbgnchr2 + ", " + npoc.rendchr2 + ", " + npoc.rendchr);

        // check last line or not
        if (cpoc.line == document.lineCount) {

            // add new line
            editor.edit(builder => {
                const line = document.lineAt(document.lineCount - 1);
                builder.insert(line.range.end, "\n" + " ".repeat(cpoc.column) + rtxt);
            }).then(() => {
                const cpos = new vscode.Position(cpoc.line, cpoc.column);
                editor.selection = new vscode.Selection(cpos, cpos);
                vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
            });
            return;
        }

        // check next position
        if (this.isReplaceOrNot(cpoc, rtxt, direction, isarrow, isclear)) {

            // rewrite existing line
            editor.edit(builder => {
                const posbgn = new vscode.Position(cpoc.line, cpoc.rbgnchr);
                const posend = new vscode.Position(cpoc.line, cpoc.rendchr);
                const range = new vscode.Range(posbgn, posend);
                builder.replace(range, " ".repeat(cpoc.rbgnchr2) + rtxt + " ".repeat(cpoc.rendchr2));
            }).then(() => {
                const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2);
                editor.selection = new vscode.Selection(cpos, cpos);
                vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
            });
            return;
        }

        // nothing to draw 
        const cpos = new vscode.Position(cpoc.line, cpoc.rbgnchr + cpoc.rbgnchr2);
        editor.selection = new vscode.Selection(cpos, cpos);
        vscode.commands.executeCommand('revealLine', { lineNumber: cpos.line });
    }

    /** text to replace */
    public getReplaceText(ppoc: PosColumn, cpoc: PosColumn, npoc: PosColumn, direction: string, isarrow: boolean, isclear: boolean) {
        if (boxdrawextension.square) {
            if (isarrow) return "□";
            if (isclear) return "  ";
            return "■";
        } else {
            // TODO 罫線対応
            let uval = BoxdrawExtension.boxchars.find(x => x.char == ppoc.ctxt)?.val;
            let lval = BoxdrawExtension.boxchars.find(x => x.char == cpoc.ptxt)?.val;
            let rval = BoxdrawExtension.boxchars.find(x => x.char == cpoc.ntxt)?.val;
            let dval = BoxdrawExtension.boxchars.find(x => x.char == npoc.ctxt)?.val;
            let cval = ((uval & 0b00000100) ? 0b00000001 : 0)
                | ((rval & 0b00001000) ? 0b00000010 : 0)
                | ((dval & 0b00000001) ? 0b00000100 : 0)
                | ((lval & 0b00000010) ? 0b00001000 : 0);
            if (cval) {
                if (direction == "up") cval |= 0b00000001;
                if (direction == "right") cval |= 0b00000010;
                if (direction == "down") cval |= 0b00000100;
                if (direction == "left") cval |= 0b00001000;
            } else {
                if (direction == "up") cval |= 0b00000101;
                if (direction == "right") cval |= 0b00001010;
                if (direction == "down") cval |= 0b00000101;
                if (direction == "left") cval |= 0b00001010;
            }
            let ctxt = BoxdrawExtension.boxchars.find(x => x.val == cval)?.char;
            this.channel.appendLine([ppoc.ctxt, cpoc.ptxt, cpoc.ntxt, npoc.ctxt, uval, lval, rval, dval, cval, ctxt].toString());
            return ctxt;

        }
    }

    /** check replace or not */
    public isReplaceOrNot(cpoc: PosColumn, rtxt: string, direction: string, isarrow: boolean, isclear: boolean) {
        if (boxdrawextension.square) {
            if (isarrow) return cpoc.ctxt != rtxt;
            if (isclear) return cpoc.ctxt == "■" || cpoc.ctxt == "□";
            return cpoc.ctxt != rtxt;
        } else {
            // TODO 罫線対応
            return cpoc.ctxt != rtxt;
        }
    }

    // vscode

    /** set mode */
    public setMode(mode: boolean, force = false) {

        if (this.debug) this.channel.appendLine(`[${this.timestamp()}] setMode(${[...arguments]})`);

        if (this.mode != mode || force) {
            this.mode = mode;
            vscode.commands.executeCommand('setContext', `${this.appname}Mode`, this.mode);
            this.updateStatusbar();
        }
    }

    /** set square */
    public setSquare(square: boolean, force = false) {

        if (this.debug) this.channel.appendLine(`[${this.timestamp()}] setSquare(${[...arguments]})`);

        if (this.square != square || force) {
            this.square = square;
            vscode.commands.executeCommand('setContext', `${this.appname}Square`, this.square);
            this.updateStatusbar();
        }
    }

    /** update statusbar */
    public updateStatusbar() {

        if (this.debug) this.channel.appendLine(`[${this.timestamp()}] updateStatusbar(${[...arguments]})`);

        let msg = "";
        if (this.mode) {
            if (this.square) msg += "$(primitive-square)";
            else msg += "$(edit)";
        }
        msg += this.applabel;
        this.statusbaritem.text = msg;
    }

    // utility

    /** return timestamp string */
    public timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();

/** position with column */
class PosColumn {

    // property
    /** current line number */
    public line: number;
    /** current column number not character number*/
    public column: number;
    /** text of previous line */
    public ptxt: string;
    /** text of current position */
    public ctxt: string;
    /** text of next line */
    public ntxt: string;
    /** beginning character number for replace*/
    public rbgnchr: number;
    /** end character number for replace */
    public rendchr: number;
    /** before character number for replace */
    public rbgnchr2: number;
    /** after character number for replace */
    public rendchr2: number;

    /** constructor*/
    constructor(line: number, column: number) {

        // init property
        this.line = line;
        this.column = column;
        this.initProperty();
    }

    /** init property */
    protected initProperty() {
        this.ctxt = "";
        this.ptxt = "";
        this.ntxt = "";
        this.rbgnchr = 0;
        this.rbgnchr2 = 0;
        this.rendchr2 = 0;
        this.rendchr = 0;
    }

    /** get cursor cposition */
    public static getCursor(): PosColumn {

        if (boxdrawextension.debug) boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] getActive(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        const current = editor.selection.active;
        let bol = new vscode.Position(current.line, 0);
        let range = new vscode.Range(bol, current);
        let text = document.getText(range);
        let cpos = new PosColumn(current.line, eaw.length(text));
        return cpos;
    }

    /** poscolum to position */
    public toPosition(fulfill = false) {

        if (boxdrawextension.debug) boxdrawextension.channel.appendLine(`[${boxdrawextension.timestamp()}] getPosition(${[...arguments]})`);

        const editor = vscode.window.activeTextEditor;
        const document = editor.document;

        // init property
        this.initProperty();

        // validation
        if (this.line < 0) return null;
        if (this.line >= document.lineCount) return null;

        // get line
        const line = document.lineAt(this.line);

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
                this.rbgnchr2 = 1;
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
                this.rendchr2 = 1;
                break;
            }
            if (character >= chars.length) {
                this.rendchr = character;
                break;
            }
            if (this.rbgnchr2 == 0) this.ctxt += chars[character];
            column += eaw.characterLength(chars[character]);
            character++
        }

        // fulfill
        if (fulfill) {
            this.rbgnchr2 += (column < this.column) ? this.column - column : 0;
        }


        // return position
        let actchr = this.rbgnchr + this.rbgnchr2;
        let pos = new vscode.Position(this.line, actchr);
        return pos;
    }
}
