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
    public boxdrawmode: "off" | "normal" | "thick";

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
        this.boxdrawmode = "off";

        // init vscode
        let commandid;
        // command
        commandid = `${this.appid}.changeBoxdrawMode`;
        context.subscriptions.push(vscode.commands.registerCommand(commandid, () => {
            boxdrawextension.changeBoxdrawMode().catch((ex) => {
                boxdrawextension.channel.appendLine("**** " + ex + " ****");
            });
        }));
        // statusbar
        this.statusbaritem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusbaritem.command = commandid;
        this.statusbaritem.text = `${this.applabel}: ${this.boxdrawmode}`;
        this.statusbaritem.show();
        context.subscriptions.push(this.statusbaritem);
        // setcontext
        vscode.commands.executeCommand('setContext', this.appname, this.boxdrawmode);
    }

    // public interface
    public async changeBoxdrawMode() {
        switch (this.boxdrawmode) {
            case "off": this.boxdrawmode = "normal"; break;
            case "normal": this.boxdrawmode = "thick"; break;
            case "thick": this.boxdrawmode = "off"; break;
        }
        this.channel.appendLine(`[${this.timestamp()}] boxdraw-mode: ${this.boxdrawmode} `);
        vscode.commands.executeCommand('setContext', this.appname, this.boxdrawmode);
        this.statusbaritem.text = `${this.applabel}: ${this.boxdrawmode}`;
    }

    // utility
    protected timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();
