import * as vscode from 'vscode';

// extension core
class BoxdrawExtension {

    // TODO context 
    // TODO keymap

    // constant
    public appname: string;
    public appid: string;
    public applabel: string;

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
    public toggleMode() {
        this.setMode(!this.mode);
    }
    public toggleBold() {
        this.setBold(!this.bold);
    }
    public drawLeft() {
        this.channel.appendLine(`[${this.timestamp()}] drawLeft`);
    }
    public drawRight() {
        this.channel.appendLine(`[${this.timestamp()}] drawRight`);
    }
    public drawUp() {
        this.channel.appendLine(`[${this.timestamp()}] drawUp`);
    }
    public drawDown() {
        this.channel.appendLine(`[${this.timestamp()}] drawDown`);
    }
    public drawLeftArrow() {
        this.channel.appendLine(`[${this.timestamp()}] drawLeftArrow`);
    }
    public drawRightArrow() {
        this.channel.appendLine(`[${this.timestamp()}] drawRightArrow`);
    }
    public drawUpArrow() {
        this.channel.appendLine(`[${this.timestamp()}] drawUpArrow`);
    }
    public drawDownArrow() {
        this.channel.appendLine(`[${this.timestamp()}] drawDownArrow`);
    }
    public clearLeft() {
        this.channel.appendLine(`[${this.timestamp()}] clearLeft`);
    }
    public clearRight() {
        this.channel.appendLine(`[${this.timestamp()}] clearRight`);
    }
    public clearUp() {
        this.channel.appendLine(`[${this.timestamp()}] clearUp`);
    }
    public clearDown() {
        this.channel.appendLine(`[${this.timestamp()}] clearDown`);
    }

    // model
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
        let msg = this.applabel;
        if (this.bold) msg += "(bold)";
        if (this.mode) msg += "$(edit)";
        this.statusbaritem.text = msg;
    }

    // utility
    protected timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();
