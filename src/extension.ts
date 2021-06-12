import * as vscode from 'vscode';
import { boxdrawextension } from './BoxdrawExtension';

// extension entrypoint
export function activate(context: vscode.ExtensionContext) {
    (function () {
        console.log(`${boxdrawextension.appid}.${boxdrawextension.toggleBoxdrawModeId}`);
        context.subscriptions.push(vscode.commands.registerCommand(`${boxdrawextension.appid}.${boxdrawextension.toggleBoxdrawModeId}`, () => {
            boxdrawextension.toggleBoxdrawMode().catch((ex) => {
                boxdrawextension.channel.appendLine("**** " + ex + " ****");
            });
        }));
    })();
}
export function deactivate() { }
