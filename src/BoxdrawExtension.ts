import * as vscode from 'vscode';
var eaw = require('eastasianwidth');

// extension core
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

    public drawLeft() { this.drawBox(0b00000001, false, false); }
    public drawRight() { this.drawBox(0b00000010, false, false); }
    public drawUp() { this.drawBox(0b00000100, false, false); }
    public drawDown() { this.drawBox(0b00001000, false, false); }

    public drawLeftArrow() { this.drawBox(0b00000001, true, false); }
    public drawRightArrow() { this.drawBox(0b00000010, true, false); }
    public drawUpArrow() { this.drawBox(0b00000100, true, false); }
    public drawDownArrow() { this.drawBox(0b00001000, true, false); }

    public clearLeft() { this.drawBox(0b00000001, false, true); }
    public clearRight() { this.drawBox(0b00000010, false, true); }
    public clearUp() { this.drawBox(0b00000100, false, true); }
    public clearDown() { this.drawBox(0b00001000, false, true); }

    // inner interface
    protected drawBox(direction: number, isarrow: boolean, isclear: boolean) {
        this.channel.appendLine(`[${this.timestamp()}] direction=${direction}, isarrow=${isarrow}, isclear=${isclear}`);
        // check editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        // check text
        const document = editor.document;
        const selection = editor.selection;
        const curpos = selection.active;
        // edit
        editor.edit((builder: vscode.TextEditorEdit) => {
            //    builder.insert(curpos, "abc");
            // WIP 処理
            var startpos = new vscode.Position(curpos.line, 0);
            var endpos = new vscode.Position(curpos.line, curpos.character);
            var range = new vscode.Range(startpos, endpos);
            var text = document.getText(range);
            text = text + ":" + eaw.length(text);
            this.channel.appendLine(text);
            // 
        });
    }

    // oops box

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
