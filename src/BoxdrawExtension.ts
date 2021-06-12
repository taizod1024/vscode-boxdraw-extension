import * as vscode from 'vscode';

// extension core
class BoxdrawExtension {

    // constant
    public appname: string;
    public appid: string;

    // context
    public channel: vscode.OutputChannel;
    public boxdrawmode: boolean;

    // setup function
    constructor() {

        // init constant
        this.appname = "boxdraw";
        this.appid = "boxdraw-extension";

        // init context
        this.channel = vscode.window.createOutputChannel(this.appname);
        this.channel.show(true);
        this.channel.appendLine(`[${this.timestamp()}] ${this.appname}`);
        this.boxdrawmode = false;
    }

    // public interface
    public toggleBoxdrawModeId = "toggleBoxdrawMode";
    public async toggleBoxdrawMode() {
        this.boxdrawmode = !this.boxdrawmode;
        this.channel.appendLine(`[${this.timestamp()}] boxdraw-mode: ${this.boxdrawmode} `);
    }

    // utility
    protected timestamp(): string {
        return new Date().toLocaleString("ja-JP").split(" ")[1];
    }
};
export const boxdrawextension = new BoxdrawExtension();
