import * as vscode from 'vscode';
var eaw = require('eastasianwidth');

// TODO vscodeのフォント設定に大きく依存、monospace推奨
// TODO 罫線はvscodeだと半角扱いの模様、貢献する機会あり、eawとして全角扱いにした方がよい
// TODO 罫線はやめて全角扱いされている＋－｜でやった方がよいかも
// TODO 罫線でくっつけたかったらlineheight14推奨

// extension core
class Location {
    public line: number;
    public column: number;
    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
    }
    public static from(document: vscode.TextDocument, current: vscode.Position): Location {
        let bol = new vscode.Position(current.line, 0);
        let range = new vscode.Range(bol, current);
        let text = document.getText(range);
        let newloc = new Location(current.line, eaw.length(text));
        return newloc;
    }
    public write(text: string) {
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        return editor.edit((builder: vscode.TextEditorEdit) => {
            // param
            let columnx: number;
            let charx: number;
            let textx: string;
            let charl: number, charr: number;
            let curpos = new vscode.Position(editor.selection.active.line, editor.selection.active.character);
            // complete line
            if (document.lineCount < this.line) {
                var lastline = document.lineAt(document.lineCount - 1);
                builder.insert(lastline.range.end, "\n".repeat(document.lineCount - this.line + 1));
            }
            // complete whole line
            let linetext = document.lineAt(this.line).text;
            let columnl = eaw.length(linetext);
            if (columnl < this.column + 2) {
                linetext += "*".repeat(this.column - columnl + 2);
            }
            // calc charx, columnx
            let textn = linetext.split("").map(x => eaw.length(x));
            for (columnx = 0, charx = 0; charx < textn.length + 2; charx++) {
                if (this.column <= columnx) break;
                columnx += textn[charx];
            }
            // calc charl, charr, textx
            if (this.column == columnx) {
                if (textn[charx] == 2) {
                    charl = charx;
                    charr = charx + 1;
                    textx = text;
                } else if (textn[charx + 1] == 1) {
                    charl = charx;
                    charr = charx + 2;
                    textx = text;
                } else {
                    charl = charx;
                    charr = charx + 2;
                    textx = text + " ";
                }
            } else {
                if (textn[charx] == 1) {
                    charl = charx - 1;
                    charr = charx + 1
                    textx = " " + text;
                } else {
                    charl = charx - 1;
                    charr = charx + 1
                    textx = " " + text + " ";
                }
            }
            // replace
            const posl = new vscode.Position(this.line, charl);
            const posr = new vscode.Position(this.line, charr);
            const range = new vscode.Range(posl, posr);
            builder.replace(range, textx);
            editor.selection = new vscode.Selection(curpos, curpos);
        });
    }
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

    public drawLeft() { this.drawBox(0b00000001, "left", false, false); }
    public drawRight() { this.drawBox(0b00000010, "right", false, false); }
    public drawUp() { this.drawBox(0b00000100, "up", false, false); }
    public drawDown() { this.drawBox(0b00001000, "down", false, false); }

    public drawLeftArrow() { this.drawBox(0b00000001, "left", true, false); }
    public drawRightArrow() { this.drawBox(0b00000010, "right", true, false); }
    public drawUpArrow() { this.drawBox(0b00000100, "up", true, false); }
    public drawDownArrow() { this.drawBox(0b00001000, "down", true, false); }

    public clearLeft() { this.drawBox(0b00000001, "left", false, true); }
    public clearRight() { this.drawBox(0b00000010, "right", false, true); }
    public clearUp() { this.drawBox(0b00000100, "up", false, true); }
    public clearDown() { this.drawBox(0b00001000, "down", false, true); }

    // inner interface
    protected drawBox(pattern: number, direction: string, isarrow: boolean, isclear: boolean) {
        this.channel.appendLine(`[${this.timestamp()}] pattern=${pattern}, direction=${direction}, isarrow=${isarrow}, isclear=${isclear}`);
        // check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        // check text
        const document = editor.document;
        const selection = editor.selection;
        const curpos = selection.active;
        // edit
        Location.from(document, curpos).write("＋").then(() => {
            switch (direction) {
                case "left": vscode.commands.executeCommand("cursorLeft"); break;
                case "right": vscode.commands.executeCommand("cursorRight"); break;
                case "up": vscode.commands.executeCommand("cursorUp"); break;
                case "down": vscode.commands.executeCommand("cursorDown"); break;
            }
        });
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
