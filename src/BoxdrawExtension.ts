import * as vscode from 'vscode';
var eaw = require('eastasianwidth');

// # 備忘
// - 罫線文字のうち、JISX0213に入っているものは表示上は全角、それ以外は半角、それもフォントに依存
// - vscodeの全角文字判定は簡易的。罫線文字は半角扱いになっているため。
// - cursorDownは最下行では行末に移動する動きは実装しない
// - cursorUpSelect/cursorDownSelectは実装しない

// extension core
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
    // constructor
    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
        this.initInner();
    }
    // position to location
    public static getActive(): CPosition {
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        const current = editor.selection.active;
        let bol = new vscode.Position(current.line, 0);
        let range = new vscode.Range(bol, current);
        let text = document.getText(range);
        let location = new CPosition(current.line, eaw.length(text));
        return location;
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

    // location to position
    public getPosition(fulfill = false) {

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

        // calc character
        let chars = line.text.split("");
        let column = 0;
        let character = 0;
        while (true) {
            if (column == this.column) {
                if (character > 0) this.ptxt = chars[character - 1];
                this.rbgnchr = character;
                break;
            }
            if (column > this.column) {
                this.rbgnchr = character - 1;
                this.rbgntxt = " ";
                break;
            }
            if (character >= chars.length) break;
            column += eaw.characterLength(chars[character]);
            character++
        }
        this.rendchr = character;
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
            if (character >= chars.length) break;
            this.ctxt += chars[character];
            column += eaw.characterLength(chars[character]);
            character++
        }

        // // fulfill
        // if (fulfill) {
        //     this.fulfillblank = (column < this.column) ? this.column - column : 0;
        // }

        let pos = new vscode.Position(this.line, this.rbgnchr + this.fulfillblank);
        return pos;
    }
    public gotoLocation(fulfill = false) {
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        let pos = this.getPosition(fulfill);
        if (fulfill) {
            // return after insertion
            return editor.edit(builder => {
                builder.insert(this.lineendpos, " ".repeat(this.fulfillblank));
                editor.selection = new vscode.Selection(pos, pos);
            });
        } else {
            // return immediately
            editor.selection = new vscode.Selection(pos, pos);
            return null;
        }
    }
    // previous line
    public backwardLine(fulfill = false) {
        const editor = vscode.window.activeTextEditor;
        return editor.edit(() => {
            if (this.line > 0) {
                this.line--;
                this.gotoLocation(fulfill);
            }
        });
    }
    // next line
    public forwardLine(fulfill = false) {
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        return editor.edit(builder => {
            this.line++;
            if (this.line < document.lineCount) {
                this.gotoLocation(fulfill);
            } else if (fulfill) {
                const line = document.lineAt(document.lineCount - 1);
                builder.insert(line.range.end, "\n" + " ".repeat(this.column));
                const pos = new vscode.Position(this.line, this.column);
                editor.selection = new vscode.Selection(pos, pos);
            }
        });
    }
    // public write(text: string) {
    //     const editor = vscode.window.activeTextEditor;
    //     const document = editor.document;
    //     return editor.edit((builder: vscode.TextEditorEdit) => {
    //         // param
    //         let columnx: number;
    //         let charx: number;
    //         let textx: string;
    //         let charl: number, charr: number;
    //         let curpos = new vscode.Position(editor.selection.active.line, editor.selection.active.character);
    //         // complete line
    //         if (document.lineCount < this.row) {
    //             var lastline = document.lineAt(document.lineCount - 1);
    //             builder.insert(lastline.range.end, "\n".repeat(document.lineCount - this.row + 1));
    //         }
    //         // complete whole line
    //         let linetext = document.lineAt(this.row).text;
    //         let columnl = eaw.length(linetext);
    //         if (columnl < this.column + 2) {
    //             linetext += "*".repeat(this.column - columnl + 2);
    //         }
    //         // calc charx, columnx
    //         let textn = linetext.split("").map(x => eaw.length(x));
    //         for (columnx = 0, charx = 0; charx < textn.length + 2; charx++) {
    //             if (this.column <= columnx) break;
    //             columnx += textn[charx];
    //         }
    //         // calc charl, charr, textx
    //         if (this.column == columnx) {
    //             if (textn[charx] == 2) {
    //                 charl = charx;
    //                 charr = charx + 1;
    //                 textx = text;
    //             } else if (textn[charx + 1] == 1) {
    //                 charl = charx;
    //                 charr = charx + 2;
    //                 textx = text;
    //             } else {
    //                 charl = charx;
    //                 charr = charx + 2;
    //                 textx = text + " ";
    //             }
    //         } else {
    //             if (textn[charx] == 1) {
    //                 charl = charx - 1;
    //                 charr = charx + 1
    //                 textx = " " + text;
    //             } else {
    //                 charl = charx - 1;
    //                 charr = charx + 1
    //                 textx = " " + text + " ";
    //             }
    //         }
    //         // replace
    //         const posl = new vscode.Position(this.row, charl);
    //         const posr = new vscode.Position(this.row, charr);
    //         const range = new vscode.Range(posl, posr);
    //         builder.replace(range, textx);
    //         editor.selection = new vscode.Selection(curpos, curpos);
    //     });
    // }
}
class BoxdrawExtension {

    // TODO context 
    // TODO keymap

    // constant
    public appname: string;
    public appid: string;
    public applabel: string;
    public boxchars: { char: string, val: number }[];

    // context
    public mode: boolean;
    public bold: boolean;

    // vscode
    public channel: vscode.OutputChannel;
    public statusbaritem: vscode.StatusBarItem;

    // setup function
    constructor() {

        // init constant
        this.appname = "boxdraw";
        this.appid = "boxdraw-extension";
        this.applabel = "BOXDRAW";
        // the basic idea is inspired by xyzzy boxdraw.l
        //    4        64
        //    |        |
        // 1 -+- 2  16-+-32
        //    |        |
        //    8        128
        this.boxchars = [
            { char: "─", val: 0b00000011 },
            { char: "│", val: 0b00001100 },
            { char: "┌", val: 0b00001010 },
            { char: "┐", val: 0b00001001 },
            { char: "┘", val: 0b00000101 },
            { char: "└", val: 0b00000110 },
            { char: "├", val: 0b00001110 },
            { char: "┬", val: 0b00001011 },
            { char: "┤", val: 0b00001101 },
            { char: "┴", val: 0b00000111 },
            { char: "┼", val: 0b00001111 },
            { char: "━", val: 0b00110000 },
            { char: "┃", val: 0b11000000 },
            { char: "┏", val: 0b10100000 },
            { char: "┓", val: 0b10010000 },
            { char: "┛", val: 0b01010000 },
            { char: "┗", val: 0b01100000 },
            { char: "┣", val: 0b11100000 },
            { char: "┳", val: 0b10110000 },
            { char: "┫", val: 0b11010000 },
            { char: "┻", val: 0b01110000 },
            { char: "╋", val: 0b11110000 },
            { char: "┠", val: 0b11000010 },
            { char: "┯", val: 0b00111000 },
            { char: "┨", val: 0b11000001 },
            { char: "┷", val: 0b00110100 },
            { char: "┿", val: 0b00111100 },
            { char: "┝", val: 0b00101100 },
            { char: "┰", val: 0b10000011 },
            { char: "┥", val: 0b00011100 },
            { char: "┸", val: 0b01000011 },
            { char: "╂", val: 0b11000011 },
            { char: "─", val: 0b00000001 },
            { char: "─", val: 0b00000010 },
            { char: "│", val: 0b00000100 },
            { char: "│", val: 0b00001000 },
            { char: "━", val: 0b00010000 },
            { char: "━", val: 0b00100000 },
            { char: "┃", val: 0b01000000 },
            { char: "┃", val: 0b10000000 },
            { char: "→", val: 0b00000011 },
            { char: "←", val: 0b00000011 },
            { char: "↑", val: 0b00001100 },
            { char: "↓", val: 0b00001100 },
        ];
    }

    public activate(context: vscode.ExtensionContext) {

        // init context
        this.channel = vscode.window.createOutputChannel(this.appname);
        this.channel.show(true);
        this.channel.appendLine(`[${this.timestamp()}] ${this.appname}`);

        // init context
        this.mode = false;
        this.bold = false;

        // init vscode

        // command
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.toggleMode`, () => { boxdrawextension.toggleMode(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.toggleBold`, () => { boxdrawextension.toggleBold(); }));

        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorUp`, () => { boxdrawextension.cursorUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.cursorDown`, () => { boxdrawextension.cursorDown(); }));

        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeft`, () => { boxdrawextension.drawLeft(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRight`, () => { boxdrawextension.drawRight(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUp`, () => { boxdrawextension.drawUp(); }));
        context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDown`, () => { boxdrawextension.drawDown(); }));

        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawLeftArrow`, () => { boxdrawextension.drawLeftArrow(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawRightArrow`, () => { boxdrawextension.drawRightArrow(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawUpArrow`, () => { boxdrawextension.drawUpArrow(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.drawDownArrow`, () => { boxdrawextension.drawDownArrow(); }));

        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearLeft`, () => { boxdrawextension.clearLeft(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearRight`, () => { boxdrawextension.clearRight(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearUp`, () => { boxdrawextension.clearUp(); }));
        // context.subscriptions.push(vscode.commands.registerCommand(`${this.appid}.clearDown`, () => { boxdrawextension.clearDown(); }));

        // statusbar
        this.statusbaritem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusbaritem.command = `${this.appid}.toggleMode`;
        this.statusbaritem.show();
        context.subscriptions.push(this.statusbaritem);

        // setcontext
        this.setMode(false, true);
        this.setBold(false, true);
    }

    // public interface
    public toggleMode() { this.setMode(!this.mode); }
    public toggleBold() { this.setBold(!this.bold); }

    public cursorUp() {
        CPosition.getActive().backwardLine(true);
    }
    public cursorDown() {
        CPosition.getActive().forwardLine(true);
    }

    public drawLeft() { this.drawBox(0b00000001, "left", false, false); }
    public drawRight() { this.drawBox(0b00000010, "right", false, false); }
    public drawUp() { this.drawBox(0b00000100, "up", false, false); }
    public drawDown() { this.drawBox(0b00001000, "down", false, false); }

    // public drawLeftArrow() { this.drawBox(0b00000001, "left", true, false); }
    // public drawRightArrow() { this.drawBox(0b00000010, "right", true, false); }
    // public drawUpArrow() { this.drawBox(0b00000100, "up", true, false); }
    // public drawDownArrow() { this.drawBox(0b00001000, "down", true, false); }

    // public clearLeft() { this.drawBox(0b00000001, "left", false, true); }
    // public clearRight() { this.drawBox(0b00000010, "right", false, true); }
    // public clearUp() { this.drawBox(0b00000100, "up", false, true); }
    // public clearDown() { this.drawBox(0b00001000, "down", false, true); }

    // inner interface
    protected drawBox(pattern: number, direction: string, isarrow: boolean, isclear: boolean) {
        this.channel.appendLine(`[${this.timestamp()}] pattern=${pattern}, direction=${direction}, isarrow=${isarrow}, isclear=${isclear}`);
        // check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        // check text
        const curpos = CPosition.getActive();
        const prevpos = new CPosition(curpos.line - 1, curpos.column);
        const nextpos = new CPosition(curpos.line + 1, curpos.column);
        curpos.getPosition();
        prevpos.getPosition();
        nextpos.getPosition();
        this.channel.appendLine(
            "--------\n" +
            "[" + prevpos.ptxt + "][" + prevpos.ctxt + "][" + prevpos.ntxt + "]\n" +
            "[" + curpos.ptxt + "][" + curpos.ctxt + "][" + curpos.ntxt + "]\n" +
            "[" + nextpos.ptxt + "][" + nextpos.ctxt + "][" + nextpos.ntxt + "]\n");
        this.channel.appendLine("'" + curpos.rbgntxt + "'" + curpos.rendtxt + " " + curpos.rbgnchr + "," + curpos.rendchr)

        editor.edit(builder => {
            const posbgn = new vscode.Position(curpos.line, curpos.rbgnchr);
            const posend = new vscode.Position(curpos.line, curpos.rendchr);
            const range = new vscode.Range(posbgn, posend);
            builder.replace(range, curpos.rbgntxt + "■" + curpos.rendtxt);
            editor.selection = new vscode.Selection(posbgn, posbgn);
        });

        // // edit
        // Location.from(document, curpos).write("＋").then(() => {
        //     switch (direction) {
        //         case "left": vscode.commands.executeCommand("cursorLeft"); break;
        //         case "right": vscode.commands.executeCommand("cursorRight"); break;
        //         case "up": vscode.commands.executeCommand("cursorUp"); break;
        //         case "down": vscode.commands.executeCommand("cursorDown"); break;
        //     }
        // });
    }

    // ops vscoide
    protected setMode(mode: boolean, force = false) {
        if (this.mode != mode || force) {
            this.mode = mode;
            vscode.commands.executeCommand('setContext', `${this.appname}Mode`, this.mode);
            this.channel.appendLine(`[${this.timestamp()}] mode=${this.mode}`);
            this.updateStatusbar();
        }
    }
    protected setBold(bold: boolean, force = false) {
        if (this.bold != bold || force) {
            this.bold = bold;
            vscode.commands.executeCommand('setContext', `${this.appname}Bold`, this.bold);
            this.channel.appendLine(`[${this.timestamp()}] bold=${this.bold}`);
            this.updateStatusbar();
        }
    }
    protected updateStatusbar() {
        let msg = "";
        msg += this.mode ? "$(edit)" : "$(stop-circle)"
        msg += this.applabel;
        msg += this.bold ? "(bold)" : "";
        this.statusbaritem.text = msg;
    }

    // utility
    protected timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();
